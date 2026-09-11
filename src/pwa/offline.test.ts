import { describe, expect, it } from 'vitest';
import {
  BACKUP_CRITICAL_DAYS,
  BACKUP_STALE_DAYS,
  backupAdvice,
  formatBytes,
  installState,
  offlineAdvice,
  storageAdvice,
} from './offline.ts';

describe('formatBytes', () => {
  it('sotto il kilobyte resta in byte', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1023)).toBe('1023 B');
  });

  it('sale di unità e tiene un decimale finché il numero è piccolo', () => {
    expect(formatBytes(1024)).toBe('1.0 kB');
    expect(formatBytes(1536)).toBe('1.5 kB');
    expect(formatBytes(1024 * 20)).toBe('20 kB');
    expect(formatBytes(1024 * 1024 * 3.5)).toBe('3.5 MB');
    expect(formatBytes(1024 * 1024 * 1024 * 2)).toBe('2.0 GB');
  });

  it('non va oltre i gigabyte', () => {
    expect(formatBytes(1024 ** 4)).toBe('1024 GB');
  });
});

describe('storageAdvice', () => {
  it('con archiviazione persistente rassicura ma non toglie il backup', () => {
    const advice = storageAdvice({ persisted: true, usageBytes: 1000, quotaBytes: 2000 });
    expect(advice.tone).toBe('good');
    expect(advice.detail).toContain('backup');
  });

  it('senza archiviazione persistente avverte e dice cosa fare', () => {
    const advice = storageAdvice({ persisted: false, usageBytes: null, quotaBytes: null });
    expect(advice.tone).toBe('warn');
    expect(advice.detail).toContain('Home');
  });
});

describe('backupAdvice', () => {
  it('nessun backup è la condizione peggiore', () => {
    expect(backupAdvice(null).tone).toBe('danger');
  });

  it('le soglie sono larghe: il file copre un rischio raro, non quotidiano', () => {
    // Un avviso che grida ogni due settimane per un caso raro smette di essere
    // letto, e quando servirà davvero non lo guarderà più nessuno.
    expect(BACKUP_STALE_DAYS).toBeGreaterThanOrEqual(30);
    expect(BACKUP_CRITICAL_DAYS).toBeGreaterThan(BACKUP_STALE_DAYS);
  });

  it('un backup di oggi è sicuro', () => {
    const advice = backupAdvice(0);
    expect(advice.tone).toBe('good');
    expect(advice.headline).toBe('Backup di oggi');
  });

  it('cambia tono esattamente sulle soglie', () => {
    expect(backupAdvice(BACKUP_STALE_DAYS - 1).tone).toBe('good');
    expect(backupAdvice(BACKUP_STALE_DAYS).tone).toBe('warn');
    expect(backupAdvice(BACKUP_CRITICAL_DAYS - 1).tone).toBe('warn');
    expect(backupAdvice(BACKUP_CRITICAL_DAYS).tone).toBe('danger');
  });

  it('riporta i giorni nel titolo', () => {
    expect(backupAdvice(9).headline).toContain('9');
  });
});

describe('installState', () => {
  it('già installata vince su tutto', () => {
    expect(installState({ standalone: true, promptAvailable: true })).toBe('installed');
    expect(installState({ standalone: true, promptAvailable: false })).toBe('installed');
  });

  it('con il prompt disponibile si mostra il pulsante', () => {
    expect(installState({ standalone: false, promptAvailable: true })).toBe('prompt-available');
  });

  it('senza prompt restano le istruzioni a mano', () => {
    expect(installState({ standalone: false, promptAvailable: false })).toBe('manual');
  });
});

describe('offlineAdvice', () => {
  it('un browser senza service worker è un problema, non un avviso', () => {
    const advice = offlineAdvice({ supported: false, controlled: true });
    expect(advice.tone).toBe('danger');
  });

  it('service worker attivo significa pronta per la palestra', () => {
    expect(offlineAdvice({ supported: true, controlled: true }).tone).toBe('good');
  });

  it('supportato ma non ancora al comando chiede un secondo avvio', () => {
    const advice = offlineAdvice({ supported: true, controlled: false });
    expect(advice.tone).toBe('warn');
    expect(advice.detail).toContain('riapri');
  });
});
