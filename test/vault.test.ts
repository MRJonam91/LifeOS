// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com>

import assert from "node:assert/strict";
import test from "node:test";
import {
  addDocument,
  addProcedure,
  addWarranty,
  createEmptyVault,
  queryDocuments,
  removeDocument,
  updateDocument,
} from "../src/index.ts";

test("Vault CRUD operations for documents, warranties, and procedures", () => {
  let vault = createEmptyVault("Test Owner");
  assert.equal(vault.documents.length, 0);

  const doc = {
    id: "doc_test",
    title: "National ID",
    category: "identity" as const,
    expiryDate: "2030-01-01",
    createdAt: "2026-11-06T00:00:00.000Z",
    updatedAt: "2026-11-06T00:00:00.000Z",
  };

  vault = addDocument(vault, doc);
  assert.equal(vault.documents.length, 1);
  assert.throws(() => addDocument(vault, doc), /already exists/);

  vault = updateDocument(vault, { ...doc, title: "Updated National ID" });
  assert.equal(vault.documents[0]?.title, "Updated National ID");

  const results = queryDocuments(vault, { search: "National" });
  assert.equal(results.length, 1);

  vault = removeDocument(vault, "doc_test");
  assert.equal(vault.documents.length, 0);
});

test("addWarranty and addProcedure work smoothly", () => {
  let vault = createEmptyVault();

  const war = {
    id: "war_1",
    item: "Smartphone",
    purchaseDate: "2025-01-01",
    durationMonths: 24,
    expiryDate: "2027-01-01",
    createdAt: "2026-11-06T00:00:00.000Z",
    updatedAt: "2026-11-06T00:00:00.000Z",
  };

  vault = addWarranty(vault, war);
  assert.equal(vault.warranties.length, 1);

  const proc = {
    id: "proc_1",
    title: "Tax Filing",
    category: "tax_legal" as const,
    status: "pending" as const,
    steps: [],
    createdAt: "2026-11-06T00:00:00.000Z",
    updatedAt: "2026-11-06T00:00:00.000Z",
  };

  vault = addProcedure(vault, proc);
  assert.equal(vault.procedures.length, 1);
});
