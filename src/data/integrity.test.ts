import { describe, expect, it } from 'vitest';
import { EXERCISES, findExercise, getExercise } from './exercises.ts';
import { PROGRAM_SESSIONS } from './program.ts';
import { WEEK_ZERO_TESTS } from './tests.ts';
import { PROGRESSION_SCALES } from './progressions.ts';
import { MUSCLE_GROUPS, SECONDARY_SET_WEIGHT, WEEKLY_SET_TARGET } from '../types/index.ts';
import type { MuscleGroup } from '../types/index.ts';

describe('integrità dei riferimenti incrociati', () => {
  it('ogni blocco del programma punta a un esercizio esistente', () => {
    for (const session of PROGRAM_SESSIONS) {
      for (const block of session.blocks) {
        expect(findExercise(block.exercise), `${session.id}/${block.code}`).toBeDefined();
      }
    }
  });

  it('ogni prescrizione derivata da un test punta a un test esistente', () => {
    const testIds = new Set(WEEK_ZERO_TESTS.map((t) => t.id));
    for (const session of PROGRAM_SESSIONS) {
      for (const block of session.blocks) {
        if (block.prescription.kind !== 'reps-from-test') continue;
        expect(testIds.has(block.prescription.testId), `${session.id}/${block.code}`).toBe(true);
      }
    }
  });

  it('i blocchi che citano un test nel riferimento usano davvero il range del test', () => {
    for (const session of PROGRAM_SESSIONS) {
      for (const block of session.blocks) {
        if (!block.reference.startsWith('Test ')) continue;
        // Eccezioni della scheda: prescrizione a range fisso pur citando il test
        // come riferimento di livello (nordic curl, skill, dead hang).
        const fixedRangeByDesign = ['lower-a/B', 'lower-b/A', 'shadow/A', 'shadow/E'];
        const key = `${session.id}/${block.code}`;
        if (fixedRangeByDesign.includes(key)) continue;
        expect(block.prescription.kind, key).toBe('reps-from-test');
      }
    }
  });

  it('le prescrizioni in secondi appartengono a esercizi misurati in secondi', () => {
    for (const session of PROGRAM_SESSIONS) {
      for (const block of session.blocks) {
        const measurement = getExercise(block.exercise).measurement;
        const key = `${session.id}/${block.code}`;
        if (block.prescription.kind === 'seconds' || block.prescription.kind === 'max') {
          expect(measurement, key).toBe('seconds');
        }
        if (block.prescription.kind === 'duration') {
          expect(measurement, key).toBe('duration');
        }
        if (block.prescription.kind === 'reps' || block.prescription.kind === 'reps-from-test') {
          expect(measurement, key).toBe('reps');
        }
      }
    }
  });

  it('nessun blocco per lato usa un esercizio a durata', () => {
    for (const session of PROGRAM_SESSIONS) {
      for (const block of session.blocks.filter((b) => b.perSide)) {
        expect(getExercise(block.exercise).measurement, block.code).not.toBe('duration');
      }
    }
  });

  it('ogni gruppo muscolare dichiarato esiste', () => {
    const known = new Set<MuscleGroup>(MUSCLE_GROUPS);
    for (const exercise of EXERCISES) {
      for (const group of [...exercise.primaryMuscles, ...exercise.secondaryMuscles]) {
        expect(known.has(group), `${exercise.slug}/${group}`).toBe(true);
      }
    }
  });

  it('ogni schema motorio della scala è usato da almeno un esercizio', () => {
    const used = new Set(EXERCISES.map((e) => e.pattern).filter((p) => p !== null));
    for (const scale of PROGRESSION_SCALES) {
      expect(used.has(scale.pattern), scale.pattern).toBe(true);
    }
  });

  it('il riferimento di volume del metodo è 16-20 serie a settimana per gruppo', () => {
    expect(WEEKLY_SET_TARGET).toEqual({ min: 16, max: 20 });
  });
});

describe('volume settimanale del seed per gruppo muscolare', () => {
  /**
   * Non è un test del metodo, è una fotografia del programma: serie primarie a
   * peso pieno, serie secondarie a metà. Serve a far fallire il test quando una
   * modifica alla scheda sposta il volume, così la variazione si vede subito.
   *
   * Lettura del risultato: rispetto al riferimento del metodo (16-20 serie a
   * settimana per gruppo) il programma è sopra su braccia e spalle e sotto su
   * quadricipiti, core e polpacci. È una proprietà della scheda, non un errore
   * di trascrizione, ed è il tipo di scostamento che la sezione Progressi deve
   * mostrare invece di nascondere.
   */
  const weeklyVolume = (): Record<MuscleGroup, number> => {
    const totals = new Map<MuscleGroup, number>(MUSCLE_GROUPS.map((g) => [g, 0]));
    for (const session of PROGRAM_SESSIONS) {
      for (const block of session.blocks) {
        const exercise = getExercise(block.exercise);
        for (const group of exercise.primaryMuscles) {
          totals.set(group, (totals.get(group) ?? 0) + block.sets);
        }
        for (const group of exercise.secondaryMuscles) {
          totals.set(group, (totals.get(group) ?? 0) + block.sets * SECONDARY_SET_WEIGHT);
        }
      }
    }
    return Object.fromEntries(totals) as Record<MuscleGroup, number>;
  };

  it('corrisponde ai totali attesi', () => {
    /*
     * Le spalle sono scese da 23,5 a 22 quando il blocco skill dello Shadow ha
     * smesso di essere «hollow hold / L-sit / verticale al muro» ed è diventato
     * l'hollow hold, che è lavoro di core e non di spalle. Il conto guarda
     * l'esercizio dichiarato dal blocco: se si sceglie la verticale le spalle
     * lavorano davvero, ma questo è il volume del programma sulla carta.
     */
    expect(weeklyVolume()).toEqual({
      braccia: 30.5,
      spalle: 22,
      dorsali: 20,
      'femorali-glutei': 20,
      petto: 14,
      quadricipiti: 13,
      core: 10.5,
      polpacci: 8,
    });
  });

  it('nessun gruppo muscolare resta a zero serie', () => {
    for (const [group, total] of Object.entries(weeklyVolume())) {
      expect(total, group).toBeGreaterThan(0);
    }
  });
});
