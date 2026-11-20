import type {
  CircuitSessionId,
  ProgramBlock,
  ProgramSession,
  RestPrescription,
  WarmupStep,
} from '../types/index.ts';

/**
 * Il programma attivo: quattro circuiti, nessun giorno assegnato.
 *
 * **Questa è la trascrizione della scheda originale**, non una ricostruzione.
 * La prima versione di questo file era stata riscritta a memoria dai principi
 * del programma, perché le tabelle non erano più nel contesto: ne è uscita una
 * scheda con quattro blocchi invece di due tri-set, una finitura da tre
 * stazioni invece di quattro, nessuna decompressione e metà degli esercizi
 * diversi. Qui ogni riga viene dal testo.
 *
 * Struttura, identica in tutte e quattro:
 *
 * | blocco | cos'è | giri |
 * |---|---|---|
 * | riscaldamento | cinque passi più il giro di prova del Tri-set 1 | — |
 * | **A** | Tri-set 1 | 3 |
 * | **B** | Tri-set 2 — braccia e vita | 3 |
 * | **F** | finitura metabolica, quattro stazioni | 2 |
 * | **Z** | decompressione | 1 |
 *
 * Tre cose che la rendono una scheda diversa e non una variante:
 *
 * 1. **Nessun calendario.** Le quattro sedute si fanno nell'ordine in cui
 *    stanno, quando capita, quattro volte a settimana.
 *
 * 2. **Tri-set non competitivi.** Tre stazioni di fila i cui muscoli non si
 *    contendono niente: ogni muscolo recupera 2'40"-4'05" veri mentre tu non
 *    hai mai tempo morto. È quello che permette a quaranta minuti di contenere
 *    il volume di una seduta da cinquantotto.
 *
 * 3. **Range fissi, mai derivati dal test.** Il massimale alle trazioni è 4:
 *    un range calcolato dal test prescriverebbe numeri ineseguibili. Qui il
 *    numero è fisso e quello che si sposta è il *gradino*, scelto perché il
 *    massimo tecnico ci caschi dentro.
 *
 * I tempi della colonna «lavoro» della scheda sono qui come `workSeconds`:
 * sono stime, non prescrizioni — la serie finisce a RIR 1-2, non allo scadere
 * — e servono a far tornare l'orologio.
 */

/* -------------------------------------------------------------------------- */
/* I recuperi, con nome                                                        */
/* -------------------------------------------------------------------------- */

/*
 * «Recupero tra gli esercizi» in un tri-set è una contraddizione: la
 * transizione *è* il recupero, e vale 20-35 secondi. Il numero che conta è un
 * altro — il recupero reale di ogni muscolo, cioè il tempo tra una sua serie e
 * la successiva — e in questa scheda sta tra 2'40" e 4'05".
 *
 * Il tempo si recupera nelle transizioni, mai nel recupero di giro.
 */

/** Tri-set 1 delle sedute di forza: transizione 35", giro 45", blocco 90". */
const FORZA: RestPrescription = {
  kind: 'superset',
  transitionMinSec: 35,
  transitionMaxSec: 35,
  roundRestSec: 45,
  blockRestSec: 90,
};

/**
 * Tri-set 2 delle sedute di forza: transizione 20", giro 30", poi la finitura.
 *
 * `blockRestSec: 0` non e' una dimenticanza. La pausa di blocco della scheda
 * sta tra Tri-set 1 e Tri-set 2 e in nessun altro posto: l'orologio originale
 * manda l'ultimo giro del Tri-set 2 dentro la finitura senza fermarsi, in
 * tutte e quattro le sedute (27:10 → 30:30 nella prima, e sono esattamente i
 * 200 secondi del giro). Con 90 secondi qui l'orologio sforava di un minuto e
 * quaranta su ogni seduta.
 */
const FORZA_BRACCIA: RestPrescription = {
  kind: 'superset',
  transitionMinSec: 20,
  transitionMaxSec: 20,
  roundRestSec: 30,
  blockRestSec: 0,
};

/** Tri-set 1 delle sedute di volume: transizione 20", giro 30", blocco 60". */
const VOLUME: RestPrescription = {
  kind: 'superset',
  transitionMinSec: 20,
  transitionMaxSec: 20,
  roundRestSec: 30,
  blockRestSec: 60,
};

/**
 * Tri-set 2 delle sedute di volume: transizione 15", giro 20-25", blocco 60".
 *
 * Sono i recuperi più corti della scheda e va bene che lo siano: bicipite e
 * tricipite sono antagonisti puri, quindi mentre uno lavora l'altro recupera
 * davvero.
 */
const volumeBraccia = (giro: number): RestPrescription => ({
  kind: 'superset',
  transitionMinSec: 15,
  transitionMaxSec: 15,
  roundRestSec: giro,
  /* Come in FORZA_BRACCIA: dal Tri-set 2 si entra in finitura senza pausa. */
  blockRestSec: 0,
});

/** Finitura: 15" tra le stazioni, zero tra i giri. */
const FINITURA: RestPrescription = {
  kind: 'superset',
  transitionMinSec: 15,
  transitionMaxSec: 15,
  roundRestSec: 0,
  blockRestSec: 0,
};

/** Decompressione: si passa da una posizione all'altra senza fermarsi. */
const DECOMPRESSIONE: RestPrescription = {
  kind: 'superset',
  transitionMinSec: 0,
  transitionMaxSec: 0,
  roundRestSec: 0,
  blockRestSec: 0,
};

/* -------------------------------------------------------------------------- */
/* Riscaldamento                                                               */
/* -------------------------------------------------------------------------- */

const CORDA: WarmupStep = {
  label: 'Corda da battaglia, onde alternate leggere',
  exercise: 'corda-battaglia-onde-alternate',
  seconds: 60,
  reps: null,
  perSide: false,
  hint: 'Senza corda: jumping jack. Serve ad alzare la temperatura, non a stancare.',
};

const SCAPOLE: WarmupStep = {
  label: 'Scapular pull-up',
  exercise: 'scapular-pull-up',
  seconds: 25,
  reps: 8,
  perSide: false,
  hint: 'Braccia dritte: scendono solo le scapole, di due o tre centimetri.',
};

const CIRCONDUZIONI: WarmupStep = {
  label: 'Circonduzioni di spalla',
  exercise: 'circonduzioni-spalle',
  seconds: 20,
  reps: null,
  perSide: false,
  hint: 'Cerchi ampi e lenti, costole chiuse.',
};

/**
 * Dieci swing con il kettlebell da 16, eseguiti per la tecnica.
 *
 * «Tecnici» è terminologia di riscaldamento: si fanno per ripassare lo schema,
 * non per fare fatica. Il 16 è il peso della campana, non il numero di
 * ripetizioni — quelle sono dieci.
 */
const SWING_TECNICO: WarmupStep = {
  label: 'Swing con kettlebell 16 kg, tecnici',
  exercise: 'kb-swing',
  seconds: 30,
  reps: 10,
  perSide: false,
  hint: 'Cerniera, non squat: il peso va indietro tra le gambe, alto e vicino all\u2019inguine. Nessuno sforzo.',
};

const AFFONDI: WarmupStep = {
  label: 'Affondo con rotazione',
  exercise: 'affondo-con-rotazione',
  seconds: 40,
  reps: 6,
  perSide: true,
  hint: 'Ruota il torace da fondo affondo, non prima.',
};

/**
 * Il giro di prova del Tri-set 1.
 *
 * `rampGroup` non è un\u2019etichetta: il player lo apre in un passo per ogni
 * esercizio del blocco, con il suo nome e la sua figura. Scritto come riga
 * unica chiedeva tre esercizi senza nominarne nessuno.
 */
const RAMPA_A: WarmupStep = {
  label: 'Giro di prova del Tri-set A',
  seconds: 20,
  reps: null,
  perSide: false,
  rampGroup: 'A',
  hint: 'Metà carico, metà ripetizioni. Non è una serie: è la prova che la prima vera non parta a freddo.',
};

const RISCALDAMENTO: readonly WarmupStep[] = [
  CORDA,
  SCAPOLE,
  CIRCONDUZIONI,
  SWING_TECNICO,
  AFFONDI,
  RAMPA_A,
];

/* -------------------------------------------------------------------------- */
/* Decompressione — due minuti, uguale in tutte e quattro                      */
/* -------------------------------------------------------------------------- */

/**
 * Non è defaticamento generico: sono tre cose precise dopo quaranta minuti di
 * apnee e di presa. La sospensione passiva riapre la spalla, l\u2019apertura
 * d\u2019anca restituisce il flessore che i tri-set hanno accorciato, la
 * respirazione riporta giù la frequenza cardiaca e il diaframma.
 */
const decompressione = (): readonly ProgramBlock[] => [
  {
    code: 'Z1',
    group: 'Z',
    pairing: 'superset',
    exercise: 'dead-hang',
    sets: 1,
    prescription: { kind: 'seconds', min: 30, max: 30 },
    reference: 'Circuito · decompressione',
    tut: 'isometrico',
    rir: '\u2014',
    rest: DECOMPRESSIONE,
    perSide: false,
    workSeconds: 30,
    excludeFromReview: true,
  },
  {
    code: 'Z2',
    group: 'Z',
    pairing: 'superset',
    exercise: 'apertura-anche',
    sets: 1,
    prescription: { kind: 'seconds', min: 60, max: 60 },
    reference: 'Circuito · decompressione',
    tut: 'isometrico',
    rir: '\u2014',
    rest: DECOMPRESSIONE,
    perSide: false,
    workSeconds: 60,
    excludeFromReview: true,
  },
  {
    code: 'Z3',
    group: 'Z',
    pairing: 'superset',
    exercise: 'respirazione-360',
    sets: 1,
    prescription: { kind: 'seconds', min: 30, max: 30 },
    reference: 'Circuito · decompressione',
    tut: 'isometrico',
    rir: '\u2014',
    rest: DECOMPRESSIONE,
    perSide: false,
    workSeconds: 30,
    excludeFromReview: true,
  },
];

/** Una stazione della finitura: 30" di lavoro, due giri, fuori dalla revisione. */
const finitura = (
  code: string,
  exercise: ProgramBlock['exercise'],
  prescription: ProgramBlock['prescription'],
  variantNote?: string,
): ProgramBlock => ({
  code,
  group: 'F',
  pairing: 'superset',
  exercise,
  sets: 2,
  prescription,
  reference: 'Circuito · finitura metabolica',
  tut: 'controllato',
  rir: '\u2014',
  rest: FINITURA,
  perSide: false,
  workSeconds: 30,
  excludeFromReview: true,
  ...(variantNote === undefined ? {} : { variantNote }),
});

/** Trenta secondi a tempo: il formato della maggior parte delle stazioni. */
const trenta = { kind: 'seconds', min: 30, max: 30 } as const;
const SEDUTA_1: readonly ProgramBlock[] = [
  {
    code: 'A1',
    group: 'A',
    pairing: 'superset',
    exercise: 'trazioni-prona-presa-media',
    sets: 3,
    prescription: { kind: 'reps', min: 6, max: 8 },
    reference: 'Circuito · tri-set 1',
    tut: '3-0-1-0',
    rir: '1-2',
    rest: FORZA,
    perSide: false,
    workSeconds: 30,
    variantNote:
      'Un piede appoggiato sul box: è il gradino che rende eseguibili sei-otto ripetizioni quando il massimo a corpo libero è quattro. Togli l’appoggio quando otto vengono pulite.',
    variantNoteLevel: 1,
  },
  {
    code: 'A2',
    group: 'A',
    pairing: 'superset',
    exercise: 'bulgarian-split-squat',
    sets: 3,
    prescription: { kind: 'reps', min: 8, max: 10 },
    reference: 'Circuito · tri-set 1',
    tut: '3-1-1-0',
    rir: '1-2',
    rest: FORZA,
    perSide: true,
    workSeconds: 100,
    variantNote:
      'Kettlebell in racked, appoggiato al petto dal lato della gamba davanti: tiene il busto verticale meglio di due manubri ai fianchi.',
  },
  {
    code: 'A3',
    group: 'A',
    pairing: 'superset',
    exercise: 'dip-parallele-anelli',
    sets: 3,
    prescription: { kind: 'reps', min: 6, max: 8 },
    reference: 'Circuito · tri-set 1',
    tut: '3-0-1-0',
    rir: '1-2',
    rest: FORZA,
    perSide: false,
    workSeconds: 30,
  },
  {
    code: 'B1',
    group: 'B',
    pairing: 'superset',
    exercise: 'curl-martello-manubri',
    sets: 3,
    prescription: { kind: 'reps', min: 8, max: 10 },
    reference: 'Circuito · tri-set 2, braccia e vita',
    tut: '3-0-1-1',
    rir: '0-1',
    rest: FORZA_BRACCIA,
    perSide: false,
    workSeconds: 45,
    variantNote:
      'Presa neutra per il brachiale: è il muscolo che allarga il braccio visto di fronte, ed è il più trascurato dei tre.',
  },
  {
    code: 'B2',
    group: 'B',
    pairing: 'superset',
    exercise: 'estensione-tricipiti-sopra-testa',
    sets: 3,
    prescription: { kind: 'reps', min: 8, max: 10 },
    reference: 'Circuito · tri-set 2, braccia e vita',
    tut: '3-0-1-1',
    rir: '0-1',
    rest: FORZA_BRACCIA,
    perSide: false,
    workSeconds: 45,
    variantNote:
      'Con il kettlebell tenuto per le corna. Sopra la testa, non ai fianchi: è l’unica posizione che allunga il capo lungo, che è la parte più grossa del tricipite.',
  },
  {
    code: 'B3',
    group: 'B',
    pairing: 'superset',
    exercise: 'suitcase-carry',
    sets: 3,
    prescription: { kind: 'seconds', min: 30, max: 40 },
    reference: 'Circuito · tri-set 2, braccia e vita',
    tut: 'isometrico',
    rir: '—',
    rest: FORZA_BRACCIA,
    perSide: true,
    workSeconds: 70,
    variantNote:
      'Kettlebell da 24. È l’unico esercizio della scheda che lavora la vita nel verso giusto: carico alto, zero ipertrofia degli obliqui. Il lavoro è nel non piegarsi.',
  },
  finitura('F1', 'kb-swing', { kind: 'reps', min: 15, max: 20 }),
  finitura('F2', 'corda-battaglia-onde-alternate', trenta),
  finitura('F3', 'step-rapidi-box', trenta),
  finitura('F4', 'corda-battaglia-slam', trenta, 'È la più sistemica delle quattro: se il fiato finisce, finisce la serie.'),
  ...decompressione(),
];

const SEDUTA_2: readonly ProgramBlock[] = [
  {
    code: 'A1',
    group: 'A',
    pairing: 'superset',
    exercise: 'pike-pushup-piedi-rialzati',
    sets: 3,
    prescription: { kind: 'reps', min: 6, max: 8 },
    reference: 'Circuito · tri-set 1',
    tut: '3-0-1-0',
    rir: '1-2',
    rest: FORZA,
    perSide: false,
    workSeconds: 30,
  },
  {
    code: 'A2',
    group: 'A',
    pairing: 'superset',
    exercise: 'stacco-rumeno-manubri',
    sets: 3,
    prescription: { kind: 'reps', min: 8, max: 12 },
    reference: 'Circuito · tri-set 1',
    tut: '3-1-1-0',
    rir: '1-2',
    rest: FORZA,
    perSide: false,
    workSeconds: 50,
    variantNote:
      'Con due kettlebell invece dei manubri, se li hai: la presa più bassa allunga un po’ di più.',
  },
  {
    code: 'A3',
    group: 'A',
    pairing: 'superset',
    exercise: 'rematore-inverso-trx',
    sets: 3,
    prescription: { kind: 'reps', min: 8, max: 10 },
    reference: 'Circuito · tri-set 1',
    tut: '2-1-1-1',
    rir: '1-2',
    rest: FORZA,
    perSide: false,
    workSeconds: 45,
    variantNote:
      'Agli anelli e con la presa larga: porta i gomiti verso l’esterno, non ai fianchi. È spessore, non ampiezza.',
  },
  {
    code: 'B1',
    group: 'B',
    pairing: 'superset',
    exercise: 'curl-manubri-supino',
    sets: 3,
    prescription: { kind: 'reps', min: 8, max: 12 },
    reference: 'Circuito · tri-set 2, braccia e vita',
    tut: '3-0-1-1',
    rir: '0-1',
    rest: FORZA_BRACCIA,
    perSide: false,
    workSeconds: 50,
  },
  {
    code: 'B2',
    group: 'B',
    pairing: 'superset',
    exercise: 'dip-panche-o-diamond-pushup',
    sets: 3,
    prescription: { kind: 'reps', min: 8, max: 12 },
    reference: 'Circuito · tri-set 2, braccia e vita',
    tut: '3-0-1-1',
    rir: '0-1',
    rest: FORZA_BRACCIA,
    perSide: false,
    workSeconds: 40,
  },
  {
    code: 'B3',
    group: 'B',
    pairing: 'superset',
    exercise: 'pallof-press-elastico',
    sets: 3,
    prescription: { kind: 'reps', min: 8, max: 10 },
    reference: 'Circuito · tri-set 2, braccia e vita',
    tut: '2-0-1-1',
    rir: '—',
    rest: FORZA_BRACCIA,
    perSide: true,
    workSeconds: 70,
    variantNote:
      'Al TRX se ce l’hai, con l’elastico altrimenti. Il bacino non si muove di un grado: è tutto il lavoro.',
  },
  finitura('F1', 'burpee', trenta, 'Qui la tecnica si sfalda per prima: quando il bacino comincia a cedere nel plank, la serie è finita anche se il timer no.'),
  finitura('F2', 'corda-per-saltare', trenta),
  finitura('F3', 'affondi-rapidi-alternati', trenta),
  finitura('F4', 'corda-battaglia-onde-doppie', trenta),
  ...decompressione(),
];

const SEDUTA_3: readonly ProgramBlock[] = [
  {
    code: 'A1',
    group: 'A',
    pairing: 'superset',
    exercise: 'goblet-squat',
    sets: 3,
    prescription: { kind: 'reps', min: 12, max: 18 },
    reference: 'Circuito · tri-set 1',
    tut: '3-1-1-0',
    rir: '1-2',
    rest: VOLUME,
    perSide: false,
    workSeconds: 75,
  },
  {
    code: 'A2',
    group: 'A',
    pairing: 'superset',
    exercise: 'push-up',
    sets: 3,
    prescription: { kind: 'reps', min: 12, max: 18 },
    reference: 'Circuito · tri-set 1',
    tut: '2-0-1-0',
    rir: '1-2',
    rest: VOLUME,
    perSide: false,
    workSeconds: 45,
    variantNote:
      'Declinati, piedi su un rialzo: è il gradino che tiene dodici-diciotto ripetizioni dentro il range giusto.',
    variantNoteLevel: 3,
  },
  {
    code: 'A3',
    group: 'A',
    pairing: 'superset',
    exercise: 'pull-over-trx',
    sets: 3,
    prescription: { kind: 'reps', min: 12, max: 15 },
    reference: 'Circuito · tri-set 1',
    tut: '3-0-1-1',
    rir: '1-2',
    rest: VOLUME,
    perSide: false,
    workSeconds: 65,
    variantNote:
      'Braccia tese: il gomito non si piega, la spalla si estende. È l’ampiezza dorsale senza che il bicipite sia il limite.',
  },
  {
    code: 'B1',
    group: 'B',
    pairing: 'superset',
    exercise: 'curl-trx',
    sets: 3,
    prescription: { kind: 'reps', min: 12, max: 16 },
    reference: 'Circuito · tri-set 2, braccia e vita',
    tut: '2-0-1-1',
    rir: '0-1',
    rest: volumeBraccia(20),
    perSide: false,
    workSeconds: 56,
  },
  {
    code: 'B2',
    group: 'B',
    pairing: 'superset',
    exercise: 'estensione-tricipiti-trx',
    sets: 3,
    prescription: { kind: 'reps', min: 12, max: 16 },
    reference: 'Circuito · tri-set 2, braccia e vita',
    tut: '2-0-1-1',
    rir: '0-1',
    rest: volumeBraccia(20),
    perSide: false,
    workSeconds: 56,
  },
  {
    code: 'B3',
    group: 'B',
    pairing: 'superset',
    exercise: 'hollow-hold',
    sets: 3,
    prescription: { kind: 'seconds', min: 30, max: 45 },
    reference: 'Circuito · tri-set 2, braccia e vita',
    tut: 'isometrico',
    rir: '—',
    rest: volumeBraccia(20),
    perSide: false,
    workSeconds: 38,
  },
  finitura('F1', 'kb-swing', { kind: 'reps', min: 15, max: 20 }),
  finitura('F2', 'mountain-climber', trenta),
  finitura('F3', 'corda-battaglia-cerchi', trenta),
  finitura('F4', 'step-rapidi-box', trenta),
  ...decompressione(),
];

const SEDUTA_4: readonly ProgramBlock[] = [
  {
    code: 'A1',
    group: 'A',
    pairing: 'superset',
    exercise: 'hip-thrust-panca-bilaterale',
    sets: 3,
    prescription: { kind: 'reps', min: 15, max: 20 },
    reference: 'Circuito · tri-set 1',
    tut: '2-1-1-1',
    rir: '1-2',
    rest: VOLUME,
    perSide: false,
    workSeconds: 85,
    variantNote:
      'Kettlebell appoggiato sulla piega dell’anca, tenuto con le mani. Il monopodalico è due gradini più avanti nella scala: ci arriva la progressione, non questa seduta.',
  },
  {
    code: 'A2',
    group: 'A',
    pairing: 'superset',
    exercise: 'rematore-manubrio-un-braccio',
    sets: 3,
    prescription: { kind: 'reps', min: 12, max: 15 },
    reference: 'Circuito · tri-set 1',
    tut: '2-1-1-1',
    rir: '1-2',
    rest: VOLUME,
    perSide: true,
    workSeconds: 100,
  },
  {
    code: 'A3',
    group: 'A',
    pairing: 'superset',
    exercise: 'military-press-manubri',
    sets: 3,
    prescription: { kind: 'reps', min: 12, max: 15 },
    reference: 'Circuito · tri-set 1',
    tut: '2-0-1-0',
    rir: '1-2',
    rest: VOLUME,
    perSide: false,
    workSeconds: 40,
  },
  {
    code: 'B1',
    group: 'B',
    pairing: 'superset',
    exercise: 'curl-panca-inclinata',
    sets: 3,
    prescription: { kind: 'reps', min: 10, max: 14 },
    reference: 'Circuito · tri-set 2, braccia e vita',
    tut: '3-0-1-1',
    rir: '0-1',
    rest: volumeBraccia(25),
    perSide: false,
    workSeconds: 60,
  },
  {
    code: 'B2',
    group: 'B',
    pairing: 'superset',
    exercise: 'dip-panche-piedi-rialzati',
    sets: 3,
    prescription: { kind: 'reps', min: 12, max: 18 },
    reference: 'Circuito · tri-set 2, braccia e vita',
    tut: '2-0-1-1',
    rir: '0-1',
    rest: volumeBraccia(25),
    perSide: false,
    workSeconds: 45,
  },
  {
    code: 'B3',
    group: 'B',
    pairing: 'superset',
    exercise: 'plank-trascinamento-kb',
    sets: 3,
    prescription: { kind: 'reps', min: 8, max: 10 },
    reference: 'Circuito · tri-set 2, braccia e vita',
    tut: '2-0-1-1',
    rir: '—',
    rest: volumeBraccia(25),
    perSide: true,
    workSeconds: 70,
  },
  finitura('F1', 'corda-battaglia-slam', trenta),
  finitura('F2', 'jumping-jack', trenta),
  finitura('F3', 'kb-swing', { kind: 'reps', min: 15, max: 20 }),
  finitura('F4', 'plank-tocco-spalla', trenta),
  ...decompressione(),
];

/* -------------------------------------------------------------------------- */
/* Le quattro sedute                                                           */
/* -------------------------------------------------------------------------- */

/*
 * Il riscaldamento è lo stesso in tutte e quattro, e lo è nell'originale: «come
 * Seduta 1, con il giro di prova sul Tri-set 1 di questa seduta». L'unica cosa
 * che cambia è il contenuto del giro di prova, e quello lo cambia `rampGroup`
 * da sé — legge i blocchi del gruppo A della seduta in cui si trova.
 *
 * La versione precedente di questo file dava a ogni seduta un riscaldamento
 * diverso (jumping jack, step rapidi al box, una cerniera d'anca) e lasciava
 * cadere lo swing tecnico e le scapole da due sedute su quattro. Era una
 * variazione inventata.
 */

export const CIRCUIT_SESSIONS: readonly ProgramSession[] = Object.freeze([
  {
    id: 'circuito-1',
    weekday: null,
    name: 'Seduta 1',
    focus: 'forza · trazione verticale',
    kind: 'circuit',
    estimatedMinutes: 38,
    warmup: [],
    warmupSteps: RISCALDAMENTO,
    pauseTasks: {
      A: 'Due trazioni negative: sali con un salto o dal box, scendi in 5 secondi.',
    },
    blocks: SEDUTA_1,
  },
  {
    id: 'circuito-2',
    weekday: null,
    name: 'Seduta 2',
    focus: 'forza · spinta verticale',
    kind: 'circuit',
    estimatedMinutes: 36,
    warmup: [],
    warmupSteps: RISCALDAMENTO,
    note: 'È la più corta delle quattro. I minuti di margine sono il posto giusto per 2 serie opzionali di alzate laterali (12-18, RIR 0-1, 30" tra le due), in coda al Tri-set B.',
    blocks: SEDUTA_2,
  },
  {
    id: 'circuito-3',
    weekday: null,
    name: 'Seduta 3',
    focus: 'volume · gambe e larghezza',
    kind: 'circuit',
    estimatedMinutes: 35,
    warmup: [],
    warmupSteps: RISCALDAMENTO,
    blocks: SEDUTA_3,
  },
  {
    id: 'circuito-4',
    weekday: null,
    name: 'Seduta 4',
    focus: 'volume · catena posteriore e spessore',
    kind: 'circuit',
    estimatedMinutes: 39,
    warmup: [],
    warmupSteps: RISCALDAMENTO,
    /*
     * La scheda dice «Se sfori i 40 minuti togli 2 ripetizioni al rematore,
     * non il recupero». Togliere ripetizioni impedisce al rematore di chiudere
     * il massimo, quindi di progredire (M19). Alessio ha deciso un tetto di
     * 55 minuti (D-22 a, 2026-11-20): oltre, il metodo non propone più tempo e
     * pausa (R19). `DEVIAZIONI` dichiara solo esercizi, non note.
     */
    note: 'È la più lunga delle quattro, per le due stazioni unilaterali del Tri-set A. Con tempo e pausa accumulati può arrivare a 55 minuti: oltre, il metodo non aggiunge altro tempo. Non togliere ripetizioni né recupero.',
    blocks: SEDUTA_4,
  },
] as const satisfies readonly ProgramSession[]);

const BY_ID: ReadonlyMap<string, ProgramSession> = new Map(
  CIRCUIT_SESSIONS.map((session) => [session.id, session]),
);

export function findCircuitSession(id: string): ProgramSession | undefined {
  return BY_ID.get(id);
}

export function isCircuitSessionId(id: string): id is CircuitSessionId {
  return BY_ID.has(id);
}

/** L'ordine in cui le sedute si susseguono. La rotazione ci gira sopra. */
export const CIRCUIT_ORDER: readonly CircuitSessionId[] = Object.freeze([
  'circuito-1',
  'circuito-2',
  'circuito-3',
  'circuito-4',
] as const);
