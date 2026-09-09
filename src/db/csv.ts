import { LOG_CSV_COLUMNS } from '../data/reference.ts';
import { findExercise } from '../data/exercises.ts';
import { PROGRAM_SESSIONS } from '../data/program.ts';
import { summarizeExercise } from '../engine/metrics.ts';
import type { LoggedSession, SessionId } from '../types/index.ts';

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

const SESSION_NAMES: ReadonlyMap<SessionId, string> = new Map(
  PROGRAM_SESSIONS.map((session) => [session.id, session.name]),
);

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

  const ordered = [...sessions].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : a.id < b.id ? -1 : 1,
  );

  for (const session of ordered) {
    for (const logged of session.exercises) {
      const summary = summarizeExercise(logged);
      const exercise = findExercise(logged.exercise);
      rows.push([
        session.date,
        String(session.week),
        SESSION_NAMES.get(session.sessionId) ?? session.sessionId,
        exercise?.name ?? logged.exercise,
        logged.variantLabel,
        formatNumber(summary.maxLoadKg, separator),
        ...repCells(summary.sets.map((set) => set.label)),
        summary.meanRir === null ? '' : formatNumber(summary.meanRir, separator),
        String(summary.totalValue),
        logged.note ?? '',
      ]);
    }
  }

  const body = rows
    .map((row) => row.map((cell) => escapeCell(cell, separator)).join(separator))
    .join('\r\n');

  return `${withBom ? '﻿' : ''}${body}\r\n`;
}

export function csvFileName(today: string): string {
  return `shadow-log-${today}.csv`;
}
