# Piano di Sviluppo / Roadmap — LifeOS

[Italiano](ROADMAP.md) · [English](ROADMAP.md) · [Architettura](ARCHITECTURE.md) · [Checklist Lancio](LAUNCH.md)

---

## 🇮🇹 Piano di Sviluppo

### ✅ Versione 1.2.0-beta — Rilascio Beta Corrente
- **Catalogo Template Pratiche PA**: Template pronti all'uso per passaporto, cambio residenza ANPR, rinnovo patente e disdetta locazione.
- **Audit Tripartito Deterministico**: Separazione tra fatti osservati, stime calcolate e decisioni umane con *Vault Health Score*.
- **Alert Digest Generator**: Generazione sintesi giornaliere/settimanali in testo o Markdown per bot Telegram, email e notifiche.
- **Motore di Ricerca & Diff Snapshot**: Ricerca cross-entità indicizzata e comparazione tra versioni del vault.
- **Analytics & Statistiche Vault**: Distribuzione per categoria, patrimonio in garanzia e velocità amministrativa.
- **Suite di Test Completa**: 36 unit test su runtime nativo Node.js.

### ✅ Versione 1.0.0 & 1.1.0-alpha — Fondamenta & Motore di Base
- **Modello Dati Personale & Pratiche**: Documenti di identità, veicoli, casa, salute, lavoro e garanzie.
- **Registro Deterministico Locale**: Archiviazione JSON atomica con validazione rigorosa dei tipi (`src/core/validator.ts`).
- **Deadline Engine**: Calcolo accurato di giorni rimanenti, finestre di preavviso e classificazione urgenza (`urgente`, `a breve`, `futura`, `scaduta`).
- **Warranty Tracker**: Gestione automatica della garanzia biennale di legge (24 mesi) con scontrini e codici seriali.
- **Paperwork & Procedures (Pratiche PA)**: Monitoraggio avanzamento pratiche a step con checklist.
- **Esportatori Aperti**: iCalendar (RFC 5545), HTML offline dark/light, CSV, Markdown Master Dossier, backup JSON.

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
- Deadline and countdown engine with urgency categorization.
- Warranty tracking with statutory 24-month duration calculation.
- Administrative multi-step procedure tracker (passport renewal, residency change).
- ANSI terminal dashboard with visual progress indicators.
- Standalone zero-CDN offline HTML dashboard report.
- RFC 5545 iCalendar feed export with multi-stage alarms.
- CSV spreadsheet export.
