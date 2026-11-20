import { getExercise } from '../data/exercises.ts';
import { formatDayLong, formatNumber } from './dates.ts';
import { syncStatesFromLog } from './draft.ts';
import { inElencoManubri, livelloVoci } from './progression.ts';
import type {
  ExerciseSlug,
  ExerciseState,
  LoggedExercise,
  LoggedSession,
  OverloadLever,
} from '../types/index.ts';

/*
 * R14 (training/reports/2026-11-18-training.md, rev. 2026-11-20): una scelta
 * in salita accettata e non eseguita si toglie.
 *
 * Prima restava nello stato anche quando la seduta dopo era fatta al peso di
 * prima: «manubrio successivo, al massimo 14,5 kg» accettato, seduta a 12 kg,
 * e lo stato diventava 12 kg senza tempo né pausa, con R13 fermo sette giorni
 * per un aumento mai avvenuto (M18). Ora alla chiusura lo stato torna quello
 * di prima della scelta, tempo e pausa compresi, e un record `lapsed` lo dice.
 */

/** Una scelta del registro, con quello che serve a toglierla. */
export interface SceltaRegistrata {
  readonly id: string;
  readonly date: string;
  readonly sessionLogId: string;
  readonly exercise: ExerciseSlug;
  readonly blockCode: string;
  readonly lever: OverloadLever;
  readonly decision: 'accepted' | 'postponed' | 'lapsed';
  readonly stateBefore: ExerciseState;
  readonly stateAfter: ExerciseState;
  readonly ref?: string;
}

export interface Decadenza {
  readonly exercise: ExerciseSlug;
  /** La scelta che si toglie. */
  readonly scelta: SceltaRegistrata;
  /** Lo stato da salvare alla chiusura, insieme al record. */
  readonly stato: ExerciseState;
  /** Il record `lapsed`, scritto insieme allo stato. */
  readonly record: SceltaRegistrata;
  /** Il testo R14a per il riepilogo. */
  readonly testo: string;
}

function vociDi(session: LoggedSession, slug: ExerciseSlug): readonly LoggedExercise[] {
  return session.exercises.filter((voce) => voce.exercise === slug && voce.sets.length > 0);
}

function caricoDi(voci: readonly LoggedExercise[]): number {
  return voci.reduce((max, voce) => voce.sets.reduce((m, set) => Math.max(m, set.loadKg), max), 0);
}

const kg = (value: number): string => `${formatNumber(value)} kg`;

const stessoStato = (a: ExerciseState, b: ExerciseState): boolean =>
  a.level === b.level &&
  a.loadKg === b.loadKg &&
  a.eccentricBonusSeconds === b.eccentricBonusSeconds &&
  a.bottomPauseBonusSeconds === b.bottomPauseBonusSeconds;

const bonusDiversi = (a: ExerciseState, b: ExerciseState): boolean =>
  a.eccentricBonusSeconds !== b.eccentricBonusSeconds || a.bottomPauseBonusSeconds !== b.bottomPauseBonusSeconds;

const conBonus = (stato: ExerciseState): boolean =>
  stato.eccentricBonusSeconds > 0 || stato.bottomPauseBonusSeconds > 0;

/** Cosa diceva la scelta, per il testo: «manubrio successivo, al massimo 14,5 kg». */
export function cosaDellaScelta(scelta: Pick<SceltaRegistrata, 'exercise' | 'stateBefore' | 'stateAfter'>): string {
  const prima = scelta.stateBefore;
  const dopo = scelta.stateAfter;
  if (dopo.loadKg > prima.loadKg) {
    if (getExercise(scelta.exercise).loadPolicy !== 'inherent') {
      return `carico ${formatNumber(prima.loadKg)} → ${kg(dopo.loadKg)}`;
    }
    /* D-19 (b): una scelta nuova è un manubrio esatto; una vecchia era un tetto. */
    return inElencoManubri(dopo.loadKg)
      ? `manubrio successivo, ${formatNumber(prima.loadKg)} → ${kg(dopo.loadKg)}`
      : `manubrio successivo, al massimo ${kg(dopo.loadKg)}`;
  }
  return `livello ${String(prima.level)} → ${String(dopo.level)}`;
}

/**
 * Le scelte che la seduta S toglie (R14), con lo stato e il record da
 * scrivere alla chiusura e il testo del riepilogo.
 *
 * `stati` sono quelli di adesso, prima della sincronizzazione di S. Una scelta
 * si toglie solo se è in attesa a S — nata fuori da S, non già tolta, nessuna
 * altra seduta chiusa l'ha risolta, lo stato è ancora il suo — e S ha scritto
 * un valore non più alto di quello di prima.
 */
/**
 * La scelta in salita in attesa su un esercizio (R14): accettata, nata fuori
 * dalla seduta `sedutaId`, non tolta, con lo stato ancora uguale al suo, e
 * nessuna seduta chiusa che l'abbia già risolta. `null` se non ce n'è.
 */
export function sceltaInAttesa(
  slug: ExerciseSlug,
  registro: readonly SceltaRegistrata[],
  sessions: readonly LoggedSession[],
  stato: ExerciseState,
  sedutaId: string,
): { readonly scelta: SceltaRegistrata; readonly sulCarico: boolean; readonly B: number; readonly T: number } | null {
  const exercise = getExercise(slug);
  const tolte = new Set(registro.flatMap((r) => (r.decision === 'lapsed' && r.ref !== undefined ? [r.ref] : [])));
  const c = registro
    .filter(
      (r) =>
        r.exercise === slug &&
        r.decision === 'accepted' &&
        !tolte.has(r.id) &&
        r.sessionLogId !== sedutaId &&
        stessoStato(stato, r.stateAfter),
    )
    .sort((a, b) => (a.date === b.date ? (a.id < b.id ? -1 : 1) : a.date < b.date ? -1 : 1))
    .at(-1);
  if (c === undefined) return null;
  const sulCarico = exercise.loadPolicy !== 'forbidden' && c.stateAfter.loadKg > c.stateBefore.loadKg;
  const sulLivello =
    !sulCarico && c.stateBefore.level !== null && c.stateAfter.level !== null && c.stateAfter.level > c.stateBefore.level;
  if (!sulCarico && !sulLivello) return null;
  const B = sulCarico ? c.stateBefore.loadKg : (c.stateBefore.level ?? 0);
  const T = sulCarico ? c.stateAfter.loadKg : (c.stateAfter.level ?? 0);
  const valore = (seduta: LoggedSession): number | null => {
    const voci = vociDi(seduta, slug);
    if (voci.length === 0) return null;
    if (sulCarico) {
      const v = caricoDi(voci);
      return exercise.loadPolicy === 'inherent' && v === 0 && stato.loadKg > 0 ? null : v;
    }
    return livelloVoci(voci);
  };
  const risolta = sessions.some((seduta) => {
    if (seduta.status !== 'completed' || seduta.id === sedutaId || seduta.id === c.sessionLogId) return false;
    if (seduta.date < c.date) return false;
    const v = valore(seduta);
    return v !== null && v !== B;
  });
  return risolta ? null : { scelta: c, sulCarico, B, T };
}

/**
 * R14d: il testo della stazione con un manubrio scelto e non ancora preso.
 * Il peso parte da B, quello di prima: un campo lasciato com'è non deve mai
 * alzare un numero. `null` se sull'esercizio non c'è un manubrio in attesa.
 */
export function testoManubrioInAttesa(
  slug: ExerciseSlug,
  registro: readonly SceltaRegistrata[],
  sessions: readonly LoggedSession[],
  stato: ExerciseState | undefined,
  sedutaId: string,
): string | null {
  return manubrioInAttesa(slug, registro, sessions, stato, sedutaId)?.testo ?? null;
}

/** R14d: il manubrio scelto e non ancora preso, con il peso di prima da cui parte il player. */
export function manubrioInAttesa(
  slug: ExerciseSlug,
  registro: readonly SceltaRegistrata[],
  sessions: readonly LoggedSession[],
  stato: ExerciseState | undefined,
  sedutaId: string,
): { readonly B: number; readonly T: number; readonly testo: string } | null {
  if (stato === undefined || getExercise(slug).loadPolicy !== 'inherent') return null;
  const attesa = sceltaInAttesa(slug, registro, sessions, stato, sedutaId);
  if (attesa === null || !attesa.sulCarico) return null;
  const { B, T } = attesa;
  const testo = inElencoManubri(T)
    ? `Manubrio scelto: ${kg(T)}. Il peso parte da ${kg(B)}, quello di prima: se prendi quello da ${kg(T)}, scrivilo in ogni serie. Se resti a ${kg(B)} la scelta si toglie e tempo e pausa tornano come prima.`
    : `Manubrio successivo: al massimo ${kg(T)}. Scrivi il peso che usi davvero; se resti a ${kg(B)} la scelta si toglie e tempo e pausa tornano come prima.`;
  return { B, T, testo };
}

export function decadenze(
  S: LoggedSession,
  registro: readonly SceltaRegistrata[],
  sessions: readonly LoggedSession[],
  stati: ReadonlyMap<ExerciseSlug, ExerciseState>,
): Decadenza[] {
  const esercizi = [...new Set(S.exercises.filter((voce) => voce.sets.length > 0).map((voce) => voce.exercise))];
  const out: Decadenza[] = [];

  for (const slug of esercizi) {
    const stato = stati.get(slug);
    if (stato === undefined) continue;
    const exercise = getExercise(slug);
    const attesa = sceltaInAttesa(slug, registro, sessions, stato, S.id);
    if (attesa === null) continue;
    const { scelta: c, sulCarico, B, T } = attesa;

    /* Il valore scritto in S, o `null` se non è scritto (R14e). */
    const voci = vociDi(S, slug);
    const v = sulCarico
      ? exercise.loadPolicy === 'inherent' && caricoDi(voci) === 0 && stato.loadKg > 0
        ? null
        : caricoDi(voci)
      : livelloVoci(voci);
    if (v === null || v > B) continue;

    const sincronizzato = syncStatesFromLog(S, new Map([[slug, c.stateBefore]])).find((s) => s.exercise === slug);
    const nuovo = sincronizzato ?? c.stateBefore;
    const giorno = formatDayLong(c.date);
    const cosa = cosaDellaScelta(c);
    const testo = sulCarico
      ? v === B
        ? `Oggi hai usato ${kg(B)}, il peso di prima: la scelta del ${giorno} (${cosa}) non è stata eseguita e si toglie.${bonusDiversi(c.stateBefore, c.stateAfter) ? ` Tempo e pausa tornano a quelli che avevi su ${kg(B)}.` : ''} Il prossimo passo si valuta dalla prossima seduta.`
        : `Oggi hai usato ${kg(v)}, meno di prima: la scelta del ${giorno} (${cosa}) non è stata eseguita e si toglie. Da qui comanda quello che hai scritto${exercise.loadPolicy === 'inherent' && conBonus(c.stateBefore) ? ': tempo e pausa tornano a quelli della scheda' : ''}.`
      : v === B
        ? `Oggi hai fatto il livello ${String(B)}, quello di prima: la scelta del ${giorno} (livello ${String(B)} → ${String(T)}) non è stata eseguita e si toglie.${bonusDiversi(c.stateBefore, c.stateAfter) ? ` Tempo e pausa tornano a quelli che avevi al livello ${String(B)}.` : ''} Il prossimo passo si valuta dalla prossima seduta.`
        : `Oggi hai fatto il livello ${String(v)}, sotto quello di prima: la scelta del ${giorno} (livello ${String(B)} → ${String(T)}) non è stata eseguita e si toglie. Da qui comanda quello che hai scritto${conBonus(c.stateBefore) ? ': tempo e pausa tornano a quelli della scheda' : ''}.`;

    out.push({
      exercise: slug,
      scelta: c,
      stato: nuovo,
      record: {
        /* Lo stesso id a ogni chiusura: una ricarica non scrive un secondo record (14.15). */
        id: `lapsed:${S.id}:${c.id}`,
        date: S.date,
        sessionLogId: S.id,
        exercise: slug,
        blockCode: c.blockCode,
        lever: c.lever,
        decision: 'lapsed',
        ref: c.id,
        stateBefore: c.stateAfter,
        stateAfter: nuovo,
      },
      testo,
    });
  }
  return out;
}
