# PROGRESSION_RULES.md — soglie di progressione

Versione **progressione 1.0 — PROPOSTA del 2026-11-08, non approvata.**
Aggiunta del 2026-11-12 `[PROPOSTA, progressione 1.1]`: salto dei gradini solo
eccentrici nei range fissi (§5, T2). Gradino di partenza: PROGRAM_RULES R1.
Aggiunta del 2026-11-14 `[PROPOSTA, progressione 2.0]`: **R5, R6, R7, R9** (§9),
che attuano le soglie S1, S3, S5, S6 approvate il 2026-11-12. R8 (S4):
PROGRESS_REVIEW §6.
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

`[PROPOSTA]` Quando la zavorra si può proporre: **R6** (§9). +2,5 kg a settimana
al massimo (S2): rispettato da `stepLoad` per proposta; R8 impedisce che la
revisione ne aggiunga un secondo su numeri fatti al carico di prima.

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
(`MIN_SETS_FOR_VERDICT`, che oggi conta le **righe**: R8 la corregge) e un range
confrontabile. Con R5-R8 la tabella resta, ma ogni aumento passa dal cancello
di R5, la salita da R7, il peso da R6:

| verdetto | condizione | effetto accettando |
|---|---|---|
| `scendi-di-livello` | **tutte** le serie sotto il minimo, gradino > 1 | gradino −1, bonus tempo/pause a 0 |
| `range-da-rifare` | tutte sotto il minimo e gradino 1 (o nessuna scala) | niente: si rifà il test |
| `sali-di-livello` | **tutte** le serie sopra il massimo, gradino < 6 | gradino +1, bonus a 0 |
| `aggiungi-peso` | tutte **≥** massimo e zavorra disponibile in settimana+1 | +2,5 kg |

Se i numeri sono sparsi (una sotto, due sopra) **non succede niente**: è la
settimana normale di chiunque. Niente si applica da solo: la revisione propone.

`[IN CODICE, progressione 1.1]` **Gradini solo eccentrici sui range fissi**:
«±1» è il gradino **eseguibile** successivo o precedente (`adjacentLevel` salta
`eccentricOnly`): trazioni 1 ↔ 3, dip 1 ↔ 3, pike 2 ↔ 4. 6-8 negative da 5" a
TUT 3-0-1-0 non sono eseguibili. Fuori dai range fissi ±1 resta letterale.

## 6. Tetti e divieti

`[IN CODICE]` eccentrica ≤ 5" · pausa in allungamento ≤ 2" · gradino ≤ 6 ·
passo zavorra 2,5 kg · zavorra solo da settimana 3 e solo in whitelist.

`[PROPOSTA]` T1-T4 della 1.0 **sostituiti** (§9): gradini → R7, T3 → R5, T4 →
R9 (14 giorni, non 21). Resta proposta, non approvata, la parte di T1 sulle
altre leve: un aumento di tempo, pausa o carico ogni 7 giorni (DECISIONS D-4).
In discesa non c'è tetto.

## 7. Quando si tiene fermo

- Numeri dentro il range: si tiene. Nessun messaggio, nessuna azione.
- Tempo non risposto: si tiene e si chiede la risposta.
- Settimana di deload: nessun aumento. **Non è in codice** (nessun file del
  motore legge `DELOAD_WEEKS`, 2026-11-14): diventa R5 E4.
- Sedute di rientro dopo una pausa: nessun aumento (R5 E5, R9).
- `[PROPOSTA]` Stallo (PROGRESS_REVIEW §4): si tiene, si spiega, non si aumenta.

## 8. Quando si riduce

- Tutte le serie sotto il minimo ⇒ gradino −1 (§5). È la direzione che il motore
  delle leve non ha mai avuto e va tenuta sempre raggiungibile a mano.
- Zavorra: media ≤ 4 ripetizioni ⇒ −2,5 kg.
- `[PROPOSTA]` Dolore dichiarato su un esercizio ⇒ l'esercizio esce dal
  programma, nessuna progressione proposta, nessuna riduzione «terapeutica»
  suggerita. Vedi BOUNDARIES L2 e L3.

## 9. R5, R6, R7, R9 — le soglie approvate, da implementare

`[PROPOSTA, progressione 2.0 — 2026-11-14]` Attuano S1, S3, S5, S6 (vincolanti)
e chiudono A2, A3, A4, M4. R8: PROGRESS_REVIEW §6; testi: ADVICE §7; L9.

**Notazione.** `chiuse`: sedute `completed` in ordine `(date, id)`; in corso e
abbandonate non contano mai (R3). `voce`: `LoggedExercise` con sets; voci
valide e `serieVere`: R8. `L`: stato su cui si giudica — revisione
`states.get(e) ?? R1`, fine seduta lo stato **di prima della scelta**
(`sessionDecisions().toEvaluate`). `esaurita(e, L, fisso)` ⇔ `pattern === null
|| L.level === null || adjacentLevel(pattern, L.level, 1, fisso) === null`:
strutturale, R7 non la rende vera. `scarico(w)` ⇔ `DELOAD_WEEKS.includes(w)`.
`ridotta`: R9. `oggi`: revisione = data del calcolo (campo nuovo `today` di
`WeeklyReviewInput`); fine seduta = `draft.date`.

### R5 — Una sola regola di avanzamento (S3 · chiude A2 · P-2c, caso 4a)

`cancello` è vero **solo se tutte**:
- **E1** ogni serie vera di ogni voce valida ha `value ≥ range.max`;
- **E2** ogni voce valida ha `tempoRespected === true` (`null` e `false` no);
- **E3** serie vere ≥ 3. Fine seduta: nella voce (più stretta di S3: una salita
  da una seduta chiusa dopo uno o due giri non è una prova). Revisione: R8;
- **E4** nessun aumento si applica in scarico né nasce da numeri di scarico.
  Fine seduta: `!scarico(session.week)`. Revisione: `!scarico(W) && !scarico(W+1)`;
- **E5** fine seduta: la seduta non è ridotta. Revisione: nessuna voce valida
  viene da una seduta ridotta.

Vale per **ogni aumento** (gradino, tempo, pausa, zavorra, manubrio) in
`reviewWeek` e in `evaluateProgression`, con una funzione condivisa. La discesa
non passa dal cancello. `cautelaTempo` di `review.ts` sparisce.
Ordine nella revisione, per esercizio: R8 → tutte sotto il minimo (discesa, in
codice) → tutte ≥ max: E4/E5 → E2 → R7, R6 → altrimenti `inRange`.

| esito, con E1 vero | revisione | fine seduta |
|---|---|---|
| E4 o E5 falsa | elenco `fermi` (scarico / rientro) | `blockedReason` scarico / rientro |
| almeno un `false` | verdetto **`rifai-al-tempo-giusto`**, stato invariato | in codice |
| almeno un `null`, nessun `false` | verdetto **`rispondi-sul-tempo`**, stato invariato | in codice |
| E3 falsa | `pocheProve` (R8) | «servono 3 serie complete» |

*Casi limite.* Tempo null: mai un sì. perSide: il tempo è per voce, le serie
vere per coppia (R8). Blocchi esclusi: non si valutano, niente domanda sul
tempo (in codice). Solo eccentrici: nessun effetto. Scarico: E4. Ritest appena
fatto: nessun effetto. Decisione registrata: fine seduta, una leva per blocco
(`sessionDecisions`); revisione, una per `(W, e)`, anche per i due verdetti
nuovi («Ho capito» registra `postponed`).

Base: rematore TRX `circuito-2/A3`, gradino 2, 8-10, W=2; chiuse 2026-03-10 e
03-13 da 11-11-11; prima seduta al 2 il 03-02; oggi 03-16.

| # | ingresso | atteso |
|---|---|---|
| 5.1 | tempo [sì, sì] | `sali-di-livello` 2→3 |
| 5.2 | [sì, no] | `rifai-al-tempo-giusto`, `stateAfter = stateBefore` |
| 5.3 | [sì, null] | `rispondi-sul-tempo` |
| 5.4 | [no, null] | `rifai-al-tempo-giusto` (il no vince) |
| 5.5 | caso 4a com'è: 1 seduta 19-19-19, no o null | nessun verdetto (lo chiude R8) |
| 5.6 | 7-7-7 e 7-7-7, [no, no] | `scendi-di-livello` 2→1 |
| 5.7 | W=5 o W=6, [sì, sì] | nessun aumento, `fermi` scarico |
| 5.8 | curl a martello `circuito-1/B1`, 2 sedute al massimo, [sì, null] | `rispondi-sul-tempo`, nessun +2,5 kg |
| 5.9 | fine seduta 11-11-11, null | nessuna leva (in codice) |
| 5.10 | fine seduta 11-11, sì | nessuna leva, «oggi ne hai chiuse 2» |
| 5.11 | fine seduta in settimana 6, 11-11-11, sì | nessuna leva, testo scarico |
| 5.12 | fine seduta ridotta (R9), 11-11-11, sì | nessuna leva, testo rientro |

### R6 — Prima la variante, poi la zavorra (S5 · chiude A3 · P-2d, caso 4b)

Un aumento di carico (`aggiungi-peso`, leva `load`) si propone **solo se tutte**:
- **Z1** `cancello` di R5;
- **Z2** `esaurita(e, L, isFixedRange(blocco))`. La variante in attesa per R7
  **non** è esaurita: il carico non prende il suo posto;
- **Z3** `getLoadAvailability(e, w).allowed`, w = W+1 in revisione,
  `session.week` a fine seduta (in codice);
- **Z4** se `getLoadThreshold(e.pattern) ≠ null` (trazione verticale, dip):
  `M = tests.get(testBaseline(e.pattern).testId)?.value` esiste e
  `assessLoadNeed(e, M).need ≠ 'discouraged'` (M ≥ 8 trazioni, ≥ 10 dip).
  `M` assente ⇒ niente carico. A fine seduta `M` si passa **sempre**: oggi
  `SessionSummary` passa `null` fuori da `reps-from-test`, cioè su tutto il
  circuito, e la soglia non è mai letta.

`inherent` (manubri, kettlebell; oggi tutti `pattern: null`): Z2 vera per
costruzione, Z4 non si applica. Revisione con Z1 vera e il resto no ⇒ elenco
`alMassimo` con un motivo: `tempo` (tutte ≥ max ma non tutte sopra, variante
non esaurita), `settimana` (Z3), `soglia` o `nessun-test` (Z4), `leve-finite`.
Fine seduta: `load.available = false` con lo stesso motivo; se la variante è
in attesa e non resta altra leva, `blockedReason` è il testo di R7, non «hai
esaurito tutte le leve».

*Casi limite.* Tempo null: R5 prima. perSide: nessun effetto. Blocchi esclusi:
mai (lo swing non riceve +2,5 kg). Solo eccentrici: Z2 salta come
`adjacentLevel` (trazioni al 1: non esaurita, la prossima è il 3). Scarico: E4.
Ritest appena fatto: `M` è l'ultimo test, un ritest sotto soglia toglie subito
la zavorra. Decisione registrata: come R5.

Base: trazioni `circuito-1/A1`, 6-8, due sedute chiuse in W, tempo [sì, sì],
R7 soddisfatta dove non detto.

| # | ingresso | atteso |
|---|---|---|
| 6.1 | caso 4b: W=3, gradino 1, 8-8-8 ×2 | nessuna zavorra; `alMassimo` `tempo` |
| 6.2 | W=3, gradino 1, 9-9-9 ×2 | `sali-di-livello` 1→3 |
| 6.3 | 6.2 con R7 non soddisfatta | `inAttesa`, nessuna zavorra |
| 6.4 | W=4, gradino 6, 8-8-8 ×2, M=12 | `aggiungi-peso` 0→2,5 kg |
| 6.5 | 6.4 con M=6 | `alMassimo` `soglia`, cita 6 e 8 |
| 6.6 | 6.4 senza test | `alMassimo` `nessun-test` |
| 6.7 | W=1, gradino 6, M=12 | `alMassimo` `settimana` |
| 6.8 | fine seduta W=4, gradino 1, 8-8-8, sì | leva ≠ `load`; `load`: «prima la variante» |
| 6.9 | fine seduta W=4, gradino 6, 8-8-8, M=6 | `load.available = false`, motivo soglia |
| 6.10 | dip `circuito-1/A3`, gradino 6, 2 sedute al massimo, M=9 | nessuna zavorra (soglia 10) |
| 6.11 | curl a martello, 2 sedute al massimo, sì | `aggiungi-peso` (manubrio successivo) |

### R7 — Un gradino ogni due settimane (S1 · chiude A4 · P-4b, caso 4c)

Ingressi: `e`, `L`, `oggi`, `chiuse` (la seduta in corso no).
- `voci(e)`: voci di `e` in `chiuse` con `level ≠ null`, di qualunque blocco.
- `inizio(e, L)`: data della prima voce della **serie finale ininterrotta** con
  `level === L.level`; `null` se l'ultima voce ha un altro gradino o non ce ne sono.
- **Salita consentita ⇔ `inizio ≠ null` e `daysBetween(inizio, oggi) ≥ 14`**;
  `dal = addDays(inizio, 14)`.

La salita resta di **un** gradino eseguibile (`adjacentLevel(…, 1,
isFixedRange)`): 1→3 sui range fissi è una salita (lettura di S1 approvata).
Vale per `sali-di-livello` e per la leva `variant`. Mai per scendere; non tocca
tempo, pausa e carico. Effetti voluti: un gradino accettato e non ancora
eseguito blocca ogni altra salita (seconda difesa su B11 Q2); dopo una discesa
si risale solo dopo 14 giorni al gradino più basso (assorbe W-18, ping-pong
1↔3); con i soli stati di R1 non si sale.
Esiti: revisione ⇒ elenco `inAttesa` (L, `inizio`, `dal`), nessuna zavorra al
suo posto. Fine seduta ⇒ `variant.available = false` con il motivo; si propone
la prima leva disponibile fra tempo e pausa, o nessuna.

*Casi limite.* Tempo null: R5 prima. perSide: nessun effetto. Blocchi esclusi:
le loro voci contano per `inizio`, l'esercizio non si valuta. Solo eccentrici:
sopra; sul programma archiviato 1→2 è una salita. Scarico: i giorni contano nei
14, l'aumento lo blocca R5. Ritest: il gradino non cambia, salvo R9b, che fa
ripartire il conto. Decisione registrata: a fine seduta `L` è lo stato di
prima, quindi dopo una ricarica il riepilogo mostra la stessa proposta con
«Scelta registrata», non quella successiva.

Base: push-up `circuito-3/A2`, 12-18, gradino 2, 19-19-19 e tempo sì in ogni
seduta; chiuse W1 2026-03-02 e 03-05, W2 03-09 e 03-12, W3 03-16 e 03-19.

| # | ingresso | atteso |
|---|---|---|
| 7.1 | revisione W1, oggi 03-09 | 7 giorni: `inAttesa`, dal 03-16 |
| 7.2 | revisione W2, oggi 03-16 | `sali-di-livello` 2→3, accettata |
| 7.3 | fine seduta 03-16 al 3 (in corso) | `variant` non disponibile, dal 03-30 |
| 7.4 | revisione W3, oggi 03-23 | 7 giorni al 3: `inAttesa`, dal 03-30 |
| 7.5 | caso 4c: le tre settimane | 1 salita (oggi 3) |
| 7.6 | trazioni 1→3, prima seduta al 3 il 03-17, poi 9-9-9 | nessuna salita al 4 prima del 03-31 |
| 7.7 | salita accettata, seduta ricaricata (B11) | stessa proposta + «Scelta registrata», nessuna 3→4 |
| 7.8 | discesa 3→2 il 03-20, prima seduta al 2 il 03-23 | nessuna salita prima del 04-06 |
| 7.9 | stato 3 da 2 giorni, 2 sedute sotto il minimo | `scendi-di-livello` |
| 7.10 | solo stati di R1, nessuna seduta | nessuna salita |
| 7.11 | voci 2, 2, 3, 2 (03-02, 03-05, 03-09, 03-12), stato 2, oggi 03-20 | inizio 03-12: `inAttesa`, dal 03-26 |
| 7.12 | ultima al 2 il 03-02, rientro il 03-20 | R7 vera, R9 blocca le sedute ridotte |

### R9 — Rientro dopo una pausa (S6 · chiude M4 · scenario S3)

Sta in **PROGRAM_RULES §8**, perché cambia il piano della seduta: dopo ≥ 14
giorni senza sedute chiuse, 4 sedute (e almeno 7 giorni) a giri dimezzati, tutte
le stazioni, nessun aumento (R5 E5), ritest proposto.

### Ordine di implementazione e dipendenze

1. **R8** — base: voci per seduta, serie vere, filtro su gradino e carico.
2. **R5** — usa voci e serie vere di R8; `ridotta` entra come ingresso, falso
   finché R9 non c'è.
3. **R6** — usa il cancello di R5. Esaurimento strutturale: non dipende da R7.
4. **R7** — **solo dopo R6**: senza Z2 la variante bloccata farebbe scivolare
   `evaluateProgression` sulla leva successiva, `load` — zavorra al gradino 1,
   A3 riaperto. Usa il filtro sul gradino di R8.
5. **R9** — usa E5; R9a dopo; R9b separabile (dipende da R1, in codice, e da R4
   per «non eseguito»).
R8, R5, R6, R7 in un rilascio solo: separate, ognuna lascia un buco che
un'altra chiude. R9 può essere il secondo.
