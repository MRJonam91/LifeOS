#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com>

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import {
  diffVaults,
  exportDocumentsToCsv,
  exportVaultToCsv,
  exportVaultToHtml,
  exportVaultToIcal,
  exportVaultToJson,
  exportVaultToMarkdown,
  formatVaultDiff,
  importVaultFromJson,
} from "../adapters/index.ts";
import { performVaultAudit } from "../core/audit.ts";
import {
  LIFEOS_VERSION,
  SPONSOR_MESSAGE,
} from "../core/constants.ts";
import {
  calculateDaysRemaining,
  generateDashboardSummary,
  getTodayIso,
} from "../core/deadlines.ts";
import { createPilotVault } from "../core/fixtures.ts";
import { completeStep, computeProcedureProgress, createProcedure } from "../core/procedures.ts";
import type { DocumentCategory, LifeDocument, LifeVault } from "../core/types.ts";
import { isSupportedCategory, validateDocument } from "../core/validator.ts";
import {
  addDocument,
  addProcedure,
  addWarranty,
  archiveDocument,
  removeDocument,
  removeProcedure,
  removeWarranty,
  restoreDocument,
  searchVault,
  updateDocument,
} from "../core/vault.ts";
import { createWarranty } from "../core/warranties.ts";

const DEFAULT_VAULT_DIR = join(homedir(), ".lifeos");
const DEFAULT_VAULT_PATH = join(DEFAULT_VAULT_DIR, "vault.json");

function maybeShowSponsor(): void {
  if (process.env["NO_SPONSOR"] === "1") return;
  if (!process.stdout.isTTY && !process.env["SPONSOR"]) return;
  const show = process.env["SPONSOR"] === "1" || Math.random() < 0.1;
  if (show) {
    console.log(`\n\x1b[90m${SPONSOR_MESSAGE}\x1b[0m`);
  }
}

function getVaultPath(argv: Record<string, string>): string {
  return argv["vault"] ?? process.env["LIFEOS_VAULT"] ?? DEFAULT_VAULT_PATH;
}

function loadOrCreateVault(vaultPath: string): LifeVault {
  if (existsSync(vaultPath)) {
    try {
      const raw = readFileSync(vaultPath, "utf8");
      return importVaultFromJson(raw);
    } catch (e) {
      console.error(`\x1b[31mError loading vault from ${vaultPath}: ${e instanceof Error ? e.message : String(e)}\x1b[0m`);
      process.exit(1);
    }
  }

  const initialVault = createPilotVault();
  try {
    const dir = join(vaultPath, "..");
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(vaultPath, exportVaultToJson(initialVault), "utf8");
  } catch {
    // If cannot write to home, return in-memory pilot
  }
  return initialVault;
}

function saveVault(vaultPath: string, vault: LifeVault): void {
  const dir = join(vaultPath, "..");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(vaultPath, exportVaultToJson(vault), "utf8");
}

function parseCliArgs(args: string[]): { command: string; subCommand?: string; flags: Record<string, string>; rest: string[] } {
  const flags: Record<string, string> = {};
  const positional: string[] = [];

  for (const arg of args) {
    if (arg.startsWith("--")) {
      const eq = arg.indexOf("=");
      if (eq !== -1) {
        const k = arg.slice(2, eq);
        flags[k] = arg.slice(eq + 1);
      } else {
        flags[arg.slice(2)] = "true";
      }
    } else {
      positional.push(arg);
    }
  }

  return {
    command: positional[0] ?? "dashboard",
    subCommand: positional[1],
    flags,
    rest: positional.slice(2),
  };
}

function renderDashboard(vault: LifeVault, refDate: string): void {
  const summary = generateDashboardSummary(vault, refDate);

  console.log(`\n\x1b[1;36m=== LifeOS Personal Dashboard v${LIFEOS_VERSION} ===\x1b[0m`);
  console.log(`\x1b[90mOwner: ${vault.metadata.owner ?? "Local User"} | Reference Date: ${refDate}\x1b[0m\n`);

  console.log(
    `  \x1b[1mActive Docs:\x1b[0m \x1b[32m${summary.activeDocuments}/${summary.totalDocuments}\x1b[0m  |  ` +
      `\x1b[1mUrgent (≤7d):\x1b[0m \x1b[${summary.urgentCount > 0 ? "1;31m" : "32m"}${summary.urgentCount}\x1b[0m  |  ` +
      `\x1b[1mExpiring Soon (≤30d):\x1b[0m \x1b[${summary.soonCount > 0 ? "1;33m" : "32m"}${summary.soonCount}\x1b[0m  |  ` +
      `\x1b[1mWarranties:\x1b[0m \x1b[36m${summary.activeWarrantiesCount}/${summary.totalWarranties}\x1b[0m  |  ` +
      `\x1b[1mProcedures Active:\x1b[0m \x1b[35m${summary.inProgressProceduresCount}\x1b[0m`
  );

  console.log("\n\x1b[1;33m--- Priority Timeline & Upcoming Deadlines ---\x1b[0m");
  if (summary.deadlines.length === 0) {
    console.log("  No deadlines registered in vault.");
  } else {
    for (const d of summary.deadlines.slice(0, 8)) {
      let color = "\x1b[32m";
      if (d.urgency === "overdue") color = "\x1b[1;31m";
      else if (d.urgency === "urgent") color = "\x1b[31m";
      else if (d.urgency === "soon") color = "\x1b[33m";

      const daysLabel =
        d.daysRemaining < 0
          ? `${Math.abs(d.daysRemaining)}d ago`
          : d.daysRemaining === 0
          ? "TODAY"
          : `in ${d.daysRemaining}d`;

      const typeTag = `[${d.entityType.toUpperCase().slice(0, 4)}]`;
      console.log(
        `  ${color}${typeTag.padEnd(7)}\x1b[0m ${d.date} (${daysLabel.padEnd(8)})  ${d.title} \x1b[90m(${d.category})\x1b[0m`
      );
    }
  }

  console.log("\n\x1b[1;34m--- Active Administrative Procedures (Pratiche) ---\x1b[0m");
  if (vault.procedures.length === 0) {
    console.log("  No active procedures.");
  } else {
    for (const p of vault.procedures) {
      const progress = computeProcedureProgress(p);
      const barLength = 15;
      const filled = Math.round((progress.percentage / 100) * barLength);
      const bar = "█".repeat(filled) + "░".repeat(barLength - filled);

      console.log(
        `  \x1b[1m${p.title}\x1b[0m [${bar}] ${progress.percentage}% (${progress.completed}/${progress.total} steps)`
      );
      for (const step of p.steps) {
        const mark = step.completed ? "\x1b[32m✓\x1b[0m" : "\x1b[90m○\x1b[0m";
        const due = step.dueDate ? ` \x1b[90m(due ${step.dueDate})\x1b[0m` : "";
        console.log(`    ${mark} ${step.title}${due}`);
      }
    }
  }

  console.log("\n\x1b[90mQuick commands: lifeos doc list | lifeos audit | lifeos search <term> | lifeos export --format=ics\x1b[0m");
}

function handleSearchCommand(vault: LifeVault, query?: string): void {
  if (!query || query.trim() === "") {
    console.error("\x1b[31mUsage: lifeos search <query>\x1b[0m");
    process.exit(1);
  }

  const results = searchVault(vault, query);
  console.log(`\n\x1b[1;36m=== Search Results for "${query}" (${results.length} matches) ===\x1b[0m\n`);

  if (results.length === 0) {
    console.log("  No matching documents, warranties, or procedures found.");
    return;
  }

  for (const r of results) {
    const typeLabel = `[${r.entityType.toUpperCase()}]`;
    console.log(`• \x1b[1m${r.title}\x1b[0m \x1b[36m${typeLabel}\x1b[0m (${r.category})`);
    console.log(`  ID: ${r.id} | ${r.details}`);
    console.log("");
  }
}

function handleAuditCommand(vault: LifeVault): void {
  const audit = performVaultAudit(vault);

  let scoreColor = "\x1b[32m";
  if (audit.healthScore < 70) scoreColor = "\x1b[31m";
  else if (audit.healthScore < 90) scoreColor = "\x1b[33m";

  console.log(`\n\x1b[1;36m=== LifeOS Tripartite Integrity Audit ===\x1b[0m`);
  console.log(`\x1b[90mReference Date: ${audit.referenceDate} | Timestamp: ${audit.timestamp}\x1b[0m`);
  console.log(`\nVault Health Score: ${scoreColor}\x1b[1m${audit.healthScore} / 100\x1b[0m\n`);

  console.log("\x1b[1;32m1. Observed Verifiable Facts:\x1b[0m");
  console.log(`  • Registered Documents: ${audit.observedFacts.totalDocuments}`);
  console.log(`  • Registered Warranties: ${audit.observedFacts.totalWarranties} (Proofs verified: ${audit.observedFacts.verifiedReceiptsCount})`);
  console.log(`  • Procedures Tracked: ${audit.observedFacts.totalProcedures} (Completed steps: ${audit.observedFacts.completedStepsCount})`);

  console.log("\n\x1b[1;34m2. Estimated Indicators:\x1b[0m");
  console.log(`  • Estimated Value under Active Statutory Warranty: €${audit.estimatedIndicators.activeWarrantiesValueEur.toFixed(2)}`);
  console.log(`  • Average Procedure Completion Rate: ${audit.estimatedIndicators.averageProcedureCompletionRate}%`);
  console.log(`  • Deadlines in the next 90 days: ${audit.estimatedIndicators.upcomingDeadlinesNext90d}`);

  console.log("\n\x1b[1;33m3. Required Human Decisions & Actionable Alerts:\x1b[0m");
  if (audit.requiredHumanDecisions.length === 0) {
    console.log("  \x1b[32m✓ All clear: No overdue obligations, missing proofs, or blocked dependencies.\x1b[0m");
  } else {
    for (const d of audit.requiredHumanDecisions) {
      let icon = "\x1b[33m[!]\x1b[0m";
      if (d.severity === "critical") icon = "\x1b[1;31m[CRITICAL]\x1b[0m";
      else if (d.severity === "info") icon = "\x1b[90m[INFO]\x1b[0m";

      console.log(`  ${icon} \x1b[1m${d.targetTitle}\x1b[0m (\x1b[90m${d.category}\x1b[0m)`);
      console.log(`     Issue:  ${d.message}`);
      console.log(`     Action: \x1b[36m${d.actionRequired}\x1b[0m\n`);
    }
  }
}

function handleDiffCommand(vault: LifeVault, otherPath?: string): void {
  if (!otherPath || !existsSync(otherPath)) {
    console.error(`\x1b[31mUsage: lifeos diff <path-to-other-vault.json>\x1b[0m`);
    process.exit(1);
  }

  try {
    const raw = readFileSync(otherPath, "utf8");
    const otherVault = importVaultFromJson(raw);
    const diff = diffVaults(vault, otherVault);
    console.log("\n" + formatVaultDiff(diff));
  } catch (err) {
    console.error(`\x1b[31mError reading comparison vault: ${err instanceof Error ? err.message : String(err)}\x1b[0m`);
    process.exit(1);
  }
}

function handleDocCommand(vault: LifeVault, vaultPath: string, subCommand?: string, flags: Record<string, string> = {}): void {
  if (subCommand === "list" || !subCommand) {
    const showAll = flags["all"] === "true";
    const docs = showAll ? vault.documents : vault.documents.filter((d) => !d.archived);
    console.log(`\n\x1b[1;36m=== Documents in Vault (${docs.length}${showAll ? " including archived" : ""}) ===\x1b[0m\n`);

    for (const d of docs) {
      const remaining = calculateDaysRemaining(d.expiryDate, getTodayIso());
      const remStr = remaining < 0 ? `\x1b[31mEXPIRED\x1b[0m` : `${remaining}d left`;
      const archStr = d.archived ? " \x1b[90m[ARCHIVED]\x1b[0m" : "";
      console.log(`• \x1b[1m${d.title}\x1b[0m [${d.category}]${archStr}`);
      console.log(`  ID: ${d.id} | Expires: ${d.expiryDate} (${remStr}) | Location: ${d.storageLocation ?? "N/A"}`);
      if (d.documentNumber) console.log(`  Doc #: ${d.documentNumber} | Issuer: ${d.issuer ?? "N/A"}`);
      if (d.notes) console.log(`  Notes: ${d.notes}`);
      console.log("");
    }
    return;
  }

  if (subCommand === "view") {
    const id = flags["id"];
    if (!id) {
      console.error("\x1b[31mUsage: lifeos doc view --id=<doc_id>\x1b[0m");
      process.exit(1);
    }
    const doc = vault.documents.find((d) => d.id === id);
    if (!doc) {
      console.error(`\x1b[31mDocument "${id}" not found.\x1b[0m`);
      process.exit(1);
    }
    console.log(`\n\x1b[1;36m=== Document Details: ${doc.title} ===\x1b[0m`);
    console.log(`  ID:               ${doc.id}`);
    console.log(`  Category:         ${doc.category}`);
    console.log(`  Document Number:  ${doc.documentNumber ?? "—"}`);
    console.log(`  Issuer:           ${doc.issuer ?? "—"}`);
    console.log(`  Holder:           ${doc.holder ?? "—"}`);
    console.log(`  Issue Date:       ${doc.issueDate ?? "—"}`);
    console.log(`  Expiry Date:      ${doc.expiryDate}`);
    console.log(`  Warning Days:     ${doc.warningDays ?? 30}`);
    console.log(`  Location:         ${doc.storageLocation ?? "—"}`);
    console.log(`  Tags:             ${(doc.tags ?? []).join(", ") || "—"}`);
    console.log(`  Archived:         ${doc.archived ? "Yes" : "No"}`);
    console.log(`  Notes:            ${doc.notes ?? "—"}`);
    console.log(`  Created:          ${doc.createdAt}`);
    console.log(`  Updated:          ${doc.updatedAt}`);
    return;
  }

  if (subCommand === "archive") {
    const id = flags["id"];
    if (!id) {
      console.error("\x1b[31mUsage: lifeos doc archive --id=<doc_id>\x1b[0m");
      process.exit(1);
    }
    const updated = archiveDocument(vault, id);
    saveVault(vaultPath, updated);
    console.log(`\x1b[32mDocument "${id}" archived successfully.\x1b[0m`);
    return;
  }

  if (subCommand === "restore") {
    const id = flags["id"];
    if (!id) {
      console.error("\x1b[31mUsage: lifeos doc restore --id=<doc_id>\x1b[0m");
      process.exit(1);
    }
    const updated = restoreDocument(vault, id);
    saveVault(vaultPath, updated);
    console.log(`\x1b[32mDocument "${id}" restored successfully.\x1b[0m`);
    return;
  }

  if (subCommand === "remove") {
    const id = flags["id"];
    if (!id) {
      console.error("\x1b[31mUsage: lifeos doc remove --id=<doc_id>\x1b[0m");
      process.exit(1);
    }
    const updated = removeDocument(vault, id);
    saveVault(vaultPath, updated);
    console.log(`\x1b[32mDocument "${id}" removed from vault.\x1b[0m`);
    return;
  }

  if (subCommand === "add") {
    const title = flags["title"];
    const expiryDate = flags["expiry"];
    const category = (flags["category"] ?? "other") as DocumentCategory;

    if (!title || !expiryDate) {
      console.error("\x1b[31mUsage: lifeos doc add --title=\"...\" --expiry=YYYY-MM-DD [--category=identity|vehicle|home|work|health|tax_legal|warranty|other]\x1b[0m");
      process.exit(1);
    }

    if (!isSupportedCategory(category)) {
      console.error(`\x1b[31mInvalid category "${category}".\x1b[0m`);
      process.exit(1);
    }

    const now = new Date().toISOString();
    const doc: LifeDocument = {
      id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title,
      category,
      documentNumber: flags["doc-num"],
      issuer: flags["issuer"],
      holder: flags["holder"],
      issueDate: flags["issue"],
      expiryDate,
      storageLocation: flags["location"],
      notes: flags["notes"],
      tags: flags["tags"] ? flags["tags"].split(",") : [],
      createdAt: now,
      updatedAt: now,
    };

    const errors = validateDocument(doc);
    if (errors.length > 0) {
      console.error(`\x1b[31mValidation error: ${errors.join(", ")}\x1b[0m`);
      process.exit(1);
    }

    const updated = addDocument(vault, doc);
    saveVault(vaultPath, updated);
    console.log(`\x1b[32mSuccessfully added document "${title}" (ID: ${doc.id}).\x1b[0m`);
    return;
  }

  console.error(`Unknown doc sub-command: ${subCommand}`);
}

function handleWarrantyCommand(vault: LifeVault, vaultPath: string, subCommand?: string, flags: Record<string, string> = {}): void {
  if (subCommand === "list" || !subCommand) {
    console.log(`\n\x1b[1;36m=== Warranties in Vault (${vault.warranties.length}) ===\x1b[0m\n`);
    for (const w of vault.warranties) {
      const remaining = calculateDaysRemaining(w.expiryDate, getTodayIso());
      const remStr = remaining < 0 ? `\x1b[31mEXPIRED\x1b[0m` : `${remaining}d left`;
      console.log(`• \x1b[1m${w.item}\x1b[0m ${w.brand ? `(${w.brand})` : ""}`);
      console.log(`  Purchased: ${w.purchaseDate} | Expiry: ${w.expiryDate} (${remStr}) | Retailer: ${w.retailer ?? "N/A"}`);
      if (w.proofOfPurchase) console.log(`  Proof: ${w.proofOfPurchase}`);
      console.log("");
    }
    return;
  }

  if (subCommand === "view") {
    const id = flags["id"];
    if (!id) {
      console.error("\x1b[31mUsage: lifeos warranty view --id=<warranty_id>\x1b[0m");
      process.exit(1);
    }
    const w = vault.warranties.find((x) => x.id === id);
    if (!w) {
      console.error(`\x1b[31mWarranty "${id}" not found.\x1b[0m`);
      process.exit(1);
    }
    console.log(`\n\x1b[1;36m=== Warranty Details: ${w.item} ===\x1b[0m`);
    console.log(`  ID:               ${w.id}`);
    console.log(`  Brand / Model:    ${w.brand ?? "—"} ${w.model ?? ""}`);
    console.log(`  Serial Number:    ${w.serialNumber ?? "—"}`);
    console.log(`  Purchase Date:    ${w.purchaseDate}`);
    console.log(`  Duration Months:  ${w.durationMonths}`);
    console.log(`  Expiry Date:      ${w.expiryDate}`);
    console.log(`  Retailer:         ${w.retailer ?? "—"}`);
    console.log(`  Price:            ${w.price ? `€${w.price}` : "—"}`);
    console.log(`  Proof Reference:  ${w.proofOfPurchase ?? "—"}`);
    console.log(`  Notes:            ${w.notes ?? "—"}`);
    return;
  }

  if (subCommand === "remove") {
    const id = flags["id"];
    if (!id) {
      console.error("\x1b[31mUsage: lifeos warranty remove --id=<warranty_id>\x1b[0m");
      process.exit(1);
    }
    const updated = removeWarranty(vault, id);
    saveVault(vaultPath, updated);
    console.log(`\x1b[32mWarranty "${id}" removed from vault.\x1b[0m`);
    return;
  }

  if (subCommand === "add") {
    const item = flags["item"];
    const purchaseDate = flags["purchase"];
    const months = flags["months"] ? Number(flags["months"]) : 24;

    if (!item || !purchaseDate) {
      console.error("\x1b[31mUsage: lifeos warranty add --item=\"...\" --purchase=YYYY-MM-DD [--months=24] [--brand=...] [--proof=...]\x1b[0m");
      process.exit(1);
    }

    const warranty = createWarranty({
      item,
      brand: flags["brand"],
      model: flags["model"],
      serialNumber: flags["serial"],
      purchaseDate,
      durationMonths: months,
      retailer: flags["retailer"],
      proofOfPurchase: flags["proof"],
      notes: flags["notes"],
    });

    const updated = addWarranty(vault, warranty);
    saveVault(vaultPath, updated);
    console.log(`\x1b[32mSuccessfully added warranty for "${item}" (Expires: ${warranty.expiryDate}).\x1b[0m`);
    return;
  }

  console.error(`Unknown warranty sub-command: ${subCommand}`);
}

function handleTaskCommand(vault: LifeVault, vaultPath: string, subCommand?: string, flags: Record<string, string> = {}): void {
  if (subCommand === "list" || !subCommand) {
    console.log(`\n\x1b[1;36m=== Administrative Procedures & Paperwork (${vault.procedures.length}) ===\x1b[0m\n`);
    for (const p of vault.procedures) {
      const prog = computeProcedureProgress(p);
      console.log(`• \x1b[1m${p.title}\x1b[0m [Status: ${p.status}, Progress: ${prog.percentage}%] (ID: ${p.id})`);
      for (const s of p.steps) {
        const mark = s.completed ? "\x1b[32m[✓]\x1b[0m" : "\x1b[90m[ ]\x1b[0m";
        console.log(`    ${mark} (ID: ${s.id}) ${s.title}${s.dueDate ? ` - Due: ${s.dueDate}` : ""}`);
      }
      console.log("");
    }
    return;
  }

  if (subCommand === "view") {
    const id = flags["id"];
    if (!id) {
      console.error("\x1b[31mUsage: lifeos task view --id=<procedure_id>\x1b[0m");
      process.exit(1);
    }
    const proc = vault.procedures.find((p) => p.id === id);
    if (!proc) {
      console.error(`\x1b[31mProcedure "${id}" not found.\x1b[0m`);
      process.exit(1);
    }
    const prog = computeProcedureProgress(proc);
    console.log(`\n\x1b[1;36m=== Procedure Details: ${proc.title} ===\x1b[0m`);
    console.log(`  ID:               ${proc.id}`);
    console.log(`  Category:         ${proc.category}`);
    console.log(`  Status:           ${proc.status}`);
    console.log(`  Target Deadline:  ${proc.targetDeadline ?? "—"}`);
    console.log(`  Progress:         ${prog.percentage}% (${prog.completed}/${prog.total} steps)`);
    console.log(`  Notes:            ${proc.notes ?? "—"}`);
    console.log(`\n  Steps:`);
    for (const s of proc.steps) {
      const mark = s.completed ? "\x1b[32m[✓]\x1b[0m" : "\x1b[90m[ ]\x1b[0m";
      console.log(`    ${mark} ${s.title}${s.dueDate ? ` (Due: ${s.dueDate})` : ""}`);
      if (s.requiredDocIds && s.requiredDocIds.length > 0) {
        console.log(`      Requires Docs: ${s.requiredDocIds.join(", ")}`);
      }
    }
    return;
  }

  if (subCommand === "done") {
    const procId = flags["id"];
    const stepId = flags["step"];

    if (!procId || !stepId) {
      console.error("\x1b[31mUsage: lifeos task done --id=<procedure_id> --step=<step_id>\x1b[0m");
      process.exit(1);
    }

    const targetProc = vault.procedures.find((p) => p.id === procId);
    if (!targetProc) {
      console.error(`\x1b[31mProcedure "${procId}" not found.\x1b[0m`);
      process.exit(1);
    }

    const updatedProc = completeStep(targetProc, stepId);
    const updatedVault: LifeVault = {
      ...vault,
      procedures: vault.procedures.map((p) => (p.id === procId ? updatedProc : p)),
    };

    saveVault(vaultPath, updatedVault);
    console.log(`\x1b[32mMarked step "${stepId}" of procedure "${procId}" as completed!\x1b[0m`);
    return;
  }

  if (subCommand === "remove") {
    const id = flags["id"];
    if (!id) {
      console.error("\x1b[31mUsage: lifeos task remove --id=<procedure_id>\x1b[0m");
      process.exit(1);
    }
    const updated = removeProcedure(vault, id);
    saveVault(vaultPath, updated);
    console.log(`\x1b[32mProcedure "${id}" removed from vault.\x1b[0m`);
    return;
  }

  if (subCommand === "add") {
    const title = flags["title"];
    if (!title) {
      console.error("\x1b[31mUsage: lifeos task add --title=\"...\" [--category=identity|home|work...]\x1b[0m");
      process.exit(1);
    }
    const proc = createProcedure({
      title,
      category: (flags["category"] as DocumentCategory) ?? "other",
      targetDeadline: flags["deadline"],
      notes: flags["notes"],
    });

    const updated = addProcedure(vault, proc);
    saveVault(vaultPath, updated);
    console.log(`\x1b[32mSuccessfully added procedure "${title}" (ID: ${proc.id}).\x1b[0m`);
    return;
  }

  console.error(`Unknown task sub-command: ${subCommand}`);
}

function handleExportCommand(vault: LifeVault, flags: Record<string, string>): void {
  const format = (flags["format"] ?? "ics").toLowerCase();
  const outPath = flags["out"];

  let output = "";
  if (format === "ics") {
    output = exportVaultToIcal(vault);
  } else if (format === "json") {
    output = exportVaultToJson(vault);
  } else if (format === "html") {
    output = exportVaultToHtml(vault);
  } else if (format === "md" || format === "markdown") {
    output = exportVaultToMarkdown(vault);
  } else if (format === "csv") {
    const csvData = exportVaultToCsv(vault);
    output = csvData.documents;
  } else {
    console.error(`\x1b[31mUnsupported export format "${format}". Choose from: ics, json, html, md, csv\x1b[0m`);
    process.exit(1);
  }

  if (outPath) {
    writeFileSync(outPath, output, "utf8");
    console.log(`\x1b[32mExported vault in ${format.toUpperCase()} format to ${outPath}\x1b[0m`);
  } else {
    process.stdout.write(output);
  }
}

function printHelp(): void {
  console.log(`
\x1b[1;36mLifeOS v${LIFEOS_VERSION} — Local-first Personal Operating System\x1b[0m
Track personal documents, renewal deadlines, warranties, and paperwork procedures.

\x1b[1mUSAGE:\x1b[0m
  lifeos [command] [subcommand] [flags]

\x1b[1mCOMMANDS:\x1b[0m
  \x1b[33mdashboard\x1b[0m                       Display priority timeline, status overview, and paperwork
  \x1b[33msearch <query>\x1b[0m                  Fast search across documents, warranties, and procedures
  \x1b[33maudit\x1b[0m                           Run tripartite integrity audit (Facts vs Estimates vs Decisions)
  \x1b[33mdiff <path>\x1b[0m                     Compare current vault with another backup/snapshot
  \x1b[33mdoc list\x1b[0m                        List documents in vault (--all to include archived)
  \x1b[33mdoc view\x1b[0m                        View complete details of a document (--id=...)
  \x1b[33mdoc add\x1b[0m                         Add a personal document
  \x1b[33mdoc archive\x1b[0m                     Archive a document (--id=...)
  \x1b[33mdoc restore\x1b[0m                     Restore an archived document (--id=...)
  \x1b[33mdoc remove\x1b[0m                      Delete a document (--id=...)
  \x1b[33mwarranty list\x1b[0m                   List active warranties and proof of purchase
  \x1b[33mwarranty view\x1b[0m                   View complete warranty record (--id=...)
  \x1b[33mwarranty add\x1b[0m                    Register an item warranty
  \x1b[33mwarranty remove\x1b[0m                 Remove a warranty (--id=...)
  \x1b[33mtask list\x1b[0m                       List administrative procedures and checklist steps
  \x1b[33mtask view\x1b[0m                       View procedure details and dependencies (--id=...)
  \x1b[33mtask done\x1b[0m                       Mark a checklist step as completed (--id=... --step=...)
  \x1b[33mtask add\x1b[0m                        Create a new multi-step administrative procedure
  \x1b[33mtask remove\x1b[0m                     Remove a procedure (--id=...)
  \x1b[33mexport\x1b[0m                          Export vault (--format=ics|json|html|md|csv [--out=filename])
  \x1b[33mdemo\x1b[0m                            Load or output synthetic pilot dataset
  \x1b[33mhelp, --help\x1b[0m                    Show this help guide

\x1b[1mEXAMPLES:\x1b[0m
  lifeos dashboard
  lifeos search passaporto
  lifeos audit
  lifeos doc add --title="Passaporto" --category=identity --expiry=2034-05-10
  lifeos warranty add --item="MacBook Pro" --purchase=2025-01-10 --months=24
  lifeos task done --id=proc_passaporto_rinnovo --step=step_bollettino
  lifeos export --format=ics --out=scadenze.ics
  lifeos export --format=md --out=Dossier.md
`);
}

export function runCli(argv: string[] = process.argv.slice(2)): void {
  const { command, subCommand, flags, rest } = parseCliArgs(argv);

  if (flags["help"] || command === "help" || command === "--help" || command === "-h") {
    printHelp();
    maybeShowSponsor();
    return;
  }

  if (flags["version"] || command === "--version" || command === "-v") {
    console.log(`lifeos v${LIFEOS_VERSION}`);
    return;
  }

  const vaultPath = getVaultPath(flags);

  if (command === "demo") {
    const demoVault = createPilotVault();
    const out = flags["out"];
    if (out) {
      writeFileSync(out, exportVaultToJson(demoVault), "utf8");
      console.log(`\x1b[32mPilot demo dataset saved to ${out}\x1b[0m`);
    } else {
      renderDashboard(demoVault, "2026-11-06");
    }
    maybeShowSponsor();
    return;
  }

  const vault = loadOrCreateVault(vaultPath);

  switch (command) {
    case "dashboard":
      renderDashboard(vault, getTodayIso());
      break;
    case "search":
      handleSearchCommand(vault, subCommand ?? rest[0]);
      break;
    case "audit":
      handleAuditCommand(vault);
      break;
    case "diff":
      handleDiffCommand(vault, subCommand ?? rest[0]);
      break;
    case "doc":
      handleDocCommand(vault, vaultPath, subCommand, flags);
      break;
    case "warranty":
      handleWarrantyCommand(vault, vaultPath, subCommand, flags);
      break;
    case "task":
      handleTaskCommand(vault, vaultPath, subCommand, flags);
      break;
    case "export":
      handleExportCommand(vault, flags);
      break;
    default:
      console.error(`\x1b[31mUnknown command: ${command}. Run "lifeos help" for usage.\x1b[0m`);
      process.exit(1);
  }

  maybeShowSponsor();
}

// Auto-run if executed as CLI entrypoint
runCli();
