import type { LevelIndex, MotorPattern, ProgressionScale, ProgressionStep } from '../types/index.ts';
import { MOTOR_PATTERNS, MOTOR_PATTERN_LABELS } from '../types/index.ts';

/**
 * Le 8 scale di progressione a 6 livelli.
 *
 * L'ordine dei gradini è la regola: il livello 4 delle leve del sovraccarico
 * ("variante più difficile") si limita a spostarsi di un passo qui dentro.
 *
 * Un solo gradino si scosta dalla scheda: il livello 6 della trazione
 * orizzontale. Vedi il commento sul posto.
 */
const SCALE_NAMES: Readonly<Record<MotorPattern, readonly [string, string, string, string, string, string]>> =
  Object.freeze({
    'vertical-pull': [
      'Trazioni assistite',
      'Trazioni negative 5"',
      'Trazioni complete',
      'Trazioni con pausa 1" in alto',
      'Archer pull-up',
      'Trazioni zavorrate',
    ],
    'horizontal-pull': [
      /* T-37: una scala, un attrezzo. La Seduta 2 è agli anelli; l'1 dice l'angolo. */
      'Rematore agli anelli a 60°',
      'Rematore agli anelli a 45°',
      'Rematore agli anelli orizzontale',
      'Piedi rialzati + pausa 1"',
      'Rematore monobraccio agli anelli',
      // Scostamento voluto dalla scheda, che qui scrive "Rematore inverso
      // zavorrato". Il foglio Zavorra non elenca i rematori tra gli esercizi
      // zavorrabili, quindi quel gradino sarebbe stato irraggiungibile. Al suo
      // posto la progressione a corpo libero che segue il monobraccio.
      'Rematore monobraccio piedi rialzati',
    ],
    'horizontal-push': [
      'Push-up su rialzo',
      'Push-up a terra',
      'Push-up declinati',
      'Pseudo-planche push-up',
      'Archer push-up',
      'Push-up zavorrati',
    ],
    'vertical-push': [
      'Pike push-up a terra',
      'Pike push-up piedi rialzati',
      'Negative HSPU al muro 5"',
      'HSPU al muro parziali',
      'HSPU al muro complete',
      'HSPU con deficit',
    ],
    dip: [
      'Dip tra due panche',
      'Dip negativi alle parallele',
      'Dip completi alle parallele',
      'Dip con pausa 1" in basso',
      'Dip agli anelli',
      'Dip zavorrati',
    ],
    'single-leg-squat': [
      'Split squat a terra',
      'Bulgarian split squat',
      'Bulgarian con pausa 2"',
      'Skater squat',
      'Shrimp squat',
      'Pistol squat',
    ],
    'posterior-chain': [
      'Glute bridge monopodalico',
      'Nordic eccentrico assistito elastico',
      'Nordic eccentrico 5" completo',
      'Nordic eccentrico 8"',
      'Nordic con risalita assistita',
      'Nordic completo',
    ],
    core: [
      'Plank 45"',
      'Hollow hold ginocchia piegate',
      'Hollow hold completo',
      'Hanging knee raise',
      'Hanging leg raise',
      'Ab wheel completo',
    ],

    /*
     * Le cinque scale aggiunte. Non vengono dal foglio Scale_Progressioni: il
     * foglio prescriveva questi sei esercizi già nella loro forma avanzata e
     * non offriva nessun gradino più facile. Sono dichiarate in
     * `SCALE_AGGIUNTE` con il motivo.
     */
    'hip-thrust': [
      'Glute bridge a terra, due gambe',
      'Hip thrust spalle su panca, due gambe',
      'Glute bridge monopodalico a terra',
      'Hip thrust monopodalico, spalle su panca',
      'Hip thrust monopodalico con pausa 2"',
      'Hip thrust monopodalico zavorrato',
    ],
    'hip-hinge': [
      'Hip hinge a due gambe con bastone',
      'RDL a due gambe a corpo libero',
      'Single-leg RDL con mano d’appoggio',
      'Single-leg RDL a corpo libero',
      'Single-leg RDL con pausa 2" in basso',
      'Single-leg RDL zavorrato',
    ],
    /*
     * I gradini non nominano la posizione, perché la scala serve sia al calf
     * in piedi su rialzo sia a quello seduto: il gesto è lo stesso, la
     * posizione la dice il nome dell'esercizio. Nominarla qui avrebbe dato
     * «Calf monopodalico seduto» con variante «Monopodalico su rialzo».
     */
    calf: [
      'Due gambe, range parziale',
      'Due gambe, range completo',
      'Monopodalico, range parziale',
      'Monopodalico, range completo',
      'Monopodalico con pausa 2" in basso',
      'Monopodalico zavorrato',
    ],
    'step-up': [
      'Box a metà tibia',
      'Box all’altezza del ginocchio',
      'Ginocchio+, discesa 2" senza slancio',
      'Box sopra il ginocchio',
      'Con pausa 2" in alto',
      'Zavorrato',
    ],
    /*
     * Il gradino 6 non è zavorrato, ed è una scelta: un peso in mano su un
     * ginocchio già molto flesso aggiunge taglio sull'articolazione senza
     * aggiungere molto ai quadricipiti. Sopra al braccia incrociate si sale
     * rallentando l'eccentrica, come fa il gradino 6 della trazione
     * orizzontale per un motivo diverso.
     */
    'sissy-squat': [
      'Con due mani d’appoggio',
      'Con una mano d’appoggio',
      'A corpo libero',
      'Con pausa 2" in basso',
      'A braccia incrociate',
      'Con eccentrica 5"',
    ],
    /*
     * Tre scale per tre tenute. Si misurano tutte in secondi, quindi la
     * progressione non può essere «più ripetizioni»: è una posizione più dura
     * a parità di tempo. Nessuna arriva alla zavorra, che su una tenuta
     * cambierebbe l'esercizio invece di renderlo più difficile.
     */
    handstand: [
      'Plank a mani alte contro il muro',
      'Verticale al muro, schiena al muro',
      'Verticale al muro, pancia al muro',
      'Verticale al muro con una gamba staccata',
      'Tentativi di verticale libera',
      'Verticale libera tenuta',
    ],
    'wall-sit': [
      'Sopra il parallelo',
      'Cosce parallele a 90°',
      'A 90° con le braccia incrociate',
      'A 90° con una gamba sollevata',
      'Monopodalico, coscia parallela',
      'Monopodalico con il piede su un rialzo',
    ],
    /*
     * Scala aggiunta: il foglio non ha l'L-sit, lo nomina soltanto come terzo
     * nome del gradino 6 del core e della riga «Skill» dello Shadow. Ma la sua
     * progressione non è quella del core: si sale aprendo le gambe, non
     * allungando la leva del busto, e mettere l'L-sit sul gradino dell'ab
     * wheel voleva dire che il gradino più facile offerto era un plank.
     */
    'l-sit': [
      'Appoggio a terra, piedi che sfiorano',
      'Tuck sit: ginocchia al petto',
      'Advanced tuck: bacino sotto, ginocchia avanti',
      'Una gamba distesa, l’altra raccolta',
      'L-sit completo',
      'L-sit ai parallettes, 20"',
    ],
    hang: [
      'Sospensione con i piedi che sfiorano terra',
      'Dead hang a due mani',
      'Dead hang con presa a pinza sulla trave',
      'Dead hang a una mano con l’altra sul polso',
      'Dead hang a una mano',
      'Dead hang a una mano su asciugamano',
    ],
  });

function buildSteps(
  pattern: MotorPattern,
  names: readonly [string, string, string, string, string, string],
): ProgressionScale['steps'] {
  const perSide = SCALE_PER_SIDE[pattern];
  const soloEccentrico = SCALE_ECCENTRIC_ONLY[pattern] ?? [];
  const step = (level: LevelIndex, name: string): ProgressionStep => ({
    level,
    slug: `${pattern}-l${level}`,
    name,
    perSide: perSide[level - 1] ?? false,
    eccentricOnly: soloEccentrico[level - 1] ?? false,
  });
  return [
    step(1, names[0]),
    step(2, names[1]),
    step(3, names[2]),
    step(4, names[3]),
    step(5, names[4]),
    step(6, names[5]),
  ];
}

/**
 * Quali gradini si eseguono un lato per volta.
 *
 * Sta accanto ai nomi perché descrive gli stessi gradini, uno per uno. Dentro
 * la stessa scala convivono gesti bilaterali e unilaterali: la trazione
 * orizzontale diventa monobraccio al gradino 5, la catena posteriore parte dal
 * glute bridge monopodalico e passa ai nordic a due gambe. Chi scende dal
 * rematore monobraccio al rematore a 45° non deve più registrare due lati.
 */
const SCALE_PER_SIDE: Readonly<
  Record<MotorPattern, readonly [boolean, boolean, boolean, boolean, boolean, boolean]>
> = Object.freeze({
  'vertical-pull': [false, false, false, false, false, false],
  /* 5 e 6 sono i monobraccio. */
  'horizontal-pull': [false, false, false, false, true, true],
  'horizontal-push': [false, false, false, false, false, false],
  'vertical-push': [false, false, false, false, false, false],
  dip: [false, false, false, false, false, false],
  /* Tutta la scala è su una gamba, dallo split squat al pistol. */
  'single-leg-squat': [true, true, true, true, true, true],
  /* Solo il glute bridge del gradino 1; i nordic sono a due gambe. */
  'posterior-chain': [true, false, false, false, false, false],
  core: [false, false, false, false, false, false],
  /* Bilaterali i primi due gradini, poi si passa a una gamba per volta. */
  'hip-thrust': [false, false, true, true, true, true],
  'hip-hinge': [false, false, true, true, true, true],
  calf: [false, false, true, true, true, true],
  /* Lo step-up è su una gamba a ogni altezza di box. */
  'step-up': [true, true, true, true, true, true],
  'sissy-squat': [false, false, false, false, false, false],
  handstand: [false, false, false, false, false, false],
  /* Dal quarto gradino in poi si tiene una gamba per volta. */
  'wall-sit': [false, false, false, true, true, true],
  /* Il gradino 4 tiene una gamba distesa per volta. */
  'l-sit': [false, false, false, true, false, false],
  /* Dal quarto gradino in poi si resta appesi a una mano per volta. */
  hang: [false, false, false, true, true, true],
});

/**
 * Quali gradini hanno solo la fase eccentrica. Le scale non elencate non ne
 * hanno nessuno. Il nome del gradino lo dice già — «negative», «eccentrico» —
 * e un test controlla che flag e nome restino d'accordo.
 */
const SCALE_ECCENTRIC_ONLY: Partial<
  Record<MotorPattern, readonly [boolean, boolean, boolean, boolean, boolean, boolean]>
> = Object.freeze({
  'vertical-pull': [false, true, false, false, false, false],
  'vertical-push': [false, false, true, false, false, false],
  dip: [false, true, false, false, false, false],
  'posterior-chain': [false, true, true, true, false, false],
});

export const PROGRESSION_SCALES: readonly ProgressionScale[] = Object.freeze(
  MOTOR_PATTERNS.map((pattern) => ({
    pattern,
    label: MOTOR_PATTERN_LABELS[pattern],
    steps: buildSteps(pattern, SCALE_NAMES[pattern]),
  })),
);

const BY_PATTERN: ReadonlyMap<MotorPattern, ProgressionScale> = new Map(
  PROGRESSION_SCALES.map((scale) => [scale.pattern, scale]),
);

export function getProgressionScale(pattern: MotorPattern): ProgressionScale {
  const scale = BY_PATTERN.get(pattern);
  if (scale === undefined) {
    throw new Error(`Scala di progressione sconosciuta: ${pattern}`);
  }
  return scale;
}

export function getProgressionStep(pattern: MotorPattern, level: LevelIndex): ProgressionStep {
  const step = getProgressionScale(pattern).steps[level - 1];
  if (step === undefined) {
    throw new Error(`Livello fuori scala: ${pattern} livello ${String(level)}`);
  }
  return step;
}

/**
 * Il gradino sopra o sotto, saltando quelli solo eccentrici quando serve.
 *
 * `saltaEccentrici` è vero sui range fissi del circuito: lì un gradino di
 * sole negative non si esegue come la scheda chiede, e passare dalle
 * trazioni complete alle negative «per scendere» voleva dire prescrivere un
 * gesto diverso con il range e il tempo dell'altro. Sul programma
 * archiviato, dove il range viene dal test, i gradini eccentrici restano
 * tappe della scala come prima.
 *
 * `null` quando non c'è un gradino eseguibile in quella direzione.
 */
export function adjacentLevel(
  pattern: MotorPattern,
  level: LevelIndex,
  direction: 1 | -1,
  saltaEccentrici: boolean,
): LevelIndex | null {
  for (let candidato = level + direction; candidato >= 1 && candidato <= 6; candidato += direction) {
    const step = getProgressionStep(pattern, candidato as LevelIndex);
    if (saltaEccentrici && step.eccentricOnly) continue;
    return candidato as LevelIndex;
  }
  return null;
}
