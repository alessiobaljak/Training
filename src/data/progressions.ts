import type { LevelIndex, MotorPattern, ProgressionScale, ProgressionStep } from '../types/index.ts';
import { MOTOR_PATTERNS, MOTOR_PATTERN_LABELS } from '../types/index.ts';

/**
 * Le 8 scale di progressione a 6 livelli.
 *
 * L'ordine dei gradini è la regola: il livello 4 delle leve del sovraccarico
 * ("variante più difficile") si limita a spostarsi di un passo qui dentro.
 */
const SCALE_NAMES: Readonly<Record<MotorPattern, readonly [string, string, string, string, string, string]>> =
  Object.freeze({
    'vertical-pull': [
      'Trazioni assistite con elastico',
      'Trazioni negative 5"',
      'Trazioni complete',
      'Trazioni con pausa 1" in alto',
      'Archer / L-sit pull-up',
      'Trazioni zavorrate',
    ],
    'horizontal-pull': [
      'Rematore inverso piedi a terra',
      'Rematore TRX a 45°',
      'Rematore TRX orizzontale',
      'Piedi rialzati + pausa 1"',
      'Rematore monobraccio TRX',
      'Rematore inverso zavorrato',
    ],
    'horizontal-push': [
      'Push-up su rialzo',
      'Push-up a terra',
      'Push-up declinati',
      'Pseudo-planche push-up',
      'Archer push-up',
      'Push-up zavorrati / anelli',
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
      'Pistol squat / zavorra',
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
      'Ab wheel completo / L-sit',
    ],
  });

function buildSteps(
  pattern: MotorPattern,
  names: readonly [string, string, string, string, string, string],
): ProgressionScale['steps'] {
  const step = (level: LevelIndex, name: string): ProgressionStep => ({
    level,
    slug: `${pattern}-l${level}`,
    name,
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
