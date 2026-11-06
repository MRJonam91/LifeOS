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

  assert.ok(output.includes("lifeos v1.1.0-alpha"));
});

test("CLI audit prints tripartite report", () => {
  const output = execSync("node dist/cli/index.js audit", {
    env: { ...process.env, NO_SPONSOR: "1" },
    encoding: "utf8",
  });

  assert.ok(output.includes("LifeOS Tripartite Integrity Audit"));
  assert.ok(output.includes("1. Observed Verifiable Facts:"));
  assert.ok(output.includes("2. Estimated Indicators:"));
  assert.ok(output.includes("3. Required Human Decisions"));
});

test("CLI search finds keywords across entities", () => {
  const output = execSync("node dist/cli/index.js search passaporto", {
    env: { ...process.env, NO_SPONSOR: "1" },
    encoding: "utf8",
  });

  assert.ok(output.includes("Search Results for \"passaporto\""));
  assert.ok(output.includes("[DOCUMENT]"));
  assert.ok(output.includes("[PROCEDURE]"));
});

test("CLI export --format=md generates markdown output", () => {
  const output = execSync("node dist/cli/index.js export --format=md", {
    env: { ...process.env, NO_SPONSOR: "1" },
    encoding: "utf8",
  });

  assert.ok(output.includes("# LifeOS — Personal Administrative Dossier"));
  assert.ok(output.includes("## 📊 Executive Overview"));
});

