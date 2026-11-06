# Architettura / Architecture — LifeOS

## 🇮🇹 Panoramica del Progetto

LifeOS è un sistema operativo personale per la gestione di documenti, scadenze, garanzie commerciali e pratiche amministrative personali, progettato con un'architettura **local-first, deterministica e privacy-first**.
Risolve il problema della dispersione delle scadenze e pratiche su molteplici app, calendari e fogli volanti, offrendo un archivio strutturato, consultabile da riga di comando o esportabile in standard aperti.

### Principi Architetturali

1. **Local-First & Sovranità dei Dati**: Nessun server cloud proprietario, nessun tracciamento. I dati sensibili rimangono confinati nel dispositivo dell'utente.
2. **Core Snello (< 1.500 LOC)**: Il nucleo essenziale (`src/core/`) non supera 1.500 righe di codice, rendendo la base di codice auditabile, comprensibile e modificabile in tempi rapidi.
3. **Tripartizione dell'Integrità Dati**:
   - **Fatti Osservati**: Numeri di documento, date di emissione e scadenza certificate, scontrini e fatture di acquisto.
   - **Stime Calcolate**: Giorni di validità residua, finestre di preavviso disdetta, scadenze standard di garanzia legale (24 mesi).
   - **Decisioni Umane**: Azioni di rinnovo, checklist documentale per pratiche della Pubblica Amministrazione, disdette contrattuali.

```
+-------------------------------------------------------------+
|                         CLI / UI                            |
|        (lifeos dashboard / doc / warranty / task / export)  |
+-------------------------------------------------------------+
                               |
+-------------------------------------------------------------+
|                         Core API                            |
|  +--------------------+  +-------------------------------+  |
|  |     Documents      |  |           Warranty            |  |
|  | (Identity, Legal)  |  | (24-Month Code & Proofs)      |  |
|  +--------------------+  +-------------------------------+  |
|  +--------------------+  +-------------------------------+  |
|  |     Deadlines      |  |          Procedures           |  |
|  | (Countdown Engine) |  | (Multi-Step Paperwork Tasks)  |  |
|  +--------------------+  +-------------------------------+  |
|  +--------------------+  +-------------------------------+  |
|  |      Adapters      |  |           Fixtures            |  |
|  | (iCal, CSV, HTML)  |  |   (Synthetic Pilot Vault)     |  |
|  +--------------------+  +-------------------------------+  |
+-------------------------------------------------------------+
                               |
+-------------------------------------------------------------+
|                 Local Vault Storage Engine                  |
|                 (~/.lifeos/vault.json)                      |
+-------------------------------------------------------------+
```

---

## 🛠️ Come Estendere / How to Extend

Aggiungere un nuovo adapter o una categoria è immediato:
1. Per aggiungere categorie di documenti o pratiche, estendi `SUPPORTED_DOCUMENT_CATEGORIES` in `src/core/constants.ts`.
2. Per integrare un nuovo formato di esportazione (es. Markdown o XML), crea un modulo in `src/adapters/` esponendo la funzione di trasformazione a partire da `LifeVault`.
3. Aggiungi test dedicati in `test/` per garantire che `npm test` rimanga al 100% verde.
