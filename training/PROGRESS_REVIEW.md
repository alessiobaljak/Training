# PROGRESS_REVIEW.md — analisi dei progressi

Versione **progressi 1.0 — PROPOSTA del 2026-11-08, non approvata.**
Aggiunta del 2026-11-14 `[PROPOSTA, progressi 2.0]`: **R8** evidenza minima per
un verdetto (§6, soglia S4). **Riscritta il 2026-11-15** sulla lettura di S4
scelta da Alessio (D-16): ultime 2 sedute, 14 giorni.
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

## 6. R8 — Quanto serve per un verdetto `[IN CODICE da a747e09 · rev. 2026-11-16 PROPOSTA, progressi 3.0]`

Rev. 2026-11-16: **R11** sostituisce il punto 3 (M17), **R12** aggiunge le
date diverse al punto 4 (L15), **R10b** completa «allo stato L» (A17).
Tabelle 11.x e 12.x: rapporto `reports/2026-11-16-training.md`.

Attua S4 (approvata il 2026-11-12) nella lettura scelta da Alessio il
2026-11-15 (D-16): **le ultime 2 sedute chiuse dell'esercizio allo stesso
gradino e carico, entrambe negli ultimi 14 giorni**, al posto della settimana di
calendario. Chiude **M1** (caso 4d). S4 non si allenta: almeno 2 sedute e almeno
3 serie vere. La versione del 2026-11-14 (settimana alla lettera) rendeva la
revisione muta sul circuito: è sostituita, non affiancata.

**Ingressi.** `W`, `sessions`, `states`, `tests` (come oggi), `today` (R7) e,
nuovo, **`weekEnd` = `fine(W)` = `addDays(startOfWeek(programStartDate), 7W − 1)`**:
la domenica che chiude W (funzione nuova `weekEndDate` in `schedule.ts`).
**`finestra(W)`** = da `fine(W) − 13` a `fine(W)`, estremi compresi: sono
esattamente le settimane W−1 e W del programma.

**Definizioni.**
- **Voce strutturale** di `e`: seduta `completed`; blocco dichiarato trovato;
  `effectiveBlock(…).exercise === logged.exercise` (A10 resta aperto);
  `excludeFromReview !== true`; range con `max > 0`; `sets.length > 0`.
- **Sedute di `e`**: sedute chiuse con almeno una voce strutturale di `e`, in
  ordine `(date, id)`. In corso e abbandonate non esistono per nessun conto.
- **Allo stato `L`** (`states.get(e) ?? R1`): ogni voce strutturale di `e`
  nella seduta ha `level === L.level` se `pattern ≠ null`, e `max(loadKg) ===
  L.loadKg` se `loadPolicy ≠ 'forbidden'`. **R10b**: la coppia vale solo se
  nel registro non c'è un `accepted` su `e` che alza un bonus di tempo o pausa
  con `date ≥ b.date`; altrimenti `rimandati` motivo `leva`. **R14c** (proposta
  2026-11-18): lo stesso per un `lapsed` (scelta decaduta, R14) ⇒ `decaduta`.
- **`serieVere(voce)`**: `setIndex` distinti con una riga `side === null`,
  oppure con `left` e `right` (in codice: `serieVere`, `righeVere`). Le righe
  orfane non entrano nei valori.
- **Coppia** `a`, `b`: le ultime due sedute di `e` con `date ≤ fine(W)`; `a` la
  più recente.
- **Utili**: `a` conta se è allo stato `L` e in `finestra(W)`; `b` conta se `a`
  conta, se è allo stato `L`, in `finestra(W)` e con lo stesso range di `a`
  (min, max, unità: chiude D-05 per la revisione) e, **R12**, con `b.date <
  a.date`. **Una seduta più vecchia di `b` non ne prende mai il posto**: sono
  le ultime due, non le ultime due buone.

**Predicato**, per la revisione di W e per ogni esercizio `e`:
1. **Stato della revisione**: `in-corso` se `today ≤ fine(W)`; `aperta` se
   `fine(W) < today ≤ fine(W) + 7`; `scaduta` oltre. Solo `aperta` produce
   verdetti ed elenchi.
2. **Chi compare**: `e` ⇔ ha una voce strutturale in una seduta chiusa con
   `week === W`. Quindi `a` sta in W.
3. **R11** (rev. 2026-11-16; prima: qualunque seduta dopo `fine(W)` ⇒
   `rimandati`, e con la revisione aperta dopo la seduta la discesa non
   arrivava mai, M17). `dopo` = sedute chiuse di `e` con `fine(W) < date ≤
   today`. (a) Una di `dopo` non allo stato `L` per gradino e carico ⇒
   `rimandati` `stato`. (b) Punto 4, poi R10b. (c) `E` = esito sulla coppia;
   se `dopo ≠ ∅`, `E⁺` = lo stesso calcolo su coppia + `dopo` (stesso range di
   `a`, tempo e scarico di ogni seduta, stessi `L`, `today`): `tipo(E⁺) =
   tipo(E)` ⇒ `E` con «Rifatto <giorno>: <valori>» nell'evidenza, altrimenti
   `rimandati` `smentito`. R11 può solo togliere un verdetto, mai crearne uno.
   **R16** `[PROPOSTA, progressi 3.1 — 2026-11-18, L20]`: per un `fermo` `tipo` =
   famiglia del motivo (`scarico` = `scarico-coppia`); verdetti a tipo esatto. La
   coda «Rifatto…» vale per ogni esito confermato con un testo. Testo nuovo T-S2
   (tutte e due le sedute di scarico, W+1 no): ADVICE §7, rapporto 2026-11-18.
   Rev. 2026-11-20: sullo stesso `L` due verdetti in salita su E ed E⁺ hanno lo
   stesso tipo (16.P); 16.4 sostituita da 16.4′ (`alMassimo` → `inRange` ⇒
   `smentito`). In produzione `0f3f191`. Appendice `reports/2026-11-20-training.md` §4.
4. **Verdetto possibile ⇔ due utili e `Σ serieVere(utili) ≥ 3`**, per ogni
   verdetto, discesa compresa. `MIN_SESSIONS_FOR_VERDICT = 2` (nuovo),
   `MIN_SETS_FOR_VERDICT = 3` su serie vere. Altrimenti `pocheProve`.
5. **Valori**: le righe delle serie vere delle due utili, i lati ognuno col suo
   valore. Da qui R5, R6, R7 nell'ordine di PROGRESSION_RULES §9.

**Esito.** Chi compare finisce in uno solo fra: un verdetto, `pocheProve` (nome,
`sedute` = utili, `serie` = Σ serie vere delle utili, `L`, `stessoGiorno`),
`rimandati` (nome, data, `motivo` `stato` | `leva` | `smentito`, testo), `fermi`
(+ `sette-giorni`, R13), `inAttesa`, `alMassimo` (+ `pausa`, `variante`, R10a),
`inRange`. Ordine per esercizio: stato → chi compare → R11a → coppia + R12 →
R10b → discesa → `inRange` → R5 → R10a (R7, R6, R10c) → R13 → R11c.
`WeeklyReview` aggiunge `stato`, `finestra {dal, al}`, `pocheProve`,
`rimandati`. `sessionsCounted` = sedute chiuse con `week === W` (come oggi);
`setsCounted` = Σ serie vere delle utili di chi compare, mai righe.

**Le quattro domande.**
- *Chi compare in N*: gli esercizi allenati in N (punto 2). Chi è stato allenato
  solo in N−1 non compare: la sua coppia l'ha già letta la revisione N−1.
- *Da dove partono i 14 giorni*: **da `fine(N)`, non da oggi.** La revisione di
  N legge gli stessi numeri qualunque giorno la apri; le sedute di N+1 sono
  della revisione N+1. `today` serve solo a R7 e al punto 1.
- *Una coppia già giudicata si rigiudica?* **No.** Ogni coppia ha una sola
  revisione, quella della settimana della sua seduta più recente: se in N+1 non
  rifai `e`, `e` non compare in N+1; se lo rifai, la coppia di N+1 è un'altra.
  La seduta di N rientra nella coppia dopo solo a stato invariato: dopo
  «Applica» è a un altro stato ed esce (8.18), dopo «Lascia com'è» si rilegge
  accanto a un numero nuovo (8.17). `SuggestionRecord` e `reviewDecisionId(W, e)`
  restano come sono: una decisione per esercizio e per settimana.
- *Con giorni di ritardo*: dentro la settimana N+1 i numeri sono gli stessi e
  cambiano tre cose, tutte prudenti: R7 su `today` può sbloccare una salita che
  il lunedì era in attesa, mai prima dei 14 giorni (8.23); un esercizio già
  rifatto si giudica se le sedute nuove sono allo stesso stato e confermano,
  altrimenti `rimandati` (R11, 8.19); uno stato cambiato nel frattempo (leva
  accettata a fine seduta, anche di tempo o pausa con R10b) fa uscire la coppia:
  nessun doppio aumento (8.10, 8.11, 10.1). Dalla N+2 è `scaduta` (8.20): nessun
  verdetto su numeri vecchi, magari prima di una pausa. La Home già oggi mostra
  solo la settimana `week − 1`.

**Testo per l'atleta** (dettaglio in ADVICE §7). Sottotitolo «<k> sedute in
settimana · <m> serie lette dal <dal> al <al>». `pocheProve`: «Troppo pochi
numeri per giudicare: <Esercizio> (<s> sedute, <n> serie al livello <L>) … La
revisione giudica le ultime due sedute di un esercizio se sono allo stesso
livello e carico, cadono entrambe in questi 14 giorni e hanno almeno 3 serie
complete in tutto.» `rimandati`: tre testi per motivo (ADVICE §7, consigli 3.0);
«Lo giudica la revisione della settimana prossima» sparisce (falso, M17).

**Sul circuito.** Un esercizio per circuito, ~1 seduta a settimana: la coppia è
di norma (N−1, N) e la revisione parla da W2. W1: tutti in `pocheProve`.

*Casi limite.* Tempo null: R5. perSide: serie vere per coppia di lati, sommate
sulle due sedute (8.26). Blocchi esclusi: voci non strutturali, non fanno seduta,
non spezzano la coppia, mai in `pocheProve` (8.9). Solo eccentrici: nessun
effetto. Scarico: le sedute contano (2 giri = 2 serie); nessun aumento da una
coppia che ne contiene una (R5 E4), la discesa sì (8.24). Rientro: oltre 13
giorni la seduta esce dalla finestra; le ridotte le ferma R5 E5. Ritest: un
test non è una seduta. Due sedute nello stesso giorno: contano 1 (R12). Seduta
chiusa tardi con data in W: entra alla prossima apertura. In corso e
abbandonate: fuori (8.7, 8.8). `programStartDate` assente: nessuna finestra,
nessun verdetto. Con R22 (D-17 a, progressi 3.2, PROPOSTA 11-21b) `week` è la settimana
del programma (dopo `D0` le settimane senza sedute non contano) e `fine(W)` è la domenica
dell'ultima settimana di calendario con quel numero: `week` decide chi compare, `fine(W)`
la finestra. L'aderenza resta di calendario (prova 22.10, rapporto 11-21b).

Base: inizio programma **2026-03-02** (W1 03-02→03-08, W2 →03-15, W3 →03-22,
W6 04-06→04-12 scarico, W7 →04-19); `weekEnd = fine(W)`, `today = fine(W) + 1`
dove non detto; push-up `circuito-3/A2` 12-18 e bulgarian `circuito-1/A2` 8-12
al gradino 2, tempo sì; R7 soddisfatta (prima seduta al gradino il 02-23) dove
non detto.

| # | ingresso | atteso |
|---|---|---|
| 8.1 | caso 4d: bulgarian, W=2, solo 03-11, serie 1-2 × S/D da 13 | nessun verdetto; `pocheProve` «1 seduta, 2 serie al livello 2» |
| 8.2 | 8.1 + 03-04 (W1) uguale | coppia su due settimane, 4 serie vere: `sali-di-livello` 2→3 |
| 8.3 | push-up, W=2, solo 03-11 da 19-19-19 | `pocheProve` (1 seduta, 3 serie) |
| 8.4 | push-up, 03-04 e 03-11 da 1 serie | `pocheProve` (2 sedute, 2 serie) |
| 8.5 | push-up, 03-04 9-9 e 03-11 9 | `scendi-di-livello` 2→1 |
| 8.6 | bulgarian, 03-04 (1 S+D, 2 solo S) e 03-11 (1 S+D) | 2 serie vere: `pocheProve`; riga orfana fuori dai valori |
| 8.7 | push-up, 03-09 chiusa, 03-11 in corso · bis: 03-04 chiusa, 03-11 in corso | `pocheProve` (1 seduta) · bis: push-up assente dalla revisione W2 |
| 8.8 | push-up 19-19-19, 03-04 chiusa, 03-08 abbandonata, 03-11 chiusa | coppia (03-04, 03-11): `sali-di-livello` |
| 8.9 | kb-swing in F, 03-04 e 03-11 × 2 giri | non giudicato, non in `pocheProve`, fuori da `setsCounted` |
| 8.10 | trazioni, stato 3, 03-04 e 03-11 al gradino 1 da 9-9-9 | `pocheProve` «0 sedute al livello 3» |
| 8.11 | curl a martello, 03-04 e 03-11 a 10 kg al massimo, stato 12,5 kg | `pocheProve` «0 sedute a 12,5 kg»: nessun secondo +2,5 kg |
| 8.12 | 8.2 | `setsCounted` = 4, non 8; `finestra` 03-02 → 03-15 |
| 8.13 | W=3, push-up 19-19-19 il 03-08 e il 03-18 | 03-08 = `fine − 14`, fuori: `pocheProve` (1 seduta) |
| 8.14 | 8.13 con 03-09 al posto di 03-08 | `fine − 13`, dentro: giudicato |
| 8.15 | W=3, push-up stato 3: 03-04 al 3, 03-11 al 2, 03-18 al 3 | `pocheProve` (1 seduta al livello 3): 03-04 non sostituisce 03-11 |
| 8.16 | 8.8, W2 «Lascia com'è»; nessun push-up in W3 | revisione W3: push-up assente |
| 8.17 | 8.16 + 03-18 al 2 da 19-19-19 | W3: coppia (03-11, 03-18), `sali-di-livello` con chiave `revisione-3:push-up` |
| 8.18 | 8.8, W2 «Applica» (stato 3) + 03-18 al 3 | W3: `pocheProve` (1 seduta al livello 3), nessuna seconda salita |
| 8.19 | 8.8, revisione W2 con `today` 03-17, push-up chiuso il 03-16 da 19-19-19 sì al 2 | **R11** (= 11.14): `sali-di-livello` con «Rifatto…»; se accettata, W3 `pocheProve`. Con 03-16 sotto il massimo: `rimandati` `smentito` |
| 8.20 | 8.8 con `today` 03-23 | `stato = scaduta`, nessun verdetto, nessun elenco |
| 8.21 | 8.8 con `today` 03-15 | `stato = in-corso`, nessun verdetto |
| 8.22 | 8.2 con `today` 03-16 e con 03-22, nessuna bulgarian dopo il 03-15 | stessi verdetti, stessa evidenza |
| 8.23 | push-up 19-19-19 il 03-04 e il 03-11, nessuna seduta prima al 2 · `today` 03-16 / 03-18 | `inAttesa` dal 03-18 / `sali-di-livello` 2→3 |
| 8.24 | W=7, push-up 04-08 (W6, 2 giri 19-19) e 04-15 (19-19-19) · con 9-9 e 9-9-9 | `fermi` scarico · `scendi-di-livello` 2→1 |
| 8.25 | voci della coppia con range diversi (se un esercizio sta in due blocchi) | la più vecchia non conta: `pocheProve` (1 seduta) |
| 8.26 | bulgarian, 03-04 (2 S+D da 7) e 03-11 (1 S+D da 7) | 3 serie vere, 2 sedute: `scendi-di-livello` 2→1 |
| 8.27 | push-up 19-19-19, due sedute chiuse il 03-11 (id diversi) | **R12** (= 12.1): `pocheProve` (1 seduta, stesso giorno); anche con 03-04 in più (12.2) |
| 8.28 | caso 4c sul circuito: push-up 19-19-19 il 03-04, 03-11, 03-18, 03-25, nessuna prima al 2, ogni salita accettata, W1-W4 | W1 `pocheProve` · W2 `inAttesa` dal 03-18 · W3 2→3 · W4 `pocheProve` (1 al 3): una salita |
