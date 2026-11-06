#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com>

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import {
  exportDocumentsToCsv,
  exportVaultToCsv,
  exportVaultToHtml,
  exportVaultToIcal,
  exportVaultToJson,
  importVaultFromJson,
} from "../adapters/index.ts";
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
import { addDocument, addProcedure, addWarranty, createEmptyVault } from "../core/vault.ts";
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

  // If file doesn't exist, create initial demo vault so user immediately sees value
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

function parseCliArgs(args: string[]): { command: string; subCommand?: string; flags: Record<string, string> } {
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

  console.log("\n\x1b[90mQuick commands: lifeos doc list | lifeos warranty list | lifeos export --format=ics\x1b[0m");
}

function handleDocCommand(vault: LifeVault, vaultPath: string, subCommand?: string, flags: Record<string, string> = {}): void {
  if (subCommand === "list" || !subCommand) {
    console.log(`\n\x1b[1;36m=== Documents in Vault (${vault.documents.length}) ===\x1b[0m\n`);
    for (const d of vault.documents) {
      const remaining = calculateDaysRemaining(d.expiryDate, getTodayIso());
      const remStr = remaining < 0 ? `\x1b[31mEXPIRED\x1b[0m` : `${remaining}d left`;
      console.log(`• \x1b[1m${d.title}\x1b[0m [${d.category}]`);
      console.log(`  ID: ${d.id} | Expires: ${d.expiryDate} (${remStr}) | Location: ${d.storageLocation ?? "N/A"}`);
      if (d.documentNumber) console.log(`  Doc #: ${d.documentNumber} | Issuer: ${d.issuer ?? "N/A"}`);
      if (d.notes) console.log(`  Notes: ${d.notes}`);
      console.log("");
    }
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
  } else if (format === "csv") {
    const csvData = exportVaultToCsv(vault);
    output = csvData.documents; // default to documents if single file
  } else {
    console.error(`\x1b[31mUnsupported export format "${format}". Choose from: ics, json, html, csv\x1b[0m`);
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
  \x1b[33mdoc list\x1b[0m                        List all documents in vault
  \x1b[33mdoc add\x1b[0m                         Add a personal document
  \x1b[33mwarranty list\x1b[0m                   List active warranties and proof of purchase
  \x1b[33mwarranty add\x1b[0m                    Register an item warranty
  \x1b[33mtask list\x1b[0m                       List administrative procedures and checklist steps
  \x1b[33mtask done\x1b[0m                       Mark a checklist step as completed
  \x1b[33mtask add\x1b[0m                        Create a new multi-step administrative procedure
  \x1b[33mexport\x1b[0m                          Export vault (--format=ics|json|html|csv [--out=filename])
  \x1b[33mdemo\x1b[0m                            Load or output synthetic pilot dataset
  \x1b[33mhelp, --help\x1b[0m                    Show this help guide

\x1b[1mEXAMPLES:\x1b[0m
  lifeos dashboard
  lifeos doc add --title="Passaporto" --category=identity --expiry=2034-05-10
  lifeos warranty add --item="MacBook Pro" --purchase=2025-01-10 --months=24
  lifeos task done --id=proc_passaporto_rinnovo --step=step_bollettino
  lifeos export --format=ics --out=scadenze.ics
  lifeos export --format=html --out=dashboard.html
`);
}

export function runCli(argv: string[] = process.argv.slice(2)): void {
  const { command, subCommand, flags } = parseCliArgs(argv);

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
