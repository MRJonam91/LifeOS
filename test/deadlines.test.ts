// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com>

import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateDaysRemaining,
  classifyUrgency,
  createPilotVault,
  generateDashboardSummary,
} from "../src/index.ts";

test("calculateDaysRemaining calculates accurate day differences", () => {
  assert.equal(calculateDaysRemaining("2026-11-10", "2026-11-06"), 4);
  assert.equal(calculateDaysRemaining("2026-11-06", "2026-11-06"), 0);
  assert.equal(calculateDaysRemaining("2026-11-01", "2026-11-06"), -5);
  assert.equal(calculateDaysRemaining("2027-11-06", "2026-11-06"), 365);
});

test("classifyUrgency classifies deadline windows accurately", () => {
  assert.equal(classifyUrgency(-1), "overdue");
  assert.equal(classifyUrgency(0), "urgent");
  assert.equal(classifyUrgency(7), "urgent");
  assert.equal(classifyUrgency(15), "soon");
  assert.equal(classifyUrgency(30), "soon");
  assert.equal(classifyUrgency(60), "upcoming");
  assert.equal(classifyUrgency(120), "future");
});

test("generateDashboardSummary aggregates deadlines across entities correctly", () => {
  const vault = createPilotVault();
  const summary = generateDashboardSummary(vault, "2026-11-06");

  assert.equal(summary.totalDocuments, 6);
  assert.equal(summary.totalWarranties, 2);
  assert.equal(summary.totalProcedures, 2);
  assert.ok(summary.deadlines.length > 0);

  // Sorted by days remaining in ascending order
  for (let i = 1; i < summary.deadlines.length; i++) {
    const prev = summary.deadlines[i - 1]!;
    const curr = summary.deadlines[i]!;
    assert.ok(prev.daysRemaining <= curr.daysRemaining);
  }
});
