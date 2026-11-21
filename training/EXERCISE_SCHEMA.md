# EXERCISE_SCHEMA.md — schema della scheda esercizio

Versione **schema 1.0 — PROPOSTA del 2026-11-08, non approvata.**
Catalogo: `src/data/exercises.ts`, 56 esercizi. Tipo: `src/types/exercise.ts`.

## 1. Campi che esistono oggi

| campo | stato | note |
|---|---|---|
| `slug` | ✅ | chiave stabile dello storico, non cambia mai |
| `name` | ✅ | un titolo, un esercizio (verificato da test) |
| `pattern` | ✅ | schema motorio, `null` fuori scala (20 su 56) |
| `defaultLevel` | ✅ | gradino di partenza suggerito, `null` fuori scala |
| `primaryMuscles` / `secondaryMuscles` | ✅ | volume pieno / a metà |
| `measurement` | ✅ | `reps` \| `seconds` \| `duration` |
| `loadPolicy` | ✅ | `allowed` \| `forbidden` \| `inherent` |
| `cues` | ✅ | 3-5 cue: setup, cosa fa il corpo, errore tipico, criterio di validità |
| `videoQuery` | ✅ | stringa di ricerca in inglese, **mai un URL** |

Copertura dei cue, contata sul file: **52 occorrenze** di «Errore tipico» e
**38** di un criterio esplicito di ripetizione valida o di fine serie, su 56
esercizi. Quindi almeno 4 esercizi non dichiarano l'errore tipico e almeno 18
non dichiarano quando una ripetizione conta. Da chiudere a mano, uno per uno.

## 2. Campi obbligatori che oggi NON esistono

Nessuno di questi campi è nel tipo. Finché mancano, le regole di BOUNDARIES L8
(niente fuori livello, niente fuori attrezzatura) e L3 (esercizio escluso per
infortunio) **non sono esprimibili**: non c'è un dato su cui farle girare.

### `equipment: readonly Equipment[]` — bloccante per l'uso pubblico
Valori ammessi: `corpo-libero`, `sbarra`, `anelli`, `trx`, `elastici`,
`cintura-zavorra`, `manubri`, `kettlebell`, `corda-battaglia`, `bilanciere`,
`macchine`, `panca`, `box`, `ruota-ab`.
Regola: l'elenco è **completo e necessario** — ciò che serve per eseguire
l'esercizio come è descritto. Una panca usata come appoggio si dichiara.

Oggi l'attrezzatura si deduce solo dal nome, e tre slug mentono (sei con T-37): il metodo è
stato cambiato (deviazioni dichiarate in `src/data/deviations.ts`) ma gli slug
sono rimasti quelli vecchi.

| slug | nome mostrato | attrezzo vero |
|---|---|---|
| `alzate-laterali-elastico` | Alzate laterali con manubri | manubri |
| `curl-elastico-presa-neutra` | Curl con manubri presa neutra | manubri |
| `croci-elastico-o-pushup-presa-larga` | Croci con manubri | manubri + panca |
| `rematore-inverso-trx` (T-37, 11-21c) | Rematore inverso | anelli |
| `rematore-inverso-trx-piedi-rialzati`, `rematore-trx-monobraccio` (archiviati, T-37) | Rematore inverso piedi rialzati · monobraccio | anelli |

Gli slug non si cambiano (sono la chiave dello storico): si dichiara `equipment`
e si considera lo slug un identificatore opaco.

### `minLevel: LevelIndex` e `prerequisites: readonly ExerciseSlug[]`
`minLevel` è il livello dell'atleta (METHOD §9) sotto il quale l'app non propone
mai l'esercizio. `prerequisites` è l'elenco degli esercizi che vanno registrati
con almeno 6 serie dentro il range prima che questo diventi proponibile.
Minimo obbligatorio: nordic curl, hip thrust monopodalico, single-leg RDL,
pistol/shrimp squat, HSPU al muro, L-sit, dip agli anelli, swing con kettlebell.

### `execution: readonly string[]` — esecuzione passo per passo
Da 3 a 6 passi imperativi e verificabili, dal setup alla chiusura. **Separati
dai cue**: oggi i due generi sono mescolati nello stesso array e l'atleta con il
telefono a terra legge cinque frasi senza sapere quale è l'ordine delle cose.

### `commonErrors: readonly string[]`
Da 1 a 3, ognuno nella forma «errore → conseguenza → correzione». Estratti dai
cue esistenti dove ci sono (52 su 56), scritti dove mancano.

### `contraindications: readonly string[]`
Quando **non** si fa questo esercizio. Testo fisso, non diagnostico, sempre
chiuso dal rimando: «se il dolore c'è anche a riposo o dura più di qualche
giorno, parlane con un medico o un fisioterapista.»
Non è un campo decorativo: è il solo posto in cui può vivere la regola
«dolore al ginocchio ⇒ il sissy squat non si propone» (BOUNDARIES L3).
Priorità alta, con il motivo, sui 12 esercizi più esposti: nordic curl, kb
swing, sissy squat, pistol/shrimp squat, HSPU e negative al muro, dip agli
anelli, dip tra due panche, hanging leg raise, dead hang, ab wheel, single-leg
RDL, suitcase carry.

### `regressions` / `progressions`
Oggi la scala del `pattern` fa questo lavoro, ma **25 esercizi su 56 hanno
`pattern: null`** e per loro non esiste nessuna via di uscita: niente gradino
più facile, niente più difficile. Tra questi ci sono tutte le stazioni della
finitura metabolica e lo swing. Per gli esercizi fuori scala i due campi sono
obbligatori ed espliciti (almeno una regressione ciascuno).

### `frames: readonly FrameSpec[]` — fotogrammi per l'immagine
Per ogni fotogramma: nome della fase (`partenza`, `picco`, `fondo`,
`appoggio`), punto di vista (`laterale`, `tre-quarti`, `frontale`,
`posteriore`), cosa deve essere leggibile nella figura (le 2-4 cose che
distinguono l'esecuzione giusta da quella sbagliata), cosa **non** deve
comparire. Minimo 1 fotogramma per le isometrie, 2 per i movimenti, 3 quando il
punto medio è quello che si sbaglia (swing, nordic curl, sissy squat).
È la scheda tecnica che `exercise-media-lead` riceve: oggi
`src/data/exercise-art.ts` ha i nomi dei file ma nessuna specifica di cosa la
figura debba mostrare. **Prime schede** (2026-11-21c, figure generate da testo):
`reports/2026-11-21-training-anelli-figure.md` §5 — pilota `kb-swing`, `apertura-anche`,
`respirazione-360`, `corda-battaglia-slam`, più il rematore agli anelli; elenco ordinato degli
altri 31 (§5.6). Ogni scheda: partenza e arrivo, attrezzo e presa, angoli con tolleranza, vista,
cosa deve vedersi, cosa mai, controllo di training-quality. Nessuna cita immagini d'archivio (RepDB, termine 5).

## 3. Regole di compilazione

1. **Un titolo, un esercizio.** Vale anche per i gradini della scala e per
   `equipment`: «manubri o elastico» non è un valore, sono due esercizi o un
   campo con due voci, mai un nome.
2. Nessun campo libero entra in un calcolo. Tutti i campi di questa scheda sono
   dati statici, scritti da chi progetta il metodo, non dall'atleta.
3. `loadPolicy: 'allowed'` solo sulla whitelist del metodo: trazioni, chin-up,
   dip, push-up, split squat, step-up. `inherent` dove il peso **è**
   l'esercizio (manubri, kettlebell). Altrove `forbidden`.
4. Un esercizio senza `contraindications` scritte non è proponibile al pubblico:
   la stringa vuota è una scelta da dichiarare, non un campo da saltare.
5. Chi aggiunge un esercizio compila tutti i campi, immagine compresa. Un
   esercizio a scheda incompleta può stare nel catalogo ma non essere proposto.
6. **Una scala, un attrezzo** (2026-11-21c). I gradini nominano l'attrezzo e la figura di un
   gradino lo mostra. Se un esercizio cambia attrezzo con lo stesso slug, il suo **nome non nomina
   l'attrezzo**: il nome si legge anche sulle sedute vecchie, `variantLabel` invece resta quello
   scritto quel giorno (rematore inverso: TRX → anelli).
