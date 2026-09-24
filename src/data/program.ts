import type {
  ProgramSession,
  RestPrescription,
  SessionId,
  WeekdayIndex,
} from '../types/index.ts';

/* -------------------------------------------------------------------------- */
/* Scorciatoie di trascrizione                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Blocco accoppiato: 15-20" per spostarsi sull'altro esercizio della coppia,
 * poi il recupero lungo prima di ricominciare il giro.
 */
const superset = (roundRestSec: number): RestPrescription => ({
  kind: 'superset',
  transitionMinSec: 15,
  transitionMaxSec: 20,
  roundRestSec,
});

/** Esercizio isolato: il tempo indicato è tra le serie. */
const straight = (restSec: number): RestPrescription => ({ kind: 'straight', restSec });

/* -------------------------------------------------------------------------- */
/* Calendario del mesociclo                                                    */
/* -------------------------------------------------------------------------- */

/** Domenica: riposo completo, l'app non propone nulla. */
export const REST_WEEKDAYS: readonly WeekdayIndex[] = Object.freeze([7] as const);

/** Settimane di scarico: stessa difficoltà, metà delle serie. */
export const DELOAD_WEEKS: readonly number[] = Object.freeze([6, 12, 18] as const);

/** Ritest dei massimali a fine settimana 6 e 12, mai prima. */
export const RETEST_WEEKS: readonly number[] = Object.freeze([6, 12] as const);

/* -------------------------------------------------------------------------- */
/* Le 6 sedute                                                                 */
/* -------------------------------------------------------------------------- */

export const PROGRAM_SESSIONS: readonly ProgramSession[] = Object.freeze([
  /* ====================================================================== */
  /* LUNEDÌ — UPPER A (spinta dominante) — 58'                              */
  /* ====================================================================== */
  {
    id: 'upper-a',
    weekday: 1,
    name: 'Upper A',
    focus: 'spinta dominante',
    kind: 'strength',
    estimatedMinutes: 58,
    warmup: [
      "3' cardio",
      'Band pull-apart × 20',
      'Rotazioni esterne × 10 per lato',
      '2 serie facili di dip',
    ],
    blocks: [
      {
        code: 'A1',
        group: 'A',
        pairing: 'superset',
        exercise: 'dip-parallele-anelli',
        sets: 4,
        prescription: { kind: 'reps-from-test', testId: 'dip', offset: 0 },
        reference: 'Test dip',
        tut: '3-1-1-0',
        rir: '0-1',
        rest: superset(90),
        perSide: false,
      },
      {
        code: 'A2',
        group: 'A',
        pairing: 'superset',
        exercise: 'trazioni-prona-presa-media',
        sets: 4,
        prescription: { kind: 'reps-from-test', testId: 'pull-up', offset: 0 },
        reference: 'Test trazioni',
        tut: '3-0-1-1',
        rir: '0-1',
        rest: superset(90),
        perSide: false,
      },
      {
        code: 'B1',
        group: 'B',
        pairing: 'superset',
        exercise: 'pike-pushup-piedi-rialzati',
        sets: 3,
        prescription: { kind: 'reps-from-test', testId: 'pike-push-up', offset: 0 },
        reference: 'Test pike',
        tut: '3-0-1-0',
        rir: '1',
        rest: superset(75),
        perSide: false,
      },
      {
        code: 'B2',
        group: 'B',
        pairing: 'superset',
        exercise: 'rematore-inverso-trx-piedi-rialzati',
        sets: 3,
        prescription: { kind: 'reps-from-test', testId: 'inverted-row-trx', offset: 0 },
        reference: 'Test rematore',
        tut: '2-1-1-1',
        rir: '0-1',
        rest: superset(75),
        perSide: false,
      },
      {
        code: 'C1',
        group: 'C',
        pairing: 'superset',
        exercise: 'alzate-laterali-elastico',
        sets: 4,
        prescription: { kind: 'reps', min: 15, max: 20 },
        reference: 'RIR 0-1',
        tut: '2-0-1-1',
        rir: '0-1',
        rest: superset(45),
        perSide: false,
      },
      {
        code: 'C2',
        group: 'C',
        pairing: 'superset',
        exercise: 'dip-panche-o-diamond-pushup',
        sets: 3,
        prescription: { kind: 'reps', min: 12, max: 15 },
        /*
         * La scheda scrive «Dip tra due panche o diamond push-up»: due
         * esercizi in un titolo solo, che non dice quale stai facendo. Sono
         * due righe distinte, con lo stesso range, e si sceglie quale.
         */
        alternatives: [
          { exercise: 'dip-panche', prescription: { kind: 'reps', min: 12, max: 15 } },
        ],
        reference: 'RIR 0-1',
        tut: '3-0-1-0',
        rir: '0-1',
        rest: superset(45),
        perSide: false,
      },
      {
        code: 'D',
        group: 'D',
        pairing: 'single',
        exercise: 'chin-up-presa-supina-stretta',
        sets: 3,
        prescription: { kind: 'reps', min: 6, max: 10 },
        reference: 'Bicipiti',
        tut: '3-0-1-0',
        rir: '1',
        rest: straight(60),
        perSide: false,
      },
    ],
  },

  /* ====================================================================== */
  /* MARTEDÌ — LOWER A (quadricipite dominante) — 60'                       */
  /* ====================================================================== */
  {
    id: 'lower-a',
    weekday: 2,
    name: 'Lower A',
    focus: 'quadricipite dominante',
    kind: 'strength',
    estimatedMinutes: 60,
    warmup: [
      "3' cardio",
      'Mobilità anca 90/90',
      'Glute bridge × 15',
      '2 serie facili di split squat',
    ],
    blocks: [
      {
        code: 'A',
        group: 'A',
        pairing: 'single',
        exercise: 'bulgarian-split-squat',
        sets: 4,
        prescription: { kind: 'reps-from-test', testId: 'bulgarian-split-squat', offset: 0 },
        reference: 'Test split squat',
        tut: '3-1-1-0',
        rir: '0-1',
        rest: straight(120),
        perSide: true,
      },
      {
        code: 'B',
        group: 'B',
        pairing: 'single',
        exercise: 'nordic-curl',
        sets: 4,
        prescription: { kind: 'reps', min: 3, max: 5 },
        reference: 'Test nordic',
        tut: '5-0-X-0',
        rir: '1',
        rest: straight(120),
        perSide: false,
        variantNote: 'Eccentriche 5"',
      },
      {
        code: 'C1',
        group: 'C',
        pairing: 'superset',
        exercise: 'step-up-box-alto',
        sets: 3,
        prescription: { kind: 'reps', min: 10, max: 12 },
        reference: 'RIR 1',
        tut: '2-0-1-0',
        rir: '1',
        rest: superset(75),
        perSide: true,
      },
      {
        code: 'C2',
        group: 'C',
        pairing: 'superset',
        exercise: 'sissy-squat',
        sets: 3,
        prescription: { kind: 'reps', min: 12, max: 15 },
        /*
         * La scheda scrive «Sissy squat o wall sit isometrico 45"». Sono due
         * esercizi con due misure: le ripetizioni qui, i secondi nell'altro.
         */
        alternatives: [
          { exercise: 'wall-sit', prescription: { kind: 'seconds', min: 45, max: 45 } },
        ],
        reference: 'RIR 0-1',
        tut: '3-1-1-0',
        rir: '0-1',
        rest: superset(75),
        perSide: false,
      },
      {
        code: 'D1',
        group: 'D',
        pairing: 'superset',
        exercise: 'calf-monopodalico-rialzo',
        sets: 4,
        prescription: { kind: 'reps', min: 15, max: 20 },
        reference: 'RIR 0-1',
        tut: '2-2-1-2',
        rir: '0-1',
        rest: superset(45),
        perSide: true,
      },
      {
        code: 'D2',
        group: 'D',
        pairing: 'superset',
        exercise: 'hanging-leg-raise',
        sets: 3,
        prescription: { kind: 'reps', min: 10, max: 15 },
        reference: 'Corpo libero',
        tut: 'controllato',
        rir: '1',
        rest: superset(45),
        perSide: false,
      },
    ],
  },

  /* ====================================================================== */
  /* MERCOLEDÌ — ZONA 2 — 40'                                               */
  /* ====================================================================== */
  {
    id: 'zona-2',
    weekday: 3,
    name: 'Zona 2',
    focus: 'aerobico continuo',
    kind: 'cardio',
    estimatedMinutes: 40,
    warmup: [],
    note:
      'Corsa continua, oppure bici o tapis in pendenza se ci sono DOMS alle gambe dal martedì.',
    blocks: [
      {
        code: 'W',
        group: 'W',
        pairing: 'single',
        exercise: 'camminata-mobilita-dinamica',
        sets: 1,
        prescription: { kind: 'duration', minMinutes: 5, maxMinutes: 5 },
        reference: 'preparatorio',
        tut: '—',
        rir: '—',
        rest: { kind: 'none' },
        perSide: false,
      },
      {
        code: 'A',
        group: 'A',
        pairing: 'single',
        exercise: 'corsa-continua-piano',
        sets: 1,
        prescription: { kind: 'duration', minMinutes: 30, maxMinutes: 40 },
        reference: 'FC 125-140 bpm — deve poter parlare a frasi intere',
        tut: '—',
        rir: '—',
        rest: { kind: 'none' },
        perSide: false,
      },
      {
        code: 'B',
        group: 'B',
        pairing: 'single',
        exercise: 'mobilita-anche-torace-spalle',
        sets: 1,
        prescription: { kind: 'duration', minMinutes: 8, maxMinutes: 8 },
        reference: 'defaticamento',
        tut: '—',
        rir: '—',
        rest: { kind: 'none' },
        perSide: false,
      },
    ],
  },

  /* ====================================================================== */
  /* GIOVEDÌ — UPPER B (trazione dominante) — 58'                           */
  /* ====================================================================== */
  {
    id: 'upper-b',
    weekday: 4,
    name: 'Upper B',
    focus: 'trazione dominante',
    kind: 'strength',
    estimatedMinutes: 53,
    warmup: [
      "3' cardio",
      'Scapular pull-up × 10',
      'Band pull-apart × 20',
      '2 serie facili di trazioni',
    ],
    blocks: [
      {
        code: 'A1',
        group: 'A',
        pairing: 'superset',
        exercise: 'trazioni-presa-larga',
        sets: 4,
        prescription: { kind: 'reps-from-test', testId: 'pull-up', offset: -2 },
        reference: 'Test trazioni −2',
        tut: '3-0-1-1',
        rir: '0-1',
        rest: superset(90),
        perSide: false,
      },
      {
        code: 'A2',
        group: 'A',
        pairing: 'superset',
        exercise: 'pushup-archer-o-pseudo-planche',
        sets: 4,
        prescription: { kind: 'reps-from-test', testId: 'push-up', offset: 0 },
        reference: 'Test push-up',
        tut: '3-1-1-0',
        rir: '0-1',
        rest: superset(90),
        perSide: false,
      },
      {
        code: 'B1',
        group: 'B',
        pairing: 'superset',
        exercise: 'rematore-trx-monobraccio',
        sets: 3,
        prescription: { kind: 'reps', min: 8, max: 12 },
        reference: 'RIR 1',
        tut: '2-1-1-1',
        rir: '1',
        rest: superset(75),
        perSide: true,
      },
      {
        code: 'B2',
        group: 'B',
        pairing: 'superset',
        exercise: 'negative-hspu-muro-o-pike-pushup',
        sets: 3,
        prescription: { kind: 'reps', min: 5, max: 8 },
        reference: 'RIR 1',
        tut: '5-0-X-0',
        rir: '1',
        rest: superset(75),
        perSide: false,
      },
      {
        code: 'C1',
        group: 'C',
        pairing: 'superset',
        exercise: 'croci-elastico-o-pushup-presa-larga',
        sets: 3,
        prescription: { kind: 'reps', min: 12, max: 15 },
        /*
         * La scheda scrive «Croci con elastico o push-up presa larga lenta».
         * Del push-up a presa larga non resta niente, ed è voluto: qui è la
         * terza spinta orizzontale della seduta, dopo quattro serie al blocco
         * A2 e tre di negative di HSPU al B2, tutte a RIR 0-1. Le croci
         * restano perché sono l'unico movimento della settimana che carica il
         * petto in allungamento senza passare dai tricipiti. Dichiarato in
         * DEVIAZIONI.
         */
        reference: 'RIR 0-1',
        tut: '4-1-1-0',
        rir: '0-1',
        rest: superset(45),
        perSide: false,
      },
      {
        code: 'C2',
        group: 'C',
        pairing: 'superset',
        exercise: 'curl-elastico-presa-neutra',
        sets: 3,
        prescription: { kind: 'reps', min: 12, max: 15 },
        reference: 'RIR 0-1',
        tut: '3-0-1-0',
        rir: '0-1',
        rest: superset(45),
        perSide: false,
      },
    ],
  },

  /* ====================================================================== */
  /* VENERDÌ — LOWER B (catena posteriore) — 60'                            */
  /* ====================================================================== */
  {
    id: 'lower-b',
    weekday: 5,
    name: 'Lower B',
    focus: 'catena posteriore',
    kind: 'strength',
    estimatedMinutes: 60,
    warmup: ["3' cardio", 'Cat-camel × 10', 'Hip hinge × 10', 'Bird-dog × 8 per lato'],
    blocks: [
      {
        code: 'A',
        group: 'A',
        pairing: 'single',
        exercise: 'nordic-curl',
        sets: 4,
        prescription: { kind: 'reps', min: 5, max: 8 },
        reference: 'Test nordic',
        tut: '5-0-X-0',
        rir: '0-1',
        rest: straight(150),
        perSide: false,
        variantNote: 'Livello dalla scala progressioni',
      },
      {
        code: 'B1',
        group: 'B',
        pairing: 'superset',
        exercise: 'hip-thrust-monopodalico',
        sets: 4,
        prescription: { kind: 'reps', min: 12, max: 15 },
        reference: 'RIR 0-1',
        tut: '2-1-1-2',
        rir: '0-1',
        rest: superset(90),
        perSide: true,
      },
      {
        code: 'B2',
        group: 'B',
        pairing: 'superset',
        exercise: 'shrimp-squat-o-skater-squat',
        sets: 3,
        prescription: { kind: 'reps', min: 6, max: 10 },
        reference: 'RIR 1',
        tut: '3-1-1-0',
        rir: '1',
        rest: superset(90),
        perSide: true,
      },
      {
        code: 'C1',
        group: 'C',
        pairing: 'superset',
        exercise: 'single-leg-rdl',
        sets: 3,
        prescription: { kind: 'reps', min: 12, max: 12 },
        reference: 'RIR 1',
        tut: '3-2-1-0',
        rir: '1',
        rest: superset(60),
        perSide: true,
      },
      {
        code: 'C2',
        group: 'C',
        pairing: 'superset',
        exercise: 'calf-monopodalico-seduto',
        sets: 4,
        prescription: { kind: 'reps', min: 15, max: 20 },
        reference: 'RIR 0-1',
        tut: '2-2-1-2',
        rir: '0-1',
        rest: superset(60),
        perSide: false,
      },
      {
        code: 'D',
        group: 'D',
        pairing: 'single',
        exercise: 'ab-wheel-o-rollout-trx',
        sets: 3,
        prescription: { kind: 'reps', min: 8, max: 12 },
        /* «Ab wheel o rollout TRX»: stesso gesto, due attrezzi, due righe. */
        alternatives: [
          { exercise: 'rollout-trx', prescription: { kind: 'reps', min: 8, max: 12 } },
        ],
        reference: 'RIR 1',
        tut: 'controllato',
        rir: '1',
        rest: straight(45),
        perSide: false,
      },
    ],
  },

  /* ====================================================================== */
  /* SABATO — SHADOW (delti, braccia, core, skill) — 48'                    */
  /* ====================================================================== */
  {
    id: 'shadow',
    weekday: 6,
    name: 'Shadow',
    focus: 'delti, braccia, core, skill',
    kind: 'strength',
    /* 48' della scheda più i quindici minuti aggiunti al blocco F. */
    estimatedMinutes: 63,
    warmup: ["3' cardio", 'Band pull-apart × 20', 'Dead hang 30"'],
    note: 'Skill a inizio seduta, da fresco.',
    blocks: [
      {
        code: 'A',
        group: 'A',
        pairing: 'single',
        exercise: 'hollow-hold',
        sets: 3,
        prescription: { kind: 'seconds', min: 30, max: 45 },
        /*
         * La scheda scrive «Skill: hollow hold / L-sit / verticale al muro»:
         * tre esercizi in un titolo solo. Ognuno ha la sua scala e il suo
         * storico, e si sceglie qui.
         */
        alternatives: [
          { exercise: 'l-sit', prescription: { kind: 'seconds', min: 30, max: 45 } },
          { exercise: 'verticale-al-muro', prescription: { kind: 'seconds', min: 30, max: 45 } },
        ],
        reference: 'Test hollow',
        tut: 'isometrico',
        rir: '1-2',
        rest: straight(60),
        perSide: false,
      },
      {
        code: 'B',
        group: 'B',
        pairing: 'single',
        exercise: 'alzate-laterali-elastico',
        sets: 4,
        prescription: { kind: 'reps', min: 15, max: 20 },
        reference: 'RIR 0-1',
        tut: '2-0-1-1',
        rir: '0-1',
        rest: straight(45),
        perSide: false,
      },
      {
        code: 'C',
        group: 'C',
        pairing: 'single',
        exercise: 'face-pull-elastico',
        sets: 3,
        prescription: { kind: 'reps', min: 20, max: 25 },
        reference: 'RIR 1',
        tut: '2-1-1-1',
        rir: '1',
        rest: straight(45),
        perSide: false,
      },
      {
        code: 'D1',
        group: 'D',
        pairing: 'superset',
        exercise: 'chin-up-presa-supina',
        sets: 3,
        prescription: { kind: 'reps', min: 8, max: 10 },
        reference: 'RIR 0-1',
        tut: '3-0-1-0',
        rir: '0-1',
        rest: superset(45),
        perSide: false,
      },
      {
        code: 'D2',
        group: 'D',
        pairing: 'superset',
        exercise: 'dip-panche-piedi-rialzati',
        sets: 3,
        prescription: { kind: 'reps', min: 12, max: 15 },
        reference: 'RIR 0-1',
        tut: '3-0-1-0',
        rir: '0-1',
        rest: superset(45),
        perSide: false,
      },
      {
        code: 'E',
        group: 'E',
        pairing: 'single',
        exercise: 'dead-hang',
        sets: 3,
        prescription: { kind: 'max' },
        reference: 'Test presa',
        tut: 'isometrico',
        rir: '0',
        rest: straight(60),
        perSide: false,
        variantNote: 'A cedimento',
      },
      {
        code: 'F',
        group: 'F',
        pairing: 'single',
        exercise: 'zona-2-conclusiva',
        sets: 1,
        /*
         * La scheda scrive 15'. Allungato a 30 su richiesta dell'utente, che
         * voleva una seconda uscita di corsa il sabato senza perdere face
         * pull, dead hang e skill. Vedi DEVIAZIONI_BLOCCO.
         */
        prescription: { kind: 'duration', minMinutes: 30, maxMinutes: 30 },
        reference: 'FC 125-135',
        tut: '—',
        rir: '—',
        rest: { kind: 'none' },
        perSide: false,
      },
    ],
  },
]);

/* -------------------------------------------------------------------------- */
/* Accessori                                                                   */
/* -------------------------------------------------------------------------- */

const BY_ID: ReadonlyMap<SessionId, ProgramSession> = new Map(
  PROGRAM_SESSIONS.map((session) => [session.id, session]),
);

const BY_WEEKDAY: ReadonlyMap<WeekdayIndex, ProgramSession> = new Map(
  PROGRAM_SESSIONS.map((session) => [session.weekday, session]),
);

export function getSession(id: SessionId): ProgramSession {
  const session = BY_ID.get(id);
  if (session === undefined) {
    throw new Error(`Seduta sconosciuta: ${id}`);
  }
  return session;
}

/** `null` nei giorni di riposo. La domenica l'app non propone nulla. */
export function getSessionForWeekday(weekday: WeekdayIndex): ProgramSession | null {
  return BY_WEEKDAY.get(weekday) ?? null;
}

export function isRestDay(weekday: WeekdayIndex): boolean {
  return REST_WEEKDAYS.includes(weekday);
}
