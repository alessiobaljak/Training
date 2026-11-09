import { describe, expect, it } from 'vitest';
import { CIRCUIT_SESSIONS } from '../data/circuit.ts';
import {
  RAMP_MAX_SEC,
  RAMP_MIN_SEC,
  WARMUP_TO_WORK_SEC,
  blockRestSeconds,
  buildGuidedPlan,
  clockOffsets,
  estimatedSeconds,
  minWorkSeconds,
  stepSeconds,
  workStepCount,
} from './circuit.ts';
import type { GuidedStep } from './circuit.ts';
import type { ProgramBlock, RestPrescription } from '../types/index.ts';

const SUPERSET: RestPrescription = {
  kind: 'superset',
  transitionMinSec: 30,
  transitionMaxSec: 30,
  roundRestSec: 45,
  blockRestSec: 90,
};

const blocco = (patch: Partial<ProgramBlock> = {}): ProgramBlock => ({
  code: 'A1',
  group: 'A',
  pairing: 'superset',
  exercise: 'push-up',
  sets: 3,
  prescription: { kind: 'reps', min: 8, max: 12 },
  reference: 'prova',
  tut: '3-0-1-0',
  rir: '1-2',
  rest: SUPERSET,
  perSide: false,
  ...patch,
});

describe('minWorkSeconds — la durata minima di una serie', () => {
  it('la ricava dal tempo prescritto e dal minimo del range', () => {
    /* 3-0-1-0 sono 4 secondi a ripetizione, per 8 ripetizioni: 32. */
    expect(minWorkSeconds(blocco())).toBe(32);
  });

  it('la raddoppia sugli esercizi per lato', () => {
    /* Il passo copre tutti e due i lati: la serie dura il doppio. */
    expect(minWorkSeconds(blocco({ perSide: true }))).toBe(64);
  });

  it('preferisce il valore dichiarato dalla scheda, e non lo raddoppia', () => {
    expect(minWorkSeconds(blocco({ workSeconds: 30 }))).toBe(30);
    /*
     * Un `workSeconds` dichiarato è il tempo dell'intera stazione, lati
     * compresi: è come la colonna «lavoro» della scheda scrive i suoi numeri
     * («bulgaro 8-10 per gamba, ~100"» sono cinquanta secondi per gamba).
     *
     * Prima questa riga si aspettava 60 e il codice obbediva: il player
     * chiedeva 200 secondi di countdown sul bulgaro e l'orologio della seduta
     * sforava di otto minuti su quaranta. Il test confermava il raddoppio
     * perché era stato scritto guardando il codice invece della scheda.
     */
    expect(minWorkSeconds(blocco({ workSeconds: 30, perSide: true }))).toBe(30);
  });

  it('segue la lateralità del gradino eseguito, non solo quella del blocco', () => {
    /*
     * La scala `hip-thrust` è `[false, false, true, true, true, true]`: chi
     * sale al gradino 3 fa un esercizio monopodalico dentro un blocco che si
     * dichiara bilaterale, e la stazione dura il doppio.
     *
     * Prima il `perSide` eseguito arrivava qui sovrascrivendo quello del
     * blocco, e con un `workSeconds` dichiarato — che hanno tutti e 52 i
     * blocchi — non aveva nessun effetto: il countdown restava 85 secondi su
     * 170 di lavoro vero. L'atleta leggeva «almeno 85"» e si fermava a metà
     * della seconda gamba con il tempo rispettato.
     */
    const bilaterale = blocco({ workSeconds: 85, perSide: false });
    expect(minWorkSeconds(bilaterale, undefined, false)).toBe(85);
    expect(minWorkSeconds(bilaterale, undefined, true)).toBe(170);

    /* E nel verso opposto: un blocco per lato eseguito a due arti dimezza. */
    const perLato = blocco({ workSeconds: 100, perSide: true });
    expect(minWorkSeconds(perLato, undefined, true)).toBe(100);
    expect(minWorkSeconds(perLato, undefined, false)).toBe(50);
  });

  it('usa il minimo del range sulle stazioni a tempo', () => {
    const stazione = blocco({
      exercise: 'hollow-hold',
      prescription: { kind: 'seconds', min: 30, max: 45 },
      tut: 'isometrico',
    });
    expect(minWorkSeconds(stazione)).toBe(30);
  });

  it('restituisce zero quando non è calcolabile, e allora il player cronometra', () => {
    /*
     * «controllato» non è un numero, e un massimale a cedimento non ha un
     * minimo: in questi casi non c'è nessun tempo da rispettare, si tiene
     * finché si tiene. Lo zero è il segnale che il player deve mostrare un
     * cronometro in salita invece di un conto alla rovescia.
     */
    expect(minWorkSeconds(blocco({ tut: 'controllato' }))).toBe(0);
    expect(
      minWorkSeconds(blocco({ exercise: 'dead-hang', prescription: { kind: 'max' }, tut: 'isometrico' })),
    ).toBe(0);
  });
});

describe('blockRestSeconds — la pausa dopo l’ultimo giro', () => {
  it('preferisce la pausa di blocco al recupero di giro', () => {
    expect(blockRestSeconds(blocco())).toBe(90);
  });

  it('ricade sul recupero di giro quando la pausa di blocco non è dichiarata', () => {
    const senza: RestPrescription = {
      kind: 'superset',
      transitionMinSec: 15,
      transitionMaxSec: 20,
      roundRestSec: 90,
    };
    expect(blockRestSeconds(blocco({ rest: senza }))).toBe(90);
  });

  it('su una stazione isolata è il recupero tra le serie', () => {
    expect(blockRestSeconds(blocco({ rest: { kind: 'straight', restSec: 30 } }))).toBe(30);
  });
});

describe('buildGuidedPlan — la sequenza della seduta', () => {
  const seduta = CIRCUIT_SESSIONS[0];
  if (seduta === undefined) throw new Error('Nessuna seduta a circuito.');
  const plan = buildGuidedPlan(seduta, 1);

  it('comincia dal riscaldamento e finisce con una serie', () => {
    expect(plan[0]?.kind).toBe('warmup');
    expect(plan.at(-1)?.kind).toBe('work');
  });

  it('non mette mai due recuperi di fila', () => {
    for (let i = 0; i < plan.length - 1; i += 1) {
      const uno = plan[i];
      const due = plan[i + 1];
      expect(uno?.kind === 'rest' && due?.kind === 'rest', `passi ${String(i)}-${String(i + 1)}`).toBe(
        false,
      );
    }
  });

  it('separa il riscaldamento dal lavoro con la pausa dichiarata', () => {
    /* `findLastIndex` non c'è nella libreria di destinazione: si cerca a ritroso. */
    let ultimoRiscaldamento = -1;
    for (let i = plan.length - 1; i >= 0; i -= 1) {
      if (plan[i]?.kind === 'warmup') {
        ultimoRiscaldamento = i;
        break;
      }
    }
    const dopo = plan[ultimoRiscaldamento + 1];
    expect(dopo?.kind).toBe('rest');
    if (dopo?.kind === 'rest') {
      expect(dopo.seconds).toBe(WARMUP_TO_WORK_SEC);
      expect(dopo.tier).toBe('blocco');
    }
  });

  it('usa la pausa di blocco quando cambia gruppo, non il recupero di giro', () => {
    /*
     * È la ragione per cui questo piano esiste invece di usare direttamente
     * `buildSessionPlan`: quello conosce transizione e recupero di giro, non
     * la pausa tra due tri-set, che è il doppio.
     */
    const lavori = plan.filter((step): step is Extract<GuidedStep, { kind: 'work' }> => step.kind === 'work');
    const indiceA3 = plan.findIndex(
      (step) => step.kind === 'work' && step.blockCode === 'A3' && step.step.setIndex === 3,
    );
    const dopo = plan[indiceA3 + 1];
    expect(dopo?.kind).toBe('rest');
    if (dopo?.kind === 'rest') {
      expect(dopo.tier).toBe('blocco');
      expect(dopo.seconds).toBe(90);
    }
    expect(lavori.length).toBeGreaterThan(0);
  });

  it('la pausa di blocco nomina il blocco che finisce e quello che comincia', () => {
    /*
     * Dopo nove serie del Tri-set A compariva il pull-over al TRX senza che
     * niente avesse detto che un blocco era finito e ne cominciava un altro:
     * a dieci minuti dall'inizio, un esercizio che non ti aspetti sembra
     * un'app che ti ha cambiato la scheda.
     *
     * Il test esiste perché la prima volta la correzione non è entrata nel
     * file — una sostituzione di stringa che non ha trovato il suo bersaglio
     * e non ha detto niente — e il typecheck è passato lo stesso, perché non
     * era cambiato nulla. Un testo si verifica leggendolo, non scrivendolo.
     */
    const pause = plan.filter(
      (step): step is Extract<GuidedStep, { kind: 'rest' }> =>
        step.kind === 'rest' && step.tier === 'blocco',
    );
    /* La prima è quella tra riscaldamento e lavoro: le altre separano blocchi. */
    const traBlocchi = pause.slice(1);
    expect(traBlocchi.length).toBeGreaterThan(0);
    for (const pausa of traBlocchi) {
      expect(pausa.hint, pausa.hint).toMatch(/^(Tri-set|Coppia|Blocco|Finitura)/);
      expect(pausa.hint, pausa.hint).toContain(' finito, ora ');
    }
  });

  it('non mette nessun recupero tra i giri della finitura', () => {
    /*
     * La finitura è l'unico blocco in cui si ricomincia senza fermarsi: 15"
     * per spostarsi tra le stazioni e nient'altro. Un recupero di giro qui
     * annullerebbe lo scopo del blocco.
     */
    const indici = plan
      .map((step, i) => ({ step, i }))
      .filter(({ step }) => step.kind === 'work' && step.group === 'F');
    /*
     * L'ultima stazione del primo giro, qualunque sia il suo codice: la
     * finitura ne ha quattro, e cercare «F3» a mano voleva dire che il test
     * passava anche quando il blocco cambiava numero di stazioni.
     */
    const primoGiro = indici.filter(
      ({ step }) => step.kind === 'work' && step.step.setIndex === 1,
    );
    expect(primoGiro.length).toBeGreaterThan(1);
    const ultimoDelPrimoGiro = primoGiro.at(-1);
    expect(ultimoDelPrimoGiro).toBeDefined();
    const dopo = plan[(ultimoDelPrimoGiro?.i ?? 0) + 1];
    /* Subito la prima stazione del giro seguente, senza recupero in mezzo. */
    expect(dopo?.kind).toBe('work');
  });

  it('apre il giro di prova in un passo per ogni esercizio del blocco', () => {
    const riscaldamenti = plan.filter(
      (step): step is Extract<GuidedStep, { kind: 'warmup' }> => step.kind === 'warmup',
    );
    const rampa = riscaldamenti.filter((step) => step.inRamp);
    const blocchiA = seduta.blocks.filter((block) => block.group === 'A');
    expect(rampa).toHaveLength(blocchiA.length);
    /* Ogni passo nomina il suo esercizio: è la consegna che prima mancava. */
    expect(rampa.map((step) => step.exercise)).toEqual(blocchiA.map((block) => block.exercise));
    for (const passo of rampa) {
      expect(passo.workSeconds).toBeGreaterThanOrEqual(RAMP_MIN_SEC);
      expect(passo.workSeconds).toBeLessThanOrEqual(RAMP_MAX_SEC);
      expect(passo.reps, passo.label).not.toBeNull();
    }
  });

  it('non mette recuperi dentro il giro di prova', () => {
    /* È un giro: tra una stazione e l'altra non ci si ferma. */
    for (let i = 0; i < plan.length - 2; i += 1) {
      const uno = plan[i];
      const due = plan[i + 1];
      if (uno?.kind !== 'warmup' || !uno.inRamp) continue;
      const prossimoRiscaldamento = plan[i + 1];
      if (prossimoRiscaldamento?.kind === 'warmup' && prossimoRiscaldamento.inRamp) {
        expect(due?.kind, `passo ${String(i)}`).not.toBe('rest');
      }
    }
  });

  it('conta le serie di lavoro senza il riscaldamento', () => {
    const serieDaScheda = seduta.blocks.reduce((somma, block) => somma + block.sets, 0);
    expect(workStepCount(plan)).toBe(serieDaScheda);
  });

  it('dà a ogni passo un identificativo diverso', () => {
    expect(new Set(plan.map((step) => step.id)).size).toBe(plan.length);
  });
});

describe('clockOffsets ed estimatedSeconds', () => {
  const seduta = CIRCUIT_SESSIONS[1];
  if (seduta === undefined) throw new Error('Nessuna seduta a circuito.');
  const plan = buildGuidedPlan(seduta, 1);

  it('il primo passo parte da zero e gli scarti crescono', () => {
    const offsets = clockOffsets(plan);
    expect(offsets).toHaveLength(plan.length);
    expect(offsets[0]).toBe(0);
    for (let i = 1; i < offsets.length; i += 1) {
      expect(offsets[i] ?? 0).toBeGreaterThanOrEqual(offsets[i - 1] ?? 0);
    }
  });

  it('la durata totale è la somma dei passi', () => {
    const somma = plan.reduce((totale, step) => totale + stepSeconds(step), 0);
    expect(estimatedSeconds(plan)).toBe(somma);
  });

  it('lo scarico accorcia la seduta', () => {
    /* Settimana 6: metà delle serie, stessa difficoltà. */
    const normale = estimatedSeconds(buildGuidedPlan(seduta, 1));
    const scarico = estimatedSeconds(buildGuidedPlan(seduta, 6));
    expect(scarico).toBeLessThan(normale);
  });
});
