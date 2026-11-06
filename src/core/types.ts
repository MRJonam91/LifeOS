// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com>

import type { SUPPORTED_DOCUMENT_CATEGORIES } from "./constants.ts";

export type DocumentCategory = (typeof SUPPORTED_DOCUMENT_CATEGORIES)[number];

export type DocumentStatus = "active" | "expiring_soon" | "expired" | "archived";

export interface LifeDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  documentNumber?: string;
  issuer?: string;
  holder?: string;
  issueDate?: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  warningDays?: number; // Days in advance to trigger alert (defaults to 30)
  storageLocation?: string; // e.g. "Studio - Cassetto Rosso", "Safe Box", "Local PDF"
  notes?: string;
  tags?: string[];
  archived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type WarrantyStatus = "active" | "expiring_soon" | "expired";

export interface Warranty {
  id: string;
  item: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate: string; // YYYY-MM-DD
  durationMonths: number; // e.g. 24 for standard EU consumer warranty
  expiryDate: string; // YYYY-MM-DD
  retailer?: string;
  price?: number;
  currency?: string;
  proofOfPurchase?: string; // Receipt / invoice reference or scan name
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProcedureStep {
  id: string;
  title: string;
  dueDate?: string; // YYYY-MM-DD
  completed: boolean;
  completedAt?: string;
  notes?: string;
  requiredDocIds?: string[];
}

export type ProcedureStatus = "pending" | "in_progress" | "completed" | "blocked" | "abandoned";

export interface LifeProcedure {
  id: string;
  title: string;
  category: DocumentCategory;
  status: ProcedureStatus;
  targetDeadline?: string; // YYYY-MM-DD
  steps: ProcedureStep[];
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LifeVaultMetadata {
  createdAt: string;
  lastUpdated: string;
  schemaVersion: string;
  owner?: string;
}

export interface LifeVault {
  version: string;
  metadata: LifeVaultMetadata;
  documents: LifeDocument[];
  warranties: Warranty[];
  procedures: LifeProcedure[];
}

export type UrgencyLevel = "overdue" | "urgent" | "soon" | "upcoming" | "future";

export interface DeadlineItem {
  id: string;
  entityType: "document" | "warranty" | "procedure" | "procedure_step";
  title: string;
  category: DocumentCategory;
  date: string; // YYYY-MM-DD
  daysRemaining: number;
  urgency: UrgencyLevel;
  status: string;
  parentTitle?: string;
  notes?: string;
}

export interface LifeDashboardSummary {
  today: string;
  totalDocuments: number;
  activeDocuments: number;
  expiringDocumentsCount: number;
  expiredDocumentsCount: number;
  totalWarranties: number;
  activeWarrantiesCount: number;
  expiredWarrantiesCount: number;
  totalProcedures: number;
  inProgressProceduresCount: number;
  completedProceduresCount: number;
  urgentCount: number;
  soonCount: number;
  overdueCount: number;
  deadlines: DeadlineItem[];
}

export type AuditSeverity = "info" | "warning" | "critical";

export interface LifeAuditIssue {
  severity: AuditSeverity;
  category: "document" | "warranty" | "procedure" | "integrity";
  targetId: string;
  targetTitle: string;
  message: string;
  actionRequired: string;
}

export interface LifeAuditReport {
  timestamp: string;
  referenceDate: string;
  observedFacts: {
    totalDocuments: number;
    totalWarranties: number;
    totalProcedures: number;
    verifiedReceiptsCount: number;
    completedStepsCount: number;
  };
  estimatedIndicators: {
    activeWarrantiesValueEur: number;
    averageProcedureCompletionRate: number;
    upcomingDeadlinesNext90d: number;
  };
  requiredHumanDecisions: LifeAuditIssue[];
  healthScore: number; // 0-100%
}

export interface SearchMatch {
  entityType: "document" | "warranty" | "procedure";
  id: string;
  title: string;
  category: DocumentCategory;
  details: string;
  score: number;
}

