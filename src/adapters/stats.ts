// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com>

import type { DocumentCategory, LifeVault } from "../core/types.ts";

export interface VaultStats {
  documentsByCategory: Record<DocumentCategory, number>;
  archivedDocumentsCount: number;
  warrantiesTotalEur: number;
  warrantiesCount: number;
  averageWarrantyMonths: number;
  proceduresCompleted: number;
  proceduresInProgress: number;
  totalChecklistSteps: number;
  completedChecklistSteps: number;
  stepsCompletionRate: number;
}

export function computeVaultStats(vault: LifeVault): VaultStats {
  const docsCat: Record<DocumentCategory, number> = {
    identity: 0,
    vehicle: 0,
    home: 0,
    work: 0,
    health: 0,
    tax_legal: 0,
    warranty: 0,
    other: 0,
  };

  let archivedCount = 0;
  for (const doc of vault.documents) {
    if (doc.archived) archivedCount++;
    if (docsCat[doc.category] !== undefined) {
      docsCat[doc.category]++;
    } else {
      docsCat.other++;
    }
  }

  let totalWarEur = 0;
  let totalMonths = 0;
  for (const w of vault.warranties) {
    if (w.price) totalWarEur += w.price;
    totalMonths += w.durationMonths;
  }
  const avgMonths = vault.warranties.length > 0 ? Math.round(totalMonths / vault.warranties.length) : 0;

  let procsCompleted = 0;
  let procsInProgress = 0;
  let totalSteps = 0;
  let completedSteps = 0;

  for (const p of vault.procedures) {
    if (p.status === "completed") procsCompleted++;
    else if (p.status === "in_progress" || p.status === "pending") procsInProgress++;

    for (const s of p.steps) {
      totalSteps++;
      if (s.completed) completedSteps++;
    }
  }

  const stepsRate = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 100;

  return {
    documentsByCategory: docsCat,
    archivedDocumentsCount: archivedCount,
    warrantiesTotalEur: totalWarEur,
    warrantiesCount: vault.warranties.length,
    averageWarrantyMonths: avgMonths,
    proceduresCompleted: procsCompleted,
    proceduresInProgress: procsInProgress,
    totalChecklistSteps: totalSteps,
    completedChecklistSteps: completedSteps,
    stepsCompletionRate: stepsRate,
  };
}
