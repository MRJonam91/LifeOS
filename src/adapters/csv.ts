// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com>

import type { LifeDocument, LifeVault, Warranty } from "../core/types.ts";

function escapeCsvField(val: unknown): string {
  if (val === undefined || val === null) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportDocumentsToCsv(documents: LifeDocument[]): string {
  const headers = [
    "ID",
    "Title",
    "Category",
    "DocumentNumber",
    "Issuer",
    "Holder",
    "IssueDate",
    "ExpiryDate",
    "WarningDays",
    "StorageLocation",
    "Tags",
    "Notes",
    "Archived",
  ];

  const rows = documents.map((d) => [
    d.id,
    d.title,
    d.category,
    d.documentNumber ?? "",
    d.issuer ?? "",
    d.holder ?? "",
    d.issueDate ?? "",
    d.expiryDate,
    d.warningDays ?? "",
    d.storageLocation ?? "",
    (d.tags ?? []).join(";"),
    d.notes ?? "",
    d.archived ? "true" : "false",
  ]);

  return (
    [headers.map(escapeCsvField).join(","), ...rows.map((r) => r.map(escapeCsvField).join(","))].join("\r\n") +
    "\r\n"
  );
}

export function exportWarrantiesToCsv(warranties: Warranty[]): string {
  const headers = [
    "ID",
    "Item",
    "Brand",
    "Model",
    "SerialNumber",
    "PurchaseDate",
    "DurationMonths",
    "ExpiryDate",
    "Retailer",
    "Price",
    "Currency",
    "ProofOfPurchase",
    "Tags",
    "Notes",
  ];

  const rows = warranties.map((w) => [
    w.id,
    w.item,
    w.brand ?? "",
    w.model ?? "",
    w.serialNumber ?? "",
    w.purchaseDate,
    w.durationMonths,
    w.expiryDate,
    w.retailer ?? "",
    w.price ?? "",
    w.currency ?? "EUR",
    w.proofOfPurchase ?? "",
    (w.tags ?? []).join(";"),
    w.notes ?? "",
  ]);

  return (
    [headers.map(escapeCsvField).join(","), ...rows.map((r) => r.map(escapeCsvField).join(","))].join("\r\n") +
    "\r\n"
  );
}

export function exportVaultToCsv(vault: LifeVault): { documents: string; warranties: string } {
  return {
    documents: exportDocumentsToCsv(vault.documents),
    warranties: exportWarrantiesToCsv(vault.warranties),
  };
}
