// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com>

import assert from "node:assert/strict";
import test from "node:test";
import { generatePeriodicDigest } from "../src/adapters/digest.ts";
import { createPilotVault } from "../src/core/fixtures.ts";

test("digest: formats plain text digest correctly", () => {
  const vault = createPilotVault();
  const digest = generatePeriodicDigest(vault, { horizonDays: 30, format: "text", referenceDate: "2026-11-06" });

  assert.ok(digest.includes("LifeOS Daily Digest"));
  assert.ok(digest.includes("OVERDUE ITEMS") || digest.includes("UPCOMING"));
  assert.ok(digest.includes("PAPERWORK IN PROGRESS"));
});

test("digest: formats markdown digest with headers and badges", () => {
  const vault = createPilotVault();
  const digest = generatePeriodicDigest(vault, { horizonDays: 30, format: "markdown", referenceDate: "2026-11-06" });

  assert.ok(digest.startsWith("# 🔔 LifeOS Digest"));
  assert.ok(digest.includes("### 📋 Active Procedures & Next Steps"));
});
