// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com>

import { LIFEOS_SCHEMA_VERSION, LIFEOS_VERSION } from "./constants.ts";
import type {
  DocumentCategory,
  LifeDocument,
  LifeProcedure,
  LifeVault,
  Warranty,
} from "./types.ts";

export function createEmptyVault(owner?: string, nowIso: string = new Date().toISOString()): LifeVault {
  return {
    version: LIFEOS_VERSION,
    metadata: {
      createdAt: nowIso,
      lastUpdated: nowIso,
      schemaVersion: LIFEOS_SCHEMA_VERSION,
      owner,
    },
    documents: [],
    warranties: [],
    procedures: [],
  };
}

export function addDocument(vault: LifeVault, doc: LifeDocument, nowIso: string = new Date().toISOString()): LifeVault {
  const existing = vault.documents.some((d) => d.id === doc.id);
  if (existing) {
    throw new Error(`Document with ID "${doc.id}" already exists in vault.`);
  }
  return {
    ...vault,
    documents: [...vault.documents, doc],
    metadata: { ...vault.metadata, lastUpdated: nowIso },
  };
}

export function updateDocument(vault: LifeVault, doc: LifeDocument, nowIso: string = new Date().toISOString()): LifeVault {
  const index = vault.documents.findIndex((d) => d.id === doc.id);
  if (index === -1) {
    throw new Error(`Document with ID "${doc.id}" not found in vault.`);
  }
  const updatedDocs = [...vault.documents];
  updatedDocs[index] = { ...doc, updatedAt: nowIso };
  return {
    ...vault,
    documents: updatedDocs,
    metadata: { ...vault.metadata, lastUpdated: nowIso },
  };
}

export function removeDocument(vault: LifeVault, id: string, nowIso: string = new Date().toISOString()): LifeVault {
  return {
    ...vault,
    documents: vault.documents.filter((d) => d.id !== id),
    metadata: { ...vault.metadata, lastUpdated: nowIso },
  };
}

export function addWarranty(vault: LifeVault, warranty: Warranty, nowIso: string = new Date().toISOString()): LifeVault {
  const existing = vault.warranties.some((w) => w.id === warranty.id);
  if (existing) {
    throw new Error(`Warranty with ID "${warranty.id}" already exists in vault.`);
  }
  return {
    ...vault,
    warranties: [...vault.warranties, warranty],
    metadata: { ...vault.metadata, lastUpdated: nowIso },
  };
}

export function updateWarranty(vault: LifeVault, warranty: Warranty, nowIso: string = new Date().toISOString()): LifeVault {
  const index = vault.warranties.findIndex((w) => w.id === warranty.id);
  if (index === -1) {
    throw new Error(`Warranty with ID "${warranty.id}" not found in vault.`);
  }
  const updated = [...vault.warranties];
  updated[index] = { ...warranty, updatedAt: nowIso };
  return {
    ...vault,
    warranties: updated,
    metadata: { ...vault.metadata, lastUpdated: nowIso },
  };
}

export function removeWarranty(vault: LifeVault, id: string, nowIso: string = new Date().toISOString()): LifeVault {
  return {
    ...vault,
    warranties: vault.warranties.filter((w) => w.id !== id),
    metadata: { ...vault.metadata, lastUpdated: nowIso },
  };
}

export function addProcedure(vault: LifeVault, proc: LifeProcedure, nowIso: string = new Date().toISOString()): LifeVault {
  const existing = vault.procedures.some((p) => p.id === proc.id);
  if (existing) {
    throw new Error(`Procedure with ID "${proc.id}" already exists in vault.`);
  }
  return {
    ...vault,
    procedures: [...vault.procedures, proc],
    metadata: { ...vault.metadata, lastUpdated: nowIso },
  };
}

export function updateProcedure(vault: LifeVault, proc: LifeProcedure, nowIso: string = new Date().toISOString()): LifeVault {
  const index = vault.procedures.findIndex((p) => p.id === proc.id);
  if (index === -1) {
    throw new Error(`Procedure with ID "${proc.id}" not found in vault.`);
  }
  const updated = [...vault.procedures];
  updated[index] = { ...proc, updatedAt: nowIso };
  return {
    ...vault,
    procedures: updated,
    metadata: { ...vault.metadata, lastUpdated: nowIso },
  };
}

export function removeProcedure(vault: LifeVault, id: string, nowIso: string = new Date().toISOString()): LifeVault {
  return {
    ...vault,
    procedures: vault.procedures.filter((p) => p.id !== id),
    metadata: { ...vault.metadata, lastUpdated: nowIso },
  };
}

export function queryDocuments(
  vault: LifeVault,
  filter: { category?: DocumentCategory; search?: string; tag?: string }
): LifeDocument[] {
  return vault.documents.filter((doc) => {
    if (filter.category && doc.category !== filter.category) return false;
    if (filter.tag && (!doc.tags || !doc.tags.includes(filter.tag))) return false;
    if (filter.search) {
      const q = filter.search.toLowerCase();
      const matchTitle = doc.title.toLowerCase().includes(q);
      const matchIssuer = doc.issuer?.toLowerCase().includes(q) ?? false;
      const matchDocNum = doc.documentNumber?.toLowerCase().includes(q) ?? false;
      const matchNotes = doc.notes?.toLowerCase().includes(q) ?? false;
      if (!matchTitle && !matchIssuer && !matchDocNum && !matchNotes) return false;
    }
    return true;
  });
}
