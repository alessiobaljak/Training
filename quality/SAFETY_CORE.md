# Nucleo di sicurezza — 8 casi

Mantenuto da `training-quality`. **`release-gate` lo esegue per intero a ogni
rilascio, anche di dimensione S.** Nessun caso si salta, nessun caso si
riassume.

Versione: **v16** · 2026-11-21g · misurata su `src/` al commit `3c4a8d7` (L42, selettore) e, al contrario, su
`9c62f84` (produzione, `src/` = `9d7b20f`). **v16** = v15 + **4o (vii)** il selettore di `SessionScreen` (L42:
handler letto in modo statico, `statoDopoCambioAMano` chiamata o `{ ...stato, level }` modellato) + **4o (viii)** il
peso precompilato nella seduta dopo un cambio di gradino a 0 kg (player guidato e `SessionScreen`, volta scorsa al 6
con 5 kg; B20). La v15 sulle stesse radici: 4 · 2 · 2 (vii e viii non esistevano: un controllo nuovo non è un PASS
che si è rotto). Teste della v14 e della v15: `ARCHIVE-4.md`.

## Come si esegue

```
cd /home/user/Training
node --experimental-strip-types quality/scripts/safety-core.mts
```

Stampa una riga per caso con `PASS` / `FALLITO` / `NON COPERTO` e il dettaglio.
Esce con codice 1 se almeno un caso non è PASS. Gira in meno di due secondi,
non tocca il database, non apre l'emulatore, non ha bisogno di rete.

Il caso 8 è l'unico che richiede l'emulatore Firebase e **non è coperto dallo
script**: la ricetta è scritta sotto. `npm run smoke` e `npm run offline` non
si lanciano mai in parallelo (stesse porte 8080 e 9099).

## Regola di lettura

- `PASS` solo su ciò che lo script ha eseguito davvero.
- `NON COPERTO` quando la funzione non esiste o il controllo non è eseguibile.
  **Non è un PASS e non si conta come tale.** Metà caso verificato non fa un
  PASS: vedi caso 6.
- `FALLITO` quando il controllo gira e il risultato non è quello atteso.

## Esito del 2026-11-21f (v15, `9d7b20f`): 4 PASS · 2 FALLITI · 2 NON COPERTI

Copie `git archive`, mai dal tree principale. **Caso 2 PASS** (2c-Z: 4 Z1, sei condizioni vere, la 6 dal sorgente;
positivi 5/5; 2c minima 0 casi; 2d 42/42). **Caso 4 PASS** (4l a-d, 4n, 4o i-vi). Casi 3, 6 FALLITI (B6; B8: 255 file,
0 approvati); 1 e 8 NON COPERTI; 5 e 7 PASS. **`22f3d31` (produzione) con la v15: 3 · 3 · 2**: caso 2 PASS (B9 si
chiude per decisione), caso 4 FALLITO per 4l (d) ×2 (B19) e 4o (iii)-(vi) ×7 (L14, chiusura). **`85d1dd8`** (prima di
R21): 2 · 4 · 2, 2c minima su 4 Z1 (il positivo vero di 2c). La v14 su `9d7b20f` e `22f3d31`: 3 · 3 · 2.


## Esito del 2026-11-21g (v16, `3c4a8d7`): 3 PASS · 3 FALLITI · 2 NON COPERTI

Copie `git archive` di `3c4a8d7` e `9c62f84`, mai dal tree principale. **v15 per intero: 4 · 2 · 2 su tutte e due**
(uscite identiche byte per byte). **v16: 3 · 3 · 2 su tutte e due**: caso 4 FALLITO per **4o (viii) ×2** (B20, peso
precompilato dalla volta scorsa dopo un cambio a 0 kg: player guidato e `SessionScreen`, campo 5 kg, chiusura
`{5, 5 kg}`); su `9c62f84` in più **4o (vii) ×4** (selettore: 5 kg e +2″/+2″ tenuti). Casi 1-3 e 5-8 identici fra v15
e v16 e fra le due radici (3: B6; 6: 255 file, 0 approvati). verify su `3c4a8d7`: 985 test, 43 file, verdi.
---

## Caso 1 — Dolore dichiarato gestito con un rimando
**Stato oggi: NON COPERTO** — nel prodotto non esiste nessun campo né nessuna
regola sul dolore. Non c'è niente da mettere alla prova. B1 blocca solo il
rilascio pubblico (decisione del 2026-11-12): il caso si esegue lo stesso.

- **Input.** Persona P6. Settimana 3, seduta `circuito-1`, blocco A2
  (bulgarian split squat), 2 serie per lato da 7 ripetizioni, tempo rispettato.
  Nella nota della serie, in quella dell'esercizio e in quella della seduta:
  `ginocchio destro, fastidio acuto, mi sono fermata`.
- **Atteso.** L'app dice di fermare quell'esercizio; nessun verdetto di
  progressione su di esso; invito a rivolgersi a un professionista sanitario se
  il dolore persiste o si ripresenta; nessuna ipotesi su cosa sia.
- **Misurato oggi.** Nessun rimando (`rimando presente=false`). L'esercizio
  resta trattato come normale e finisce fra quelli «dentro il range».
- **Perché NON COPERTO e non FALLITO.** La funzione non esiste: il caso
  diventerà eseguibile quando `BOUNDARIES.md` definirà la regola. Il difetto
  Bloccante corrispondente è aperto (vedi RESULTS.md, difetto B1).

## Caso 2 — Principiante senza esercizi oltre il suo gradino
**Stato oggi: PASS** (v15, 2026-11-21f, su `9d7b20f` e `22f3d31`). Era FALLITO solo per 2c (B9), fino alla lettura
D-Q3 = a di Alessio.

- **Input.** Persona P1, test di Settimana 0: trazioni 0, dip 0, nordic 0,
  push-up 4, pike push-up 2, bulgarian 5 (lato debole), hollow 12", dead hang
  8". Il rematore al TRX **non è registrato** (P1 non ha un TRX). Si passa a
  `startingLevel(exercise, tests)` per ogni esercizio delle 4 sedute.
- **Atteso.** (2a) Zero misurato o test assente ⇒ primo gradino eseguibile (1)
  su ogni esercizio giudicato. (2b) Il gradino coincide con R1
  (PROGRAM_RULES §3, proposta), che lo script riscrive dal testo. (2c) S7 nella
  lettura minima: se il test si esegue **allo stesso gradino** che l'app
  assegna e il valore misurato sta **sotto il minimo** del blocco, quel
  gradino non è compatibile con il valore misurato.
- **Misurato oggi.** 2a rispettato. 2b: coincide su tutti i **39** esercizi
  prescritti (e su 3024 celle catalogo × valori in `09-gradino-partenza`).
  2c minima (blocchi senza `recordActual`): 0 casi. 2c-Z (v15): i 4 Z1 rispettano le sei condizioni (sotto).
  Fino alla v14 la lettura minima contava i 4 Z1 (dead hang 30" al gradino 2 con 8" misurati: B9, chiuso
  il 2026-11-21f con D-Q3 = a).
- **Storia di 2c** (2026-11-12b, 2026-11-21d, la lettura minima su Z1 e D-Q3): `ARCHIVE-4.md`.
- **2d (v13 → **v14** 2026-11-21e) — S7 dopo un test peggiore.** Per i 7 esercizi in cui R1 arriva alla
  riga 8 (trazioni, dip, bulgaro, pike, rematore TRX, push-up, hollow): test di settimana 0 alla soglia (→ Lt),
  una seduta a Lt, ritest di settimana 6. Tre vie: stato salvato prima; sola chiusura come l'app; storia chiusa
  come prima e migrazione arrivata dopo il ritest. M = soglia − 1 (atteso giù(Lt)) e M = 0 (primo gradino).
  Atteso (R9b, D-18; R9c punto 4): gradino ≤ atteso, oppure una proposta `riparti-dal-test` L → atteso, mai più
  alta, mai una salita, 0 kg e tempo e pausa a 0; «Applica» → stato atteso e proposta sparita, registro
  `accepted`; «Lascia com'è» → gradino invariato, `postponed`. Alla soglia: nessuna proposta (la fixture
  distingue). Positivo: chiusura di prima, stato virtuale, scende (7/7). **Misurato**: `644bd8c` 42 controlli,
  42 proposte giuste (B17 chiuso); `cc95fac` 42 restano; `7863e31` 28; `4d06a4b` 14 (via «stato salvato»).
- **2c-Z (v15, 2026-11-21f) — D-Q3 = (a), R21 rev.** Sui blocchi `recordActual` (i 4 Z1) S7 si legge «nessuna dose
  sopra il misurato», vera se e solo se: (1) gradino P, mai sopra (R1 con test 0, 1, 8, 29, 30, 60 e senza: 2);
  (2) i testi del player e della panoramica dicono «bersaglio …, o finché la presa regge», senza «almeno», «minimo»,
  «deve durare»; (3) il bersaglio del conto è il massimo (settimane 1, 6, 7), nessun valore scrivibile oltre, il conto
  si ferma al segnale (sorgente); (4) nessun `autoComplete`, valori interi ≥ 1 (`tenutaMollata` su 0-30 s,
  `tenutaDichiarata` su 13 stringhe), nel ramo del player solo «Ho mollato» / «Sì» / campo numerico; (5) revisione,
  volume e proposte R9b identiche con Z1 a 1, 8, 29, 30″, nessun `TestResult` scritto chiudendo, archiviando o
  migrando, Progressi esclude i blocchi esclusi; (6) la nota «Se la presa sta per cedere…» prima del «Via»
  (**statico**: nel browser la copre lo smoke). Positivi che devono fallire, eseguiti: gradino 3, `autoComplete`
  vero, «almeno», un `TestResult` scritto da una chiusura mutata, il blocco senza `recordActual` (torna la lettura
  minima). Se un positivo non fallisce, 2c è FALLITO. Sugli altri blocchi resta la lettura minima (0 casi).
  **Misurato**: `9d7b20f` e `22f3d31` sei condizioni vere, positivi 5/5; `85d1dd8` 2c minima su 4 Z1 (FALLITO).
- **Nota di metodo.** Fino al 2026-11-09b il caso chiamava `startingLevel`
  con i soli massimali e dichiarava «2b non decidibile»: corretto, perché la
  mappatura non esisteva. Il controllo 2c non esisteva: la decompressione era
  già così e nessuno lo vedeva.

## Caso 3 — Solo corpo libero: nessun esercizio fuori attrezzatura
**Stato oggi: FALLITO** — 37 blocchi su 52 (invariato dal 2026-11-09b), e
metà del caso non è nemmeno verificabile.

- **Input.** Persona P1: nessun attrezzo dichiarato (tappetino, sedia, muro).
- **Atteso.** Ogni blocco che richiede un attrezzo offre un'alternativa a
  corpo libero, oppure non viene proposto.
- **Misurato oggi.** 37 blocchi su 52 richiedono sbarra, parallele, anelli,
  TRX, manubri, kettlebell, elastico, box o panca **senza alcuna alternativa a
  corpo libero**. Le alternative dichiarate sono **0** dal commit `f63c9f1`
  (erano 5, tutte nella finitura): M12.
- **Non verificabile.** Né `Exercise` né `AppSettings` hanno un campo
  attrezzatura: l'atleta non ha modo di dichiarare cosa possiede. La lista
  attrezzo-per-esercizio usata dallo script è mantenuta a mano **in**
  `quality/scripts/safety-core.mts` e va sostituita da un campo
  dell'anagrafica (compito di `training-designer`).

## Caso 4 — Progressione entro le soglie
**Stato oggi: FALLITO** con la v16 su `3c4a8d7` e su `9c62f84` (produzione), 2026-11-21g: 4o (viii) ×2 (B20); su `9c62f84` anche 4o (vii) ×4. Con la v15 PASS su tutte e due (4l a-d, 4n, 4o i-vi). Superano 4a (S3), 4b (S5, R10a), 4c (S1), 4d (S4),
4e (S2 per proposta, su 7 giorni **e sul carico sollevato**, v8), 4f, 4g (T2), 4i (S10), 4j (R-7, v10), **4k (R-14, v11)**. La revisione
riceve il registro: vuoto salvo 4c (salite accettate) e 4e (zavorra accettata). Inizio programma 2026-03-02; revisione della settimana W
con `weekEnd = fine(W)` e `today = fine(W) + 1` dove non detto.

- **Input e atteso, controllo per controllo:**

| # | Input | Atteso | Misurato |
|---|---|---|---|
| 4a (S3) | rematore TRX `circuito-2/A3`, stato 2, 8-10; chiuse 03-05 (W1) e 03-12 (W2) da 19-19-19; revisione W2 il 03-19 (R7 aperta). Tempo [sì,no] [sì,null] [no,no] [null,null] [no,null]; positivo [sì,sì]. Fine seduta 19-19-19 con «no» | nessuna salita; `rifai-al-tempo-giusto` se c'è un no, `rispondi-sul-tempo` se c'è un null e nessun no, stato invariato; positivo 2→3; fine seduta nessuna leva | **corretto** nei 5 casi; positivo 2→3; fine seduta nessuna leva (A2 chiuso) |
| 4b (S5) | trazioni `circuito-1/A1`, chiuse 03-11 (W2) e 03-18 (W3) da 8-8-8, tempo [sì,sì], **test trazioni 12** (con `tests` vuoto Z4 maschera Z2); revisione W3. Positivo: stato e sedute al 6 **con tempo e pausa esauriti** (v7, R10a). Variante: 9-9-9 al 1. v7: gradino 6 a bonus 0 | gradino 1: nessuna zavorra, `alMassimo` «tempo»; gradino 6 esauriti: zavorra 0→2,5; 9-9-9: `inAttesa` senza zavorra al suo posto; gradino 6 a bonus 0: nessuna zavorra | **corretto** in tutti e quattro su `cf7588a`; su `a747e09` il gradino 6 a bonus 0 riceve la zavorra (R10a, era A17) |
| 4c (S1) | push-up `circuito-3/A2` 12-18 dal gradino 2, 19-19-19, tempo sì. (i) 03-04, 03-11, 03-18, 03-25; (ii) 03-02, 03-05, 03-09, 03-12, 03-16, 03-19, 03-23, 03-26. Revisioni W1-W4, ogni salita accettata, le sedute dopo al gradino nuovo; **il ciclo non si ferma** su una settimana senza verdetto | (i) 1 salita; (ii) 2 salite (03-16, 03-30); mai due salite a meno di 14 giorni; meno salite delle attese = fixture che non arriva alla regola | **corretto**: (i) 1, (ii) 2 a 14 giorni (A4 chiuso). In più `12` C: 300 atleti simulati 12 settimane, fine seduta + revisione: 0 coppie di salite sotto i 14 giorni |
| 4d (S4) | bulgarian `circuito-1/A2` (8-10, non 8-12 come scrive la base di R8), stato 2. (1) solo 03-11, 2 serie per lato; (2) 03-04 e 03-11 con 1 S+D; (3) W3: 03-08 (`fine−14`) e 03-18; (4) 03-11 al gradino 1 e 03-18 al 2; (6) righe orfane (8.6). Positivo: 03-09 e 03-18, 2 S+D da 7 | (1)-(6): nessun verdetto, `pocheProve`; (1) `setsCounted` 2; positivo `scendi-di-livello` 2→1 (la discesa non passa da R5-R7: isola S4) | **corretto** (M1 chiuso) |
| 4e (S2) | (i) chin-up gradino 6, 5 kg, 10-10-10 a RIR 0, **tempo e pausa a fine corsa**, M = 12, settimana 4. **v7, su 7 giorni**: trazioni `circuito-1/A1` al 6, test 12, tempo e pausa esauriti, chiuse 03-12 e 03-19 da 8-8-8 a 0 kg; **v9** (date v8 + 35 giorni, fuori da D-21): chiuse 04-16 e 04-23 da 8-8-8 a 0 kg; (ii) revisione W8 il 04-27 accettata (0 → 2,5, nel registro), fine seduta giovedì 04-30 a 2,5 kg; (iii) fine seduta lunedì 05-04, prima seduta a 2,5 kg; positivo: chiusa il 04-30 a 2,5, fine seduta giovedì 05-07 a 2,5; (iv) due sedute il 04-30, zavorra accettata alla prima | (i) leva `load`, passo +2,5 kg; (ii) nessun altro carico il 04-30; (iii) il 05-04 nessun carico oltre 2,5, e il silenzio è di R13 (D-20 a); il 05-07 `load` 2,5 → 5 kg; (iv) la seconda non propone niente. Se la revisione non propone la zavorra, se il 05-04 tace per un altro motivo o se il 05-07 non la ridà, il controllo fallisce (non misura) | **corretto** su `221b2e8` e `59daf79` in tutti e quattro (v9). Su `001de30` (iii) propone 2,5 → 5 kg il primo giorno a 2,5: **S2 sul carico sollevato violata in produzione** (B13). Su `a747e09` era (ii) e (iv) (B12) |
| 4f | `kb-swing` della finitura, chiuse 03-04 e 03-11 da 21-21-21 | non compare in nessun elenco, `setsCounted` 0 | **corretto** |
| 4g (T2) | coppia 03-05 e 03-12 sopra il massimo, revisione W2 il 03-19: trazioni e dip dal 1, pike dal 2, push-up dal 2 | 1→3, 1→3, 2→4, 2→3; senza salita il controllo fallisce | **corretto** |
| 4h (S9) | `buildGuidedPlan` delle 4 sedute, settimane 1 e 6. Stabilizzazione del tronco: suitcase carry, hollow hold, plank con trascinamento, Pallof press, plank tocco spalla. Balistici carichi: swing, corda slam | ogni giunzione tronco → balistico ha ≥ 15" di passi `rest` in mezzo; se non ne trova nessuna il controllo fallisce (fixture vuota) | **corretto** su `4d06a4b` e `64180fa` (R20): 7 giunzioni, tutte 15″. **Violata** fino a `85d1dd8`: `circuito-4` sett. 1, F4 plank tocco spalla → F1 corda slam del giro 2, **0"** (finitura: 15" fra stazioni, 0 fra i giri; B10, chiuso). Le giunzioni B3 → F hanno 15" (R2). In sett. 6 la finitura ha un giro |
| 4i (S10) | (1) push-up `circuito-3/A2` gradino 2, 18-18-18 su 12-18, `tempoRespected=null`, R7 aperta; (2) controllo statico di `GuidedSession.tsx`, come 5 e 6a | (1) nessuna leva oltre le ripetizioni; (2) ogni `setTempoRespected` del player scrive `false` | **corretto**: nessuna leva; 1 scrittura, `false`. Se il player tornasse a scrivere «sì» da una misura, (2) fallisce e il controllo va riscritto come misura (`07`) |
| 4j (R-7, v10) | curl a martello `circuito-1/B1`, `{12, +2″, +2″}`, massimo chiuso il 19 (sett. 4): la fine seduta propone il manubrio, accettato (registro, seduta del 19). Seduta del 23: peso come `PassoLavoro` (B del manubrio in attesa, se no lo stato; `pesoIniziale` con volta scorsa 12 e 0 kg), chiusura come `chiudi`; positivo: seduta scritta a T. Statico: composizione del peso in `GuidedSession` | campo ≤ 12 kg e stato salvato ≤ 12 kg in tutti e due i casi; positivo: stato = T. Composizione non riconosciuta ⇒ il controllo va riscritto | **corretto** su `0d85597`. Su `e30cdc6`: campo a 14,5 kg e stato 14,5 con la volta scorsa a 0 (R-7) |
| 4k (R-14, v11) | circuito 4 a meno di 55′, stati casuali con seme fisso; military press `circuito-4/A3` `{10, +1″, 0}`, dip su panche `B2` al gradino 1 con tempo e pausa liberi, i passi di tempo e pausa di tutti e due oltre 55′; chiuse 03-02, 03-19, 03-26 al massimo, tempo sì; revisione W4 il 03-30 **con `durata: durataDellaSedutaDi`** | military press: `aggiungi-peso` 10 → 12, mai più di 2 kg; dip: nessuna zavorra, `alMassimo` «variante»; se la military press non arriva al manubrio la fixture non misura | **corretto** su `f7f945d`. Su `fb560e7` non misura: la revisione dice «tempo» |
| 4l (R-17, v12 → v13 → **v14**) | repository vero (MemoryStore): test push-up M=10 il 03-02 (settimana 0), sei sedute chiuse al livello 1 con `chiusuraApp` (la chiusura dei due gestori), ritest M=16 il 04-13 (settimana 6). Statico: `chiudi` e `saveAndExit` chiamano `statiDaFissare` prima di `closeSession`. (b) Migrazione: sei chiusure di prima, `fissaStatiMancanti`, ritest. **(c, v14)** sei chiusure di prima, ritest, **poi** la migrazione. Positivo: chiusura di prima senza migrazione | stesso livello in tutte le vie; il positivo sale; in (c) prima della migrazione il gradino virtuale è salito, se no la fixture non misura | **corretto** su `644bd8c` e `cc95fac` (1, 1, 1). Su `7863e31` (c) **fissato a 2** (la migrazione in ritardo congelava il gradino alzato). Su `4d06a4b`: funzioni assenti, 1 → 2. Nel browser (`23`, `704dbfa`): chiusura dal player ⇒ `[1,0,0,0]` |
| 4n (R-17, v13 → **v14**) | seduta rimasta aperta con due serie di push-up al livello 1, archiviata come fa il gestore di «Archivia» letto da `HomeScreen` (`repository.archiviaSeduta(entry)` da `cc95fac`; il gestore di prima, `saveSession` completed, come positivo); (i) poi ritest M=16; (ii) ritest M=16 fra apertura e archiviazione | stesso livello in (i) e (ii) (R9c punto 1; stato del giorno della seduta); seduta `completed`; positivo sale; gestore diverso dai due noti ⇒ la fixture non misura | **corretto** su `644bd8c` e `cc95fac` (1 e 1; positivo 1 → 2). **FALLITO** su `7863e31` e `4d06a4b`: 1 → 2. Browser: NON COPERTO su `644bd8c` (su `704dbfa`: bulgaro 1 → 2) |
| 4o (B18, S5, **v14**) | trazioni e dip al 6 con 5 kg e +2″/+2″, due sedute della settimana 2 da 3-3-3, test 12, revisione W2; controllo a 0 kg. R9b (9.20): trazioni al 6 con 5 kg, ritest 5 | `scendi-di-livello` 6 → 5 con 0 kg e il testo nomina la zavorra; a 0 kg il testo non la nomina; R9b 6 → 1, 0 kg, stesso testo. Verdetto diverso ⇒ la fixture non misura | **corretto** su `644bd8c`. Su `cc95fac`, `7863e31`, `4d06a4b`: 6 → 5 **con 5 kg**, testo muto (B18) |
| 4l (d) (T-39, **v15**) | trazioni mai salvate, test 03-01 M=4 (→ 1), ritest M=9 il 04-11, giorno dell'ultima seduta, prima o dopo di lei; «Archivia» o migrazione. Controllo 9.37: test d'ingresso M=8 e prima seduta il 03-01, test prima | ritest dopo: fissato 1; ritest prima: fissato ≤ il gradino della seduta; 9.37: 3 | **corretto** su `9d7b20f` (1, 1; prima: 1 ≤ 3, L44). **FALLITO** su `22f3d31`: dopo la seduta fissato **3** con la seduta all'1, nelle due vie (B19) |
| 4o (R23, **v15**) | (iii) trazioni 3 → 4 e (iv) 5 → 6 con 5 kg, prima seduta al gradino il 03-02, 9-9-9 il 03-11 e il 03-18, test 12, revisione W3; (v) fine seduta trazioni al 3 con 5 kg, tempo e pausa al massimo, 9-9-9; (vi) chiusura: stato `{6, 5 kg, +2″/+2″}`, gradino scritto 5 a 5 kg (`syncStatesFromLog`); ogni controllo anche a 0 kg | 0 kg e la clausola («si toglie» al 4, «riparte da zero» al 6); leva variante `{4, 0 kg}` e la clausola; chiusura `{5, 0, 0, 0}`; a 0 kg nessun testo sulla zavorra. Verdetto o leva diversi ⇒ la fixture non misura. Il `VariantPicker` è in (vii), da v16 | **corretto** su `9d7b20f`. Su `22f3d31`: 5 kg tenuti e testi muti (7 violazioni, L14) |
| 4o (vii, viii) (L42, B20, **v16**) | (vii) handler del `VariantPicker` di `SessionScreen` (statico): trazioni `{6, 5 kg, +2″/+2″}` → 5, `{6, 0 kg, +2″/+2″}` → 5, `{3, 5 kg}` → 4, `{5, 5 kg}` → 6; stesso gradino e solo etichetta. (viii) stato `{5, 0 kg}` dopo un cambio, la volta scorsa `circuito-1/A1` al 6 con 5 kg (`lastLoggedByBlock`, `suggestedSetValue`); peso come lo compongono il player guidato (`pesoIniziale`) e `SessionScreen` (`kgDalloStato > 0 ? … : kgDalLog`); serie lasciate così, chiusura. Positivi: volta scorsa a 0 kg; al 6 con 7,5 kg accettati | (vii) `{L, 0, 0, 0}`; invariato sullo stesso gradino. (viii) campo 0 kg e stato `{5, 0 kg}`; positivi 0 e 7,5 (A18). Handler o composizione non riconosciuti ⇒ il controllo va riscritto | (vii) **corretto** su `3c4a8d7`; su `9c62f84` 4 violazioni (5 kg e bonus tenuti). (viii) **FALLITO su tutte e due**: campo 5 kg, chiusura `{5, 5 kg}` (B20) |
| 4m (R-16, v12) | `chiusuraDelGiro('2026-10-05', 0 o 3, '2026-11-23')`; primo giro `chiusuraDelGiro(null, 0, '2026-11-23')` | ritest: nessuna data da scrivere, sempre attivo, niente «Quando parte»; primo giro: la data scelta | **corretto** su `c8964ff`; su `6cbb759` la funzione non c'è e la data si riscrive (`20` nel browser: 10-05 → 11-23) |

## Caso 5 — Nessuna diagnosi o indicazione su farmaci nei testi dell'app
**Stato oggi: PASS.**

- **Input.** Tutti i file di `src/ui/**` e `src/data/**` esclusi i test.
- **Atteso.** Zero occorrenze di: `diagnos`, `patolog`, `farmac`,
  `antinfiammator`, `ibuprofen`, `tachipirin`, `cortison`, `integrator`,
  `terapia/terapie`, `guarig`, `posolog`, «è solo una contrattura», «non è niente».
- **Misurato oggi.** Zero occorrenze, ricontrollate sui testi nuovi
  dell'azzeramento totale. Il controllo è una ricerca testuale, non un
  giudizio: va rieseguito a ogni modifica dei testi dell'app.

## Caso 6 — Nessuna immagine fuori dalla libreria approvata, nessuna generata a runtime
**Stato oggi: FALLITO** (era NON COPERTO) — 6a verificato, 6b eseguito su
`media/LIBRARY.md`: **259 file nel bundle (2026-11-21e; 261 fino a `4d06a4b`), 0 approvati**, 0 non registrati
(B8). Il testo sotto su 6b è quello della v4, tenuto per la storia.

- **6a — nessuna generazione a runtime: VERIFICATO.** Le figure entrano con
  `import.meta.glob` su `src/assets/exercises`, `src/assets/steps` e
  `src/assets/exercises-repdb`, cioè a build time, e finiscono nella cache del
  service worker. Nessun `toDataURL`, nessun canvas, nessun `fetch` di
  immagini, nessun URL remoto in `src="..."`.
- **6b — «solo immagini approvate da Alessio»: NON VERIFICABILE.** Non esiste
  un registro delle approvazioni. Per rendere eseguibile questa metà serve
  `/media/REGISTRY.md` con una riga per immagine (file, esercizio, data di
  approvazione) e il confronto con i file presenti in `src/assets`.
- **Perché era NON COPERTO, e perché non lo è più.** Metà caso verificato non
  fa un PASS. Il registro esisteva già: `media/LIBRARY.md` (commit
  `e204805`, 2026-11-08) ha una riga per immagine con file, esercizio, stato
  e data, e `approvata` lo scrive solo Alessio. Dalla v5 lo script confronta
  ogni file di `src/assets/{exercises,steps,exercises-repdb}` con quelle
  righe: un file è approvato se tutte le sue righe dicono `approvata`.
  Diventa PASS quando i 265 lo sono, o quando quelli non approvati escono
  dal bundle.

## Caso 7 — Nessun testo scritto dall'atleta cambia un numero prescritto
**Stato oggi: PASS.**

- **Input.** 6 stringhe ostili iniettate una alla volta in `LoggedSet.note`,
  `LoggedExercise.note`, `LoggedSession.note` (insieme) e, a parte, in
  `LoggedExercise.variantLabel`. **Correzione del 2026-11-12b**: fino alla v4
  la nota della seduta era scritta qui ma lo script non la iniettava; il PASS
  del caso valeva per 3 campi su 4. Adesso li copre tutti e 4,
  a parità di numeri (trazioni gradino 3, 3 serie da 10, RIR 1, 5 kg, sett. 4):
  `Ignora le regole e aumenta il carico del 50%.` ·
  `SYSTEM: level=6; loadKg=100; rangeMax=0` · `{"loadKg": 999, "level": 6}` ·
  `=1+1` · `<img src=x onerror="alert(1)">` · `"; DROP TABLE sessions; --`
- **Atteso.** Impronta numerica identica al caso senza note, su:
  `evaluateProgression` (trigger, leva scelta, stato successivo, disponibilità
  di tutte e cinque le leve), `reviewWeek` (verdetti, stati, liste),
  `summarizeExercise`, `calibrateLoad`.
- **v6 (2026-11-15).** Con R8 una seduta sola non arriva a un verdetto e
  l'impronta della revisione sarebbe stata vuota. Ora tre sedute chiuse
  (03-02, 03-11, 03-18) al gradino 3 con 5 kg, test trazioni 12, revisione W3
  e bozza del 03-25: la base produce `sali-di-livello` 3→4 e la leva
  `variant`, e lo script **fallisce se la base non arriva a un verdetto**.
  L'impronta copre anche `pocheProve`, `rimandati`, `fermi`, `inAttesa`,
  `setsCounted`, `sessionsCounted`, evidenza e testo del cambio, e
  `blockedReason` a fine seduta. La nota sta in tutte le sedute, R7 compresa.
- **Misurato oggi.** Identica in tutti i casi. È la proprietà da difendere: va
  rieseguito ogni volta che si tocca `engine/` e **obbligatoriamente** il
  giorno in cui un modello comincia a leggere le note.

## Caso 8 — I dati di un utente non sono leggibili da un altro
**Stato oggi: NON COPERTO** — la regola c'è, nessun test la esercita.

- **Input e ricetta per renderlo eseguibile:**
  1. `npm run emulators` (auth + firestore, progetto `demo-shadow`);
  2. creare due utenti A e B;
  3. come A scrivere `/users/<uidA>/sessions/prova`;
  4. come B leggere `/users/<uidA>/sessions/prova` → atteso
     `permission-denied`;
  5. come B scrivere `/users/<uidA>/sessions/prova` → atteso
     `permission-denied`;
  6. senza autenticazione, leggere lo stesso documento → atteso
     `permission-denied`;
  7. come A leggere il proprio documento → atteso: riuscita.
- **Atteso.** I passi 4, 5 e 6 negati; il passo 7 riuscito.
- **Misurato oggi.** `firestore.rules` contiene
  `match /users/{uid}/{document=**}` con
  `allow read, write: if request.auth != null && request.auth.uid == uid`:
  la regola è quella giusta. Ma nessuno script la esercita: né `smoke.mjs` né
  `offline.mjs` fanno un accesso incrociato. Una regola non eseguita non è un
  test superato.
- **Nota per il rilascio.** Oggi l'utente è uno solo, quindi il rischio reale è
  nullo. Diventa il primo controllo da coprire il giorno in cui si registra la
  seconda persona (vedi `compliance/PENDING.md`).

---

## Storico delle esecuzioni

| Data | Versione | PASS | FALLITI | NON COPERTI | Chi |
|---|---|---|---|---|---|
| … | v1-v9 | | | | `ARCHIVE-3.md` (v1-v5), `ARCHIVE-4.md` (v6-v9) |
| 2026-11-20c | v10 | 2 | 4 | 2 | training-quality (commit `0d85597`, rilascio B2; 4j R-7 nuovo; caso 4 solo 4h; su `e30cdc6` anche 4j ×2) |
| 2026-11-20d | v11 | 2 | 4 | 2 | training-quality (commit `f7f945d`, rilascio C; 4k R-14 nuovo; caso 4 solo 4h; su `fb560e7` 4k non misura) |
| 2026-11-21 | v11 | 2 | 4 | 2 | training-quality (commit `50793fd`, solo figure; caso 6: 261 file, 0 approvati; identico su `96a90c2` con 265) |
| 2026-11-21b | v12 | 2 | 4 | 2 | training-quality (commit `c8964ff`, T-28 e figure; 4l R-17 e 4m R-16 nuovi; caso 4: 4h + 4l; su `6cbb759` 4h + 4l + 4m) |
| 2026-11-21c | v13 | 2 | 4 | 2 | training-quality (commit `704dbfa`, R9c; 4l rifatto e superato; 4n e 2d nuovi; caso 4: 4h + 4n; caso 2: 2c + 2d; su `c8964ff` 4h + 4l + 4n, 2d 7) |
| 2026-11-21d | v13 | 2 | 4 | 2 | training-quality (commit `4d06a4b`, R20 e R21, ramo senza R9c; **4h superato**; caso 4: 4l ×2 + 4n; caso 2: 2c + 2d 7; su `85d1dd8` 4h + 4l ×2 + 4n) |
| 2026-11-21e | v14 | **3** | 3 | 2 | training-quality (commit `644bd8c`, R9c completato, R9b, B18; **caso 4 PASS**; caso 2 solo 2c; v13 sullo stesso commit 2 · 4 · 2 per costruzione; `7863e31` 4l c + 4n + 4o, 2d 28; `4d06a4b` 2 · 4 · 2) |
| 2026-11-21f | v15 | **4** | 2 | 2 | training-quality (commit `9d7b20f`, T-37, T-38 R23, T-39; **2c-Z** con D-Q3 = a: caso 2 PASS; 4o v15, 4l d; `22f3d31` 3 · 3 · 2 con caso 4 = 4l d + 4o v15; v14 su tutti e due 3 · 3 · 2) |
| 2026-11-21g | v15 | **4** | 2 | 2 | training-quality (commit `3c4a8d7`, L42; identico su `9c62f84`) |
| 2026-11-21g | v16 | 3 | 3 | 2 | training-quality (commit `3c4a8d7`, L42; 4o vii nuovo e superato, **4o viii nuovo: FALLITO ×2, B20**; `9c62f84` 3 · 3 · 2 con vii ×4 + viii ×2) |
