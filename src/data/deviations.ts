/**
 * Dove l'app si discosta dalla scheda, e perché.
 *
 * I test di trascrizione confrontano riga per riga il seed con una seconda
 * trascrizione indipendente del foglio Excel. È il controllo che ha impedito
 * a decine di refusi di arrivare in palestra, e va tenuto severo.
 *
 * Ma qualche differenza è voluta: l'utente cambia idea su un esercizio, e ha
 * ragione a farlo. Il rischio è che per far passare i test si modifichi la
 * seconda trascrizione, cioè si cancelli la prova che serviva a
 * proteggere. Da quel momento il controllo non controlla più niente.
 *
 * Quindi ogni deviazione voluta si dichiara qui, con il testo della scheda,
 * quello dell'app e il motivo. I test applicano questa lista e restano severi
 * su tutto il resto: qualunque altra differenza continua a farli fallire.
 */

import type { LevelIndex, MotorPattern, SessionId } from '../types/index.ts';

export interface Deviazione {
  /** Come lo scrive la scheda. */
  readonly scheda: string;
  /** Come lo scrive l'app. */
  readonly app: string;
  readonly motivo: string;
}

export const DEVIAZIONI: readonly Deviazione[] = [
  {
    scheda: 'Alzate laterali con elastico',
    app: 'Alzate laterali con manubri',
    motivo:
      'Scelta dell’utente: il manubrio dà un carico costante invece di crescere verso la fine del movimento, ed è più facile da dosare. Il peso si registra ma non è zavorra: non segue i passi da 2,5 kg e non entra nell’ordine delle leve.',
  },
  {
    scheda: 'Dip tra due panche o diamond push-up',
    app: 'Diamond push-up',
    motivo:
      'Divisi in due esercizi: un titolo che ne nomina due non dice quale stai facendo. Il diamond push-up è il primo perché il blocco arriva terzo a RIR 0-1, dopo dip alle parallele e pike push-up, e il dip su panca porta la spalla stanca in estensione e rotazione interna profonda, che è la posizione con meno spazio nell’articolazione. Il dip su panca resta scegliibile nel blocco, come esercizio suo: ha i suoi cue, il suo disegno e il suo storico, ed è il gradino 1 della scala dei dip, dove il diamond push-up non sta.',
  },
  {
    scheda: 'Dip alle parallele o agli anelli',
    app: 'Dip alle parallele',
    motivo:
      'Un titolo, un esercizio. Gli anelli non sono un secondo nome della stessa cosa: sono il gradino 5 della scala dei dip, due gradini sopra le parallele. Stavano nel titolo e nella scala insieme, e nel titolo davano l’idea che fossero equivalenti.',
  },
  {
    scheda: 'Push-up archer o pseudo-planche',
    app: 'Push-up archer',
    motivo:
      'Un titolo, un esercizio. Lo pseudo-planche è il gradino 4 della spinta orizzontale, l’archer il 5: la scelta tra i due è un livello della scala, non un secondo nome, e dalla riga Variante/Livello si scende di un gradino in un tap.',
  },
  {
    scheda: 'Negative di HSPU al muro (5") o pike push-up',
    app: 'Negative di HSPU al muro (5")',
    motivo:
      'Un titolo, un esercizio. Il pike push-up è il gradino 1-2 della spinta verticale, le negative il 3: sono gradini della stessa scala, e tenerli nello stesso titolo nascondeva proprio il salto che rendeva la riga impossibile da tarare.',
  },
  {
    scheda: 'Shrimp squat o skater squat',
    app: 'Shrimp squat',
    motivo:
      'Un titolo, un esercizio. Lo skater squat è il gradino 4 della scala dello squat monopodalico, lo shrimp il 5: chi non regge lo shrimp scende di un gradino dalla riga Variante/Livello.',
  },
  {
    scheda: 'Ab wheel o rollout TRX',
    app: 'Ab wheel',
    motivo:
      'Divisi in due esercizi: stesso gesto, attrezzo diverso, e chi ha il TRX ma non la ruota non aveva dove registrare le sue serie. Il rollout al TRX resta scegliibile nel blocco.',
  },
  {
    scheda: 'Croci con elastico o push-up presa larga lenta',
    app: 'Croci con manubri',
    motivo:
      'Restano solo le croci. L’elastico è passato a manubri perché troppo leggero per stare dentro 12-15 a RIR 0-1. Il push-up a presa larga è invece uscito del tutto: nell’Upper B è la terza spinta orizzontale della seduta, dopo quattro serie di push-up al blocco A2 e tre di negative di HSPU al B2, tutte a RIR 0-1. A quel punto i tricipiti e il deltoide anteriore sono il fattore limitante e un’altra spinta aggiunge fatica, non stimolo. Le croci no: sono l’unico movimento della settimana che carica il petto in allungamento senza passare dai tricipiti, e il petto è il gruppo più sotto la fascia fra quelli che si allenano (14 serie contro 16-20).',
  },
  {
    scheda: 'Curl con elastico presa neutra',
    app: 'Curl con manubri presa neutra',
    motivo:
      'Scelta dell’utente: con l’elastico il carico era troppo leggero per arrivare a RIR 0-1 dentro 12-15 ripetizioni. Il peso si registra sempre ma non è zavorra, come per le alzate laterali: non segue i passi da 2,5 kg e non entra nell’ordine delle leve. L’illustrazione era già quella con i manubri.',
  },
  {
    scheda: 'Skill: hollow hold / L-sit / verticale al muro',
    app: 'Hollow hold',
    motivo:
      'Un titolo che nomina tre esercizi non dice quale stai facendo, e i tre hanno tecniche e storici diversi. Divisi su richiesta dell’utente: hollow hold, L-sit e verticale al muro sono tre skill separate, ognuna con la propria scala, e il blocco A dello Shadow le offre tutte e tre. L’hollow hold è quello già misurato dal test della settimana 0, quindi è lo stesso esercizio e il progresso non si sdoppia.',
  },
  {
    scheda: 'Sissy squat o wall sit isometrico 45"',
    app: 'Sissy squat',
    motivo:
      'Divisi in due esercizi su richiesta dell’utente: sono movimenti diversi e si misurano diversamente, il sissy squat a ripetizioni e il wall sit a secondi. Finché stavano su una riga sola l’app doveva sceglierne una misura per entrambi, e chi faceva il wall sit non aveva dove scrivere i secondi. Il wall sit resta la seconda scelta del blocco C2, con la sua prescrizione da 45" e il suo storico.',
  },
];

/** Il nome con cui l'app chiama quello che la scheda chiama `scheda`. */
export function applicaDeviazione(nomeDaScheda: string): string {
  return DEVIAZIONI.find((d) => d.scheda === nomeDaScheda)?.app ?? nomeDaScheda;
}

/* -------------------------------------------------------------------------- */
/* Deviazioni su un blocco                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Un blocco che resta lo stesso esercizio ma cambia prescrizione.
 *
 * Le deviazioni qui sopra sostituiscono un esercizio con un altro. Questa è
 * un'altra cosa: l'esercizio non si tocca, cambia quanto se ne fa. Serviva
 * una forma sua perché la trascrizione confronta anche la colonna delle
 * ripetizioni, e allungare un blocco senza dichiararlo avrebbe costretto a
 * ritoccare la seconda trascrizione del foglio, cioè a cancellare la prova.
 */
export interface DeviazioneBlocco {
  readonly sessione: SessionId;
  readonly codice: string;
  /** La prescrizione come la scrive la scheda, nel formato della trascrizione. */
  readonly scheda: string;
  /** Come la scrive l'app. */
  readonly app: string;
  /** Minuti stimati della seduta, prima e dopo, quando il cambio li sposta. */
  readonly minuti: { readonly scheda: number; readonly app: number } | null;
  readonly motivo: string;
}

export const DEVIAZIONI_BLOCCO: readonly DeviazioneBlocco[] = [
  {
    sessione: 'shadow',
    codice: 'F',
    scheda: 'dur:15',
    app: 'dur:30',
    minuti: { scheda: 48, app: 63 },
    motivo:
      'Scelta dell’utente: voleva una seconda uscita di corsa il sabato. Allungare il blocco che c’è già costa quindici minuti e non toglie niente; sostituire la seduta avrebbe cancellato face pull e dead hang, che non compaiono altrove nella settimana, e la skill isometrica. La corsa resta dopo la parte di forza e non il giorno dopo i nordic curl del venerdì.',
  },
];

/* -------------------------------------------------------------------------- */
/* Blocchi tolti                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Una riga della scheda che l'app non programma più.
 *
 * È la deviazione più pesante che esista — togliere lavoro — e per questo ha
 * una forma sua: la trascrizione del foglio resta intatta, con la sua riga, e
 * qui si dichiara che quella riga non viene eseguita e perché. Senza, l'unico
 * modo di far passare i test sarebbe cancellare la riga dalla seconda
 * trascrizione, cioè cancellare la prova che il blocco esisteva.
 */
export interface BloccoTolto {
  readonly sessione: SessionId;
  readonly codice: string;
  /** Minuti stimati della seduta, prima e dopo. */
  readonly minuti: { readonly scheda: number; readonly app: number };
  readonly motivo: string;
}

export const BLOCCHI_TOLTI: readonly BloccoTolto[] = [
  {
    sessione: 'upper-b',
    codice: 'D',
    minuti: { scheda: 58, app: 53 },
    motivo:
      'Terzo giorno di alzate laterali nella stessa settimana, su una spalla che il conteggio del volume dà già sopra la fascia del metodo: 22 serie contro un bersaglio di 16-20, e nove di quelle sono alzate laterali (4 il lunedì, questo blocco il giovedì, 4 il sabato). Questo è per di più in myo-reps a RIR 0, quindi pesa più di quanto la colonna «serie» dica, e arriva dopo le negative di HSPU dello stesso giorno. Intanto petto (14), quadricipiti (13), core (10,5) e polpacci (8) restano sotto la fascia: il tempo di questo blocco vale di più altrove. Le alzate laterali restano due volte a settimana, otto serie, che su un muscolo piccolo bastano.',
  },
];

/** `true` se quel blocco della scheda non viene programmato. */
export function bloccoTolto(sessione: SessionId, codice: string): boolean {
  return BLOCCHI_TOLTI.some((d) => d.sessione === sessione && d.codice === codice);
}

/* -------------------------------------------------------------------------- */
/* Scale di progressione aggiunte                                              */
/* -------------------------------------------------------------------------- */

/**
 * Le scale che il foglio non aveva, e perché sono state scritte.
 *
 * Le deviazioni qui sopra cambiano qualcosa che la scheda dice. Questa è
 * un'altra cosa: la scheda non diceva niente. Il foglio Scale_Progressioni ha
 * otto scale e prescriveva sei esercizi già nella loro forma avanzata — hip
 * thrust monopodalico, single-leg RDL, i due calf a una gamba, step-up su box
 * alto, sissy squat libero — senza nessun gradino più facile. Chi non ha mai
 * fatto la versione a due gambe non aveva niente da cui partire: nessun
 * livello, nessuna scala, nessun test, e quindi nemmeno un livello da
 * abbassare.
 *
 * I gradini sono stati dedotti dalla logica delle otto scale del foglio —
 * assistito, libero, monopodalico, con pausa, zavorrato — e vanno guardati con
 * l'occhio di chi li dovrà fare, non dati per buoni perché stanno nel codice.
 */
export interface ScalaAggiunta {
  /** Lo schema motorio nuovo. */
  readonly schema: string;
  /** Gli esercizi del programma che ora hanno un gradino da cui partire. */
  readonly esercizi: readonly string[];
  /** Il gradino che la scheda prescriveva, che resta l'obiettivo. */
  readonly obiettivo: string;
  readonly motivo: string;
}

/** Un gradino di scala che l'app scrive diversamente dal foglio Progressioni. */
export interface DeviazioneGradino {
  readonly schema: MotorPattern;
  readonly livello: LevelIndex;
  readonly scheda: string;
  readonly app: string;
  readonly motivo: string;
}

export const DEVIAZIONI_GRADINO: readonly DeviazioneGradino[] = [
  {
    schema: 'vertical-pull',
    livello: 1,
    scheda: 'Trazioni assistite con elastico',
    app: 'Trazioni assistite',
    motivo:
      'La scheda del circuito prescrive questo gradino con un piede sul box, non con l’elastico. Il gradino è lo stesso — trazione completa con un aiuto che toglie parte del peso — e il nome non deve escludere l’aiuto che la scheda usa: quale dei due, lo dice la nota del blocco.',
  },
  {
    schema: 'vertical-pull',
    livello: 5,
    scheda: 'Archer / L-sit pull-up',
    app: 'Archer pull-up',
    motivo:
      'Un gradino, un esercizio: l’archer pull-up e l’L-sit pull-up sono due gesti diversi, e un gradino che ne nomina due non dice cosa fare. Resta l’archer, che è la progressione della trazione; l’L-sit ha una scala sua.',
  },
  {
    schema: 'horizontal-push',
    livello: 6,
    scheda: 'Push-up zavorrati / anelli',
    app: 'Push-up zavorrati',
    motivo:
      'Gli anelli non sono un secondo nome della zavorra: sono un altro attrezzo. E la zavorra è la leva 5 del metodo, che si aggiunge a qualunque gradino: nominarla nel gradino la faceva sembrare una variante.',
  },
  {
    schema: 'single-leg-squat',
    livello: 6,
    scheda: 'Pistol squat / zavorra',
    app: 'Pistol squat',
    motivo:
      'Stesso motivo: la zavorra è una leva, non una variante. Il pistol squat è il gesto più difficile della scala e il gradino porta il suo nome; il carico si aggiunge dalla leva 5 quando la settimana lo sblocca.',
  },
  {
    schema: 'core',
    livello: 6,
    scheda: 'Ab wheel completo / L-sit',
    app: 'Ab wheel completo',
    motivo:
      'L’L-sit non è l’ab wheel con un altro nome: si progredisce aprendo le gambe, non allungando la leva del busto. Ha una scala sua, e il gradino del core torna a nominare un gesto solo.',
  },
];

/** Il nome che l'app dà a un gradino, se diverso da quello della scheda. */
export function applicaDeviazioneGradino(
  schema: MotorPattern,
  livello: LevelIndex,
  nomeDaScheda: string,
): string {
  const trovata = DEVIAZIONI_GRADINO.find(
    (d) => d.schema === schema && d.livello === livello && d.scheda === nomeDaScheda,
  );
  return trovata?.app ?? nomeDaScheda;
}

export const SCALE_AGGIUNTE: readonly ScalaAggiunta[] = [
  {
    schema: 'hip-thrust',
    esercizi: ['hip-thrust-monopodalico'],
    obiettivo: 'Hip thrust monopodalico, spalle su panca (gradino 4)',
    motivo:
      'La scheda prescriveva l’hip thrust su una gamba senza che esistesse quello a due. Si parte dal glute bridge a terra e si passa al monopodalico al terzo gradino, quando l’anca regge il movimento a due gambe con il range pieno.',
  },
  {
    schema: 'hip-hinge',
    esercizi: ['single-leg-rdl'],
    obiettivo: 'Single-leg RDL con pausa 2" in basso (gradino 5)',
    motivo:
      'Il single-leg RDL è un esercizio di equilibrio prima che di forza: la scheda lo prescriveva libero e con pausa. I primi gradini insegnano il movimento d’anca a due gambe e poi con una mano d’appoggio, che è quello che serve perché la pausa abbia senso.',
  },
  {
    schema: 'calf',
    esercizi: ['calf-monopodalico-rialzo', 'calf-monopodalico-seduto'],
    obiettivo: 'Monopodalico, range completo (gradino 4)',
    motivo:
      'I gradini non nominano la posizione, così la stessa scala serve al calf in piedi su rialzo e a quello seduto: il gesto è lo stesso, la posizione la dice il nome dell’esercizio. La scheda scriveva «monopodalico» per entrambi ma segnava per lato solo il primo: ora lo dice il gradino, quindi da monopodalico in su si registrano due lati su tutti e due.',
  },
  {
    schema: 'step-up',
    esercizi: ['step-up-box-alto'],
    obiettivo: 'Ginocchio+, discesa 2" senza slancio (gradino 3)',
    motivo:
      'La scheda partiva dal box all’altezza del ginocchio o più. L’altezza del box è la progressione più naturale che esista su questo esercizio, e il gradino 3 è quello che la scheda chiede: sopra ci sono il box più alto, la pausa e la zavorra.',
  },
  {
    schema: 'l-sit',
    esercizi: ['l-sit'],
    obiettivo: 'L-sit completo (gradino 5)',
    motivo:
      'Il foglio non ha una scala per l’L-sit: lo nomina come terzo nome del gradino 6 del core e nella riga «Skill» dello Shadow. Ma l’L-sit non si progredisce come il core: si sale aprendo le gambe — tuck, advanced tuck, una gamba distesa — e finché stava sul gradino dell’ab wheel il gradino più facile che l’app sapeva offrire era un plank.',
  },
  {
    schema: 'sissy-squat',
    esercizi: ['sissy-squat'],
    obiettivo: 'A corpo libero (gradino 3)',
    motivo:
      'Il sissy squat a corpo libero chiede un controllo del ginocchio che non si improvvisa: i primi due gradini lo fanno con una e due mani d’appoggio. Il gradino 6 non è zavorrato ma con eccentrica 5", perché un peso su un ginocchio già molto flesso aggiunge taglio sull’articolazione senza aggiungere lavoro ai quadricipiti.',
  },
];

/** La prescrizione che l'app dà a un blocco, se diversa da quella della scheda. */
export function applicaDeviazioneBlocco(
  sessione: SessionId,
  codice: string,
  prescrizioneDaScheda: string,
): string {
  const trovata = DEVIAZIONI_BLOCCO.find(
    (d) => d.sessione === sessione && d.codice === codice && d.scheda === prescrizioneDaScheda,
  );
  return trovata?.app ?? prescrizioneDaScheda;
}

/** I minuti stimati che l'app dà a una seduta, se diversi da quelli della scheda. */
export function applicaDeviazioneMinuti(sessione: SessionId, minutiDaScheda: number): number {
  const spostati = DEVIAZIONI_BLOCCO.find(
    (d) => d.sessione === sessione && d.minuti?.scheda === minutiDaScheda,
  );
  if (spostati?.minuti !== undefined && spostati.minuti !== null) return spostati.minuti.app;

  const tolto = BLOCCHI_TOLTI.find(
    (d) => d.sessione === sessione && d.minuti.scheda === minutiDaScheda,
  );
  return tolto?.minuti.app ?? minutiDaScheda;
}

/* -------------------------------------------------------------------------- */
/* Note delle sedute                                                           */
/* -------------------------------------------------------------------------- */

/** Una nota di seduta che l'app scrive diversamente dalla scheda (L26). */
export interface DeviazioneNota {
  readonly sessione: SessionId;
  /** La nota della scheda, parola per parola; `null` se la scheda non ne ha. */
  readonly scheda: string | null;
  /** La nota dell'app; `null` se l'app la toglie. */
  readonly app: string | null;
  readonly motivo: string;
}

export const DEVIAZIONI_NOTA: readonly DeviazioneNota[] = [
  {
    sessione: 'circuito-1',
    scheda: 'A fine terzo giro del Tri-set A, dentro la pausa di blocco: 2 trazioni negative da 5" di eccentrica.',
    app: null,
    motivo:
      'Il player la dice dove serve: è l’istruzione della pausa del blocco A, al terzo giro (2026-11-12). Come nota della seduta si leggeva prima di cominciare, quando non serve.',
  },
  {
    sessione: 'circuito-2',
    scheda: 'È la più corta delle quattro. I minuti di margine sono il posto giusto per 2 serie opzionali di alzate laterali (12-18, RIR 0-1, 30" tra le due), in coda al Tri-set B.',
    app: 'I minuti di margine sono il posto giusto per 2 serie opzionali di alzate laterali (12-18, RIR 0-1, 30" tra le due), in coda al Tri-set B.',
    motivo:
      'Nell’app la seduta più corta è la 3 (36:18 contro 36:55 a tempo e pausa della scheda): la frase della scheda non è più vera.',
  },
  {
    sessione: 'circuito-4',
    scheda: 'È la più lunga delle quattro, per le due stazioni unilaterali del Tri-set A. Se sfori i 40 minuti togli 2 ripetizioni al rematore, non il recupero.',
    app: 'È la più lunga delle quattro. Con tempo e pausa accumulati può arrivare a 55 minuti: oltre, il metodo non aggiunge altro tempo e passa alla leva successiva. Quando l’hip thrust passa ai gradini su una gamba, che si fanno per lato, può arrivare a circa 59 minuti. Non togliere ripetizioni né recupero.',
    motivo:
      'Togliere 2 ripetizioni al rematore gli impedisce di chiudere il massimo del range, e senza il massimo il rematore non progredisce più (E1, M19). Al posto del taglio c’è il tetto di 55 minuti deciso da Alessio il 2026-11-20 (D-22 a, R19): oltre, il metodo non propone più tempo e pausa. La variante dell’hip thrust su una gamba può portare la seduta a circa 59 minuti (D5, Alessio, 2026-11-20). Le stazioni per lato del Tri-set A sono due solo dal gradino 3 dell’hip thrust: nell’app si parte a due gambe.',
  },
];

/** La nota che l'app dà a una seduta, se diversa da quella della scheda. */
export function applicaDeviazioneNota(sessione: SessionId, notaDaScheda: string | null): string | null {
  const trovata = DEVIAZIONI_NOTA.find((d) => d.sessione === sessione && d.scheda === notaDaScheda);
  return trovata === undefined ? notaDaScheda : trovata.app;
}
