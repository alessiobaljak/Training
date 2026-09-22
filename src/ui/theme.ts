/**
 * Tema chiaro o scuro.
 *
 * La preferenza sta in `localStorage` e non nell'account: il tema è una
 * proprietà del posto in cui stai guardando lo schermo, non di chi sei. Lo
 * stesso account usa il telefono sotto i neon della palestra e il portatile
 * la sera, e non è detto che li voglia uguali.
 *
 * Si applica prima che React disegni, altrimenti si vede un lampo del tema
 * sbagliato a ogni avvio.
 */

export type ThemeChoice = 'chiaro' | 'scuro' | 'sistema';

export const THEME_CHOICES: readonly ThemeChoice[] = Object.freeze([
  'chiaro',
  'scuro',
  'sistema',
] as const);

export const THEME_LABELS: Readonly<Record<ThemeChoice, string>> = Object.freeze({
  chiaro: 'Chiaro',
  scuro: 'Scuro',
  sistema: 'Come il telefono',
});

const STORAGE_KEY = 'shadow:tema';
const DEFAULT_CHOICE: ThemeChoice = 'chiaro';

/** Colore della barra di stato, uguale al fondo di ciascun tema. */
const THEME_COLOR: Readonly<Record<'light' | 'dark', string>> = Object.freeze({
  light: '#f2f5f9',
  dark: '#0b0f14',
});

export function isThemeChoice(value: unknown): value is ThemeChoice {
  return typeof value === 'string' && (THEME_CHOICES as readonly string[]).includes(value);
}

/**
 * La scelta salvata.
 *
 * `localStorage` può lanciare — navigazione privata, cookie di terze parti
 * bloccati dentro un iframe — e un tema non è un buon motivo per non far
 * partire l'app.
 */
export function readThemeChoice(): ThemeChoice {
  try {
    const saved: unknown = window.localStorage.getItem(STORAGE_KEY);
    return isThemeChoice(saved) ? saved : DEFAULT_CHOICE;
  } catch {
    return DEFAULT_CHOICE;
  }
}

/** Cosa si vede davvero: `sistema` guarda la preferenza del telefono. */
export function resolveTheme(choice: ThemeChoice): 'light' | 'dark' {
  if (choice !== 'sistema') return choice === 'scuro' ? 'dark' : 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function paint(theme: 'light' | 'dark'): void {
  /*
   * Il chiaro non mette nessun attributo: è il tema che il CSS dichiara da
   * solo. Così una pagina servita prima che questo codice giri — un errore in
   * avvio, la schermata di emergenza — nasce comunque nel tema giusto.
   */
  if (theme === 'dark') document.documentElement.dataset['theme'] = 'dark';
  else delete document.documentElement.dataset['theme'];

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta !== null) meta.setAttribute('content', THEME_COLOR[theme]);
}

let stopWatching: (() => void) | null = null;

/**
 * Applica una scelta e, quando è `sistema`, resta in ascolto: il telefono può
 * passare al buio da solo all'ora del tramonto mentre l'app è aperta.
 */
export function applyTheme(choice: ThemeChoice): void {
  stopWatching?.();
  stopWatching = null;

  paint(resolveTheme(choice));

  if (choice !== 'sistema') return;
  const query = window.matchMedia('(prefers-color-scheme: dark)');
  const onChange = (): void => { paint(resolveTheme('sistema')); };
  query.addEventListener('change', onChange);
  stopWatching = () => { query.removeEventListener('change', onChange); };
}

export function saveThemeChoice(choice: ThemeChoice): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    /* Senza memoria la scelta vale per questa sessione: meglio di un errore. */
  }
  applyTheme(choice);
}

/** Da chiamare una volta in avvio, prima che React disegni. */
export function startTheme(): void {
  applyTheme(readThemeChoice());
}
