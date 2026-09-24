import { describe, expect, it } from 'vitest';
import { blockPerSide, buildSessionPlan, totalWorkSets } from './rest.ts';
import type { ExerciseState, ProgramSession } from '../types/index.ts';
import { getSession, PROGRAM_SESSIONS } from '../data/program.ts';

const codesOf = (steps: readonly { blockCode: string }[]) => steps.map((step) => step.blockCode);

describe('piano della seduta — superserie', () => {
  const plan = buildSessionPlan(getSession('upper-a'), 1);

  it('alterna i due esercizi della coppia, giro dopo giro', () => {
    const groupA = plan.filter((step) => step.group === 'A');
    expect(codesOf(groupA)).toEqual(['A1', 'A2', 'A1', 'A2', 'A1', 'A2', 'A1', 'A2']);
  });

  it('mette 15-20" per spostarsi e il recupero lungo alla fine del giro', () => {
    const groupA = plan.filter((step) => step.group === 'A');
    expect(groupA[0]?.rest).toEqual({
      kind: 'transition',
      seconds: 15,
      maxSeconds: 20,
      label: 'Passa a A2',
      hint: 'Solo il tempo di spostarti. Non è un recupero.',
    });
    expect(groupA[1]?.rest.kind).toBe('round');
    expect(groupA[1]?.rest.seconds).toBe(90);
  });

  /*
   * L'ultima serie di un blocco ha il recupero del blocco, non zero.
   *
   * Prima nasceva senza: in palestra voleva dire passare dall'ultima serie di
   * un esercizio alla prima del successivo senza nessuna pausa. La colonna
   * della scheda dice quanto recuperare dopo una serie di quel blocco, e
   * l'ultima serie è comunque una serie di quel blocco.
   */
  it('dopo l’ultimo giro della coppia si recupera come negli altri giri', () => {
    const groupA = plan.filter((step) => step.group === 'A');
    expect(groupA.at(-1)?.rest.kind).toBe('round');
    expect(groupA.at(-1)?.rest.seconds).toBe(90);
    expect(groupA.at(-1)?.rest.hint).toContain('prossimo esercizio');
  });

  it('quando i due esercizi hanno serie diverse, l’ultimo giro si fa da soli', () => {
    // C1 ha 4 serie, C2 ne ha 3.
    const groupC = plan.filter((step) => step.group === 'C');
    expect(codesOf(groupC)).toEqual(['C1', 'C2', 'C1', 'C2', 'C1', 'C2', 'C1']);
    expect(groupC.at(-1)?.setIndex).toBe(4);
    expect(groupC.at(-1)?.rest.kind).toBe('round');
  });

  it('il recupero lungo resta anche nel giro che precede quello spaiato', () => {
    const groupC = plan.filter((step) => step.group === 'C');
    expect(groupC[5]?.blockCode).toBe('C2');
    expect(groupC[5]?.rest.kind).toBe('round');
    expect(groupC[5]?.rest.seconds).toBe(45);
  });
});

describe('piano della seduta — esercizi isolati', () => {
  it('usa il recupero tra le serie e non quello da superserie', () => {
    const plan = buildSessionPlan(getSession('upper-a'), 1);
    const blockD = plan.filter((step) => step.blockCode === 'D');
    expect(blockD).toHaveLength(3);
    expect(blockD[0]?.rest.kind).toBe('straight');
    expect(blockD[0]?.rest.seconds).toBe(60);
    expect(blockD.at(-1)?.rest.kind).toBe('none');
    expect(blockD.every((step) => step.round === null)).toBe(true);
  });

  it('il nordic del venerdì recupera 150" tra le serie', () => {
    const plan = buildSessionPlan(getSession('lower-b'), 1);
    const blockA = plan.filter((step) => step.blockCode === 'A');
    expect(blockA[0]?.rest.seconds).toBe(150);
  });
});

/*
 * Il blocco myo-reps non è più nel programma: era il D dell'Upper B, alzate
 * laterali, ed è stato tolto perché era il terzo giorno di alzate laterali
 * della settimana su una spalla già sopra la fascia di volume. La tecnica
 * resta nel metodo e nel motore, quindi resta anche il controllo — su un
 * blocco costruito qui, che è l'unico modo onesto di provare un motore che
 * il programma in questo momento non chiama.
 */
const upperB = getSession('upper-b');
const conCluster: ProgramSession = {
  ...upperB,
  blocks: [
    ...upperB.blocks,
    {
      code: 'D',
      group: 'D',
      pairing: 'single',
      exercise: 'alzate-laterali-elastico',
      sets: 1,
      prescription: { kind: 'myo-reps', activationReps: 15, miniSets: 4, miniSetReps: 4 },
      reference: 'RIR 0',
      tut: '2-0-1-0',
      rir: '0',
      rest: { kind: 'cluster', restSec: 20 },
      perSide: false,
    },
  ],
};

describe('piano della seduta — cluster myo-reps', () => {
  const plan = buildSessionPlan(conCluster, 1);
  const blockD = plan.filter((step) => step.blockCode === 'D');

  it('produce una serie di attivazione più quattro mini-serie', () => {
    expect(blockD).toHaveLength(5);
    expect(blockD.map((step) => step.kind)).toEqual([
      'activation',
      'mini-set',
      'mini-set',
      'mini-set',
      'mini-set',
    ]);
  });

  it('mette 20" tra una mini-serie e l’altra', () => {
    expect(blockD.slice(0, 4).every((step) => step.rest.kind === 'cluster')).toBe(true);
    expect(blockD[0]?.rest.seconds).toBe(20);
    expect(blockD.at(-1)?.rest.kind).toBe('none');
  });
});

describe('piano della seduta — cardio', () => {
  it('il mercoledì è una sequenza di blocchi singoli senza recuperi', () => {
    const plan = buildSessionPlan(getSession('zona-2'), 1);
    expect(codesOf(plan)).toEqual(['W', 'A', 'B']);
    expect(plan.every((step) => step.rest.kind === 'none')).toBe(true);
  });
});

describe('piano della seduta — scarico', () => {
  it('dimezza le serie di ogni blocco', () => {
    const normal = buildSessionPlan(getSession('upper-a'), 1);
    const deload = buildSessionPlan(getSession('upper-a'), 6);
    expect(normal).toHaveLength(24);
    expect(deload).toHaveLength(14);
  });

  it('nello scarico la coppia C torna pari e non ha più il giro spaiato', () => {
    const deload = buildSessionPlan(getSession('upper-a'), 6);
    const groupC = deload.filter((step) => step.group === 'C');
    expect(codesOf(groupC)).toEqual(['C1', 'C2', 'C1', 'C2']);
  });

  it('non tocca il cluster myo-reps, che nella scheda è una serie sola', () => {
    const deload = buildSessionPlan(conCluster, 6);
    expect(deload.filter((step) => step.blockCode === 'D')).toHaveLength(5);
  });
});

describe('coerenza del piano su tutte le sedute', () => {
  it('numera i passi in ordine, senza buchi', () => {
    for (const session of PROGRAM_SESSIONS) {
      const plan = buildSessionPlan(session, 1);
      expect(plan.map((step) => step.order), session.id).toEqual(
        plan.map((_step, index) => index + 1),
      );
    }
  });

  it('rispetta l’ordine dei blocchi della scheda', () => {
    for (const session of PROGRAM_SESSIONS) {
      const planned = [...new Set(buildSessionPlan(session, 1).map((step) => step.group))];
      const expected = [...new Set(session.blocks.map((block) => block.group))];
      expect(planned, session.id).toEqual(expected);
    }
  });

  it('nessun passo di un blocco isolato usa un recupero da superserie', () => {
    for (const session of PROGRAM_SESSIONS) {
      const byCode = new Map(session.blocks.map((block) => [block.code, block]));
      for (const step of buildSessionPlan(session, 1)) {
        if (byCode.get(step.blockCode)?.pairing !== 'single') continue;
        expect(['straight', 'cluster', 'none'], `${session.id}/${step.blockCode}`).toContain(
          step.rest.kind,
        );
      }
    }
  });

  /*
   * Solo l'ultimo passo della seduta resta senza recupero: dopo non c'è più
   * niente. Tutti gli altri hanno quello che la scheda prescrive per il loro
   * blocco — e dove la scheda non ne prescrive nessuno, come i blocchi a
   * durata della zona 2, resta nessuno.
   */
  it('solo l’ultimo passo della seduta resta senza recupero', () => {
    for (const session of PROGRAM_SESSIONS) {
      const plan = buildSessionPlan(session, 1);
      for (const [index, step] of plan.entries()) {
        if (index === plan.length - 1) continue;
        const block = session.blocks.find((entry) => entry.code === step.blockCode);
        const prescriveRecupero = block !== undefined && block.rest.kind !== 'none';
        if (!prescriveRecupero) continue;
        expect(step.rest.kind, `${session.id}/${step.blockCode} serie ${String(step.setIndex)}`).not.toBe(
          'none',
        );
      }
      expect(plan.at(-1)?.rest.kind, `${session.id}/fine`).toBe('none');
    }
  });

  it('dove la scheda non prescrive recuperi non se ne inventano', () => {
    /* La zona 2: camminata, corsa e mobilità di seguito, senza pause. */
    for (const step of buildSessionPlan(getSession('zona-2'), 1)) {
      expect(step.rest.kind, step.blockCode).toBe('none');
    }
  });

  it('il conteggio delle serie coincide con la scheda, cluster a parte', () => {
    for (const session of PROGRAM_SESSIONS) {
      const plan = buildSessionPlan(session, 1);
      const clusterSteps = plan.filter((step) => step.kind !== 'work').length;
      const clusterBlocks = session.blocks.filter(
        (block) => block.prescription.kind === 'myo-reps',
      ).length;
      expect(plan.length - clusterSteps + clusterBlocks, session.id).toBe(
        totalWorkSets(session, 1),
      );
    }
  });
});

describe('registrazione per lato', () => {
  const statoCon = (slug: string, level: number | null): ReadonlyMap<string, ExerciseState> =>
    new Map([
      [
        slug,
        {
          exercise: slug,
          level: level as ExerciseState['level'],
          eccentricBonusSeconds: 0,
          bottomPauseBonusSeconds: 0,
          loadKg: 0,
        },
      ],
    ]);

  const b1 = getSession('upper-b').blocks.find((block) => block.code === 'B1');
  if (b1 === undefined) throw new Error('B1 dell’Upper B mancante');

  /*
   * Il gesto lo descrive il gradino, non la riga della scheda.
   *
   * Il B1 prescrive il rematore monobraccio, gradino 5 della trazione
   * orizzontale. Chi scende al gradino 2, il rematore TRX a 45°, sta tirando
   * con due braccia: l'app continuava a chiedere sinistra e destra e la serie
   * non si chiudeva finché non si scrivevano due numeri per un gesto solo.
   */
  it('il rematore monobraccio si registra per lato', () => {
    expect(blockPerSide(b1, statoCon('rematore-trx-monobraccio', 5))).toBe(true);
  });

  it('scendendo al rematore a 45° non si registra più per lato', () => {
    expect(blockPerSide(b1, statoCon('rematore-trx-monobraccio', 2))).toBe(false);
  });

  it('il piano segue il livello scelto, non solo la scheda', () => {
    const conLivello2 = buildSessionPlan(
      getSession('upper-b'),
      1,
      statoCon('rematore-trx-monobraccio', 2),
    );
    const passiB1 = conLivello2.filter((step) => step.blockCode === 'B1');
    expect(passiB1.length).toBeGreaterThan(0);
    for (const passo of passiB1) expect(passo.perSide).toBe(false);
  });

  it('salendo al monobraccio il blocco a due braccia diventa per lato', () => {
    const b2 = getSession('upper-a').blocks.find((block) => block.code === 'B2');
    if (b2 === undefined) throw new Error('B2 dell’Upper A mancante');
    /* La scheda lo dà a due braccia, gradino 4. */
    expect(b2.perSide).toBe(false);
    expect(blockPerSide(b2, new Map())).toBe(false);
    expect(blockPerSide(b2, statoCon('rematore-inverso-trx-piedi-rialzati', 5))).toBe(true);
  });

  it('senza scala decide la scheda', () => {
    const c1 = getSession('lower-a').blocks.find((block) => block.code === 'C1');
    if (c1 === undefined) throw new Error('C1 del Lower A mancante');
    /* Lo step-up non sta in nessuna scala: la riga dice «per gamba». */
    expect(blockPerSide(c1, new Map())).toBe(true);
  });

  it('la scala della gamba singola è per lato a ogni gradino', () => {
    const a = getSession('lower-a').blocks.find((block) => block.code === 'A');
    if (a === undefined) throw new Error('A del Lower A mancante');
    for (const level of [1, 2, 3, 4, 5, 6]) {
      expect(blockPerSide(a, statoCon('bulgarian-split-squat', level)), String(level)).toBe(true);
    }
  });
});

describe('le scale aggiunte e i due lati', () => {
  /*
   * Hip thrust, RDL e calf partono bilaterali e diventano monopodalici al
   * terzo gradino. La scheda li dichiara «per lato» perché prescriveva
   * direttamente la forma avanzata: ai primi due gradini chiedere sinistra e
   * destra sarebbe sbagliato.
   */
  const statoA = (slug: string, level: number): ReadonlyMap<string, ExerciseState> =>
    new Map([
      [
        slug,
        {
          exercise: slug,
          level: level as ExerciseState['level'],
          eccentricBonusSeconds: 0,
          bottomPauseBonusSeconds: 0,
          loadKg: 0,
        },
      ],
    ]);

  it('ai primi gradini non si registrano due lati', () => {
    const b1 = getSession('lower-b').blocks.find((block) => block.code === 'B1');
    if (b1 === undefined) throw new Error('B1 del Lower B mancante');
    expect(b1.perSide).toBe(true);
    expect(blockPerSide(b1, statoA('hip-thrust-monopodalico', 1))).toBe(false);
    expect(blockPerSide(b1, statoA('hip-thrust-monopodalico', 2))).toBe(false);
    expect(blockPerSide(b1, statoA('hip-thrust-monopodalico', 3))).toBe(true);
    expect(blockPerSide(b1, statoA('hip-thrust-monopodalico', 4))).toBe(true);
  });

  it('vale anche per il single-leg RDL e per i due calf', () => {
    const c1 = getSession('lower-b').blocks.find((block) => block.code === 'C1');
    const c2 = getSession('lower-b').blocks.find((block) => block.code === 'C2');
    const d1 = getSession('lower-a').blocks.find((block) => block.code === 'D1');
    if (c1 === undefined || c2 === undefined || d1 === undefined) throw new Error('blocchi mancanti');
    expect(blockPerSide(c1, statoA('single-leg-rdl', 1))).toBe(false);
    expect(blockPerSide(c1, statoA('single-leg-rdl', 4))).toBe(true);
    expect(blockPerSide(d1, statoA('calf-monopodalico-rialzo', 1))).toBe(false);
    expect(blockPerSide(d1, statoA('calf-monopodalico-rialzo', 4))).toBe(true);
    /*
     * La scheda segnava per lato solo il calf su rialzo, non quello seduto,
     * pur chiamandoli entrambi «monopodalico». Ora lo dice il gradino, quindi
     * da monopodalico in su valgono due lati su tutti e due.
     */
    expect(c2.perSide).toBe(false);
    expect(blockPerSide(c2, statoA('calf-monopodalico-seduto', 4))).toBe(true);
  });

  it('lo step-up è su una gamba a ogni altezza di box', () => {
    const c1 = getSession('lower-a').blocks.find((block) => block.code === 'C1');
    if (c1 === undefined) throw new Error('C1 del Lower A mancante');
    for (const level of [1, 2, 3, 4, 5, 6]) {
      expect(blockPerSide(c1, statoA('step-up-box-alto', level)), String(level)).toBe(true);
    }
  });
});

describe('superserie con serie spaiate', () => {
  /*
   * Nella scheda i due esercizi accoppiati non hanno sempre lo stesso numero
   * di serie: il blocco C dell'Upper A è 4 serie di alzate laterali e 3 di
   * diamond push-up, il blocco D del Lower A 4 di calf e 3 di leg raise.
   * L'ultimo giro è quindi una serie sola, e va detto: senza, in palestra
   * sembra che l'app abbia perso l'altro esercizio.
   */
  const plan = buildSessionPlan(getSession('upper-a'), 1);
  const bloccoC = plan.filter((step) => step.group === 'C');

  it('alterna finché tutti e due hanno serie da fare', () => {
    expect(bloccoC.map((step) => step.blockCode)).toEqual([
      'C1', 'C2', 'C1', 'C2', 'C1', 'C2', 'C1',
    ]);
  });

  it('marca come solitaria solo la serie senza compagna', () => {
    expect(bloccoC.filter((step) => step.aloneInRound).map((step) => step.setIndex)).toEqual([4]);
  });

  it('non marca niente dove le serie sono pari', () => {
    const bloccoA = plan.filter((step) => step.group === 'A');
    expect(bloccoA).toHaveLength(8);
    expect(bloccoA.some((step) => step.aloneInRound)).toBe(false);
  });

  it('un esercizio isolato non è una superserie con la compagna assente', () => {
    const bloccoD = plan.filter((step) => step.group === 'D');
    expect(bloccoD.every((step) => !step.aloneInRound)).toBe(true);
  });
});
