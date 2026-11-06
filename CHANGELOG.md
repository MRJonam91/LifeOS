# Changelog — LifeOS

Tutte le modifiche rilevanti a questo progetto saranno documentate in questo file. /
All notable changes to this project will be documented in this file.

Il formato è basato su [Keep a Changelog](https://keepachangelog.com/it/1.0.0/)
e questo progetto aderisce a [Semantic Versioning](https://semver.org/lang/it/).

---

## [1.0.0] - 2026-11-06 — Official Stable Release

### 🇮🇹 Aggiunto
- **Core Domain & Modello Dati Personale** (`src/core/types.ts`):
  - Gestione atomica e locale di documenti anagrafici, patenti e veicoli, contratti di locazione casa, polizze, tessere sanitarie e lavoro.
  - Tracciamento garanzie legali di conformità (24 mesi Codice del Consumo) con scontrini fiscali e numeri di serie.
  - Monitoraggio pratiche e procedimenti burocratici della Pubblica Amministrazione a step con checklist e dipendenze.
- **Motore di Scadenze & Urgenza** (`src/core/deadlines.ts`):
  - Calcolo deterministico dei giorni residui e classificazione visiva delle urgenze (`overdue`, `urgent ≤7d`, `soon ≤30d`, `upcoming ≤90d`, `future`).
- **Catalogo Template Pratiche PA** (`src/core/templates.ts`):
  - Template ministeriali pronti all'uso: `passport-renewal` (Agenda Passaporti Polizia di Stato), `residency-change` (ANPR), `driving-license-renewal` (MIT/PagoPA), `tenancy-termination` (Modello RLI e recesso).
- **Audit di Integrità Tripartito** (`src/core/audit.ts`):
  - Separazione netta tra fatti verificabili osservati, stime predittive calcolate e decisioni umane richieste (documenti scaduti, dipendenze non soddisfatte, scontrini mancanti).
  - Calcolo del *Vault Health Score* (0–100%).
- **Motore di Ricerca Rapida Multi-Entità** (`src/core/vault.ts`):
  - Ricerca cross-entità ponderata su documenti, garanzie e procedimenti per testo, matricola, note o tag.
- **Gestione del Ciclo di Vita (Archiviazione/Ripristino)**:
  - Funzioni `archiveDocument` e `restoreDocument` per conservare lo storico senza alterare le scadenze attive.
- **Interfaccia CLI Completa** (`src/cli/index.ts`):
  - Cruscotto visuale terminale ANSI (`lifeos dashboard`).
  - Gestione documenti (`doc list|view|add|archive|restore|remove`), garanzie (`warranty list|view|add|remove`) e pratiche (`task list|view|init|templates|done|add|remove`).
  - Ricerca rapida (`lifeos search`), audit (`lifeos audit`), digest periodico (`lifeos digest`), statistiche e ripartizione per categoria (`lifeos stats`), confronto snapshot (`lifeos diff`).
- **Esportatori e Standard Aperti** (`src/adapters/`):
  - Feed iCalendar conforme RFC 5545 (`.ics`) con allerte e promemoria anticipati per calendari desktop/mobile.
  - Cruscotto interattivo HTML standalone a zero CDN con supporto dark/light.
  - Fascicolo amministrativo personale in Markdown strutturato (`Dossier.md`).
  - Tabelle CSV conformi per fogli di calcolo Excel / LibreOffice.
  - Backup e ripristino JSON atomico.
- **Suite di Test**: 36 test unitari eseguiti su runtime nativo Node.js (`test/*.test.ts`) con 100% di esito positivo.
- **Conformità e Governance**: Modello a doppia licenza (AGPL-3.0-only + commerciale), CLA, Codice di Condotta e Security Policy con 90 giorni di disclosure coordinata.

### 🇬🇧 Added
- **Core Domain & Personal Administrative Model** (`src/core/types.ts`):
  - Structured local handling of IDs, passports, driver's licenses, leases, vehicle insurance, health cards, and work papers.
  - Statutory 24-month consumer warranty tracker with proof-of-purchase references and serial numbers.
  - Multi-step bureaucratic procedure tracker with actionable checklists and prerequisite validations.
- **Deadline & Urgency Engine** (`src/core/deadlines.ts`):
  - Deterministic countdown and priority classification (`overdue`, `urgent ≤7d`, `soon ≤30d`, `upcoming ≤90d`, `future`).
- **Administrative Procedure Templates** (`src/core/templates.ts`):
  - Built-in templates: `passport-renewal`, `residency-change`, `driving-license-renewal`, `tenancy-termination`.
- **Tripartite Integrity Audit** (`src/core/audit.ts`):
  - Clear segregation of observed facts, estimated indicators, and required human decisions.
  - Deterministic *Vault Health Score* (0–100%).
- **Fast Cross-Entity Search** (`src/core/vault.ts`):
  - Weighted query scoring across documents, warranties, and paperwork.
- **Document Lifecycle Management**:
  - `archiveDocument` and `restoreDocument` commands for clean active timeline separation.
- **Comprehensive CLI**:
  - ANSI visual dashboard (`dashboard`), document/warranty/task management, multi-entity search (`search`), audit (`audit`), alert digests (`digest`), analytics breakdown (`stats`), and version comparison (`diff`).
- **Open Standards Adapters**:
  - RFC 5545 iCalendar (`.ics`) feed with multi-stage alarms.
  - Standalone zero-CDN offline HTML dashboard report.
  - Master Markdown dossier generation (`.md`).
  - Standard CSV exports and atomic JSON backups.
- **Test Suite**: 36 unit tests passing with Node.js built-in test runner.
- **Licensing & Governance**: AGPL-3.0-only dual license, CLA, Code of Conduct, and Security Policy.
