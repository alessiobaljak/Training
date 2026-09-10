/**
 * Ambiente per le prove sul browser: emulatori Firebase, mai il progetto vero.
 *
 * L'id di progetto comincia con `demo-`: è la convenzione che dice agli
 * emulatori di funzionare senza credenziali e di non contattare Google. Le
 * chiavi qui sotto sono finte e non aprono niente.
 */
import { spawn, spawnSync } from 'node:child_process';
import { openSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const AUTH_PORT = 9099;
export const FIRESTORE_PORT = 8080;

export const TEST_ENV = {
  VITE_FIREBASE_API_KEY: 'demo-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'demo-shadow.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'demo-shadow',
  VITE_FIREBASE_STORAGE_BUCKET: 'demo-shadow.appspot.com',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
  VITE_FIREBASE_APP_ID: '1:000000000000:web:0000000000000000000000',
  VITE_FIREBASE_EMULATOR_HOST: '127.0.0.1',
};

/** Compila puntando agli emulatori. */
export function buildForTests() {
  const result = spawnSync('npx', ['vite', 'build'], {
    env: { ...process.env, ...TEST_ENV },
    stdio: 'inherit',
  });
  if (result.status !== 0) throw new Error('Build fallito.');
}

/*
 * Il primo avvio su una macchina pulita scarica un jar da un centinaio di
 * megabyte prima di poter fare qualunque cosa. Tre minuti sono il tempo di
 * quel download su un runner lento, non un margine di sicurezza.
 */
async function waitForPort(port, logPath, timeoutMs = 180_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await fetch(`http://127.0.0.1:${String(port)}/`);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }

  // Senza questo il messaggio è «non è partito» e basta, che non dice se il
  // problema è il download, la porta occupata o Java che manca.
  let tail = '(nessun log)';
  try {
    tail = readFileSync(logPath, 'utf8').split('\n').slice(-25).join('\n');
  } catch {
    /* il log può non esistere se il processo è morto subito */
  }
  throw new Error(
    `Emulatore non partito sulla porta ${String(port)} entro ${String(Math.round(timeoutMs / 1000))}s.\n` +
      `Ultime righe del log:\n${tail}`,
  );
}

export async function startEmulators() {
  const logPath = join(tmpdir(), `shadow-emulatori-${String(process.pid)}.log`);
  const log = openSync(logPath, 'w');

  const child = spawn(
    'npx',
    [
      'firebase',
      'emulators:start',
      '--only',
      'auth,firestore',
      '--project',
      TEST_ENV.VITE_FIREBASE_PROJECT_ID,
    ],
    // Gruppo di processi a sé: gli emulatori avviano un Java figlio, e
    // ucciderne solo il padre lo lascerebbe vivo, attaccato alle porte, a far
    // fallire la prova successiva con un messaggio che non c'entra niente.
    { stdio: ['ignore', log, log], detached: true },
  );
  await waitForPort(FIRESTORE_PORT, logPath);
  await waitForPort(AUTH_PORT, logPath);
  return child;
}

/** Ferma un processo e tutto quello che ha avviato. */
export function stopGroup(child) {
  if (child === undefined || child.pid === undefined) return;
  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch {
    child.kill('SIGTERM');
  }
}

/**
 * Entra con l'account di prova.
 *
 * Il pulsante è lo stesso della produzione: con gli emulatori attivi il
 * codice dietro presenta un token non firmato invece di aprire Google.
 */
export async function signInForTests(page) {
  const button = page.getByRole('button', { name: 'Continua con Google' });
  await button.waitFor({ state: 'visible', timeout: 20_000 });
  await button.click();
  await page.waitForTimeout(2500);
}
