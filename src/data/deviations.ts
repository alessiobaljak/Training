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
