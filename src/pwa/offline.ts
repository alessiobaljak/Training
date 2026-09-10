/**
 * Le regole di "quanto sei al sicuro", separate dal browser.
 *
 * Senza cloud e senza account, tutto lo storico vive in un IndexedDB che il
 * sistema operativo può cancellare per fare spazio. Queste funzioni decidono
 * cosa dire all'utente; la UI le mostra e basta.
 */

export type AdviceTone = 'good' | 'warn' | 'danger';

export interface Advice {
  readonly tone: AdviceTone;
  readonly headline: string;
  readonly detail: string;
}

export interface StorageState {
  /** Il browser ha promesso di non cancellare i dati per fare spazio. */
  readonly persisted: boolean;
  readonly usageBytes: number | null;
  readonly quotaBytes: number | null;
}

/** Dopo tanti giorni senza backup il promemoria diventa un allarme. */
export const BACKUP_STALE_DAYS = 14;
export const BACKUP_CRITICAL_DAYS = 30;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${String(Math.round(bytes))} B`;
  const units = ['kB', 'MB', 'GB'] as const;
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const label = units[unit] ?? 'GB';
  return `${value < 10 ? value.toFixed(1) : String(Math.round(value))} ${label}`;
}

export function storageAdvice(state: StorageState): Advice {
  if (state.persisted) {
    return {
      tone: 'good',
      headline: 'Archiviazione protetta',
      detail:
        'Il browser ha promesso di non cancellare i dati per fare spazio. Resta comunque tuo il backup: se cancelli l’app, spariscono lo stesso.',
    };
  }
  return {
    tone: 'warn',
    headline: 'Archiviazione non protetta',
    detail:
      'Il sistema può cancellare i dati del sito per liberare spazio, e su iPhone lo fa anche dopo qualche settimana di inattività. Installa l’app sulla schermata Home e scarica un backup.',
  };
}

/** `lastBackupAt` è la data ISO dell'ultimo export, oppure null se non ce n'è. */
export function backupAdvice(daysSinceBackup: number | null): Advice {
  if (daysSinceBackup === null) {
    return {
      tone: 'danger',
      headline: 'Nessun backup',
      detail: 'Non hai ancora scaricato nessun file. Adesso un telefono perso è tutto lo storico perso.',
    };
  }
  if (daysSinceBackup >= BACKUP_CRITICAL_DAYS) {
    return {
      tone: 'danger',
      headline: `Backup di ${String(daysSinceBackup)} giorni fa`,
      detail: 'È passato troppo tempo. Scaricane uno nuovo prima della prossima seduta.',
    };
  }
  if (daysSinceBackup >= BACKUP_STALE_DAYS) {
    return {
      tone: 'warn',
      headline: `Backup di ${String(daysSinceBackup)} giorni fa`,
      detail: 'Le sedute registrate da allora non sono in nessun file.',
    };
  }
  return {
    tone: 'good',
    headline:
      daysSinceBackup === 0 ? 'Backup di oggi' : `Backup di ${String(daysSinceBackup)} giorni fa`,
    detail: 'Sei coperto. Rifallo dopo ogni settimana di allenamento.',
  };
}

export type InstallState = 'installed' | 'prompt-available' | 'manual';

export interface InstallInput {
  /** L'app sta già girando come applicazione, senza barra del browser. */
  readonly standalone: boolean;
  /** Il browser ci ha dato il permesso di mostrare noi il pulsante Installa. */
  readonly promptAvailable: boolean;
}

/**
 * Nessun riconoscimento del sistema operativo dalla stringa del browser: si
 * guarda solo cosa il browser offre davvero. Chi non riceve il prompt legge
 * le istruzioni a mano, che valgono sia per iPhone sia per Android.
 */
export function installState(input: InstallInput): InstallState {
  if (input.standalone) return 'installed';
  return input.promptAvailable ? 'prompt-available' : 'manual';
}

export interface OfflineState {
  /** Il service worker sta servendo questa pagina. */
  readonly controlled: boolean;
  /** Il browser supporta i service worker. */
  readonly supported: boolean;
}

export function offlineAdvice(state: OfflineState): Advice {
  if (!state.supported) {
    return {
      tone: 'danger',
      headline: 'Offline non disponibile',
      detail:
        'Questo browser non supporta i service worker. In palestra senza rete l’app non si aprirà.',
    };
  }
  if (state.controlled) {
    return {
      tone: 'good',
      headline: 'Pronta offline',
      detail: 'Tutti i file sono sul telefono. Puoi allenarti in modalità aereo.',
    };
  }
  return {
    tone: 'warn',
    headline: 'Copia offline non ancora attiva',
    detail: 'Chiudi e riapri l’app una volta con la rete accesa: al secondo avvio funziona senza.',
  };
}
