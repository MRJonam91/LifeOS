// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com>

import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import test from "node:test";

test("CLI demo prints dashboard successfully", () => {
  const output = execSync("node dist/cli/index.js demo", {
    env: { ...process.env, NO_SPONSOR: "1" },
    encoding: "utf8",
  });

  assert.ok(output.includes("LifeOS Personal Dashboard"));
  assert.ok(output.includes("Active Docs"));
  assert.ok(output.includes("Priority Timeline"));
});

test("CLI --help displays usage guide", () => {
  const output = execSync("node dist/cli/index.js --help", {
    env: { ...process.env, NO_SPONSOR: "1" },
    encoding: "utf8",
  });

  assert.ok(output.includes("Local-first Personal Operating System"));
  assert.ok(output.includes("USAGE:"));
  assert.ok(output.includes("dashboard"));
  assert.ok(output.includes("doc add"));
});

test("CLI --version displays version", () => {
  const output = execSync("node dist/cli/index.js --version", {
    env: { ...process.env, NO_SPONSOR: "1" },
    encoding: "utf8",
  });

  assert.ok(output.includes("lifeos v1.0.0"));
});
