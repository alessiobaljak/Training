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
import { todayIso } from '../../engine/dates.ts';
import { downloadTextFile, readTextFile } from '../download.ts';
import { useSessions, useSettings } from '../hooks/useData.ts';
import { Button, Card, Notice, Screen, SectionTitle } from '../components/primitives.tsx';
import type { ImportMode, ImportReport } from '../../db/backup.ts';

/**
 * Backup e ripristino.
 *
 * È l'unica via d'uscita dei dati e l'unica rete di sicurezza: senza cloud e
 * senza account, un telefono perso senza backup è tutto lo storico perso.
 */
export function SettingsScreen() {
  const settings = useSettings();
  const sessions = useSessions();
  const fileInput = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<ImportMode>('replace');
  const [report, setReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const today = todayIso();

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
    <Screen title="Dati e backup" subtitle="Tutto resta su questo telefono">
      <div className="space-y-4">
        <Notice tone="warn">
          Non c’è nessun cloud e nessun account. Se perdi il telefono o cancelli i dati del sito,
          lo storico sparisce. Il backup è manuale ed è l’unica copia che avrai.
        </Notice>

        <SectionTitle>Backup completo</SectionTitle>
        <Card>
          <p className="text-sm leading-relaxed text-dim">
            Un file JSON con tutto: sedute, test, misure, livelli e video salvati.
          </p>
          <p className="mt-2 text-xs text-dim">
            {settings?.lastBackupAt == null
              ? 'Non ne hai ancora fatto uno.'
              : `Ultimo backup: ${settings.lastBackupAt.slice(0, 10)}`}
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
