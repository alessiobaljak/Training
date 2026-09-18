import type {
  LevelIndex,
  MeasurementKind,
  MotorPattern,
  TestDefinition,
  TestId,
} from '../types/index.ts';
import { getExercise } from './exercises.ts';

/**
 * I 9 test della Settimana 0.
 *
 * Protocollo: una serie unica a cedimento tecnico, 4-5 minuti di recupero tra
 * un test e l'altro. Il test finisce quando cede la forma.
 *
 * Attenzione alla colonna `plannedSets`: nella scheda si chiama "Serie
 * previste" e indica quante serie quello schema riceve nel programma. Il test
 * in sé è sempre una serie sola.
 *
 * `hollow-hold` e `dead-hang` sono isometrie: il range si calcola sui secondi e
 * il logging usa un cronometro, non un contatore di ripetizioni.
 */
const TEST_LIST = [
  {
    id: 'pull-up',
    order: 1,
    label: 'Trazioni prona (pull-up)',
    exercise: 'trazioni-prona-presa-media',
    measurement: 'reps',
    plannedSets: 4,
    perSide: false,
  },
  {
    id: 'dip',
    order: 2,
    label: 'Dip alle parallele o anelli',
    exercise: 'dip-parallele-anelli',
    measurement: 'reps',
    plannedSets: 4,
    perSide: false,
  },
  {
    id: 'push-up',
    order: 3,
    label: 'Piegamenti (push-up)',
    exercise: 'push-up',
    measurement: 'reps',
    plannedSets: 4,
    perSide: false,
  },
  {
    id: 'inverted-row-trx',
    order: 4,
    label: 'Rematore inverso TRX',
    exercise: 'rematore-inverso-trx',
    measurement: 'reps',
    plannedSets: 3,
    perSide: false,
  },
  {
    id: 'pike-push-up',
    order: 5,
    label: 'Pike push-up piedi rialzati',
    exercise: 'pike-pushup-piedi-rialzati',
    measurement: 'reps',
    plannedSets: 3,
    perSide: false,
  },
  {
    id: 'bulgarian-split-squat',
    order: 6,
    label: 'Bulgarian split squat (per gamba)',
    exercise: 'bulgarian-split-squat',
    measurement: 'reps',
    plannedSets: 4,
    perSide: true,
    note: 'Test per gamba: si registra un massimale per lato.',
  },
  {
    id: 'nordic-curl',
    order: 7,
    label: 'Nordic curl — negative controllate',
    exercise: 'nordic-curl',
    measurement: 'reps',
    plannedSets: 4,
    perSide: false,
  },
  {
    id: 'hollow-hold',
    order: 8,
    label: 'Hollow hold',
    exercise: 'hollow-hold',
    measurement: 'seconds',
    plannedSets: 3,
    perSide: false,
    note: 'Misurato in secondi: cronometro, non contatore di ripetizioni.',
  },
  {
    id: 'dead-hang',
    order: 9,
    label: 'Dead hang',
    exercise: 'dead-hang',
    measurement: 'seconds',
    plannedSets: 2,
    perSide: false,
    note: 'Misurato in secondi. Serve a stimare la presa in vista del lavoro con zavorra.',
  },
] as const satisfies readonly TestDefinition[];

export const WEEK_ZERO_TESTS: readonly TestDefinition[] = TEST_LIST;

const BY_ID: ReadonlyMap<TestId, TestDefinition> = new Map(
  TEST_LIST.map((test) => [test.id, test as TestDefinition]),
);

/**
 * Da dove parte una scala, secondo il test che la misura.
 *
 * `measurement` serve a non applicare il tetto attraverso misure diverse: la
 * scala del core passa dalle tenute in secondi (plank, hollow hold) alle
 * ripetizioni (hanging leg raise, ab wheel), e abbassare un esercizio a
 * ripetizioni fino a un gradino che è una tenuta produrrebbe una prescrizione
 * che l'app non sa registrare — «10-15 ripetizioni di hollow hold».
 */
export interface TestBaseline {
  readonly level: LevelIndex;
  readonly measurement: MeasurementKind;
}

/**
 * Il gradino della scala a cui il test di settimana 0 viene davvero eseguito.
 *
 * Ogni test misura una variante precisa: il test dei push-up è «Push-up a
 * terra», gradino 2 della spinta orizzontale; quello del rematore è «Rematore
 * TRX a 45°», gradino 2 della trazione orizzontale. Ventiquattro push-up a
 * terra dicono quanto vali su quel gradino e niente sugli archer push-up, che
 * sono il gradino 5 e hanno una tecnica diversa.
 *
 * Serve come tetto al livello di partenza: la scheda prescrive il gradino da
 * raggiungere, il test dice da dove si parte.
 */
export function testBaseline(pattern: MotorPattern): TestBaseline | null {
  for (const test of WEEK_ZERO_TESTS) {
    const exercise = getExercise(test.exercise);
    if (exercise.pattern !== pattern) continue;
    if (exercise.defaultLevel === null) return null;
    return { level: exercise.defaultLevel, measurement: exercise.measurement };
  }
  return null;
}

export function getTest(id: TestId): TestDefinition {
  const test = BY_ID.get(id);
  if (test === undefined) {
    throw new Error(`Test sconosciuto: ${id}`);
  }
  return test;
}

export { TEST_PROTOCOL_NOTE, TEST_REST_SECONDS } from '../types/test.ts';
