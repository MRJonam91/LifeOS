// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com>

import assert from "node:assert/strict";
import test from "node:test";
import {
  createPilotVault,
  isValidDateString,
  validateDocument,
  validateProcedure,
  validateVault,
  validateWarranty,
} from "../src/index.ts";

test("isValidDateString accepts valid ISO dates and rejects bad dates", () => {
  assert.equal(isValidDateString("2026-11-06"), true);
  assert.equal(isValidDateString("2024-02-29"), true); // leap year
  assert.equal(isValidDateString("2023-02-29"), false); // not leap year
  assert.equal(isValidDateString("2026-13-01"), false); // invalid month
  assert.equal(isValidDateString("bad-date"), false);
  assert.equal(isValidDateString(null), false);
});

test("validateDocument validates correct and incorrect documents", () => {
  const validDoc = {
    id: "doc_1",
    title: "Passport",
    category: "identity" as const,
    expiryDate: "2030-01-01",
    issueDate: "2020-01-01",
  };
  assert.deepEqual(validateDocument(validDoc), []);

  const invalidDoc = {
    id: "",
    title: "",
    category: "unknown_category" as any,
    expiryDate: "not-a-date",
  };
  const errors = validateDocument(invalidDoc);
  assert.ok(errors.length >= 3);
});

test("validateWarranty validates warranty objects", () => {
  const validWar = {
    id: "war_1",
    item: "Laptop",
    purchaseDate: "2025-01-01",
    durationMonths: 24,
    expiryDate: "2027-01-01",
  };
  assert.deepEqual(validateWarranty(validWar), []);

  const invalidWar = {
    id: "",
    item: "",
    purchaseDate: "invalid",
    durationMonths: -5,
  };
  assert.ok(validateWarranty(invalidWar).length >= 4);
});

test("validateProcedure validates procedure structure and duplicate step IDs", () => {
  const proc = {
    id: "proc_1",
    title: "Passport Renewal",
    category: "identity" as const,
    steps: [
      { id: "s1", title: "Step 1", completed: false },
      { id: "s2", title: "Step 2", completed: true },
    ],
  };
  assert.deepEqual(validateProcedure(proc), []);

  const duplicateStepProc = {
    id: "proc_dup",
    title: "Duplicate steps",
    category: "identity" as const,
    steps: [
      { id: "s1", title: "Step 1", completed: false },
      { id: "s1", title: "Step 1 duplicate", completed: false },
    ],
  };
  const dupErrors = validateProcedure(duplicateStepProc);
  assert.ok(dupErrors.some((e) => e.includes("duplicate step id")));
});

test("validateVault accepts standard pilot vault", () => {
  const vault = createPilotVault();
  const res = validateVault(vault);
  assert.equal(res.valid, true);
  assert.equal(res.errors.length, 0);
});
