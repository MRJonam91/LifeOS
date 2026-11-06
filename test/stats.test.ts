// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com>

import assert from "node:assert/strict";
import test from "node:test";
import { computeVaultStats } from "../src/adapters/stats.ts";
import { createPilotVault } from "../src/core/fixtures.ts";

test("stats: calculates accurate category distribution and metrics", () => {
  const vault = createPilotVault();
  const stats = computeVaultStats(vault);

  assert.ok(stats.documentsByCategory.identity >= 2);
  assert.ok(stats.documentsByCategory.vehicle >= 2);
  assert.equal(stats.warrantiesCount, 2);
  assert.ok(stats.warrantiesTotalEur > 3000);
  assert.ok(stats.averageWarrantyMonths === 24);
  assert.ok(stats.totalChecklistSteps > 0);
  assert.ok(stats.stepsCompletionRate >= 0 && stats.stepsCompletionRate <= 100);
});
