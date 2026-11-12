# Nucleo di sicurezza — 8 casi

Mantenuto da `training-quality`. **`release-gate` lo esegue per intero a ogni
rilascio, anche di dimensione S.** Nessun caso si salta, nessun caso si
riassume.

Versione: **v5** · 2026-11-12b · misurato su `src/` al commit `90b8b81`
(HEAD `8c8253d`, `src/` identico), **soglie approvate da Alessio il
2026-11-12**. v5: caso 4 con 4a anche su `tempoRespected = null`, 4h (S9) e
4i (S10); caso 7 inietta davvero la nota della seduta (la v4 la dichiarava e
non la iniettava). v4: caso 2 decidibile (R1), controllo 4g.

## Lettura dopo le decisioni del 2026-11-12

- **Soglie approvate**: i casi 2 e 4 misurano soglie vincolanti, non più
  proposte. Una violazione è un difetto Bloccante (GRID.md).
- **B1-B4 bloccano solo il rilascio pubblico.** Il caso 1 (B1) e i rimandi
  di B2-B4 si eseguono comunque per intero e si riportano per quello che sono:
  NON COPERTO o FALLITO, **mai PASS**. Il conteggio del nucleo non cambia per
  la decisione: cambia solo il peso sull'esito del rilascio a un utente.

## Fixture ripuntate il 2026-11-09b — da leggere prima di confrontare

La trascrizione della scheda (`f63c9f1`) ha cambiato esercizio a **33 codici di
blocco su 36** e ne ha eliminati 12 (`C1`, `C2`, `D` di tutte e quattro). Le
fixture del nucleo erano puntate ai codici, non agli esercizi, e il risultato è
stato peggiore di un fallimento: lo script **andava in crash** su
`circuito-2/C1`, e una volta tolto il crash dichiarava **2 soglie superate
invece di 4**, perché `review.ts:131` scarta in silenzio l'entrata registrata il
cui esercizio non coincide con quello del blocco. Due difetti aperti (A3 e A4)
sarebbero spariti dal rapporto senza che nessuna regola li avesse corretti.

| caso | prima | adesso | perché |
|---|---|---|---|
| 4a | `circuito-2/B1` rematore-inverso-trx | `circuito-2/A3` | l'esercizio si è spostato di blocco |
| 4b | `circuito-1/A1` 10-10-10 | `circuito-1/A1` **8-8-8** | il range è passato da 6-10 a 6-8: la fixture deve restare «massimo del range chiuso esatto», non «sopra il range» |
| 4c | `circuito-2/B2` sissy-squat | `circuito-3/A2` **push-up** | sissy-squat non è più in nessuna seduta |
| 4d | `circuito-4/A2` single-leg-rdl | `circuito-1/A2` bulgarian-split-squat | single-leg-rdl non è più in nessuna seduta |
| 4e | `circuito-2/C1` | `circuito-1/A1` | il codice `C1` non esiste più |
| 4f | `circuito-1/F3` kb-swing | `circuito-1/F1` | lo swing si è spostato di stazione |
| 3 | mappa attrezzi con 21 voci | **40 voci** | i 16 esercizi nuovi non erano nella mappa e la misura sottostimava: 32/48 → 37/52 |

**Regola che ne esce, da applicare a ogni fixture futura**: una fixture si
puntella sull'**esercizio e sul rapporto con il range** (dentro / al massimo /
sopra), mai sul codice di blocco da solo. Un codice di blocco è un indirizzo,
non un'identità.

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

## Esito del 2026-11-12b: 2 PASS · 4 FALLITI · 2 NON COPERTI

Il caso 6 passa da NON COPERTO a **FALLITO**: il registro che chiedevo esiste
dal 2026-11-08 (`media/LIBRARY.md`, stato `approvata` riservato ad Alessio) e
non l'avevo letto come tale per quattro giri. Il difetto è B8, già aperto e
non deciso. Il caso 4 ha 3 controlli in
più e 2 violazioni in più (S3 con `null`; S9 sul giro della finitura di
`circuito-4`, B10), nessuna delle due introdotta dai commit misurati: sono
controlli che prima non esistevano. 4i (S10) supera. Il caso 7 copre adesso
tutti e 4 i campi che dichiarava.

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
**Stato oggi: FALLITO** (era NON COPERTO): R1 rende il caso decidibile.

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
  2c: **4 blocchi** — `circuito-1..4/Z1` dead hang 30" al gradino 2, con 8"
  misurati allo stesso gradino. R1 riga 2 lascia gli esercizi dei blocchi
  esclusi al gradino della scheda (difetto B9).
- **2026-11-12b.** S7 è approvata. L'onboarding non scrive più «non usato
  nelle sedute» ma «solo nella decompressione, non si giudica» (`2d84d87`):
  vero, ma non cambia i 30" prescritti a chi ne regge 8. Il caso resta
  FALLITO per lo stesso motivo.
- **Se Alessio decide che S7 non vale per i blocchi esclusi** dalla revisione,
  2c va tolto e il caso diventa PASS: è una decisione, non una correzione
  dello script.
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
**Stato oggi: FALLITO** — 6 violazioni di soglie **approvate** su 10
controlli (4a doppio, 4b-4i). Supera: 4e (S2), 4f, 4g (T2), 4i (S10).

- **Input e atteso, controllo per controllo:**

| # | Input | Atteso | Misurato |
|---|---|---|---|
| 4a (S3) | sett. 2, rematore TRX `circuito-2/A3`, 19-19-19 sopra il range (8-10), `tempoRespected=false` **e, dalla v5, `null`** | nessuna salita di gradino | **salita proposta** al gradino 3 in tutti e due i casi; il tempo resta una cautela testuale («Non hai risposto sul tempo…»). Con `null` pesa di più dal `2d84d87`: il player guidato non scrive più «sì», quindi `null` è lo stato normale di chi non risponde nel riepilogo |
| 4b (S5) | sett. 3, trazioni `circuito-1/A1` al gradino 1 (assistite con elastico), 8-8-8 su range 6-8 (massimo esatto) | prima la variante (leva 4) | **«aggiungi zavorra»** (leva 5) su una trazione assistita |
| 4c (S1) | 3 settimane di fila con 19-19-19 su 12-18, push-up `circuito-3/A2` (era sissy squat, uscito dal circuito) | massimo 1 gradino ogni 2 settimane | **3 salite in 3 settimane** (da 1 a 4; da 1 a 6 in 5 settimane) |
| 4d (S4) | 1 sola seduta, bulgarian split squat `circuito-1/A2` (era single-leg RDL), 2 serie per lato (4 righe) da 13 su 8-12 | nessun verdetto: servono 2 sedute e 3 serie vere | **verdetto emesso**: `MIN_SETS_FOR_VERDICT` conta le righe, non le serie |
| 4e (S2) | chin-up gradino 6, zavorra 5 kg, massimo chiuso | passo di +2,5 kg | **+2,5 kg: corretto** |
| 4f | sett. 1, `kb-swing` della finitura (blocco con `excludeFromReview: true`), 12-11-12 su range 15-20 | nessun verdetto: il blocco è escluso dalla revisione | **nessun verdetto, nessuna uscita, `serie=0`: corretto dal 2026-11-09.** `review.ts` legge il flag; `effectiveBlock` lo conserva, quindi anche la stazione scambiata con l'alternativa resta fuori |
| 4g (T2) | sett. 3, sopra il massimo su tutte le serie: trazioni e dip dal gradino 1, pike dal 2, push-up dal 2 | un solo gradino **eseguibile**: 1→3, 1→3, 2→4, 2→3 | **corretto**: le sole negative si saltano, nessun gradino eseguibile scavalcato |
| 4h (S9) | `buildGuidedPlan` delle 4 sedute, settimane 1 e 6. Stabilizzazione del tronco: suitcase carry, hollow hold, plank con trascinamento, Pallof press, plank tocco spalla. Balistici carichi: swing, corda slam | ogni giunzione tronco → balistico ha ≥ 15" di passi `rest` in mezzo; se non ne trova nessuna il controllo fallisce (fixture vuota) | **violata**: `circuito-4` sett. 1, F4 plank tocco spalla → F1 corda slam del giro 2, **0"** (finitura: 15" fra stazioni, 0 fra i giri). Le giunzioni B3 → F hanno 15" (R2). In sett. 6 la finitura ha un giro e il caso non si presenta (B10) |
| 4i (S10) | (1) push-up `circuito-3/A2` gradino 2, 18-18-18 su 12-18, `tempoRespected=null`; (2) controllo statico di `GuidedSession.tsx`, come 5 e 6a | (1) nessuna leva oltre le ripetizioni; (2) ogni `setTempoRespected` del player scrive `false` | **corretto**: nessuna leva; 1 scrittura, `false`. Se il player tornasse a scrivere «sì» da una misura, (2) fallisce e il controllo va riscritto come misura (`07`) |

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
`media/LIBRARY.md`: **265 file nel bundle, 0 approvati**, 0 non registrati
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
| 2026-11-08 | v1 | 2 | 3 | 3 | training-quality (baseline) |
| 2026-11-09 | v2 | 2 | 2 | 4 | training-quality (commit `1802631`) |
| 2026-11-09b | v3 | 2 | 2 | 4 | training-quality (commit `f63c9f1`, 5 fixture ripuntate) |
| 2026-11-12 | v4 | 2 | 3 | 3 | training-quality (commit `47c7f6d`) |
| 2026-11-12b | v5 | 2 | 4 | 2 | training-quality (commit `90b8b81`, soglie approvate; caso 6 eseguibile su LIBRARY.md) |
