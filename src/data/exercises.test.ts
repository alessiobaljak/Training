import { describe, expect, it } from 'vitest';
import { EXERCISES, getExercise } from './exercises.ts';
import { PROGRAM_SESSIONS } from './program.ts';
import { ALL_SESSIONS } from './sessions.ts';
import { WEEK_ZERO_TESTS } from './tests.ts';
import { PROGRESSION_SCALES, getProgressionScale } from './progressions.ts';

const URL_PATTERN = /https?:\/\/|www\.|youtu\.?be|youtube\.com|\.gif\b|\.mp4\b/i;

describe('exercises.ts — anagrafica', () => {
  it('ha slug unici', () => {
    const slugs = EXERCISES.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('usa slug in kebab-case', () => {
    for (const exercise of EXERCISES) {
      expect(exercise.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it('dà a ogni esercizio da 3 a 5 cue di esecuzione', () => {
    for (const exercise of EXERCISES) {
      expect(exercise.cues.length, exercise.slug).toBeGreaterThanOrEqual(3);
      expect(exercise.cues.length, exercise.slug).toBeLessThanOrEqual(5);
      for (const cue of exercise.cues) {
        expect(cue.trim().length, exercise.slug).toBeGreaterThan(20);
      }
    }
  });

  it('non contiene nessun URL: né nei cue, né nella query video, né nel nome', () => {
    for (const exercise of EXERCISES) {
      const haystack = [exercise.name, exercise.videoQuery, ...exercise.cues].join(' | ');
      expect(haystack, exercise.slug).not.toMatch(URL_PATTERN);
    }
  });

  it('ha una query di ricerca video in inglese, non vuota', () => {
    for (const exercise of EXERCISES) {
      expect(exercise.videoQuery.trim().length, exercise.slug).toBeGreaterThan(10);
      expect(exercise.videoQuery, exercise.slug).toMatch(/^[a-z0-9 ]+$/);
    }
  });

  it('associa schema motorio e livello di default insieme, o nessuno dei due', () => {
    for (const exercise of EXERCISES) {
      const hasPattern = exercise.pattern !== null;
      const hasLevel = exercise.defaultLevel !== null;
      expect(hasPattern, exercise.slug).toBe(hasLevel);
    }
  });

  it('colloca ogni livello di default dentro la scala del proprio schema motorio', () => {
    for (const exercise of EXERCISES) {
      if (exercise.pattern === null || exercise.defaultLevel === null) continue;
      const scale = getProgressionScale(exercise.pattern);
      const step = scale.steps[exercise.defaultLevel - 1];
      expect(step, exercise.slug).toBeDefined();
      expect(step?.level).toBe(exercise.defaultLevel);
    }
  });

  it('non lascia esercizi orfani: ognuno è usato dal programma o da un test', () => {
    const used = new Set<string>([
      ...ALL_SESSIONS.flatMap((s) => s.blocks.map((b) => b.exercise)),
      /* Anche la seconda scelta di un blocco è un esercizio usato. */
      ...ALL_SESSIONS.flatMap((s) =>
        s.blocks.flatMap((b) => (b.alternatives ?? []).map((entry) => entry.exercise)),
      ),
      /* Anche i passi del riscaldamento: ognuno cita un esercizio vero. */
      ...ALL_SESSIONS.flatMap((s) =>
        (s.warmupSteps ?? []).flatMap((step) => (step.exercise === undefined ? [] : [step.exercise])),
      ),
      ...WEEK_ZERO_TESTS.map((t) => t.exercise),
    ]);
    const orphans = EXERCISES.filter((e) => !used.has(e.slug)).map((e) => e.slug);
    expect(orphans).toEqual([]);
    expect(EXERCISES).toHaveLength(used.size);
  });
});

describe('politica zavorra', () => {
  it('vieta sempre la zavorra su nordic curl, HSPU e core in sospensione', () => {
    for (const slug of [
      'nordic-curl',
      'negative-hspu-muro-o-pike-pushup',
      'hanging-leg-raise',
      'hollow-hold',
      'ab-wheel-o-rollout-trx',
      'l-sit',
      'verticale-al-muro',
    ]) {
      expect(getExercise(slug).loadPolicy, slug).toBe('forbidden');
    }
  });

  it('consente la zavorra solo sulla whitelist dichiarata', () => {
    const allowed = EXERCISES.filter((e) => e.loadPolicy === 'allowed').map((e) => e.slug);
    expect([...allowed].sort()).toEqual(
      [
        /*
         * La whitelist del metodo, dal foglio Zavorra. `dip-panche` è il dip
         * su panca uscito dalla riga a due nomi: stesso esercizio della
         * whitelist, che prima stava dentro `dip-panche-o-diamond-pushup`.
         */
        'bulgarian-split-squat',
        'chin-up-presa-supina',
        'chin-up-presa-supina-stretta',
        'dip-panche',
        'dip-panche-o-diamond-pushup',
        'dip-panche-piedi-rialzati',
        'dip-parallele-anelli',
        'push-up',
        'pushup-archer-o-pseudo-planche',
        'step-up-box-alto',
        'trazioni-presa-larga',
        'trazioni-prona-presa-media',
        /*
         * Aggiunti insieme alle cinque scale nuove: su questi tre il carico è
         * la progressione naturale una volta arrivati al monopodalico con
         * pausa, e senza di esso il gradino 6 sarebbe stato irraggiungibile.
         * Un manubrio sull'anca nell'hip thrust, in mano nel single-leg RDL e
         * nei calf. Il sissy squat resta fuori: un peso su un ginocchio già
         * molto flesso aggiunge taglio, non lavoro.
         */
        'calf-monopodalico-rialzo',
        'calf-monopodalico-seduto',
        'hip-thrust-monopodalico',
        'single-leg-rdl',
      ].sort(),
    );
  });
});

describe('misurazione', () => {
  it('misura in secondi le isometrie', () => {
    for (const slug of ['hollow-hold', 'dead-hang', 'l-sit', 'verticale-al-muro', 'wall-sit']) {
      expect(getExercise(slug).measurement, slug).toBe('seconds');
    }
  });

  it('misura in minuti le attività di durata', () => {
    for (const slug of [
      'camminata-mobilita-dinamica',
      'corsa-continua-piano',
      'mobilita-anche-torace-spalle',
      'zona-2-conclusiva',
    ]) {
      expect(getExercise(slug).measurement, slug).toBe('duration');
    }
  });

  it('gli esercizi a durata non contano nel volume settimanale', () => {
    for (const exercise of EXERCISES.filter((e) => e.measurement === 'duration')) {
      expect(exercise.primaryMuscles, exercise.slug).toEqual([]);
      expect(exercise.secondaryMuscles, exercise.slug).toEqual([]);
    }
  });

  it('ogni esercizio a serie e ripetizioni tocca almeno un gruppo muscolare', () => {
    for (const exercise of EXERCISES.filter((e) => e.measurement !== 'duration')) {
      const touched = exercise.primaryMuscles.length + exercise.secondaryMuscles.length;
      expect(touched, exercise.slug).toBeGreaterThan(0);
    }
  });

  it('non elenca mai lo stesso gruppo come primario e secondario', () => {
    for (const exercise of EXERCISES) {
      const primary = new Set(exercise.primaryMuscles);
      const overlap = exercise.secondaryMuscles.filter((g) => primary.has(g));
      expect(overlap, exercise.slug).toEqual([]);
    }
  });
});

describe('getExercise', () => {
  it('solleva su uno slug sconosciuto', () => {
    expect(() => getExercise('esercizio-inventato')).toThrow(/sconosciuto/i);
  });
});

describe('un titolo, un esercizio', () => {
  /**
   * La regola. Il nome di un esercizio ne deve nominare uno solo.
   *
   * La scheda scrive righe come «Dip tra due panche **o** diamond push-up» e
   * «Skill: hollow hold / L-sit / verticale al muro». Sono due o tre esercizi
   * in un titolo, e un titolo così non dice quale stai facendo: i cue valgono
   * per metà, il disegno ne mostra uno solo, e lo storico li somma come se
   * fossero la stessa cosa.
   *
   * Il primo giro di correzioni ne aveva sistemati tre, quelli che l'utente
   * aveva visto. Ne restavano sei. Questo controllo li trova tutti, oggi e
   * quando la scheda cambierà.
   *
   * Le varianti hanno due posti, e nessuno dei due è il nome: i gradini della
   * scala per «più facile / più difficile», `ProgramBlock.alternatives` per
   * «un altro esercizio, ammesso dalla stessa riga».
   */
  const DUE_NOMI = / o | oppure | \/ /i;

  it('nessun nome di esercizio ne contiene due', () => {
    const colpevoli = EXERCISES.filter((exercise) => DUE_NOMI.test(exercise.name)).map(
      (exercise) => exercise.name,
    );
    expect(colpevoli).toEqual([]);
  });

  it('nessun gradino di scala ne contiene due', () => {
    const colpevoli = PROGRESSION_SCALES.flatMap((scale) =>
      scale.steps.filter((step) => DUE_NOMI.test(step.name)).map((step) => step.name),
    );
    expect(colpevoli).toEqual([]);
  });

  it('la regola morde: un nome a due teste verrebbe scoperto', () => {
    // Senza questo, un giorno in cui `DUE_NOMI` smettesse di riconoscere
    // qualcosa i due controlli qui sopra resterebbero verdi per sempre.
    expect(DUE_NOMI.test('Dip tra due panche o diamond push-up')).toBe(true);
    expect(DUE_NOMI.test('Skill: hollow hold / L-sit')).toBe(true);
    expect(DUE_NOMI.test('Push-up archer')).toBe(false);
  });

  it('gli esercizi divisi restano scegliibili dal blocco che li ammetteva', () => {
    /*
     * Dividere un titolo non deve far sparire la seconda metà: se «o diamond
     * push-up» esce dal nome e non entra tra le alternative del blocco,
     * l'esercizio è stato cancellato, non diviso.
     */
    const ammessi = new Set(
      PROGRAM_SESSIONS.flatMap((session) =>
        session.blocks.flatMap((block) => [
          block.exercise,
          ...(block.alternatives ?? []).map((entry) => entry.exercise),
        ]),
      ),
    );
    for (const slug of ['dip-panche', 'rollout-trx', 'wall-sit', 'l-sit', 'verticale-al-muro']) {
      expect(ammessi.has(slug), slug).toBe(true);
    }
  });
});
