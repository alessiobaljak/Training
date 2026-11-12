import { describe, expect, it } from 'vitest';
import {
  buildDraftSession,
  closeSession,
  findLoggedExercise,
  firstPendingIndex,
  isStepLogged,
  lastLoggedByBlock,
  markStarted,
  sessionDurationSeconds,
  statesToSave,
  plannedSets,
  removeLoggedSet,
  sessionProgress,
  effectiveBlock,
  setBlockExercise,
  setExerciseNote,
  setTempoRespected,
  setVariant,
  suggestedSetValue,
  syncStatesFromLog,
  upsertLoggedSet,
  variantLabelFor,
} from './draft.ts';
import { buildSessionPlan } from './rest.ts';
import { initialExerciseState } from './progression.ts';
import { getSession } from '../data/program.ts';
import { getExercise } from '../data/exercises.ts';
import { loggedExercise, loggedSession, perSideSets, set, sets } from './__fixtures.ts';
import type {
  ExerciseSlug,
  ExerciseState,
  LevelIndex,
  LoggedExercise,
  LoggedSession,
} from '../types/index.ts';

const upperA = getSession('upper-a');
const lowerA = getSession('lower-a');

/**
 * Gli stati al gradino per cui ogni esercizio è scritto. Le prove della bozza
 * riguardano come si compila, non da che gradino si parte: quello ha le sue
 * prove in `progression.test.ts`.
 */
function statesFor(session = upperA): ReadonlyMap<ExerciseSlug, ExerciseState> {
  return new Map(
    session.blocks.map((block) => {
      const exercise = getExercise(block.exercise);
      return [block.exercise, { ...initialExerciseState(exercise), level: exercise.defaultLevel }];
    }),
  );
}

function draft(week = 1, previous: ReadonlyMap<string, LoggedExercise> = new Map()) {
  return buildDraftSession({
    id: 'draft-1',
    date: '2026-09-14',
    week,
    session: upperA,
    states: statesFor(),
    previous,
  });
}

describe('etichetta della variante', () => {
  it('usa livello e nome del gradino per gli esercizi in scala', () => {
    const exercise = getExercise('trazioni-prona-presa-media');
    expect(variantLabelFor(exercise, { ...initialExerciseState(exercise), level: 3 })).toBe(
      'Liv. 3 · Trazioni complete',
    );
  });

  it('usa il nome dell’esercizio per gli accessori fuori scala', () => {
    const exercise = getExercise('alzate-laterali-elastico');
    expect(variantLabelFor(exercise, initialExerciseState(exercise))).toBe(
      'Alzate laterali con manubri',
    );
  });
});

describe('creazione della bozza', () => {
  it('crea una riga per blocco, senza serie', () => {
    const session = draft();
    expect(session.exercises).toHaveLength(upperA.blocks.length);
    expect(session.exercises.every((entry) => entry.sets.length === 0)).toBe(true);
    expect(session.status).toBe('in-progress');
  });

  it('precompila la variante dal livello corrente', () => {
    expect(findLoggedExercise(draft(), 'A2')?.variantLabel).toBe('Liv. 3 · Trazioni complete');
  });

  it('preferisce la variante usata l’ultima volta su quel blocco', () => {
    const previous = new Map([
      ['A2', loggedExercise('trazioni-prona-presa-media', sets([8]), { blockCode: 'A2', variantLabel: 'Liv. 4 · con pausa' })],
    ]);
    expect(findLoggedExercise(draft(1, previous), 'A2')?.variantLabel).toBe('Liv. 4 · con pausa');
  });

  it('nessuna serie nasce già registrata', () => {
    const previous = new Map([
      ['A2', loggedExercise('trazioni-prona-presa-media', sets([8, 8, 8, 8]), { blockCode: 'A2' })],
    ]);
    // I valori della volta scorsa si propongono, non si registrano: una riga
    // precompilata e mai confermata sarebbe il numero della settimana scorsa.
    expect(findLoggedExercise(draft(1, previous), 'A2')?.sets).toEqual([]);
  });
});

describe('modifica della bozza', () => {
  it('inserisce una serie e la mantiene ordinata', () => {
    let session = draft();
    session = upsertLoggedSet(session, 'A2', set(2, 7));
    session = upsertLoggedSet(session, 'A2', set(1, 8));
    expect(findLoggedExercise(session, 'A2')?.sets.map((entry) => entry.value)).toEqual([8, 7]);
  });

  it('rifare la stessa serie la sostituisce invece di duplicarla', () => {
    let session = draft();
    session = upsertLoggedSet(session, 'A2', set(1, 8));
    session = upsertLoggedSet(session, 'A2', set(1, 6));
    const entry = findLoggedExercise(session, 'A2');
    expect(entry?.sets).toHaveLength(1);
    expect(entry?.sets[0]?.value).toBe(6);
  });

  it('tiene distinti i due lati della stessa serie', () => {
    let session = draft();
    session = upsertLoggedSet(session, 'A2', set(1, 8, { side: 'left' }));
    session = upsertLoggedSet(session, 'A2', set(1, 7, { side: 'right' }));
    expect(findLoggedExercise(session, 'A2')?.sets).toHaveLength(2);
  });

  it('cancella una serie sbagliata', () => {
    let session = draft();
    session = upsertLoggedSet(session, 'A2', set(1, 8));
    session = removeLoggedSet(session, 'A2', 1, null);
    expect(findLoggedExercise(session, 'A2')?.sets).toEqual([]);
  });

  it('non tocca gli altri blocchi', () => {
    const before = draft();
    const after = upsertLoggedSet(before, 'A2', set(1, 8));
    expect(findLoggedExercise(after, 'A1')).toEqual(findLoggedExercise(before, 'A1'));
    expect(findLoggedExercise(before, 'A2')?.sets).toEqual([]);
  });

  /*
   * Cambiare esercizio non è cambiare variante.
   *
   * Sissy squat e wall sit stanno sullo stesso blocco ma si misurano
   * diversamente: tenere le serie già registrate significherebbe archiviare
   * dei secondi sotto la voce delle ripetizioni.
   */
  /*
   * La domanda di fine seduta nasce senza risposta.
   *
   * Nasceva a `true`, quindi arrivava con «Sì» già acceso: premerlo non
   * cambiava niente e il metodo dava per rispettato un tempo che nessuno
   * aveva confermato.
   */
  it('una serie appena aperta non ha ancora risposto sul tempo', () => {
    for (const entry of draft().exercises) {
      expect(entry.tempoRespected, entry.blockCode).toBeNull();
    }
  });

  it('il blocco effettivo segue l’esercizio scelto, non quello della scheda', () => {
    const lowerA = getSession('lower-a');
    const c2 = lowerA.blocks.find((b) => b.code === 'C2');
    if (c2 === undefined) throw new Error('C2 mancante');

    let session = buildDraftSession({
      id: 'draft-eff',
      date: '2026-09-15',
      week: 1,
      session: lowerA,
      states: new Map(),
      previous: new Map(),
    });

    expect(effectiveBlock(c2, session).exercise).toBe('sissy-squat');
    expect(effectiveBlock(c2, session).prescription).toEqual({ kind: 'reps', min: 12, max: 15 });

    session = setBlockExercise(session, 'C2', 'wall-sit', 'Wall sit isometrico');
    expect(effectiveBlock(c2, session).exercise).toBe('wall-sit');
    expect(effectiveBlock(c2, session).prescription).toEqual({ kind: 'seconds', min: 45, max: 45 });
  });

  it('un blocco senza alternativa resta sé stesso', () => {
    const block = getSession('lower-a').blocks.find((b) => b.code === 'A');
    if (block === undefined) throw new Error('A mancante');
    const session = buildDraftSession({
      id: 'draft-eff-2',
      date: '2026-09-15',
      week: 1,
      session: getSession('lower-a'),
      states: new Map(),
      previous: new Map(),
    });
    expect(effectiveBlock(block, session)).toBe(block);
  });

  it('cambiando esercizio del blocco butta via le serie già registrate', () => {
    let session = buildDraftSession({
      id: 'draft-lower',
      date: '2026-09-15',
      week: 1,
      session: getSession('lower-a'),
      states: new Map(),
      previous: new Map(),
    });
    session = upsertLoggedSet(session, 'C2', {
      setIndex: 1, side: null, value: 13, rir: 1, loadKg: 0, heartRate: null, note: null,
    });
    expect(findLoggedExercise(session, 'C2')?.sets).toHaveLength(1);

    session = setBlockExercise(session, 'C2', 'wall-sit', 'Wall sit isometrico');
    const entry = findLoggedExercise(session, 'C2');
    expect(entry?.exercise).toBe('wall-sit');
    expect(entry?.variantLabel).toBe('Wall sit isometrico');
    expect(entry?.sets).toEqual([]);
  });

  it('riscegliere lo stesso esercizio non cancella niente', () => {
    let session = buildDraftSession({
      id: 'draft-lower-2',
      date: '2026-09-15',
      week: 1,
      session: getSession('lower-a'),
      states: new Map(),
      previous: new Map(),
    });
    session = upsertLoggedSet(session, 'C2', {
      setIndex: 1, side: null, value: 13, rir: 1, loadKg: 0, heartRate: null, note: null,
    });
    session = setBlockExercise(session, 'C2', 'sissy-squat', 'Sissy squat');
    expect(findLoggedExercise(session, 'C2')?.sets).toHaveLength(1);
  });

  it('aggiorna variante, tempo rispettato e note', () => {
    let session = draft();
    session = setVariant(session, 'A2', 'Liv. 4 · con pausa', 4);
    session = setTempoRespected(session, 'A2', false);
    session = setExerciseNote(session, 'A2', 'presa che cede');
    const entry = findLoggedExercise(session, 'A2');
    expect(entry?.variantLabel).toBe('Liv. 4 · con pausa');
    expect(entry?.level).toBe(4);
    expect(entry?.tempoRespected).toBe(false);
    expect(entry?.note).toBe('presa che cede');
  });

  it('chiude la seduta', () => {
    expect(closeSession(draft()).status).toBe('completed');
  });
});

describe('avanzamento nel piano', () => {
  const plan = buildSessionPlan(upperA, 1);

  it('il primo passo in sospeso è il primo del piano su una bozza vuota', () => {
    expect(firstPendingIndex(draft(), plan)).toBe(0);
  });

  it('una serie registrata sposta il primo passo in sospeso', () => {
    const first = plan[0];
    expect(first).toBeDefined();
    if (first === undefined) return;
    const session = upsertLoggedSet(draft(), first.blockCode, set(first.setIndex, 8));
    expect(isStepLogged(session, first)).toBe(true);
    expect(firstPendingIndex(session, plan)).toBe(1);
  });

  it('conta i passi fatti sul totale', () => {
    const first = plan[0];
    if (first === undefined) return;
    const session = upsertLoggedSet(draft(), first.blockCode, set(first.setIndex, 8));
    expect(sessionProgress(session, plan)).toEqual({ done: 1, total: 24, complete: false });
  });

  it('la seduta è completa quando ogni passo è registrato', () => {
    let session = draft();
    for (const step of plan) {
      session = upsertLoggedSet(session, step.blockCode, set(step.setIndex, 8));
    }
    expect(sessionProgress(session, plan).complete).toBe(true);
    expect(firstPendingIndex(session, plan)).toBe(-1);
  });
});

describe('esercizi per lato', () => {
  const plan = buildSessionPlan(lowerA, 1);
  const perSideStep = plan.find((step) => step.perSide);

  function lowerDraft() {
    return buildDraftSession({
      id: 'draft-2',
      date: '2026-09-15',
      week: 1,
      session: lowerA,
      states: statesFor(lowerA),
      previous: new Map(),
    });
  }

  it('il piano segnala quali passi sono per lato', () => {
    expect(perSideStep?.blockCode).toBe('A');
  });

  it('un lato solo non basta a chiudere la serie', () => {
    if (perSideStep === undefined) return;
    const session = upsertLoggedSet(
      lowerDraft(),
      perSideStep.blockCode,
      set(perSideStep.setIndex, 9, { side: 'left' }),
    );
    expect(isStepLogged(session, perSideStep)).toBe(false);
  });

  it('con entrambi i lati la serie è chiusa', () => {
    if (perSideStep === undefined) return;
    let session = lowerDraft();
    session = upsertLoggedSet(session, perSideStep.blockCode, set(perSideStep.setIndex, 9, { side: 'left' }));
    session = upsertLoggedSet(session, perSideStep.blockCode, set(perSideStep.setIndex, 9, { side: 'right' }));
    expect(isStepLogged(session, perSideStep)).toBe(true);
  });

  it('una serie bilaterale non chiude un passo per lato', () => {
    if (perSideStep === undefined) return;
    const session = upsertLoggedSet(lowerDraft(), perSideStep.blockCode, set(perSideStep.setIndex, 9));
    expect(isStepLogged(session, perSideStep)).toBe(false);
  });
});

describe('precompilazione dalla volta scorsa', () => {
  const history = [
    loggedSession('2026-09-07', 1, [
      loggedExercise('trazioni-prona-presa-media', sets([7, 7, 6, 6], 0), { blockCode: 'A2' }),
    ]),
    loggedSession('2026-09-14', 2, [
      loggedExercise('trazioni-prona-presa-media', sets([8, 8, 7, 7], 2.5), { blockCode: 'A2' }),
      loggedExercise('chin-up-presa-supina-stretta', [], { blockCode: 'D' }),
    ]),
  ];

  it('prende la registrazione più recente per ogni blocco', () => {
    const previous = lastLoggedByBlock(history, 'upper-a', 'nuova');
    expect(previous.get('A2')?.sets[0]?.value).toBe(8);
    expect(previous.get('A2')?.sets[0]?.loadKg).toBe(2.5);
  });

  it('ignora i blocchi registrati senza nessuna serie', () => {
    expect(lastLoggedByBlock(history, 'upper-a', 'nuova').has('D')).toBe(false);
  });

  it('esclude la seduta in corso', () => {
    const previous = lastLoggedByBlock(history, 'upper-a', '2026-09-14-2');
    expect(previous.get('A2')?.sets[0]?.value).toBe(7);
  });

  it('non guarda le sedute di un altro giorno della settimana', () => {
    expect(lastLoggedByBlock(history, 'lower-a', 'nuova').size).toBe(0);
  });

  it('propone la serie con lo stesso indice', () => {
    const previous = lastLoggedByBlock(history, 'upper-a', 'nuova').get('A2');
    expect(suggestedSetValue(previous, 3, null)?.value).toBe(7);
  });

  it('senza quella serie ripiega sulla prima', () => {
    const previous = lastLoggedByBlock(history, 'upper-a', 'nuova').get('A2');
    expect(suggestedSetValue(previous, 9, null)?.value).toBe(8);
  });

  it('senza storia non propone nulla', () => {
    expect(suggestedSetValue(undefined, 1, null)).toBeUndefined();
  });

  it('tiene distinti i lati anche nella proposta', () => {
    const perSide = loggedExercise('bulgarian-split-squat', perSideSets([[9, 8]]), { blockCode: 'A' });
    expect(suggestedSetValue(perSide, 1, 'left')?.value).toBe(9);
    expect(suggestedSetValue(perSide, 1, 'right')?.value).toBe(8);
  });
});

describe('serie previste per blocco', () => {
  it('sono quelle della scheda in settimana normale', () => {
    expect(plannedSets(upperA, 'A1', 1)).toBe(4);
    expect(plannedSets(upperA, 'C2', 1)).toBe(3);
  });

  it('si dimezzano in scarico', () => {
    expect(plannedSets(upperA, 'A1', 6)).toBe(2);
  });

  it('valgono zero per un blocco che non esiste', () => {
    expect(plannedSets(upperA, 'Z9', 1)).toBe(0);
  });
});

describe('quello che scrivi torna nello stato', () => {
  /*
   * `ExerciseState` era scritto solo accettando un suggerimento, e il carico
   * non lo leggeva nessuno: il player precompilava i kg dall'ultima riga di
   * log. Accettare «aggiungi zavorra» cambiava un numero che nessuno guardava.
   */
  const stato = (slug: string, level: LevelIndex | null, loadKg: number): ExerciseState => ({
    exercise: slug,
    level,
    eccentricBonusSeconds: 0,
    bottomPauseBonusSeconds: 0,
    loadKg,
  });

  it('porta nello stato il carico davvero usato', () => {
    const session = loggedSession('2026-01-05', 1, [
      loggedExercise('chin-up-presa-supina-stretta', sets([8, 8, 7], 5), { blockCode: 'D' }),
    ]);

    const changed = syncStatesFromLog(session, new Map([
      ['chin-up-presa-supina-stretta', stato('chin-up-presa-supina-stretta', 3, 0)],
    ]));

    expect(changed).toHaveLength(1);
    expect(changed[0]?.loadKg).toBe(5);
  });

  it('prende il massimo, non l’ultima serie', () => {
    // Chi cala all'ultima serie perché era finita non ha cambiato manubrio.
    const session = loggedSession('2026-01-05', 1, [
      loggedExercise('alzate-laterali-elastico', [
        set(1, 15, { loadKg: 8 }),
        set(2, 14, { loadKg: 8 }),
        set(3, 12, { loadKg: 6 }),
      ], { blockCode: 'C1' }),
    ]);

    expect(syncStatesFromLog(session, new Map())[0]?.loadKg).toBe(8);
  });

  it('non tocca niente quando la seduta conferma quello che c’era', () => {
    const session = loggedSession('2026-01-05', 1, [
      loggedExercise('chin-up-presa-supina-stretta', sets([8, 8, 7], 5), { blockCode: 'D' }),
    ]);

    expect(syncStatesFromLog(session, new Map([
      ['chin-up-presa-supina-stretta', stato('chin-up-presa-supina-stretta', 3, 5)],
    ]))).toHaveLength(0);
  });

  it('ignora i blocchi senza serie registrate', () => {
    const session = loggedSession('2026-01-05', 1, [
      loggedExercise('chin-up-presa-supina-stretta', [], { blockCode: 'D' }),
    ]);

    expect(syncStatesFromLog(session, new Map())).toHaveLength(0);
  });

  it('dove la zavorra è vietata non azzera quella che c’era', () => {
    /*
     * Sugli esercizi fuori dalla whitelist il campo kg non viene nemmeno
     * disegnato, quindi ogni serie registra zero. Leggere quello zero come
     * «oggi ha usato zero» cancellerebbe un carico deciso altrove.
     */
    const session = loggedSession('2026-01-05', 1, [
      loggedExercise('alzate-laterali-elastico', sets([15, 15, 15], 0), { blockCode: 'C1' }),
    ]);
    const primo = syncStatesFromLog(session, new Map([
      ['alzate-laterali-elastico', stato('alzate-laterali-elastico', null, 8)],
    ]));
    // Le alzate registrano il peso: uno zero scritto lì è una correzione vera.
    expect(primo[0]?.loadKg).toBe(0);

    const vietata = loggedSession('2026-01-05', 1, [
      loggedExercise('hollow-hold', sets([30, 30, 30], 0), { blockCode: 'A' }),
    ]);
    expect(syncStatesFromLog(vietata, new Map([
      ['hollow-hold', stato('hollow-hold', 3, 2.5)],
    ]))).toHaveLength(0);
  });

  it('non si ferma su un esercizio che non esiste più', () => {
    // È successo: «sissy squat o wall sit» spezzato in due a metà settimana,
    // con una bozza aperta che teneva ancora il vecchio slug.
    const session = loggedSession('2026-01-05', 1, [
      loggedExercise('sissy-squat-o-wall-sit', sets([12, 12, 12]), { blockCode: 'C2' }),
      loggedExercise('chin-up-presa-supina-stretta', sets([8, 8, 7], 5), { blockCode: 'D' }),
    ]);

    const changed = syncStatesFromLog(session, new Map());
    expect(changed.map((state) => state.exercise)).toEqual(['chin-up-presa-supina-stretta']);
  });

  it('porta nello stato il livello scelto nel player', () => {
    const session = loggedSession('2026-01-05', 1, [
      loggedExercise('chin-up-presa-supina-stretta', sets([8, 8, 7]), { blockCode: 'D' }),
    ]);

    // Il fixture registra il livello 3; lo stato era fermo al 2.
    expect(syncStatesFromLog(session, new Map([
      ['chin-up-presa-supina-stretta', stato('chin-up-presa-supina-stretta', 2, 0)],
    ]))[0]?.level).toBe(3);
  });
});

describe('lastLoggedByBlock — la precompilazione non cambia esercizio', () => {
  /*
   * La riscrittura delle quattro sedute sull'originale ha cambiato
   * l'esercizio sotto trentatré codici di blocco su trentasei. Indicizzando
   * lo storico per solo codice, la precompilazione portava avanti i dati di
   * un esercizio a un altro: i chili del goblet squat proposti come carico di
   * una estensione dei tricipiti sopra la testa, e un 45 che passava da
   * secondi di wall sit a ripetizioni di un esercizio a ripetizioni.
   */
  const registrata = (blockCode: string, exercise: ExerciseSlug): LoggedSession => ({
    id: `s-${blockCode}`,
    sessionId: 'circuito-1',
    date: '2026-11-01',
    week: 1,
    status: 'completed',
    exercises: [
      {
        blockCode,
        exercise,
        variantLabel: 'x',
        level: 1,
        tempoRespected: null,
        note: null,
        sets: [{ setIndex: 1, side: null, value: 10, rir: null, loadKg: 16, heartRate: null, note: null }],
      },
    ],
    note: null,
  });

  it('scarta la registrazione se sotto quel codice oggi c’è un altro esercizio', () => {
    const storico = [registrata('B2', 'goblet-squat')];
    const oggi = new Map<string, ExerciseSlug>([['B2', 'estensione-tricipiti-sopra-testa']]);
    expect(lastLoggedByBlock(storico, 'circuito-1', 'altro', oggi).get('B2')).toBeUndefined();
  });

  it('la tiene quando l’esercizio è lo stesso', () => {
    const storico = [registrata('B2', 'goblet-squat')];
    const oggi = new Map<string, ExerciseSlug>([['B2', 'goblet-squat']]);
    expect(lastLoggedByBlock(storico, 'circuito-1', 'altro', oggi).get('B2')?.exercise).toBe(
      'goblet-squat',
    );
  });

  it('senza la mappa si comporta come prima', () => {
    const storico = [registrata('B2', 'goblet-squat')];
    expect(lastLoggedByBlock(storico, 'circuito-1', 'altro').get('B2')?.exercise).toBe(
      'goblet-squat',
    );
  });
});

describe('inizio, fine e durata vera della seduta', () => {
  const vuota: LoggedSession = {
    id: 's',
    sessionId: 'circuito-1',
    date: '2026-11-12',
    week: 1,
    status: 'in-progress',
    exercises: [],
    note: null,
  };

  it('l’inizio si segna una volta sola: riprendere la seduta non lo sposta', () => {
    const partita = markStarted(vuota, '2026-11-12T18:00:00.000Z');
    expect(partita.startedAt).toBe('2026-11-12T18:00:00.000Z');
    expect(markStarted(partita, '2026-11-12T18:20:00.000Z').startedAt).toBe(
      '2026-11-12T18:00:00.000Z',
    );
  });

  it('la durata è la differenza fra i due istanti', () => {
    const chiusa = closeSession(
      markStarted(vuota, '2026-11-12T18:00:00.000Z'),
      '2026-11-12T18:38:10.000Z',
    );
    expect(chiusa.status).toBe('completed');
    expect(sessionDurationSeconds(chiusa)).toBe(38 * 60 + 10);
  });

  it('non inventa una durata dove non c’è', () => {
    /* Le sedute scritte prima non hanno istanti: restano sedute. */
    expect(sessionDurationSeconds(closeSession(vuota))).toBeNull();
    /* Lasciata aperta e chiusa il giorno dopo non è durata ventisei ore. */
    expect(
      sessionDurationSeconds(
        closeSession(markStarted(vuota, '2026-11-12T18:00:00.000Z'), '2026-11-13T20:00:00.000Z'),
      ),
    ).toBeNull();
  });
});

describe('statesToSave — la leva accettata vince sul diario (training-quality A13)', () => {
  /*
   * Prima, accettare «sali al gradino 3» a fine seduta e poi premere «Salva e
   * chiudi» lasciava il gradino 1: il salvataggio riscriveva gradino e chili
   * da quello che la seduta aveva registrato, sopra la decisione appena presa.
   * Il registro dei suggerimenti diceva «accettata» e niente cambiava.
   */
  const base: ExerciseState = {
    exercise: 'trazioni-prona-presa-media',
    level: 1,
    eccentricBonusSeconds: 0,
    bottomPauseBonusSeconds: 0,
    loadKg: 0,
  };

  it('il gradino accettato non torna quello delle serie', () => {
    const daDiario = [{ ...base, level: 1 as LevelIndex }];
    const accettate = new Map([[base.exercise, { ...base, level: 3 as LevelIndex }]]);
    expect(statesToSave(daDiario, accettate)).toEqual([{ ...base, level: 3 }]);
  });

  it('la zavorra accettata non torna quella registrata', () => {
    const dip: ExerciseState = { ...base, exercise: 'dip-parallele-anelli', loadKg: 5 };
    const accettate = new Map([[dip.exercise, { ...dip, loadKg: 7.5 }]]);
    expect(statesToSave([dip], accettate)).toEqual([{ ...dip, loadKg: 7.5 }]);
  });

  it('una leva accettata su un esercizio che il diario non tocca si salva lo stesso', () => {
    const accettate = new Map([[base.exercise, { ...base, eccentricBonusSeconds: 1 }]]);
    expect(statesToSave([], accettate)).toEqual([{ ...base, eccentricBonusSeconds: 1 }]);
  });

  it('senza leve accettate restano gli stati del diario', () => {
    expect(statesToSave([base], new Map())).toEqual([base]);
  });
});

describe('l’etichetta del gradino segue il gradino (training-quality A11)', () => {
  it('dopo una salita la bozza non porta l’etichetta del gradino vecchio', () => {
    const exercise = getExercise('trazioni-prona-presa-media');
    const previous = new Map([
      [
        'A2',
        {
          ...loggedExercise('trazioni-prona-presa-media', sets([8]), {
            blockCode: 'A2',
            variantLabel: 'Liv. 1 · Trazioni assistite',
          }),
          level: 1 as LevelIndex,
        },
      ],
    ]);
    const salito = new Map<ExerciseSlug, ExerciseState>([
      [exercise.slug, { ...initialExerciseState(exercise), level: 3 as LevelIndex }],
    ]);
    const bozza = buildDraftSession({
      id: 'd',
      date: '2026-11-20',
      week: 2,
      session: upperA,
      states: salito,
      previous,
    });
    const riga = findLoggedExercise(bozza, 'A2');
    expect(riga?.level).toBe(3);
    expect(riga?.variantLabel).toBe('Liv. 3 · Trazioni complete');
  });
});
