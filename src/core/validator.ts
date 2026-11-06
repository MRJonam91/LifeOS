// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com>

import {
  LIFEOS_INTEGRITY_VIOLATION,
  SUPPORTED_DOCUMENT_CATEGORIES,
} from "./constants.ts";
import type {
  DocumentCategory,
  LifeDocument,
  LifeProcedure,
  LifeVault,
  ProcedureStep,
  Warranty,
} from "./types.ts";

const DATE_REGEX = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;

export function isValidDateString(dateStr: unknown): boolean {
  if (typeof dateStr !== "string" || !DATE_REGEX.test(dateStr)) {
    return false;
  }
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function isSupportedCategory(category: unknown): category is DocumentCategory {
  return (
    typeof category === "string" &&
    (SUPPORTED_DOCUMENT_CATEGORIES as readonly string[]).includes(category)
  );
}

export function validateDocument(doc: Partial<LifeDocument>): string[] {
  const errors: string[] = [];
  if (!doc.id || typeof doc.id !== "string" || doc.id.trim() === "") {
    errors.push("Document requires a valid non-empty id");
  }
  if (!doc.title || typeof doc.title !== "string" || doc.title.trim() === "") {
    errors.push("Document requires a non-empty title");
  }
  if (!isSupportedCategory(doc.category)) {
    errors.push(`Invalid document category: ${String(doc.category)}`);
  }
  if (!doc.expiryDate || !isValidDateString(doc.expiryDate)) {
    errors.push(`Document requires a valid expiryDate in YYYY-MM-DD format (got: ${String(doc.expiryDate)})`);
  }
  if (doc.issueDate !== undefined && !isValidDateString(doc.issueDate)) {
    errors.push(`Invalid issueDate in YYYY-MM-DD format: ${String(doc.issueDate)}`);
  }
  if (
    doc.issueDate &&
    doc.expiryDate &&
    isValidDateString(doc.issueDate) &&
    isValidDateString(doc.expiryDate)
  ) {
    if (doc.issueDate > doc.expiryDate) {
      errors.push(
        `${LIFEOS_INTEGRITY_VIOLATION}: issueDate (${doc.issueDate}) cannot exceed expiryDate (${doc.expiryDate})`
      );
    }
  }
  if (doc.warningDays !== undefined && (typeof doc.warningDays !== "number" || doc.warningDays < 0)) {
    errors.push("warningDays must be a non-negative number");
  }
  return errors;
}

export function validateWarranty(warranty: Partial<Warranty>): string[] {
  const errors: string[] = [];
  if (!warranty.id || typeof warranty.id !== "string" || warranty.id.trim() === "") {
    errors.push("Warranty requires a valid non-empty id");
  }
  if (!warranty.item || typeof warranty.item !== "string" || warranty.item.trim() === "") {
    errors.push("Warranty requires a non-empty item name");
  }
  if (!warranty.purchaseDate || !isValidDateString(warranty.purchaseDate)) {
    errors.push(`Warranty requires a valid purchaseDate in YYYY-MM-DD format: ${String(warranty.purchaseDate)}`);
  }
  if (warranty.expiryDate && !isValidDateString(warranty.expiryDate)) {
    errors.push(`Invalid warranty expiryDate format: ${String(warranty.expiryDate)}`);
  }
  if (typeof warranty.durationMonths !== "number" || warranty.durationMonths <= 0) {
    errors.push("Warranty durationMonths must be a positive number");
  }
  if (warranty.price !== undefined && (typeof warranty.price !== "number" || warranty.price < 0)) {
    errors.push("Warranty price must be non-negative");
  }
  return errors;
}

export function validateStep(step: Partial<ProcedureStep>, index: number): string[] {
  const errors: string[] = [];
  if (!step.id || typeof step.id !== "string") {
    errors.push(`Step at index ${index} requires a non-empty id`);
  }
  if (!step.title || typeof step.title !== "string") {
    errors.push(`Step at index ${index} requires a title`);
  }
  if (typeof step.completed !== "boolean") {
    errors.push(`Step at index ${index} requires a boolean completed flag`);
  }
  if (step.dueDate !== undefined && !isValidDateString(step.dueDate)) {
    errors.push(`Step at index ${index} has invalid dueDate format: ${String(step.dueDate)}`);
  }
  return errors;
}

export function validateProcedure(proc: Partial<LifeProcedure>): string[] {
  const errors: string[] = [];
  if (!proc.id || typeof proc.id !== "string" || proc.id.trim() === "") {
    errors.push("Procedure requires a valid non-empty id");
  }
  if (!proc.title || typeof proc.title !== "string" || proc.title.trim() === "") {
    errors.push("Procedure requires a non-empty title");
  }
  if (!isSupportedCategory(proc.category)) {
    errors.push(`Invalid procedure category: ${String(proc.category)}`);
  }
  if (proc.targetDeadline !== undefined && !isValidDateString(proc.targetDeadline)) {
    errors.push(`Invalid procedure targetDeadline: ${String(proc.targetDeadline)}`);
  }
  if (!Array.isArray(proc.steps)) {
    errors.push("Procedure requires a steps array");
  } else {
    const stepIds = new Set<string>();
    proc.steps.forEach((step, idx) => {
      errors.push(...validateStep(step, idx));
      if (step.id) {
        if (stepIds.has(step.id)) {
          errors.push(`${LIFEOS_INTEGRITY_VIOLATION}: duplicate step id ${step.id}`);
        }
        stepIds.add(step.id);
      }
    });
  }
  return errors;
}

export function validateVault(vault: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!vault || typeof vault !== "object") {
    return { valid: false, errors: ["Vault must be a non-null object"] };
  }
  const candidate = vault as Partial<LifeVault>;
  if (!candidate.version || typeof candidate.version !== "string") {
    errors.push("Vault requires version string");
  }
  if (!Array.isArray(candidate.documents)) {
    errors.push("Vault requires documents array");
  } else {
    const docIds = new Set<string>();
    candidate.documents.forEach((d) => {
      errors.push(...validateDocument(d));
      if (d.id) {
        if (docIds.has(d.id)) errors.push(`Duplicate document id: ${d.id}`);
        docIds.add(d.id);
      }
    });
  }

  if (!Array.isArray(candidate.warranties)) {
    errors.push("Vault requires warranties array");
  } else {
    const warIds = new Set<string>();
    candidate.warranties.forEach((w) => {
      errors.push(...validateWarranty(w));
      if (w.id) {
        if (warIds.has(w.id)) errors.push(`Duplicate warranty id: ${w.id}`);
        warIds.add(w.id);
      }
    });
  }

  if (!Array.isArray(candidate.procedures)) {
    errors.push("Vault requires procedures array");
  } else {
    const procIds = new Set<string>();
    candidate.procedures.forEach((p) => {
      errors.push(...validateProcedure(p));
      if (p.id) {
        if (procIds.has(p.id)) errors.push(`Duplicate procedure id: ${p.id}`);
        procIds.add(p.id);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}
