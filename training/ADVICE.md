# ADVICE.md — come nascono i consigli, oggi

Versione **consigli 1.0 — PROPOSTA del 2026-11-08, non approvata.**
Aggiunta del 2026-11-14 `[PROPOSTA, consigli 2.0]`: verdetti ed elenchi nuovi e
i loro testi per R5-R9 (§7).

**Nell'app non c'è nessuna AI.** Nessun modello, nessuna chiamata, nessun prompt.
Ogni consiglio è un verdetto calcolato da soglie numeriche su numeri che
l'atleta ha scritto in campi numerici. Questo file descrive quei verdetti. Non
esistono file su prompt perché non esistono prompt: scriverli descriverebbe
protezioni inesistenti.

## 1. Le tre sorgenti, e nessun'altra

| quando | funzione | file | schermata |
|---|---|---|---|
| fine seduta, per esercizio | `evaluateProgression` | `src/engine/progression.ts` | `src/ui/session/SessionSummary.tsx` |
| fine seduta, zavorra | `calibrateLoad` | `src/engine/loading.ts` | `src/ui/session/SessionSummary.tsx` |
| fine settimana, per esercizio | `reviewWeek` | `src/engine/review.ts` | `src/ui/screens/ReviewScreen.tsx`, `HomeScreen.tsx` |

Contorno, non consigli: `getLoadAvailability` / `assessLoadNeed` (perché la
zavorra è bloccata o sconsigliata), `getWeekState` (banner di deload, ritest,
zavorra bloccata), `rotationState` (quale seduta viene dopo, sovrapposizione
muscolare, giorni di fila).

## 2. Su quali dati

Solo campi numerici e booleani: `LoggedSet.value` (ripetizioni o secondi),
`LoggedSet.rir`, `LoggedSet.loadKg`, `LoggedExercise.tempoRespected`,
`ExerciseState.level`, `eccentricBonusSeconds`, `bottomPauseBonusSeconds`,
`loadKg`, `TestResult.value`, `LoggedSession.week` e `status`.

**Nessun testo scritto dall'atleta entra in un calcolo.** `LoggedSet.note`,
`LoggedExercise.note`, `LoggedSession.note` e `variantLabel` non sono mai letti
da `progression.ts`, `review.ts`, `loading.ts`, `metrics.ts`: verificato con
ricerca sull'intero `src/`. `variantLabel` è generato da `variantLabelFor` a
partire dal gradino, non digitato. Le note escono solo in tabella, nel CSV e nel
backup. Questa proprietà va **verificata a ogni rilascio**, non data per buona:
vedi BOUNDARIES L12.

## 3. I verdetti che esistono

### Fine seduta — `ProgressionEvaluation`
- `suggestion` con una delle 5 leve, `title`, `change` (cosa cambia
  concretamente), `warning` (solo sulla variante: aspettati di perdere il 30-40%
  delle ripetizioni), `nextState`.
- `blockedReason`: perché non c'è un suggerimento — range non chiuso, tempo non
  risposto, tempo non rispettato, blocco senza range, leve esaurite.
- `enduranceWarning`: media ≥ 25 ripetizioni ⇒ «stai allenando la resistenza».
  Solo dove si contano ripetizioni.
- `levers[]`: le 5 leve con `available` e il **motivo** dell'indisponibilità.
- `calibrateLoad`: `increase` / `decrease` / `hold` con la media delle
  ripetizioni citata.

### Fine settimana — `WeeklyVerdict`
Quattro tipi: `sali-di-livello`, `scendi-di-livello`, `aggiungi-peso`,
`range-da-rifare`. Ognuno porta: `evidence` (l'elenco dei numeri della
settimana e il range, sempre per esteso), `change` (cosa cambia accettando),
`caution` (avvertenza da leggere prima), `stateBefore`, `stateAfter`.
Più due elenchi senza verdetto: `inRange` e `alMassimo` (massimo chiuso ma
nessuna leva tirabile dalla revisione).

`[PROPOSTA]` Verdetti nuovi: `stallo` (PROGRESS_REVIEW §4);
`rifai-al-tempo-giusto` e `rispondi-sul-tempo` (R5); `riparti-dal-test` (R9b).
Elenchi nuovi: `pocheProve` e `rimandati` (R8), `inAttesa` (R7), `fermi` (R5 E4-E5);
`alMassimo` prende un motivo (R6). Testi: §7.

## 4. Forma del consiglio e cosa cambia accettandolo

Regole, già in gran parte rispettate, da fissare:
1. **Un consiglio non contiene mai un numero che le regole non abbiano
   calcolato.** Nessun numero di esempio, nessun arrotondamento «simpatico»,
   nessun kg o ripetizione inventata nel testo.
2. Ogni consiglio cita l'evidenza: i valori registrati e la soglia superata.
3. Ogni consiglio dice cosa cambia **se accettato**, prima che venga accettato.
4. Niente si applica da solo. Il motore restituisce uno stato nuovo e non muta
   quello ricevuto; l'applicazione avviene solo su gesto dell'atleta.
5. Ogni decisione è registrata: `SuggestionRecord` in `src/db/db.ts`
   (data, esercizio, leva, `decision`, stato prima, stato dopo). Una decisione
   per esercizio e per settimana (`reviewDecisionId`).
6. Un consiglio rifiutato non si ripropone nella stessa settimana.
7. `[PROPOSTA]` Ogni consiglio porta la **versione delle regole** che lo ha
   generato, scritta nel `SuggestionRecord`. Senza, uno storico di consigli
   generati da soglie diverse non è rileggibile.

## 5. Difetti aperti nella catena dei consigli

Stato al 2026-11-14: **D-01 chiuso in codice** (`review.ts` salta i blocchi
`excludeFromReview`, verificato leggendo il motore). D-02 → R7, D-03 → R5
(PROGRESSION_RULES §9). Il testo sotto resta come storia del difetto.

**D-01 — `excludeFromReview` non è letto da nessuno. Alto.**
Il campo è dichiarato in `src/types/program.ts:154`, con il commento che spiega
esattamente il danno, ed è valorizzato su **12 blocchi** della finitura
metabolica in `src/data/circuit.ts`. Nessun file del motore lo legge:
`reviewWeek` non lo controlla. Conseguenze misurate sui dati attuali:
- `kb-swing` (15-20 rip, `loadPolicy: 'inherent'`, `pattern: null`, 4 serie a
  settimana tra `circuito-1` F3 e `circuito-3` F2): chiudendo 20 su tutte le
  serie la revisione propone `aggiungi-peso`, **+2,5 kg su uno swing balistico**,
  per numeri che dipendono da quanto era dura la seduta fin lì. Il cue di quello
  stesso esercizio dice che inarcare la lombare «è la via principale
  all'infortunio». Il titolo del verdetto dice anche «passa al manubrio
  successivo» su una kettlebell, i cui salti reali sono di 4 kg, non di 2,5.
- Stazioni a 30" fissi (`corda-battaglia-onde-alternate`, `step-rapidi-box`,
  `mountain-climber`, `jumping-jack`: tutte `pattern: null`, `seconds`,
  range 30-30): fermarsi a 28" — che è **quello che il cue chiede di fare**
  quando l'onda non arriva più all'ancoraggio — dà tutte le serie sotto il
  minimo e il verdetto `range-da-rifare`, il cui testo afferma «sei già al
  gradino più basso della scala» e «il range viene dal test, e va rifatto
  quello». Entrambe le frasi sono false: non c'è scala e il range è fisso.
- Chiudendo esattamente 30" — cioè quello che il timer produce — quelle stazioni
  finiscono ogni settimana nell'elenco `alMassimo`, per sempre.

**D-02 — Nessun tetto agli aumenti accettabili in sette giorni. Alto.**
PROGRESSION_RULES T1: fine seduta e fine settimana non si parlano, e tre aumenti
di gradino in una settimana sono accettabili.

**D-03 — La revisione propone `sali-di-livello` con il tempo non rispettato. Medio.**
`review.ts` mette l'avvertenza nel campo `caution` ma propone lo stesso, e
accettare applica. La fine seduta invece pretende `tempoRespected === true`.
Due regole diverse per la stessa decisione.

**D-04 — Il banner del ritest promette un ricalcolo impossibile. Medio.**
`RETEST_BANNER` dice che dai test l'app «ricalcola tutti i range di lavoro», ma
nessun blocco del programma attivo usa `reps-from-test`: i range dei circuiti
sono fissi. Deload e ritest sono inoltre importati da `src/data/program.ts`, il
programma archiviato.

**D-05 — Verdetti su range mescolati. Basso, latente.**
`reviewWeek` raggruppa per slug e conserva il range del **primo** blocco visto,
poi somma i valori di tutti gli altri blocchi dello stesso esercizio. Oggi
nessun esercizio dei circuiti compare due volte con prescrizioni diverse,
quindi il difetto non si manifesta; basta un blocco nuovo.

**D-06 — Testi che vanno oltre l'allenamento. Medio.**
Due `variantNote` in `src/data/circuit.ts` collegano un esercizio alla forma del
corpo: «il rapporto spalla-vita è il numero che si legge come *vita sottile*»
(alzate laterali) e «l'unico esercizio che lavora la vita nel verso giusto»
(suitcase carry). In un'app con un diario della circonferenza vita, aperta al
pubblico, è il genere di testo da riscrivere in termini di funzione e non di
silhouette (BOUNDARIES L7, L10).

## 6. Se un giorno arriverà un modello

Non c'è, e questo file non descrive protezioni che non esistono. Il giorno in
cui Alessio deciderà di introdurne uno, il perimetro è deciso **prima** di
scrivere l'integrazione: un modello **spiega, personalizza il testo, motiva**.
Non decide numeri, non sceglie esercizi, non legge le note dell'atleta come
istruzioni. Quel giorno servono, concordati con lui prima di qualunque riga di
codice: elenco esatto dei dati inviati, versione del modello e delle regole,
budget per consiglio e per utente al mese, resistenza alle istruzioni nascoste
nel testo dell'atleta, e il percorso di fallback quando il modello non risponde
(che è: mostrare il verdetto deterministico, nudo).

**Costo oggi: zero.** Nessun modello da pagare, nessun budget da fissare.

## 7. Testi di R5-R9 `[PROPOSTA, consigli 2.0 — 2026-11-14]`

Ogni `<…>` viene dal calcolo della regola; nessun altro numero nel testo (§4.1).

**Revisione — verdetti nuovi.** Stato invariato, un pulsante «Ho capito» (come
`range-da-rifare`), registrato `postponed` con `reviewDecisionId`.
- **`<numeri>`** (rev. 2026-11-15, R8), in ogni verdetto al posto di «Settimana
  N: …»: «Ultime due sedute al livello <L>[, <kg> kg]: <giorno b> <valori b> ·
  <giorno a> <valori a>, su un range di <range>.» Giorni con `formatDayLong`.
- `rifai-al-tempo-giusto` · leva `reps`. Titolo «<Esercizio>: rifai al tempo
  giusto». Evidenza «<numeri> Tempo non rispettato <giorni con il no>.» Cambio
  «Niente cambia: stesso gradino, stesso peso. Si sale quando chiudi il massimo
  al tempo della scheda, con un sì sul tempo nelle ultime due sedute.»
- `rispondi-sul-tempo` · leva `reps`. Titolo «<Esercizio>: manca la risposta sul
  tempo». Evidenza «<numeri> Nessuna risposta sul tempo <giorni>.» Cambio «Niente
  cambia. Senza un sì sul tempo in tutte e due le sedute la salita non si
  propone: a fine seduta rispondi alla domanda sul tempo prescritto.»
- `sali-di-livello` e `aggiungi-peso` perdono `cautelaTempo`: con R5 non nascono
  più senza tempo confermato. La cautela del 30-40% resta.
- `riparti-dal-test` (R9b) · leva `variant`, «Applica» / «Lascia com'è». Titolo
  «Riparti dal livello <g>: <nome>». Evidenza «Test di rientro: <M> su <test>.
  Sotto <soglia> il livello <L> non regge il range del blocco.» Cambio «Livello
  <L> → <g>. Tempo e pause tornano a quelli della scheda.»

**Revisione — elenchi senza verdetto.**
- `pocheProve` (rev. 2026-11-15): «Troppo pochi numeri per giudicare:
  <Esercizio> (<s> sedute, <n> serie al livello <L>[ con <kg> kg]), … La
  revisione giudica le ultime due sedute di un esercizio se sono allo stesso
  livello e carico, cadono entrambe fra <dal> e <al> e hanno almeno 3 serie
  complete in tutto. Il riepilogo di fine seduta continua a proporre le sue
  leve.»
- `rimandati`: **sostituito da consigli 3.0** (sotto). Il testo «Lo giudica la
  revisione della settimana prossima» era falso ogni settimana (M17).
- Stato `in-corso`: «La settimana <N> chiude <giorno fine(N)>: la revisione si
  apre il giorno dopo.» · `scaduta`: «Questa revisione si poteva decidere fino a
  <giorno fine(N)+7>. I numeri nuovi sono nella revisione dell'ultima settimana
  chiusa.» con il pulsante verso quella. Nessun verdetto, nessun elenco.
- Sottotitolo: «<k> sedute in settimana · <m> serie lette dal <dal> al <al>».
- `inAttesa`: «<Esercizio>: sopra il massimo su tutte le serie, ma sei al
  livello <L> dal <inizio>. Un gradino ogni due settimane: il prossimo si può
  proporre dal <dal>.»
- `fermi` · scarico (W o W+1 di scarico): «Settimana di scarico: niente aumenti,
  anche con il massimo chiuso. Si riprende dopo lo scarico.» · scarico nella
  coppia (solo una seduta lo è): «Una delle due sedute lette è di scarico
  (<giorno>): niente aumenti da quei numeri. Si riprende con due sedute piene.»
  · rientro: «Sedute di rientro dopo la pausa: niente aumenti finché non torni
  al volume pieno.»
- `alMassimo`, per motivo: `tempo` «Massimo chiuso ma non superato: la prossima
  leva è il tempo, e si decide a fine seduta.» · `settimana` =
  `getLoadAvailability(…).explanation` · `soglia` = `assessLoadNeed(…).message`
  + «Ultimo test: <M>.» · `nessun-test` «Per proporre la zavorra serve un test
  di <test> registrato.» · `leve-finite` «Hai esaurito le leve su questo
  esercizio: serve un cambio di programmazione, non un altro giro.» Il testo di
  oggi («la variante non c'è o è finita») è falso sul caso 4b e va sostituito.
- Nota in fondo, al posto di «meno di tre serie» (rev. 2026-11-15): «Ogni
  esercizio si giudica sulle sue ultime due sedute chiuse, se sono allo stesso
  livello e carico, cadono fra <dal> e <al> e hanno almeno 3 serie complete in
  tutto. Una serie storta in mezzo a due buone non fa scendere di livello.»
- «Niente da cambiare per la settimana prossima… stanno dove devono stare» solo
  se non ci sono verdetti aperti **e** `pocheProve`, `rimandati`, `fermi`,
  `inAttesa` sono vuoti; altrimenti «Nessun cambio da decidere.» e gli elenchi.
  In W1 tutti finiscono in `pocheProve`: il testo di oggi sarebbe falso.

**Fine seduta — `blockedReason` e motivi nuovi.**
- E3: «Per cambiare leva servono almeno 3 serie complete: oggi ne hai chiuse
  <n>. Resta sulla leva 1.»
- E4: «Settimana di scarico: niente aumenti, anche con il massimo chiuso. Stessa
  difficoltà, metà delle serie.»
- E5: «Seduta di rientro (<k> di 4): niente aumenti finché non torni al volume
  pieno.»
- R7 (`variant.reason`; `blockedReason` se non resta altra leva): «Un gradino
  ogni due settimane: sei al livello <L> dal <inizio>, il prossimo si può
  proporre dal <dal>.» Senza sedute chiuse al livello: «Sei appena arrivato al
  livello <L>: il prossimo gradino si può proporre dal <dal>», con `dal =
  draft.date + 14` se la seduta in corso è a quel livello, altrimenti «14 giorni
  dopo la prima seduta chiusa a questo livello».
- R6 (`load.reason`): «Prima la variante: la zavorra arriva dopo l'ultimo gradino
  della scala.» · soglia e test come sopra.

**Consigli 3.0 — R10-R13 `[PROPOSTA, 2026-11-16]`** (rapporto 2026-11-16).
- `alMassimo` `tempo` (sostituisce «Massimo chiuso ma non superato…», falso a
  variante finita): «<Esercizio>: massimo chiuso su tutte le serie. La prossima
  leva è il tempo, eccentrica da <e>" a <e+1>": te la propone il riepilogo di
  fine seduta, la prossima volta che chiudi il massimo con il tempo rispettato.»
  · `pausa`: «… la pausa in allungamento, da <p>" a <p+1>": …» (stessa coda) ·
  `variante`: «… Tempo e pausa sono al massimo: la prossima leva è il livello
  <su> (<nome>). Te lo propone il riepilogo di fine seduta, …[. Un gradino ogni
  due settimane: si può proporre dal <dal>].»
- `rimandati` · `leva`: «<Esercizio>: <giorno> hai accettato un secondo in più
  di <eccentrica | pausa in allungamento>. Le sedute lette sono di prima: si
  giudica quando avrai due sedute al tempo nuovo.» · `stato`: «<Esercizio>: dopo
  le sedute lette hai cambiato livello o carico (<giorno>). Si giudica quando
  avrai due sedute allo stato nuovo.» · `smentito`: «<Esercizio>: rifatto
  <giorno> (<valori>[, tempo non confermato]). L'ultima seduta non conferma le
  due lette: niente cambia, conta la prossima coppia di sedute.»
- Evidenza con R11: `<numeri>` + « Rifatto <giorno>: <valori>[ · …].»
- `pocheProve` con R12: «(1 seduta: le ultime due sono del <giorno>, e lo stesso
  giorno conta una volta)»; nota in fondo + «Due sedute nello stesso giorno
  contano come una.»
- R13 · revisione `fermi` `sette-giorni`: «<Esercizio>: massimo chiuso, ma un
  aumento per esercizio ogni 7 giorni. L'ultimo è del <giorno> (<cosa>): il
  prossimo si può proporre dal <giorno+7>.» · fine seduta: «Un aumento [di
  carico] per esercizio ogni 7 giorni: l'ultimo è del <giorno> (<cosa>). Il
  prossimo si può proporre dal <giorno+7>: oggi resta tutto com'è.» · `<cosa>`:
  «livello <x> → <y>», «eccentrica +1"», «pausa +1"», «carico <x> → <y> kg»,
  «peso scritto da te, <x> → <y> kg», «livello scritto da te, <x> → <y>».
- R10c-1 (solo con D-19): titolo «<Esercizio>: passa al manubrio successivo».
  Cambio «Manubrio successivo, al massimo <L+2,5> kg: oggi usi <L> kg. Tempo e
  pausa tornano a quelli della scheda. Nel player scrivi il peso vero: da lì in
  poi comanda quello che scrivi. Se il tuo manubrio successivo pesa più di
  <L+2,5> kg, resta a <L> kg.» Cautela «Aspettati di scendere verso <min>
  ripetizioni: è il segno che il carico è aumentato davvero.» Kg con la virgola
  (L17). Con R10c-0 nessun testo nuovo: `leve-finite` com'è.

**Consigli 4.0 — R14-R17 `[PROPOSTA, 2026-11-18]`** (rapporto 2026-11-18, varianti lì).
- R14a: «Oggi hai usato <B> kg, il peso di prima: la scelta del <giorno> (<cosa>)
  non è stata eseguita e si toglie.[ Tempo e pausa tornano a quelli che avevi su
  <B> kg.] Il prossimo passo si valuta dalla prossima seduta.» (+ «meno di prima», livello).
- R14b: «Oggi hai usato <v> kg e lo stato era <L> kg: da qui comanda quello che hai
  scritto[, e tempo e pausa tornano a quelli della scheda]. Il prossimo passo si
  valuta dalla prossima seduta a <v> kg.» (+ livello, «in questo blocco»).
- R14c `rimandati` `decaduta` · R14d stazione «Manubrio successivo: al massimo <T>
  kg. Scrivi il peso che usi davvero; se resti a <B> kg la scelta si toglie…» · R14e
  «Peso non scritto: lo stato resta <L> kg…».
- R15 `<cosa>`: «carico <B> → <v> kg, scelta del <giorno>», «livello <B> → <v>,
  scelta del <giorno>»; manubrio in attesa «manubrio successivo scelto, al massimo <T> kg».
- R16 T-S2: «Le due sedute lette sono di scarico (<g1> e <g2>): niente aumenti da
  quei numeri. Si riprende con due sedute piene.» + « Rifatto <giorno>: <valori>.»
- R17b code: «Un aumento per esercizio ogni 7 giorni: si può proporre dal <dal13>.»
  (variante) · «… non prima del <dal13>.» (tempo, pausa). R17c: nessun testo nuovo.

**Rientro (R9) — Home e player.**
- Prima della seduta: «Sono passati <g> giorni dall'ultima seduta. Le prossime
  <4> sedute sono ridotte: stessi esercizi, stesso ordine, <2> giri invece di
  <3> nei tri-set e <1> invece di <2> nella finitura. Niente aumenti finché non
  torni al volume pieno.» (giri letti dal piano, non scritti a mano).
- Etichetta: «Rientro · seduta <k> di <4>».
- Ritest (R9a): «Dopo la pausa rifai i test dei massimali, in un giorno senza
  seduta, con 4-5 minuti fra un test e l'altro.» Con R9b: «Servono a controllare
  che i gradini siano ancora quelli giusti.» Senza R9b: «I risultati restano
  nello storico dei test.» Mai «l'app ricalcola» (M16).
