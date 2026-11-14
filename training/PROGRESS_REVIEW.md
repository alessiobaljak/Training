# PROGRESS_REVIEW.md — analisi dei progressi

Versione **progressi 1.0 — PROPOSTA del 2026-11-08, non approvata.**
Aggiunta del 2026-11-14 `[PROPOSTA, progressi 2.0]`: **R8** evidenza minima per
un verdetto (§6, soglia S4).
Motore: `src/engine/metrics.ts`, `src/engine/history.ts`, `src/engine/review.ts`.
Schermate: `src/ui/screens/ProgressScreen.tsx`, `ReviewScreen.tsx`, `LogScreen.tsx`.

## 1. Metriche che esistono oggi

| metrica | formula | dove |
|---|---|---|
| volume per gruppo | serie primarie × 1 + serie secondarie × 0,5; una serie per lato conta 1. **Oggi include finitura e decompressione** (A7, M10): da correggere con METHOD §3 R3 | `volumeByGroup` |
| stato del volume | `< 16` under · `16-20` in · `> 20` over, uguale per tutti gli otto gruppi | `WEEKLY_SET_TARGET` |
| aderenza | `round(chiuse / previste × 100)`; previste = settimane intere × 4 + giorni già passati della settimana in corso | `adherenceFromSessions` |
| media mobile peso/vita | finestra di **7 giorni di calendario**, con `sampleCount` e `complete` dichiarati | `movingAverage` |
| medie settimanali | media per settimana ISO, delta contro l'ultima settimana **con dati**, con `comparedTo` dichiarato | `weeklyAverages` |
| RIR medio | media dei RIR registrati, `null` se nessuno | `summarizeExercise` |
| totale per esercizio | somma dei valori di tutte le serie, lati compresi | `summarizeExercise` |
| storia di un esercizio | una riga per seduta, con marker su cambio gradino e cambio zavorra | `exerciseHistory` |

Due proprietà già giuste e da non perdere: la media mobile non allunga la
finestra all'indietro quando si salta un giorno, e il delta dichiara **contro
cosa** è calcolato — così una pausa di tre settimane non passa per un crollo.

## 2. Massimale

`[IN CODICE]` L'app **non stima** nessun massimale. Il massimale è un numero
*misurato*: una serie unica a cedimento tecnico nei 9 test di settimana 0
(`src/data/tests.ts`), con 4-5 minuti di recupero. Sui test per lato il valore
usato è quello del **lato più debole**. Da lì nascono i range
(`round(max × 0,55)`-`round(max × 0,75)`), solo nel programma archiviato.

`[PROPOSTA]` Resta così: **nessuna formula di 1RM.** Il metodo è a corpo libero,
dove il carico è il corpo, e un 1RM stimato da carico × ripetizioni sarebbe un
numero inventato su una base che non c'è. Se un giorno servirà per un esercizio
con bilanciere, la formula sarà Epley (`1RM = kg × (1 + rip/30)`), dichiarata a
schermo accanto al numero, **mostrata e mai usata per prescrivere**: le
prescrizioni restano sui numeri misurati.

## 3. Record personali

`[PROPOSTA]` Oggi non esistono. Definizione, su valori misurati e nient'altro:

- **PR di ripetizioni**: il valore di serie più alto mai registrato su quello
  slug *a parità di gradino e di zavorra*. Senza quella parità il PR non vuol
  dire niente: 20 push-up su rialzo non battono 8 archer push-up.
- **PR di tenuta**: lo stesso, in secondi.
- **PR di carico**: zavorra più alta registrata con almeno il minimo del range
  chiuso su tutte le serie.
- Un PR si mostra **dopo** che la seduta è chiusa, una volta, senza coriandoli e
  senza confronti con altre persone. Nessuna classifica, nessuna serie di giorni
  consecutivi da difendere.

## 4. Stallo — regola precisa

`[PROPOSTA]` Oggi la parola «stallo» non esiste nel codice. Definizione:

Un esercizio è **in stallo** alla settimana `N` quando tutte queste sono vere:
1. nelle settimane `N-2`, `N-1`, `N` ci sono almeno **3 serie vere** (§6) per
   settimana su quell'esercizio, nello stesso blocco o in blocchi con lo stesso
   range;
2. gradino e zavorra sono **invariati** su tutte e tre;
3. il massimo del range non è stato chiuso su tutte le serie in **nessuna** delle tre;
4. `media(N) − media(N-2) < 1` ripetizione, oppure `< 2` secondi sulle isometrie;
5. nessuna delle tre settimane è di deload.

Verdetto `stallo`: nessun cambio di stato, mai un aumento. Il testo cita i tre
numeri e offre **una** sola cosa da provare, in quest'ordine di priorità:
risposta sul tempo mancante → aderenza sotto il 70% su quell'esercizio →
gradino sopra la capacità attuale.

**Secondo stallo consecutivo** (6 settimane, condizioni sopra verificate a `N` e
`N+3`): verdetto `scendi-di-livello` con la cautela già in uso — scendere non è
un passo indietro, è l'unico modo di fare le ripetizioni che il programma chiede.

L'app non attribuisce lo stallo a sonno, stress, alimentazione o ormoni: sono
cose che non misura e su cui non ha titolo per parlare.

## 5. Come si presentano all'atleta

`[IN CODICE]` Tre luoghi, e vanno tenuti separati:
- **Progressi**: volume per gruppo contro la fascia 16-20, aderenza, peso e vita
  con media mobile. Nessun obiettivo di peso, nessuna azione suggerita — la
  schermata lo scrive a chiare lettere e questa riga è una regola, non uno stile.
- **Revisione settimanale**: i verdetti, uno per esercizio, con i numeri citati
  per esteso. Chi non ha niente da cambiare finisce in «dentro il range», e deve
  finirci.
- **Log**: la tabella e il CSV nascono dalla stessa funzione (`logRows`), così
  non possono divergere.

`[PROPOSTA, progressi 1.1 — R3]` **Volume in Progressi: entrambi, separati.**
Una riga per gruppo, tre numeri con la loro origine:
*«Dorsali · 12 serie questa settimana · il programma ne prevede 15 · fascia del
metodo 16-20 (prioritario)»*.
- **Stato dell'atleta** = fatte contro **previste dal programma**, solo su
  settimane ISO chiuse: `fatte < previste` «sotto il programma», `=` «in linea»,
  `>` «sopra il programma». Settimana in corso: «in corso», nessuno stato.
- **Stato del programma** = previste contro **fascia del metodo**: «in fascia»,
  «sotto la fascia», «sopra la fascia», «nessuna serie prevista». È una
  proprietà della scheda, non dell'atleta: si mostra in una sezione «Il
  programma», senza colori di merito, con la nota della scheda dove esiste
  (polpacci: lavoro solo nella finitura, non contato).
- L'app non mostra mai un gruppo come mancato dall'atleta perché il programma
  non lo prevede.

`[PROPOSTA]` Regole di presentazione:
1. **Ogni numero mostrato dichiara da dove viene.** Una percentuale di aderenza
   senza denominatore, o una media senza `sampleCount`, non si mostra.
2. **Nessuna estrapolazione.** Niente «di questo passo a marzo…», niente
   proiezioni, niente stime di peso o di centimetri futuri (BOUNDARIES L10).
3. **Nessun confronto tra persone.** L'app non ha classifiche e non ne avrà.
4. Il peso e la vita sono misure, non giudizi: nessun colore, nessuna freccia
   che valga «bene» o «male», nessuna soglia di «peso ideale» o BMI.
5. Un dato mancante si dice mancante. Mai zero al posto di «non misurato»:
   l'aderenza senza data di inizio è `null`, non 0%.
6. La revisione non giudica ciò che non ha titolo per giudicare: blocchi senza
   range, blocchi a cedimento, attività a durata e **blocchi marcati
   `excludeFromReview`** restano fuori. L'ultimo è in codice dal 2026-11-12
   (`review.ts`, ADVICE D-01 chiuso).

## 6. R8 — Quanto serve per un verdetto `[PROPOSTA, progressi 2.0 — 2026-11-14]`

Attua S4 (approvata il 2026-11-12), chiude **M1** (caso 4d). Oggi
`MIN_SETS_FOR_VERDICT = 3` conta le righe: 2 serie per lato di una seduta sola
fanno 4 e bastano. Ingressi: `W`, `sessions`, `states`, `tests` (come oggi).

- **Voce valida** per `e` in W: seduta `completed` con `week === W`; blocco
  dichiarato trovato; `effectiveBlock(…).exercise === logged.exercise` (A10
  resta aperto); `excludeFromReview !== true`; range con `max > 0`;
  `sets.length > 0`; **stesso stato su cui si giudica**: se `e.pattern ≠ null`,
  `logged.level === L.level`; se `loadPolicy ≠ 'forbidden'`, `max(loadKg)` della
  voce `=== L.loadKg`. Numeri fatti a un altro gradino o a un altro carico non
  dicono niente di quello attuale, e senza il filtro la revisione aggiungerebbe
  una seconda salita o un secondo +2,5 kg sopra una leva già accettata a fine
  seduta (S1, S2).
- **`serieVere(voce)`** = numero di `setIndex` distinti per cui c'è una riga con
  `side === null`, **oppure** ci sono sia `left` sia `right`. Una serie per lato
  incompleta non conta e le sue righe non entrano nei valori.
- **Valori** del verdetto: tutte le righe delle serie vere, i due lati ognuno col
  suo valore (come oggi).
- **`sedute(e)`** = `LoggedSession.id` distinti fra le voci valide.
- **Verdetto possibile ⇔ `sedute ≥ 2` e `Σ serieVere ≥ 3`**, per **ogni**
  verdetto, discesa compresa. `MIN_SETS_FOR_VERDICT` resta 3 ma conta serie
  vere; nuovo `MIN_SESSIONS_FOR_VERDICT = 2`.
- Sotto soglia: nessun verdetto; nuovo elenco **`pocheProve`** con nome, sedute
  e serie al gradino attuale (testo: ADVICE §7). Compare se ha almeno una voce
  che passa tutti i filtri tranne quello sullo stato; se non ne ha nessuna, non
  compare.
- `setsCounted` («N serie lette») = Σ serie vere delle voci valide, non righe.

**Conseguenza sul programma attivo (DECISIONS D-16).** Ogni esercizio dei
circuiti sta in un circuito solo. Con 4 sedute a settimana nessun esercizio ha
2 sedute nella stessa settimana: R8 alla lettera rende la revisione muta, discesa
compresa. Restano le leve di fine seduta (con R5-R7) e la discesa a mano.

*Casi limite.* Tempo null: non conta qui (R5). perSide: sopra. Blocchi esclusi:
né seduta né serie, mai in `pocheProve`. Solo eccentrici: nessun effetto (la
voce si giudica al suo gradino). Scarico: le sedute contano (2 giri = 2 serie a
seduta), gli aumenti li blocca R5. Ritest appena fatto: un test non è una
seduta. Decisione registrata: `pendingVerdicts` filtra `(W, e)`; una leva
accettata dopo la settimana cambia `L` e quelle voci escono. In corso e
abbandonate: fuori.

| # | ingresso | atteso |
|---|---|---|
| 8.1 | caso 4d: bulgarian `circuito-1/A2`, W=2, 1 seduta, serie 1-2 × sinistra/destra da 13 su 8-12 | nessun verdetto; `pocheProve` «1 seduta, 2 serie» |
| 8.2 | 8.1 con 2 sedute, tempo sì, R7 soddisfatta | 4 serie vere: `sali-di-livello` 2→3 |
| 8.3 | push-up, 1 seduta 19-19-19 | `pocheProve` (1 seduta) |
| 8.4 | push-up, 2 sedute da 1 serie | `pocheProve` (2 serie) |
| 8.5 | push-up gradino 2, 2 sedute: 9-9 e 9 su 12-18 | `scendi-di-livello` 2→1 |
| 8.6 | bulgarian, 2 sedute: (1 S+D, 2 solo S) e (1 S+D) | 2 serie vere: `pocheProve`; la riga orfana fuori dai valori |
| 8.7 | push-up, 2 sedute di cui una in corso | `pocheProve` |
| 8.8 | push-up, 2 chiuse e 1 abbandonata, 3 serie | si giudica con 2 sedute |
| 8.9 | kb-swing in F, 2 sedute × 2 giri | non giudicato, non in `pocheProve`, non in `setsCounted` |
| 8.10 | trazioni, stato 3, voci di W al gradino 1 (2 sedute 9-9-9) | voci fuori: `pocheProve` «0 sedute al livello 3» |
| 8.11 | curl a martello, 2 sedute a 10 kg, stato 12,5 kg (leva accettata) | voci fuori: nessun secondo +2,5 kg |
| 8.12 | 8.2 | `setsCounted` = 4, non 8 |
