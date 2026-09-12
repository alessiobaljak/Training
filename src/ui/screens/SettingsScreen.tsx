import { useRef, useState } from 'react';
import {
  BackupError,
  backupFileName,
  exportBackup,
  importBackup,
  parseBackup,
  serializeBackup,
} from '../../db/backup.ts';
import { csvFileName, sessionsToCsv } from '../../db/csv.ts';
import { repository } from '../../db/repository.ts';
import { daysBetween, todayIso } from '../../engine/dates.ts';
import { backupAdvice, formatBytes } from '../../pwa/offline.ts';
import { downloadTextFile, readTextFile } from '../download.ts';
import { useSessions, useSettings } from '../hooks/useData.ts';
import { usePwaStatus } from '../hooks/usePwa.ts';
import { useAuthStatus } from '../hooks/useAuth.ts';
import { useSnapshots } from '../hooks/useSnapshots.ts';
import { restoreSnapshot } from '../../db/snapshots.ts';
import { ART_ATTRIBUTION } from '../../data/exercise-art.ts';
import { Button, Card, Notice, Screen, SectionTitle } from '../components/primitives.tsx';
import type { ImportMode, ImportReport } from '../../db/backup.ts';

/**
 * Installazione, stato offline, backup e ripristino.
 *
 * Il backup è l'unica via d'uscita dei dati e l'unica rete di sicurezza: senza
 * cloud e senza account, un telefono perso senza backup è tutto lo storico
 * perso. L'installazione sulla schermata Home non è un vezzo: è quello che
 * convince il sistema operativo a non cancellare il database.
 */
export function SettingsScreen() {
  const settings = useSettings();
  const sessions = useSessions();
  const pwa = usePwaStatus();
  const auth = useAuthStatus();
  const snapshots = useSnapshots();
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<ImportMode>('replace');
  const [report, setReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const today = todayIso();
  const backup = backupAdvice(
    settings?.lastBackupAt == null ? null : daysBetween(settings.lastBackupAt.slice(0, 10), today),
  );

  const handleExportBackup = (): void => {
    setError(null);
    setBusy(true);
    void exportBackup(repository)
      .then((backup) => {
        downloadTextFile(backupFileName(today), serializeBackup(backup), 'application/json');
        return repository.markBackupTaken();
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : 'Export non riuscito.');
      })
      .finally(() => {
        setBusy(false);
      });
  };

  /**
   * Ripristina una copia automatica.
   *
   * In due tempi apposta: sostituisce tutto quello che c'è adesso, ed è
   * l'unica azione di questa schermata che si può rimpiangere.
   */
  const handleRestoreSnapshot = (id: string): void => {
    setError(null);
    setReport(null);
    setBusy(true);
    void restoreSnapshot(repository, id)
      .then(setReport)
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : 'Ripristino non riuscito.');
      })
      .finally(() => {
        setBusy(false);
        setConfirmRestore(null);
      });
  };

  const handleExportCsv = (): void => {
    setError(null);
    downloadTextFile(csvFileName(today), sessionsToCsv(sessions ?? []), 'text/csv');
  };

  const handleImport = (file: File): void => {
    setError(null);
    setReport(null);
    setBusy(true);
    void readTextFile(file)
      .then((text) => importBackup(repository, parseBackup(text), mode))
      .then(setReport)
      .catch((cause: unknown) => {
        setError(
          cause instanceof BackupError
            ? cause.message
            : cause instanceof Error
              ? cause.message
              : 'Import non riuscito.',
        );
      })
      .finally(() => {
        setBusy(false);
        if (fileInput.current !== null) fileInput.current.value = '';
      });
  };

  return (
    <Screen title="App e dati" subtitle="Sincronizzati sul tuo account">
      <div className="space-y-4">
        <SectionTitle>Account</SectionTitle>
        <Card>
          <p className="text-sm font-semibold">
            {auth.account?.email ?? auth.account?.displayName ?? 'Collegato'}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-dim">
            Sedute, test e misure stanno nel tuo spazio su Firebase e seguono l’account, non il
            telefono. Cambi dispositivo, ritrovi tutto.
          </p>
          <div className="mt-3">
            <Button full variant="secondary" size="lg" onClick={auth.signOut}>
              Esci
            </Button>
          </div>
        </Card>

        <SectionTitle>Sblocco</SectionTitle>
        <Card>
          {!auth.biometricAvailable ? (
            <p className="text-sm leading-relaxed text-dim">
              Questo dispositivo non espone Face ID o impronta al browser.
            </p>
          ) : auth.biometricEnrolled ? (
            <>
              <p className="text-sm leading-relaxed text-dim">
                All’apertura l’app chiede Face ID. Vale solo su questo dispositivo: su un altro
                telefono va attivato di nuovo.
              </p>
              <div className="mt-3">
                <Button full variant="secondary" size="lg" onClick={auth.disableBiometric}>
                  Togli lo sblocco
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm leading-relaxed text-dim">
                Chiedi Face ID a ogni apertura. È una tenda, non una cassaforte: tiene fuori chi ti
                prende il telefono in mano, non chi sa usare gli strumenti da sviluppatore.
              </p>
              <div className="mt-3">
                <Button full variant="secondary" size="lg" onClick={auth.enableBiometric}>
                  Attiva lo sblocco
                </Button>
              </div>
            </>
          )}
        </Card>

        <Notice tone="warn">
          I dati sono sul tuo account, non su questo telefono, ma restano legati a un solo posto.
          Il backup scaricato è l’unica copia che controlli tu, e serve ancora.
        </Notice>

        <SectionTitle>Offline</SectionTitle>
        <Notice tone={pwa.offline.tone}>
          <p className="font-semibold">{pwa.offline.headline}</p>
          <p className="mt-1">{pwa.offline.detail}</p>
        </Notice>

        <SectionTitle>Installazione</SectionTitle>
        <Card>
          {pwa.install === 'installed' ? (
            <p className="text-sm leading-relaxed text-dim">
              L’app è già installata. È così che deve stare: a schermo pieno, senza barra del
              browser, e con i dati che il sistema non cancella per fare spazio.
            </p>
          ) : (
            <>
              <p className="text-sm leading-relaxed text-dim">
                Installala sulla schermata Home. Non è solo comodità: un sito normale può essere
                svuotato dal sistema per liberare spazio, un’app installata molto più difficilmente.
              </p>
              {pwa.install === 'prompt-available' ? (
                <div className="mt-3">
                  <Button full size="lg" onClick={pwa.askToInstall}>
                    Installa l’app
                  </Button>
                </div>
              ) : (
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-dim">
                  <li>
                    <span className="font-semibold text-ink">iPhone, Safari:</span> pulsante
                    Condividi, poi «Aggiungi a Home».
                  </li>
                  <li>
                    <span className="font-semibold text-ink">Android, Chrome:</span> menu a tre
                    punti, poi «Installa app» o «Aggiungi a schermata Home».
                  </li>
                </ul>
              )}
            </>
          )}
        </Card>

        <SectionTitle>Spazio</SectionTitle>
        {pwa.storageAdvice === null ? (
          <Card tone="muted">
            <p className="text-sm text-dim">Lettura dello spazio in corso…</p>
          </Card>
        ) : (
          <Card>
            <p className="text-sm font-semibold">{pwa.storageAdvice.headline}</p>
            <p className="mt-1 text-sm leading-relaxed text-dim">{pwa.storageAdvice.detail}</p>
            {pwa.storage !== null && pwa.storage.usageBytes !== null ? (
              <p className="mt-2 text-xs text-dim">
                Occupati: {formatBytes(pwa.storage.usageBytes)}
                {pwa.storage.quotaBytes === null
                  ? ''
                  : ` su ${formatBytes(pwa.storage.quotaBytes)} disponibili`}
              </p>
            ) : null}
            {pwa.storage?.persisted === false ? (
              <div className="mt-3">
                <Button full variant="secondary" size="lg" onClick={pwa.askForPersistence}>
                  Chiedi di proteggere i dati
                </Button>
              </div>
            ) : null}
          </Card>
        )}

        <SectionTitle>Copie automatiche</SectionTitle>
        <Card>
          <p className="text-sm leading-relaxed text-dim">
            Una copia al giorno, le ultime quattordici, tenute accanto ai dati. Servono a tornare
            indietro se qualcosa scrive un valore sbagliato: Firestore non tiene versioni, e senza
            queste il valore vecchio non esisterebbe più da nessuna parte.
          </p>

          {snapshots === undefined ? (
            <p className="mt-3 text-sm text-dim">Carico…</p>
          ) : snapshots.length === 0 ? (
            <p className="mt-3 text-sm text-dim">
              Nessuna copia ancora. La prima arriva al prossimo avvio dell’app.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {snapshots.map((snapshot) => (
                <li
                  key={snapshot.id}
                  className="rounded-2xl border border-line bg-panel px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="tabular text-sm font-semibold">{snapshot.id}</p>
                      <p className="text-xs text-dim">{formatBytes(snapshot.bytes)}</p>
                    </div>
                    {confirmRestore === snapshot.id ? null : (
                      <Button
                        variant="secondary"
                        disabled={busy}
                        onClick={() => { setConfirmRestore(snapshot.id); }}
                      >
                        Ripristina
                      </Button>
                    )}
                  </div>

                  {confirmRestore === snapshot.id ? (
                    <div className="mt-3">
                      <p className="text-sm leading-relaxed text-warn">
                        Sostituisce tutto quello che c’è adesso con i dati del {snapshot.id}.
                        Quello che hai registrato dopo quella data sparisce.
                      </p>
                      <div className="mt-3 flex gap-2">
                        <Button
                          variant="danger"
                          disabled={busy}
                          onClick={() => { handleRestoreSnapshot(snapshot.id); }}
                        >
                          Sì, torna al {snapshot.id}
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => { setConfirmRestore(null); }}
                        >
                          Annulla
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-3 text-xs leading-relaxed text-dim">
            Stanno nello stesso progetto Firebase dei dati. Proteggono da una scrittura sbagliata,
            non dalla perdita dell’account: per quella serve il file qui sotto.
          </p>
        </Card>

        <SectionTitle>Backup completo</SectionTitle>
        <Notice tone={backup.tone}>
          <p className="font-semibold">{backup.headline}</p>
          <p className="mt-1">{backup.detail}</p>
        </Notice>
        <Card>
          <p className="text-sm leading-relaxed text-dim">
            Un file JSON con tutto: sedute, test, misure, livelli e video salvati.
          </p>
          <div className="mt-3">
            <Button full size="lg" disabled={busy} onClick={handleExportBackup}>
              Scarica il backup
            </Button>
          </div>
        </Card>

        <SectionTitle>Ripristino</SectionTitle>
        <Card>
          <p className="text-sm leading-relaxed text-dim">
            Il file viene controllato per intero prima di scrivere. Se è rotto, non tocca nulla.
          </p>

          <div className="mt-3 flex gap-2">
            <Button
              variant={mode === 'replace' ? 'primary' : 'secondary'}
              onClick={() => { setMode('replace'); }}
            >
              Sostituisci
            </Button>
            <Button
              variant={mode === 'merge' ? 'primary' : 'secondary'}
              onClick={() => { setMode('merge'); }}
            >
              Unisci
            </Button>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-dim">
            {mode === 'replace'
              ? 'Sostituisci cancella quello che c’è ora e riscrive dal file. È il caso del telefono nuovo.'
              : 'Unisci sovrascrive solo le righe presenti nel file e lascia stare le altre.'}
          </p>

          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="mt-3 block w-full text-sm text-dim file:mr-3 file:min-h-12 file:rounded-xl file:border file:border-line file:bg-panel file:px-4 file:text-ink"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file !== undefined) handleImport(file);
            }}
          />
        </Card>

        {error !== null ? <Notice tone="danger">{error}</Notice> : null}

        {report !== null ? (
          <Notice>
            <p className="font-semibold">Ripristino completato.</p>
            <ul className="mt-2 space-y-1 text-xs">
              {Object.entries(report.counts).map(([table, count]) => (
                <li key={table}>
                  {table}: {count}
                </li>
              ))}
            </ul>
            {report.warnings.length > 0 ? (
              <ul className="mt-2 space-y-1 text-xs text-warn">
                {report.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            ) : null}
          </Notice>
        ) : null}

        <SectionTitle>Log in CSV</SectionTitle>
        <Card>
          <p className="text-sm leading-relaxed text-dim">
            Le stesse tredici colonne del foglio Log_Allenamenti, pronte da aprire in Excel.
          </p>
          <div className="mt-3">
            <Button full variant="secondary" size="lg" onClick={handleExportCsv}>
              Scarica il CSV
            </Button>
          </div>
        </Card>

        <SectionTitle>Crediti</SectionTitle>
        <Card tone="muted">
          {/*
            Attribuzione richiesta dalla licenza del tier gratuito di RepDB.
            Non è una cortesia: è la condizione per poter usare i disegni.
          */}
          <p className="text-sm leading-relaxed text-dim">
            {ART_ATTRIBUTION.text}{' '}
            <a
              href={ART_ATTRIBUTION.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-accent underline"
            >
              repdb.co
            </a>
            . Trentuno esercizi su trentasei; per gli altri le figure sono disegnate qui.
          </p>
        </Card>

        <SectionTitle>Programma</SectionTitle>
        <Card tone="muted">
          <p className="text-sm text-dim">
            Inizio:{' '}
            <span className="font-semibold text-ink">
              {settings?.programStartDate ?? 'non ancora impostato'}
            </span>
          </p>
        </Card>
      </div>
    </Screen>
  );
}
