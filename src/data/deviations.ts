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

import type { SessionId } from '../types/index.ts';

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
    app: 'Diamond push-up o dip tra due panche',
    motivo:
      'Scelta dell’utente: stesse due varianti della scheda, ordine invertito. Il blocco arriva terzo a RIR 0-1 dopo dip alle parallele e pike push-up, e il dip su panca porta la spalla stanca in estensione e rotazione interna profonda. Il diamond push-up allena gli stessi tricipiti senza quella posizione. Il dip su panca resta come alternativa.',
  },
  {
    scheda: 'Croci con elastico o push-up presa larga lenta',
    app: 'Croci con manubri',
    motivo:
      'Divisi in due esercizi su richiesta dell’utente: le croci si fanno con un peso in mano e il peso va scritto, il push-up a presa larga è a corpo libero. Uniti costringevano a una sola politica di carico per entrambi, e vinceva «niente carico»: chi usava i manubri non aveva dove registrarli. L’elastico è passato a manubri perché troppo leggero per stare dentro 12-15 a RIR 0-1. Il push-up resta la seconda scelta del blocco C1.',
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
  const trovata = DEVIAZIONI_BLOCCO.find(
    (d) => d.sessione === sessione && d.minuti?.scheda === minutiDaScheda,
  );
  return trovata?.minuti?.app ?? minutiDaScheda;
}
