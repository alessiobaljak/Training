import { LOG_CSV_COLUMNS } from '../data/reference.ts';
import { logRows } from '../engine/history.ts';
import type { LoggedSession } from '../types/index.ts';

/**
 * Export CSV del log, con le stesse tredici colonne del foglio
 * Log_Allenamenti: Data, Settimana, Sessione, Esercizio, Variante / Livello,
 * Zavorra (kg), Rip S1-S4, RIR medio, Rip totali, Note.
 */

export type CsvSeparator = ';' | ',';

export interface CsvOptions {
  /**
   * Il punto e virgola è il separatore che Excel in italiano si aspetta.
   * Con il punto e virgola i decimali usano la virgola, con la virgola il
   * punto: mescolarli darebbe numeri illeggibili in un caso o nell'altro.
   */
  readonly separator?: CsvSeparator;
  /** Il BOM fa aprire il file con gli accenti giusti a Excel su Windows. */
  readonly withBom?: boolean;
}

/** Colonne Rip S1-S4 del foglio originale. */
const REP_COLUMNS = 4;

function escapeCell(value: string, separator: CsvSeparator): string {
  if (!value.includes(separator) && !value.includes('"') && !/[\r\n]/.test(value)) {
    return value;
  }
  return `"${value.replaceAll('"', '""')}"`;
}

function formatNumber(value: number, separator: CsvSeparator): string {
  const text = String(Math.round(value * 100) / 100);
  return separator === ';' ? text.replace('.', ',') : text;
}

/**
 * Le serie oltre la quarta finiscono nell'ultima colonna, unite da un più.
 * Lo schema del foglio originale ha quattro colonne e aggiungerne una
 * romperebbe la compatibilità: succede solo sul cluster myo-reps del giovedì.
 */
function repCells(labels: readonly string[]): string[] {
  const cells = labels.slice(0, REP_COLUMNS - 1);
  const rest = labels.slice(REP_COLUMNS - 1);
  cells.push(rest.join('+'));
  while (cells.length < REP_COLUMNS) cells.push('');
  return cells.slice(0, REP_COLUMNS);
}

export function sessionsToCsv(
  sessions: readonly LoggedSession[],
  options: CsvOptions = {},
): string {
  const separator = options.separator ?? ';';
  const withBom = options.withBom ?? true;

  const rows: string[][] = [[...LOG_CSV_COLUMNS]];

  for (const row of logRows(sessions)) {
    rows.push([
      row.date,
      String(row.week),
      row.sessionName,
      row.exerciseName,
      row.variantLabel,
      formatNumber(row.loadKg, separator),
      ...repCells(row.setLabels),
      row.meanRir === null ? '' : formatNumber(row.meanRir, separator),
      String(row.total),
      row.note ?? '',
    ]);
  }

  const body = rows
    .map((row) => row.map((cell) => escapeCell(cell, separator)).join(separator))
    .join('\r\n');

  return `${withBom ? '﻿' : ''}${body}\r\n`;
}

export function csvFileName(today: string): string {
  return `shadow-log-${today}.csv`;
}
