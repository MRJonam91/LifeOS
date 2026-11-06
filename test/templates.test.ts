// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com>

import assert from "node:assert/strict";
import test from "node:test";
import { BUILTIN_PROCEDURE_TEMPLATES, instantiateProcedureTemplate } from "../src/core/templates.ts";
import { validateProcedure } from "../src/core/validator.ts";

test("templates: all built-in templates instantiate into valid procedures", () => {
  const keys = Object.keys(BUILTIN_PROCEDURE_TEMPLATES);
  assert.ok(keys.length >= 4);

  for (const key of keys) {
    const proc = instantiateProcedureTemplate(key, "2026-11-06");
    assert.ok(proc.id.startsWith("proc_"));
    assert.ok(proc.steps.length > 0);
    assert.ok(proc.targetDeadline);
    const errors = validateProcedure(proc);
    assert.equal(errors.length, 0, `Template ${key} should have 0 validation errors`);
  }
});

test("templates: throws on unknown template key", () => {
  assert.throws(
    () => instantiateProcedureTemplate("non-existent-template"),
    /Unknown procedure template/
  );
});
