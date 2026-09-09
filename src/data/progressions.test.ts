import { describe, expect, it } from 'vitest';
import { PROGRESSION_SCALES, getProgressionScale, getProgressionStep } from './progressions.ts';
import { MOTOR_PATTERNS, OVERLOAD_LEVERS, ECCENTRIC_TEMPO_LADDER, ISO_PAUSE_LADDER } from '../types/index.ts';
import type { MotorPattern } from '../types/index.ts';

/** Seconda trascrizione, indipendente, della tabella delle scale di progressione. */
const EXPECTED: ReadonlyArray<readonly [MotorPattern, readonly string[]]> = [
  [
    'vertical-pull',
    [
      'Trazioni assistite con elastico',
      'Trazioni negative 5"',
      'Trazioni complete',
      'Trazioni con pausa 1" in alto',
      'Archer / L-sit pull-up',
      'Trazioni zavorrate',
    ],
  ],
  [
    'horizontal-pull',
    [
      'Rematore inverso piedi a terra',
      'Rematore TRX a 45°',
      'Rematore TRX orizzontale',
      'Piedi rialzati + pausa 1"',
      'Rematore monobraccio TRX',
      'Rematore inverso zavorrato',
    ],
  ],
  [
    'horizontal-push',
    [
      'Push-up su rialzo',
      'Push-up a terra',
      'Push-up declinati',
      'Pseudo-planche push-up',
      'Archer push-up',
      'Push-up zavorrati / anelli',
    ],
  ],
  [
    'vertical-push',
    [
      'Pike push-up a terra',
      'Pike push-up piedi rialzati',
      'Negative HSPU al muro 5"',
      'HSPU al muro parziali',
      'HSPU al muro complete',
      'HSPU con deficit',
    ],
  ],
  [
    'dip',
    [
      'Dip tra due panche',
      'Dip negativi alle parallele',
      'Dip completi alle parallele',
      'Dip con pausa 1" in basso',
      'Dip agli anelli',
      'Dip zavorrati',
    ],
  ],
  [
    'single-leg-squat',
    [
      'Split squat a terra',
      'Bulgarian split squat',
      'Bulgarian con pausa 2"',
      'Skater squat',
      'Shrimp squat',
      'Pistol squat / zavorra',
    ],
  ],
  [
    'posterior-chain',
    [
      'Glute bridge monopodalico',
      'Nordic eccentrico assistito elastico',
      'Nordic eccentrico 5" completo',
      'Nordic eccentrico 8"',
      'Nordic con risalita assistita',
      'Nordic completo',
    ],
  ],
  [
    'core',
    [
      'Plank 45"',
      'Hollow hold ginocchia piegate',
      'Hollow hold completo',
      'Hanging knee raise',
      'Hanging leg raise',
      'Ab wheel completo / L-sit',
    ],
  ],
];

describe('progressions.ts — 8 scale da 6 livelli', () => {
  it('copre tutti e soli gli 8 schemi motori', () => {
    expect(PROGRESSION_SCALES).toHaveLength(8);
    expect(PROGRESSION_SCALES.map((s) => s.pattern)).toEqual([...MOTOR_PATTERNS]);
  });

  it.each(EXPECTED)('la scala %s corrisponde alla scheda', (pattern, names) => {
    const scale = getProgressionScale(pattern);
    expect(scale.steps.map((s) => s.name)).toEqual(names);
    expect(scale.steps.map((s) => s.level)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('usa slug di livello unici in tutto il seed', () => {
    const slugs = PROGRESSION_SCALES.flatMap((s) => s.steps.map((step) => step.slug));
    expect(slugs).toHaveLength(48);
    expect(new Set(slugs).size).toBe(48);
  });

  it('getProgressionStep restituisce il gradino richiesto', () => {
    expect(getProgressionStep('dip', 5).name).toBe('Dip agli anelli');
    expect(getProgressionStep('core', 1).name).toBe('Plank 45"');
  });

  it('solleva su uno schema motorio sconosciuto', () => {
    // @ts-expect-error: il tipo lo impedisce, il runtime deve comunque difendersi.
    expect(() => getProgressionScale('schema-inventato')).toThrow(/sconosciuta/i);
  });
});

describe('le 5 leve del sovraccarico', () => {
  it('sono cinque, nell’ordine obbligato del metodo', () => {
    expect(OVERLOAD_LEVERS).toEqual(['reps', 'tempo', 'iso-pause', 'variant', 'load']);
  });

  it('la zavorra è sempre l’ultima leva', () => {
    expect(OVERLOAD_LEVERS.at(-1)).toBe('load');
  });

  it('la scaletta dell’eccentrica va da 3" a 5"', () => {
    expect(ECCENTRIC_TEMPO_LADDER).toEqual([3, 4, 5]);
  });

  it('le pause isometriche vanno da 1" a 2"', () => {
    expect(ISO_PAUSE_LADDER).toEqual([1, 2]);
  });
});
