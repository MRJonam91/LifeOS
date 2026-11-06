// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com>

import { LIFEOS_VERSION } from "../core/constants.ts";
import { generateDashboardSummary } from "../core/deadlines.ts";
import { computeProcedureProgress } from "../core/procedures.ts";
import type { LifeVault } from "../core/types.ts";

export function exportVaultToMarkdown(vault: LifeVault, referenceDate?: string): string {
  const summary = generateDashboardSummary(vault, referenceDate);

  const lines: string[] = [
    `# LifeOS — Personal Administrative Dossier`,
    ``,
    `> **Owner:** ${vault.metadata.owner ?? "Personal Vault"} | **Generated:** ${summary.today} | **Version:** v${LIFEOS_VERSION}`,
    ``,
    `---`,
    ``,
    `## 📊 Executive Overview`,
    ``,
    `| Metric | Value |`,
    `|---|---|`,
    `| **Active Documents** | ${summary.activeDocuments} / ${summary.totalDocuments} |`,
    `| **Urgent Deadlines (≤ 7d)** | ${summary.urgentCount} |`,
    `| **Expiring Soon (≤ 30d)** | ${summary.soonCount} |`,
    `| **Active Warranties** | ${summary.activeWarrantiesCount} / ${summary.totalWarranties} |`,
    `| **Active Procedures** | ${summary.inProgressProceduresCount} / ${summary.totalProcedures} |`,
    ``,
    `---`,
    ``,
    `## ⏳ Priority Timeline & Upcoming Deadlines`,
    ``,
    `| Urgency | Item | Category | Due Date | Countdown | Notes |`,
    `|---|---|---|---|---|---|`,
  ];

  for (const item of summary.deadlines) {
    const countdown =
      item.daysRemaining < 0
        ? `**${Math.abs(item.daysRemaining)}d ago** (OVERDUE)`
        : item.daysRemaining === 0
        ? `**TODAY**`
        : `in ${item.daysRemaining}d`;
    lines.push(
      `| \`${item.urgency.toUpperCase()}\` | **${item.title}**${item.parentTitle ? ` *(Part of: ${item.parentTitle})*` : ""} | \`${item.category}\` | ${item.date} | ${countdown} | ${item.notes ?? "—"} |`
    );
  }

  lines.push(
    ``,
    `---`,
    ``,
    `## 🗂️ Personal Document Vault`,
    ``,
    `| Title | Category | Doc # | Issuer | Expiry Date | Storage Location | Archived |`,
    `|---|---|---|---|---|---|---|`
  );

  for (const doc of vault.documents) {
    lines.push(
      `| **${doc.title}** | \`${doc.category}\` | ${doc.documentNumber ?? "—"} | ${doc.issuer ?? "—"} | \`${doc.expiryDate}\` | ${doc.storageLocation ?? "—"} | ${doc.archived ? "Yes" : "No"} |`
    );
  }

  lines.push(
    ``,
    `---`,
    ``,
    `## 🛡️ Statutory Warranties & Proofs of Purchase`,
    ``,
    `| Item | Brand / Model | Purchase Date | Expiry Date | Retailer | Proof Reference |`,
    `|---|---|---|---|---|---|`
  );

  for (const w of vault.warranties) {
    lines.push(
      `| **${w.item}** | ${w.brand ?? ""} ${w.model ?? ""} | ${w.purchaseDate} | \`${w.expiryDate}\` | ${w.retailer ?? "—"} | ${w.proofOfPurchase ?? "Missing"} |`
    );
  }

  lines.push(
    ``,
    `---`,
    ``,
    `## 📋 Administrative Procedures & Paperwork`,
    ``
  );

  for (const p of vault.procedures) {
    const prog = computeProcedureProgress(p);
    lines.push(
      `### ${p.title} [Status: \`${p.status}\` | Progress: ${prog.percentage}%]`,
      ``,
      p.notes ? `*${p.notes}*\n` : "",
      `Steps:`
    );
    for (const step of p.steps) {
      const mark = step.completed ? "[x]" : "[ ]";
      const due = step.dueDate ? ` *(due ${step.dueDate})*` : "";
      lines.push(`- ${mark} **${step.title}**${due}`);
      if (step.notes) {
        lines.push(`  - *Note:* ${step.notes}`);
      }
    }
    lines.push(``);
  }

  lines.push(
    `---`,
    ``,
    `*Generated locally by LifeOS (AGPL-3.0-only). Data sovereignty preserved.*`
  );

  return lines.join("\n") + "\n";
}
