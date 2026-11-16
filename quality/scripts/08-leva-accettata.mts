/*
 * 08 — Una leva accettata a fine seduta sopravvive al salvataggio? (A13)
 *
 * v3, 2026-11-15 (commit ff42dfb). La v2 era obsoleta per due ragioni:
 *   1. `evaluateProgression` chiede `salita` (R7) e `rientro` (R9): senza,
 *      la leva della variante legge `undefined` e lo script va in crash;
 *   2. dal `79d2cb0` i player non tengono più le scelte in memoria: le
 *      ricostruiscono dai suggerimenti registrati con `sessionDecisions`
 *      (decided, accepted, toEvaluate = stato di prima della scelta). Q e V
 *      vanno misurati su quella funzione, non sul vecchio `useRef`.
 * La salita R7 si calcola con `salitaConsentita` su una storia di sedute
 * chiuse: prima seduta al gradino 15 giorni prima (R7 aperta) dove non detto.
 *
 * v2, 2026-11-12 (commit 2d84d87). La v1 eseguiva il vecchio ordine
 *   for (const next of syncStatesFromLog(draft, states)) confirmExercise(next);
 * e dopo la correzione misurava una cosa che il prodotto non fa più
 * (segnalato da release-gate). Adesso entrambi i player, al «Salva e chiudi»:
 *   for (const s of statesToSave(syncStatesFromLog(draft, states), accettate)) confirmExercise(s);
 * dove `accettate` riceve `suggestion.nextState` su «Accetto» e perde la voce
 * su «Rimando» (GuidedSession.tsx e SessionScreen.tsx, stessa sequenza).
 *
 * Qui si eseguono le funzioni dell'engine nello stesso ordine, con i dati di
 * una seduta vera del circuito. Lo stato atteso NON viene dal codice: è
 * `suggestion.nextState`, cioè quello che l'atleta ha letto e accettato.
 * Il passaggio UI (Map `accettate`, `confirmExercise` che aggiorna `states`)
 * è modellato, non eseguito: lo dice ogni riga.
 *
 * Più due controlli nuovi:
 *  R — «Rimando»: nessuna leva salvata, resta il diario.
 *  V — cosa mostra il riepilogo sopra «Scelta registrata» dopo l'accettazione
 *      (il riepilogo si ricalcola con lo stato già confermato).
 *  D — accettata, poi gradino abbassato a mano tornando alla seduta: chi vince.
 *
 * v4, 2026-11-16 (commit cf7588a). R13 entra nel riepilogo: `aumentoRecente`
 * con il registro meno le scelte della seduta stessa (`sessionLogId !== draft.id`,
 * scostamento dichiarato dalla sessione principale) e il diario con la bozza.
 * V e Q2 si rileggono con la scelta appena registrata nel registro; in più il
 * controllo «senza filtro» dice se lo scostamento serve davvero.
 *
 * Esecuzione: node --experimental-strip-types quality/scripts/08-leva-accettata.mts
 */
import { findCircuitSession } from '../../src/data/circuit.ts';
import { getExercise } from '../../src/data/exercises.ts';
import { aumentoRecente, evaluateProgression } from '../../src/engine/progression.ts';
import { resolveBlockRange } from '../../src/engine/ranges.ts';
import { sessionDecisions, statesToSave, syncStatesFromLog } from '../../src/engine/draft.ts';
import type { RecordedDecision } from '../../src/engine/draft.ts';
import { salitaConsentita } from '../../src/engine/progression.ts';
import type { DecisioneRegistrata, ExerciseSlug, ExerciseState, LevelIndex, LoggedExercise, LoggedSession, TestId, TestResult } from '../../src/types/index.ts';

const VUOTO = new Map<TestId, TestResult>();
type Sid = 'circuito-1' | 'circuito-2' | 'circuito-3' | 'circuito-4';
const fmt = (s: ExerciseState): string =>
  `gradino ${String(s.level)} · ${String(s.loadKg)} kg · ecc+${String(s.eccentricBonusSeconds)}" · pausa+${String(s.bottomPauseBonusSeconds)}"`;
let difetti = 0;

function preparazione(sessionId: Sid, code: string, valori: number[], livello: LevelIndex, kg: number, settimana: number, bonus: number, massimale: number | null) {
  const s = findCircuitSession(sessionId)!;
  const block = s.blocks.find((b) => b.code === code)!;
  const ex = getExercise(block.exercise);
  const prima: ExerciseState = { exercise: ex.slug, level: livello, eccentricBonusSeconds: bonus, bottomPauseBonusSeconds: bonus, loadKg: kg };
  const logged: LoggedExercise = {
    blockCode: code, exercise: ex.slug, variantLabel: 'fixture', level: livello, tempoRespected: true,
    sets: valori.map((v, i) => ({ setIndex: i + 1, side: null, value: v, rir: null, loadKg: kg, heartRate: null, note: null })),
    note: null,
  };
  const draft: LoggedSession = { id: 'q08', date: '2026-11-12', week: settimana, sessionId, status: 'in-progress', exercises: [logged], note: null };
  /* storia: una seduta chiusa allo stesso gradino 15 giorni prima (R7 aperta) */
  const storia: LoggedSession[] = [{ ...draft, id: 'q08-prima', date: '2026-10-28', status: 'completed' }];
  const valuta = (state: ExerciseState, registro: readonly DecisioneRegistrata[] = [], filtra = true) =>
    evaluateProgression({ block, exercise: ex, state, logged, range: resolveBlockRange(block, ex, VUOTO), week: settimana, currentMaxReps: massimale,
      salita: salitaConsentita(ex.slug, state.level, storia, draft.date, draft), rientro: null,
      aumentoRecente: aumentoRecente(ex.slug, filtra ? registro.filter((r) => r.sessionLogId !== draft.id) : registro, storia, draft.date, draft) });
  return { ex, prima, logged, draft, valuta };
}

/* A — «Accetto», poi «Salva e chiudi». */
function accetta(titolo: string, sessionId: Sid, code: string, valori: number[], livello: LevelIndex, kg: number, settimana: number, bonus = 0, massimale: number | null = null): void {
  const { ex, prima, draft, valuta } = preparazione(sessionId, code, valori, livello, kg, settimana, bonus, massimale);
  const ev = valuta(prima);
  const sug = ev.suggestion;
  if (sug === null) { console.log(`—         ${titolo}: nessun suggerimento (trigger=${String(ev.triggered)})`); return; }
  /* «Accetto»: confirmExercise(nextState) → `states` aggiornato; accettate.set */
  const stati = new Map<ExerciseSlug, ExerciseState>([[ex.slug, sug.nextState]]);
  const accettate = new Map<ExerciseSlug, ExerciseState>([[ex.slug, sug.nextState]]);
  /* «Salva e chiudi» */
  for (const next of statesToSave(syncStatesFromLog(draft, stati), accettate)) stati.set(next.exercise, next);
  const finale = stati.get(ex.slug)!;
  const tenuto = JSON.stringify(finale) === JSON.stringify(sug.nextState);
  if (!tenuto) difetti += 1;

  /* V — v3: il riepilogo valuta su `sessionDecisions(...).toEvaluate`, con il suggerimento registrato */
  const rec: RecordedDecision = { sessionLogId: draft.id, exercise: ex.slug, blockCode: code, decision: 'accepted', stateBefore: prima, stateAfter: sug.nextState };
  const scelte = sessionDecisions(draft.id, [], [rec], new Map([[ex.slug, sug.nextState]]));
  const registro: DecisioneRegistrata[] = [{ ...rec, date: draft.date }];
  const dopo = valuta(scelte.toEvaluate.get(ex.slug)!, registro).suggestion;
  const senzaFiltro = valuta(scelte.toEvaluate.get(ex.slug)!, registro, false);
  const mostrata = dopo === null ? 'nessuna leva (il riquadro sparisce, e con lui «Scelta registrata»)' : `«${dopo.title}» (${dopo.lever})`;
  const coerente = dopo !== null && dopo.lever === sug.lever && JSON.stringify(dopo.nextState) === JSON.stringify(sug.nextState);
  console.log(`${tenuto ? 'TENUTA   ' : 'ANNULLATA'} ${titolo}: leva «${sug.lever}» · prima ${fmt(prima)} → accettato ${fmt(sug.nextState)} → salvato ${fmt(finale)}`);
  if (!coerente) difetti += 1;
  console.log(`          V: dopo «Accetto» il riquadro mostra ${mostrata}${coerente ? '' : ' ≠ leva accettata'} · senza il filtro della seduta: ${senzaFiltro.suggestion === null ? `nessuna leva, «${String(senzaFiltro.blockedReason).slice(0, 60)}…» (lo scostamento serve)` : 'la stessa (il filtro non serve)'}`);
}

/* R — «Rimando»: si salva il diario, nessuna leva. */
function rimanda(titolo: string, sessionId: Sid, code: string, valori: number[], livello: LevelIndex, kg: number, settimana: number): void {
  const { ex, prima, draft, valuta } = preparazione(sessionId, code, valori, livello, kg, settimana, 0, null);
  const sug = valuta(prima).suggestion;
  const stati = new Map<ExerciseSlug, ExerciseState>([[ex.slug, prima]]);
  const accettate = new Map<ExerciseSlug, ExerciseState>();
  for (const next of statesToSave(syncStatesFromLog(draft, stati), accettate)) stati.set(next.exercise, next);
  const finale = stati.get(ex.slug)!;
  const ok = JSON.stringify(finale) === JSON.stringify(prima);
  if (!ok) difetti += 1;
  console.log(`${ok ? 'OK       ' : 'CAMBIATO '} ${titolo} (Rimando su «${String(sug?.lever)}»): salvato ${fmt(finale)}, atteso ${fmt(prima)}`);
}

/* D — accettata la variante, poi tornando alla seduta il gradino si abbassa a mano. */
function accettaPoiAbbassa(titolo: string, sessionId: Sid, code: string, valori: number[], livello: LevelIndex, settimana: number): void {
  const { ex, prima, draft, valuta } = preparazione(sessionId, code, valori, livello, 0, settimana, 0, null);
  const sug = valuta(prima).suggestion;
  if (sug === null || sug.lever !== 'variant') { console.log(`—         ${titolo}: nessuna variante proposta`); return; }
  const abbassato = (livello > 1 ? livello - 1 : 1) as LevelIndex;
  /* VariantPicker: setVariant sulla bozza + confirmExercise({...state, level}) */
  const stati = new Map<ExerciseSlug, ExerciseState>([[ex.slug, { ...sug.nextState, level: abbassato }]]);
  const bozza: LoggedSession = { ...draft, exercises: draft.exercises.map((e) => ({ ...e, level: abbassato })) };
  const accettate = new Map<ExerciseSlug, ExerciseState>([[ex.slug, sug.nextState]]);
  for (const next of statesToSave(syncStatesFromLog(bozza, stati), accettate)) stati.set(next.exercise, next);
  const finale = stati.get(ex.slug)!;
  console.log(`${finale.level === abbassato ? 'ULTIMA   ' : 'ACCETTATA'} ${titolo}: accettato gradino ${String(sug.nextState.level)}, poi abbassato a mano a ${String(abbassato)} → salvato gradino ${String(finale.level)} (flusso UI modellato, non eseguito)`);
}

/*
 * Q — l'app si ricarica fra «Accetto» e «Salva e chiudi» (telefono bloccato,
 * PWA chiusa dal sistema). `accettate` (useRef) e `decided` (useState) vivono
 * solo in memoria; lo stato accettato invece è già su disco (confirmExercise
 * → saveExerciseState). Alla riapertura, con tutte le serie registrate, il
 * player guidato apre subito il riepilogo (GuidedSession.tsx, `primo === -1`).
 * Persistenza e riapertura: lette nel codice, non eseguite. Engine: eseguito.
 */
function ricarica(titolo: string, sessionId: Sid, code: string, valori: number[], livello: LevelIndex, settimana: number): void {
  const { ex, prima, draft, valuta } = preparazione(sessionId, code, valori, livello, 0, settimana, 0, null);
  const sug = valuta(prima).suggestion;
  if (sug === null) { console.log(`—         ${titolo}: nessun suggerimento`); return; }
  /* «Accetto»: stato accettato su disco + suggerimento registrato su disco. Poi ricarica:
     `locali` vuoto, `registrate` dal disco, stati dal disco = accettato. */
  const rec: RecordedDecision = { sessionLogId: draft.id, exercise: ex.slug, blockCode: code, decision: 'accepted', stateBefore: prima, stateAfter: sug.nextState };
  const daDisco = new Map<ExerciseSlug, ExerciseState>([[ex.slug, sug.nextState]]);
  const scelte = sessionDecisions(draft.id, [rec], [], daDisco);
  /* Q1 — si chiude senza toccare niente */
  const q1 = new Map(daDisco);
  for (const next of statesToSave(syncStatesFromLog(draft, q1), scelte.accepted)) q1.set(next.exercise, next);
  /* Q2 — il riepilogo riaperto valuta su toEvaluate; il blocco è già deciso? */
  const seconda = valuta(scelte.toEvaluate.get(ex.slug)!, [{ ...rec, date: draft.date }]).suggestion;
  const deciso = scelte.decided.has(`${draft.id}:${code}`);
  const stessa = seconda !== null && JSON.stringify(seconda.nextState) === JSON.stringify(sug.nextState);
  /* seconda difesa di R7: anche valutando sullo stato accettato la variante non si propone */
  const sulNuovo = valuta(sug.nextState).suggestion;
  const f1 = q1.get(ex.slug)!;
  const ok1 = JSON.stringify(f1) === JSON.stringify(sug.nextState);
  if (!ok1) difetti += 1;
  if (!(deciso && stessa)) difetti += 1;
  console.log(`${ok1 ? 'TENUTA   ' : 'ANNULLATA'} Q1 ${titolo}: accettato ${fmt(sug.nextState)}, ricarica, chiusura → salvato ${fmt(f1)}`);
  console.log(`${deciso && stessa ? 'OK       ' : 'DIFETTO  '} Q2 riaperto: mostra ${seconda === null ? 'niente' : `«${seconda.title}»`} (${stessa ? 'la stessa accettata' : 'UNA LEVA DIVERSA'}), blocco deciso=${String(deciso)} → «Scelta registrata», pulsanti spenti`);
  console.log(`          R7 seconda difesa: valutando sullo stato accettato la leva sarebbe ${sulNuovo === null ? 'nessuna' : `«${sulNuovo.lever}» ${sulNuovo.lever === 'variant' ? '(VARIANTE: difesa assente)' : ''}`}`);
}

console.log('=== A · Leva accettata nel riepilogo, poi «Salva e chiudi» (statesToSave) ===');
accetta('trazioni S1 A1, gradino 1, 9-9-9 su 6-8', 'circuito-1', 'A1', [9, 9, 9], 1, 0, 2);
accetta('push-up S3 A2, gradino 2, 19-19-19 su 12-18', 'circuito-3', 'A2', [19, 19, 19], 2, 0, 2);
accetta('push-up S3 A2, gradino 2, 18-18-18 su 12-18 (massimo esatto)', 'circuito-3', 'A2', [18, 18, 18], 2, 0, 2);
accetta('curl martello S1 B1, 10-10-10 su 8-10, 12 kg, sett. 4', 'circuito-1', 'B1', [10, 10, 10], 1, 12, 4);
accetta('trazioni S1 A1, gradino 6, 8-8-8, 5 kg, sett. 4', 'circuito-1', 'A1', [8, 8, 8], 6, 5, 4);
accetta('trazioni S1 A1, gradino 6, tempo e pause esauriti, 8-8-8, 5 kg, sett. 4, massimale 12', 'circuito-1', 'A1', [8, 8, 8], 6, 5, 4, 2, 12);
console.log('\n=== R · «Rimando» ===');
rimanda('push-up S3 A2, gradino 2, 18-18-18', 'circuito-3', 'A2', [18, 18, 18], 2, 0, 2);
rimanda('trazioni S1 A1, gradino 1, 9-9-9', 'circuito-1', 'A1', [9, 9, 9], 1, 0, 2);
console.log('\n=== D · Accettata, poi abbassata a mano prima di chiudere ===');
accettaPoiAbbassa('push-up S3 A2, gradino 2, 19-19-19', 'circuito-3', 'A2', [19, 19, 19], 2, 2);
console.log('\n=== Q · Ricarica fra «Accetto» e «Salva e chiudi» ===');
ricarica('trazioni S1 A1, gradino 1, 9-9-9 su 6-8', 'circuito-1', 'A1', [9, 9, 9], 1, 2);
ricarica('push-up S3 A2, gradino 2, 19-19-19 su 12-18', 'circuito-3', 'A2', [19, 19, 19], 2, 2);
console.log(`\nDifetti A/R/Q (stato salvato ≠ atteso, o riepilogo riaperto con una leva diversa): ${String(difetti)}`);
if (difetti > 0) process.exitCode = 1;
