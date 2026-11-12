import type {
  RirNotation,
  RirTarget,
  TempoBreakdown,
  TempoDigit,
  TempoPhase,
  Tut,
  TutNotation,
} from '../types/index.ts';

/**
 * Lettura e scrittura delle notazioni testuali della scheda.
 * Logica pura: nessuna dipendenza dal DOM, nessuno stato.
 */

function parsePhase(digit: TempoDigit): TempoPhase {
  return digit === 'X' ? 'X' : Number(digit);
}

function formatPhase(phase: TempoPhase): TempoDigit {
  return phase === 'X' ? 'X' : (String(phase) as TempoDigit);
}

/**
 * La union `TutNotation` garantisce che la stringa sia una delle forme
 * ammesse, quindi questa funzione è totale: non ha un caso di errore.
 */
export function parseTut(notation: TutNotation): Tut {
  if (notation === 'controllato') return { kind: 'controlled' };
  if (notation === 'isometrico') return { kind: 'isometric' };
  if (notation === '—') return { kind: 'none' };

  const parts = notation.split('-') as [TempoDigit, TempoDigit, TempoDigit, TempoDigit];
  return {
    kind: 'tempo',
    eccentric: parsePhase(parts[0]),
    bottomPause: parsePhase(parts[1]),
    concentric: parsePhase(parts[2]),
    topPause: parsePhase(parts[3]),
  };
}

export function formatTut(tut: Tut): TutNotation {
  switch (tut.kind) {
    case 'controlled':
      return 'controllato';
    case 'isometric':
      return 'isometrico';
    case 'none':
      return '—';
    case 'tempo':
      return `${formatPhase(tut.eccentric)}-${formatPhase(tut.bottomPause)}-${formatPhase(tut.concentric)}-${formatPhase(tut.topPause)}`;
  }
}

/** `true` quando il TUT esprime un tempo a quattro fasi su cui si può agire. */
export function isTempoBreakdown(tut: Tut): tut is TempoBreakdown {
  return tut.kind === 'tempo';
}

/** Durata di una ripetizione, in secondi. `null` se il TUT non è a quattro fasi. */
export function repDurationSeconds(tut: Tut): number | null {
  if (!isTempoBreakdown(tut)) return null;
  const phases: readonly TempoPhase[] = [tut.eccentric, tut.bottomPause, tut.concentric, tut.topPause];
  // Una fase esplosiva viene contata come un secondo: serve a stimare la
  // durata della serie, non a prescrivere il gesto.
  return phases.reduce<number>((sum, phase) => sum + (phase === 'X' ? 1 : phase), 0);
}

/** Descrizione a parole del tempo, per il player. */
export function describeTut(tut: Tut): string {
  switch (tut.kind) {
    case 'controlled':
      return 'Movimento controllato, senza rimbalzi.';
    case 'isometric':
      return 'Isometria: si tiene la posizione, non si contano ripetizioni.';
    case 'none':
      return 'Nessun tempo prescritto.';
    case 'tempo': {
      const phase = (value: TempoPhase, label: string): string | null => {
        if (value === 'X') return `${label} esplosiva`;
        if (value === 0) return null;
        return `${label} ${String(value)}"`;
      };
      const parts = [
        phase(tut.eccentric, 'eccentrica'),
        phase(tut.bottomPause, 'pausa in basso'),
        phase(tut.concentric, 'concentrica'),
        phase(tut.topPause, 'pausa in alto'),
      ].filter((part): part is string => part !== null);
      return parts.join(', ');
    }
  }
}

export interface TempoStep {
  /** `3″`, oppure `veloce` per una fase esplosiva. */
  readonly value: string;
  readonly label: 'discesa' | 'fermo in basso' | 'salita' | 'fermo in alto';
}

/**
 * Il tempo a quattro cifre, fase per fase, con le parole al posto dei posti.
 *
 * «3-0-1-1» si legge solo se si sa gia' che la prima cifra e' la discesa e la
 * quarta la pausa in contrazione. Qui le fasi a zero spariscono e le altre
 * dicono cosa sono: tre secondi di discesa, uno di salita, uno fermo in alto.
 * Lista vuota quando il tempo non e' a quattro fasi.
 */
export function tempoSteps(tut: Tut): readonly TempoStep[] {
  if (!isTempoBreakdown(tut)) return [];
  const fase = (value: TempoPhase, label: TempoStep['label']): TempoStep | null => {
    if (value === 'X') return { value: 'veloce', label };
    if (value === 0) return null;
    return { value: `${String(value)}″`, label };
  };
  return [
    fase(tut.eccentric, 'discesa'),
    fase(tut.bottomPause, 'fermo in basso'),
    fase(tut.concentric, 'salita'),
    fase(tut.topPause, 'fermo in alto'),
  ].filter((step): step is TempoStep => step !== null);
}

/* -------------------------------------------------------------------------- */
/* RIR                                                                         */
/* -------------------------------------------------------------------------- */

/** `null` quando la scheda non prescrive un RIR per quel blocco. */
export function parseRir(notation: RirNotation): RirTarget | null {
  if (notation === '—') return null;
  const [first, second] = notation.split('-');
  const min = Number(first);
  const max = second === undefined ? min : Number(second);
  return { min, max };
}

export function formatRir(target: RirTarget | null): RirNotation {
  if (target === null) return '—';
  return (target.min === target.max ? String(target.min) : `${String(target.min)}-${String(target.max)}`) as RirNotation;
}

/** `true` quando il RIR registrato rientra nel bersaglio del blocco. */
export function isRirOnTarget(rir: number | null, target: RirTarget | null): boolean {
  if (target === null || rir === null) return true;
  return rir >= target.min && rir <= target.max;
}
