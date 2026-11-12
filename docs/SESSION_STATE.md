# Dove siamo

Aggiornato: 2026-11-12 · branch `claude/calisthenics-pwa-offline-kor52w`

## Compito in corso
**Revisione totale** chiesta da Alessio: design, esperienza d'uso, grafiche,
tracciamento, suggerimenti, immagini. Da `03c7395` in poi, tutti i commit con
verify, smoke e offline verdi.

Verdetti, nell'ordine del flusso:
- `exercise-media-lead`: 11 figure chiuse, 4 da rifare (pull-over-trx
  peggiorata dalla revisione: collo a 66°).
- `training-quality`: NO-GO, 7 Bloccanti. Tre difetti nuovi del player (A12,
  A13, A14) corretti in `2d84d87`; A11 corretto alla radice dopo il gate.
- `release-gate` su `2d84d87`: **NO-GO**. A12-A14 chiusi; A11 era ancora
  aperto ed è stato corretto dopo. Restano i Bloccanti che sono decisioni.

**Un nuovo giro di training-quality e del gate ha senso solo dopo le
decisioni di Alessio qui sotto**: con B1-B4, B6, B8, B9 aperti il verdetto è
NO-GO per costruzione, qualunque cosa cambi nel codice.

Checklist UAT di 10 minuti scritta da `release-gate` in
`release/reports/2026-11-12-claude-calisthenics-pwa-offline-kor52w.md`.

Ambiente cloud dedicato creato: **Shadow (Training)**, senza le variabili
degli altri progetti. Questa sessione gira ancora sul Default.

## Cosa è cambiato nella revisione
- **Player**: si legge nel recupero (figura, numeri, tempo a parole, volta
  scorsa); la serie parte da sola a fine recupero; finitura a tempo e
  decompressione scorrono senza chiedere dati; «Fatto» sempre a schermo;
  l'intestazione dice dove sei e quanto sei indietro sull'orologio.
- **Riepilogo**: niente domanda sul tempo per finitura e decompressione;
  durata vera e confronto con il piano. Bug vero chiuso: accettare una leva
  a fine seduta non faceva niente nel player guidato.
- **Home**: tre stati (in corso, fatto per oggi, prossima), avanzamento della
  settimana, ingranaggio per le impostazioni, icone vere, date in italiano.
- **Scheda**: stessi titoli e figure del player, recuperi con il loro nome,
  volta scorsa, miniature leggibili.
- **Metodo** (regole di training-designer, ancora proposte): R1 gradino di
  partenza dal test, R2 15" prima della finitura, R3 un solo conto del volume.
- **Diario** a schede invece della tabella da 1175 px; **onboarding** che dice
  da che gradino parti invece del range 55-75%; impostazioni in italiano.
- **Immagini**: famiglia hip-thrust rifatta (lockout, varianti, campana),
  circonduzioni e step rapidi nuovi, frecce tolte, braccia fuori dalla testa.

## Domande aperte per Alessio
0. **B6** (attrezzatura), **B8** (nessuna figura approvata da lui), **B9**
   (30" di dead hang a chi ne ha misurati 8): ancora Bloccanti.
1. **R2 si scosta dall'orologio scritto della scheda** di 15 secondi a seduta
   (tra Tri-set 2 e finitura). Si toglie con una riga se preferisci
   l'originale.
2. **R4: 7 test invece di 9** (fuori nordic e dead hang, che il circuito non
   usa). Non applicato.
3. **D-12**: scambiare le stazioni della finitura in S1 e S3 perché lo swing
   non venga subito dopo carry e hollow hold. Cambia l'ordine della scheda.
4. **D-13…D-15**, **L14/S9**: vedi `training/reports/2026-11-12-training.md`.
5. **Volume**: la fascia 16-20 è irraggiungibile per costruzione su tre
   gruppi. L'app ora lo mostra a parte; resta da decidere se cambia la fascia
   o la scheda.
6. Le **due dichiarazioni false sulla licenza RepDB** (una in `CLAUDE.md`).
7. **Le sette variabili del Default** (chiavi «AZIONI_…», `KEY`, `Secret`,
   `endpoint`) erano raggiungibili in tutta questa sessione: se sono
   sensibili vanno ruotate.
8. Bundle ID per TestFlight (in sospeso).

## Decisioni prese
- **2026-11-12, Alessio: soglie approvate.** Tutto ciò che in
  `quality/GRID.md` era «proposto» a quella data: le soglie dei criteri
  C1-C8, la regola di esito (GO solo con Bloccanti = 0 e Alti = 0 su L), le
  soglie di progressione S1-S10, le voci v3 V-GIUNZIONE e M-RIEP-SEDUTA. Il
  testo è di training-quality; l'approvazione lo rende vincolante.
- **2026-11-12, Alessio: B1-B4 bloccano solo il rilascio pubblico.** Dolore,
  condizione medica, segnali sul rapporto con cibo e corpo, minorenni: finché
  l'app la usa solo lui restano difetti noti e registrati, non bloccanti. Il
  nucleo di sicurezza continua a eseguirli per intero a ogni rilascio e a
  riportarli per quello che sono (FALLITO o NON COPERTO, mai PASS). Diventano
  Bloccanti il giorno in cui l'app ha un secondo utente.
- Programma attivo: quattro circuiti senza giorni (`src/data/circuit.ts`). Lo
  Shadow (`src/data/program.ts`) è archiviato e si legge solo nel diario.
- Nessuna AI nel prodotto: i consigli sono verdetti deterministici di
  `engine/review.ts`. I file degli agenti sono scritti per questo.
- `exercise-media-lead` è curatore, non generatore: il termine 5 della licenza
  RepDB vieta di usare quelle immagini come riferimento per modelli generativi.
- Si resta su questo branch.
- Le cartelle di memoria le riempiono gli agenti, non la sessione principale.

## Fatto in questa tappa
- `src/data/circuit.ts` riscritto sull'originale: riscaldamento unico in tutte
  e quattro, Tri-set A, Tri-set B (braccia e vita), finitura a quattro
  stazioni, decompressione. Orologio entro 25 secondi da quello della scheda.
- **Due bug veri trovati dall'orologio**, non dal codice:
  - `minWorkSeconds` raddoppiava un `workSeconds` dichiarato sugli esercizi
    per lato. La colonna «lavoro» della scheda conta già tutti e due i lati:
    il bulgaro chiedeva 200 secondi di countdown invece di 100, e ogni seduta
    sforava di otto minuti. Il test che c'era confermava il raddoppio, perché
    era stato scritto guardando il codice invece della scheda.
  - La pausa di blocco da 90" veniva messa anche tra Tri-set 2 e finitura.
- `hip-thrust-panca-bilaterale`: nuovo esercizio, gradino 2 della scala
  hip-thrust. Serviva perché la Seduta 4 prescrive l'hip thrust a due gambe e
  il blocco puntava a `hip-thrust-monopodalico`, che ha `defaultLevel: 4`:
  senza un test che lo abbassasse, l'app apriva la seduta prescrivendo il
  monopodalico con il range di quello a due gambe.
- Player guidato: il titolo segue il gradino (prima scriveva il nome
  dell'esercizio sopra la figura di un altro gradino) e mostra la nota della
  variante, che prima stava solo nella scheda — «un piede sul box» e
  «kettlebell in racked» non erano leggibili durante la serie.
- `groupLabel` sa dire «Decompressione»: con tre blocchi nel gruppo Z diceva
  «Tri-set Z».

## Corretto dopo il NO-GO
- **A9 — il countdown valeva meta' appena il gradino diventava unilaterale.**
  Causato dalla correzione di oggi: tolto il raddoppio di `workSeconds`,
  l'argomento che portava il `perSide` del gradino eseguito e' diventato
  codice morto su tutti e 52 i blocchi. L'hip thrust al gradino 3 dava 85
  secondi su 170 di lavoro vero. Adesso il `perSide` eseguito arriva come
  argomento suo e si confronta con quello del blocco.
- **B7 — la precompilazione portava i dati di un esercizio a un altro.**
  `lastLoggedByBlock` indicizzava lo storico per solo codice di blocco, e la
  riscrittura ha cambiato l'esercizio a 33 codici su 36: i chili della
  campana proposti come carico di una estensione sopra la testa, un 45 che
  passava da secondi di wall sit a ripetizioni. Adesso la funzione riceve cosa
  prescrive oggi ogni codice e scarta il resto.
- **A11 — il titolo del player nominava il gradino della settimana scorsa.**
  `buildDraftSession` prende l'etichetta dalla seduta scorsa e il gradino da
  adesso. La correzione di stamattina leggeva quell'etichetta, quindi dopo
  ogni salita accettata il titolo nominava il gradino vecchio sopra la figura
  del nuovo: lo stesso difetto che doveva chiudere, spostato di una settimana.
  Adesso l'etichetta si ricalcola dal gradino corrente.

## Lezioni, in ordine di costo
1. **`npx tsc --noEmit` qui non verifica niente.** Il progetto usa project
   references: il typecheck vero è `npm run typecheck` (`tsc -b`). Tre errori
   in `GuidedSession.tsx` sono passati sotto `--noEmit`.
2. **Un test scritto guardando il codice conferma il codice.** Il raddoppio di
   `workSeconds` aveva un test verde che asserviva 60 dove la scheda dice 30.
3. **Test di proprietà non trovano una scheda inventata.** Gli slug esistevano,
   le unità tornavano, l'orologio stava nei quaranta minuti: tutto verde su
   una scheda con metà degli esercizi sbagliati. Serviva la lista.

## Prossimi passi
1. `training-quality` e `release-gate` sulla scheda riscritta (dimensione L).
2. Le tre domande aperte qui sopra.
3. `BOUNDARIES.md`: è ancora il buco più grande.
4. Compromessi sui token: proposti, non applicati.
