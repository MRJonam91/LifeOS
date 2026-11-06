# Piano di Sviluppo / Roadmap — LifeOS

[Italiano](ROADMAP.md) · [English](ROADMAP.md) · [Architettura](ARCHITECTURE.md) · [Checklist Lancio](LAUNCH.md)

---

## 🇮🇹 Piano di Sviluppo

### ✅ Versione 1.0.0 — Rilascio Stabile Ufficiale (Corrente)
- **Modello Dati Personale & Pratiche**: Documenti di identità, veicoli, casa, salute, lavoro, imposte e garanzie.
- **Registro Deterministico Locale**: Archiviazione JSON atomica con validazione rigorosa dei tipi (`src/core/validator.ts`).
- **Deadline Engine**: Calcolo accurato di giorni rimanenti, finestre di preavviso e classificazione visiva delle urgenze (`overdue`, `urgent ≤7d`, `soon ≤30d`, `upcoming ≤90d`, `future`).
- **Catalogo Template Pratiche PA**: Template burocratici ministeriali pronti all'uso per passaporto (Agenda Passaporti Polizia di Stato), cambio residenza (ANPR), rinnovo patente (MIT) e disdetta locazione.
- **Audit Tripartito Deterministico**: Netta separazione tra fatti osservati/verificati, indicatori predittivi stimati e decisioni umane richieste, con calcolo automatico del *Vault Health Score* (0–100%).
- **Motore di Ricerca Rapida Multi-Entità**: Ricerca cross-entità ponderata su documenti, garanzie e pratiche per titolo, matricola, note o tag.
- **Ciclo di Vita dei Documenti**: Funzioni di archiviazione e ripristino per mantenere pulita la timeline delle scadenze attive.
- **Warranty Guardian**: Gestione automatica della durata legale di 24 mesi (Codice del Consumo) con scontrini e codici seriali.
- **Generatore di Digest Periodico**: Sintesi giornaliere o settimanali in formato testo o Markdown per bot Telegram, notifiche di sistema ed email.
- **Statistiche & Analytics del Vault**: Ripartizione per categoria, controvalore patrimoniale in garanzia (€) e tasso di avanzamento delle checklist.
- **Cruscotto CLI Interattivo ANSI**: Visualizzazione a schede con barre di progresso, cronologia e tabelle colorate.
- **Esportatori e Standard Aperti**:
  - Feed iCalendar (`.ics`) conforme RFC 5545 con allerte a 7 giorni per calendari personali.
  - Report dashboard HTML standalone a zero CDN con supporto dark/light.
  - Fascicolo amministrativo personale in Markdown strutturato bilingue (`Dossier.md`).
  - Esportatore CSV conforme per fogli di calcolo.
  - Motore di diff snapshot e backup JSON atomico.
- **Suite di Test Completa**: 36 unit test su runtime nativo Node.js passati al 100%.

---

### 🔮 Versione 1.1.0 — Crittografia a Riposo & OCR Scontrini
- **Cifratura AES-GCM a riposo**: Protezione del vault locale con passphrase derivata tramite PBKDF2 o Argon2.
- **Estrazione OCR Locale Offline**: Lettura automatica della data di scadenza e numero documento da scansioni PDF e foto tramite WebAssembly.
- **Supporto allegati con checksum**: Collegamento di PDF e immagini nel filesystem locale con verifica dell'hash SHA-256.

---

### 🔮 Versione 1.2.0 — Sincronizzazione P2P e Portabilità
- **LifeGraph Protocol Integration**: Esportazione verso il grafo delle relazioni di vita e sincronizzazione multi-device locale senza cloud proprietari.
- **Promemoria Notifiche Desktop**: Notifiche native locali di sistema operativo per le scadenze critiche.

---

## 🇬🇧 Roadmap Overview

### ✅ Version 1.0.0 — Official Stable Release (Current)
- Unified personal administrative vault for identity, vehicle, home, health, and warranties.
- Deterministic local JSON storage with strict schema validation.
- Deadline and countdown engine with multi-tier urgency categorization.
- Out-of-the-box bureaucratic procedure templates (passport, residency, driving license, lease termination).
- Tripartite integrity audit engine (observed facts vs model estimates vs human decisions) with Health Score (0–100%).
- Fast weighted cross-entity search across documents, warranties, and paperwork.
- Document lifecycle management (archive and restore).
- Warranty tracking with statutory 24-month duration calculation.
- Periodic alert digest generator (plain text and Markdown for Telegram/email).
- Comprehensive vault analytics & category distribution metrics.
- Rich ANSI terminal dashboard with visual progress indicators.
- Ecosystem adapters: RFC 5545 iCalendar feeds, standalone HTML dashboard, Markdown dossier, CSV spreadsheets, JSON diffs.
- Full test suite: 36 native unit tests with 100% pass rate.
