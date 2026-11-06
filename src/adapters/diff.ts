// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com>

import type { LifeVault } from "../core/types.ts";

export interface VaultDiffResult {
  hasChanges: boolean;
  documents: {
    added: string[];
    removed: string[];
    modified: string[];
  };
  warranties: {
    added: string[];
    removed: string[];
    modified: string[];
  };
  procedures: {
    added: string[];
    removed: string[];
    modified: string[];
  };
}

export function diffVaults(oldVault: LifeVault, newVault: LifeVault): VaultDiffResult {
  const docOldMap = new Map(oldVault.documents.map((d) => [d.id, d]));
  const docNewMap = new Map(newVault.documents.map((d) => [d.id, d]));

  const docAdded: string[] = [];
  const docRemoved: string[] = [];
  const docModified: string[] = [];

  for (const [id, newDoc] of docNewMap) {
    const oldDoc = docOldMap.get(id);
    if (!oldDoc) {
      docAdded.push(`${newDoc.title} (${id})`);
    } else if (JSON.stringify(oldDoc) !== JSON.stringify(newDoc)) {
      docModified.push(`${newDoc.title} (${id})`);
    }
  }
  for (const [id, oldDoc] of docOldMap) {
    if (!docNewMap.has(id)) {
      docRemoved.push(`${oldDoc.title} (${id})`);
    }
  }

  const warOldMap = new Map(oldVault.warranties.map((w) => [w.id, w]));
  const warNewMap = new Map(newVault.warranties.map((w) => [w.id, w]));

  const warAdded: string[] = [];
  const warRemoved: string[] = [];
  const warModified: string[] = [];

  for (const [id, newWar] of warNewMap) {
    const oldWar = warOldMap.get(id);
    if (!oldWar) {
      warAdded.push(`${newWar.item} (${id})`);
    } else if (JSON.stringify(oldWar) !== JSON.stringify(newWar)) {
      warModified.push(`${newWar.item} (${id})`);
    }
  }
  for (const [id, oldWar] of warOldMap) {
    if (!warNewMap.has(id)) {
      warRemoved.push(`${oldWar.item} (${id})`);
    }
  }

  const procOldMap = new Map(oldVault.procedures.map((p) => [p.id, p]));
  const procNewMap = new Map(newVault.procedures.map((p) => [p.id, p]));

  const procAdded: string[] = [];
  const procRemoved: string[] = [];
  const procModified: string[] = [];

  for (const [id, newProc] of procNewMap) {
    const oldProc = procOldMap.get(id);
    if (!oldProc) {
      procAdded.push(`${newProc.title} (${id})`);
    } else if (JSON.stringify(oldProc) !== JSON.stringify(newProc)) {
      procModified.push(`${newProc.title} (${id})`);
    }
  }
  for (const [id, oldProc] of procOldMap) {
    if (!procNewMap.has(id)) {
      procRemoved.push(`${oldProc.title} (${id})`);
    }
  }

  const hasChanges =
    docAdded.length > 0 ||
    docRemoved.length > 0 ||
    docModified.length > 0 ||
    warAdded.length > 0 ||
    warRemoved.length > 0 ||
    warModified.length > 0 ||
    procAdded.length > 0 ||
    procRemoved.length > 0 ||
    procModified.length > 0;

  return {
    hasChanges,
    documents: { added: docAdded, removed: docRemoved, modified: docModified },
    warranties: { added: warAdded, removed: warRemoved, modified: warModified },
    procedures: { added: procAdded, removed: procRemoved, modified: procModified },
  };
}

export function formatVaultDiff(diff: VaultDiffResult): string {
  if (!diff.hasChanges) {
    return "No changes detected between vaults.";
  }

  const lines: string[] = ["=== LifeOS Vault Comparison ==="];

  if (diff.documents.added.length || diff.documents.removed.length || diff.documents.modified.length) {
    lines.push("\n[Documents]");
    diff.documents.added.forEach((x) => lines.push(`  + ADDED:    ${x}`));
    diff.documents.modified.forEach((x) => lines.push(`  ~ MODIFIED: ${x}`));
    diff.documents.removed.forEach((x) => lines.push(`  - REMOVED:  ${x}`));
  }

  if (diff.warranties.added.length || diff.warranties.removed.length || diff.warranties.modified.length) {
    lines.push("\n[Warranties]");
    diff.warranties.added.forEach((x) => lines.push(`  + ADDED:    ${x}`));
    diff.warranties.modified.forEach((x) => lines.push(`  ~ MODIFIED: ${x}`));
    diff.warranties.removed.forEach((x) => lines.push(`  - REMOVED:  ${x}`));
  }

  if (diff.procedures.added.length || diff.procedures.removed.length || diff.procedures.modified.length) {
    lines.push("\n[Procedures]");
    diff.procedures.added.forEach((x) => lines.push(`  + ADDED:    ${x}`));
    diff.procedures.modified.forEach((x) => lines.push(`  ~ MODIFIED: ${x}`));
    diff.procedures.removed.forEach((x) => lines.push(`  - REMOVED:  ${x}`));
  }

  return lines.join("\n");
}
