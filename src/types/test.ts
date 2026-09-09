import type { ExerciseSlug } from './exercise.ts';

/** I 9 test della Settimana 0. */
export type TestId =
  | 'pull-up'
  | 'dip'
  | 'push-up'
  | 'inverted-row-trx'
  | 'pike-push-up'
  | 'bulgarian-split-squat'
  | 'nordic-curl'
  | 'hollow-hold'
  | 'dead-hang';

export interface TestDefinition {
  readonly id: TestId;
  /** Ordine di esecuzione nel wizard della Settimana 0. */
  readonly order: number;
  /** Nome del test come compare nella tabella della scheda. */
  readonly label: string;
  /** Esercizio dell'anagrafica su cui il test è eseguito. */
  readonly exercise: ExerciseSlug;
  /**
   * Come si misura il massimale: ripetizioni oppure secondi.
   * Le isometrie usano il cronometro, non il contatore.
   */
  readonly measurement: 'reps' | 'seconds';
  /**
   * Colonna "Serie previste" della scheda: quante serie quello schema riceve
   * nel programma. NON è il numero di serie del test, che è sempre una sola
   * a cedimento tecnico.
   */
  readonly plannedSets: number;
  /** `true` se il test si esegue e si registra per lato. */
  readonly perSide: boolean;
  readonly note?: string;
}

/** Recupero tra un test e l'altro: 4-5 minuti. */
export const TEST_REST_SECONDS: Readonly<{ min: number; max: number }> = Object.freeze({
  min: 240,
  max: 300,
});

export const TEST_PROTOCOL_NOTE =
  'Una serie unica a cedimento tecnico, 4-5 minuti di recupero tra un test e l’altro. ' +
  'Il test finisce quando cede la forma.';
