// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com>

import assert from "node:assert/strict";
import test from "node:test";
import { diffVaults, formatVaultDiff } from "../src/adapters/diff.ts";
import { createPilotVault } from "../src/core/fixtures.ts";
import { addDocument, removeWarranty, updateDocument } from "../src/core/vault.ts";

test("diff: detects added, modified, and removed items between vaults", () => {
  const oldVault = createPilotVault();
  let newVault = createPilotVault();

  // Add document
  newVault = addDocument(newVault, {
    id: "doc_new",
    title: "New Certificate",
    category: "work",
    expiryDate: "2030-01-01",
    createdAt: "2026-11-06T00:00:00.000Z",
    updatedAt: "2026-11-06T00:00:00.000Z",
  });

  // Modify document
  const docToMod = newVault.documents.find((d) => d.id === "doc_cie_01")!;
  newVault = updateDocument(newVault, { ...docToMod, title: "CIE Aggiornata" });

  // Remove warranty
  newVault = removeWarranty(newVault, "war_macbook_01");

  const diff = diffVaults(oldVault, newVault);
  assert.equal(diff.hasChanges, true);
  assert.equal(diff.documents.added.length, 1);
  assert.equal(diff.documents.modified.length, 1);
  assert.equal(diff.warranties.removed.length, 1);

  const formatted = formatVaultDiff(diff);
  assert.ok(formatted.includes("+ ADDED:    New Certificate"));
  assert.ok(formatted.includes("~ MODIFIED: CIE Aggiornata"));
  assert.ok(formatted.includes("- REMOVED:  MacBook Pro 14 M3 Pro"));
});

test("diff: returns no changes when comparing identical vaults", () => {
  const vault1 = createPilotVault();
  const vault2 = createPilotVault();

  const diff = diffVaults(vault1, vault2);
  assert.equal(diff.hasChanges, false);
  const formatted = formatVaultDiff(diff);
  assert.equal(formatted, "No changes detected between vaults.");
});
