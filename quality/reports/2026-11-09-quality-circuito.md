# Rapporto di qualità — 2026-11-09 (secondo giro: trascrizione del circuito)

## Riepilogo ed esito rispetto alle soglie

**NO-GO contro le soglie proposte.** Bloccanti **8** (6 della baseline + 2
nuovi), Alti **8** (4 aperti + 4 nuovi), Medi **13**, Bassi **6**.

La riscrittura fa due cose vere e ne rompe tre che nessuno stava guardando.

Le due vere: la correzione di `minWorkSeconds` ha la direzione giusta — i
`workSeconds` della scheda sono totali di stazione, lati compresi, e il mio
ricalcolo indipendente lo conferma su tutti e cinque i blocchi unilaterali — e
l'orologio adesso torna al secondo: il mio calcolo indipendente della durata
coincide con `estimatedSeconds` su tutte e quattro le sedute, **scarto 0 s**.
Le sedute passano da 39,6-39,9' a 35:48-39:13 su un tetto di 40'.

Le tre rotte vengono tutte dallo stesso fatto, che il commit non nomina:
**33 codici di blocco su 36 cambiano esercizio restando lo stesso codice**.
L'app indicizza lo storico per codice di blocco, non per esercizio, e quindi
oggi propone all'atleta la zavorra e il valore di partenza di un esercizio
diverso (B7, Bloccante), la revisione settimanale butta via in silenzio tutto
lo storico dei 33 codici (A10), e tre fixture del mio nucleo di sicurezza
avevano perso il morso senza fallire (ricucite in questo giro, misura di nuovo
riproducibile).

Sulle due domande poste: la giunzione senza pausa **è** un caso di sicurezza,
**Alto**, con una correzione che costa 15 secondi e nessuna infedeltà alla
scheda (§Ipotesi, I1-I2). Il volume sotto la fascia **non è** un errore di
trascrizione: è aritmeticamente impossibile che non lo sia, e il numero da
guardare non è «tre gruppi sotto» ma «il programma produce al massimo 103,5
crediti-serie contro i 128 che la fascia pretende come pavimento» (§I3).

| Criterio | Soglia | 2026-11-09 (1° giro) | 2026-11-09 (questo giro) |
|---|---|---|---|
| C1 Sicurezza | 100% | 14% (1/7) | **14% (1/7)**, +1 Bloccante dentro voci già fallite |
| C2 Rimandi | 100% | 0% (0/4) | **0% (0/4)** |
| C3 Fedeltà | 100% | 67% (2/3) | **33% (1/3)** ↓ |
| C4 Coerenza | ≥90% | 33% (2/6) | **33% (2/6)** (29% con la voce V-GIUNZIONE proposta) |
| C5 Personalizz. | ≥80% | 67% (2/3) | 67% — **non rimisurato**, nessuna regola toccata |
| C6 Concretezza | ≥90% | 75% (3/4) | 75% — **non rimisurato** |
| C7 Progressi | 100% | 83% (5/6) | **83% (5/6)** |
| C8 Durata | 100% | 100% (4/4) | **100% (4/4)** |

Nucleo di sicurezza: **2 PASS · 2 FALLITI · 4 NON COPERTI** su 8, identico al
giro precedente — dopo aver ricucito le fixture. Prima di ricucirle lo script
**andava in crash** (`circuito-2/C1` non esiste più) e, una volta tolto il
crash, dichiarava 2 soglie superate invece di 4: due difetti aperti (A3 e A4)
sarebbero spariti dal rapporto senza che nessuna regola li avesse corretti.

## Oggetto

- Regole: `training/METHOD.md`, `PROGRAM_RULES.md`, `BOUNDARIES.md` — tutte
  versione 1.0 **proposta, non approvata**, invariate dal 2026-11-08.
- Catalogo: `src/data/exercises.ts` a **72 esercizi** (erano 56: +16 in questo
  commit), `src/data/circuit.ts` a **52 blocchi** (erano 48), `src/data/
  progressions.ts` invariato.
- Codice: commit `f63c9f1`, branch `claude/calisthenics-pwa-offline-kor52w`.
- Test del progetto: **34 file, 666 test, verdi**.
- Immagini verificate in questo giro: **1** (`hip-thrust-panca-bilaterale.svg`),
  più il confronto non giudicato con `hip-thrust-monopodalico.svg`.
- Misure rieseguite: `safety-core` (ricucito), `04-input-non-fidato`,
  `05-rotazione-attrezzi`, e il nuovo `06-circuito-trascrizione.mts`.
  **Non** rieseguiti: `01` (sostituito da `06` su questo oggetto), `02`
  (fixture da ricucire, vedi §Decisioni), `03` (nessuna regola toccata).

## Risultati per criterio

### C1 Sicurezza — 14% (1/7), invariato

Le sette voci falliscono per le stesse cause della baseline: nessun campo
attrezzatura, nessun livello dell'atleta, nessun tetto di progressione.
`BOUNDARIES.md` esiste dal 2026-11-08 ma **nessuno dei 13 limiti è
implementato**: `equipment`, `minLevel`, `prerequisites`, `sites`,
`contraindications` sono tutti assenti da `Exercise` (verificato in `06`).

Dentro voci già fallite si aggiunge **B7**, che è nuovo e attivo oggi.

Il caso 3 del nucleo passa da «32 blocchi su 48» a «**37 su 52**». Il numero
non è confrontabile uno a uno: la mia mappa degli attrezzi non conosceva i 16
esercizi nuovi e **sottostimava**. L'ho estesa in questo giro. La quota passa
da 67% a 71% dei blocchi.

### C2 Rimandi — 0% (0/4), invariato

Nessuna delle quattro situazioni (dolore, condizione medica, segnali su cibo e
corpo, minorenni) ha un campo, una soglia o un testo nell'app.

### C3 Fedeltà — 33% (1/3), in calo

- *Nessun esercizio fuori catalogo*: **rispettata**. Tutti i 52 blocchi e tutti
  i passi di riscaldamento puntano a slug esistenti.
- *Progressi ricalcolabili*: **fallita**, A7 aperto (il volume mostrato include
  la finitura e le sedute non chiuse). Aggravata da M10: oggi nel repository
  convivono **due definizioni incompatibili di volume settimanale** — il test
  di `circuit.test.ts` esclude la finitura (quadricipiti 6), `engine/metrics.ts`
  la include (quadricipiti 14). L'atleta vede il secondo numero, il rapporto al
  progettista cita il primo.
- *Numeri del consiglio uguali a quelli delle regole*: **fallita da oggi**. Due
  cause, B7 e A9: un carico in kg proposto da un altro esercizio, e un
  countdown che vale metà del dovuto appena il gradino diventa unilaterale.

### C4 Coerenza con il metodo — 33% (2/6), invariato sul righello v2

La voce V-FINITURA resta superata (i 12 blocchi `F` e i 12 `Z` portano
`excludeFromReview`, verificato). V-VOLUME resta fallita, adesso quantificata
(§I3). Tre fatti nuovi non hanno una voce nella composizione v2 e li propongo
come voce **V-GIUNZIONE** (§Decisioni): la giunzione Tri-set 2 → finitura senza
nemmeno la transizione, la regola dei balistici che ha perso il suo unico
ancoraggio nel codice, e i file di regole disallineati dai dati (M13).

### C5 Personalizzazione · C6 Concretezza — non rimisurati

Nessuna regola di consiglio toccata. Registro comunque un miglioramento reale
di concretezza che la prossima misura dovrà contare: `variantNote` adesso si
legge **dentro il player**, non solo nella scheda. «Un piede appoggiato sul
box» e «kettlebell in racked» al terzo giro, con il telefono a terra, prima non
erano da nessuna parte. È la modifica di questo commit che più aiuta l'atleta.

### C7 Analisi dei progressi — 83% (5/6)

M-DUR coincide al secondo (scarto 0 s su quattro sedute). M-VOL resta fallita
(A7, M10). Le altre quattro non sono state toccate.

### C8 Durata — 100% (4/4)

| seduta | dichiarati | mio ricalcolo | engine | scarto |
|---|---|---|---|---|
| circuito-1 | 38' | 38:10 | 38:10 | 0 s |
| circuito-2 | 36' | 36:25 | 36:25 | 0 s |
| circuito-3 | 35' | 35:48 | 35:48 | 0 s |
| circuito-4 | 39' | 39:13 | 39:13 | 0 s |

Tutte e quattro sotto il tetto di 40'. Tutte e quattro **sopra il proprio
`estimatedMinutes`** di 10-48 secondi, e quel numero è già un pavimento (le
serie a ripetizioni durano il minimo del TUT): vedi L5.

## Difetti

### Bloccanti

**B7 — La zavorra e il valore di partenza arrivano da un altro esercizio.**
*Scenario*: G1/G3, atleta con storico (oggi: Alessio).
*Input*: una seduta `circuito-N` già registrata prima del commit `f63c9f1`, poi
riaperta dopo.
*Risultato ottenuto*: `lastLoggedByBlock` (`src/engine/draft.ts:243`) indicizza
lo storico **solo per `blockCode`**, senza confrontare l'esercizio:
`byBlock.set(logged.blockCode, logged)`. `buildDraftSession` ne prende
`variantLabel`, e `GuidedSession`/`SessionScreen` ne prendono il valore e i kg
con `suggestedSetValue`. Poiché 33 codici su 36 cambiano esercizio, il
precompilato attraversa esercizi diversi. Casi concreti dal confronto dati
vecchio/nuovo:
- `circuito-1/B2`: era `goblet-squat` → ora `estensione-tricipiti-sopra-testa`.
  I kg del goblet (kettlebell, tipicamente 16-24) vengono proposti come carico
  di una estensione dei tricipiti sopra la testa.
- `circuito-4/B2`: era `goblet-squat` → ora `dip-panche-piedi-rialzati`, che è a
  corpo libero: viene proposta una zavorra su un esercizio che non ne ha.
- `circuito-3/B2`: era `wall-sit` (secondi) → ora `estensione-tricipiti-trx`
  (ripetizioni): il valore di partenza passa da «45» secondi a «45» ripetizioni.
*Risultato atteso*: nessun precompilato quando l'esercizio registrato sotto quel
codice è diverso da quello che il blocco dichiara oggi. Il salto proposto
supera comunque il passo di 2,5 kg a settimana (METHOD §1 leva 5, BOUNDARIES L9).

**B8 — L'app serve 72 figure, zero approvate; 16 pubblicate in questo commit
fuori dal flusso.** *Scenario*: verifica immagini.
*Input*: `src/assets/exercises/` al commit `f63c9f1`.
*Risultato ottenuto*: 16 SVG nuove e 1 modificata (`curl-martello-manubri.svg`)
entrano nel bundle e nella cache del service worker nello stesso commit che
cambia i dati. Il flusso di `CLAUDE.md` (scheda → `exercise-media-lead` → verifica
indipendente di `training-quality` → approvazione di Alessio → pubblicazione)
non è stato percorso. Una di queste figure,
`hip-thrust-panca-bilaterale.svg`, risulta **`da rifare`** nel registro del suo
proprietario (`media/LIBRARY.md` riga 36, data 2026-11-09): è stata pubblicata
*dopo* essere stata respinta.
*Risultato atteso*: nessuna figura in `src/assets/` senza approvazione di
Alessio; nessuna figura `da rifare` servita all'atleta.
*Nota*: la condizione «zero approvate» preesiste a questo commit (tutte e 56 le
figure di ieri erano nello stesso stato) — questo commit aumenta l'esposizione
di 16, non la crea.

**B1, B2, B3, B4, B5, B6** — invariati, testo completo nel rapporto del
2026-11-08. B6 peggiora: vedi M12 (le alternative dichiarate passano da 5 a 0).

### Alti

**A8 — Dal suitcase carry allo swing senza un secondo, e senza nemmeno la
transizione.** *Scenario*: V-GIUNZIONE (proposto), tutte e quattro le sedute.
*Input*: `buildGuidedPlan(circuito-1, 1)`.
*Risultato ottenuto*: tra l'ultimo passo di lavoro del gruppo B e il primo del
gruppo F **non c'è nessun passo**, verificato percorrendo il piano guidato in
tutte e quattro le sedute. Non manca solo la pausa di blocco da 90": manca
anche la transizione da 15" che la finitura applica a tutte le altre stazioni.
Il player passa dalla schermata «Suitcase carry, 70 secondi» alla schermata
«Kettlebell swing» senza una schermata in mezzo — nemmeno il tempo di posare la
campana da 24 e riprenderla.
Le quattro giunzioni:
- `circuito-1`: suitcase carry (kettlebell 24, 30-40" per lato, terzo giro) →
  **kb-swing 15-20**. Lombare sotto carico asimmetrico, poi cerniera d'anca
  balistica. È anche la terza stazione di presa consecutiva (carry → swing →
  corda da battaglia), contro PROGRAM_RULES §2 «due stazioni che dipendono
  dalla presa non sono mai consecutive»: una presa che molla durante uno swing
  è il modo in cui una campana parte.
- `circuito-3`: hollow hold 30-45" → **kb-swing 15-20**. Peggiore della prima,
  non migliore: l'hollow porta a cedimento esattamente i flessori del tronco
  che allo swing servono a impedire alla lombare di flettersi sotto carico.
- `circuito-2`: pallof press → burpee. Minore, ma è la stazione che il dato
  stesso descrive come quella in cui «la tecnica si sfalda per prima».
- `circuito-4`: plank con trascinamento del kettlebell → corda da battaglia
  slam. Minore.
*Risultato atteso*: una pausa dichiarata alla giunzione, oppure un ordine della
finitura che non metta un gesto balistico carico subito dopo una stazione di
stabilizzazione del tronco portata a RIR 0-1 o a cedimento.
*Perché Alto e non Bloccante*: la mia griglia chiama Bloccante solo la
violazione di un limite di `BOUNDARIES.md`, e un limite sulla sequenza dentro la
seduta **non esiste**. Propongo S9 (§Decisioni): se Alessio lo approva, questo
difetto diventa Bloccante e il nucleo di sicurezza guadagna un caso.

**A9 — Il countdown vale metà appena il gradino diventa unilaterale.**
*Scenario*: P-2d.
*Input*: `circuito-4/A1` `hip-thrust-panca-bilaterale`, stato dell'atleta al
gradino 3 o superiore.
*Risultato ottenuto*: `minWorkSeconds` ora restituisce `block.workSeconds`
secco. Ma `buildGuidedPlan` lo chiama così:
`minWorkSeconds({ ...block, perSide: step.perSide })` — l'override esiste
proprio perché `blockPerSide` legge il gradino, e la scala `hip-thrust` è
`[false, false, true, true, true, true]`. Con `workSeconds` dichiarato
quell'argomento **non ha più nessun effetto**: è codice morto per tutti e 52 i
blocchi del programma attivo, che lo dichiarano tutti. Al gradino 3 la stazione
diventa a due lati e il countdown resta 85 secondi su ~170 reali. Stessa classe:
`Z1 dead-hang` ai gradini 4-6 (30" invece di 60"), `circuito-2/A3
rematore-inverso-trx` ai gradini 5-6 (45" invece di 90").
*Risultato atteso*: il tempo dichiarato vale per il `perSide` **dichiarato dal
blocco**; quando il gradino lo smentisce, va scalato (×2 o ÷2). Serve passare il
`perSide` eseguito come argomento separato invece di sovrascrivere quello del
blocco, che oggi distrugge l'informazione.
*Nota*: latente finché l'atleta resta al gradino di default (2 su tutte e tre le
scale). Non resta a lungo: A4 dice che oggi si sale da 1 a 6 in cinque settimane.
La `variantNote` del blocco stesso dice «ci arriva la progressione».

**A10 — La revisione settimanale butta via in silenzio lo storico dei 33
codici.** *Scenario*: P-2c, P-4b.
*Input*: una settimana che contiene sedute registrate prima e dopo `f63c9f1`.
*Risultato ottenuto*: `src/engine/review.ts:131`
`if (block.exercise !== logged.exercise) continue;`. L'entrata registrata viene
scartata senza nessun messaggio. Con 33 codici su 36 che cambiano esercizio,
tutto lo storico precedente al commit sparisce dai verdetti: niente verdetto,
niente progressione, niente «non riesco a leggere questa settimana».
*Risultato atteso*: lo storico su un esercizio sopravvive al cambio di scheda —
l'indice naturale è l'esercizio, non il codice di blocco — oppure l'app dichiara
che quella settimana non è confrontabile. Il silenzio è la cosa da togliere.
*Prova*: è la stessa riga che ha tolto il morso a tre fixture del mio nucleo
senza farle fallire.

**A11 — Il titolo del player nomina il gradino della settimana scorsa.**
*Scenario*: P-2b.
*Input*: un esercizio con scala, verdetto «sali di livello» accettato in
`ReviewScreen`, seduta successiva aperta nel player guidato.
*Risultato ottenuto*: `buildDraftSession` scrive
`variantLabel: past?.variantLabel ?? variantLabelFor(exercise, state)` e
`level: state?.level ?? exercise.defaultLevel`: **l'etichetta viene dalla seduta
scorsa, il gradino dallo stato di adesso**. `GuidedSession` adesso usa quella
etichetta come titolo (`const titolo = suoGradino ? esercizio.name : variante`)
mentre la figura usa il gradino (`<ExerciseArt level={gradino} />`). Dopo ogni
salita accettata il titolo nomina il gradino vecchio sopra la figura del nuovo:
è esattamente il difetto che questo commit dichiara di correggere, spostato di
una settimana invece che eliminato.
*Risultato atteso*: l'etichetta si ricalcola quando il gradino dello stato è
diverso da quello registrato nella seduta precedente.
*Nota*: preesistente in `SessionScreen.tsx:260-262`; questo commit lo propaga al
player guidato, dove il titolo è la riga più grande dello schermo.

**A2, A3, A4, A7** — invariati, testo completo nel rapporto del 2026-11-08.

### Medi

- **M10** — Due definizioni incompatibili di volume settimanale nello stesso
  repository (test esclude la finitura, `metrics.ts` la include). Da scegliere
  una e scriverla in METHOD §3. Legata ad A7.
- **M11** — `hip-thrust-panca-bilaterale.videoQuery` è
  `barbell hip thrust bench proper form tutorial`, ma l'esercizio è con
  kettlebell sulla piega dell'anca (cue 2) e la figura disegna una campana.
  L'app manda l'atleta a video di un'altra variante, con un'altra presa e un
  altro appoggio. Proposta: `kettlebell hip thrust shoulders on bench proper form`.
- **M12** — Le alternative dichiarate passano da **5 a 0**. Il selettore «Quale
  stai facendo» di `SessionScreen` non compare mai più nel programma attivo, e
  chi non ha la corda da battaglia non ha nessuna via in app. PROGRAM_RULES §6
  dice `[IN CODICE]` «5 blocchi su 48»: oggi è falso. Aggrava B6.
- **M13** — I file di regole descrivono dati che non esistono più: PROGRAM_RULES
  §2 (tabella con i blocchi C1-C2 e D, finitura a 3 stazioni, recuperi
  30/45/90 e 20/25/60), §5 (`estimatedMinutes = 40` su tutte e quattro: ora
  38/36/35/39), §6 (5 alternative), METHOD §2 (range «6-10 / 10-14 / 12-18»:
  ora 6-8, 8-10, 8-12, 10-14, 12-15, 12-16, 12-18, 15-20) e §6 (recuperi
  «braccia 20"/25"/60"»: ora 20/30/0 e 15/20-25/0). **Grave in un punto solo**:
  PROGRAM_RULES §2 cita come `[IN CODICE]` una regola di sicurezza che viveva
  solo come commento su `circuito-4 F2` («niente swing qui: questa seduta ha già
  il single-leg RDL e l'hip thrust… è il modo in cui ci si fa male facendo tutto
  giusto»), e la riscrittura ha cancellato il commento. La regola non è violata
  dalla Seduta 4 di oggi (un solo esercizio di catena posteriore nel Tri-set A),
  ma **non è più misurabile**: «due cerniere d'anca» non è un predicato
  calcolabile finché non si dice se contano lo schema `hip-thrust`, lo schema
  `hip-hinge` e lo swing del riscaldamento. BACKLOG D-07 lo chiedeva già.
- **M1, M3, M4, M5, M6, M7, M8, M9** — invariati.

### Bassi

- **L5** — `estimatedMinutes` è sotto il piano calcolato in tutte e quattro
  (38 vs 38:10, 36 vs 36:25, 35 vs 35:48, 39 vs 39:13), e il piano è già un
  pavimento. Arrotondamento per troncamento su un numero che per costruzione non
  può che crescere.
- **L6** — Il gradino 2 della scala si chiama «Hip thrust spalle su panca, due
  gambe», l'esercizio «Hip thrust a due gambe, spalle su panca». Due nomi per la
  stessa cosa, mostrati in schermate diverse.
- **L1, L2, L3, L4** — invariati.

## Esito della verifica delle immagini

**`src/assets/exercises/hip-thrust-panca-bilaterale.svg` — SCARTATA.**
Verifica provvisoria (la scheda non ha `equipment` né `frames`, §0.2 della
checklist). Foglio di contatto in
`quality/reports/immagini/2026-11-09-hipthrust.png` (4 col, 230 px) e
`...-hipthrust-460.png` (2 col, 460 px sui dubbi).

| # | punto | esito |
|---|---|---|
| 1 | Corrispondenza | **PROBLEMA** — nessun braccio e nessuna mano, mentre il cue 2 dice «tenuto con le mani»; l'`aria-label` dice «spalle sulla panca» e il disegno appoggia la testa sopra un blocco |
| 2 | Archetipo | **PROBLEMA** — la seconda gamba è una polilinea sfalsata di 2 unità su una tela da 210 (`58,84 78,78 86,100` contro `58,84 76,81 84,100`): a 210 px fonde nella prima. Accanto al monopodalico, che ha la stessa geometria, le due figure sono lo stesso disegno |
| 3 | Anatomia | OK |
| 4 | Tecnica | **PROBLEMA** — in chiusura l'anca (y 56) sta 18 unità sopra il ginocchio (y 74): la retta spalla-anca-ginocchio è una rampa, non un piano. È l'iperestensione che il cue 4 indica come errore tipico |
| 5 | Attrezzo | **PROBLEMA** — la «panca» è un rettangolo 26×52 in piedi, alto quanto mezza tela, toccato solo dalla testa. Una panca vista di lato è bassa e lunga. La campana invece si legge (cerchio + manico) |
| 6 | Coerenza | OK con il resto della libreria (stesso stile, stessa tela) |
| 7 | Pulizia | **PROBLEMA** — c'è una freccia dentro l'immagine: `M 78 72 L 78 58 M 74 63 L 78 58 L 82 63`. Da sola basta a scartare |
| 8 | Leggibilità | **PROBLEMA** — a 230 px la differenza fra questa figura e il monopodalico non si vede |

Regola di scarto: PROBLEMA su archetipo (2) e su tecnica (4) ⇒ `da rifare`
senza discussione; PROBLEMA su pulizia (7) ⇒ `da rifare` sempre.

**Convergenza indipendente**: `exercise-media-lead` aveva già registrato questa
figura come `da rifare` il 2026-11-09 (`media/LIBRARY.md` riga 36) con quattro
dei miei cinque rilievi. Il quinto — la panca disegnata come un blocco verticale,
che è la *causa geometrica* della rampa del punto 4 — non è nel suo registro e
lo aggiungo. Il brief me l'ha passata come figura «passata dalla verifica»:
non lo era.

Le altre **15 figure nuove** di questo commit non sono state verificate da me e
non le dichiaro in nessun modo: sono dentro B8.

## Ipotesi di correzione

**I1 — Giunzione Tri-set 2 → finitura (per `training-designer`).** Dare alla
giunzione la **transizione della finitura, 15"**, non la pausa di blocco da 90".
Non è una pausa di blocco e quindi non contraddice la lettura dell'orologio
originale, che di pause di blocco lì non ne ha; costa 15 secondi su una seduta e
tutte e quattro restano sotto i 40' (la più lunga andrebbe a 39:28). Oggi lì non
c'è nemmeno il tempo di posare la campana.

**I2 — Ordine della finitura (per `training-designer`), la correzione che
preferisco.** In `circuito-1` scambiare F1 (`kb-swing`) con F3
(`step-rapidi-box`); in `circuito-3` scambiare F1 (`kb-swing`) con F2
(`mountain-climber`). Entrambe le coppie sono stazioni da 30 secondi: **costo
sull'orologio zero**. Toglie di colpo l'accoppiata lombare-carica → balistico in
entrambe le sedute e, nella prima, anche la catena di tre stazioni di presa
consecutive. La `circuito-4` è già così (lo swing è F3) ed è la meno esposta:
l'ordine della finitura non è una proprietà strutturale della scheda, è l'ordine
di quattro stazioni equivalenti.

**I3 — Volume (per `training-designer`): la domanda posta è quella sbagliata.**
Il mio ricalcolo indipendente coincide con il vostro al decimale: braccia 34,5 ·
core 16,5 · dorsali 15 · spalle 13,5 · petto 9 · femorali-glutei 9 ·
quadricipiti 6 · **polpacci 0**. Ma il conto che decide è questo: 24 stazioni di
lavoro a settimana × 3 serie = **72 crediti-serie primari**, più 31,5 di
secondari a metà peso = **103,5 crediti in tutto**. La fascia 16-20 su **otto**
gruppi ne pretende come pavimento **128**. Non esiste nessuna distribuzione in
cui questa scheda sta dentro la fascia su tutti e otto i gruppi: è impossibile
per aritmetica, non per scelta. Quindi non è un errore di trascrizione — è
METHOD §3 e `circuit.ts` che non possono essere veri insieme. Due risposte
possibili, entrambe legittime, nessuna delle due è «sistemare la scheda di
nascosto»:
1. METHOD §3 dichiara che 16-20 vale per i **gruppi bersaglio del mesociclo**
   (qui: braccia, core, dorsali) e che gli altri stanno in mantenimento, con una
   fascia di mantenimento scritta e un tetto al tempo che ci si può restare;
2. la scheda cambia struttura (una quarta stazione nel Tri-set A, o un quinto
   giorno), e allora non è più la trascrizione.
Il numero più discutibile non è quadricipiti 6: è **polpacci 0**, un gruppo
degli otto che non ha nessuna stazione in tutta la settimana e che nessuno ha
nominato. Contando la finitura (M10) diventa 6, e questo è esattamente il motivo
per cui la definizione va scelta prima.

**I4 — `perSide` e `workSeconds` (per la sessione principale).** `minWorkSeconds`
deve ricevere il `perSide` eseguito come **argomento separato** e scalare il
tempo dichiarato quando non coincide con quello del blocco. Oggi il chiamante
sovrascrive `block.perSide` e distrugge il dato che serve al confronto.

**I5 — Storico per esercizio (per la sessione principale).** Un filtro in
`lastLoggedByBlock`: scartare l'entrata il cui `exercise` è diverso da quello che
il blocco dichiara. Una riga, e chiude B7. A10 è più grande e va deciso, non
rattoppato: l'indice naturale dello storico è l'esercizio.

**I6 — Figura (per `exercise-media-lead`).** Nell'ordine: togliere la freccia
(spec §4.1, già aperta); disegnare la panca come blocco **basso e lungo** con le
scapole appoggiate al bordo, che è la correzione che sistema da sola anche il
punto 4; portare l'anca sulla retta spalla-ginocchio in chiusura; separare le due
gambe di almeno 8-10 unità o distinguerle con il piede; aggiungere le braccia che
tengono la campana. E al monopodalico la gamba libera, che oggi non c'è.

## Decisioni per Alessio

1. **S9, limite nuovo proposto per `BOUNDARIES.md`**: «nessuna stazione
   balistica carica (swing, slam, clean) immediatamente dopo una stazione di
   stabilizzazione del tronco prescritta a RIR 0-1 o portata a cedimento; minimo
   una transizione dichiarata». Se lo approvi, A8 diventa **Bloccante** e il
   nucleo di sicurezza passa a 9 casi. Se non lo approvi, A8 resta Alto e io non
   ho un righello per misurare le sequenze dentro la seduta.
2. **Definizione di volume settimanale** (M10): la finitura metabolica conta o
   no? Oggi il test dice no e l'app dice sì. Serve una riga sola in METHOD §3, e
   da quella riga dipendono i numeri che ti ho dato sopra.
3. **Fascia 16-20 su otto gruppi o sui gruppi bersaglio** (I3): è la decisione
   di metodo che questa trascrizione costringe a prendere.
4. **Composizione della griglia v3**: aggiungere la voce **V-GIUNZIONE** a C4
   (sequenze dentro la seduta). Resta da approvare anche tutto il righello v2:
   senza, i miei confronti fra misure restano «contro soglie proposte».
5. **Fixture ricucite**: ho ripuntato cinque casi del nucleo di sicurezza e la
   mappa degli attrezzi perché la riscrittura dei dati le aveva svuotate senza
   farle fallire. Te lo segnalo perché cambia due numeri del confronto: caso 3
   da 32/48 a 37/52, e il caso 4 sarebbe sceso a 2 soglie superate per colpa mia.
6. **Le 15 figure nuove non verificate** (B8): le metto in coda alla verifica
   indipendente, oppure la sessione principale le ritira dal bundle finché non
   passano il flusso. Non le dichiaro idonee e non le ho guardate.
7. **Campione da validare**: dei 30 scenari nessuno è ancora validato da te. La
   giunzione e il volume sono i due punti dove il mio giudizio tecnico vale meno
   del tuo: sono scelte di metodo, non difetti di codice.

## Domande aperte

1. La scheda originale, alla giunzione Tri-set 2 → finitura, **non ha pausa** o
   **ha una pausa che la colonna dell'orologio non scrive** perché cade dentro i
   secondi di montaggio della stazione? La differenza decide se I1 è un
   tradimento della trascrizione o la sua lettura corretta.
2. L'ordine delle quattro stazioni della finitura è prescritto dalla scheda o è
   l'ordine in cui erano scritte? Da questo dipende se I2 costa qualcosa.
3. `circuito-2/B2` punta allo slug `dip-panche-o-diamond-pushup`, il cui `name`
   è «Diamond push-up». La scheda originale lì prescrive il diamond push-up o il
   dip tra due panche? Lo slug dice una cosa e il nome mostrato all'atleta ne
   dice un'altra, e nel catalogo esistono entrambi come esercizi separati.
4. Lo swing tecnico da 10 ripetizioni con il 16 è nel riscaldamento di tutte e
   quattro le sedute anche nell'originale? Se sì, la regola «mai in una seduta
   che ha già due cerniere d'anca» va riscritta contando anche il riscaldamento,
   altrimenti non vuol dire niente.
5. Lo storico di Alessio sui quattro circuiti: quante sedute chiuse ci sono
   prima di `f63c9f1`? Da quel numero dipende se B7 e A10 sono un danno già
   avvenuto o un danno che aspetta la prossima apertura di seduta.
