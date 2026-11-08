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
 * Sostituisce lo Shadow, che resta in `program.ts` come archivio perché il
 * diario lo cita. Tre cose lo rendono una scheda diversa e non una variante:
 *
 * 1. **Nessun calendario.** Le quattro sedute si fanno nell'ordine in cui
 *    stanno, quando capita, quattro volte a settimana. La Home legge l'ultima
 *    seduta nel diario, non il giorno di oggi.
 *
 * 2. **Tri-set non competitivi.** Tre stazioni di fila i cui muscoli non si
 *    contendono niente, così ogni muscolo recupera 2'40"-4' veri mentre tu non
 *    hai mai tempo morto. È quello che permette a 40 minuti di contenere il
 *    volume di una seduta da 58.
 *
 * 3. **Range fissi, mai derivati dal test.** Il massimale alle trazioni è 4:
 *    un range calcolato dal test prescriverebbe numeri ineseguibili. Qui il
 *    numero di ripetizioni è fisso e quello che si sposta è il *gradino* della
 *    scala, scelto perché il massimo tecnico cada dentro il range: 6-10 nei
 *    blocchi di forza, 12-18 in quelli di volume. È la stessa regola di prima,
 *    applicata nel verso giusto.
 *
 * Kettlebell e corda ci sono, e lo swing è un gesto che sai fare: entrambi
 * sono prescrizioni vere, non ripieghi. Le alternative a corpo libero restano
 * dichiarate in `alternatives` lo stesso, ma non più per la disponibilità:
 * servono il giorno in cui la corda non ha spazio o ti alleni altrove.
 *
 * Lo swing resta fuori dai tri-set, e non è una questione di tecnica. È
 * balistico: circa mezzo secondo di tensione a ripetizione, contro i tre o
 * quattro di una serie controllata. Condiziona più di quanto costruisca,
 * quindi il suo posto è la finitura — dove la frequenza cardiaca è
 * l'obiettivo — e il riscaldamento, dove ripassa la cerniera d'anca prima che
 * serva.
 */

/* -------------------------------------------------------------------------- */
/* I quattro livelli di recupero                                               */
/* -------------------------------------------------------------------------- */

/*
 * Transizione, recupero di giro, pausa di blocco.
 *
 * La transizione non è un recupero: è il tempo per spostarsi sulla stazione
 * successiva. Il muscolo che ha appena lavorato sta recuperando per tutta la
 * durata delle altre due stazioni, e quello è il suo recupero vero — nel
 * blocco di forza arriva a quattro minuti.
 *
 * Il tempo si recupera nelle transizioni, mai nel recupero di giro: tagliare
 * il recupero di giro cambia l'allenamento, accorciare una transizione cambia
 * solo la fretta.
 */

/**
 * Tri-set di forza: transizione 30", giro 45", blocco 90".
 *
 * La transizione è la leva su cui si recupera tempo quando la seduta sfora, e
 * costa poco: il recupero vero del muscolo che ha appena lavorato è la somma
 * delle altre due stazioni più il recupero di giro, e resta sopra i tre
 * minuti. Il recupero di giro invece non si tocca — tagliarlo cambia
 * l'allenamento, non la fretta.
 */
const FORZA: RestPrescription = {
  kind: 'superset',
  transitionMinSec: 30,
  transitionMaxSec: 30,
  roundRestSec: 45,
  blockRestSec: 90,
};

/** Tri-set di volume: transizione 20", giro 30", blocco 60". */
const VOLUME: RestPrescription = {
  kind: 'superset',
  transitionMinSec: 20,
  transitionMaxSec: 20,
  roundRestSec: 30,
  blockRestSec: 60,
};

/**
 * Blocco braccia: transizione 20", giro 25", blocco 60".
 *
 * I recuperi sono i più corti della seduta e va bene che lo siano: bicipite e
 * tricipite sono antagonisti puri, quindi mentre uno lavora l'altro recupera
 * davvero. Il recupero reale per muscolo resta sopra i due minuti e mezzo.
 */
const BRACCIA: RestPrescription = {
  kind: 'superset',
  transitionMinSec: 20,
  transitionMaxSec: 20,
  roundRestSec: 25,
  blockRestSec: 60,
};

/** Finitura metabolica: 15" tra le stazioni, nessun recupero tra i giri. */
const FINITURA: RestPrescription = {
  kind: 'superset',
  transitionMinSec: 15,
  transitionMaxSec: 15,
  roundRestSec: 0,
  blockRestSec: 0,
};

/** Stazione isolata: il tempo indicato è tra le serie. */
const isolato = (restSec: number): RestPrescription => ({ kind: 'straight', restSec });

/* -------------------------------------------------------------------------- */
/* Riscaldamenti                                                               */
/* -------------------------------------------------------------------------- */

/*
 * Il riscaldamento è nella sequenza, non prima di essa.
 *
 * Nello Shadow erano quattro righe di testo da spuntare a occhio. Qui ogni
 * passo dichiara quanto dura o quante ripetizioni vuole, perché il player lo
 * attraversa con il countdown come tutto il resto: il giro di prova compreso,
 * che è la parte che la gente salta e che serve più di tutte.
 */

const ULTIMO_PASSO: WarmupStep = {
  label: 'Un giro del Tri-set A a metà carico e metà ripetizioni',
  seconds: 45,
  reps: null,
  perSide: false,
  hint: 'Non è una serie: è la prova che la prima vera non parta a freddo.',
};

const SCAPOLE: WarmupStep = {
  label: 'Scapular pull-up',
  exercise: 'scapular-pull-up',
  seconds: null,
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

const AFFONDI: WarmupStep = {
  label: 'Affondo con rotazione',
  exercise: 'affondo-con-rotazione',
  seconds: null,
  reps: 6,
  perSide: true,
  hint: 'Ruota il torace da fondo affondo, non prima.',
};

/**
 * Dieci swing con il kettlebell da 16, eseguiti per la tecnica.
 *
 * «Tecnici» è terminologia di riscaldamento: si fanno per ripassare lo schema,
 * non per fare fatica. Carico leggero, nessuno sforzo, attenzione tutta
 * sull'esecuzione — l'opposto di una serie di lavoro. Il 16 è il peso della
 * campana, non il numero di ripetizioni: quelle sono dieci.
 */
const SWING_TECNICO: WarmupStep = {
  label: 'Swing con kettlebell 16 kg, tecnici',
  exercise: 'kb-swing',
  seconds: null,
  reps: 10,
  perSide: false,
  hint: 'Cerniera, non squat: il peso va indietro tra le gambe, alto e vicino all’inguine. Nessuno sforzo.',
};

const CERNIERA: WarmupStep = {
  label: 'Stacco rumeno con manubri leggeri, tecnico',
  exercise: 'stacco-rumeno-manubri',
  seconds: null,
  reps: 10,
  perSide: false,
  hint: 'Anche indietro, tibie verticali. Serve la tecnica, non il carico.',
};

/* -------------------------------------------------------------------------- */
/* Le 4 sedute                                                                 */
/* -------------------------------------------------------------------------- */

/*
 * Ordine delle stazioni: per fattore limitante, non per muscolo.
 *
 * Due stazioni che dipendono dalla presa non sono mai una dopo l'altra, o il
 * circuito diventa un test di avambracci e la seconda viene interrotta da
 * qualcosa che non è il muscolo che si vuole allenare. Per lo stesso motivo i
 * picchi sistemici — le stazioni che alzano la frequenza cardiaca — sono
 * separati da stazioni locali.
 */

const SEDUTA_1: readonly ProgramBlock[] = [
  {
    code: 'A1',
    group: 'A',
    pairing: 'superset',
    exercise: 'trazioni-prona-presa-media',
    sets: 3,
    prescription: { kind: 'reps', min: 6, max: 10 },
    reference: 'Circuito · tri-set di forza',
    tut: '3-0-1-0',
    rir: '1-2',
    rest: FORZA,
    perSide: false,
    variantNote:
      'Scegli il gradino su cui il tuo massimo tecnico cade tra 6 e 10. Con un massimo di 4 trazioni complete il gradino giusto è quello assistito, non le trazioni complete a ripetizioni spezzate.',
  },
  {
    code: 'A2',
    group: 'A',
    pairing: 'superset',
    exercise: 'bulgarian-split-squat',
    sets: 3,
    prescription: { kind: 'reps', min: 6, max: 10 },
    reference: 'Circuito · tri-set di forza',
    tut: '3-1-1-0',
    rir: '1-2',
    rest: FORZA,
    perSide: true,
  },
  {
    code: 'A3',
    group: 'A',
    pairing: 'superset',
    exercise: 'dip-parallele-anelli',
    sets: 3,
    prescription: { kind: 'reps', min: 6, max: 10 },
    reference: 'Circuito · tri-set di forza',
    tut: '3-0-1-0',
    rir: '1-2',
    rest: FORZA,
    perSide: false,
  },
  {
    code: 'B1',
    group: 'B',
    pairing: 'superset',
    exercise: 'pull-over-trx',
    sets: 3,
    prescription: { kind: 'reps', min: 12, max: 18 },
    reference: 'Circuito · tri-set di volume',
    tut: '2-0-1-0',
    rir: '1-2',
    rest: VOLUME,
    perSide: false,
    variantNote:
      'Qui l’ampiezza dorsale si allena senza che il bicipite sia il limite: i gomiti restano quasi dritti.',
  },
  {
    code: 'B2',
    group: 'B',
    pairing: 'superset',
    exercise: 'goblet-squat',
    sets: 3,
    prescription: { kind: 'reps', min: 12, max: 18 },
    reference: 'Circuito · tri-set di volume',
    tut: '2-0-1-0',
    rir: '1-2',
    rest: VOLUME,
    perSide: false,
  },
  {
    code: 'B3',
    group: 'B',
    pairing: 'superset',
    exercise: 'push-up',
    sets: 3,
    prescription: { kind: 'reps', min: 12, max: 18 },
    reference: 'Circuito · tri-set di volume',
    tut: '2-0-1-0',
    rir: '1-2',
    rest: VOLUME,
    perSide: false,
  },
  {
    code: 'C1',
    group: 'C',
    pairing: 'superset',
    exercise: 'curl-martello-manubri',
    sets: 3,
    prescription: { kind: 'reps', min: 10, max: 14 },
    reference: 'Circuito · blocco braccia',
    tut: '2-0-1-1',
    rir: '0-1',
    rest: BRACCIA,
    perSide: false,
    variantNote:
      'Presa neutra per il brachiale: è il muscolo che allarga il braccio visto di fronte, ed è il più trascurato dei tre.',
  },
  {
    code: 'C2',
    group: 'C',
    pairing: 'superset',
    exercise: 'estensione-tricipiti-sopra-testa',
    sets: 3,
    prescription: { kind: 'reps', min: 10, max: 14 },
    reference: 'Circuito · blocco braccia',
    tut: '3-0-1-0',
    rir: '0-1',
    rest: BRACCIA,
    perSide: false,
    variantNote:
      'Sopra la testa, non ai fianchi: è l’unica posizione che allunga il capo lungo, che è la parte più grossa del tricipite.',
  },
  {
    code: 'D',
    group: 'D',
    pairing: 'single',
    exercise: 'suitcase-carry',
    sets: 2,
    prescription: { kind: 'seconds', min: 30, max: 40 },
    reference: 'Circuito · anti-flessione laterale',
    tut: 'isometrico',
    rir: '—',
    rest: isolato(30),
    perSide: true,
    workSeconds: 30,
    variantNote:
      'È l’unico esercizio della scheda che lavora la vita nel verso giusto: carico alto, zero ipertrofia degli obliqui. Il lavoro è nel non piegarsi.',
  },
  {
    code: 'F1',
    group: 'F',
    pairing: 'superset',
    exercise: 'corda-battaglia-onde-alternate',
    sets: 2,
    prescription: { kind: 'seconds', min: 30, max: 30 },
    reference: 'Circuito · finitura metabolica',
    tut: 'isometrico',
    rir: '—',
    rest: FINITURA,
    perSide: false,
    workSeconds: 30,
    excludeFromReview: true,
    alternatives: [{ exercise: 'jumping-jack', prescription: { kind: 'seconds', min: 30, max: 30 } }],
  },
  {
    code: 'F2',
    group: 'F',
    pairing: 'superset',
    exercise: 'step-rapidi-box',
    sets: 2,
    prescription: { kind: 'seconds', min: 30, max: 30 },
    reference: 'Circuito · finitura metabolica',
    tut: 'isometrico',
    rir: '—',
    rest: FINITURA,
    perSide: false,
    workSeconds: 30,
    excludeFromReview: true,
  },
  {
    code: 'F3',
    group: 'F',
    pairing: 'superset',
    exercise: 'kb-swing',
    sets: 2,
    prescription: { kind: 'reps', min: 15, max: 20 },
    reference: 'Circuito · finitura metabolica',
    tut: 'controllato',
    rir: '—',
    rest: FINITURA,
    perSide: false,
    workSeconds: 30,
    excludeFromReview: true,
    variantNote:
      'Qui serve la forza d’anca, non il braccio: se in alto senti le spalle bruciare lo stai alzando invece di lanciarlo. La serie finisce quando la lombare comincia a inarcarsi, anche se il timer no.',
    alternatives: [{ exercise: 'mountain-climber', prescription: { kind: 'seconds', min: 30, max: 30 } }],
  },
];

const SEDUTA_2: readonly ProgramBlock[] = [
  {
    code: 'A1',
    group: 'A',
    pairing: 'superset',
    exercise: 'rematore-manubrio-un-braccio',
    sets: 3,
    prescription: { kind: 'reps', min: 6, max: 10 },
    reference: 'Circuito · tri-set di forza',
    tut: '3-0-1-1',
    rir: '1-2',
    rest: FORZA,
    perSide: true,
  },
  {
    code: 'A2',
    group: 'A',
    pairing: 'superset',
    exercise: 'nordic-curl',
    sets: 3,
    prescription: { kind: 'reps', min: 6, max: 10 },
    reference: 'Circuito · tri-set di forza',
    tut: '3-0-1-0',
    rir: '1-2',
    rest: FORZA,
    perSide: false,
  },
  {
    code: 'A3',
    group: 'A',
    pairing: 'superset',
    exercise: 'pike-pushup-piedi-rialzati',
    sets: 3,
    prescription: { kind: 'reps', min: 6, max: 10 },
    reference: 'Circuito · tri-set di forza',
    tut: '3-0-1-0',
    rir: '1-2',
    rest: FORZA,
    perSide: false,
  },
  {
    code: 'B1',
    group: 'B',
    pairing: 'superset',
    exercise: 'rematore-inverso-trx',
    sets: 3,
    prescription: { kind: 'reps', min: 12, max: 18 },
    reference: 'Circuito · tri-set di volume',
    tut: '2-0-1-1',
    rir: '1-2',
    rest: VOLUME,
    perSide: false,
  },
  {
    code: 'B2',
    group: 'B',
    pairing: 'superset',
    exercise: 'sissy-squat',
    sets: 3,
    prescription: { kind: 'reps', min: 12, max: 18 },
    reference: 'Circuito · tri-set di volume',
    tut: '3-0-1-0',
    rir: '1-2',
    rest: VOLUME,
    perSide: false,
  },
  {
    code: 'B3',
    group: 'B',
    pairing: 'superset',
    exercise: 'alzate-laterali-elastico',
    sets: 3,
    prescription: { kind: 'reps', min: 12, max: 18 },
    reference: 'Circuito · tri-set di volume',
    tut: '2-0-1-1',
    rir: '0-1',
    rest: VOLUME,
    perSide: false,
    variantNote:
      'Il deltoide laterale è il muscolo con più leva sulla silhouette: allarga la spalla, e il rapporto spalla-vita è il numero che si legge come «vita sottile».',
  },
  {
    code: 'C1',
    group: 'C',
    pairing: 'superset',
    exercise: 'chin-up-presa-supina-stretta',
    sets: 3,
    prescription: { kind: 'reps', min: 6, max: 10 },
    reference: 'Circuito · blocco braccia',
    tut: '3-0-1-0',
    rir: '0-1',
    rest: BRACCIA,
    perSide: false,
    variantNote:
      'Bicipite sotto carico alto: qui il gradino assistito è la norma, non un ripiego.',
  },
  {
    code: 'C2',
    group: 'C',
    pairing: 'superset',
    exercise: 'dip-panche',
    sets: 3,
    prescription: { kind: 'reps', min: 10, max: 14 },
    reference: 'Circuito · blocco braccia',
    tut: '2-0-1-0',
    rir: '0-1',
    rest: BRACCIA,
    perSide: false,
  },
  {
    code: 'D',
    group: 'D',
    pairing: 'single',
    exercise: 'pallof-press-elastico',
    sets: 2,
    prescription: { kind: 'seconds', min: 30, max: 40 },
    reference: 'Circuito · anti-rotazione',
    tut: 'isometrico',
    rir: '—',
    rest: isolato(30),
    perSide: true,
    workSeconds: 30,
  },
  {
    code: 'F1',
    group: 'F',
    pairing: 'superset',
    exercise: 'jumping-jack',
    sets: 2,
    prescription: { kind: 'seconds', min: 30, max: 30 },
    reference: 'Circuito · finitura metabolica',
    tut: 'isometrico',
    rir: '—',
    rest: FINITURA,
    perSide: false,
    workSeconds: 30,
    excludeFromReview: true,
  },
  {
    code: 'F2',
    group: 'F',
    pairing: 'superset',
    exercise: 'mountain-climber',
    sets: 2,
    prescription: { kind: 'seconds', min: 30, max: 30 },
    reference: 'Circuito · finitura metabolica',
    tut: 'isometrico',
    rir: '—',
    rest: FINITURA,
    perSide: false,
    workSeconds: 30,
    excludeFromReview: true,
  },
  {
    code: 'F3',
    group: 'F',
    pairing: 'superset',
    exercise: 'step-rapidi-box',
    sets: 2,
    prescription: { kind: 'seconds', min: 30, max: 30 },
    reference: 'Circuito · finitura metabolica',
    tut: 'isometrico',
    rir: '—',
    rest: FINITURA,
    perSide: false,
    workSeconds: 30,
    excludeFromReview: true,
  },
];

const SEDUTA_3: readonly ProgramBlock[] = [
  {
    code: 'A1',
    group: 'A',
    pairing: 'superset',
    exercise: 'croci-elastico-o-pushup-presa-larga',
    sets: 3,
    prescription: { kind: 'reps', min: 10, max: 14 },
    reference: 'Circuito · tri-set di volume',
    tut: '3-0-1-1',
    rir: '0-1',
    rest: VOLUME,
    perSide: false,
  },
  {
    code: 'A2',
    group: 'A',
    pairing: 'superset',
    exercise: 'step-up-box-alto',
    sets: 3,
    prescription: { kind: 'reps', min: 10, max: 14 },
    reference: 'Circuito · tri-set di volume',
    tut: '2-0-1-0',
    rir: '1-2',
    rest: VOLUME,
    perSide: true,
  },
  {
    code: 'A3',
    group: 'A',
    pairing: 'superset',
    exercise: 'face-pull-elastico',
    sets: 3,
    prescription: { kind: 'reps', min: 12, max: 16 },
    reference: 'Circuito · tri-set di volume',
    tut: '2-0-1-1',
    rir: '1-2',
    rest: VOLUME,
    perSide: false,
    variantNote:
      'Non è un esercizio estetico: bilancia le spinte della settimana e tiene la spalla dove deve stare.',
  },
  {
    code: 'B1',
    group: 'B',
    pairing: 'superset',
    exercise: 'rematore-inverso-trx-piedi-rialzati',
    sets: 3,
    prescription: { kind: 'reps', min: 12, max: 18 },
    reference: 'Circuito · tri-set di volume',
    tut: '2-0-1-1',
    rir: '1-2',
    rest: VOLUME,
    perSide: false,
  },
  {
    code: 'B2',
    group: 'B',
    pairing: 'superset',
    exercise: 'wall-sit',
    sets: 3,
    prescription: { kind: 'seconds', min: 40, max: 60 },
    reference: 'Circuito · tri-set di volume',
    tut: 'isometrico',
    rir: '—',
    rest: VOLUME,
    perSide: false,
    workSeconds: 40,
  },
  {
    code: 'B3',
    group: 'B',
    pairing: 'superset',
    exercise: 'pushup-archer-o-pseudo-planche',
    sets: 3,
    prescription: { kind: 'reps', min: 10, max: 14 },
    reference: 'Circuito · tri-set di volume',
    tut: '3-0-1-0',
    rir: '0-1',
    rest: VOLUME,
    perSide: false,
  },
  {
    code: 'C1',
    group: 'C',
    pairing: 'superset',
    exercise: 'curl-elastico-presa-neutra',
    sets: 3,
    prescription: { kind: 'reps', min: 12, max: 18 },
    reference: 'Circuito · blocco braccia',
    tut: '2-0-1-1',
    rir: '0-1',
    rest: BRACCIA,
    perSide: false,
  },
  {
    code: 'C2',
    group: 'C',
    pairing: 'superset',
    exercise: 'dip-panche-o-diamond-pushup',
    sets: 3,
    prescription: { kind: 'reps', min: 10, max: 14 },
    reference: 'Circuito · blocco braccia',
    tut: '2-0-1-0',
    rir: '0-1',
    rest: BRACCIA,
    perSide: false,
  },
  {
    code: 'D',
    group: 'D',
    pairing: 'single',
    exercise: 'hollow-hold',
    sets: 2,
    prescription: { kind: 'seconds', min: 30, max: 45 },
    reference: 'Circuito · core anteriore',
    tut: 'isometrico',
    rir: '—',
    rest: isolato(30),
    perSide: false,
    workSeconds: 30,
  },
  {
    code: 'F1',
    group: 'F',
    pairing: 'superset',
    exercise: 'mountain-climber',
    sets: 2,
    prescription: { kind: 'seconds', min: 30, max: 30 },
    reference: 'Circuito · finitura metabolica',
    tut: 'isometrico',
    rir: '—',
    rest: FINITURA,
    perSide: false,
    workSeconds: 30,
    excludeFromReview: true,
  },
  {
    code: 'F2',
    group: 'F',
    pairing: 'superset',
    exercise: 'kb-swing',
    sets: 2,
    prescription: { kind: 'reps', min: 15, max: 20 },
    reference: 'Circuito · finitura metabolica',
    tut: 'controllato',
    rir: '—',
    rest: FINITURA,
    perSide: false,
    workSeconds: 30,
    excludeFromReview: true,
    variantNote:
      'È l’unica catena posteriore della seduta: i blocchi di lavoro qui sono tutti spinta, quadricipiti e spalle.',
    alternatives: [{ exercise: 'jumping-jack', prescription: { kind: 'seconds', min: 30, max: 30 } }],
  },
  {
    code: 'F3',
    group: 'F',
    pairing: 'superset',
    exercise: 'corda-battaglia-onde-alternate',
    sets: 2,
    prescription: { kind: 'seconds', min: 30, max: 30 },
    reference: 'Circuito · finitura metabolica',
    tut: 'isometrico',
    rir: '—',
    rest: FINITURA,
    perSide: false,
    workSeconds: 30,
    excludeFromReview: true,
    alternatives: [{ exercise: 'jumping-jack', prescription: { kind: 'seconds', min: 30, max: 30 } }],
  },
];

const SEDUTA_4: readonly ProgramBlock[] = [
  {
    code: 'A1',
    group: 'A',
    pairing: 'superset',
    exercise: 'trazioni-presa-larga',
    sets: 3,
    prescription: { kind: 'reps', min: 6, max: 10 },
    reference: 'Circuito · tri-set di forza',
    tut: '3-0-1-0',
    rir: '1-2',
    rest: FORZA,
    perSide: false,
  },
  {
    code: 'A2',
    group: 'A',
    pairing: 'superset',
    exercise: 'single-leg-rdl',
    sets: 3,
    prescription: { kind: 'reps', min: 8, max: 12 },
    reference: 'Circuito · tri-set di forza',
    tut: '3-0-1-0',
    rir: '1-2',
    rest: FORZA,
    perSide: true,
  },
  {
    code: 'A3',
    group: 'A',
    pairing: 'superset',
    exercise: 'hip-thrust-monopodalico',
    sets: 3,
    prescription: { kind: 'reps', min: 8, max: 10 },
    reference: 'Circuito · tri-set di forza',
    tut: '2-0-1-0',
    rir: '1-2',
    rest: FORZA,
    perSide: true,
  },
  {
    code: 'B1',
    group: 'B',
    pairing: 'superset',
    exercise: 'pull-over-trx',
    sets: 3,
    prescription: { kind: 'reps', min: 12, max: 18 },
    reference: 'Circuito · tri-set di volume',
    tut: '2-0-1-0',
    rir: '1-2',
    rest: VOLUME,
    perSide: false,
  },
  {
    code: 'B2',
    group: 'B',
    pairing: 'superset',
    exercise: 'goblet-squat',
    sets: 3,
    prescription: { kind: 'reps', min: 12, max: 18 },
    reference: 'Circuito · tri-set di volume',
    tut: '2-0-1-0',
    rir: '1-2',
    rest: VOLUME,
    perSide: false,
    variantNote:
      'Qui c’era il calf monopodalico. A 12-18 ripetizioni per lato costava sei minuti di lavoro su un muscolo che il programma deve solo mantenere, e il mantenimento gli arriva dagli step al box e dai jumping jack delle quattro finiture. Al suo posto il secondo richiamo settimanale ai quadricipiti, che erano il gruppo più scoperto.',
  },
  {
    code: 'B3',
    group: 'B',
    pairing: 'superset',
    exercise: 'alzate-laterali-elastico',
    sets: 3,
    prescription: { kind: 'reps', min: 12, max: 18 },
    reference: 'Circuito · tri-set di volume',
    tut: '2-0-1-1',
    rir: '0-1',
    rest: VOLUME,
    perSide: false,
  },
  {
    code: 'C1',
    group: 'C',
    pairing: 'superset',
    exercise: 'chin-up-presa-supina',
    sets: 3,
    prescription: { kind: 'reps', min: 8, max: 12 },
    reference: 'Circuito · blocco braccia',
    tut: '2-0-1-1',
    rir: '0-1',
    rest: BRACCIA,
    perSide: false,
  },
  {
    code: 'C2',
    group: 'C',
    pairing: 'superset',
    exercise: 'estensione-tricipiti-sopra-testa',
    sets: 3,
    prescription: { kind: 'reps', min: 10, max: 14 },
    reference: 'Circuito · blocco braccia',
    tut: '3-0-1-0',
    rir: '0-1',
    rest: BRACCIA,
    perSide: false,
  },
  {
    code: 'D',
    group: 'D',
    pairing: 'single',
    exercise: 'hanging-leg-raise',
    sets: 2,
    prescription: { kind: 'reps', min: 8, max: 14 },
    reference: 'Circuito · core anteriore',
    tut: '2-0-1-1',
    rir: '0-1',
    rest: isolato(30),
    perSide: false,
  },
  {
    code: 'F1',
    group: 'F',
    pairing: 'superset',
    exercise: 'step-rapidi-box',
    sets: 2,
    prescription: { kind: 'seconds', min: 30, max: 30 },
    reference: 'Circuito · finitura metabolica',
    tut: 'isometrico',
    rir: '—',
    rest: FINITURA,
    perSide: false,
    workSeconds: 30,
    excludeFromReview: true,
  },
  {
    code: 'F2',
    group: 'F',
    pairing: 'superset',
    exercise: 'corda-battaglia-onde-alternate',
    sets: 2,
    prescription: { kind: 'seconds', min: 30, max: 30 },
    reference: 'Circuito · finitura metabolica',
    tut: 'isometrico',
    rir: '—',
    rest: FINITURA,
    perSide: false,
    workSeconds: 30,
    excludeFromReview: true,
    /*
     * Niente swing qui, pur essendo disponibile: questa seduta ha già il
     * single-leg RDL e l'hip thrust nel Tri-set A. Una terza cerniera d'anca
     * a fine seduta, con la lombare stanca, è il modo in cui ci si fa male
     * facendo tutto giusto.
     */
    alternatives: [{ exercise: 'jumping-jack', prescription: { kind: 'seconds', min: 30, max: 30 } }],
  },
  {
    code: 'F3',
    group: 'F',
    pairing: 'superset',
    exercise: 'jumping-jack',
    sets: 2,
    prescription: { kind: 'seconds', min: 30, max: 30 },
    reference: 'Circuito · finitura metabolica',
    tut: 'isometrico',
    rir: '—',
    rest: FINITURA,
    perSide: false,
    workSeconds: 30,
    excludeFromReview: true,
  },
];

export const CIRCUIT_SESSIONS: readonly ProgramSession[] = Object.freeze([
  {
    id: 'circuito-1',
    weekday: null,
    name: 'Seduta 1',
    focus: 'tirare e spingere, forza',
    kind: 'circuit',
    estimatedMinutes: 40,
    warmup: [],
    warmupSteps: [
      {
        label: 'Corda da battaglia, onde alternate leggere',
        exercise: 'corda-battaglia-onde-alternate',
        seconds: 60,
        reps: null,
        perSide: false,
        hint: 'Senza corda: jumping jack. Serve ad alzare la temperatura, non a stancare.',
      },
      SCAPOLE,
      CIRCONDUZIONI,
      SWING_TECNICO,
      AFFONDI,
      ULTIMO_PASSO,
    ],
    blocks: SEDUTA_1,
  },
  {
    id: 'circuito-2',
    weekday: null,
    name: 'Seduta 2',
    focus: 'spessore e spinta alta, forza',
    kind: 'circuit',
    estimatedMinutes: 40,
    warmup: [],
    warmupSteps: [
      {
        label: 'Jumping jack',
        exercise: 'jumping-jack',
        seconds: 60,
        reps: null,
        perSide: false,
        hint: 'Range completo: braccia che arrivano sopra la testa.',
      },
      SCAPOLE,
      CIRCONDUZIONI,
      AFFONDI,
      ULTIMO_PASSO,
    ],
    blocks: SEDUTA_2,
  },
  {
    id: 'circuito-3',
    weekday: null,
    name: 'Seduta 3',
    focus: 'volume di spinta e spalle',
    kind: 'circuit',
    estimatedMinutes: 40,
    warmup: [],
    warmupSteps: [
      {
        label: 'Step rapidi al box',
        exercise: 'step-rapidi-box',
        seconds: 60,
        reps: null,
        perSide: false,
        hint: 'Pianta piena sul box, busto eretto.',
      },
      CIRCONDUZIONI,
      CERNIERA,
      AFFONDI,
      ULTIMO_PASSO,
    ],
    blocks: SEDUTA_3,
  },
  {
    id: 'circuito-4',
    weekday: null,
    name: 'Seduta 4',
    focus: 'dorsali e catena posteriore',
    kind: 'circuit',
    estimatedMinutes: 40,
    warmup: [],
    warmupSteps: [
      {
        label: 'Mountain climber',
        exercise: 'mountain-climber',
        seconds: 60,
        reps: null,
        perSide: false,
        hint: 'Bacino fermo: se rimbalza, rallenta.',
      },
      SCAPOLE,
      CIRCONDUZIONI,
      CERNIERA,
      ULTIMO_PASSO,
    ],
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
