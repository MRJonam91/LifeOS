# Piano di Sviluppo / Roadmap — LifeOS

[Italiano](ROADMAP.md) · [English](ROADMAP.md) · [Architettura](ARCHITECTURE.md) · [Checklist Lancio](LAUNCH.md)

---

## 🇮🇹 Piano di Sviluppo

### ✅ Versione 1.0.0 — Rilascio Stabile Ufficiale (Corrente)
- **Modello Dati Personale & Pratiche**: Documenti di identità, veicoli, casa, salute, lavoro e garanzie.
- **Registro Deterministico Locale**: Archiviazione JSON atomica con validazione rigorosa dei tipi (`src/core/validator.ts`).
- **Deadline Engine**: Calcolo accurato di giorni rimanenti, finestre di preavviso e classificazione urgenza (`urgente`, `a breve`, `futura`, `scaduta`).
- **Warranty Tracker**: Gestione automatica della garanzia biennale di legge (24 mesi) con scontrini e codici seriali.
- **Paperwork & Procedures (Pratiche PA)**: Monitoraggio avanzamento pratiche a step con checklist (es. rinnovo passaporto, cambio residenza).
- **Dashboard CLI & Visuale ANSI**: Panoramica completa di scadenze e pratiche con barre di progresso.
- **Dashboard HTML Autonoma Offline**: Report interattivo a zero CDN con supporto dark/light.
- **Esportazione iCalendar (RFC 5545)**: Feed `.ics` con promemoria a 7 giorni e al giorno di scadenza per Apple Calendar, Google Calendar, Outlook.
- **Esportazione CSV**: Tabelle per fogli di calcolo Excel / LibreOffice.

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
