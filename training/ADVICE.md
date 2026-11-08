# ADVICE.md — come nascono i consigli, oggi

Versione **consigli 1.0 — PROPOSTA del 2026-11-08, non approvata.**

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

`[PROPOSTA]` Due verdetti nuovi: `stallo` (PROGRESS_REVIEW §4) e
`rifai-al-tempo-giusto` (PROGRESSION_RULES T3).

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
