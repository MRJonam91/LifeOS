# LifeOS: decision seed & MVP status

IT — Scopo: Scadenze e pratiche personali sono distribuite tra molte applicazioni.
Prima prova completata: Cruscotto locale per documenti, scadenze, garanzie e pratiche amministrative personali inseriti manualmente.

EN — Purpose: Personal deadlines and tasks are spread across many apps.
First trial completed: Local dashboard for manually entered documents, deadlines, warranties, and paperwork procedures.

## Decisioni prese / Decisions made

- **Utente pilota & Scenario**: Caso pilota autorizzato con documenti anagrafici (CIE, passaporto, patente, tessera sanitaria), contratti (locazione, assicurazione), garanzie 24 mesi e pratiche PA (rinnovo passaporto, cambio residenza).
- **Nome & Confini**: Confermato `LifeOS` come vault amministrativo local-first. `LifeGraph` resta il modello dati/relazionale portabile. Non duplica password manager o banche.
- **Misura di successo**: CLI operativa (`lifeos dashboard`), feed iCalendar RFC 5545 con allerte a 7 giorni, esportazione HTML offline a zero dipendenze e 18/18 test unitari verdi.
- **Standard MRJonam91**: Applicato `../_repo-kit/REPO-STANDARDS.md`: licenza AGPL-3.0-only, CLA, licenza commerciale, guardia core < 1.500 righe (973 righe), 7 marcatori anti-plagio registrati in `_provenance/LifeOS.json`.
