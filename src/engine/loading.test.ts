import { describe, expect, it } from 'vitest';
import {
  assessLoadNeed,
  calibrateLoad,
  getLoadAvailability,
  isValidLoad,
  stepLoad,
  suggestStartingLoad,
} from './loading.ts';
import { getExercise } from '../data/exercises.ts';
import { LOAD_START_TABLE } from '../data/method.ts';
import { sets } from './__fixtures.ts';

const trazioni = getExercise('trazioni-prona-presa-media');
const dip = getExercise('dip-parallele-anelli');
const nordic = getExercise('nordic-curl');
const hspu = getExercise('negative-hspu-muro-o-pike-pushup');
const hangingLegRaise = getExercise('hanging-leg-raise');
const rematore = getExercise('rematore-inverso-trx-piedi-rialzati');
const bulgarian = getExercise('bulgarian-split-squat');
const alzateLaterali = getExercise('alzate-laterali-elastico');

describe('disponibilità della zavorra', () => {
  it('è bloccata nelle prime due settimane, con spiegazione', () => {
    for (const week of [1, 2]) {
      const availability = getLoadAvailability(trazioni, week);
      expect(availability.allowed, String(week)).toBe(false);
      expect(availability.reason).toBe('locked-week');
      expect(availability.explanation).toContain('settimana 3');
    }
  });

  it('si sblocca dalla settimana 3', () => {
    const availability = getLoadAvailability(trazioni, 3);
    expect(availability.allowed).toBe(true);
    expect(availability.explanation).toBeNull();
  });

  it('resta vietata per sempre su nordic curl, HSPU e core in sospensione', () => {
    for (const exercise of [nordic, hspu, hangingLegRaise]) {
      for (const week of [1, 3, 12, 52]) {
        const availability = getLoadAvailability(exercise, week);
        expect(availability.allowed, `${exercise.slug}/${String(week)}`).toBe(false);
        expect(availability.reason).toBe('forbidden-exercise');
      }
    }
  });

  it('l’esercizio vietato vince sulla settimana: il motivo resta l’esercizio', () => {
    expect(getLoadAvailability(nordic, 1).reason).toBe('forbidden-exercise');
  });

  it('è vietata anche sui rematori, che la whitelist non elenca', () => {
    expect(getLoadAvailability(rematore, 10).allowed).toBe(false);
  });

  /*
   * Bloccata come leva, non come campo.
   *
   * Chi fa il Bulgarian split squat con i manubri in settimana 1 deve poter
   * scrivere quanto sta usando: prima il campo spariva del tutto e il diario
   * registrava a corpo libero un esercizio fatto con dieci chili in mano.
   */
  it('nelle prime due settimane il peso si scrive lo stesso', () => {
    for (const week of [1, 2]) {
      const availability = getLoadAvailability(bulgarian, week);
      expect(availability.allowed, `leva/${String(week)}`).toBe(false);
      expect(availability.recordable, `campo/${String(week)}`).toBe(true);
      expect(availability.explanation).toContain('non si aumenta');
    }
  });

  it('dove la zavorra non si usa mai non si scrive nemmeno', () => {
    for (const exercise of [nordic, hspu, hangingLegRaise]) {
      expect(getLoadAvailability(exercise, 5).recordable, exercise.slug).toBe(false);
    }
  });

  it('dove il peso è l’esercizio si scrive sempre, da subito', () => {
    for (const week of [1, 2, 3, 20]) {
      const availability = getLoadAvailability(alzateLaterali, week);
      expect(availability.recordable, String(week)).toBe(true);
      expect(availability.allowed, String(week)).toBe(true);
    }
  });

  it('sbloccata la leva, il campo resta scrivibile', () => {
    const availability = getLoadAvailability(bulgarian, 3);
    expect(availability.allowed).toBe(true);
    expect(availability.recordable).toBe(true);
  });
});

describe('incrementi', () => {
  it('sale e scende di 2,5 kg alla volta', () => {
    expect(stepLoad(0, 1)).toBe(2.5);
    expect(stepLoad(2.5, 1)).toBe(5);
    expect(stepLoad(7.5, -1)).toBe(5);
  });

  it('non scende sotto zero', () => {
    expect(stepLoad(0, -1)).toBe(0);
    expect(stepLoad(2.5, -1)).toBe(0);
  });

  it('accetta solo multipli di 2,5 kg', () => {
    expect(isValidLoad(0)).toBe(true);
    expect(isValidLoad(2.5)).toBe(true);
    expect(isValidLoad(12.5)).toBe(true);
    expect(isValidLoad(1)).toBe(false);
    expect(isValidLoad(3)).toBe(false);
    expect(isValidLoad(-2.5)).toBe(false);
    expect(isValidLoad(Number.NaN)).toBe(false);
  });

  it('resta su multipli esatti anche dopo molti passi', () => {
    let load = 0;
    for (let step = 0; step < 20; step += 1) load = stepLoad(load, 1);
    expect(load).toBe(50);
    expect(isValidLoad(load)).toBe(true);
  });
});

describe('carico di partenza suggerito', () => {
  it('passa per tutte le righe del calcolatore della scheda', () => {
    for (const row of LOAD_START_TABLE) {
      expect(suggestStartingLoad(row.maxReps), row.label).toBe(row.suggestedKg);
    }
  });

  it('non propone zavorra sotto le dieci ripetizioni', () => {
    expect(suggestStartingLoad(10)).toBe(0);
    expect(suggestStartingLoad(6)).toBe(0);
    expect(suggestStartingLoad(0)).toBe(0);
  });

  it('propone sempre un multiplo di 2,5 kg', () => {
    for (let max = 0; max <= 40; max += 1) {
      expect(isValidLoad(suggestStartingLoad(max)), String(max)).toBe(true);
    }
  });
});

describe('soglie', () => {
  it('sopra 15 trazioni la zavorra è necessaria', () => {
    expect(assessLoadNeed(trazioni, 16).need).toBe('mandatory');
    expect(assessLoadNeed(trazioni, 15).need).toBe('optional');
  });

  it('sotto 8 trazioni è sconsigliata e rimanda alla scala', () => {
    const assessment = assessLoadNeed(trazioni, 7);
    expect(assessment.need).toBe('discouraged');
    expect(assessment.message).toContain('sali prima di livello');
    expect(assessLoadNeed(trazioni, 8).need).toBe('optional');
  });

  it('usa soglie diverse per i dip', () => {
    expect(assessLoadNeed(dip, 19).need).toBe('mandatory');
    expect(assessLoadNeed(dip, 18).need).toBe('optional');
    expect(assessLoadNeed(dip, 9).need).toBe('discouraged');
    expect(assessLoadNeed(dip, 10).need).toBe('optional');
  });

  it('non si pronuncia dove la scheda non fissa soglie', () => {
    expect(assessLoadNeed(getExercise('bulgarian-split-squat'), 30).need).toBe('unknown');
    expect(assessLoadNeed(nordic, 30).need).toBe('unknown');
  });
});

describe('calibrazione del carico', () => {
  it('propone di aggiungere peso a partire da dieci ripetizioni di media', () => {
    const result = calibrateLoad(sets([10, 10, 10]), 5);
    expect(result?.adjustment).toBe('increase');
    expect(result?.suggestedKg).toBe(7.5);
    expect(result?.message).toContain('troppo leggero');
  });

  it('propone di togliere peso a quattro ripetizioni o meno', () => {
    const result = calibrateLoad(sets([4, 4, 3]), 10);
    expect(result?.adjustment).toBe('decrease');
    expect(result?.suggestedKg).toBe(7.5);
  });

  it('lascia il carico dov’è dentro la finestra 6-8', () => {
    const result = calibrateLoad(sets([8, 7, 6]), 5);
    expect(result?.adjustment).toBe('hold');
    expect(result?.suggestedKg).toBe(5);
    expect(result?.message).toBeNull();
  });

  it('usa la media di tutte le serie, non l’ultima', () => {
    // L'ultima serie è la più affaticata: da sola manderebbe a "decrease".
    const result = calibrateLoad(sets([12, 10, 8]), 5);
    expect(result?.meanReps).toBe(10);
    expect(result?.adjustment).toBe('increase');
  });

  it('riporta la media dei RIR quando c’è', () => {
    const result = calibrateLoad(
      [
        { setIndex: 1, side: null, value: 7, rir: 1, loadKg: 5, heartRate: null, note: null },
        { setIndex: 2, side: null, value: 7, rir: 2, loadKg: 5, heartRate: null, note: null },
      ],
      5,
    );
    expect(result?.meanRir).toBe(1.5);
  });

  it('non inventa un RIR medio quando non è stato registrato', () => {
    expect(calibrateLoad(sets([7, 7]), 5)?.meanRir).toBeNull();
  });

  it('non si pronuncia senza serie registrate', () => {
    expect(calibrateLoad([], 5)).toBeNull();
  });

  it('non scende sotto zero togliendo peso da un carico nullo', () => {
    expect(calibrateLoad(sets([3, 3]), 0)?.suggestedKg).toBe(0);
  });
});
