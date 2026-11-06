// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com>

import {
  CRITICAL_WARNING_DAYS,
  DEFAULT_WARNING_DAYS,
  EXTENDED_WARNING_DAYS,
} from "./constants.ts";
import type {
  DeadlineItem,
  LifeDashboardSummary,
  LifeDocument,
  LifeProcedure,
  LifeVault,
  UrgencyLevel,
  Warranty,
} from "./types.ts";

export function getTodayIso(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

export function calculateDaysRemaining(targetDate: string, referenceDate: string = getTodayIso()): number {
  const [tY, tM, tD] = targetDate.split("-").map(Number);
  const [rY, rM, rD] = referenceDate.split("-").map(Number);

  const tUtc = Date.UTC(tY!, tM! - 1, tD!);
  const rUtc = Date.UTC(rY!, rM! - 1, rD!);

  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((tUtc - rUtc) / msPerDay);
}

export function classifyUrgency(daysRemaining: number, warningThreshold: number = DEFAULT_WARNING_DAYS): UrgencyLevel {
  if (daysRemaining < 0) return "overdue";
  if (daysRemaining <= CRITICAL_WARNING_DAYS) return "urgent";
  if (daysRemaining <= warningThreshold) return "soon";
  if (daysRemaining <= EXTENDED_WARNING_DAYS) return "upcoming";
  return "future";
}

export function getDocumentDeadlines(docs: LifeDocument[], referenceDate: string = getTodayIso()): DeadlineItem[] {
  return docs
    .filter((d) => !d.archived)
    .map((d) => {
      const days = calculateDaysRemaining(d.expiryDate, referenceDate);
      const threshold = d.warningDays ?? DEFAULT_WARNING_DAYS;
      const urgency = classifyUrgency(days, threshold);
      const status = days < 0 ? "expired" : days <= threshold ? "expiring_soon" : "active";
      return {
        id: d.id,
        entityType: "document" as const,
        title: d.title,
        category: d.category,
        date: d.expiryDate,
        daysRemaining: days,
        urgency,
        status,
        notes: d.notes,
      };
    });
}

export function getWarrantyDeadlines(warranties: Warranty[], referenceDate: string = getTodayIso()): DeadlineItem[] {
  return warranties.map((w) => {
    const days = calculateDaysRemaining(w.expiryDate, referenceDate);
    const urgency = classifyUrgency(days, DEFAULT_WARNING_DAYS);
    const status = days < 0 ? "expired" : days <= DEFAULT_WARNING_DAYS ? "expiring_soon" : "active";
    return {
      id: w.id,
      entityType: "warranty" as const,
      title: `${w.item}${w.brand ? ` (${w.brand})` : ""}`,
      category: "warranty" as const,
      date: w.expiryDate,
      daysRemaining: days,
      urgency,
      status,
      notes: w.proofOfPurchase ? `Proof: ${w.proofOfPurchase}` : w.notes,
    };
  });
}

export function getProcedureDeadlines(procedures: LifeProcedure[], referenceDate: string = getTodayIso()): DeadlineItem[] {
  const items: DeadlineItem[] = [];

  for (const proc of procedures) {
    if (proc.status === "completed" || proc.status === "abandoned") continue;

    if (proc.targetDeadline) {
      const days = calculateDaysRemaining(proc.targetDeadline, referenceDate);
      items.push({
        id: proc.id,
        entityType: "procedure" as const,
        title: proc.title,
        category: proc.category,
        date: proc.targetDeadline,
        daysRemaining: days,
        urgency: classifyUrgency(days, DEFAULT_WARNING_DAYS),
        status: proc.status,
        notes: proc.notes,
      });
    }

    for (const step of proc.steps) {
      if (step.completed || !step.dueDate) continue;
      const days = calculateDaysRemaining(step.dueDate, referenceDate);
      items.push({
        id: `${proc.id}:${step.id}`,
        entityType: "procedure_step" as const,
        title: step.title,
        category: proc.category,
        date: step.dueDate,
        daysRemaining: days,
        urgency: classifyUrgency(days, CRITICAL_WARNING_DAYS),
        status: "step_due",
        parentTitle: proc.title,
        notes: step.notes,
      });
    }
  }

  return items;
}

export function generateDashboardSummary(vault: LifeVault, referenceDate: string = getTodayIso()): LifeDashboardSummary {
  const docDeadlines = getDocumentDeadlines(vault.documents, referenceDate);
  const warDeadlines = getWarrantyDeadlines(vault.warranties, referenceDate);
  const procDeadlines = getProcedureDeadlines(vault.procedures, referenceDate);

  const allDeadlines = [...docDeadlines, ...warDeadlines, ...procDeadlines].sort(
    (a, b) => a.daysRemaining - b.daysRemaining
  );

  const activeDocuments = docDeadlines.filter((d) => d.status === "active").length;
  const expiringDocumentsCount = docDeadlines.filter((d) => d.status === "expiring_soon").length;
  const expiredDocumentsCount = docDeadlines.filter((d) => d.status === "expired").length;

  const activeWarrantiesCount = warDeadlines.filter((w) => w.status === "active").length;
  const expiredWarrantiesCount = warDeadlines.filter((w) => w.status === "expired").length;

  const inProgressProceduresCount = vault.procedures.filter(
    (p) => p.status === "in_progress" || p.status === "pending"
  ).length;
  const completedProceduresCount = vault.procedures.filter((p) => p.status === "completed").length;

  const urgentCount = allDeadlines.filter((d) => d.urgency === "urgent").length;
  const soonCount = allDeadlines.filter((d) => d.urgency === "soon").length;
  const overdueCount = allDeadlines.filter((d) => d.urgency === "overdue").length;

  return {
    today: referenceDate,
    totalDocuments: vault.documents.length,
    activeDocuments,
    expiringDocumentsCount,
    expiredDocumentsCount,
    totalWarranties: vault.warranties.length,
    activeWarrantiesCount,
    expiredWarrantiesCount,
    totalProcedures: vault.procedures.length,
    inProgressProceduresCount,
    completedProceduresCount,
    urgentCount,
    soonCount,
    overdueCount,
    deadlines: allDeadlines,
  };
}
