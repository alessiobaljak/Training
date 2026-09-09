import { describe, expect, it } from 'vitest';
import { csvFileName, sessionsToCsv } from './csv.ts';
import { LOG_CSV_COLUMNS } from '../data/reference.ts';
import { loggedExercise, perSideSets, set, sets } from '../engine/__fixtures.ts';
import type { LoggedSession } from '../types/index.ts';

const BOM = '\u{FEFF}';

function session(
  exercises: LoggedSession['exercises'],
  overrides: Partial<LoggedSession> = {},
): LoggedSession {
  return {
    id: 'sess-1',
    date: '2026-09-14',
    week: 1,
    sessionId: 'upper-a',
    status: 'completed',
    exercises,
    note: null,
    ...overrides,
  };
}

function rows(csv: string): string[] {
  return csv.replace(BOM, '').trimEnd().split('\r\n');
}

describe('intestazione', () => {
  it('usa le tredici colonne del foglio Log_Allenamenti', () => {
    const csv = sessionsToCsv([]);
    expect(rows(csv)[0]).toBe(LOG_CSV_COLUMNS.join(';'));
    expect(LOG_CSV_COLUMNS).toHaveLength(13);
  });

  it('mette il BOM, così Excel apre gli accenti giusti', () => {
    expect(sessionsToCsv([]).startsWith(BOM)).toBe(true);
    expect(sessionsToCsv([], { withBom: false }).startsWith(BOM)).toBe(false);
  });

  it('usa fine riga CRLF', () => {
    expect(sessionsToCsv([]).endsWith('\r\n')).toBe(true);
  });

  it('propone un nome file con la data', () => {
    expect(csvFileName('2026-09-14')).toBe('shadow-log-2026-09-14.csv');
  });
});

describe('righe', () => {
  it('riproduce la riga di esempio della scheda', () => {
    const csv = sessionsToCsv([
      session([
        {
          ...loggedExercise('trazioni-prona-presa-media', sets([8, 8, 7, 6])),
          variantLabel: 'Liv. 3 - complete, 3-0-1-1',
          note: 'Ultima serie con presa che cede',
          sets: [
            set(1, 8, { rir: 1 }),
            set(2, 8, { rir: 1 }),
            set(3, 7, { rir: 1 }),
            set(4, 6, { rir: 1 }),
          ],
        },
      ]),
    ]);
    expect(rows(csv)[1]).toBe(
      '2026-09-14;1;Upper A;Trazioni prona presa media;Liv. 3 - complete, 3-0-1-1;0;8;8;7;6;1;29;Ultima serie con presa che cede',
    );
  });

  it('una riga per esercizio registrato', () => {
    const csv = sessionsToCsv([
      session([
        loggedExercise('trazioni-prona-presa-media', sets([8, 8])),
        loggedExercise('dip-parallele-anelli', sets([9, 9])),
      ]),
    ]);
    expect(rows(csv)).toHaveLength(3);
  });

  it('ordina per data', () => {
    const csv = sessionsToCsv([
      session([loggedExercise('dip-parallele-anelli', sets([9]))], { id: 'b', date: '2026-09-21' }),
      session([loggedExercise('trazioni-prona-presa-media', sets([8]))], { id: 'a', date: '2026-09-14' }),
    ]);
    expect(rows(csv)[1]).toContain('2026-09-14');
    expect(rows(csv)[2]).toContain('2026-09-21');
  });

  it('lascia vuote le colonne serie non usate', () => {
    const csv = sessionsToCsv([session([loggedExercise('trazioni-prona-presa-media', sets([8, 8]))])]);
    expect(rows(csv)[1]).toContain(';8;8;;;');
  });

  it('sugli esercizi per lato scrive i due valori', () => {
    const csv = sessionsToCsv([
      session([loggedExercise('bulgarian-split-squat', perSideSets([[8, 7], [8, 6]]))]),
    ]);
    expect(rows(csv)[1]).toContain(';8/7;8/6;;');
  });

  it('oltre la quarta serie unisce nell’ultima colonna, senza aggiungerne', () => {
    const csv = sessionsToCsv([
      session([loggedExercise('alzate-laterali-elastico', sets([15, 4, 4, 4, 4]))]),
    ]);
    const cells = rows(csv)[1]?.split(';') ?? [];
    expect(cells).toHaveLength(13);
    expect(cells.slice(6, 10)).toEqual(['15', '4', '4', '4+4']);
    expect(cells[11]).toBe('31');
  });
});

describe('numeri e separatori', () => {
  it('con il punto e virgola i decimali usano la virgola', () => {
    const csv = sessionsToCsv([
      session([loggedExercise('dip-parallele-anelli', sets([8, 8], 7.5))]),
    ]);
    expect(rows(csv)[1]).toContain(';7,5;');
  });

  it('con la virgola come separatore i decimali usano il punto', () => {
    const csv = sessionsToCsv(
      [session([loggedExercise('dip-parallele-anelli', sets([8, 8], 7.5))])],
      { separator: ',' },
    );
    expect(rows(csv)[0]).toBe(LOG_CSV_COLUMNS.join(','));
    expect(rows(csv)[1]).toContain(',7.5,');
  });
});

describe('protezione del formato', () => {
  it('mette tra virgolette una nota che contiene il separatore', () => {
    const csv = sessionsToCsv([
      session([
        { ...loggedExercise('dip-parallele-anelli', sets([8])), note: 'spalla dolorante; fermato' },
      ]),
    ]);
    expect(rows(csv)[1]).toContain('"spalla dolorante; fermato"');
  });

  it('raddoppia le virgolette dentro una nota', () => {
    const csv = sessionsToCsv([
      session([
        { ...loggedExercise('dip-parallele-anelli', sets([8])), note: 'presa "falsa"' },
      ]),
    ]);
    expect(rows(csv)[1]).toContain('"presa ""falsa"""');
  });

  it('una nota su più righe non rompe il file', () => {
    const csv = sessionsToCsv([
      session([
        { ...loggedExercise('dip-parallele-anelli', sets([8])), note: 'prima riga\nseconda riga' },
      ]),
    ]);
    expect(csv).toContain('"prima riga\nseconda riga"');
  });

  it('una nota con il separatore non aggiunge colonne', () => {
    const csv = sessionsToCsv([
      session([
        { ...loggedExercise('dip-parallele-anelli', sets([8])), note: 'a;b;c' },
      ]),
    ]);
    const line = rows(csv)[1] ?? '';
    const outsideQuotes = line.split('"')[0] ?? '';
    expect(outsideQuotes.split(';')).toHaveLength(13);
  });
});
