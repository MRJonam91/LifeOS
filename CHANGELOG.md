# Changelog — LifeOS

Tutte le modifiche rilevanti a questo progetto saranno documentate in questo file. /
All notable changes to this project will be documented in this file.

Il formato è basato su [Keep a Changelog](https://keepachangelog.com/it/1.0.0/)
e questo progetto aderisce a [Semantic Versioning](https://semver.org/lang/it/).

---

## [1.0.0] - 2026-11-06

### 🇮🇹 Aggiunto
- **Core Domain & Modello Dati**: Gestione di documenti personali, identità, veicoli, casa, salute, garanzie commerciali e pratiche amministrative (`src/core/types.ts`).
- **Motore di Scadenze & Urgenza**: Calcolo dei giorni residui, classificazione temporale (`overdue`, `urgent`, `soon`, `upcoming`, `future`) e sintesi del cruscotto (`src/core/deadlines.ts`).
- **Warranty Tracker**: Gestione automatica della durata biennale di legge (24 mesi) e tracciamento prove d'acquisto (`src/core/warranties.ts`).
- **Pratiche & Procedure a Step**: Monitoraggio dell'avanzamento con checklist per pratiche della Pubblica Amministrazione (es. rinnovo passaporto, cambio residenza) (`src/core/procedures.ts`).
- **Validazione Dati Rigorosa**: Validazione strutturale e temporale (`src/core/validator.ts`).
- **Dataset Pilota Realistico**: Scenari completi predefiniti per test immediati in locale (`src/core/fixtures.ts`).
- **Interfaccia CLI**: Comandi `dashboard`, `doc`, `warranty`, `task`, `export`, `demo`, con supporto colori ANSI e visualizzazione timeline (`src/cli/index.ts`).
- **Esportatori Aperti**:
  - Feed iCalendar (`.ics`) conforme RFC 5545 con allerte a 7 giorni e al giorno di scadenza (`src/adapters/ical.ts`).
  - Esportatore CSV conforme per fogli di calcolo (`src/adapters/csv.ts`).
  - Report dashboard HTML standalone a zero CDN (`src/adapters/html.ts`).
  - Backup e ripristino JSON atomico (`src/adapters/backup.ts`).
- **Suite di Test**: 18 test unitari su runtime nativo Node.js (`test/*.test.ts`).
- **Integrità & Provenienza**: Registrazione marcatori anti-plagio in `_provenance/LifeOS.json`.
- **Licenza & Governance**: Modello a doppia licenza (AGPL-3.0-only + commerciale), CLA, Codice di Condotta e Security Policy con disclosure coordinata a 90 giorni.

### 🇬🇧 Added
- **Core Domain & Data Model**: Personal documents, IDs, vehicle papers, home contracts, health cards, warranties, and bureaucratic procedures.
- **Deadline & Urgency Engine**: Accurate countdowns, urgency stages (`overdue`, `urgent`, `soon`, `upcoming`, `future`), and dashboard aggregation.
- **Warranty Lifecycle**: Automatic 24-month statutory calculation and proof-of-purchase references.
- **Administrative Procedures**: Step checklist tracking with completion percentages and due dates.
- **Deterministic Schema Validator**: Strict date formats and integrity rule checking.
- **Realistic Pilot Dataset**: Pre-populated pilot fixtures for immediate local trials.
- **Rich CLI**: Commands for dashboard overview, document/warranty/task management, and export.
- **Open Standards Adapters**: RFC 5545 iCalendar feed, CSV exports, self-contained HTML offline report, JSON backup.
- **Unit Test Suite**: 18 passing tests with native Node.js test runner.
- **Licensing & Governance**: AGPL-3.0-only dual license, CLA, Code of Conduct, and Security Policy.
