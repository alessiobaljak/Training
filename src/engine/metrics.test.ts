import { describe, expect, it } from 'vitest';
import {
  adherence,
  adherenceFromSessions,
  fromWeightEntries,
  movingAverage,
  plannedSessionsSoFar,
  sessionsInWeek,
  summarizeExercise,
  plannedVolumeByGroup,
  volumeByGroup,
  weeklyAverages,
} from './metrics.ts';
import { CIRCUIT_SESSIONS } from '../data/circuit.ts';
import { loggedExercise, loggedSession, perSideSets, sets } from './__fixtures.ts';

const week = (offset: number) => `2026-09-${String(14 + offset).padStart(2, '0')}`;

describe('media mobile a 7 giorni', () => {
  const daily = fromWeightEntries([
    { date: week(0), kg: 80 },
    { date: week(1), kg: 81 },
    { date: week(2), kg: 79 },
    { date: week(3), kg: 80 },
    { date: week(4), kg: 82 },
    { date: week(5), kg: 78 },
    { date: week(6), kg: 80 },
  ]);

  it('sul settimo giorno la finestra è piena', () => {
    const points = movingAverage(daily);
    const last = points.at(-1);
    expect(last?.date).toBe(week(6));
    expect(last?.average).toBe(80);
    expect(last?.sampleCount).toBe(7);
    expect(last?.complete).toBe(true);
  });

  it('nei primi giorni la media c’è ma non è ancora confrontabile', () => {
    const first = movingAverage(daily)[0];
    expect(first?.average).toBe(80);
    expect(first?.sampleCount).toBe(1);
    expect(first?.complete).toBe(false);
  });

  it('la finestra è di giorni di calendario, non di misurazioni', () => {
    const sparse = fromWeightEntries([
      { date: '2026-09-01', kg: 70 },
      { date: week(0), kg: 80 },
      { date: week(6), kg: 86 },
    ]);
    const last = movingAverage(sparse).at(-1);
    // Il dato del 1° settembre è fuori dai sette giorni e non entra nella media.
    expect(last?.sampleCount).toBe(2);
    expect(last?.average).toBe(83);
  });

  it('tiene il dato del giorno accanto alla media', () => {
    const points = movingAverage(daily);
    expect(points.map((point) => point.value)).toEqual([80, 81, 79, 80, 82, 78, 80]);
  });

  it('accetta finestre diverse da sette giorni', () => {
    const last = movingAverage(daily, 3).at(-1);
    expect(last?.sampleCount).toBe(3);
    expect(last?.average).toBe(80);
  });

  it('rifiuta una finestra minore di un giorno', () => {
    expect(() => movingAverage(daily, 0)).toThrow(/almeno un giorno/i);
  });

  it('non produce nulla senza dati', () => {
    expect(movingAverage([])).toEqual([]);
  });
});

describe('medie settimanali e delta', () => {
  const values = fromWeightEntries([
    { date: '2026-09-14', kg: 80 },
    { date: '2026-09-15', kg: 82 },
    { date: '2026-09-21', kg: 80 },
    { date: '2026-09-22', kg: 80 },
    { date: '2026-10-05', kg: 79 },
  ]);

  it('raggruppa per settimana con inizio al lunedì', () => {
    expect(weeklyAverages(values).map((entry) => entry.weekStart)).toEqual([
      '2026-09-14',
      '2026-09-21',
      '2026-10-05',
    ]);
  });

  it('calcola la media della settimana', () => {
    expect(weeklyAverages(values).map((entry) => entry.average)).toEqual([81, 80, 79]);
  });

  it('la prima settimana non ha delta', () => {
    expect(weeklyAverages(values)[0]?.delta).toBeNull();
    expect(weeklyAverages(values)[0]?.comparedTo).toBeNull();
  });

  it('dichiara con quale settimana è calcolato il delta, anche saltando una pausa', () => {
    const last = weeklyAverages(values).at(-1);
    expect(last?.delta).toBe(-1);
    // Non è la settimana immediatamente precedente: il campo lo dice.
    expect(last?.comparedTo).toBe('2026-09-21');
  });
});

describe('riepilogo di un esercizio', () => {
  it('riproduce la riga di esempio del foglio Log', () => {
    const summary = summarizeExercise(loggedExercise('trazioni-prona-presa-media', sets([8, 8, 7, 6])));
    expect(summary.setCount).toBe(4);
    expect(summary.totalValue).toBe(29);
    expect(summary.sets.map((entry) => entry.label)).toEqual(['8', '8', '7', '6']);
  });

  it('sugli esercizi per lato tiene i due valori distinti', () => {
    const summary = summarizeExercise(
      loggedExercise('bulgarian-split-squat', perSideSets([[8, 7], [8, 6]])),
    );
    expect(summary.setCount).toBe(2);
    expect(summary.totalValue).toBe(29);
    expect(summary.sets.map((entry) => entry.label)).toEqual(['8/7', '8/6']);
    expect(summary.sets[0]?.left).toBe(8);
    expect(summary.sets[0]?.right).toBe(7);
  });

  it('calcola il RIR medio solo sulle serie che ne hanno uno', () => {
    const summary = summarizeExercise(
      loggedExercise('trazioni-prona-presa-media', [
        { setIndex: 1, side: null, value: 8, rir: 1, loadKg: 0, heartRate: null, note: null },
        { setIndex: 2, side: null, value: 8, rir: 2, loadKg: 0, heartRate: null, note: null },
        { setIndex: 3, side: null, value: 7, rir: null, loadKg: 0, heartRate: null, note: null },
      ]),
    );
    expect(summary.meanRir).toBe(1.5);
  });

  it('riporta la zavorra massima usata', () => {
    const summary = summarizeExercise(loggedExercise('trazioni-prona-presa-media', sets([8, 8], 5)));
    expect(summary.maxLoadKg).toBe(5);
  });

  it('regge un esercizio senza serie registrate', () => {
    const summary = summarizeExercise(loggedExercise('trazioni-prona-presa-media', []));
    expect(summary.setCount).toBe(0);
    expect(summary.totalValue).toBe(0);
    expect(summary.meanRir).toBeNull();
  });
});

describe('volume settimanale', () => {
  it('una serie per lato conta una volta sola', () => {
    const session = loggedSession('2026-09-15', 1, [
      loggedExercise('bulgarian-split-squat', perSideSets([[8, 8], [8, 8], [8, 8], [8, 8]])),
    ]);
    const volume = volumeByGroup([session]);
    const quad = volume.find((entry) => entry.group === 'quadricipiti');
    expect(quad?.sets).toBe(4);
  });

  it('pesa a metà i gruppi secondari', () => {
    const session = loggedSession('2026-09-15', 1, [
      loggedExercise('bulgarian-split-squat', perSideSets([[8, 8], [8, 8], [8, 8], [8, 8]])),
    ]);
    const volume = volumeByGroup([session]);
    expect(volume.find((entry) => entry.group === 'femorali-glutei')?.sets).toBe(2);
  });

  it('classifica rispetto al riferimento di 16-20 serie', () => {
    const many = Array.from({ length: 5 }, (_unused, index) =>
      loggedSession(`2026-09-1${String(index + 4)}`, 1, [
        loggedExercise('trazioni-prona-presa-media', sets([8, 8, 8, 8])),
      ]),
    );
    const volume = volumeByGroup(many);
    expect(volume.find((entry) => entry.group === 'dorsali')?.sets).toBe(20);
    expect(volume.find((entry) => entry.group === 'dorsali')?.status).toBe('in');
    expect(volume.find((entry) => entry.group === 'braccia')?.sets).toBe(10);
    expect(volume.find((entry) => entry.group === 'braccia')?.status).toBe('under');
  });

  it('elenca tutti i gruppi, anche quelli a zero', () => {
    const volume = volumeByGroup([]);
    expect(volume).toHaveLength(8);
    expect(volume.every((entry) => entry.sets === 0)).toBe(true);
    expect(volume.every((entry) => entry.status === 'under')).toBe(true);
  });
});

describe('sedute della settimana', () => {
  it('prende i sette giorni a partire dal lunedì', () => {
    const all = [
      loggedSession('2026-09-13', 0, []),
      loggedSession('2026-09-14', 1, []),
      loggedSession('2026-09-20', 1, []),
      loggedSession('2026-09-21', 2, []),
    ];
    expect(sessionsInWeek(all, '2026-09-14').map((session) => session.date)).toEqual([
      '2026-09-14',
      '2026-09-20',
    ]);
  });
});

describe('aderenza', () => {
  it('calcola la percentuale', () => {
    expect(adherence(5, 6).percent).toBe(83);
    expect(adherence(6, 6).percent).toBe(100);
    expect(adherence(0, 6).percent).toBe(0);
  });

  it('non divide per zero', () => {
    expect(adherence(0, 0).percent).toBeNull();
  });

  it('conta solo le sedute chiuse', () => {
    const sessions = [
      loggedSession('2026-09-14', 1, [], 'completed', 'circuito-1'),
      loggedSession('2026-09-15', 1, [], 'abandoned', 'circuito-2'),
      loggedSession('2026-09-16', 1, [], 'in-progress', 'circuito-3'),
    ];
    /* Mercoledì, terzo giorno su sette: una seduta dovuta su quattro. */
    expect(adherenceFromSessions(sessions, 4, '2026-09-14', '2026-09-16')).toEqual({
      completed: 1,
      planned: 1,
      percent: 100,
    });
  });

  it('non conta le sedute di un altro programma', () => {
    /*
     * Lo Shadow è archiviato e il suo storico resta nel diario. Contarlo
     * portava l'aderenza oltre il mille per cento: ventiquattro sedute del
     * 2025 contro le poche dovute da inizio programma.
     */
    const sessions = [
      loggedSession('2026-09-14', 1, [], 'completed', 'circuito-1'),
      loggedSession('2026-09-15', 1, [], 'completed', 'upper-a'),
      loggedSession('2026-09-16', 1, [], 'completed', 'lower-b'),
    ];
    expect(adherenceFromSessions(sessions, 4, '2026-09-14', '2026-09-16').completed).toBe(1);
  });

  it('non conta le sedute chiuse prima dell’inizio del programma', () => {
    const sessions = [
      loggedSession('2025-06-02', 1, [], 'completed', 'circuito-1'),
      loggedSession('2026-09-15', 1, [], 'completed', 'circuito-2'),
    ];
    expect(adherenceFromSessions(sessions, 4, '2026-09-14', '2026-09-16').completed).toBe(1);
  });

  it('senza data di inizio non c’è una percentuale da mostrare', () => {
    expect(adherenceFromSessions([], 6, null, '2026-09-16').percent).toBeNull();
  });
});

describe('sedute previste fino a oggi', () => {
  it('il dovuto cresce in proporzione ai giorni, non con il numero del giorno', () => {
    /*
     * Il programma attivo non assegna giorni: quattro sedute stanno dentro
     * sette come si vuole. Con la vecchia formula — una seduta per ogni
     * giorno trascorso — al giovedì ne erano dovute quattro, e chi ne aveva
     * fatta una leggeva il venticinque per cento pur essendo in pari.
     */
    expect(plannedSessionsSoFar('2026-09-14', '2026-09-14', 4)).toBe(0); // lunedì, 1° giorno
    expect(plannedSessionsSoFar('2026-09-14', '2026-09-16', 4)).toBe(1); // mercoledì, 3°
    expect(plannedSessionsSoFar('2026-09-14', '2026-09-17', 4)).toBe(2); // giovedì, 4°
    expect(plannedSessionsSoFar('2026-09-14', '2026-09-20', 4)).toBe(4); // domenica, 7°
  });

  it('non supera mai le sedute previste nella settimana', () => {
    expect(plannedSessionsSoFar('2026-09-14', '2026-09-20', 4)).toBe(4);
  });

  it('le settimane concluse contano intere', () => {
    expect(plannedSessionsSoFar('2026-09-14', '2026-09-21', 4)).toBe(4);
    expect(plannedSessionsSoFar('2026-09-14', '2026-09-27', 4)).toBe(8);
  });

  it('non conta nulla prima dell’inizio', () => {
    expect(plannedSessionsSoFar('2026-09-14', '2026-09-07', 6)).toBe(0);
  });

  it('chi è in pari non risulta mai sotto il cento per cento', () => {
    /* Quattro sedute chiuse entro la domenica: cento per cento, non 4 su 7. */
    const fatte = (['14', '16', '18', '20'] as const).map((giorno, indice) =>
      loggedSession(
        `2026-09-${giorno}`,
        1,
        [],
        'completed',
        (['circuito-1', 'circuito-2', 'circuito-3', 'circuito-4'] as const)[indice],
      ),
    );
    expect(adherenceFromSessions(fatte, 4, '2026-09-14', '2026-09-20').percent).toBe(100);
  });
});

describe('volume: una regola sola per il fatto e per il previsto', () => {
  /*
   * Prima la schermata Progressi contava la finitura e il test dei dati no:
   * quadricipiti 14 per l'atleta, 6 nel rapporto al progettista.
   */
  it('non conta finitura e decompressione', () => {
    const seduta = loggedSession(
      '2026-11-12',
      1,
      [
        loggedExercise('bulgarian-split-squat', sets([8, 8, 8]), { blockCode: 'A2' }),
        loggedExercise('step-rapidi-box', sets([30, 30]), { blockCode: 'F3' }),
        loggedExercise('apertura-anche', sets([60]), { blockCode: 'Z2' }),
      ],
      'completed',
      'circuito-1',
    );
    const volume = volumeByGroup([seduta]);
    expect(volume.find((entry) => entry.group === 'quadricipiti')?.sets).toBe(3);
  });

  it('non conta una seduta ancora aperta, che sta ancora cambiando', () => {
    const aperta = loggedSession(
      '2026-11-12',
      1,
      [loggedExercise('bulgarian-split-squat', sets([8, 8, 8]), { blockCode: 'A2' })],
      'in-progress',
      'circuito-1',
    );
    expect(volumeByGroup([aperta]).find((entry) => entry.group === 'quadricipiti')?.sets).toBe(0);
  });

  it('una settimana fatta per intero tocca esattamente il previsto', () => {
    const previsto = plannedVolumeByGroup(CIRCUIT_SESSIONS);
    const settimana = CIRCUIT_SESSIONS.map((session) =>
      loggedSession(
        '2026-11-12',
        1,
        session.blocks.map((block) =>
          loggedExercise(
            block.exercise,
            sets(Array.from({ length: block.sets }, () => 10)),
            { blockCode: block.code },
          ),
        ),
        'completed',
        session.id,
      ),
    );
    const fatto = volumeByGroup(settimana);
    for (const entry of previsto) {
      expect(fatto.find((row) => row.group === entry.group)?.sets, entry.group).toBe(entry.sets);
    }
  });
});
