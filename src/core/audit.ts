// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com>

import { calculateDaysRemaining, getTodayIso } from "./deadlines.ts";
import { computeProcedureProgress } from "./procedures.ts";
import type { LifeAuditIssue, LifeAuditReport, LifeVault } from "./types.ts";

export function performVaultAudit(vault: LifeVault, referenceDate: string = getTodayIso()): LifeAuditReport {
  const issues: LifeAuditIssue[] = [];

  let verifiedReceiptsCount = 0;
  let activeWarrantiesValueEur = 0;

  for (const doc of vault.documents) {
    if (doc.archived) continue;
    const days = calculateDaysRemaining(doc.expiryDate, referenceDate);
    if (days < 0) {
      issues.push({
        severity: "critical",
        category: "document",
        targetId: doc.id,
        targetTitle: doc.title,
        message: `Document expired ${Math.abs(days)} days ago (${doc.expiryDate})`,
        actionRequired: "Renew document immediately or mark as archived if no longer valid",
      });
    } else if (days <= (doc.warningDays ?? 30)) {
      issues.push({
        severity: "warning",
        category: "document",
        targetId: doc.id,
        targetTitle: doc.title,
        message: `Document expires in ${days} days (${doc.expiryDate})`,
        actionRequired: "Initiate renewal process or schedule required medical/consular appointment",
      });
    }
  }

  for (const w of vault.warranties) {
    if (w.proofOfPurchase) {
      verifiedReceiptsCount++;
    } else {
      issues.push({
        severity: "warning",
        category: "warranty",
        targetId: w.id,
        targetTitle: w.item,
        message: "Missing proof of purchase reference (receipt / invoice / order number)",
        actionRequired: "Attach proof of purchase reference to guarantee statutory claim rights",
      });
    }

    const days = calculateDaysRemaining(w.expiryDate, referenceDate);
    if (days < 0) {
      issues.push({
        severity: "info",
        category: "warranty",
        targetId: w.id,
        targetTitle: w.item,
        message: `Statutory warranty expired ${Math.abs(days)} days ago (${w.expiryDate})`,
        actionRequired: "Archive or verify if extended manufacturer care plan is active",
      });
    } else {
      if (w.price) {
        activeWarrantiesValueEur += w.price;
      }
    }
  }

  let totalStepsCount = 0;
  let completedStepsCount = 0;
  let totalProcedureProgressSum = 0;

  for (const proc of vault.procedures) {
    if (proc.status === "completed" || proc.status === "abandoned") continue;
    const progress = computeProcedureProgress(proc);
    totalStepsCount += progress.total;
    completedStepsCount += progress.completed;
    totalProcedureProgressSum += progress.percentage;

    for (const step of proc.steps) {
      if (step.completed) continue;

      if (step.dueDate) {
        const stepDays = calculateDaysRemaining(step.dueDate, referenceDate);
        if (stepDays < 0) {
          issues.push({
            severity: "critical",
            category: "procedure",
            targetId: `${proc.id}:${step.id}`,
            targetTitle: `${proc.title} → ${step.title}`,
            message: `Procedure step overdue by ${Math.abs(stepDays)} days (${step.dueDate})`,
            actionRequired: "Complete step or reschedule due date",
          });
        }
      }

      if (step.requiredDocIds && step.requiredDocIds.length > 0) {
        for (const docId of step.requiredDocIds) {
          const doc = vault.documents.find((d) => d.id === docId);
          if (!doc) {
            issues.push({
              severity: "critical",
              category: "integrity",
              targetId: `${proc.id}:${step.id}`,
              targetTitle: `${proc.title} → ${step.title}`,
              message: `Required document "${docId}" is missing from vault`,
              actionRequired: "Add required document to vault before attending procedure appointment",
            });
          } else {
            const docDays = calculateDaysRemaining(doc.expiryDate, referenceDate);
            if (docDays < 0) {
              issues.push({
                severity: "critical",
                category: "integrity",
                targetId: `${proc.id}:${step.id}`,
                targetTitle: `${proc.title} → ${step.title}`,
                message: `Required document "${doc.title}" is already expired (${doc.expiryDate})`,
                actionRequired: `Renew ${doc.title} first as it is required for this procedure`,
              });
            }
          }
        }
      }
    }
  }

  const upcomingDeadlinesNext90d = vault.documents
    .concat()
    .filter((d) => !d.archived)
    .filter((d) => {
      const days = calculateDaysRemaining(d.expiryDate, referenceDate);
      return days >= 0 && days <= 90;
    }).length;

  const averageProcedureCompletionRate =
    vault.procedures.length > 0 ? Math.round(totalProcedureProgressSum / vault.procedures.length) : 100;

  let penalty = 0;
  for (const iss of issues) {
    if (iss.severity === "critical") penalty += 20;
    else if (iss.severity === "warning") penalty += 5;
    else penalty += 1;
  }
  const healthScore = Math.max(0, Math.min(100, 100 - penalty));

  return {
    timestamp: new Date().toISOString(),
    referenceDate,
    observedFacts: {
      totalDocuments: vault.documents.length,
      totalWarranties: vault.warranties.length,
      totalProcedures: vault.procedures.length,
      verifiedReceiptsCount,
      completedStepsCount,
    },
    estimatedIndicators: {
      activeWarrantiesValueEur,
      averageProcedureCompletionRate,
      upcomingDeadlinesNext90d,
    },
    requiredHumanDecisions: issues,
    healthScore,
  };
}
