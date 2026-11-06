// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com>

import assert from "node:assert/strict";
import test from "node:test";
import {
  createPilotVault,
  exportDocumentsToCsv,
  exportProceduresToCsv,
  exportVaultToCsv,
  exportVaultToHtml,
  exportVaultToIcal,
  exportVaultToJson,
  exportWarrantiesToCsv,
  importVaultFromJson,
} from "../src/index.ts";

test("exportVaultToIcal generates valid RFC 5545 format with VCALENDAR, VEVENT, and VALARM", () => {
  const vault = createPilotVault();
  const ics = exportVaultToIcal(vault, "2026-11-06");

  assert.ok(ics.startsWith("BEGIN:VCALENDAR"));
  assert.ok(ics.includes("VERSION:2.0"));
  assert.ok(ics.includes("BEGIN:VEVENT"));
  assert.ok(ics.includes("BEGIN:VALARM"));
  assert.ok(ics.includes("TRIGGER:-P7D"));
  assert.ok(ics.trimEnd().endsWith("END:VCALENDAR"));
});

test("CSV exports format documents, warranties, and procedures with proper headers", () => {
  const vault = createPilotVault();
  const docCsv = exportDocumentsToCsv(vault.documents);
  assert.ok(docCsv.startsWith("ID,Title,Category,DocumentNumber"));
  assert.ok(docCsv.includes("Carta d'Identità Elettronica (CIE)"));

  const warCsv = exportWarrantiesToCsv(vault.warranties);
  assert.ok(warCsv.startsWith("ID,Item,Brand,Model"));
  assert.ok(warCsv.includes("MacBook Pro 14 M3 Pro"));

  const procCsv = exportProceduresToCsv(vault.procedures);
  assert.ok(procCsv.startsWith("ProcedureID,ProcedureTitle,Category,Status"));
  assert.ok(procCsv.includes("Rinnovo e Rilascio Passaporto"));

  const allCsv = exportVaultToCsv(vault);
  assert.ok(allCsv.documents.includes("Carta d'Identità"));
  assert.ok(allCsv.warranties.includes("MacBook Pro"));
  assert.ok(allCsv.procedures.includes("Rinnovo e Rilascio Passaporto"));
});

test("exportVaultToHtml generates valid HTML document", () => {
  const vault = createPilotVault();
  const html = exportVaultToHtml(vault, "2026-11-06");

  assert.ok(html.includes("<!DOCTYPE html>"));
  assert.ok(html.includes("LifeOS Dashboard"));
  assert.ok(html.includes("Carta d&#039;Identità Elettronica (CIE)"));
  assert.ok(html.toLowerCase().includes("timeline"));
});

test("exportVaultToJson and importVaultFromJson round-trip cleanly", () => {
  const vault = createPilotVault();
  const json = exportVaultToJson(vault);
  const reimported = importVaultFromJson(json);

  assert.equal(reimported.documents.length, vault.documents.length);
  assert.equal(reimported.warranties.length, vault.warranties.length);
  assert.equal(reimported.procedures.length, vault.procedures.length);
});
