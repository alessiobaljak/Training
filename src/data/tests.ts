import type { TestDefinition, TestId } from '../types/index.ts';

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

export function getTest(id: TestId): TestDefinition {
  const test = BY_ID.get(id);
  if (test === undefined) {
    throw new Error(`Test sconosciuto: ${id}`);
  }
  return test;
}

export { TEST_PROTOCOL_NOTE, TEST_REST_SECONDS } from '../types/test.ts';
