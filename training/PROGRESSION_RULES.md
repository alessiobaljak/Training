# PROGRESSION_RULES.md — soglie di progressione

Versione **progressione 1.0 — PROPOSTA del 2026-11-08, non approvata.**
Aggiunta del 2026-11-12 `[PROPOSTA, progressione 1.1]`: salto dei gradini solo
eccentrici nei range fissi (§5, T2). Gradino di partenza: PROGRAM_RULES R1.
Motore: `src/engine/progression.ts` (fine seduta), `src/engine/review.ts`
(fine settimana), `src/engine/loading.ts` (zavorra).

Ogni soglia qui è un numero, non un giudizio. Dove c'è `[PROPOSTA]` la regola
oggi non esiste.

## 1. Condizione di avanzamento (fine seduta)

`[IN CODICE]` `evaluateProgression`

Avanza **solo se entrambe** sono vere:
- `ripetizioni ≥ massimo del range` su **tutte** le serie registrate;
- `tempoRespected === true`, risposto esplicitamente.

`null` non vale come sì: senza risposta sul tempo la leva 1 non è esaurita.
Nessun range nel blocco (cedimento, myo-reps, durata) ⇒ la regola non si applica.

## 2. Quale leva (fine seduta)

`[IN CODICE]` La prima disponibile nell'ordine `reps → tempo → iso-pause →
variant → load`. Indisponibilità e motivo:

| leva | indisponibile quando |
|---|---|
| tempo | TUT non a quattro fasi · eccentrica `X` · eccentrica ≥ **5"** |
| iso-pause | TUT non a quattro fasi · fase `X` · pausa ≥ **2"** |
| variant | `pattern === null` · gradino = **6** |
| load | `loadPolicy = inherent` o `forbidden` · settimana < **3** · massimale sotto la soglia «sconsigliata» |

Esaurite tutte: nessun suggerimento, e il testo dice che serve un cambio di
programmazione, non un altro giro.

## 3. Zavorra

`[IN CODICE]` `src/data/method.ts`, `src/engine/loading.ts`
- Passo unico **2,5 kg**. Nessun altro valore è proponibile.
- Bloccata come leva fino alla **settimana 3**; il peso usato resta sempre
  **scrivibile** (`recordable`), anche quando non è una leva.
- Soglie: trazione verticale necessaria sopra **15** rip, sconsigliata sotto
  **8**; dip necessaria sopra **18**, sconsigliata sotto **10**. Altri schemi:
  nessuna soglia, `unknown`.
- Carico di partenza proposto: `2,5 × round((massimale − 10) / 2,5)`, 0 se
  massimale ≤ 10. È una proposta ricavata da tre righe di tabella, non una legge.
- Calibrazione sul fatto: bersaglio **6-8 rip a RIR 1**; media ≥ **10** ⇒ +2,5 kg;
  media ≤ **4** ⇒ −2,5 kg; in mezzo si tiene. Media su tutte le serie, non
  sull'ultima.

`[PROPOSTA]` Tetto di sicurezza mancante: **mai più di +2,5 kg a settimana per
esercizio**, e mai zavorra su un esercizio il cui gradino è cambiato nei 7
giorni precedenti. Oggi niente lo impedisce.

## 4. Quando la variante scavalca tempo e pause

`[IN CODICE]` Il gradino si considera «troppo facile» e la variante passa davanti
quando l'esercizio si misura in ripetizioni, la variante è disponibile e almeno
uno dei tre segnali misurati è vero:
1. **ogni** serie sopra il massimo del range (non solo a toccarlo);
2. media ≥ **25** ripetizioni (soglia resistenza);
3. **ogni** serie registrata con `rir > rir.max` prescritto.

Tempo e pause restano elencate ma dichiarate scavalcate, con il motivo.

## 5. Verdetti di fine settimana

`[IN CODICE]` `reviewWeek`, su esercizio, con almeno **3 serie** nella settimana
(`MIN_SETS_FOR_VERDICT`) e un range confrontabile:

| verdetto | condizione | effetto accettando |
|---|---|---|
| `scendi-di-livello` | **tutte** le serie sotto il minimo, gradino > 1 | gradino −1, bonus tempo/pause a 0 |
| `range-da-rifare` | tutte sotto il minimo e gradino 1 (o nessuna scala) | niente: si rifà il test |
| `sali-di-livello` | **tutte** le serie sopra il massimo, gradino < 6 | gradino +1, bonus a 0 |
| `aggiungi-peso` | tutte **≥** massimo e zavorra disponibile in settimana+1 | +2,5 kg |

Se i numeri sono sparsi (una sotto, due sopra) **non succede niente**: è la
settimana normale di chiunque. Niente si applica da solo: la revisione propone.

`[PROPOSTA, progressione 1.1]` **Gradini solo eccentrici nei blocchi a range
fisso.** In un blocco con prescrizione `reps` a range fisso e TUT con fase
concentrica ≠ 0, «gradino ±1» significa il gradino **eseguibile** successivo o
precedente: si saltano quelli con `eccentricOnly` (PROGRAM_RULES R1). Esempi sul
circuito: trazioni 1 ↔ 3, dip 1 ↔ 3, pike 2 ↔ 4. Motivo: 6-8 negative da 5" a
TUT 3-0-1-0 non sono una prescrizione eseguibile, e la scheda stessa dice
«togli l'appoggio quando otto vengono pulite» (dal box alle complete). Fuori dai
range fissi (programma archiviato) ±1 resta letterale.
Criterio: con stato trazioni a 1 e tre serie da 9, `sali-di-livello` porta a 3;
con stato a 3 e tre serie da 3, `scendi-di-livello` porta a 1.

## 6. Tetti e divieti

`[IN CODICE]` eccentrica ≤ 5" · pausa in allungamento ≤ 2" · gradino ≤ 6 ·
passo zavorra 2,5 kg · zavorra solo da settimana 3 e solo in whitelist.

`[PROPOSTA]` Mancano tutti e tre questi tetti, e sono quelli che contano:

- **T1 — Un solo aumento di difficoltà per esercizio ogni 7 giorni.**
  Oggi la fine seduta propone dopo ogni seduta e la revisione propone a fine
  settimana, senza che nessuno guardi cosa è già stato accettato: con due sedute
  dello stesso esercizio in una settimana si possono accettare **tre** aumenti di
  gradino in sette giorni. La tabella `suggestions` registra già ogni decisione
  (`SuggestionRecord`): la regola è leggibile da lì.
- **T2 — Mai più di un gradino eseguibile alla volta**, in salita (§5: i
  solo eccentrici non contano nei range fissi). In discesa non c'è tetto:
  scendere è sempre permesso, subito, senza condizioni.
- **T3 — Niente salita di gradino senza tempo confermato.** La fine seduta lo
  pretende già (§1); la revisione settimanale no: con `tempoRespected === false`
  propone comunque `sali-di-livello` e si limita a scrivere «prima di salire,
  rifai la settimana al tempo giusto». Il verdetto va sostituito con
  `rifai-al-tempo-giusto`, senza cambio di stato.

`[PROPOSTA]` **T4 — Dopo una pausa.** Se tra due sedute dello stesso esercizio
passano ≥ 21 giorni: nessun aumento proposto per la prima seduta al rientro, e
la prima seduta si fa al gradino precedente se il gradino attuale è ≥ 4. Oggi
l'app propone un aumento basato su numeri di un mese prima.

## 7. Quando si tiene fermo

- Numeri dentro il range: si tiene. Nessun messaggio, nessuna azione.
- Tempo non risposto: si tiene e si chiede la risposta.
- Settimana di deload: nessun aumento, nessun verdetto di salita.
- `[PROPOSTA]` Stallo (PROGRESS_REVIEW §4): si tiene, si spiega, non si aumenta.

## 8. Quando si riduce

- Tutte le serie sotto il minimo ⇒ gradino −1 (§5). È la direzione che il motore
  delle leve non ha mai avuto e va tenuta sempre raggiungibile a mano.
- Zavorra: media ≤ 4 ripetizioni ⇒ −2,5 kg.
- `[PROPOSTA]` Dolore dichiarato su un esercizio ⇒ l'esercizio esce dal
  programma, nessuna progressione proposta, nessuna riduzione «terapeutica»
  suggerita. Vedi BOUNDARIES L2 e L3.
