import type { LevelIndex, TestId } from '../types/index.ts';

/**
 * Valori di esempio del foglio Test_Livelli della scheda.
 *
 * Non sono i dati dell'utente e l'app non li usa mai come tali: la scheda li
 * marca esplicitamente come esempi e l'onboarding della Settimana 0 li
 * sostituisce. Servono a una cosa sola, ma importante: verificare che il
 * calcolo del range del motore riproduca i numeri della scheda.
 *
 * Attenzione: il file .xlsx non contiene nessuna formula, in nessun foglio.
 * Ogni valore "calcolato" della scheda è testo scritto a mano. È il motivo per
 * cui questi numeri vanno trattati come casi di prova, non come verità.
 */
export interface TestReferenceRow {
  readonly testId: TestId;
  /** Ripetizioni o secondi massimi dell'esempio. */
  readonly maxReps: number;
  /** Range minimo scritto nella scheda. */
  readonly rangeMin: number;
  /** Range massimo scritto nella scheda. */
  readonly rangeMax: number;
  /**
   * `true` quando la scheda scrive un range che la formula 55%-75% non
   * produce. L'unico caso è il nordic curl.
   */
  readonly divergesFromFormula: boolean;
  /** Testo della colonna "Livello di partenza calcolato". */
  readonly startingLevelNote: string;
  /**
   * Numero di livello dichiarato in quel testo, `null` quando la scheda ne
   * indica due ("Livello 4-5") o nessuno.
   */
  readonly statedLevel: LevelIndex | null;
  /**
   * Livello a cui corrisponde davvero la variante *descritta* nel testo,
   * letto sulla scala del foglio Progressioni. `null` quando la descrizione
   * non identifica un gradino solo.
   *
   * Dove i due campi divergono, la scheda contraddice la propria scala.
   */
  readonly scaleLevelForNote: LevelIndex | null;
}

export const TEST_REFERENCE_ROWS: readonly TestReferenceRow[] = Object.freeze([
  {
    testId: 'pull-up',
    maxReps: 10,
    rangeMin: 6,
    rangeMax: 8,
    divergesFromFormula: false,
    startingLevelNote: 'Livello 4: aggiungi pausa 1 sec in alto e tempo 3-0-1-1',
    statedLevel: 4,
    scaleLevelForNote: 4,
  },
  {
    testId: 'dip',
    maxReps: 12,
    rangeMin: 7,
    rangeMax: 9,
    divergesFromFormula: false,
    startingLevelNote: 'Livello 4: dip agli anelli o con pausa',
    statedLevel: 4,
    scaleLevelForNote: null,
  },
  {
    testId: 'push-up',
    maxReps: 30,
    rangeMin: 17,
    rangeMax: 23,
    divergesFromFormula: false,
    startingLevelNote: 'Livello 4-5: archer push-up o piedi rialzati + zavorra',
    statedLevel: null,
    scaleLevelForNote: 5,
  },
  {
    testId: 'inverted-row-trx',
    maxReps: 18,
    rangeMin: 10,
    rangeMax: 14,
    divergesFromFormula: false,
    startingLevelNote: 'Livello 4: monobraccio o zavorra',
    statedLevel: 4,
    scaleLevelForNote: 5,
  },
  {
    testId: 'pike-push-up',
    maxReps: 8,
    rangeMin: 4,
    rangeMax: 6,
    divergesFromFormula: false,
    startingLevelNote: 'Livello 3: piedi rialzati',
    statedLevel: 3,
    scaleLevelForNote: 2,
  },
  {
    testId: 'bulgarian-split-squat',
    maxReps: 15,
    rangeMin: 8,
    rangeMax: 11,
    divergesFromFormula: false,
    startingLevelNote: 'Livello 3: bulgarian con pausa 2 sec',
    statedLevel: 3,
    scaleLevelForNote: 3,
  },
  {
    // La formula darebbe 2-3. La scheda scrive 3-5, che è la prescrizione del
    // programma per il martedì ricopiata nel foglio dei test.
    testId: 'nordic-curl',
    maxReps: 4,
    rangeMin: 3,
    rangeMax: 5,
    divergesFromFormula: true,
    startingLevelNote: 'Livello 2: eccentriche 5 sec complete',
    statedLevel: 2,
    scaleLevelForNote: 3,
  },
  {
    testId: 'hollow-hold',
    maxReps: 45,
    rangeMin: 25,
    rangeMax: 34,
    divergesFromFormula: false,
    startingLevelNote: 'Livello 2: hollow hold completo',
    statedLevel: 2,
    scaleLevelForNote: 3,
  },
  {
    testId: 'dead-hang',
    maxReps: 60,
    rangeMin: 33,
    rangeMax: 45,
    divergesFromFormula: false,
    startingLevelNote: 'Presa adeguata al lavoro con zavorra',
    statedLevel: null,
    scaleLevelForNote: null,
  },
]);

/**
 * Range che il programma prescrive a numero fisso pur citando un test come
 * riferimento di livello. Trascritti dal foglio Programma.
 */
export const FIXED_RANGES_BY_BLOCK: Readonly<Record<string, string>> = Object.freeze({
  'lower-a/B': '3-5 — nordic curl, eccentriche 5"',
  'lower-b/A': '5-8 — nordic curl, livello dalla scala',
  'shadow/A': '30-45" — skill isometrica',
  'shadow/E': 'max — dead hang a cedimento',
});

/**
 * Colonne del foglio Log_Allenamenti, nell'ordine originale.
 * L'export CSV deve riprodurle esattamente per restare compatibile.
 */
export const LOG_CSV_COLUMNS: readonly string[] = Object.freeze([
  'Data',
  'Settimana',
  'Sessione',
  'Esercizio',
  'Variante / Livello',
  'Zavorra (kg)',
  'Rip S1',
  'Rip S2',
  'Rip S3',
  'Rip S4',
  'RIR medio',
  'Rip totali',
  'Note',
]);
