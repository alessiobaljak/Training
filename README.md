# Shadow — Calisthenics

PWA per eseguire il protocollo di allenamento Calisthenics Shadow. Accesso con
Google o Apple, dati sincronizzati su Firebase, nessuna analytics. Funziona in
palestra con lo smartphone in modalità aereo: dopo il primo accesso la
sincronizzazione può aspettare, l'allenamento no.

Non è un visualizzatore di tabelle: è un motore di progressione. La scheda è il
dato, il valore è la logica che decide quando salire di livello.

## Stato

| Fase | Contenuto | Stato |
|---|---|---|
| 1 | Scaffolding, tipi, trascrizione dei dati, test del seed | fatta, verificata contro l'Excel |
| 2 | Motore: range, leve, avanzamento, zavorra, deload, medie | fatta |
| 3 | Persistenza Dexie, export/import JSON, export CSV | fatta |
| 4 | Onboarding Settimana 0 e Home | fatta |
| 5 | Player della sessione con timer di recupero | fatta |
| 6 | Log e Progressi | fatta |
| 7 | Misure | fatta |
| 8 | Libreria esercizi, cue, SVG, gestione video | fatta |
| 9 | PWA, service worker, installabilità, test offline | fatta, provata in modalità aereo |
| 10 | Account, accesso Google e Apple, dati su Firebase | fatta, provata con gli emulatori |

## Stack

Vite, React, TypeScript, Tailwind. Dexie per IndexedDB. Vitest per i test del
motore. Nessun framework mobile nativo.

## Sviluppo

```bash
npm install
npm run dev        # server di sviluppo
npm run verify     # typecheck + test + controllo URL video
npm run smoke      # build + prova end-to-end su Chromium
npm run offline    # build + prova in modalità aereo su Chromium
npm run svg        # rigenera le illustrazioni degli esercizi
npm run icons      # rigenera le icone della PWA
npm run emulators  # emulatori Firebase per lo sviluppo locale
npm run build      # build di produzione
```

**Configurazione:** [`docs/configurazione.md`](docs/configurazione.md) copre
progetto Firebase, provider di accesso, regole, variabili su Vercel e domini
autorizzati. Senza quelle sei variabili l'app mostra una schermata che dice
quali mancano.

`npm run verify && npm run build` è il comando che gira Vercel a ogni deploy.

`npm run verify` è il cancello: deve passare prima di ogni commit. Non richiede
un browser, quindi gira ovunque.

`npm run smoke` percorre l'onboarding dei nove test su un browser vero e
verifica che i range mostrati a schermo siano quelli della scheda. Serve a
prendere quello che gli unit test non vedono: una schermata che resta nera
perché una query scrive dentro una transazione di sola lettura non fa fallire
nessun test del motore.

Entrambe girano contro gli **emulatori** Firebase, mai contro il progetto vero:
l'id di progetto comincia con `demo-`, che è la convenzione con cui gli
emulatori funzionano senza credenziali e non contattano Google.

`npm run offline` è la prova che conta per una PWA: carica l'app una volta con
la rete, entra, poi spegne la rete davvero, riapre l'app, scrive una misura,
riavvia, e alla fine spegne anche il server di anteprima. Un service worker corretto da
leggere e rotto all'uso è la norma, non l'eccezione: senza questa prova non c'è
motivo di credere che l'app si apra in palestra.

## Pubblicazione

L'app va servita da un server statico in **HTTPS** (oppure da `localhost`):
senza HTTPS il browser non attiva il service worker e l'offline non esiste.
Un indirizzo di rete locale in HTTP fa vedere l'app e basta, che è il contrario
di quello per cui è stata scritta.

**Vercel, con il repository privato.** Dalla dashboard: Add New Project,
scegli `Training`, Deploy. Non c'è niente da configurare: `vercel.json` fissa
già il framework, la cartella di uscita e il comando di build.

Il comando di build è `npm run verify && npm run build`. Non è un vezzo:
**pubblicare qualcosa di rotto, con un service worker di mezzo, è peggio del
normale.** Il worker nuovo si installa, mette in cache il bundle rotto e lo
serve anche offline: non è un errore che passa ricaricando. Typecheck, unit
test e controllo sugli URL video devono passare prima che esista un `dist/`.

Quello che Vercel non può fare è aprire un browser. Le due prove che ne hanno
bisogno stanno in `.github/workflows/test.yml`, che gira a ogni push e non
pubblica niente. Se ti arriva una notifica di fallimento da lì, il deploy è già
online: guarda il workflow prima di fidarti della versione nuova.

`vercel.json` fissa anche due regole di cache: `sw.js` sempre rivalidato,
perché è l'unico file che deve poter cambiare, e `assets/` immutabile per un
anno, perché i nomi portano già l'hash del contenuto.

**Il sito è pubblico anche con il repository privato.** Repository privato
significa codice sorgente non leggibile, non indirizzo segreto. Va bene così:
l'app non contiene dati, che stanno solo nell'IndexedDB del telefono.

Per pubblicare altrove: `npm run build` produce `dist/`, che è tutto quello che
serve. I percorsi sono relativi, quindi funziona anche da una sottocartella.

## Installazione sul telefono

**iPhone, Safari.** Apri l'indirizzo, tocca Condividi, poi «Aggiungi a Home».
Deve essere Safari: da Chrome su iOS l'aggiunta non installa niente.

**Android, Chrome.** Apri l'indirizzo, menu a tre punti, «Installa app».
Dove il browser lo permette, la schermata «App e dati» mostra direttamente un
pulsante Installa.

Dopo l'installazione **apri e chiudi l'app una volta con la rete accesa**: al
primo avvio il service worker scarica e mette da parte tutti i file. Dal
secondo avvio in poi funziona in modalità aereo. La schermata «App e dati» lo
dice esplicitamente: «Pronta offline» in verde significa che puoi partire.

Installarla non è solo comodità. È quello che convince iOS e Android a non
cancellare il database per fare spazio: vedi «Dove stanno i dati».

## Come funziona l'offline

`scripts/sw-template.js` è il service worker, scritto a mano, senza Workbox né
altre librerie: sono ottanta righe che si leggono tutte. Un plugin dentro
`vite.config.ts` lo emette in `dist/sw.js` sostituendo due segnaposto con la
versione (l'hash del contenuto di tutti i file del build) e con l'elenco reale
dei file compilati.

La strategia è una sola: al primo avvio mette in cache tutto, poi serve solo
dalla cache. La rete è un ripiego per un file che manca, mai la strada normale.

Tre dettagli che sembrano piccoli e non lo sono:

- **`ignoreVary: true` nella lettura dalla cache.** Senza, l'app si apre
  bianca. Molti server statici rispondono con `Vary: Origin`, e il browser
  chiede il bundle con l'header `Origin` mentre il precache lo ha salvato
  senza: stessa risorsa, richieste diverse, cache mancata. È esattamente il
  difetto che `npm run offline` ha trovato, e che un ricaricamento normale non
  fa emergere perché i file arrivano dalla cache HTTP senza passare dal
  service worker.
- **Le richieste fuori origine non vengono intercettate.** Il pulsante «Cerca
  un video» apre YouTube in un'altra scheda: quella navigazione non passa da
  qui.
- **Un build nuovo prende il posto del vecchio subito.** L'app non ha code
  splitting, quindi non esistono pezzi vecchi che possano essere richiesti
  dopo lo scambio.

Le icone stanno in `public/icons/` e le genera `npm run icons` da un unico
marchio vettoriale. Il marchio resta dentro il cerchio di sicurezza che Android
ritaglia sulle icone maskable.

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

**Il sistema operativo può cancellare questo database.** Non è un rischio
teorico: Safari elimina i dati dei siti non installati dopo qualche settimana
di inattività, e sia iOS sia Android liberano spazio a spese dei siti quando il
telefono è pieno. Due difese, entrambe necessarie:

1. **Installare l'app sulla schermata Home.** Un'app installata è molto più
   difficile da svuotare di un sito aperto nel browser.
2. **Chiedere l'archiviazione persistente.** L'app la chiede da sola quando è
   già installata; da browser il pulsante sta in «App e dati», sezione Spazio,
   perché lì Firefox aprirebbe una richiesta di permesso a freddo. La stessa
   schermata dice se è stata concessa.

Nessuna delle due è una garanzia. Il backup sì.

## L'interfaccia

`src/ui/` è l'unico posto con React. Nessuna formula qui dentro: i numeri
arrivano già calcolati dal motore.

| Cartella | Contenuto |
|---|---|
| `screens/` | Una cartella per schermata: Home, onboarding, dati e backup |
| `session/` | Il player: bozza, registrazione serie, recuperi, riepilogo |
| `charts/` | Grafici in SVG inline, senza librerie |
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

## Le illustrazioni

Trentasei figure schematiche in `src/assets/exercises/`, una per esercizio, con
due pose affiancate: inizio e fine del range. Le isometrie e le attività
continue ne hanno una sola.

**Sono generate, non disegnate a mano una per una.** `npm run svg` costruisce i
file da archetipi di posa condivisi tra esercizi dello stesso gesto: la
differenza tra push-up a terra e push-up declinati la fa l'appoggio, che è un
parametro, non un disegno nuovo. A questa fedeltà una figura diversa per ogni
variante sarebbe rumore.

**Usano `currentColor` e nessuna risorsa esterna.** Seguono il tema senza
duplicare la palette, e l'unico indirizzo che compare è il namespace SVG, che è
una dichiarazione e non qualcosa da scaricare. L'app deve funzionare in aereo.

I test verificano che ci sia esattamente un'illustrazione per esercizio, senza
orfane, che tutte abbiano la stessa tela e un testo alternativo, e che nessuna
contenga script o risorse remote.

## Il player della seduta

Percorre il piano che il motore ha già costruito: l'alternanza delle
superserie, i recuperi e le serie dimezzate in scarico sono decisi in
`rest.ts`, non qui. Il player registra e naviga, non calcola.

**Niente entra nel log senza un tocco.** I valori della volta scorsa si vedono
accanto al campo e si possono tenere, ma restano una proposta finché non si
tocca "Serie fatta". Una riga precompilata e mai confermata registrerebbe i
numeri della settimana scorsa come se fossero di oggi.

**La bozza sta nel database, non nella memoria del browser.** Ogni serie
registrata riscrive la seduta su IndexedDB. Chiudere l'app a metà allenamento
non perde niente e al rientro si riprende dalla prima serie mancante.

**La prima serie su un esercizio si ferma sulla variante.** Il livello di
partenza viene dal programma, non da cosa sai fare: il giovedì il programma
prescrive archer push-up, che è il livello 5. Finché quel livello non e'
confermato una volta, il pulsante resta bloccato. Correggere adesso costa un
tap, scoprirlo fra sei settimane guardando un grafico costa il confronto.

**Il recupero è una barra, non una finestra.** Durante una superserie i 15-20"
servono a spostarsi: uno schermo da chiudere sarebbe un ostacolo. Il conto
resta visibile sopra il contenuto e non impedisce di registrare. A zero
vibrazione e beep.

**Il mercoledì ha un player diverso.** Niente serie e niente ripetizioni: solo
cronometro, durata effettiva e frequenza cardiaca media.

**Il metronomo del TUT è opzionale.** Scandisce le fasi del tempo prescritto,
con un beep diverso sull'inizio della ripetizione. Contare a mente mentre si
spinge non funziona, e il TUT nel metodo è la variabile principale, non un
dettaglio.

A fine seduta il motore propone la leva successiva per ogni esercizio che ha
chiuso il massimo del range. Propone: accettare cambia il livello o il carico
della prossima volta, rimandare lascia tutto com’è, e in entrambi i casi la
scelta finisce nel database.

## Log e progressi

**Una sola funzione costruisce le righe del log.** `logRows` in `history.ts`
alimenta sia la tabella a schermo sia l'export CSV, così non possono divergere.
Le colonne sono le tredici del foglio Log_Allenamenti e la tabella scorre in
orizzontale dentro il proprio contenitore: tredici colonne non stanno su un
telefono, e comprimerle vorrebbe dire troncare i numeri.

**Il grafico di un esercizio è una colonna impilata per seduta.** L'altezza è
il totale, i segmenti sono le singole serie: un grafico solo risponde sia a
"quanto ho fatto" sia a "come sono calato tra la prima e la quarta serie". Le
linee verticali segnano i cambi di livello e di zavorra, senza le quali un
salto di variante sembrerebbe un crollo invece della prova che il carico è
aumentato.

**Niente librerie di grafici.** SVG inline scritto a mano, poche centinaia di
righe. Una libreria da 100 kB per due grafici sarebbe peso morto da scaricare
e da tenere in cache offline.

**I colori sono calcolati, non scelti a occhio.** La rampa delle serie è
ordinale e non categorica, perché S1-S4 hanno un ordine. È passata dallo script
di validazione della skill dataviz contro la superficie delle card: banda di
luminosità, soglia di croma, separazione per daltonismo e contrasto. L'accento
della UI non poteva fare da marca, troppo chiaro per la banda: i grafici usano
un blu dedicato.

**Ogni grafico ha la sua tabella.** Un valore leggibile solo passando il dito
sopra non è leggibile.

## Misure

**Il numero grande è la media a 7 giorni, non il peso di stamattina.** Il dato
singolo oscilla di un chilo per acqua, sale e ora del giorno; leggerlo come
progresso porta a decisioni sbagliate. Il valore giornaliero è un campo da
riempire, non un risultato.

**Il grafico è a enfasi, non a due serie alla pari.** La media è la linea, i
pesi giornalieri sono puntini grigi dietro: servono a far vedere quanto
oscilla il dato, non a essere letti uno per uno.

**L'asse verticale non parte da zero.** Su un peso corporeo lo zero
schiaccerebbe una variazione reale di due chili in una linea piatta. La scala è
l'intervallo dei dati con un margine, e i numeri sono scritti sull'asse.

**Nessun obiettivo di peso e nessuna azione suggerita.** Il foglio Misure della
scheda ha una colonna "Azione suggerita" alimentata dalla dieta: è fuori da
questa app, come richiesto.

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

I dati vivono solo nello storage del browser: disinstallare la PWA, cancellare
i dati del sito o lasciare che il sistema liberi spazio li elimina. Il backup è
manuale ed è l'unica rete di sicurezza.

La schermata «App e dati» mostra da quanti giorni non ne fai uno e diventa
gialla a quattordici giorni, rossa a trenta. Il momento giusto è la fine di
ogni settimana di allenamento.

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
