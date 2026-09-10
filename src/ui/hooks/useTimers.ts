import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Cronometri calcolati dagli istanti, non dai tick.
 *
 * iOS rallenta i timer quando l'app va in secondo piano: un contatore che
 * somma tick perderebbe secondi ogni volta che blocchi lo schermo durante il
 * recupero. Qui il tempo si ricava sempre da `Date.now()`, quindi la pausa
 * dello schermo non lo sposta.
 */

const TICK_MS = 100;

function useTicker(active: boolean): void {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      setTick((value) => value + 1);
    }, TICK_MS);
    return () => {
      window.clearInterval(id);
    };
  }, [active]);
}

export interface Stopwatch {
  readonly seconds: number;
  readonly running: boolean;
  readonly start: () => void;
  readonly stop: () => void;
  readonly reset: () => void;
  readonly toggle: () => void;
}

export function useStopwatch(): Stopwatch {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const accumulated = useRef(0);
  useTicker(startedAt !== null);

  const elapsedMs = accumulated.current + (startedAt === null ? 0 : Date.now() - startedAt);

  const start = useCallback(() => {
    setStartedAt((current) => current ?? Date.now());
  }, []);

  const stop = useCallback(() => {
    setStartedAt((current) => {
      if (current !== null) accumulated.current += Date.now() - current;
      return null;
    });
  }, []);

  const reset = useCallback(() => {
    accumulated.current = 0;
    setStartedAt(null);
  }, []);

  const toggle = useCallback(() => {
    setStartedAt((current) => {
      if (current === null) return Date.now();
      accumulated.current += Date.now() - current;
      return null;
    });
  }, []);

  return { seconds: Math.floor(elapsedMs / 1000), running: startedAt !== null, start, stop, reset, toggle };
}

export interface Countdown {
  readonly remaining: number;
  readonly elapsed: number;
  readonly running: boolean;
  readonly done: boolean;
  readonly start: () => void;
  readonly pause: () => void;
  readonly reset: () => void;
  readonly skip: () => void;
}

export interface CountdownOptions {
  readonly autoStart?: boolean;
  readonly onDone?: () => void;
}

export function useCountdown(totalSeconds: number, options: CountdownOptions = {}): Countdown {
  const { autoStart = false, onDone } = options;
  const [startedAt, setStartedAt] = useState<number | null>(autoStart ? Date.now() : null);
  const [skipped, setSkipped] = useState(false);
  const accumulated = useRef(0);
  const notified = useRef(false);

  const elapsedMs = accumulated.current + (startedAt === null ? 0 : Date.now() - startedAt);
  const elapsed = Math.floor(elapsedMs / 1000);
  const remaining = skipped ? 0 : Math.max(0, totalSeconds - elapsed);
  const done = remaining === 0;

  useTicker(startedAt !== null && !done);

  useEffect(() => {
    if (!done || notified.current) return;
    notified.current = true;
    onDone?.();
  }, [done, onDone]);

  const start = useCallback(() => {
    setStartedAt((current) => current ?? Date.now());
  }, []);

  const pause = useCallback(() => {
    setStartedAt((current) => {
      if (current !== null) accumulated.current += Date.now() - current;
      return null;
    });
  }, []);

  const reset = useCallback(() => {
    accumulated.current = 0;
    notified.current = false;
    setSkipped(false);
    setStartedAt(null);
  }, []);

  const skip = useCallback(() => {
    setSkipped(true);
  }, []);

  return { remaining, elapsed, running: startedAt !== null && !done, done, start, pause, reset, skip };
}

/** mm:ss, con i minuti che possono superare 59. */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes)}:${String(seconds).padStart(2, '0')}`;
}
