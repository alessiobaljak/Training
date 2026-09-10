/**
 * Segnali di fine timer.
 *
 * La vibrazione non esiste su iOS Safari, quindi da sola non basta: il beep
 * via WebAudio è la parte che funziona su entrambi. Nessuno dei due deve mai
 * sollevare un errore, perché il timer deve continuare a funzionare anche in
 * un browser che li blocca.
 */

let audioContext: AudioContext | null = null;

type AudioContextConstructor = new () => AudioContext;

function getAudioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === 'undefined') return null;
  const candidate = (window as unknown as { AudioContext?: AudioContextConstructor }).AudioContext;
  return candidate ?? null;
}

/**
 * Da chiamare dentro un gesto dell'utente, per esempio il tap su "Inizia".
 * Su iOS il contesto audio nasce sospeso e solo un gesto può risvegliarlo.
 */
export function primeAudio(): void {
  try {
    const Constructor = getAudioContextConstructor();
    if (Constructor === null) return;
    audioContext ??= new Constructor();
    if (audioContext.state === 'suspended') void audioContext.resume();
  } catch {
    audioContext = null;
  }
}

export type BeepKind = 'tick' | 'done';

export function beep(kind: BeepKind = 'done'): void {
  try {
    const Constructor = getAudioContextConstructor();
    if (Constructor === null) return;
    audioContext ??= new Constructor();
    if (audioContext.state === 'suspended') void audioContext.resume();

    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = kind === 'done' ? 880 : 620;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === 'done' ? 0.45 : 0.12));
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + (kind === 'done' ? 0.5 : 0.15));
  } catch {
    /* Un browser che blocca l'audio non deve fermare il timer. */
  }
}

export function vibrate(pattern: number | readonly number[]): void {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    if (typeof pattern === 'number') navigator.vibrate(pattern);
    else navigator.vibrate([...pattern]);
  } catch {
    /* iOS non la supporta: il beep resta. */
  }
}

/** Segnale di fine recupero: vibrazione dove c'è, beep sempre. */
export function signalRestOver(): void {
  vibrate([200, 100, 200]);
  beep('done');
}
