import type { ReactNode } from 'react';

/**
 * Primitive di interfaccia.
 *
 * Un vincolo attraversa tutto il file: ogni area toccabile è alta almeno
 * 56 px. L'app si usa con il telefono a terra e le mani sudate, non con il
 * pollice fermo su uno schermo pulito.
 */

export const TAP_TARGET = 'min-h-14';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'md' | 'lg' | 'xl';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-ink active:brightness-90',
  secondary: 'bg-panel text-ink border border-line-strong active:bg-line',
  ghost: 'bg-transparent text-dim active:text-ink',
  danger: 'bg-transparent text-danger border border-danger/40 active:bg-danger/10',
};

const SIZES: Record<ButtonSize, string> = {
  md: 'min-h-14 px-5 text-base',
  lg: 'min-h-16 px-6 text-lg',
  xl: 'min-h-20 px-6 text-2xl',
};

export interface ButtonProps {
  readonly children: ReactNode;
  readonly onClick?: () => void;
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly disabled?: boolean;
  readonly full?: boolean;
  readonly ariaLabel?: string;
  /** Per i pulsanti che stanno in un gruppo a scelta singola. */
  readonly ariaPressed?: boolean;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  full = false,
  ariaLabel,
  ariaPressed,
}: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold',
        'transition-[filter,background-color] select-none',
        'disabled:opacity-40',
        VARIANTS[variant],
        SIZES[size],
        full ? 'w-full' : '',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

export interface CardProps {
  readonly children: ReactNode;
  readonly tone?: 'default' | 'muted' | 'accent' | 'warn';
  readonly className?: string;
}

const CARD_TONES: Record<NonNullable<CardProps['tone']>, string> = {
  default: 'bg-surface border-line card-lift',
  muted: 'bg-canvas border-line',
  accent: 'bg-accent/10 border-accent/40',
  warn: 'bg-warn/10 border-warn/40',
};

export function Card({ children, tone = 'default', className = '' }: CardProps) {
  return (
    <div className={`rounded-2xl border p-4 ${CARD_TONES[tone]} ${className}`}>{children}</div>
  );
}

export interface ScreenProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly onBack?: () => void;
  readonly children: ReactNode;
  /** Barra fissa in basso, per l'azione principale. */
  readonly footer?: ReactNode;
}

export function Screen({ title, subtitle, onBack, children, footer }: ScreenProps) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-canvas/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="flex items-center gap-3 py-3">
          {onBack !== undefined ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Indietro"
              className="-ml-2 flex h-12 w-12 items-center justify-center rounded-xl text-2xl text-dim active:bg-panel"
            >
              ‹
            </button>
          ) : null}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-semibold">{title}</h1>
            {subtitle !== undefined && subtitle !== '' ? (
              <p className="truncate text-sm text-dim">{subtitle}</p>
            ) : null}
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-4">{children}</main>

      {footer !== undefined ? (
        <div className="safe-bottom sticky bottom-0 border-t border-line bg-canvas/95 px-4 pt-3 backdrop-blur">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

export type BadgeTone = 'neutral' | 'accent' | 'good' | 'warn' | 'danger';

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'bg-panel text-dim',
  accent: 'bg-accent/15 text-accent',
  good: 'bg-good/15 text-good',
  warn: 'bg-warn/15 text-warn',
  danger: 'bg-danger/15 text-danger',
};

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${BADGE_TONES[tone]}`}>
      {children}
    </span>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-6 mb-2 text-xs font-semibold tracking-wide text-dim uppercase">{children}</h2>
  );
}

export function Notice({
  children,
  tone = 'accent',
}: {
  children: ReactNode;
  tone?: 'accent' | 'good' | 'warn' | 'danger';
}) {
  const tones = {
    accent: 'border-accent/40 bg-accent/10 text-ink',
    good: 'border-good/40 bg-good/10 text-ink',
    warn: 'border-warn/40 bg-warn/10 text-ink',
    danger: 'border-danger/40 bg-danger/10 text-ink',
  } as const;
  return <div className={`rounded-2xl border p-4 text-sm leading-relaxed ${tones[tone]}`}>{children}</div>;
}

/** Elenco di cue di esecuzione. Testo, non decorazione: si legge davvero. */
export function CueList({ cues }: { cues: readonly string[] }) {
  return (
    <ul className="space-y-2 text-sm leading-relaxed text-dim">
      {cues.map((cue) => (
        <li key={cue} className="flex gap-2">
          <span aria-hidden="true" className="text-accent">
            ·
          </span>
          <span>{cue}</span>
        </li>
      ))}
    </ul>
  );
}
