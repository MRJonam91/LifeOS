// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com>

import type { DocumentCategory, LifeProcedure, ProcedureStatus, ProcedureStep } from "./types.ts";

export function computeProcedureProgress(procedure: LifeProcedure): {
  total: number;
  completed: number;
  percentage: number;
} {
  const total = procedure.steps.length;
  if (total === 0) return { total: 0, completed: 0, percentage: 100 };
  const completed = procedure.steps.filter((s) => s.completed).length;
  const percentage = Math.round((completed / total) * 100);
  return { total, completed, percentage };
}

export function createProcedure(
  input: {
    id?: string;
    title: string;
    category?: DocumentCategory;
    targetDeadline?: string;
    steps?: Array<Omit<ProcedureStep, "id"> & { id?: string }>;
    notes?: string;
    tags?: string[];
  },
  nowIso: string = new Date().toISOString()
): LifeProcedure {
  const id = input.id ?? `proc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const steps: ProcedureStep[] = (input.steps ?? []).map((s, idx) => ({
    id: s.id ?? `step_${idx + 1}`,
    title: s.title,
    dueDate: s.dueDate,
    completed: s.completed ?? false,
    completedAt: s.completed ? (s.completedAt ?? nowIso) : undefined,
    notes: s.notes,
    requiredDocIds: s.requiredDocIds,
  }));

  const allCompleted = steps.length > 0 && steps.every((s) => s.completed);
  const status: ProcedureStatus = allCompleted ? "completed" : "in_progress";

  return {
    id,
    title: input.title,
    category: input.category ?? "other",
    status,
    targetDeadline: input.targetDeadline,
    steps,
    notes: input.notes,
    tags: input.tags ?? [],
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

export function completeStep(
  procedure: LifeProcedure,
  stepId: string,
  nowIso: string = new Date().toISOString()
): LifeProcedure {
  let modified = false;
  const updatedSteps = procedure.steps.map((s) => {
    if (s.id === stepId) {
      modified = true;
      return { ...s, completed: true, completedAt: nowIso };
    }
    return s;
  });

  if (!modified) return procedure;

  const allCompleted = updatedSteps.length > 0 && updatedSteps.every((s) => s.completed);
  const status: ProcedureStatus = allCompleted ? "completed" : procedure.status;

  return {
    ...procedure,
    status,
    steps: updatedSteps,
    updatedAt: nowIso,
  };
}
