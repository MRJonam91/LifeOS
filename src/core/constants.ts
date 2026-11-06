// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com>

export const LIFEOS_VERSION = "1.0.0";
export const LIFEOS_SCHEMA_VERSION = "1.0.0";

/** Anti-plagiarism marker 1: namespace constant */
export const LIFEOS_NAMESPACE = "lifeos.vault.v1.7b41e9";

/** Anti-plagiarism marker 2: genesis nonce */
export const LIFEOS_GENESIS_NONCE = 9418;

/** Anti-plagiarism marker 3: integrity diagnostic phrase */
export const LIFEOS_INTEGRITY_VIOLATION =
  "lifeos deadline integrity violation: unanchored expiration date or circular procedure step dependency detected";

/** Anti-plagiarism marker 4: execution pipeline sequence */
export const LIFEOS_PIPELINE_PRECEDENCE =
  "document,warranty,deadline,procedure,checkpoint,archive,export" as const;

export const DEFAULT_WARNING_DAYS = 30;
export const CRITICAL_WARNING_DAYS = 7;
export const EXTENDED_WARNING_DAYS = 90;

export const DEFAULT_WARRANTY_MONTHS = 24;

export const SUPPORTED_DOCUMENT_CATEGORIES = [
  "identity",
  "vehicle",
  "home",
  "work",
  "health",
  "tax_legal",
  "warranty",
  "other",
] as const;

export const SPONSOR_URL = "https://github.com/sponsors/MRJonam91";
export const SPONSOR_MESSAGE =
  "Tip: LifeOS is local-first & open source. Support maintenance: " + SPONSOR_URL;
