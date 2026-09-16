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
async function waitForPort(port, logPath, child, timeoutMs = 180_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await fetch(`http://127.0.0.1:${String(port)}/`);
      return;
    } catch {
      // Se il processo è già morto non c'è niente da aspettare: meglio
      // fallire subito con il suo log che tre minuti dopo con lo stesso.
      if (child !== undefined && child.exitCode !== null) break;
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
  await waitForPort(FIRESTORE_PORT, logPath, child);
  await waitForPort(AUTH_PORT, logPath, child);
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
  await button.waitFor({ state: 'visible', timeout: 30_000 });
  await button.click();

  // Si aspetta che la schermata di accesso se ne vada, non un tempo fisso:
  // con gli emulatori ancora tiepidi il giro può prendere qualche secondo, e
  // un'attesa a tempo faceva fallire la prova in modo intermittente.
  await button.waitFor({ state: 'detached', timeout: 30_000 });

  /*
   * Entrati non basta: le prime letture da Firestore arrivano dopo, e finché
   * non arrivano la Home mostra «Carico…». Chi chiama si aspetta una
   * schermata su cui poter cliccare, quindi si aspetta quella.
   */
  await page
    .waitForFunction(
      () => {
        const root = document.getElementById('root');
        return root !== null && root.innerText.trim() !== '' && !root.innerText.includes('Carico');
      },
      undefined,
      { timeout: 30_000 },
    )
    .catch(() => undefined);
  await page.waitForTimeout(300);
}

/**
 * Interroga direttamente il server degli emulatori, senza passare dal browser.
 *
 * Serve a distinguere due cose che a schermo si somigliano: un dato che sta
 * solo nella cache del telefono e un dato che è arrivato davvero su Firestore.
 *
 * La domanda attraversa tutti i rami `users/{uid}/...` in una volta, così non
 * serve sapere quale identificativo abbia preso l'utente di prova: quello
 * Firebase lo tiene in IndexedDB, e andarlo a pescare renderebbe il controllo
 * dipendente da un dettaglio interno dell'SDK.
 */
/**
 * Scrive un documento nell'emulatore, scavalcando le regole.
 *
 * Serve per costruire situazioni che l'interfaccia non sa creare: una seduta
 * datata ieri, per esempio. `name` è il percorso completo del documento, come
 * lo restituisce `readFromEmulator`.
 */
export async function writeToEmulator(parentPath, collection, documentId, fields) {
  const url =
    `http://127.0.0.1:${String(FIRESTORE_PORT)}/v1/${parentPath}/${collection}` +
    `?documentId=${documentId}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  if (!response.ok) {
    throw new Error(`Scrittura nell'emulatore fallita: ${String(response.status)}`);
  }
}

export async function readFromEmulator(collection) {
  const project = TEST_ENV.VITE_FIREBASE_PROJECT_ID;
  const url =
    `http://127.0.0.1:${String(FIRESTORE_PORT)}/v1/projects/${project}` +
    `/databases/(default)/documents:runQuery`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: { from: [{ collectionId: collection, allDescendants: true }] },
    }),
  });

  const rows = await response.json();
  return Array.isArray(rows)
    ? rows.map((row) => row.document).filter((document) => document !== undefined)
    : [];
}
