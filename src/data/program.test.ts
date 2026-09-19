import { describe, expect, it } from 'vitest';
import { DELOAD_WEEKS, PROGRAM_SESSIONS, REST_WEEKDAYS, RETEST_WEEKS, getSessionForWeekday, isRestDay } from './program.ts';
import { getExercise } from './exercises.ts';
import {
  DEVIAZIONI,
  DEVIAZIONI_BLOCCO,
  applicaDeviazione,
  applicaDeviazioneBlocco,
  applicaDeviazioneMinuti,
} from './deviations.ts';
import type { Prescription, RestPrescription, SessionId } from '../types/index.ts';

/**
 * Questo file è una seconda trascrizione, indipendente, delle tabelle della
 * specifica. Se il seed e questa tabella divergono, uno dei due è sbagliato:
 * è esattamente il controllo che serve.
 *
 * Le righe qui sotto riportano il foglio Excel **così com'è**, anche dove
 * l'app ha poi cambiato qualcosa. Le differenze volute passano da
 * `DEVIAZIONI`, che le applica al confronto: correggere queste righe per far
 * passare un test significherebbe cancellare la prova che serviva.
 *
 * Colonne: codice | esercizio | serie | rip | riferimento | TUT | RIR | recupero | per lato
 */
type Row = readonly [
  code: string,
  exerciseName: string,
  sets: number,
  reps: string,
  reference: string,
  tut: string,
  rir: string,
  rest: string,
  perSide: boolean,
];

function formatPrescription(p: Prescription): string {
  switch (p.kind) {
    case 'reps':
      return p.min === p.max ? String(p.min) : `${String(p.min)}-${String(p.max)}`;
    case 'reps-from-test':
      return p.offset === 0 ? `test:${p.testId}` : `test:${p.testId}${String(p.offset)}`;
    case 'seconds':
      return `${String(p.min)}-${String(p.max)}s`;
    case 'max':
      return 'max';
    case 'myo-reps':
      return `myo:${String(p.activationReps)}+${String(p.miniSets)}x${String(p.miniSetReps)}`;
    case 'duration':
      return p.minMinutes === p.maxMinutes
        ? `dur:${String(p.minMinutes)}`
        : `dur:${String(p.minMinutes)}-${String(p.maxMinutes)}`;
  }
}

function formatRest(r: RestPrescription): string {
  switch (r.kind) {
    case 'superset':
      return `${String(r.transitionMinSec)}-${String(r.transitionMaxSec)}"→${String(r.roundRestSec)}`;
    case 'straight':
      return String(r.restSec);
    case 'cluster':
      return `cluster:${String(r.restSec)}`;
    case 'none':
      return 'none';
  }
}

function actualRows(id: SessionId): Row[] {
  const session = PROGRAM_SESSIONS.find((s) => s.id === id);
  if (session === undefined) throw new Error(`Seduta mancante: ${id}`);
  return session.blocks.map((block) => [
    block.code,
    getExercise(block.exercise).name,
    block.sets,
    formatPrescription(block.prescription),
    block.reference,
    block.tut,
    block.rir,
    formatRest(block.rest),
    block.perSide,
  ]);
}

/** Le righe della scheda, con le differenze volute già applicate. */
function attese(id: SessionId, rows: readonly Row[]): Row[] {
  return rows.map(
    (row) =>
      [
        row[0],
        applicaDeviazione(row[1]),
        row[2],
        applicaDeviazioneBlocco(id, row[0], row[3]),
        ...row.slice(4),
      ] as unknown as Row,
  );
}

const UPPER_A: readonly Row[] = [
  ['A1', 'Dip alle parallele o agli anelli', 4, 'test:dip', 'Test dip', '3-1-1-0', '0-1', '15-20"→90', false],
  ['A2', 'Trazioni prona presa media', 4, 'test:pull-up', 'Test trazioni', '3-0-1-1', '0-1', '15-20"→90', false],
  ['B1', 'Pike push-up piedi rialzati', 3, 'test:pike-push-up', 'Test pike', '3-0-1-0', '1', '15-20"→75', false],
  ['B2', 'Rematore inverso TRX piedi rialzati', 3, 'test:inverted-row-trx', 'Test rematore', '2-1-1-1', '0-1', '15-20"→75', false],
  ['C1', 'Alzate laterali con elastico', 4, '15-20', 'RIR 0-1', '2-0-1-1', '0-1', '15-20"→45', false],
  ['C2', 'Dip tra due panche o diamond push-up', 3, '12-15', 'RIR 0-1', '3-0-1-0', '0-1', '15-20"→45', false],
  ['D', 'Chin-up presa supina stretta', 3, '6-10', 'Bicipiti', '3-0-1-0', '1', '60', false],
];

const LOWER_A: readonly Row[] = [
  ['A', 'Bulgarian split squat', 4, 'test:bulgarian-split-squat', 'Test split squat', '3-1-1-0', '0-1', '120', true],
  ['B', 'Nordic curl', 4, '3-5', 'Test nordic', '5-0-X-0', '1', '120', false],
  ['C1', 'Step-up su box alto (altezza ginocchio+)', 3, '10-12', 'RIR 1', '2-0-1-0', '1', '15-20"→75', true],
  ['C2', 'Sissy squat o wall sit isometrico 45"', 3, '12-15', 'RIR 0-1', '3-1-1-0', '0-1', '15-20"→75', false],
  ['D1', 'Calf monopodalico su rialzo', 4, '15-20', 'RIR 0-1', '2-2-1-2', '0-1', '15-20"→45', true],
  ['D2', 'Hanging leg raise', 3, '10-15', 'Corpo libero', 'controllato', '1', '15-20"→45', false],
];

const ZONA_2: readonly Row[] = [
  ['W', 'Camminata + mobilità dinamica', 1, 'dur:5', 'preparatorio', '—', '—', 'none', false],
  ['A', 'Corsa continua in piano', 1, 'dur:30-40', 'FC 125-140 bpm — deve poter parlare a frasi intere', '—', '—', 'none', false],
  ['B', 'Mobilità anche, torace, spalle', 1, 'dur:8', 'defaticamento', '—', '—', 'none', false],
];

const UPPER_B: readonly Row[] = [
  ['A1', 'Trazioni presa larga', 4, 'test:pull-up-2', 'Test trazioni −2', '3-0-1-1', '0-1', '15-20"→90', false],
  ['A2', 'Push-up archer o pseudo-planche', 4, 'test:push-up', 'Test push-up', '3-1-1-0', '0-1', '15-20"→90', false],
  ['B1', 'Rematore TRX monobraccio', 3, '8-12', 'RIR 1', '2-1-1-1', '1', '15-20"→75', true],
  ['B2', 'Negative di HSPU al muro (5") o pike push-up', 3, '5-8', 'RIR 1', '5-0-X-0', '1', '15-20"→75', false],
  ['C1', 'Croci con elastico o push-up presa larga lenta', 3, '12-15', 'RIR 0-1', '4-1-1-0', '0-1', '15-20"→45', false],
  ['C2', 'Curl con elastico presa neutra', 3, '12-15', 'RIR 0-1', '3-0-1-0', '0-1', '15-20"→45', false],
  ['D', 'Alzate laterali con elastico', 1, 'myo:15+4x4', 'RIR 0', '2-0-1-0', '0', 'cluster:20', false],
];

const LOWER_B: readonly Row[] = [
  ['A', 'Nordic curl', 4, '5-8', 'Test nordic', '5-0-X-0', '0-1', '150', false],
  ['B1', 'Hip thrust monopodalico, spalle su panca', 4, '12-15', 'RIR 0-1', '2-1-1-2', '0-1', '15-20"→90', true],
  ['B2', 'Shrimp squat o skater squat', 3, '6-10', 'RIR 1', '3-1-1-0', '1', '15-20"→90', true],
  ['C1', 'Single-leg RDL a corpo libero, pausa 2"', 3, '12', 'RIR 1', '3-2-1-0', '1', '15-20"→60', true],
  ['C2', 'Calf monopodalico seduto', 4, '15-20', 'RIR 0-1', '2-2-1-2', '0-1', '15-20"→60', false],
  ['D', 'Ab wheel o rollout TRX', 3, '8-12', 'RIR 1', 'controllato', '1', '45', false],
];

const SHADOW: readonly Row[] = [
  ['A', 'Skill: hollow hold / L-sit / verticale al muro', 3, '30-45s', 'Test hollow', 'isometrico', '1-2', '60', false],
  ['B', 'Alzate laterali con elastico', 4, '15-20', 'RIR 0-1', '2-0-1-1', '0-1', '45', false],
  ['C', 'Face pull con elastico', 3, '20-25', 'RIR 1', '2-1-1-1', '1', '45', false],
  ['D1', 'Chin-up presa supina', 3, '8-10', 'RIR 0-1', '3-0-1-0', '0-1', '15-20"→45', false],
  ['D2', 'Dip tra panche piedi rialzati', 3, '12-15', 'RIR 0-1', '3-0-1-0', '0-1', '15-20"→45', false],
  ['E', 'Dead hang', 3, 'max', 'Test presa', 'isometrico', '0', '60', false],
  ['F', 'Zona 2 conclusiva', 1, 'dur:15', 'FC 125-135', '—', '—', 'none', false],
];

const EXPECTED: ReadonlyArray<readonly [SessionId, readonly Row[]]> = [
  ['upper-a', UPPER_A],
  ['lower-a', LOWER_A],
  ['zona-2', ZONA_2],
  ['upper-b', UPPER_B],
  ['lower-b', LOWER_B],
  ['shadow', SHADOW],
];

describe('program.ts — trascrizione delle 6 sedute', () => {
  it('contiene esattamente 6 sedute, una per giorno da lunedì a sabato', () => {
    expect(PROGRAM_SESSIONS).toHaveLength(6);
    expect(PROGRAM_SESSIONS.map((s) => s.weekday)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(PROGRAM_SESSIONS.map((s) => s.id)).toEqual([
      'upper-a',
      'lower-a',
      'zona-2',
      'upper-b',
      'lower-b',
      'shadow',
    ]);
  });

  it.each(EXPECTED)('la seduta %s corrisponde riga per riga alla scheda', (id, rows) => {
    expect(actualRows(id)).toEqual(attese(id, rows));
  });

  /*
   * La riga «Sissy squat o wall sit isometrico 45"» diventa due esercizi.
   *
   * La deviazione dichiarata copre il nome; qui si controlla che la seconda
   * scelta non sia sparita nel farlo, e che porti davvero la misura per cui
   * è stata separata: 45 secondi, non 12-15 ripetizioni.
   */
  it('il C2 del Lower A offre entrambi gli esercizi, ognuno con la sua misura', () => {
    const lowerA = PROGRAM_SESSIONS.find((s) => s.id === 'lower-a');
    const c2 = lowerA?.blocks.find((b) => b.code === 'C2');
    expect(c2?.exercise).toBe('sissy-squat');
    expect(c2?.prescription).toEqual({ kind: 'reps', min: 12, max: 15 });
    expect(getExercise('sissy-squat').measurement).toBe('reps');

    expect(c2?.alternatives).toEqual([
      { exercise: 'wall-sit', prescription: { kind: 'seconds', min: 45, max: 45 } },
    ]);
    expect(getExercise('wall-sit').measurement).toBe('seconds');
  });

  it('nessun blocco offre un’alternativa che non cambia niente', () => {
    for (const session of PROGRAM_SESSIONS) {
      for (const block of session.blocks) {
        const scelte = [block.exercise, ...(block.alternatives ?? []).map((a) => a.exercise)];
        expect(new Set(scelte).size, block.code).toBe(scelte.length);
      }
    }
  });

  it('ha 36 blocchi in totale', () => {
    const total = PROGRAM_SESSIONS.reduce((sum, s) => sum + s.blocks.length, 0);
    expect(total).toBe(36);
  });

  it('rispetta le durate stimate della scheda', () => {
    const durations = Object.fromEntries(
      PROGRAM_SESSIONS.map((s) => [s.id, s.estimatedMinutes]),
    );
    /* I minuti del foglio, con le differenze volute applicate come per le righe. */
    const daScheda: Record<string, number> = {
      'upper-a': 58,
      'lower-a': 60,
      'zona-2': 40,
      'upper-b': 58,
      'lower-b': 60,
      shadow: 48,
    };
    expect(durations).toEqual(
      Object.fromEntries(
        Object.entries(daScheda).map(([id, minuti]) => [
          id,
          applicaDeviazioneMinuti(id as SessionId, minuti),
        ]),
      ),
    );
  });

  it('trascrive i warm-up di ogni seduta', () => {
    const warmups = Object.fromEntries(PROGRAM_SESSIONS.map((s) => [s.id, s.warmup]));
    expect(warmups).toEqual({
      'upper-a': ["3' cardio", 'Band pull-apart × 20', 'Rotazioni esterne × 10 per lato', '2 serie facili di dip'],
      'lower-a': ["3' cardio", 'Mobilità anca 90/90', 'Glute bridge × 15', '2 serie facili di split squat'],
      'zona-2': [],
      'upper-b': ["3' cardio", 'Scapular pull-up × 10', 'Band pull-apart × 20', '2 serie facili di trazioni'],
      'lower-b': ["3' cardio", 'Cat-camel × 10', 'Hip hinge × 10', 'Bird-dog × 8 per lato'],
      shadow: ["3' cardio", 'Band pull-apart × 20', 'Dead hang 30"'],
    });
  });

  it('marca la sola seduta del mercoledì come cardio', () => {
    const cardio = PROGRAM_SESSIONS.filter((s) => s.kind === 'cardio');
    expect(cardio.map((s) => s.id)).toEqual(['zona-2']);
  });
});

describe('accoppiamento dei blocchi', () => {
  it('ogni blocco con codice a due caratteri è una superserie e ha un gemello', () => {
    for (const session of PROGRAM_SESSIONS) {
      for (const block of session.blocks) {
        const isPairedCode = /^[A-Z]\d$/.test(block.code);
        expect(block.pairing).toBe(isPairedCode ? 'superset' : 'single');
        if (isPairedCode) {
          const twins = session.blocks.filter((b) => b.group === block.group);
          expect(twins).toHaveLength(2);
        }
      }
    }
  });

  it('i blocchi a lettera singola non usano mai il recupero da superserie', () => {
    for (const session of PROGRAM_SESSIONS) {
      for (const block of session.blocks.filter((b) => b.pairing === 'single')) {
        expect(block.rest.kind).not.toBe('superset');
      }
    }
  });

  it('i due esercizi di una coppia condividono lo stesso recupero lungo', () => {
    for (const session of PROGRAM_SESSIONS) {
      const groups = new Set(
        session.blocks.filter((b) => b.pairing === 'superset').map((b) => b.group),
      );
      for (const group of groups) {
        const rests = session.blocks
          .filter((b) => b.group === group)
          .map((b) => formatRest(b.rest));
        expect(new Set(rests).size).toBe(1);
      }
    }
  });
});

describe('calendario del mesociclo', () => {
  it('la domenica è riposo e non ha seduta', () => {
    expect(REST_WEEKDAYS).toEqual([7]);
    expect(isRestDay(7)).toBe(true);
    expect(getSessionForWeekday(7)).toBeNull();
  });

  it('da lunedì a sabato c’è sempre una seduta', () => {
    for (const weekday of [1, 2, 3, 4, 5, 6] as const) {
      expect(getSessionForWeekday(weekday)).not.toBeNull();
      expect(isRestDay(weekday)).toBe(false);
    }
  });

  it('scarico alle settimane 6, 12 e 18; ritest alle 6 e 12', () => {
    expect(DELOAD_WEEKS).toEqual([6, 12, 18]);
    expect(RETEST_WEEKS).toEqual([6, 12]);
  });
});

describe('deviazioni dichiarate', () => {
  it('ogni deviazione riguarda un esercizio che la scheda nomina davvero', () => {
    // Una voce che non corrisponde a niente è una deviazione vecchia rimasta
    // lì: da quel momento la lista racconta una storia che non esiste più.
    const nomiDaScheda = new Set(
      [UPPER_A, LOWER_A, ZONA_2, UPPER_B, LOWER_B, SHADOW].flatMap((rows) =>
        rows.map((row) => row[1]),
      ),
    );
    for (const deviazione of DEVIAZIONI) {
      expect(nomiDaScheda.has(deviazione.scheda), deviazione.scheda).toBe(true);
    }
  });

  it('ogni deviazione porta un motivo scritto, non un cambio silenzioso', () => {
    for (const deviazione of DEVIAZIONI) {
      expect(deviazione.motivo.length, deviazione.scheda).toBeGreaterThan(40);
      expect(deviazione.app).not.toBe(deviazione.scheda);
    }
  });

  /*
   * Stessi vincoli per le deviazioni su un blocco.
   *
   * Una deviazione che non corrisponde a nessuna riga del foglio non
   * protegge niente e nasconde un refuso: se il codice o la prescrizione di
   * partenza sono sbagliati, `applicaDeviazioneBlocco` non trova nulla e il
   * confronto passa per il motivo sbagliato.
   */
  it('ogni deviazione su un blocco punta a una riga che la scheda ha davvero', () => {
    const perSeduta = new Map<SessionId, readonly Row[]>(EXPECTED);
    for (const deviazione of DEVIAZIONI_BLOCCO) {
      const rows = perSeduta.get(deviazione.sessione);
      expect(rows, deviazione.sessione).toBeDefined();
      const riga = rows?.find((row) => row[0] === deviazione.codice);
      expect(riga, `${deviazione.sessione}/${deviazione.codice}`).toBeDefined();
      expect(riga?.[3], `${deviazione.sessione}/${deviazione.codice}`).toBe(deviazione.scheda);
    }
  });

  it('ogni deviazione su un blocco porta un motivo scritto e cambia qualcosa', () => {
    for (const deviazione of DEVIAZIONI_BLOCCO) {
      expect(deviazione.motivo.length, deviazione.codice).toBeGreaterThan(40);
      expect(deviazione.app).not.toBe(deviazione.scheda);
    }
  });

  it('i minuti dichiarati da una deviazione sono quelli che la scheda scrive', () => {
    for (const deviazione of DEVIAZIONI_BLOCCO) {
      if (deviazione.minuti === null) continue;
      expect(deviazione.minuti.app, deviazione.codice).not.toBe(deviazione.minuti.scheda);
    }
  });
});
