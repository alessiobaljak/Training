# Dove siamo

Aggiornato: 2026-11-20 · branch `claude/calisthenics-pwa-offline-kor52w`

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
0. **Da decidere**: **B6** (attrezzatura), **B8** (nessuna figura approvata
   da lui), **B9** (30" di dead hang a chi ne ha misurati 8), **B10** (plank
   → slam senza pausa fra i giri della finitura di S4: 15" o un altro ordine,
   insieme a D-12) e il disaccordo su `circonduzioni-spalle`.
   Domande del designer per R9 (secondo rilascio): D-17, D-18, quando il
   ritest di rientro, D-4.
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
- **2026-11-21, Alessio:**
  - **B6:** ha sbarra, anelli, TRX, corde, elastici, kettlebell da 8, 12, 20
    e 24 kg e tutti i macchinari classici da palestra. B6 vale solo per il
    rilascio pubblico (come B1-B4).
  - **B8:** gli omini (figure SVG a bastoncino) vanno rifatti: «non voglio gli
    omini», trovare un'altra strada con Claude Design. Segnalato da lui: il
    rematore inverso TRX mostra un rematore alla sbarra (collegamento
    sbagliato in `exercise-art.ts`), e nessun controllo lo aveva visto.
  - **B9:** dead hang «30 secondi o finché reggi, ma minimo 30 se ce la fai».
  - **B10:** la finitura del circuito 4 deve restare coerente con gli altri
    circuiti (nessun passaggio fra i giri diverso dagli altri).
  - **M4:** dopo una pausa di 3 settimane l'app propone prima il ritest
    (D-18 sì: può far scendere, mai salire). D-17 non risposta: si applica la
    raccomandazione (a), le settimane slittano della durata della pausa.
  - «Poi lo storico di progressi, diario e misure cancella tutto»: richiesta
    di azzeramento dei dati. L'app ha già Impostazioni → «Azzera tutto»
    (conferma scritta CANCELLA, backup prima): lo fa Alessio, la sessione non
    ha accesso ai suoi dati di produzione.
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
- **2026-11-18, Alessio: V-LEVE approvata** (griglia v4: mai due aumenti
  dalle stesse sedute; prova 10.P, R10b, 13.P). Prossimo giro avviato: M18,
  L18-L21, tempo minimo con i bonus (training-designer); L17, L22 e la prova
  sul peso precompilato (sessione principale).
- **2026-11-16, Alessio: sì ai tre punti di training-quality.** (1) Il criterio
  «non peggiorati» vale anche per gli Alti preesistenti A10, A16, A17: GO al
  push di R5-R8. (2) A17 (due aumenti in 4 giorni: carico in revisione dopo la
  leva del tempo a fine seduta) e M17 (revisione aperta dopo la seduta del
  lunedì: esercizi sempre «rimandati») si correggono nel prossimo giro, con
  regole nuove di training-designer insieme a D-4. (3) Confermate la
  composizione dei criteri v2 e la lettura di S1 sui gradini eseguibili; per
  S9 il RIR «—» conta come a cedimento; `media/LIBRARY.md` è il registro delle
  approvazioni delle immagini.
- **2026-11-15, Alessio: D-16 alternativa.** Per un verdetto della revisione
  valgono le ultime 2 sedute chiuse dell'esercizio allo stesso gradino e
  carico, entrambe negli ultimi 14 giorni, non la settimana di calendario.
  Serve ancora il parere di training-quality su questa lettura di S4.
- **2026-11-15, Alessio: CLAUDE.md aggiornato.** Fino al rilascio pubblico un
  push con verify, smoke e offline verdi va in produzione senza ok; le
  modifiche al metodo aspettano training-quality.
- **2026-11-15, Alessio: per ora un push va in produzione senza il suo ok se
  i test passano.** Il ramo di produzione su Vercel è questo, con
  l'assegnazione automatica accesa: ogni push è un rilascio. Prima di ogni
  push la sessione principale esegue verify, smoke e offline (Vercel esegue
  solo verify). CLAUDE.md allineato lo stesso giorno.
- **2026-11-12, Alessio: A2, A3, A4, M1, M4 restano Bloccanti.** Toccano lui
  già oggi (gradino e carico di ogni settimana), a differenza di B1-B4. Prima
  servono le regole di training-designer, poi codice, quality e gate.
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

## Produzione
Ogni push su questo ramo è un rilascio (Vercel, assegnazione automatica).
Punto di ritorno, aggiornato a ogni push:
- in produzione: **rilascio C**, versione finale del giro R14-R19 (`d8c18ce` L26, `4142059` L25, `17ea244` M22, `f7f945d` B14; 2026-11-20; training-quality GO, release-gate GO per regressioni, nucleo v11). **Punto di ritorno: `fb560e7`** (B2): diff su `src/types`, `src/db`, `firestore.rules` vuoto. Prima: `e30cdc6` (B1), `59daf79` (A), `001de30`, `721fd42`.
- **Limite del ritorno a `e30cdc6`:** il vecchio `backup.ts` rifiuta per intero un backup che contiene un record `lapsed`; uno senza si importa. La lettura dei `lapsed` già salvati da parte del vecchio codice non è provata.
- `git diff e30cdc6..ebd3a34`: `firestore.rules` invariato; `src/db` e `src/types` aggiungono `lapsed` e `ref` (opzionale), `DATA_VERSION` invariato. Procedura in `docs/configurazione.md` §10, mai
  eseguita in produzione (il gate la segna NON VERIFICATA).

## Aperti dopo R10-R13 (quality, `quality/reports/2026-11-16-quality.md`)
- Per training-designer: M18 (manubrio accettato e non eseguito: cosa resta
  nello stato), L18/L19 (quando il diario «spiega» un aumento), L20, L21.
- Per Alessio: D-19 (b) quali manubri ha e se il salto supera 2,5 kg; goblet
  squat, stacco rumeno, estensione dei tricipiti con manubri o kettlebell;
  V-LEVE nella griglia v4.
- Trovato dalla sessione principale: il minimo di durata della stazione
  («Deve durare almeno 30″») non cresce con i secondi di tempo accettati.
- L17 (punto decimale nei kg) chiuso solo in revisione: restano 4 posti.
- release-gate su `274d12f`: GO per regressioni. Lo smoke controlla la metà
  «tempo» di A18, non la metà «peso dallo stato»: da aggiungere insieme a M18.

## Giro R14-R18 (`training/reports/2026-11-18-training.md`)
- Rilascio A: R18 (minimo di durata con i bonus) → R16 (scarico e
  scarico-coppia stessa famiglia in R11) → R17 (R13 tace se non resta una
  leva) → R15 (cosa spiega un aumento del diario; data = seduta che lo
  esegue, D-20 a) → R14b. Rilascio B: R14a, c, e (record `lapsed`) → R14d
  (già anticipata il 2026-11-18 come correzione di R-7: `pesoIniziale`).
- **2026-11-20, Alessio: «D20 a e B».** Letta come D-20 (a) sì e (b) sì:
  carico e gradino contano dalla seduta che li esegue, tempo e pausa dalla
  prima seduta dopo la scelta. Ambiguità segnalata: «B» potrebbe voler dire
  lo stile B (Sagoma) delle prove di immagine; se è così, (b) va rifatta.
- **Rilascio A, stato 2026-11-20:** R18, R16, R17, R15, R14b implementate,
  commit locale, verify (857), smoke e offline verdi. Il controllo R18 nello
  smoke è stato fatto fallire apposta (atteso 37″, l'app dice 36″) per
  provare che si esegue. Non pushato: aspetta training-quality.
  - R14e **non** anticipata: è nel rilascio B come dice il designer. Senza
    R14e, su un manubrio a 0 kg il testo R14b dice «Oggi hai usato 0 kg…»,
    vero rispetto alla sincronizzazione di oggi (L2 resta aperto).
  - La sincronizzazione legge un esercizio in più blocchi una volta sola, al
    peso più alto scritto (b.6: lo stato resta 12 kg).
  - Fixture di 17 prove vecchie corrette: lo stato era al gradino 6 e la voce
    registrata sempre al 3 (fissato in `__fixtures.ts`). Con R14b la voce
    deve essere allo stato; la correzione è nei dati delle prove, non nella regola.
  - Non coperte nel rilascio A: 14.x e 15.12 (servono i record `lapsed`),
    16.4 (nessuna prova scritta), b.8 (è R14e).
  - **training-quality GO su `4edf751`** (`quality/reports/2026-11-20-quality.md`):
    nessun Bloccante o Alto nuovo; chiude B13 (in produzione la prima seduta a
    2,5 kg propone già 5 kg). A19 (durata in Home senza i bonus) corretto
    nello stesso push: il badge usa gli stati, come panoramica e player.
  - Nuovi: M19 (durata oltre i 40′ con i bonus), M20 (7,7% degli aumenti
    eseguiti in scarico), M21 (testo R14b alla prima seduta, «stato 0 kg»),
    L23 (seduta con data futura e R13), L24 (gradino della prima o
    dell'ultima voce nella sincronizzazione; latente).
  - Per Alessio: tetto di durata 40′ o 55′ e voce D5 in C8 (M19); un aumento
    eseguito in scarico conta come aumento in scarico (M20, quality dice sì);
    V-LEVE in C4.
  - Per training-designer: L23, L24, 17.2 «dal 2 aprile» con D-20 (b), 16.4
    non costruibile, testo M21. **Risposte il 2026-11-20** in
    `training/reports/2026-11-20-training.md` (vale sopra la 11-18):
    - L23: la seduta che esegue si cerca fra tutte quelle chiuse, e un aumento
      con data futura ferma come uno di oggi (`aumentoRecente` oggi scarta i
      `giorni < 0`). L24: il gradino più alto fra le voci, come il peso.
    - Task per il rilascio B: T-17 (L23), T-18 (L24), T-19 (M21, «Primo peso
      scritto su questo esercizio…»), T-20 (17.2 dal registro), con T-15/T-16.
    - Risposta della sessione principale alla domanda 4: una seduta prende la
      data del dispositivo all'apertura della bozza (`useSessionDraft`); non
      c'è modo di cambiarla a mano (la striscia dei giorni è delle misure).
      Una data futura nasce solo da un orologio avanti, da due dispositivi
      sfasati o da un backup ripristinato da un altro dispositivo. Una bozza
      a cavallo della mezzanotte tiene la data di partenza, cioè passata.
      T-17 resta a priorità media.
  - **2026-11-20, Alessio: «A per tutte».** D-21 (a): a fine seduta niente
    leve in salita nella settimana prima dello scarico. D-22 (a): tetto di
    durata 55′, oltre il tetto niente tempo né pausa. D-23 (a): un gradino
    scritto a mano diverso dallo stato riporta tempo e pausa alla scheda.
    «B» di D-20: lasciato stare da Alessio, D-20 (b) resta com'è.
    D-19 (b), risposta provvisoria («credo»): manubri da 3 a 10 kg a passi di
    1 kg, poi 12 e a passi di 2 kg fino a 24. Da confermare prima di usarla
    come regola; il tetto di +2,5 kg permette 3 → 5 kg (+67%).
  - **Rilascio B diviso:** B1 = T-17, T-18 + T-23, T-19, T-20, T-21, T-22
    (nessun dato nuovo); B2 = T-15 (record `lapsed`, R14a/c/e) + T-16 (R14d).
  - **B1 implementato** (commit locale): verify 880, smoke, offline verdi;
    15 prove nuove falliscono togliendo le regole. In attesa di
    training-quality e release-gate.
    - 15.16 in revisione spostata di un giorno (revisione lunedì 23, seduta
      datata martedì 24): con l'inizio delle prove la settimana 3 finisce
      domenica 22 e la revisione sarebbe «in corso».
    - Nota del circuito 4 riscritta col testo del designer; `DEVIAZIONI`
      accetta solo esercizi, quindi il motivo sta in un commento accanto.
    - R19 vale a fine seduta. La revisione (R10a 2-3) può ancora dire «la
      prossima leva è il tempo» su un circuito oltre il tetto: è M22 (Medio).
  - **training-quality GO su `221b2e8`** (`quality/reports/2026-11-20-quality-221b2e8.md`,
    script `16-b1.mts`, nucleo v9). Nuovi: M22 (testo della revisione oltre il
    tetto), L25 (σ′ senza la variante proposta più su: fino a 56:07), L26 (nota
    del circuito 4 non verificata da un test; con l'hip thrust si arriva a 59′).
    D-21 in C2 toglie 912 proposte (−17,5% degli aumenti accettati).
  - Smoke: aggiunto A19 (badge Home = panoramica, con stati a +2″/+2″; 37′ → 41′).
  - Per Alessio (quality): M20 residuo, cioè un aumento scelto in W4 ed
    eseguito in scarico, costo accettato o regola? D5 in C8 con la variante
    dell'hip thrust oltre il tetto. V-LEVE in C4.
  - Per training-designer: M22, L25, L26, M20 residuo.
  - **2026-11-20, Alessio:** manubri confermati (D-19 b): da 3 a 10 kg a
    passi di 1 kg, poi 12, 14, 16, 18, 20, 22, 24. M20 residuo (scelta di W4
    eseguita in scarico): costo accettato. Variante dell'hip thrust oltre il
    tetto di 55′ (D5): accettata. **«Smettila di chiedere conferme e deploya in
    produzione la versione finale»**: da qui si procede senza domande; restano
    obbligatori training-quality sulle modifiche al metodo e il nucleo di
    release-gate a ogni rilascio (CLAUDE.md, regole che non si toccano).
  - Piano fino alla versione finale: training-designer su D-19 b (manubrio
    successivo esatto), M22, L25, L26 → B2 (T-15 record `lapsed`, R14a/c/e;
    T-16 R14d) + regole nuove del designer + secondo giro liquid glass sui
    contenitori → quality → gate → push. Stile delle figure: resta una scelta
    di Alessio (CLAUDE.md: solo immagini approvate da lui).
  - **B2, T-15 fatto** (commit locale): record `lapsed` con `ref`, motore in
    `src/engine/decadenza.ts`, R14a nel riepilogo (R13 senza la scelta tolta),
    R14e nella sincronizzazione e nel riepilogo, R14c in revisione (motivo
    `decaduta`), `sessionDecisions` e `aumenti` ignorano i tolti, backup con
    `lapsed` e `ref`, chiusura con `recordDecision` (stato + record insieme).
    Prove 14.1-14.17 e b.8; smoke R14 end-to-end (stacco 10,5 → seduta a 8 →
    R14a → chiusura → stato 8 kg +1″/+1″ e record `lapsed` letti
    dall'emulatore). verify 894, smoke, offline verdi.
    - Testo inventato dalla sessione principale, da far vedere a quality: R14a
      livello con `v < B` («Oggi hai fatto il livello <v>, sotto quello di
      prima…»), che la specifica non scrive.
    - T-16 (R14d) aspetta il designer su D-19 (b).
  - **B2 completo** (commit locali `3b4db08`, `d5f72e2` vetro, poi T-16 + T-24):
    - T-24 (D-19 b, appendice `2026-11-21-training.md` §1): `MANUBRI_KG`,
      `manubrioDopo`, leva del manubrio esatta, testi `mai-scritto`,
      `fuori-elenco`, `cima`, `oltre-s2`, R17c 3 e 5, R10a (6) con motivo
      `manubrio`, `<cosa>` nuova. Prove D19.1-D19.20, D19.P, D19.12.
    - T-16 (R14d): testo della stazione; con un manubrio in attesa il peso
      parte da B anche senza una seduta precedente (prima partiva dallo
      stato, cioè da T: buco trovato dalla sessione principale). Il passo del
      peso sui manubri è 1 kg. Smoke: stazione dello stacco, testo e 8 kg.
    - `SessionScreen` non apre sedute di circuito (App.tsx: `eCircuito` →
      GuidedSession): D19.21 non si applica; R-7 lì riguarda solo il programma
      archiviato.
    - verify 908, smoke, offline verdi.
  - Rilascio C dopo B2: T-25 (M22), T-26 (L25), T-27 (L26; `NOTE_SCHEDA` resta
    NON COPERTA senza il foglio originale).
  - **B14 (quality, Bloccante, già in produzione):** il riquadro «Aggiungi 2,5
    kg» del riepilogo senza i controlli delle leve. Correzione prudente nel
    rilascio C: niente calibrazione nei circuiti.
  - Rilascio C in produzione (cherry-pick sul ramo: `d8c18ce`, `4142059`,
    `17ea244`, `f7f945d`); B14 chiuso. Aperti Bassi per training-designer: L27,
    L28, L29 (testi R14a), L30 (revisione «tetto» contro riepilogo «scrivi il
    peso» al circuito 4), L31 (calibrazione sulle sedute archiviate), L32
    (nessun testo per un carico troppo pesante nei circuiti, M3). Per Alessio:
    D-Q1 (scenario P-MAN nel criterio di sicurezza), stile delle figure.
    Restano i Bloccanti B6, B8, B9, B10, M4 e B1-B4 (rilascio pubblico).
  - Decisioni nuove per Alessio (forma chiusa nell'appendice): D-21 (M20,
    aumento eseguito in scarico; designer e quality: a, niente leve a fine
    seduta nelle settimane 5, 11, 17), D-22 (M19, tetto di durata; designer:
    a, 55′), D-23 (gradino scritto diverso dallo stato: tempo e pausa tornano
    alla scheda? designer: a, sì), D-19 (b) manubri.
- Per Alessio: D-19 (b) manubri.
- Risposte della sessione principale al designer: nel player guidato il peso
  si scrive durante la serie (i campi compaiono a stazione partita, si
  registra a «Fatto»); una seduta chiusa non si modifica da nessuna schermata.

## Prossimi passi
0. Fatto dopo il gate su `79d2cb0`: `npm run smoke` prova in browser
   «Accetto» → ricarica → «Salva e chiudi» (B11, A15). Fallisce sul player di
   prima della correzione (3 controlli), passa su quello attuale. Procedura di
   rollback in `docs/configurazione.md` §10, mai eseguita. Le impostazioni
   mostrano il commit del build («Versione»), per verificare un rollback dal
   telefono.
1. Fatto: R5-R8 (A2, A3, A4, M1) implementate, training-quality GO,
   pushate il 2026-11-16; release-gate GO per regressioni.
   **In corso: R10-R13** (`training/reports/2026-11-16-training.md`, task
   T-1…T-9). Ordine: R12 (date diverse) → registro scritto insieme allo stato
   → R10a + R10c-0 (carico in revisione solo dopo tempo e pausa; manubri
   «leve finite» finché D-19 non decide) → R10b (coppia invalidata da una leva
   di tempo/pausa accettata) → R11 (rifatto dopo fine(W): si giudica se
   conferma) → R13a (un aumento di carico ogni 7 giorni, S2). Nove prove
   esistenti cambiano atteso: gli attesi vengono dal rapporto, non dal codice.
   Poi training-quality (domande 4-6 del designer), release-gate, push.
   **Decise da Alessio il 2026-11-16:** D-4 (a), un aumento per esercizio
   ogni 7 giorni di qualunque tipo, gradino compreso; D-19 sì, il manubrio
   successivo è la leva 5 come la zavorra; reset di tempo e pausa quando cambi
   manubrio di tua iniziativa: sì. Ancora aperte: goblet squat, stacco
   rumeno ed estensione dei tricipiti con manubri o kettlebell; quali
   manubri ha e se fra due consecutivi il salto supera 2,5 kg.
   Dopo: R9 (M4) con D-17, D-18.
2. Le domande aperte qui sopra.
3. `BOUNDARIES.md`: è ancora il buco più grande.
4. Compromessi sui token: proposti, non applicati.
