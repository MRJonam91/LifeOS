// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com>

import assert from "node:assert/strict";
import test from "node:test";
import { performVaultAudit } from "../src/core/audit.ts";
import { createPilotVault } from "../src/core/fixtures.ts";
import { addDocument, addProcedure, createEmptyVault } from "../src/core/vault.ts";

test("audit: evaluates pilot vault with realistic health score", () => {
  const vault = createPilotVault();
  const report = performVaultAudit(vault, "2026-11-06");

  assert.ok(report.healthScore >= 50 && report.healthScore <= 100);
  assert.equal(report.observedFacts.totalDocuments, 6);
  assert.equal(report.observedFacts.totalWarranties, 2);
  assert.equal(report.observedFacts.verifiedReceiptsCount, 2);
  assert.ok(report.estimatedIndicators.activeWarrantiesValueEur > 0);
  assert.ok(Array.isArray(report.requiredHumanDecisions));
});

test("audit: catches expired documents and missing prerequisite documents in procedures", () => {
  let vault = createEmptyVault("Audit Test");

  const expiredDoc = {
    id: "doc_expired",
    title: "Old Passport",
    category: "identity" as const,
    expiryDate: "2020-01-01",
    createdAt: "2026-11-06T00:00:00.000Z",
    updatedAt: "2026-11-06T00:00:00.000Z",
  };
  vault = addDocument(vault, expiredDoc);

  const procWithMissingDoc = {
    id: "proc_test",
    title: "Visa Application",
    category: "identity" as const,
    status: "in_progress" as const,
    steps: [
      {
        id: "step_1",
        title: "Submit Biometrics",
        dueDate: "2026-11-15",
        completed: false,
        requiredDocIds: ["doc_nonexistent", "doc_expired"],
      },
    ],
    createdAt: "2026-11-06T00:00:00.000Z",
    updatedAt: "2026-11-06T00:00:00.000Z",
  };
  vault = addProcedure(vault, procWithMissingDoc);

  const report = performVaultAudit(vault, "2026-11-06");

  const missingIssue = report.requiredHumanDecisions.find((d) => d.message.includes("doc_nonexistent"));
  assert.ok(missingIssue, "Should report missing prerequisite document");
  assert.equal(missingIssue.severity, "critical");

  const expiredPrereq = report.requiredHumanDecisions.find(
    (d) => d.targetId === "proc_test:step_1" && d.message.includes("Old Passport")
  );
  assert.ok(expiredPrereq, "Should report expired prerequisite document");
  assert.equal(expiredPrereq.severity, "critical");
});
