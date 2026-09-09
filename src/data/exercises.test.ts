import { describe, expect, it } from 'vitest';
import { EXERCISES, getExercise } from './exercises.ts';
import { PROGRAM_SESSIONS } from './program.ts';
import { WEEK_ZERO_TESTS } from './tests.ts';
import { getProgressionScale } from './progressions.ts';

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
      ...PROGRAM_SESSIONS.flatMap((s) => s.blocks.map((b) => b.exercise)),
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
      'skill-isometrica',
    ]) {
      expect(getExercise(slug).loadPolicy, slug).toBe('forbidden');
    }
  });

  it('consente la zavorra solo sulla whitelist del metodo', () => {
    const allowed = EXERCISES.filter((e) => e.loadPolicy === 'allowed').map((e) => e.slug);
    expect([...allowed].sort()).toEqual(
      [
        'bulgarian-split-squat',
        'chin-up-presa-supina',
        'chin-up-presa-supina-stretta',
        'dip-panche-o-diamond-pushup',
        'dip-panche-piedi-rialzati',
        'dip-parallele-anelli',
        'push-up',
        'pushup-archer-o-pseudo-planche',
        'step-up-box-alto',
        'trazioni-presa-larga',
        'trazioni-prona-presa-media',
      ].sort(),
    );
  });
});

describe('misurazione', () => {
  it('misura in secondi le isometrie', () => {
    for (const slug of ['hollow-hold', 'dead-hang', 'skill-isometrica']) {
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
