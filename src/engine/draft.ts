import { getProgressionStep } from '../data/progressions.ts';
import type {
  Exercise,
  ExerciseSlug,
  ExerciseState,
  LevelIndex,
  LoggedExercise,
  LoggedSession,
  LoggedSet,
  ProgramBlock,
  ProgramSession,
  Side,
} from '../types/index.ts';
import { findExercise, getExercise } from '../data/exercises.ts';
import { effectiveSets } from './schedule.ts';
import { livelloVoci, zavorraDopoIlCambio } from './progression.ts';
import type { SessionStep } from './rest.ts';

/**
 * Bozza di seduta: la struttura che il player riempie serie dopo serie.
 *
 * Tutte le funzioni qui sono pure e restituiscono un oggetto nuovo. La bozza
 * viene riscritta nel database a ogni modifica, ed è quello che permette di
 * chiudere l'app a metà seduta e riprenderla dove era rimasta.
 */

/** Etichetta di partenza del campo Variante/Livello, come nel foglio Log. */
export function variantLabelFor(exercise: Exercise, state: ExerciseState): string {
  if (exercise.pattern === null || state.level === null) return exercise.name;
  const step = getProgressionStep(exercise.pattern, state.level);
  return `Liv. ${String(state.level)} · ${step.name}`;
}

/**
 * Come si chiama quello che l'atleta sta facendo: l'esercizio, o il gradino.
 *
 * Quando il gradino è quello per cui l'esercizio è scritto, il nome
 * dell'esercizio è il più preciso dei due. Quando non lo è, il nome
 * dell'esercizio descrive un movimento che non si sta facendo, e vince il
 * gradino. È una regola sola e la usano scheda, recupero e serie: scritta in
 * tre posti, la scheda diceva «Trazioni prona» e il player «Trazioni
 * assistite» per la stessa stazione.
 */
export function titleAtLevel(exercise: Exercise, level: LevelIndex | null): string {
  if (exercise.pattern === null || level === null || level === exercise.defaultLevel) {
    return exercise.name;
  }
  return getProgressionStep(exercise.pattern, level).name;
}

/** La nota della variante, se vale per il gradino a cui sei. */
export function variantNoteAt(block: ProgramBlock, level: LevelIndex | null): string | undefined {
  if (block.variantNote === undefined) return undefined;
  if (block.variantNoteLevel === undefined) return block.variantNote;
  return level === block.variantNoteLevel ? block.variantNote : undefined;
}

export interface DraftParams {
  readonly id: string;
  readonly date: string;
  readonly week: number;
  readonly session: ProgramSession;
  readonly states: ReadonlyMap<ExerciseSlug, ExerciseState>;
  /** Ultima registrazione per blocco, da cui precompilare zavorra e variante. */
  readonly previous: ReadonlyMap<string, LoggedExercise>;
}

/**
 * Crea la bozza con una riga per blocco e nessuna serie.
 *
 * Le serie nascono solo quando l'utente conferma "serie fatta": una riga
 * precompilata e mai confermata registrerebbe i numeri della settimana scorsa
 * come se fossero di oggi.
 */
export function buildDraftSession(params: DraftParams): LoggedSession {
  const { id, date, week, session, states, previous } = params;

  const exercises = session.blocks.map<LoggedExercise>((block) => {
    const exercise = getExercise(block.exercise);
    const state = states.get(block.exercise);
    const past = previous.get(block.code);
    const level = state?.level ?? exercise.defaultLevel;
    /*
     * L'etichetta della volta scorsa vale solo se il gradino è ancora quello
     * (training-quality A11).
     *
     * Prima si copiava sempre: dopo una salita accettata la bozza nasceva con
     * il gradino nuovo e l'etichetta vecchia, e il diario scriveva «Liv. 1 ·
     * Trazioni assistite» per settimane su serie fatte al gradino 3. Quando il
     * gradino non è cambiato l'etichetta scritta a mano resta, perché può dire
     * più del nome del gradino («con pausa», «presa larga»).
     */
    const labelFromState = state === undefined ? exercise.name : variantLabelFor(exercise, state);
    return {
      blockCode: block.code,
      exercise: block.exercise,
      variantLabel: past !== undefined && past.level === level ? past.variantLabel : labelFromState,
      level,
      tempoRespected: null,
      sets: [],
      note: null,
    };
  });

  return { id, date, week, sessionId: session.id, status: 'in-progress', exercises, note: null };
}

export function findLoggedExercise(
  session: LoggedSession,
  blockCode: string,
): LoggedExercise | undefined {
  return session.exercises.find((entry) => entry.blockCode === blockCode);
}

function replaceExercise(
  session: LoggedSession,
  blockCode: string,
  update: (entry: LoggedExercise) => LoggedExercise,
): LoggedSession {
  return {
    ...session,
    exercises: session.exercises.map((entry) =>
      entry.blockCode === blockCode ? update(entry) : entry,
    ),
  };
}

/** Inserisce o sostituisce una serie. La chiave è indice più lato. */
export function upsertLoggedSet(
  session: LoggedSession,
  blockCode: string,
  set: LoggedSet,
): LoggedSession {
  return replaceExercise(session, blockCode, (entry) => {
    const others = entry.sets.filter(
      (existing) => !(existing.setIndex === set.setIndex && existing.side === set.side),
    );
    return {
      ...entry,
      sets: [...others, set].sort(
        (a, b) => a.setIndex - b.setIndex || (a.side ?? '').localeCompare(b.side ?? ''),
      ),
    };
  });
}

export function removeLoggedSet(
  session: LoggedSession,
  blockCode: string,
  setIndex: number,
  side: Side | null,
): LoggedSession {
  return replaceExercise(session, blockCode, (entry) => ({
    ...entry,
    sets: entry.sets.filter((set) => !(set.setIndex === setIndex && set.side === side)),
  }));
}

export function setVariant(
  session: LoggedSession,
  blockCode: string,
  variantLabel: string,
  level: LevelIndex | null,
): LoggedSession {
  return replaceExercise(session, blockCode, (entry) => ({ ...entry, variantLabel, level }));
}

/**
 * Il blocco con dentro l'esercizio davvero scelto.
 *
 * Dove la scheda ammette due esercizi con misure diverse — il C2 del Lower A:
 * sissy squat a ripetizioni, wall sit a secondi — la scelta cambia anche la
 * prescrizione. Sta qui e non nella UI perché il primo tentativo l'aveva
 * risolto solo nel player: il riepilogo di fine seduta continuava a leggere il
 * blocco dichiarato e analizzava i secondi del wall sit come se fossero
 * ripetizioni di sissy squat. Una volta sola, per tutti.
 */
export function effectiveBlock(block: ProgramBlock, session: LoggedSession): ProgramBlock {
  const chosen = findLoggedExercise(session, block.code)?.exercise;
  if (chosen === undefined || chosen === block.exercise) return block;
  const alternative = (block.alternatives ?? []).find((entry) => entry.exercise === chosen);
  if (alternative === undefined) return block;
  return { ...block, exercise: alternative.exercise, prescription: alternative.prescription };
}

/**
 * Cambia quale dei due esercizi ammessi dal blocco si sta facendo.
 *
 * Non è un cambio di variante: sissy squat e wall sit sono esercizi diversi,
 * con misure diverse. Le serie già registrate se ne vanno insieme
 * all'esercizio, perché ripetizioni e secondi non si sommano e tenerle
 * significherebbe archiviare secondi sotto la voce delle ripetizioni.
 */
export function setBlockExercise(
  session: LoggedSession,
  blockCode: string,
  exercise: ExerciseSlug,
  variantLabel: string,
): LoggedSession {
  return replaceExercise(session, blockCode, (entry) =>
    entry.exercise === exercise
      ? entry
      : { ...entry, exercise, variantLabel, level: null, sets: [] },
  );
}

export function setTempoRespected(
  session: LoggedSession,
  blockCode: string,
  tempoRespected: boolean | null,
): LoggedSession {
  return replaceExercise(session, blockCode, (entry) => ({ ...entry, tempoRespected }));
}

export function setExerciseNote(
  session: LoggedSession,
  blockCode: string,
  note: string | null,
): LoggedSession {
  return replaceExercise(session, blockCode, (entry) => ({ ...entry, note }));
}

export function setSessionNote(session: LoggedSession, note: string | null): LoggedSession {
  return { ...session, note };
}

/**
 * Chiude la seduta. `at` e' l'istante di chiusura, quando chi chiama lo sa:
 * la funzione resta pura e l'orologio lo legge l'interfaccia.
 */
export function closeSession(session: LoggedSession, at?: string): LoggedSession {
  return {
    ...session,
    status: 'completed',
    ...(at === undefined ? {} : { completedAt: at }),
  };
}

/** Segna l'inizio della seduta, una volta sola: riprenderla non lo sposta. */
export function markStarted(session: LoggedSession, at: string): LoggedSession {
  if (typeof session.startedAt === 'string') return session;
  return { ...session, startedAt: at };
}

/**
 * Durata vera della seduta in secondi, quando si puo' calcolare.
 *
 * `null` se manca uno dei due istanti o se il risultato non ha senso: una
 * seduta lasciata aperta e chiusa il giorno dopo non e' durata ventisei ore.
 */
export function sessionDurationSeconds(session: LoggedSession): number | null {
  if (typeof session.startedAt !== 'string' || typeof session.completedAt !== 'string') return null;
  const inizio = Date.parse(session.startedAt);
  const fine = Date.parse(session.completedAt);
  if (Number.isNaN(inizio) || Number.isNaN(fine)) return null;
  const secondi = Math.round((fine - inizio) / 1000);
  if (secondi <= 0 || secondi > 4 * 3600) return null;
  return secondi;
}

/* -------------------------------------------------------------------------- */
/* Avanzamento nel piano                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Una serie è fatta quando esiste il dato che la scheda chiede.
 * Sugli esercizi per lato servono entrambi i lati: mezza serie registrata non
 * è una serie.
 */
export function isStepLogged(session: LoggedSession, step: SessionStep): boolean {
  const entry = findLoggedExercise(session, step.blockCode);
  if (entry === undefined) return false;
  const rows = entry.sets.filter((set) => set.setIndex === step.setIndex);
  if (step.perSide) {
    return rows.some((set) => set.side === 'left') && rows.some((set) => set.side === 'right');
  }
  return rows.some((set) => set.side === null);
}

export interface SessionProgress {
  readonly done: number;
  readonly total: number;
  readonly complete: boolean;
}

export function sessionProgress(
  session: LoggedSession,
  plan: readonly SessionStep[],
): SessionProgress {
  const done = plan.filter((step) => isStepLogged(session, step)).length;
  return { done, total: plan.length, complete: done === plan.length && plan.length > 0 };
}

/** Indice del primo passo non ancora registrato. `-1` quando è tutto fatto. */
export function firstPendingIndex(
  session: LoggedSession,
  plan: readonly SessionStep[],
): number {
  return plan.findIndex((step) => !isStepLogged(session, step));
}

/* -------------------------------------------------------------------------- */
/* Precompilazione dalla volta scorsa                                          */
/* -------------------------------------------------------------------------- */

/**
 * Ultima registrazione di un blocco, dalla seduta più recente che lo contiene
 * con almeno una serie. Serve a proporre zavorra e variante già impostate.
 *
 * `oggi` è cosa quel codice di blocco prescrive adesso. Senza, il codice era
 * l'unica chiave: bastava che una scheda cambiasse l'esercizio sotto un
 * codice e la precompilazione portava avanti i dati di un esercizio diverso.
 * È successo davvero, su trentatré codici su trentasei, quando le quattro
 * sedute sono state riscritte sull'originale: `circuito-1/B2` era il goblet
 * squat e è diventato l'estensione dei tricipiti sopra la testa, e i chili
 * della campana venivano proposti come carico dell'estensione; `circuito-3/B2`
 * era il wall sit, misurato in secondi, e è diventato un esercizio a
 * ripetizioni, con il 45 che passava da secondi a ripetizioni senza che
 * niente lo dicesse.
 *
 * Omesso, il comportamento è quello di prima: tutte le registrazioni passano.
 */
export function lastLoggedByBlock(
  sessions: readonly LoggedSession[],
  sessionId: LoggedSession['sessionId'],
  excludeId: string,
  oggi?: ReadonlyMap<string, ExerciseSlug>,
): ReadonlyMap<string, LoggedExercise> {
  const relevant = [...sessions]
    .filter((entry) => entry.sessionId === sessionId && entry.id !== excludeId)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const byBlock = new Map<string, LoggedExercise>();
  for (const session of relevant) {
    for (const logged of session.exercises) {
      if (logged.sets.length === 0) continue;
      /* Stesso codice, altro esercizio: non è lo storico di questo blocco. */
      const prescritto = oggi?.get(logged.blockCode);
      if (prescritto !== undefined && prescritto !== logged.exercise) continue;
      byBlock.set(logged.blockCode, logged);
    }
  }
  return byBlock;
}

/** Valore proposto per una serie, dalla stessa serie della volta scorsa. */
export function suggestedSetValue(
  previous: LoggedExercise | undefined,
  setIndex: number,
  side: Side | null,
): LoggedSet | undefined {
  if (previous === undefined) return undefined;
  return (
    previous.sets.find((set) => set.setIndex === setIndex && set.side === side) ??
    previous.sets.find((set) => set.side === side) ??
    previous.sets[0]
  );
}

/** Serie previste per un blocco nella settimana indicata, scarico compreso. */
export function plannedSets(session: ProgramSession, blockCode: string, week: number): number {
  const block = session.blocks.find((entry) => entry.code === blockCode);
  return block === undefined ? 0 : effectiveSets(block.sets, week);
}

/* -------------------------------------------------------------------------- */
/* Quello che scrivi torna nello stato                                         */
/* -------------------------------------------------------------------------- */

/**
 * Stati aggiornati con quello che la seduta ha davvero registrato.
 *
 * `ExerciseState` era scritto solo accettando un suggerimento, e il carico non
 * lo leggeva nessuno: il player precompilava i kg dall'ultima riga di log, non
 * dallo stato. Accettare «aggiungi zavorra» cambiava quindi un numero che
 * nessuno guardava, e la volta dopo ricompariva il peso vecchio.
 *
 * Qui lo stato diventa quello che è sempre dovuto essere: il carico e il
 * gradino attuali. Si sincronizza alla chiusura della seduta, così una
 * correzione fatta a mano nel player — due kg in più di manubrio, un livello
 * sceso perché oggi non ne usciva una — vale come una decisione presa, senza
 * doverla ripetere in un'altra schermata.
 *
 * Restituisce solo gli stati cambiati: chi chiama li salva, e una seduta che
 * non ha spostato niente non riscrive niente.
 */
export function syncStatesFromLog(
  session: LoggedSession,
  states: ReadonlyMap<ExerciseSlug, ExerciseState>,
): ExerciseState[] {
  const changed: ExerciseState[] = [];
  /*
   * Un esercizio in più blocchi si sincronizza una volta, sul peso più alto
   * scritto oggi (R14b): un blocco fatto a 10 kg accanto a uno allo stato di
   * 12 kg non riporta lo stato a 10.
   */
  const visti = new Set<ExerciseSlug>();

  for (const logged of session.exercises) {
    if (logged.sets.length === 0) continue;
    if (visti.has(logged.exercise)) continue;
    visti.add(logged.exercise);
    const stessoEsercizio = session.exercises.filter((voce) => voce.exercise === logged.exercise);

    /*
     * Una bozza aperta prima di un cambio di anagrafica può contenere uno slug
     * che non esiste più — è successo davvero, spezzando «sissy squat o wall
     * sit» in due esercizi a metà settimana. `getExercise` lancia: farlo qui
     * vorrebbe dire una seduta che non si chiude più.
     */
    const exercise = findExercise(logged.exercise);
    if (exercise === undefined) continue;

    const before = states.get(logged.exercise) ?? {
      exercise: logged.exercise,
      level: logged.level,
      eccentricBonusSeconds: 0,
      bottomPauseBonusSeconds: 0,
      loadKg: 0,
    };

    /*
     * Il carico si prende dal massimo registrato, non dall'ultima serie: chi
     * cala all'ultima serie perché era finita non ha cambiato manubrio.
     * Dove il peso non è registrabile resta quello che c'era: uno zero scritto
     * in un campo che non esiste cancellerebbe una zavorra vera.
     */
    const maxLoad = stessoEsercizio.reduce(
      (max, voce) => voce.sets.reduce((m, set) => Math.max(m, set.loadKg), max),
      0,
    );
    /*
     * R14e: un manubrio a 0 kg con uno stato a peso è un peso non scritto, non
     * un peso. Lo stato tiene peso, tempo e pausa; il gradino si aggiorna.
     * Prima 12 kg con +2″/+2″ diventavano 0 kg con +0″/+0″ (L2).
     */
    const nonScritto = exercise.loadPolicy === 'inherent' && maxLoad === 0 && before.loadKg > 0;
    const loadKg = exercise.loadPolicy === 'forbidden' || nonScritto ? before.loadKg : maxLoad;
    /* L24: il gradino più alto scritto oggi, come il peso. */
    const level = livelloVoci(stessoEsercizio) ?? before.level;

    if (level === before.level && loadKg === before.loadKg) continue;
    /*
     * Un manubrio cambiato di propria iniziativa riporta tempo e pausa a
     * quelli della scheda, come un cambio di gradino (decisione di Alessio,
     * 2026-11-16): 14 kg con l'eccentrica a 5" accumulata sui 12 non è il
     * passo che il metodo chiede.
     */
    const manubrioCambiato = exercise.loadPolicy === 'inherent' && loadKg !== before.loadKg;
    /* D-23 (a), Alessio, 2026-11-20: lo stesso per un gradino cambiato a mano. */
    const gradinoCambiato = level !== before.level;
    /* R23 (L42): un gradino cambiato a mano non si porta dietro la zavorra; i manubri restano. */
    const kgDopo = gradinoCambiato ? zavorraDopoIlCambio(exercise, { ...before, loadKg }, level).loadKg : loadKg;
    changed.push(
      manubrioCambiato || gradinoCambiato
        ? { ...before, level, loadKg: kgDopo, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0 }
        : { ...before, level, loadKg },
    );
  }

  return changed;
}

/**
 * Il peso da cui parte una serie nel player (A18, R14d).
 *
 * La zavorra si aggiunge a passi esatti: si parte dallo stato, che dopo una
 * leva accettata è il peso nuovo. Sui manubri lo stato accettato è un tetto,
 * «al massimo +2,5 kg», non il manubrio che si ha: si parte dal peso della
 * volta scorsa, e quello vero lo scrive l'atleta. Precompilare il tetto
 * faceva registrare 14,5 kg a chi era rimasto a 12, e la leva dopo
 * proponeva 17 (R-7).
 */
export function pesoIniziale(inerente: boolean, dalloStato: number, dallaVoltaScorsa: number): number {
  if (inerente && dallaVoltaScorsa > 0) return dallaVoltaScorsa;
  return dalloStato > 0 ? dalloStato : dallaVoltaScorsa;
}

/**
 * Gli stati da salvare alla chiusura della seduta: quelli ricavati dal diario,
 * tranne gli esercizi su cui è stata accettata una leva (training-quality A13,
 * L22).
 *
 * Lo stato accettato si scrive una volta sola, insieme alla traccia della
 * scelta (`recordDecision`). Riscriverlo qui, da solo, voleva dire che se la
 * traccia si perdeva lo stato cambiava lo stesso: R10b e R13, che leggono la
 * traccia, lasciavano passare un secondo aumento (L22). E il diario non deve
 * sovrascriverlo:
 *
 * Prima si salvavano solo i primi. `syncStatesFromLog` riscrive gradino e
 * chili da quello che la seduta ha registrato, cioè dal gradino a cui hai
 * *fatto* le serie — e la leva accettata un minuto prima («sali al gradino
 * 3», «+2,5 kg») veniva sovrascritta al tocco su «Salva e chiudi». Il
 * registro dei suggerimenti diceva «accettata» con uno stato che non si
 * applicava mai. Una decisione presa dopo le serie vale più delle serie.
 */
export function statesToSave(
  synced: readonly ExerciseState[],
  accepted: ReadonlyMap<ExerciseSlug, ExerciseState>,
): ExerciseState[] {
  return synced.filter((entry) => !accepted.has(entry.exercise));
}

/** Quello che serve di un suggerimento registrato, senza dipendere dal database. */
export interface RecordedDecision {
  readonly sessionLogId: string;
  readonly exercise: ExerciseSlug;
  readonly blockCode: string;
  readonly decision: 'accepted' | 'postponed' | 'lapsed';
  readonly stateBefore: ExerciseState;
  readonly stateAfter: ExerciseState;
}

export interface SessionDecisions {
  /** `${sessionLogId}:${blockCode}` dei blocchi già decisi. */
  readonly decided: ReadonlySet<string>;
  /** Le leve accettate in questa seduta: alla chiusura vincono sul diario. */
  readonly accepted: ReadonlyMap<ExerciseSlug, ExerciseState>;
  /**
   * Gli stati su cui valutare le leve nel riepilogo: quelli di prima della
   * scelta, per gli esercizi già decisi.
   */
  readonly toEvaluate: ReadonlyMap<ExerciseSlug, ExerciseState>;
}

/**
 * Le scelte di fine seduta, ricostruite da quello che è già salvato
 * (training-quality B11 e A15).
 *
 * Le scelte stavano solo in memoria, mentre lo stato accettato era già sul
 * disco. Una ricarica fra «Accetto» e «Salva e chiudi» — il telefono che si
 * blocca, l'app che va in secondo piano — le cancellava: il riepilogo si
 * riapriva senza «Scelta registrata», chiudendo la leva si annullava, e
 * accettando di nuovo si saliva due volte nella stessa seduta (trazioni
 * 1 → 3 → 4).
 *
 * E il riepilogo valutava le leve sullo stato appena accettato: dopo «sali al
 * gradino 3» mostrava «sali al gradino 4» sopra «Scelta registrata». Lo stato
 * salvato era giusto, il numero letto no. Si valuta sullo stato di prima.
 *
 * `local` sono le scelte fatte in questa schermata, che possono arrivare prima
 * che il database le restituisca.
 */
export function sessionDecisions(
  sessionLogId: string,
  records: readonly RecordedDecision[],
  local: readonly RecordedDecision[],
  liveStates: ReadonlyMap<ExerciseSlug, ExerciseState>,
): SessionDecisions {
  const decided = new Set<string>();
  const accepted = new Map<ExerciseSlug, ExerciseState>();
  const toEvaluate = new Map(liveStates);
  const toEvaluateFixed = new Set<ExerciseSlug>();
  /* Le locali per ultime: sono le più recenti. */
  for (const record of [...records, ...local]) {
    if (record.sessionLogId !== sessionLogId) continue;
    /* Un record `lapsed` non è una scelta del riepilogo: lo scrive la chiusura (R14). */
    if (record.decision === 'lapsed') continue;
    decided.add(`${sessionLogId}:${record.blockCode}`);
    if (record.decision === 'accepted') accepted.set(record.exercise, record.stateAfter);
    else accepted.delete(record.exercise);
    /* Lo stato di prima resta il primo registrato: una scelta rifatta non lo sposta. */
    if (!toEvaluateFixed.has(record.exercise)) {
      toEvaluate.set(record.exercise, record.stateBefore);
      toEvaluateFixed.add(record.exercise);
    }
  }
  return { decided, accepted, toEvaluate };
}

/**
 * R9c (R-17, B16): gli stati da fissare perché nessun test alzi un gradino da
 * solo.
 *
 * Uno stato mai salvato si ricalcola dagli ultimi test, e la sincronizzazione
 * salva solo gli stati che cambiano. Un esercizio fatto sempre allo stesso
 * gradino non aveva mai uno stato salvato: un ritest migliore lo alzava di
 * uno o due gradini, senza le regole di salita (R5, R7). Qui si salva lo
 * stato di ogni esercizio fatto e mai salvato, uguale a quello che l'app
 * mostra: da lì in poi si sale solo con le leve.
 *
 * `calcolato` riceve anche la data dell'ultima seduta in cui l'esercizio è
 * stato fatto: lo stato giusto è quello con cui ci si è allenati, non quello
 * che darebbe un test arrivato dopo.
 */
export function statiDaFissare(
  sessions: readonly LoggedSession[],
  salvati: ReadonlySet<ExerciseSlug>,
  calcolato: (slug: ExerciseSlug, ultimaSeduta: string) => ExerciseState | undefined,
): ExerciseState[] {
  const fatti = new Map<ExerciseSlug, string>();
  for (const session of sessions) {
    for (const voce of session.exercises) {
      if (voce.sets.length === 0 || findExercise(voce.exercise) === undefined) continue;
      const prima = fatti.get(voce.exercise);
      if (prima === undefined || session.date > prima) fatti.set(voce.exercise, session.date);
    }
  }
  return [...fatti]
    .filter(([slug]) => !salvati.has(slug))
    .flatMap(([slug, data]) => {
      const stato = calcolato(slug, data);
      return stato === undefined ? [] : [stato];
    });
}
