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
