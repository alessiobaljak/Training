import type { ExerciseSlug } from '../types/index.ts';

/**
 * Le illustrazioni di RepDB, una coppia per esercizio.
 *
 * Sono disegni fatti da illustratori, non figure generate da questo codice:
 * coprono trenta dei trentanove esercizi del programma, compresi quelli dove
 * un disegno serve davvero e che nessun altro archivio ha, come archer
 * push-up, nordic curl, pike push-up e hollow hold.
 *
 * Per i nove scoperti restano le figure in `src/assets/exercises/`. Quattro
 * non sono esercizi (camminata, corsa, mobilità, zona 2); gli altri cinque
 * sono shrimp squat, sissy squat, croci con manubri, L-sit e verticale al
 * muro, che RepDB non ha.
 *
 * **Licenza.** Uso libero dentro l'applicazione, anche commerciale, con una
 * attribuzione visibile: la trovi nella schermata «App e dati». Due vincoli
 * che questo file rispetta per costruzione:
 *
 * - Si copiano solo le immagini effettivamente usate, non l'archivio: il
 *   termine 3 vieta di ripubblicare il dataset come dataset.
 * - Non si derivano nuovi disegni da questi: il termine 5 esclude l'uso come
 *   riferimento per modelli generativi.
 *
 * `source` è l'identificativo RepDB da cui viene la coppia. Serve a poter
 * rifare la mappatura quando l'archivio si aggiorna, senza indovinare.
 */

export const ART_ATTRIBUTION = {
  text: 'Illustrazioni degli esercizi di RepDB',
  href: 'https://repdb.co',
} as const;

export interface RepDbFrames {
  /** L'identificativo dell'esercizio nell'archivio RepDB. */
  readonly source: string;
  /** Il nome inglese, per ritrovarlo. */
  readonly label: string;
  /** Inizio e fine del movimento. Le isometrie ne hanno una sola. */
  readonly frames: readonly string[];
}

/*
 * Un esercizio, un disegno.
 *
 * C'era un campo `alternative` per la seconda variante di una riga a due nomi.
 * Le righe a due nomi non esistono più: o sono due esercizi, e allora ognuno
 * ha la sua voce qui, o sono due gradini della stessa scala, e allora la
 * seconda immagine andrebbe legata al gradino, non all'esercizio.
 */
/*
 * Le illustrazioni legate al gradino, non all'esercizio.
 *
 * Il disegno seguiva l'esercizio: al blocco A2 del giovedì il titolo diceva
 * «Push-up archer», il gradino vero era il 3 — push-up declinati — e
 * l'illustrazione continuava a mostrare gli archer. Qui stanno i gradini di
 * cui RepDB ha davvero il disegno; per tutti gli altri c'è la figura
 * schematica, che è generata gradino per gradino.
 */
/*
 * Gli accoppiamenti scartati, e perché.
 *
 * Il catalogo ha un'immagine per esercizio, io ho un gradino per variante: a
 * volte l'immagine più vicina mostra qualcosa che il gradino non prescrive, e
 * allora non va bene. È lo stesso difetto che abbiamo appena tolto — mostrare
 * un movimento per un altro — solo più difficile da notare.
 *
 * - `hip-thrust` e `romanian-deadlift`: hanno il bilanciere addosso, e i
 *   gradini 2 dell'hip thrust e dell'hip hinge sono a corpo libero.
 * - `dumbbell-calf-raise`: a due gambe, e il gradino 6 dei polpacci è
 *   monopodalico.
 * - `rings-inverted-row`: i piedi sono a terra, e il gradino 4 della trazione
 *   orizzontale li vuole rialzati.
 */
export const REPDB_STEP_ART: Readonly<Record<string, RepDbFrames>> = {
  'vertical-pull-l1': {
    source: 'band-assisted-pull-ups',
    label: 'Band Assisted Pull Ups',
    frames: [
      'band-assisted-pull-ups-start.webp',
      'band-assisted-pull-ups-peak.webp',
    ],
  },
  'vertical-pull-l2': {
    source: 'negative-pull-ups',
    label: 'Negative Pull Ups',
    frames: [
      'negative-pull-ups-start.webp',
      'negative-pull-ups-peak.webp',
    ],
  },
  'vertical-pull-l4': {
    source: 'pause-pull-up',
    label: 'Pause Pull-Up',
    frames: [
      'pause-pull-up-start.webp',
      'pause-pull-up-peak.webp',
    ],
  },
  'vertical-pull-l5': {
    source: 'archer-pull-ups',
    label: 'Archer Pull Ups',
    frames: [
      'archer-pull-ups-start.webp',
      'archer-pull-ups-peak.webp',
    ],
  },
  'vertical-pull-l6': {
    source: 'weighted-pull-up',
    label: 'Weighted Pull-Up',
    frames: [
      'weighted-pull-up-start.webp',
      'weighted-pull-up-peak.webp',
    ],
  },
  'horizontal-push-l1': {
    source: 'incline-push-ups',
    label: 'Incline Push Ups',
    frames: [
      'incline-push-ups-start.webp',
      'incline-push-ups-peak.webp',
    ],
  },
  'horizontal-push-l3': {
    source: 'decline-push-up',
    label: 'Decline Push-Up',
    frames: [
      'decline-push-up-start.webp',
      'decline-push-up-peak.webp',
    ],
  },
  'dip-l6': {
    source: 'weighted-dips',
    label: 'Weighted Dips',
    frames: [
      'weighted-dips-start.webp',
      'weighted-dips-peak.webp',
    ],
  },
  'single-leg-squat-l1': {
    source: 'split-squat',
    label: 'Split Squat',
    frames: [
      'split-squat-start.webp',
      'split-squat-peak.webp',
    ],
  },
  'single-leg-squat-l6': {
    source: 'pistol-squat',
    label: 'Pistol Squat',
    frames: [
      'pistol-squat-start.webp',
      'pistol-squat-peak.webp',
    ],
  },
  'core-l1': {
    source: 'plank',
    label: 'Plank',
    frames: [
      'plank-main.webp',
    ],
  },
  'core-l4': {
    source: 'hanging-knee-raise',
    label: 'Hanging Knee Raise',
    frames: [
      'hanging-knee-raise-start.webp',
      'hanging-knee-raise-peak.webp',
    ],
  },
  'hip-thrust-l1': {
    source: 'glute-bridge',
    label: 'Glute Bridge',
    frames: [
      'glute-bridge-start.webp',
      'glute-bridge-peak.webp',
    ],
  },
  'hip-hinge-l6': {
    source: 'one-arm-single-leg-dumbbell-romanian-deadlift',
    label: 'One Arm Single Leg Dumbbell Romanian Deadlift',
    frames: [
      'one-arm-single-leg-dumbbell-romanian-deadlift-start.webp',
      'one-arm-single-leg-dumbbell-romanian-deadlift-peak.webp',
    ],
  },
  'calf-l4': {
    source: 'single-leg-calf-raise',
    label: 'Single Leg Calf Raise',
    frames: [
      'single-leg-calf-raise-start.webp',
      'single-leg-calf-raise-peak.webp',
    ],
  },
  'l-sit-l5': {
    source: 'l-sit',
    label: 'L-Sit',
    frames: [
      'l-sit-main.webp',
    ],
  },
  'vertical-pull-l3': {
    source: 'pull-up',
    label: 'Pull-Up',
    frames: ['pull-up-start.webp', 'pull-up-peak.webp'],
  },
  'horizontal-pull-l1': {
    source: 'inverted-row',
    label: 'Inverted Row',
    frames: ['inverted-row-start.webp', 'inverted-row-peak.webp'],
  },
  'horizontal-pull-l3': {
    source: 'trx-row',
    label: 'TRX Row',
    frames: ['trx-row-start.webp', 'trx-row-peak.webp'],
  },
  'horizontal-push-l2': {
    source: 'push-up',
    label: 'Push-Up',
    frames: ['push-up-start.webp', 'push-up-peak.webp'],
  },
  'horizontal-push-l4': {
    source: 'pseudo-planche-push-ups',
    label: 'Pseudo Planche Push Ups',
    frames: ['pseudo-planche-push-ups-start.webp', 'pseudo-planche-push-ups-peak.webp'],
  },
  'horizontal-push-l5': {
    source: 'archer-push-ups',
    label: 'Archer Push Ups',
    frames: ['archer-push-ups-start.webp', 'archer-push-ups-peak.webp'],
  },
  'vertical-push-l1': {
    source: 'pike-push-ups',
    label: 'Pike Push Ups',
    frames: ['pike-push-ups-start.webp', 'pike-push-ups-peak.webp'],
  },
  'vertical-push-l5': {
    source: 'handstand-push-ups',
    label: 'Handstand Push Ups',
    frames: ['handstand-push-ups-start.webp', 'handstand-push-ups-peak.webp'],
  },
  'dip-l1': {
    source: 'bench-dips',
    label: 'Bench Dips',
    frames: ['bench-dips-start.webp', 'bench-dips-peak.webp'],
  },
  'dip-l3': {
    source: 'dips',
    label: 'Dips',
    frames: ['dips-start.webp', 'dips-peak.webp'],
  },
  'dip-l5': {
    source: 'ring-dips',
    label: 'Ring Dips',
    frames: ['ring-dips-start.webp', 'ring-dips-peak.webp'],
  },
  'single-leg-squat-l2': {
    source: 'bulgarian-split-squat',
    label: 'Bulgarian Split Squat',
    frames: ['bulgarian-split-squat-start.webp', 'bulgarian-split-squat-peak.webp'],
  },
  'posterior-chain-l1': {
    source: 'single-leg-glute-bridge',
    label: 'Single Leg Glute Bridge',
    frames: ['single-leg-glute-bridge-start.webp', 'single-leg-glute-bridge-peak.webp'],
  },
  'posterior-chain-l6': {
    source: 'nordic-hamstring-curl',
    label: 'Nordic Hamstring Curl',
    frames: ['nordic-hamstring-curl-start.webp', 'nordic-hamstring-curl-peak.webp'],
  },
  'hip-thrust-l3': {
    source: 'single-leg-glute-bridge',
    label: 'Single Leg Glute Bridge',
    frames: ['single-leg-glute-bridge-start.webp', 'single-leg-glute-bridge-peak.webp'],
  },
  'hip-hinge-l4': {
    source: 'single-leg-romanian-deadlift',
    label: 'Single Leg Romanian Deadlift',
    frames: ['single-leg-romanian-deadlift-start.webp', 'single-leg-romanian-deadlift-peak.webp'],
  },
  'calf-l2': {
    source: 'bodyweight-calf-raise',
    label: 'Bodyweight Calf Raise',
    frames: ['bodyweight-calf-raise-start.webp', 'bodyweight-calf-raise-peak.webp'],
  },
  'step-up-l2': {
    source: 'step-ups',
    label: 'Step Ups',
    frames: ['step-ups-start.webp', 'step-ups-peak.webp'],
  },
  'core-l3': {
    source: 'hollow-body-hold',
    label: 'Hollow Body Hold',
    frames: ['hollow-body-hold-main.webp'],
  },
  'core-l5': {
    source: 'hanging-leg-raise',
    label: 'Hanging Leg Raise',
    frames: ['hanging-leg-raise-start.webp', 'hanging-leg-raise-peak.webp'],
  },
  'core-l6': {
    source: 'ab-wheel-rollout',
    label: 'Ab Wheel Rollout',
    frames: ['ab-wheel-rollout-start.webp', 'ab-wheel-rollout-peak.webp'],
  },
  'wall-sit-l2': {
    source: 'wall-sit',
    label: 'Wall Sit',
    frames: ['wall-sit-main.webp'],
  },
  'hang-l2': {
    source: 'dead-hang',
    label: 'Dead Hang',
    frames: ['dead-hang-main.webp'],
  },
};

export const REPDB_ART: Partial<Record<ExerciseSlug, RepDbFrames>> = {
  'trazioni-prona-presa-media': {
    source: 'pull-up',
    label: 'Pull-Up',
    frames: ['pull-up-start.webp', 'pull-up-peak.webp'],
  },
  'trazioni-presa-larga': {
    source: 'wide-grip-pull-ups',
    label: 'Wide Grip Pull Ups',
    frames: ['wide-grip-pull-ups-start.webp', 'wide-grip-pull-ups-peak.webp'],
  },
  'chin-up-presa-supina': {
    source: 'chin-ups',
    label: 'Chin-Ups',
    frames: ['chin-ups-start.webp', 'chin-ups-peak.webp'],
  },
  'chin-up-presa-supina-stretta': {
    source: 'close-grip-pull-ups',
    label: 'Close-Grip Pull-Ups',
    frames: ['close-grip-pull-ups-start.webp', 'close-grip-pull-ups-peak.webp'],
  },
  'rematore-inverso-trx': {
    source: 'inverted-row',
    label: 'Inverted Row',
    frames: ['inverted-row-start.webp', 'inverted-row-peak.webp'],
  },
  'rematore-inverso-trx-piedi-rialzati': {
    source: 'rings-inverted-row',
    label: 'Rings Inverted Row',
    frames: ['rings-inverted-row-start.webp', 'rings-inverted-row-peak.webp'],
  },
  'rematore-trx-monobraccio': {
    source: 'trx-row',
    label: 'TRX Row',
    frames: ['trx-row-start.webp', 'trx-row-peak.webp'],
  },
  'push-up': {
    source: 'push-up',
    label: 'Push-Up',
    frames: ['push-up-start.webp', 'push-up-peak.webp'],
  },
  'pushup-archer-o-pseudo-planche': {
    source: 'archer-push-ups',
    label: 'Archer Push Ups',
    frames: ['archer-push-ups-start.webp', 'archer-push-ups-peak.webp'],
  },
  /*
   * RepDB non ha le croci con elastico. Il disegno che avevamo è quello del
   * push-up presa larga, che è la seconda variante della riga: sta al suo
   * posto, sotto l'alternativa. Per la prima resta la figura schematica.
   */
  'dip-parallele-anelli': {
    source: 'dips',
    label: 'Chest Dips',
    frames: ['dips-start.webp', 'dips-peak.webp'],
  },
  'dip-panche-o-diamond-pushup': {
    source: 'diamond-push-ups',
    label: 'Diamond Push Ups',
    frames: ['diamond-push-ups-start.webp', 'diamond-push-ups-peak.webp'],
  },
  'croci-elastico-o-pushup-presa-larga': {
    source: 'db-fly',
    label: 'Dumbbell Fly',
    frames: ['db-fly-start.webp', 'db-fly-peak.webp'],
  },
  'l-sit': {
    source: 'l-sit',
    label: 'L-Sit',
    frames: ['l-sit-main.webp'],
  },
  'dip-panche': {
    source: 'bench-dips',
    label: 'Bench Dips',
    frames: ['bench-dips-start.webp', 'bench-dips-peak.webp'],
  },
  'dip-panche-piedi-rialzati': {
    source: 'bench-dips',
    label: 'Bench Dips',
    frames: ['bench-dips-start.webp', 'bench-dips-peak.webp'],
  },
  'pike-pushup-piedi-rialzati': {
    source: 'pike-push-ups',
    label: 'Pike Push Ups',
    frames: ['pike-push-ups-start.webp', 'pike-push-ups-peak.webp'],
  },
  'negative-hspu-muro-o-pike-pushup': {
    source: 'handstand-push-ups',
    label: 'Handstand Push Ups',
    frames: ['handstand-push-ups-start.webp', 'handstand-push-ups-peak.webp'],
  },
  'bulgarian-split-squat': {
    source: 'bulgarian-split-squat',
    label: 'Bulgarian Split Squat',
    frames: ['bulgarian-split-squat-start.webp', 'bulgarian-split-squat-peak.webp'],
  },
  /*
   * Divisi in due esercizi, quindi anche i disegni si dividono: RepDB ha il
   * wall sit e non ha il sissy squat, che resta con la figura schematica di
   * `src/assets/exercises/`.
   */
  'wall-sit': {
    source: 'wall-sit',
    label: 'Wall Sit',
    frames: ['wall-sit-main.webp'],
  },
  'nordic-curl': {
    source: 'nordic-hamstring-curl',
    label: 'Nordic Hamstring Curl',
    frames: ['nordic-hamstring-curl-start.webp', 'nordic-hamstring-curl-peak.webp'],
  },
  'hip-thrust-monopodalico': {
    source: 'single-leg-glute-bridge',
    label: 'Single Leg Glute Bridge',
    frames: ['single-leg-glute-bridge-start.webp', 'single-leg-glute-bridge-peak.webp'],
  },
  'single-leg-rdl': {
    source: 'single-leg-romanian-deadlift',
    label: 'Single Leg Romanian Deadlift',
    frames: ['single-leg-romanian-deadlift-start.webp', 'single-leg-romanian-deadlift-peak.webp'],
  },
  'step-up-box-alto': {
    source: 'step-ups',
    label: 'Step Ups',
    frames: ['step-ups-start.webp', 'step-ups-peak.webp'],
  },
  'calf-monopodalico-rialzo': {
    source: 'bodyweight-calf-raise',
    label: 'Bodyweight Calf Raise',
    frames: ['bodyweight-calf-raise-start.webp', 'bodyweight-calf-raise-peak.webp'],
  },
  'calf-monopodalico-seduto': {
    source: 'seated-calf-raise',
    label: 'Seated Calf Raise',
    frames: ['seated-calf-raise-start.webp', 'seated-calf-raise-peak.webp'],
  },
  'hollow-hold': {
    source: 'hollow-body-hold',
    label: 'Hollow Body Hold',
    frames: ['hollow-body-hold-main.webp'],
  },
  'hanging-leg-raise': {
    source: 'hanging-leg-raise',
    label: 'Hanging Leg Raise',
    frames: ['hanging-leg-raise-start.webp', 'hanging-leg-raise-peak.webp'],
  },
  'ab-wheel-o-rollout-trx': {
    source: 'ab-wheel-rollout',
    label: 'Ab Wheel Rollout',
    frames: ['ab-wheel-rollout-start.webp', 'ab-wheel-rollout-peak.webp'],
  },
  'dead-hang': {
    source: 'dead-hang',
    label: 'Dead Hang',
    frames: ['dead-hang-main.webp'],
  },
  'alzate-laterali-elastico': {
    source: 'lateral-raise',
    label: 'Dumbbell Lateral Raise',
    frames: ['lateral-raise-start.webp', 'lateral-raise-peak.webp'],
  },
  'curl-elastico-presa-neutra': {
    source: 'hammer-curl',
    label: 'Dumbbell Hammer Curl',
    frames: ['hammer-curl-start.webp', 'hammer-curl-peak.webp'],
  },
  'face-pull-elastico': {
    source: 'trx-face-pull',
    label: 'TRX Face Pull',
    frames: ['trx-face-pull-start.webp', 'trx-face-pull-peak.webp'],
  },
};
