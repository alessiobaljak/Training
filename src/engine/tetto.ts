import { decadenze } from './decadenza.ts';
import type { SceltaRegistrata } from './decadenza.ts';
import { syncStatesFromLog } from './draft.ts';
import type { ExerciseSlug, ExerciseState, LoggedSession } from '../types/index.ts';

/*
 * R19, σ′ (L25, training/reports/2026-11-21-training.md §3): la durata con
 * cui il riepilogo decide se un passo di tempo o pausa sta sotto il tetto.
 *
 * Prima contava solo i passi di tempo e pausa proposti più su. Non contava
 * una variante proposta sopra (l'hip thrust su una gamba raddoppia la sua
 * stazione), né quello che la chiusura scrive da sola: un gradino cambiato a
 * mano, una scelta tolta che rialza tempo e pausa. Sette sedute simulate su
 * 5.952 chiudevano oltre il tetto.
 */

type Stati = ReadonlyMap<ExerciseSlug, ExerciseState>;

/**
 * Gli stati che «Salva e chiudi» scriverebbe senza nessuna scelta di questo
 * riepilogo: quelli su cui si valutano le leve, la sincronizzazione del
 * diario, poi le scelte che la seduta toglie (R14).
 */
export function statiDellaChiusura(
  S: LoggedSession,
  daValutare: Stati,
  registro: readonly SceltaRegistrata[],
  sessions: readonly LoggedSession[],
): Map<ExerciseSlug, ExerciseState> {
  const base = new Map(daValutare);
  for (const stato of syncStatesFromLog(S, daValutare)) base.set(stato.exercise, stato);
  for (const d of decadenze(S, registro, sessions, daValutare)) base.set(d.exercise, d.stato);
  return base;
}

export interface TettoDelRiepilogo {
  /** La durata con l'esercizio allo stato dato e tutto il resto com'è σ′. */
  readonly durataCon: (stato: ExerciseState) => number;
  /**
   * Una proposta di un blocco, di qualunque leva. Entra in σ′ solo se allunga
   * la seduta: una che accorcia, se l'atleta la rifiuta, lascerebbe il passo
   * dopo oltre il tetto.
   */
  readonly proposta: (nextState: ExerciseState) => void;
}

/** σ′ per un riepilogo: si parte dalla chiusura e si aggiungono, in ordine, le proposte che allungano. */
export function tettoDelRiepilogo(base: Stati, durata: (stati: Stati) => number): TettoDelRiepilogo {
  const stati = new Map(base);
  return {
    durataCon: (stato) => durata(new Map(stati).set(stato.exercise, stato)),
    proposta: (nextState) => {
      const con = new Map(stati).set(nextState.exercise, nextState);
      if (durata(con) > durata(stati)) stati.set(nextState.exercise, nextState);
    },
  };
}
