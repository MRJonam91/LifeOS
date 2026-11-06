// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com>

import { LIFEOS_VERSION } from "../core/constants.ts";
import { generateDashboardSummary } from "../core/deadlines.ts";
import { computeProcedureProgress } from "../core/procedures.ts";
import type { LifeVault } from "../core/types.ts";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function exportVaultToHtml(vault: LifeVault, referenceDate?: string): string {
  const summary = generateDashboardSummary(vault, referenceDate);

  const deadlineRows = summary.deadlines
    .map((item) => {
      const badgeClass =
        item.urgency === "overdue"
          ? "badge-overdue"
          : item.urgency === "urgent"
          ? "badge-urgent"
          : item.urgency === "soon"
          ? "badge-soon"
          : "badge-active";

      const remainingText =
        item.daysRemaining < 0
          ? `${Math.abs(item.daysRemaining)} days ago`
          : item.daysRemaining === 0
          ? "Today"
          : `${item.daysRemaining} days`;

      return `<tr>
        <td><span class="badge ${badgeClass}">${escapeHtml(item.urgency.toUpperCase())}</span></td>
        <td><strong>${escapeHtml(item.title)}</strong>${item.parentTitle ? `<br><small class="text-dim">Part of: ${escapeHtml(item.parentTitle)}</small>` : ""}</td>
        <td><span class="tag">${escapeHtml(item.category)}</span></td>
        <td><code>${escapeHtml(item.date)}</code></td>
        <td>${escapeHtml(remainingText)}</td>
        <td><small>${escapeHtml(item.notes ?? "")}</small></td>
      </tr>`;
    })
    .join("\n");

  const documentCards = vault.documents
    .map((doc) => {
      return `<div class="card">
        <div class="card-header">
          <span class="tag tag-cat">${escapeHtml(doc.category)}</span>
          <span class="expiry-pill">Expires: ${escapeHtml(doc.expiryDate)}</span>
        </div>
        <h3 class="card-title">${escapeHtml(doc.title)}</h3>
        <p class="card-detail"><strong>Doc #:</strong> ${escapeHtml(doc.documentNumber ?? "—")}</p>
        <p class="card-detail"><strong>Issuer:</strong> ${escapeHtml(doc.issuer ?? "—")}</p>
        <p class="card-detail"><strong>Location:</strong> ${escapeHtml(doc.storageLocation ?? "—")}</p>
        ${doc.notes ? `<p class="card-notes">${escapeHtml(doc.notes)}</p>` : ""}
      </div>`;
    })
    .join("\n");

  const procedureCards = vault.procedures
    .map((proc) => {
      const progress = computeProcedureProgress(proc);
      const stepsList = proc.steps
        .map(
          (s) =>
            `<li class="step-item ${s.completed ? "completed" : ""}">
              <span class="step-icon">${s.completed ? "✓" : "○"}</span>
              <span class="step-title">${escapeHtml(s.title)}</span>
              ${s.dueDate ? `<small class="step-date">Due: ${escapeHtml(s.dueDate)}</small>` : ""}
            </li>`
        )
        .join("\n");

      return `<div class="card">
        <div class="card-header">
          <span class="tag tag-cat">${escapeHtml(proc.category)}</span>
          <span class="status-pill status-${proc.status}">${escapeHtml(proc.status.replace("_", " "))}</span>
        </div>
        <h3 class="card-title">${escapeHtml(proc.title)}</h3>
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: ${progress.percentage}%"></div>
        </div>
        <small class="progress-text">${progress.completed} of ${progress.total} steps completed (${progress.percentage}%)</small>
        <ul class="steps-list">${stepsList}</ul>
      </div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LifeOS Dashboard — ${escapeHtml(vault.metadata.owner ?? "Personal Vault")}</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #131b2e;
      --border: #23314d;
      --text: #f8fafc;
      --text-dim: #94a3b8;
      --primary: #38bdf8;
      --urgent: #f87171;
      --soon: #fbbf24;
      --success: #34d399;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); padding: 24px; line-height: 1.5; }
    .header { margin-bottom: 24px; border-bottom: 1px solid var(--border); padding-bottom: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
    .header h1 { font-size: 24px; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 8px; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .stat-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 8px; padding: 16px; }
    .stat-label { font-size: 12px; text-transform: uppercase; color: var(--text-dim); letter-spacing: 0.05em; }
    .stat-value { font-size: 28px; font-weight: 800; margin-top: 4px; color: var(--primary); }
    .stat-value.urgent { color: var(--urgent); }
    .stat-value.soon { color: var(--soon); }
    .section-title { font-size: 18px; margin-bottom: 12px; font-weight: 600; }
    .table-container { overflow-x: auto; background: var(--card-bg); border: 1px solid var(--border); border-radius: 8px; margin-bottom: 32px; }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
    th, td { padding: 12px 16px; border-bottom: 1px solid var(--border); }
    th { background: rgba(255, 255, 255, 0.03); color: var(--text-dim); font-weight: 600; }
    .badge { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .badge-urgent { background: rgba(248, 113, 113, 0.2); color: #f87171; border: 1px solid #f87171; }
    .badge-overdue { background: rgba(239, 68, 68, 0.3); color: #fca5a5; border: 1px solid #ef4444; }
    .badge-soon { background: rgba(251, 191, 36, 0.2); color: #fbbf24; border: 1px solid #fbbf24; }
    .badge-active { background: rgba(52, 211, 153, 0.2); color: #34d399; }
    .tag { background: #1e293b; color: #94a3b8; padding: 2px 6px; border-radius: 4px; font-size: 11px; }
    .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 8px; padding: 16px; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .card-title { font-size: 15px; margin-bottom: 8px; }
    .card-detail { font-size: 13px; color: var(--text-dim); margin-bottom: 4px; }
    .card-notes { font-size: 12px; color: #cbd5e1; margin-top: 8px; background: rgba(0,0,0,0.2); padding: 6px; border-radius: 4px; }
    .expiry-pill { font-size: 11px; color: #38bdf8; }
    .status-pill { font-size: 11px; padding: 2px 6px; border-radius: 4px; text-transform: capitalize; }
    .status-in_progress { background: rgba(56, 189, 248, 0.2); color: #38bdf8; }
    .status-completed { background: rgba(52, 211, 153, 0.2); color: #34d399; }
    .status-pending { background: rgba(148, 163, 184, 0.2); color: #94a3b8; }
    .progress-bar-container { height: 6px; background: #1e293b; border-radius: 3px; overflow: hidden; margin: 8px 0 4px; }
    .progress-bar { height: 100%; background: #38bdf8; }
    .progress-text { font-size: 11px; color: var(--text-dim); }
    .steps-list { list-style: none; margin-top: 12px; }
    .step-item { font-size: 13px; display: flex; align-items: center; gap: 8px; padding: 4px 0; border-bottom: 1px dotted var(--border); }
    .step-item.completed { color: var(--text-dim); text-decoration: line-through; }
    .step-icon { font-weight: bold; }
    .footer { text-align: center; color: var(--text-dim); font-size: 12px; margin-top: 40px; padding-top: 16px; border-top: 1px solid var(--border); }
    code { font-family: monospace; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>LifeOS — Personal Administrative Vault</h1>
      <p style="color: var(--text-dim); font-size: 13px;">Owner: ${escapeHtml(vault.metadata.owner ?? "Local User")} | Reference Date: ${escapeHtml(summary.today)}</p>
    </div>
    <div>
      <span class="tag">LifeOS v${LIFEOS_VERSION}</span>
      <span class="tag">Local-First</span>
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-label">Active Documents</div>
      <div class="stat-value">${summary.activeDocuments} / ${summary.totalDocuments}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Urgent Deadlines (&le; 7d)</div>
      <div class="stat-value ${summary.urgentCount > 0 ? "urgent" : ""}">${summary.urgentCount}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Expiring Soon (&le; 30d)</div>
      <div class="stat-value ${summary.soonCount > 0 ? "soon" : ""}">${summary.soonCount}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Active Warranties</div>
      <div class="stat-value">${summary.activeWarrantiesCount} / ${summary.totalWarranties}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Procedures In Progress</div>
      <div class="stat-value">${summary.inProgressProceduresCount} / ${summary.totalProcedures}</div>
    </div>
  </div>

  <div class="search-container" style="margin-bottom: 24px;">
    <input type="text" id="vaultSearch" placeholder="🔍 Instant search across timeline, documents, and procedures..." oninput="handleSearch(this.value)" style="width: 100%; padding: 12px 16px; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text); font-size: 14px; outline: none;">
  </div>

  <h2 class="section-title">Timeline &amp; Upcoming Deadlines</h2>
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>Priority</th>
          <th>Item / Obligation</th>
          <th>Category</th>
          <th>Due Date</th>
          <th>Countdown</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
        ${deadlineRows}
      </tbody>
    </table>
  </div>

  <h2 class="section-title">Personal Document Vault</h2>
  <div class="cards-grid">
    ${documentCards}
  </div>

  <h2 class="section-title">Administrative Procedures &amp; Paperwork</h2>
  <div class="cards-grid">
    ${procedureCards}
  </div>

  <div class="footer">
    <p>LifeOS — Local-First Personal Dashboard &amp; Paperwork Vault. Private &amp; Offline.</p>
    <p><small>Dual-licensed under AGPL-3.0-only &amp; Commercial. Developed by Manoj Rollo (MRJonam91).</small></p>
  </div>
  <script>
    function handleSearch(q) {
      const term = q.trim().toLowerCase();
      document.querySelectorAll('tbody tr').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
      });
      document.querySelectorAll('.cards-grid .card').forEach(card => {
        card.style.display = card.textContent.toLowerCase().includes(term) ? '' : 'none';
      });
    }
  </script>
</body>
</html>`;
}
