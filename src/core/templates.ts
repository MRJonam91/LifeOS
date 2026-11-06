// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com>

import { getTodayIso } from "./deadlines.ts";
import { createProcedure } from "./procedures.ts";
import type { DocumentCategory, LifeProcedure } from "./types.ts";

export interface ProcedureTemplate {
  key: string;
  title: string;
  category: DocumentCategory;
  description: string;
  defaultDeadlineDays: number;
  steps: Array<{
    title: string;
    offsetDays: number;
    notes?: string;
    requiredDocIds?: string[];
  }>;
}

export const BUILTIN_PROCEDURE_TEMPLATES: Record<string, ProcedureTemplate> = {
  "passport-renewal": {
    key: "passport-renewal",
    title: "Rinnovo e Rilascio Passaporto",
    category: "identity",
    description: "Procedura standard Agenda Passaporti (Polizia di Stato)",
    defaultDeadlineDays: 60,
    steps: [
      {
        title: "Prenotare appuntamento su Agenda Passaporti con SPID/CIE",
        offsetDays: 7,
        notes: "Accesso al portale passaportonline.poliziadistato.it",
      },
      {
        title: "Pagare bollettino postale di 42,50€ (C/C 67422808 MEF)",
        offsetDays: 20,
        notes: "Presso ufficio postale o tabaccheria abilitata",
      },
      {
        title: "Acquistare contrassegno telematico da 73,50€",
        offsetDays: 20,
        notes: "Presso rivendita valori bollati o tabacchi",
      },
      {
        title: "Scattare 2 fototessere conformi a norma ICAO",
        offsetDays: 25,
        notes: "Sfondo bianco, volto scoperto e senza occhiali spessi",
      },
      {
        title: "Presentarsi in Questura per deposito impronte e vecchi documenti",
        offsetDays: 30,
        notes: "Portare ricevuta prenotazione, bollettino, marca e passaporto scaduto",
      },
    ],
  },
  "residency-change": {
    key: "residency-change",
    title: "Dichiarazione Cambio di Abitazione / Residenza",
    category: "home",
    description: "Cambio residenza telematico via portale ministeriale ANPR",
    defaultDeadlineDays: 45,
    steps: [
      {
        title: "Compilare istanza di cambio residenza su ANPR con SPID/CIE",
        offsetDays: 5,
        notes: "Accedere a anagrafenazionale.interno.it e allegare contratto o rogito",
      },
      {
        title: "Aggiornare patente e libretto circolazione veicoli nell'istanza",
        offsetDays: 5,
        notes: "Dati comunicati automaticamente alla Motorizzazione Civile (MIT)",
      },
      {
        title: "Monitoraggio accertamento Polizia Locale (45 giorni)",
        offsetDays: 45,
        notes: "Verifica della dimora abituale da parte del Comune",
      },
    ],
  },
  "driving-license-renewal": {
    key: "driving-license-renewal",
    title: "Rinnovo Patente di Guida",
    category: "vehicle",
    description: "Visita medica e rinnovo validità patente presso autoscuola o ASL",
    defaultDeadlineDays: 30,
    steps: [
      {
        title: "Pagamento diritti Motorizzazione e imposta di bollo (PagoPA)",
        offsetDays: 5,
        notes: "Tariffa 16,00€ + 10,20€ tramite Portale dell'Automobilista",
      },
      {
        title: "Fototessera recente e visita medica per idoneità visiva/psicofisica",
        offsetDays: 15,
        notes: "Presso medico abilitato, autoscuola, ASL o delegazione ACI",
      },
      {
        title: "Ricezione della nuova patente per posta assicurata",
        offsetDays: 30,
        notes: "Ricevuta provvisoria valida per guidare per 60 giorni",
      },
    ],
  },
  "tenancy-termination": {
    key: "tenancy-termination",
    title: "Disdetta e Riconsegna Contratto di Locazione",
    category: "home",
    description: "Procedura formale di recesso conduttore con 6 mesi di preavviso",
    defaultDeadlineDays: 180,
    steps: [
      {
        title: "Invio raccomandata A/R o PEC di disdetta con 6 mesi di anticipo",
        offsetDays: 10,
        notes: "Conservare ricevuta di avvenuta consegna / accettazione PEC",
      },
      {
        title: "Comunicazione risoluzione anticipata ad Agenzia Entrate (Modello RLI)",
        offsetDays: 160,
        notes: "Versamento eventuale imposta di registro per risoluzione se dovuta",
      },
      {
        title: "Redazione verbale riconsegna chiavi e restituzione deposito cauzionale",
        offsetDays: 180,
        notes: "Verifica stato dell'immobile e conteggio conguaglio spese",
      },
    ],
  },
};

export function instantiateProcedureTemplate(
  templateKey: string,
  baseDate: string = getTodayIso()
): LifeProcedure {
  const tpl = BUILTIN_PROCEDURE_TEMPLATES[templateKey];
  if (!tpl) {
    const available = Object.keys(BUILTIN_PROCEDURE_TEMPLATES).join(", ");
    throw new Error(`Unknown procedure template "${templateKey}". Available: ${available}`);
  }

  const [bY, bM, bD] = baseDate.split("-").map(Number);
  const baseUtc = new Date(Date.UTC(bY!, bM! - 1, bD!));

  const addDays = (days: number): string => {
    const d = new Date(baseUtc);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  };

  const steps = tpl.steps.map((s, idx) => ({
    id: `step_${idx + 1}`,
    title: s.title,
    dueDate: addDays(s.offsetDays),
    completed: false,
    notes: s.notes,
    requiredDocIds: s.requiredDocIds,
  }));

  return createProcedure({
    title: tpl.title,
    category: tpl.category,
    targetDeadline: addDays(tpl.defaultDeadlineDays),
    steps,
    notes: tpl.description,
    tags: ["template", tpl.key],
  });
}
