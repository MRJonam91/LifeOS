// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com>

import { LIFEOS_VERSION } from "../core/constants.ts";
import { generateDashboardSummary, getTodayIso } from "../core/deadlines.ts";
import { computeProcedureProgress } from "../core/procedures.ts";
import type { LifeVault } from "../core/types.ts";

export interface DigestOptions {
  horizonDays?: number; // defaults to 30
  format?: "text" | "markdown";
  referenceDate?: string;
}

export function generatePeriodicDigest(vault: LifeVault, options: DigestOptions = {}): string {
  const refDate = options.referenceDate ?? getTodayIso();
  const format = options.format ?? "text";
  const horizon = options.horizonDays ?? 30;

  const summary = generateDashboardSummary(vault, refDate);

  const overdue = summary.deadlines.filter((d) => d.daysRemaining < 0);
  const urgent = summary.deadlines.filter((d) => d.daysRemaining >= 0 && d.daysRemaining <= 7);
  const upcoming = summary.deadlines.filter((d) => d.daysRemaining > 7 && d.daysRemaining <= horizon);

  if (format === "markdown") {
    const lines: string[] = [
      `# 🔔 LifeOS Digest — ${refDate}`,
      `*Vault owner: ${vault.metadata.owner ?? "Personal Vault"} (v${LIFEOS_VERSION})*`,
      ``,
    ];

    if (overdue.length > 0) {
      lines.push(`### ⚠️ Overdue Obligations (${overdue.length})`);
      for (const item of overdue) {
        lines.push(`- 🔴 **${item.title}** (${item.category}) — expired ${Math.abs(item.daysRemaining)} days ago on ${item.date}`);
      }
      lines.push(``);
    }

    if (urgent.length > 0) {
      lines.push(`### 🚨 Urgent Deadlines (Next 7 Days: ${urgent.length})`);
      for (const item of urgent) {
        const days = item.daysRemaining === 0 ? "TODAY" : `in ${item.daysRemaining} days`;
        lines.push(`- 🟡 **${item.title}** (${item.category}) — due **${days}** (${item.date})`);
      }
      lines.push(``);
    }

    if (upcoming.length > 0) {
      lines.push(`### 📅 Upcoming in Next ${horizon} Days (${upcoming.length})`);
      for (const item of upcoming) {
        lines.push(`- 🟢 ${item.title} (${item.category}) — due in ${item.daysRemaining} days (${item.date})`);
      }
      lines.push(``);
    }

    const activeProcs = vault.procedures.filter((p) => p.status === "in_progress" || p.status === "pending");
    if (activeProcs.length > 0) {
      lines.push(`### 📋 Active Procedures & Next Steps`);
      for (const p of activeProcs) {
        const prog = computeProcedureProgress(p);
        const nextStep = p.steps.find((s) => !s.completed);
        lines.push(`- **${p.title}** [${prog.percentage}%]`);
        if (nextStep) {
          lines.push(`  - Next action: ${nextStep.title}${nextStep.dueDate ? ` *(due ${nextStep.dueDate})*` : ""}`);
        }
      }
      lines.push(``);
    }

    lines.push(`---`, `*LifeOS Digest — Local-First Personal Admin.*`);
    return lines.join("\n") + "\n";
  }

  // Plain text format
  const textLines: string[] = [
    `=== LifeOS Daily Digest (${refDate}) ===`,
    `Owner: ${vault.metadata.owner ?? "Personal Vault"}`,
    ``,
  ];

  if (overdue.length > 0) {
    textLines.push(`[!] OVERDUE ITEMS (${overdue.length}):`);
    for (const item of overdue) {
      textLines.push(`  * ${item.title} (${item.category}) - ${Math.abs(item.daysRemaining)}d ago (${item.date})`);
    }
    textLines.push(``);
  }

  if (urgent.length > 0) {
    textLines.push(`[CRITICAL] DUE IN <= 7 DAYS (${urgent.length}):`);
    for (const item of urgent) {
      const days = item.daysRemaining === 0 ? "TODAY" : `in ${item.daysRemaining}d`;
      textLines.push(`  * ${item.title} - due ${days} (${item.date})`);
    }
    textLines.push(``);
  }

  if (upcoming.length > 0) {
    textLines.push(`[UPCOMING] NEXT ${horizon} DAYS (${upcoming.length}):`);
    for (const item of upcoming) {
      textLines.push(`  * ${item.title} - in ${item.daysRemaining}d (${item.date})`);
    }
    textLines.push(``);
  }

  const activeProcs = vault.procedures.filter((p) => p.status === "in_progress" || p.status === "pending");
  if (activeProcs.length > 0) {
    textLines.push(`[PAPERWORK IN PROGRESS]:`);
    for (const p of activeProcs) {
      const prog = computeProcedureProgress(p);
      const nextStep = p.steps.find((s) => !s.completed);
      textLines.push(`  * ${p.title} (${prog.percentage}%) -> Next: ${nextStep?.title ?? "None"}`);
    }
  }

  return textLines.join("\n") + "\n";
}
