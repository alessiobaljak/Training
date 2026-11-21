/**
 * R9b — Un test dopo la settimana 0 può solo far scendere.
 *
 * Specifica: training/reports/2026-11-21-training-b9-b10-m4.md, §3 (D-18:
 * sì, Alessio 2026-11-21). Con R9c un ritest non alza più nessun gradino da
 * solo, ma senza R9b non ne abbassava nemmeno uno: chi rifaceva le trazioni
 * con 5 al posto di 10 restava al gradino di prima (B17). Qui il ritest
 * propone di scendere, e la discesa la decide l'atleta con «Applica».
 *
 * Mai una salita: per salire decidono le sedute.
 */
import { CIRCUIT_SESSIONS } from '../data/circuit.ts';
import { getExercise } from '../data/exercises.ts';
import { getProgressionStep } from '../data/progressions.ts';
import { getTest } from '../data/tests.ts';
import { formatDayLong } from './dates.ts';
import { titleAtLevel } from './draft.ts';
import { rigaOtto, zavorraDopoIlCambio } from './progression.ts';
import type { RigaOtto } from './progression.ts';
import type { WeeklyVerdict } from './review.ts';
import type { ExerciseSlug, ExerciseState, LevelIndex, TestId, TestResult } from '../types/index.ts';

/** L'id della decisione su una proposta: `ritest-<data del test>:<esercizio>`. */
export function ritestDecisionId(date: string, slug: ExerciseSlug): string {
  return `ritest-${date}:${slug}`;
}

export interface PropostaRitest {
  readonly id: string;
  readonly testId: TestId;
  /** La data del test che la fa nascere. */
  readonly data: string;
  readonly verdict: WeeklyVerdict;
}

/** Le settimane dei ritest previsti dal programma. */
const SETTIMANE_DI_RITEST: ReadonlySet<number> = new Set([6, 12]);

const CAUTELA =
  'Scendere di gradino non è un passo indietro: è l’unico modo di fare le ripetizioni che il programma chiede, invece di tre mezze ripetizioni a serie.';

/**
 * «del 10 marzo», ma «dell'8 marzo», «dell'11 aprile» e «dell'1 giugno»:
 * davanti a un numero che si legge con una vocale l'articolo si elide.
 */
export function delGiorno(date: string): string {
  const [giorno = '', ...resto] = formatDayLong(date).split(' ').slice(1);
  const elide = giorno === '1' || giorno === '8' || giorno === '11';
  return `${elide ? 'dell’' : 'del '}${[giorno, ...resto].join(' ')}`;
}

/** «Test di settimana 6, sabato 11 aprile» oppure «Test del 10 marzo». */
function fonte(risultato: TestResult): string {
  if (SETTIMANE_DI_RITEST.has(risultato.week)) {
    return `Test di settimana ${String(risultato.week)}, ${formatDayLong(risultato.date)}`;
  }
  return `Test ${delGiorno(risultato.date)}`;
}

/** Dove va un esercizio con quel test: il gradino proposto, oppure `null` per «niente». */
export function gradinoR9b(livello: LevelIndex | null, valore: number, riga: RigaOtto): LevelIndex | null {
  if (livello === null) return null;
  if (valore > 0 && valore < riga.soglia && livello > riga.giu) return riga.giu;
  if (valore === 0 && livello > riga.primo) return riga.primo;
  return null;
}

/**
 * La proposta di R9b per un esercizio, oppure `null`.
 *
 * `stato` è lo stato di oggi, con R9c: salvato, o calcolato per chi non ha
 * mai fatto l'esercizio. Il test vale solo dalla settimana 1.
 */
export function propostaRitest(
  slug: ExerciseSlug,
  stato: ExerciseState,
  risultato: TestResult,
): PropostaRitest | null {
  if (risultato.week < 1) return null;
  const exercise = getExercise(slug);
  const riga = rigaOtto(exercise);
  if (riga === null || riga.testId !== risultato.testId) return null;
  const g = gradinoR9b(stato.level, risultato.value, riga);
  if (g === null || stato.level === null) return null;

  const test = getTest(risultato.testId);
  const u = test.measurement === 'seconds' ? '″' : '';
  const L = String(stato.level);
  const prescrizione = riga.blocco.prescription;
  const range =
    prescrizione.kind === 'reps' || prescrizione.kind === 'seconds'
      ? `${String(prescrizione.min)}-${String(prescrizione.max)}${u}`
      : '';
  const evidence =
    risultato.value === 0
      ? `${fonte(risultato)}: 0 al test ${test.label}. Il livello ${L} oggi è troppo alto: si riparte dal primo gradino.`
      : `${fonte(risultato)}: ${String(risultato.value)}${u} al test ${test.label}, al livello ${String(riga.livelloTest)}. Per il range di ${riga.dove} (${range}) ne servono almeno ${String(riga.soglia)}${u}: il livello ${L} oggi è troppo alto.`;
  /* R23: cambiando gradino la zavorra torna a 0, e il testo lo dice. */
  const zavorra = zavorraDopoIlCambio(exercise, stato, g);

  return {
    id: ritestDecisionId(risultato.date, slug),
    testId: risultato.testId,
    data: risultato.date,
    verdict: {
      exercise: slug,
      exerciseName: exercise.name,
      kind: 'riparti-dal-test',
      lever: 'variant',
      title: `Riparti dal livello ${String(g)}: ${getProgressionStep(riga.pattern, g).name}`,
      evidence,
      change: `Livello ${L} → ${String(g)}. Tempo e pause tornano a quelli della scheda${zavorra.clausola === null ? '' : `; ${zavorra.clausola}`}.`,
      caution: CAUTELA,
      stateBefore: stato,
      /* Sotto l'ultimo gradino la zavorra non sta (S5). */
      stateAfter: { ...stato, level: g, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0, loadKg: zavorra.loadKg },
    },
  };
}

/**
 * Le proposte ancora da decidere.
 *
 * Una proposta vale finché non arriva un risultato più recente dello stesso
 * test: qui si leggono solo gli ultimi (`tests`), quindi un test rifatto il
 * giorno dopo fa sparire quella vecchia, decisa o no. Quelle già decise
 * (`decise`, gli id del registro) non si ripropongono.
 */
export function proposteDeiRitest(
  tests: ReadonlyMap<TestId, TestResult>,
  statoDi: (slug: ExerciseSlug) => ExerciseState,
  decise: ReadonlySet<string>,
): PropostaRitest[] {
  const visti = new Set<ExerciseSlug>();
  const proposte: PropostaRitest[] = [];
  for (const session of CIRCUIT_SESSIONS) {
    for (const block of session.blocks) {
      const slug = block.exercise;
      if (visti.has(slug)) continue;
      visti.add(slug);
      const riga = rigaOtto(getExercise(slug));
      if (riga === null) continue;
      const risultato = tests.get(riga.testId);
      if (risultato === undefined) continue;
      if (decise.has(ritestDecisionId(risultato.date, slug))) continue;
      const proposta = propostaRitest(slug, statoDi(slug), risultato);
      if (proposta !== null) proposte.push(proposta);
    }
  }
  return proposte;
}

/**
 * L'esito di un ritest come lo legge la schermata dei test, al posto di
 * «parti da …» (che a un ritest prometteva gradini che R9c non dà più):
 * - «5 · sotto 8: ti propongo Liv. 1 · …», se il test fa scendere un esercizio;
 * - «9 · nessun gradino da abbassare.», altrimenti.
 * `null` quando R9b non legge questo test: lì resta il testo di sempre. Si
 * chiama solo per i test dalla settimana 1: alla settimana 0 vale R1.
 */
export function testoEsitoRitest(
  risultato: TestResult,
  statoDi: (slug: ExerciseSlug) => ExerciseState,
): string | null {
  const test = getTest(risultato.testId);
  const u = test.measurement === 'seconds' ? '″' : '';
  const massimale = `${String(risultato.value)}${u}`;
  const visti = new Set<ExerciseSlug>();
  let letto = false;
  const discese: string[] = [];
  let soglia = 0;
  for (const session of CIRCUIT_SESSIONS) {
    for (const block of session.blocks) {
      const slug = block.exercise;
      if (visti.has(slug)) continue;
      visti.add(slug);
      const exercise = getExercise(slug);
      const riga = rigaOtto(exercise);
      if (riga === null || riga.testId !== risultato.testId) continue;
      letto = true;
      const proposta = propostaRitest(slug, statoDi(slug), risultato);
      if (proposta === null) continue;
      soglia = Math.max(soglia, riga.soglia);
      discese.push(titleAtLevel(exercise, proposta.verdict.stateAfter.level));
    }
  }
  if (!letto) return null;
  if (discese.length === 0) return `${massimale} · nessun gradino da abbassare.`;
  return `${massimale} · sotto ${String(soglia)}${u}: ti propongo ${discese.join(', ')}.`;
}
