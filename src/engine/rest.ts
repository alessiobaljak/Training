import type { ExerciseSlug, ProgramBlock, ProgramSession } from '../types/index.ts';
import { effectiveSets } from './schedule.ts';

/**
 * Recuperi e ordine di esecuzione.
 *
 * Il timer non deve indovinare: la struttura del blocco dice già se si tratta
 * di una superserie o di un esercizio isolato, e il piano della seduta fissa
 * l'ordine una volta sola. Il player si limita a percorrerlo.
 */

export type RestKind = 'transition' | 'round' | 'straight' | 'cluster' | 'none';

export interface RestDecision {
  readonly kind: RestKind;
  /** Durata da mettere nel conto alla rovescia. */
  readonly seconds: number;
  /**
   * Estremo superiore quando la scheda dà un intervallo, come i 15-20" tra i
   * due esercizi di una coppia. Uguale a `seconds` quando è un valore secco.
   */
  readonly maxSeconds: number;
  readonly label: string;
  readonly hint: string;
}

export const NO_REST: RestDecision = Object.freeze({
  kind: 'none',
  seconds: 0,
  maxSeconds: 0,
  label: 'Nessun recupero',
  hint: 'Passa al blocco successivo.',
});

export type StepKind = 'work' | 'activation' | 'mini-set';

export interface SessionStep {
  /** Ordine di esecuzione nella seduta, a partire da 1. */
  readonly order: number;
  readonly blockCode: string;
  readonly group: string;
  readonly exercise: ExerciseSlug;
  readonly kind: StepKind;
  /** Numero della serie dentro il blocco, a partire da 1. */
  readonly setIndex: number;
  readonly totalSets: number;
  /** Giro della superserie. `null` sugli esercizi isolati. */
  readonly round: number | null;
  /** Cosa fare dopo aver chiuso questa serie. */
  readonly rest: RestDecision;
}

function transitionRest(toBlock: ProgramBlock): RestDecision {
  const rest = toBlock.rest;
  if (rest.kind !== 'superset') return NO_REST;
  return {
    kind: 'transition',
    seconds: rest.transitionMinSec,
    maxSeconds: rest.transitionMaxSec,
    label: `Passa a ${toBlock.code}`,
    hint: 'Solo il tempo di spostarti. Non è un recupero.',
  };
}

function roundRest(block: ProgramBlock): RestDecision {
  const rest = block.rest;
  if (rest.kind !== 'superset') return NO_REST;
  return {
    kind: 'round',
    seconds: rest.roundRestSec,
    maxSeconds: rest.roundRestSec,
    label: 'Recupero prima del giro successivo',
    hint: 'Qui recuperi davvero: il giro seguente parte da fermo.',
  };
}

function straightRest(block: ProgramBlock): RestDecision {
  const rest = block.rest;
  if (rest.kind === 'straight') {
    return {
      kind: 'straight',
      seconds: rest.restSec,
      maxSeconds: rest.restSec,
      label: 'Recupero tra le serie',
      hint: 'Esercizio isolato: il tempo indicato è tra una serie e l’altra.',
    };
  }
  if (rest.kind === 'cluster') {
    return {
      kind: 'cluster',
      seconds: rest.restSec,
      maxSeconds: rest.restSec,
      label: 'Pausa tra le mini-serie',
      hint: 'Cluster: pausa corta, la serie non è finita.',
    };
  }
  return NO_REST;
}

/* -------------------------------------------------------------------------- */
/* Piano della seduta                                                          */
/* -------------------------------------------------------------------------- */

interface Pending {
  readonly blocks: readonly ProgramBlock[];
  readonly setsByBlock: ReadonlyMap<string, number>;
}

function groupBlocks(session: ProgramSession, week: number): Pending[] {
  const groups: Pending[] = [];
  const seen = new Set<string>();

  for (const block of session.blocks) {
    if (seen.has(block.group)) continue;
    seen.add(block.group);
    const blocks = session.blocks.filter((candidate) => candidate.group === block.group);
    const setsByBlock = new Map(
      blocks.map((candidate) => [candidate.code, effectiveSets(candidate.sets, week)]),
    );
    groups.push({ blocks, setsByBlock });
  }

  return groups;
}

/**
 * Ordine completo delle serie di una seduta, con il recupero da usare dopo
 * ciascuna.
 *
 * Le coppie si alternano a giri: A1 serie 1, 15-20", A2 serie 1, recupero
 * lungo, A1 serie 2, e così via. Quando i due esercizi hanno un numero di
 * serie diverso, i giri in eccesso si eseguono da soli e usano comunque il
 * recupero lungo del blocco.
 *
 * Il cluster myo-reps diventa una serie di attivazione seguita dalle
 * mini-serie, ciascuna con la propria pausa corta.
 */
export function buildSessionPlan(session: ProgramSession, week: number): SessionStep[] {
  const steps: SessionStep[] = [];
  const groups = groupBlocks(session, week);
  let order = 0;

  groups.forEach((group) => {
    const paired = group.blocks.length > 1 && group.blocks.every((b) => b.pairing === 'superset');

    if (!paired) {
      const block = group.blocks[0];
      if (block === undefined) return;

      if (block.prescription.kind === 'myo-reps') {
        const { miniSets } = block.prescription;
        const total = miniSets + 1;
        for (let index = 0; index < total; index += 1) {
          const isLastStep = index === total - 1;
          order += 1;
          steps.push({
            order,
            blockCode: block.code,
            group: block.group,
            exercise: block.exercise,
            kind: index === 0 ? 'activation' : 'mini-set',
            setIndex: index + 1,
            totalSets: total,
            round: null,
            rest: isLastStep ? NO_REST : straightRest(block),
          });
        }
        return;
      }

      const sets = group.setsByBlock.get(block.code) ?? block.sets;
      for (let setIndex = 1; setIndex <= sets; setIndex += 1) {
        const isLastSet = setIndex === sets;
        order += 1;
        steps.push({
          order,
          blockCode: block.code,
          group: block.group,
          exercise: block.exercise,
          kind: 'work',
          setIndex,
          totalSets: sets,
          round: null,
          rest: isLastSet ? NO_REST : straightRest(block),
        });
      }
      return;
    }

    const rounds = Math.max(
      ...group.blocks.map((block) => group.setsByBlock.get(block.code) ?? block.sets),
    );

    for (let round = 1; round <= rounds; round += 1) {
      const inRound = group.blocks.filter(
        (block) => round <= (group.setsByBlock.get(block.code) ?? block.sets),
      );
      inRound.forEach((block, indexInRound) => {
        const isLastInRound = indexInRound === inRound.length - 1;
        const isLastRound = round === rounds;
        const nextInRound = inRound[indexInRound + 1];

        const rest = !isLastInRound && nextInRound !== undefined
          ? transitionRest(nextInRound)
          : isLastRound
            ? NO_REST
            : roundRest(block);

        order += 1;
        steps.push({
          order,
          blockCode: block.code,
          group: block.group,
          exercise: block.exercise,
          kind: 'work',
          setIndex: round,
          totalSets: group.setsByBlock.get(block.code) ?? block.sets,
          round,
          rest,
        });
      });
    }
  });

  return steps;
}

/** Numero di serie da eseguire in una seduta, scarico compreso. */
export function totalWorkSets(session: ProgramSession, week: number): number {
  return session.blocks.reduce((sum, block) => sum + effectiveSets(block.sets, week), 0);
}
