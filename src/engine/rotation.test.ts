import { describe, expect, it } from 'vitest';
import {
  IN_A_ROW_WARNING,
  lastCompletedCircuit,
  OVERLAP_DAYS,
  rotationState,
  sessionAfter,
  sharedMuscles,
  trainingDaysInARow,
} from './rotation.ts';
import { CIRCUIT_SESSIONS, findCircuitSession } from '../data/circuit.ts';
import type { LoggedSession, SessionId, SessionStatus } from '../types/index.ts';

const seduta = (
  sessionId: SessionId,
  date: string,
  status: SessionStatus = 'completed',
): LoggedSession => ({
  id: `${sessionId}-${date}`,
  date,
  week: 1,
  sessionId,
  status,
  exercises: [],
  note: null,
});

describe('sessionAfter — la rotazione gira in tondo', () => {
  it('passa alla successiva', () => {
    expect(sessionAfter('circuito-1')).toBe('circuito-2');
    expect(sessionAfter('circuito-3')).toBe('circuito-4');
  });

  it('dopo l’ultima torna alla prima', () => {
    expect(sessionAfter('circuito-4')).toBe('circuito-1');
  });
});

describe('lastCompletedCircuit — l’ultima chiusa del programma attivo', () => {
  it('prende la più recente, che è l’ultima della lista ordinata', () => {
    const diario = [
      seduta('circuito-1', '2026-11-02'),
      seduta('circuito-2', '2026-11-04'),
    ];
    expect(lastCompletedCircuit(diario)?.sessionId).toBe('circuito-2');
  });

  it('ignora le sedute lasciate aperte', () => {
    const diario = [
      seduta('circuito-1', '2026-11-02'),
      seduta('circuito-2', '2026-11-04', 'in-progress'),
    ];
    expect(lastCompletedCircuit(diario)?.sessionId).toBe('circuito-1');
  });

  it('ignora lo storico dello Shadow', () => {
    /*
     * Lo Shadow è archiviato: le sue sedute restano nel diario e devono
     * restarci, ma non fanno parte di questa rotazione. Se contassero, la
     * prima seduta dopo il passaggio al circuito partirebbe da un id che la
     * rotazione non conosce.
     */
    const diario = [
      seduta('circuito-2', '2026-11-02'),
      seduta('upper-b', '2026-11-05'),
    ];
    expect(lastCompletedCircuit(diario)?.sessionId).toBe('circuito-2');
  });

  it('su un diario vuoto non trova niente', () => {
    expect(lastCompletedCircuit([])).toBeNull();
  });
});

describe('trainingDaysInARow — letto dal diario, non dal calendario', () => {
  it('conta i giorni consecutivi che finiscono oggi', () => {
    const diario = [
      seduta('circuito-1', '2026-11-05'),
      seduta('circuito-2', '2026-11-06'),
      seduta('circuito-3', '2026-11-07'),
    ];
    expect(trainingDaysInARow('2026-11-07', diario)).toBe(3);
  });

  it('un buco interrompe la catena', () => {
    const diario = [
      seduta('circuito-1', '2026-11-04'),
      seduta('circuito-3', '2026-11-07'),
    ];
    expect(trainingDaysInARow('2026-11-07', diario)).toBe(1);
  });

  it('è zero nei giorni in cui non risulta niente', () => {
    expect(trainingDaysInARow('2026-11-07', [seduta('circuito-1', '2026-11-05')])).toBe(0);
  });
});

describe('sharedMuscles — cosa si ripete tra due sedute', () => {
  it('trova i gruppi caricati in via diretta da tutte e due', () => {
    const uno = CIRCUIT_SESSIONS[0];
    const due = CIRCUIT_SESSIONS[1];
    if (uno === undefined || due === undefined) throw new Error('Sedute mancanti.');
    const comuni = sharedMuscles(uno, due);
    /* Il blocco braccia c'è in tutte e quattro: le braccia si ripetono sempre. */
    expect(comuni).toContain('braccia');
  });

  it('una seduta con sé stessa ripete tutto', () => {
    const uno = CIRCUIT_SESSIONS[0];
    if (uno === undefined) throw new Error('Seduta mancante.');
    expect(sharedMuscles(uno, uno).length).toBeGreaterThan(3);
  });
});

describe('rotationState — quello che la Home mostra', () => {
  it('su un diario vuoto propone la prima e non avvisa di niente', () => {
    const stato = rotationState('2026-11-08', []);
    expect(stato.next).toBe('circuito-1');
    expect(stato.last).toBeNull();
    expect(stato.daysSince).toBeNull();
    expect(stato.repeatedMuscles).toEqual([]);
    expect(stato.inARow).toBe(0);
  });

  it('propone la successiva all’ultima chiusa', () => {
    const stato = rotationState('2026-11-08', [seduta('circuito-2', '2026-11-06')]);
    expect(stato.next).toBe('circuito-3');
    expect(stato.daysSince).toBe(2);
  });

  it('avvisa dei muscoli ripetuti solo quando l’ultima è di ieri o di oggi', () => {
    /*
     * A due giorni di distanza non è più una sovrapposizione: è la settimana
     * normale di chiunque. Avvisare lì vorrebbe dire avvisare sempre, e un
     * avviso che compare sempre non lo legge più nessuno.
     */
    const ieri = rotationState('2026-11-08', [seduta('circuito-1', '2026-11-07')]);
    expect(ieri.daysSince).toBe(OVERLAP_DAYS);
    expect(ieri.repeatedMuscles).toContain('braccia');

    const prima = rotationState('2026-11-08', [seduta('circuito-1', '2026-11-05')]);
    expect(prima.repeatedMuscles).toEqual([]);
  });

  it('conta i giorni di fila fino alla soglia dell’avviso', () => {
    const diario = [
      seduta('circuito-1', '2026-11-06'),
      seduta('circuito-2', '2026-11-07'),
      seduta('circuito-3', '2026-11-08'),
    ];
    const stato = rotationState('2026-11-08', diario);
    expect(stato.inARow).toBe(IN_A_ROW_WARNING);
    expect(stato.next).toBe('circuito-4');
  });

  it('dopo l’ultima seduta riparte dalla prima', () => {
    const stato = rotationState('2026-11-08', [seduta('circuito-4', '2026-11-07')]);
    expect(stato.next).toBe('circuito-1');
    expect(findCircuitSession(stato.next)?.name).toBe('Seduta 1');
  });

  it('dopo una seduta archiviata dello Shadow propone comunque la prima', () => {
    const stato = rotationState('2026-11-08', [seduta('lower-b', '2026-11-07')]);
    expect(stato.next).toBe('circuito-1');
  });
});
