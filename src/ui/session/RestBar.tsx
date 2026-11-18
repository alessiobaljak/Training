import { formatClock, useCountdown } from '../hooks/useTimers.ts';
import { signalRestOver } from '../feedback.ts';
import type { RestDecision } from '../../engine/rest.ts';

/**
 * Barra del recupero.
 *
 * Non è una finestra che blocca: durante una superserie i 15-20" servono a
 * spostarsi, e uno schermo da chiudere sarebbe un ostacolo in più. Il conto
 * resta visibile sopra il contenuto e non impedisce di registrare.
 */
export interface RestBarProps {
  readonly rest: RestDecision;
  readonly nextLabel: string;
  readonly onDismiss: () => void;
}

export function RestBar({ rest, nextLabel, onDismiss }: RestBarProps) {
  const countdown = useCountdown(rest.seconds, { autoStart: true, onDone: signalRestOver });

  const isRange = rest.maxSeconds > rest.seconds;
  const tone = countdown.done ? 'border-good/50 bg-good/15' : 'border-accent/40 bg-accent/10';

  return (
    <div
      data-testid="rest-bar"
      data-total={rest.seconds}
      className={`flex items-center gap-3 border-b px-4 py-3 ${tone}`}
    >
      <p
        className={`tabular w-20 shrink-0 text-3xl font-semibold ${countdown.done ? 'text-good' : 'text-ink'}`}
      >
        {formatClock(countdown.remaining)}
      </p>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {countdown.done ? 'Recupero finito' : rest.label}
        </p>
        <p className="truncate text-xs text-dim">
          {countdown.done
            ? nextLabel
            : isRange
              ? `${rest.hint} Fino a ${String(rest.maxSeconds)}".`
              : rest.hint}
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Chiudi il recupero"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl text-dim active:bg-panel"
      >
        ×
      </button>
    </div>
  );
}
