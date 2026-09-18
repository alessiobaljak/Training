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
      // Non è la dicitura della scheda: vedi il test dedicato più sotto.
      'Rematore monobraccio piedi rialzati',
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

/**
 * Le cinque scale che il foglio non ha.
 *
 * Tenute in una tabella separata apposta: `EXPECTED` qui sopra è la seconda
 * trascrizione del foglio Scale_Progressioni e resta il confronto con la
 * scheda. Queste invece sono state scritte per l'app, perché il foglio
 * prescriveva sei esercizi già nella loro forma avanzata e non offriva nessun
 * gradino più facile. Mescolarle avrebbe fatto sembrare trascritto quello che
 * è stato deciso.
 */
const AGGIUNTE: ReadonlyArray<readonly [MotorPattern, readonly string[]]> = [
  [
    'hip-thrust',
    [
      'Glute bridge a terra, due gambe',
      'Hip thrust spalle su panca, due gambe',
      'Glute bridge monopodalico a terra',
      'Hip thrust monopodalico, spalle su panca',
      'Hip thrust monopodalico con pausa 2"',
      'Hip thrust monopodalico zavorrato',
    ],
  ],
  [
    'hip-hinge',
    [
      'Hip hinge a due gambe con bastone',
      'RDL a due gambe a corpo libero',
      'Single-leg RDL con mano d’appoggio',
      'Single-leg RDL a corpo libero',
      'Single-leg RDL con pausa 2" in basso',
      'Single-leg RDL zavorrato',
    ],
  ],
  [
    'calf',
    [
      'Due gambe, range parziale',
      'Due gambe, range completo',
      'Monopodalico, range parziale',
      'Monopodalico, range completo',
      'Monopodalico con pausa 2" in basso',
      'Monopodalico zavorrato',
    ],
  ],
  [
    'step-up',
    [
      'Box a metà tibia',
      'Box all’altezza del ginocchio',
      'Ginocchio+, discesa 2" senza slancio',
      'Box sopra il ginocchio',
      'Con pausa 2" in alto',
      'Zavorrato',
    ],
  ],
  [
    'sissy-squat',
    [
      'Con due mani d’appoggio',
      'Con una mano d’appoggio',
      'A corpo libero',
      'Con pausa 2" in basso',
      'A braccia incrociate',
      'Con eccentrica 5"',
    ],
  ],
];

describe('progressions.ts — 13 scale da 6 livelli', () => {
  it('copre tutti e soli gli schemi motori dichiarati', () => {
    expect(PROGRESSION_SCALES).toHaveLength(13);
    expect(PROGRESSION_SCALES.map((s) => s.pattern)).toEqual([...MOTOR_PATTERNS]);
  });

  it('le otto del foglio e le cinque aggiunte coprono tutto, senza sovrapporsi', () => {
    const dalFoglio = EXPECTED.map(([pattern]) => pattern);
    const aggiunte = AGGIUNTE.map(([pattern]) => pattern);
    expect(dalFoglio).toHaveLength(8);
    expect(aggiunte).toHaveLength(5);
    expect([...dalFoglio, ...aggiunte].sort()).toEqual([...MOTOR_PATTERNS].sort());
  });

  it.each(EXPECTED)('la scala %s corrisponde alla scheda', (pattern, names) => {
    const scale = getProgressionScale(pattern);
    expect(scale.steps.map((s) => s.name)).toEqual(names);
    expect(scale.steps.map((s) => s.level)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it.each(AGGIUNTE)('la scala aggiunta %s corrisponde a quella dichiarata', (pattern, names) => {
    const scale = getProgressionScale(pattern);
    expect(scale.steps.map((s) => s.name)).toEqual(names);
    expect(scale.steps.map((s) => s.level)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('usa slug di livello unici in tutto il seed', () => {
    const slugs = PROGRESSION_SCALES.flatMap((s) => s.steps.map((step) => step.slug));
    expect(slugs).toHaveLength(78);
    expect(new Set(slugs).size).toBe(78);
  });

  it('getProgressionStep restituisce il gradino richiesto', () => {
    expect(getProgressionStep('dip', 5).name).toBe('Dip agli anelli');
    expect(getProgressionStep('core', 1).name).toBe('Plank 45"');
  });

  it('il livello 6 della trazione orizzontale non richiede zavorra', () => {
    // La scheda scrive "Rematore inverso zavorrato", ma il foglio Zavorra non
    // elenca i rematori tra gli esercizi zavorrabili: il gradino sarebbe
    // irraggiungibile. Sostituito con una progressione a corpo libero.
    const top = getProgressionStep('horizontal-pull', 6);
    expect(top.name).toBe('Rematore monobraccio piedi rialzati');
    expect(top.name.toLowerCase()).not.toContain('zavorr');
  });

  it('ogni gradino che nomina la zavorra appartiene a uno schema zavorrabile', () => {
    const zavorrati = PROGRESSION_SCALES.filter((scale) =>
      scale.steps.some((step) => step.name.toLowerCase().includes('zavorr')),
    ).map((scale) => scale.pattern);
    expect([...zavorrati].sort()).toEqual(
      [
        'dip',
        'horizontal-push',
        'single-leg-squat',
        'vertical-pull',
        /*
         * Le quattro aggiunte dove il carico è la progressione naturale: un
         * manubrio sull'anca nell'hip thrust, in mano nel single-leg RDL e nel
         * calf, sulle spalle nello step-up. Il sissy squat non c'è: un peso su
         * un ginocchio già molto flesso aggiunge taglio senza aggiungere
         * lavoro ai quadricipiti.
         */
        'hip-thrust',
        'hip-hinge',
        'calf',
        'step-up',
      ].sort(),
    );
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
