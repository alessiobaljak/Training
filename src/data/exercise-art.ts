import type { ExerciseSlug } from '../types/index.ts';

/**
 * Le illustrazioni di RepDB, una coppia per esercizio.
 *
 * Sono disegni fatti da illustratori, non figure generate da questo codice:
 * coprono trenta dei trentasette esercizi del programma, compresi quelli dove
 * un disegno serve davvero e che nessun altro archivio ha, come archer
 * push-up, nordic curl, pike push-up e hollow hold.
 *
 * Per i sette scoperti restano le figure in `src/assets/exercises/`. Quattro
 * non sono esercizi (camminata, corsa, mobilità, zona 2); gli altri tre sono
 * shrimp squat, sissy squat e croci con elastico, che RepDB non ha — delle
 * croci ha però il push-up a presa larga, tenuto come variante alternativa.
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

export interface RepDbArt extends RepDbFrames {
  /**
   * Il disegno della seconda variante, quando la riga della scheda ne offre
   * due e RepDB ha anche quella. Senza, la variante alternativa resterebbe
   * descritta a parole e mostrata con il disegno di un altro esercizio.
   */
  readonly alternative?: RepDbFrames;
}

export const REPDB_ART: Partial<Record<ExerciseSlug, RepDbArt>> = {
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
    alternative: {
      source: 'pseudo-planche-push-ups',
      label: 'Pseudo Planche Push Ups',
      frames: ['pseudo-planche-push-ups-start.webp', 'pseudo-planche-push-ups-peak.webp'],
    },
  },
  /*
   * RepDB non ha le croci con elastico. Il disegno che avevamo è quello del
   * push-up presa larga, che è la seconda variante della riga: sta al suo
   * posto, sotto l'alternativa. Per la prima resta la figura schematica.
   */
  'croci-elastico-o-pushup-presa-larga': {
    source: '',
    label: '',
    frames: [],
    alternative: {
      source: 'wide-grip-push-ups',
      label: 'Wide Grip Push Ups',
      frames: ['wide-grip-push-ups-start.webp', 'wide-grip-push-ups-peak.webp'],
    },
  },
  'dip-parallele-anelli': {
    source: 'dips',
    label: 'Chest Dips',
    frames: ['dips-start.webp', 'dips-peak.webp'],
    alternative: {
      source: 'ring-dips',
      label: 'Ring Dips',
      frames: ['ring-dips-start.webp', 'ring-dips-peak.webp'],
    },
  },
  'dip-panche-o-diamond-pushup': {
    source: 'diamond-push-ups',
    label: 'Diamond Push Ups',
    frames: ['diamond-push-ups-start.webp', 'diamond-push-ups-peak.webp'],
    alternative: {
      source: 'bench-dips',
      label: 'Bench Dips',
      frames: ['bench-dips-start.webp', 'bench-dips-peak.webp'],
    },
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
    alternative: {
      source: 'pike-push-ups',
      label: 'Pike Push Ups',
      frames: ['pike-push-ups-start.webp', 'pike-push-ups-peak.webp'],
    },
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
  'skill-isometrica': {
    source: 'planche',
    label: 'Planche',
    frames: ['planche-main.webp'],
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
