// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com>

import assert from "node:assert/strict";
import test from "node:test";
import {
  completeStep,
  computeProcedureProgress,
  createProcedure,
} from "../src/index.ts";

test("createProcedure and computeProcedureProgress calculate step completion", () => {
  const proc = createProcedure({
    title: "Passport Renewal",
    category: "identity",
    steps: [
      { id: "step_1", title: "Book appointment", completed: true },
      { id: "step_2", title: "Pay fee", completed: false },
    ],
  });

  assert.equal(proc.status, "in_progress");
  const prog1 = computeProcedureProgress(proc);
  assert.equal(prog1.total, 2);
  assert.equal(prog1.completed, 1);
  assert.equal(prog1.percentage, 50);

  const updated = completeStep(proc, "step_2");
  assert.equal(updated.status, "completed");
  const prog2 = computeProcedureProgress(updated);
  assert.equal(prog2.completed, 2);
  assert.equal(prog2.percentage, 100);
});
