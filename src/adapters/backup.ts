// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com>

import { readFileSync, writeFileSync } from "node:fs";
import type { LifeVault } from "../core/types.ts";
import { validateVault } from "../core/validator.ts";

export function exportVaultToJson(vault: LifeVault, indent: number = 2): string {
  const result = validateVault(vault);
  if (!result.valid) {
    throw new Error(`Cannot export invalid vault: ${result.errors.join(", ")}`);
  }
  return JSON.stringify(vault, null, indent);
}

export function importVaultFromJson(jsonString: string): LifeVault {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    throw new Error(`Malformed JSON string: ${err instanceof Error ? err.message : String(err)}`);
  }

  const result = validateVault(parsed);
  if (!result.valid) {
    throw new Error(`Invalid vault schema: ${result.errors.join(", ")}`);
  }
  return parsed as LifeVault;
}

export function saveVaultToFile(vault: LifeVault, filePath: string): void {
  const content = exportVaultToJson(vault);
  writeFileSync(filePath, content, "utf8");
}

export function loadVaultFromFile(filePath: string): LifeVault {
  const raw = readFileSync(filePath, "utf8");
  return importVaultFromJson(raw);
}
