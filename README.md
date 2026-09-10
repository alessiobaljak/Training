# Shadow — Calisthenics

PWA locale per eseguire il protocollo di allenamento Calisthenics Shadow.
Nessun backend, nessun account, nessuna analytics. Funziona in palestra con lo
smartphone in modalità aereo.

Non è un visualizzatore di tabelle: è un motore di progressione. La scheda è il
dato, il valore è la logica che decide quando salire di livello.

## Stato

| Fase | Contenuto | Stato |
|---|---|---|
| 1 | Scaffolding, tipi, trascrizione dei dati, test del seed | fatta, verificata contro l'Excel |
| 2 | Motore: range, leve, avanzamento, zavorra, deload, medie | fatta |
| 3 | Persistenza Dexie, export/import JSON, export CSV | fatta |
| 4 | Onboarding Settimana 0 e Home | da fare |
| 5 | Player della sessione con timer di recupero | da fare |
| 6 | Log e Progressi | da fare |
| 7 | Misure | da fare |
| 8 | Libreria esercizi, cue, SVG, gestione video | da fare |
| 9 | PWA, service worker, installabilità, test offline | da fare |

## Stack

Vite, React, TypeScript, Tailwind. Dexie per IndexedDB. Vitest per i test del
motore. Nessun framework mobile nativo.

## Sviluppo

```bash
npm install
npm run dev        # server di sviluppo
npm run verify     # typecheck + test + controllo URL video
npm run smoke      # build + prova end-to-end su Chromium
npm run build      # build di produzione
```

`npm run verify` è il cancello: deve passare prima di ogni commit. Non richiede
un browser, quindi gira ovunque.

`npm run smoke` percorre l'onboarding dei nove test su un browser vero e
verifica che i range mostrati a schermo siano quelli della scheda. Serve a
prendere quello che gli unit test non vedono: una schermata che resta nera
perché una query scrive dentro una transazione di sola lettura non fa fallire
nessun test del motore.

## Installazione sul telefono

Da completare nella Fase 9, quando ci saranno service worker, manifest e icone.

## Dove stanno i dati

Due livelli, tenuti separati apposta.

**Seed statico** — `src/data/`. È la scheda trascritta in TypeScript e non
cambia mai da solo.

| File | Contenuto |
|---|---|
| `program.ts` | Le 6 sedute: blocchi, serie, ripetizioni, TUT, RIR, recuperi |
| `progressions.ts` | Le 8 scale di progressione a 6 livelli |
| `tests.ts` | I 9 test della Settimana 0 |
| `exercises.ts` | Anagrafica: slug, nome, cue, schema motorio, query video |
| `method.ts` | Regole dei fogli Istruzioni e Zavorra: percentuali del range, soglie, calibrazione |
| `reference.ts` | Valori di esempio del foglio Test_Livelli, usati come fixture di verifica |

`Scheda_Calisthenics_Shadow.xlsx` sta nella root del repo: è la fonte da cui
tutto è trascritto, tenuta lì per poter rifare la verifica.

**Dati dell'utente** — IndexedDB, sul telefono, gestito da `src/db/`. Non
escono mai dal dispositivo: nessuna chiamata di rete, nessun account, nessun
cloud. L'unica via d'uscita è il backup, e parte da un gesto esplicito.

| Tabella | Contenuto |
|---|---|
| `settings` | Riga unica: data di inizio programma, versione dei dati |
| `sessions` | Sedute registrate, comprese quelle interrotte |
| `testResults` | Massimali della Settimana 0 e dei ritest, con lo storico |
| `exerciseStates` | Livello, bonus di tempo e pause, zavorra per esercizio |
| `exerciseMedia` | Il link video che hai incollato tu |
| `weights`, `waists` | Peso giornaliero e girovita |
| `suggestions` | Suggerimenti di avanzamento accettati o rimandati |

La UI non parla mai con Dexie: passa da `ShadowRepository`, così le validazioni
non si possono aggirare per distrazione.

## L'interfaccia

`src/ui/` è l'unico posto con React. Nessuna formula qui dentro: i numeri
arrivano già calcolati dal motore.

| Cartella | Contenuto |
|---|---|
| `screens/` | Una cartella per schermata: Home, onboarding, dati e backup |
| `components/` | Primitive: pulsanti, card, stepper numerico, cronometri |
| `hooks/` | Letture reattive dal database, cronometri basati sugli istanti |
| `router.ts` | Rotte via hash, senza librerie |

Tre vincoli che attraversano tutta la UI:

- **Aree toccabili da 56 px in su.** Si usa con il telefono a terra e le mani
  sudate, non con il pollice fermo su uno schermo pulito.
- **I cronometri si calcolano dagli istanti, non dai tick.** iOS rallenta i
  timer in secondo piano: un contatore che somma tick perderebbe secondi ogni
  volta che blocchi lo schermo durante il recupero.
- **Le letture non scrivono mai.** `useLiveQuery` esegue in transazione di sola
  lettura: una scrittura lì dentro fa fallire l'intera schermata, senza dire
  perché.

## Il motore

`src/engine/` è logica pura: nessun React, nessun accesso al DOM, nessuno
stato globale. Ogni funzione riceve dati e restituisce dati nuovi, senza
mutare quelli in ingresso. La UI non contiene formule.

| File | Cosa decide |
|---|---|
| `ranges.ts` | Range di lavoro dal massimale, offset, posizione della serie |
| `progression.ts` | Quando scatta l'avanzamento e quale leva proporre |
| `loading.ts` | Se la zavorra è ammessa, quanta, quando calibrarla |
| `metrics.ts` | Media mobile, delta settimanali, volume, aderenza |
| `schedule.ts` | Scarico, ritest, settimana del mesociclo |
| `rest.ts` | Ordine delle serie e recupero da usare dopo ciascuna |
| `notation.ts` | Lettura e scrittura di TUT e RIR |
| `media.ts` | Link ai video: ricerca precompilata e validazione degli URL |
| `dates.ts` | Aritmetica su date, in UTC |

Il motore **suggerisce, non applica**: `evaluateProgression` restituisce lo
stato che si otterrebbe accettando, e tocca all'utente accettare o rimandare.

### Un campo che la scheda non ha

`LoggedExercise.tempoRespected` non esiste nel foglio Excel. La regola di
avanzamento chiede di chiudere il massimo del range "mantenendo il tempo
prescritto": senza registrare se il tempo è stato rispettato, quella
condizione non è valutabile e la regola si riduce al conteggio delle
ripetizioni. È l'unico campo che l'app aggiunge.

### I test del motore

Oltre ai casi normali, la suite copre i limiti richiesti: massimale a zero,
massimale negativo, esercizio isometrico, esercizio per lato con un lato
indietro, settimana di scarico, zavorra vietata e zavorra bloccata dalla
settimana.

I test sono stati verificati per mutazione: si rompe una regola del motore di
proposito e si controlla che la suite se ne accorga. Due mutazioni erano
sopravvissute e hanno prodotto una semplificazione e un test in più.

## Backup

I dati vivono solo nello storage del browser: disinstallare la PWA o cancellare
i dati del sito li elimina. Il backup è manuale ed è l'unica rete di sicurezza.

**Backup completo, JSON.** Un solo file con tutte le tabelle. Il ripristino ha
due modalità: `replace` svuota e riscrive, ed è il caso del telefono nuovo;
`merge` sovrascrive solo le righe presenti nel file e lascia le altre.

Regola di sicurezza dell'import: il file viene validato **per intero prima** di
scrivere una sola riga, e la scrittura avviene in una transazione unica. Un
file rotto fallisce senza aver toccato nulla, mai a metà strada. Il messaggio
di errore indica il punto esatto, per esempio
`data.sessions[0].exercises[0].sets[0].value: atteso un numero`.

Un backup fatto con una versione precedente dei dati si ripristina lo stesso:
uno slug di esercizio che non esiste più diventa un avviso nel rapporto, non un
errore, e la riga viene conservata così com'è.

**Export CSV del log.** Le stesse tredici colonne del foglio Log_Allenamenti,
separatore punto e virgola e decimali con la virgola, che è quello che Excel in
italiano si aspetta. Con `separator: ','` passa a punto e virgola invertiti. Le
serie oltre la quarta finiscono unite nell'ultima colonna, perché aggiungere
una colonna romperebbe la compatibilità con il foglio di partenza: succede solo
sul cluster myo-reps del giovedì.

## Video degli esercizi

Nel codebase non esiste alcun URL di video. Un ID YouTube scritto a memoria è
quasi sempre morto o punta al video sbagliato.

Ogni esercizio ha invece:

1. da 3 a 5 cue testuali di esecuzione;
2. un'illustrazione SVG schematica (Fase 8);
3. un pulsante che apre una ricerca YouTube precompilata, costruita a runtime
   dal campo `videoQuery` dell'esercizio;
4. un campo "Il mio video", dove l'utente incolla il link che preferisce: da
   quel momento il pulsante apre il suo.

`npm run check:no-video-urls` fallisce se qualcuno introduce un URL di video.
Gira dentro `npm run verify`.

Il link che incolli passa da `normalizeVideoUrl`, che accetta solo `http` e
`https`. Quell'URL finisce nell'attributo href di un link: uno schema
`javascript:` sarebbe codice eseguibile al tap, e il controllo va fatto prima
di salvare, non al momento di mostrarlo.

## Come si modifica il programma quando la scheda cambia

I test in `src/data/*.test.ts` sono una **seconda trascrizione indipendente**
delle tabelle della specifica. Cambiare il seed senza aggiornarli fa fallire la
suite: è voluto, serve a impedire modifiche accidentali.

Per cambiare un blocco:

1. modifica la riga in `src/data/program.ts`;
2. aggiorna la riga corrispondente nella tabella attesa in
   `src/data/program.test.ts`;
3. `npm run verify`.

Per aggiungere un esercizio:

1. aggiungi la voce in `src/data/exercises.ts` con slug in kebab-case, da 3 a 5
   cue e una `videoQuery` in inglese;
2. usalo in un blocco del programma o in un test, altrimenti il controllo sugli
   esercizi orfani fallisce;
3. `npm run verify`.

Lo **slug non va mai cambiato**: è la chiave con cui lo storico degli
allenamenti è collegato all'esercizio. Rinominare uno slug scollega i dati già
registrati. Il campo `name` invece si può cambiare liberamente.

## Verifica contro il file Excel

La trascrizione è stata confrontata riga per riga con
`Scheda_Calisthenics_Shadow.xlsx`. Le 36 righe del programma coincidono. Restano
questi punti, tutti interni alla scheda.

**Il file non contiene nessuna formula.** Nessuno dei sette fogli ha una sola
cella calcolata: ogni valore che il foglio Istruzioni descrive come automatico
(range di lavoro, livello di partenza, media a 7 giorni, azione correttiva) è
testo scritto a mano. È la ragione per cui questa app esiste.

**La formula del range regge, con una eccezione.** Il 55%-75% con
arrotondamento a metà per eccesso riproduce 8 righe su 9 del foglio
Test_Livelli. Il nordic curl no: da 4 ripetizioni massime la formula dà 2-3, la
scheda scrive 3-5, che è la prescrizione del martedì ricopiata nel foglio dei
test. Il motore applica la formula e non replica l'eccezione.

**"range test −2": la scheda non basta a distinguere le due letture.** Il
giovedì prescrive 4-6 trazioni presa larga contro un range test di 6-8. Con 10
massime, sottrarre 2 dal range e sottrarre 2 dal massimale danno lo stesso
risultato, quindi il numero della scheda non decide. A 12 massime divergono:
5-7 contro 6-8. Il motore adotta la lettura letterale, cioè sottrae dal range,
ed è fissata da un test dedicato.

**La colonna "Livello di partenza calcolato" si contraddice.** In quattro righe
su nove il numero di livello dichiarato non è quello della variante descritta,
letta sulla scala del foglio Progressioni: rematore inverso (dichiara 4,
descrive 5), pike push-up (3 contro 2), nordic curl (2 contro 3), hollow hold
(2 contro 3). I livelli dichiarati non sono utilizzabili come regola.

*Risolto:* l'app non calcola il livello iniziale e non aggiunge domande
all'onboarding. Ogni esercizio parte dal `defaultLevel` di `exercises.ts`, cioè
dal livello della variante che il programma prescrive, e si corregge a mano
dalla schermata dell'esercizio. Vedi `STARTING_LEVEL_POLICY` in `method.ts`.

**La zavorra sui rematori era in contraddizione.** Il foglio Zavorra elenca
trazioni, chin-up, dip, push-up, split squat e step-up, e i rematori non ci
sono. Ma il livello 6 della trazione orizzontale era "Rematore inverso
zavorrato" e il foglio Test_Livelli suggerisce "monobraccio o zavorra" per
quello schema.

*Risolto:* la whitelist resta intatta e il gradino cambia. Il livello 6 della
trazione orizzontale è ora **"Rematore monobraccio piedi rialzati"**, una
progressione a corpo libero che segue il monobraccio del livello 5. È l'unico
punto in cui il seed si scosta dalla scheda, ed è marcato nel codice e in un
test dedicato.

**Tre incongruenze minori, presenti anche nell'originale.** Il dead hang ha
"Serie previste" 2 ma il sabato ne prescrive 3. Il calf monopodalico seduto del
venerdì non ha "per gamba" mentre quello del martedì sì. Il mercoledì è
intestato 40 minuti ma i suoi blocchi ne sommano da 43 a 53.

**Due formulazioni per la stessa regola.** I fogli Test_Livelli e Progressioni
dicono "chiudi il massimo del range", i fogli Istruzioni e Zavorra dicono
"superi il massimo". Il motore adotta "chiudi", cioè `ripetizioni >= massimo`:
è la lettura del documento di specifica ed è la più conservativa.

**Escluso su richiesta.** Il foglio Misure ha una colonna "Azione suggerita" e
il foglio Istruzioni rimanda a un piano alimentare. L'app non ha sezione dieta:
registra peso, media a 7 giorni, girovita e delta, e si ferma lì.

## Scelte di trascrizione

Punti in cui la specifica lasciava spazio a più letture. Sono documentati anche
nei commenti dei file interessati.

- **"X o Y"**: quando un blocco elenca due varianti, l'esercizio è mappato al
  livello della prima citata, che è la prescrizione principale.
- **`plannedSets` nei test**: la colonna "Serie previste" della tabella dei test
  indica quante serie quello schema riceve nel programma, non le serie del test.
  Il test è sempre una serie sola a cedimento tecnico.
- **"range test −2"**: l'offset sposta entrambi gli estremi del range calcolato,
  non il massimale prima del calcolo.
- **Volume settimanale**: una serie conta per intero sui gruppi primari e a metà
  sui secondari. Senza questa distinzione una trazione conterebbe come una serie
  piena di bicipiti e il totale settimanale diventerebbe inservibile.
- **Zavorra**: consentita solo sulla whitelist esplicita del metodo (trazioni,
  chin-up, dip, push-up, split squat, step-up). Su tutto il resto il campo non
  esiste.
- **Livello iniziale**: viene dal programma, non da un calcolo. La scheda non
  contiene la formula e la sua colonna dei livelli si contraddice.
