// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com>

import { LIFEOS_VERSION } from "../core/constants.ts";
import { generateDashboardSummary } from "../core/deadlines.ts";
import type { LifeVault } from "../core/types.ts";

function escapeIcalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function formatIcalDate(isoDate: string): string {
  // isoDate is YYYY-MM-DD -> returns YYYYMMDD
  return isoDate.replace(/-/g, "");
}

export function exportVaultToIcal(vault: LifeVault, referenceDate?: string): string {
  const summary = generateDashboardSummary(vault, referenceDate);
  const now = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//MRJonam91//LifeOS v${LIFEOS_VERSION}//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcalText("LifeOS Deadlines & Paperwork")}`,
    "X-WR-TIMEZONE:UTC",
  ];

  for (const item of summary.deadlines) {
    const dt = formatIcalDate(item.date);
    const summaryText = escapeIcalText(
      `[${item.entityType.toUpperCase()}] ${item.title} (${item.urgency.toUpperCase()})`
    );
    const desc = escapeIcalText(
      `Category: ${item.category}\nStatus: ${item.status}\nRemaining: ${item.daysRemaining} days\n${item.notes ?? ""}`
    );

    lines.push(
      "BEGIN:VEVENT",
      `UID:lifeos-${item.id}-${dt}@lifeos.local`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${dt}`,
      `SUMMARY:${summaryText}`,
      `DESCRIPTION:${desc}`,
      "TRANSP:TRANSPARENT",
      // Reminders (VALARM): 7 days prior and on the day
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:Reminder: ${summaryText}`,
      "TRIGGER:-P7D",
      "END:VALARM",
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:Due today: ${summaryText}`,
      "TRIGGER:-P0D",
      "END:VALARM",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
