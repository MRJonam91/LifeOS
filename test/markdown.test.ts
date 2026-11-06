// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com>

import assert from "node:assert/strict";
import test from "node:test";
import { exportVaultToMarkdown } from "../src/adapters/markdown.ts";
import { createPilotVault } from "../src/core/fixtures.ts";

test("markdown: generates structured personal dossier with tables and checklists", () => {
  const vault = createPilotVault();
  const md = exportVaultToMarkdown(vault, "2026-11-06");

  assert.ok(md.startsWith("# LifeOS — Personal Administrative Dossier"));
  assert.ok(md.includes("## 📊 Executive Overview"));
  assert.ok(md.includes("## ⏳ Priority Timeline & Upcoming Deadlines"));
  assert.ok(md.includes("## 🗂️ Personal Document Vault"));
  assert.ok(md.includes("Carta d'Identità Elettronica (CIE)"));
  assert.ok(md.includes("## 🛡️ Statutory Warranties"));
  assert.ok(md.includes("MacBook Pro 14 M3 Pro"));
  assert.ok(md.includes("## 📋 Administrative Procedures & Paperwork"));
  assert.ok(md.includes("[x] **Prenotare appuntamento su Agenda Passaporti con SPID**"));
  assert.ok(md.includes("[ ] **Pagare bollettino postale di 42,50€ per libretto passaporto**"));
});
