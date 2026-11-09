# Dove siamo

Aggiornato: 2026-11-09 · branch `claude/calisthenics-pwa-offline-kor52w`

## Compito in corso
Le quattro sedute del circuito sono state **riscritte sulla scheda originale**.
La versione precedente era una ricostruzione a memoria: struttura sbagliata
(quattro blocchi di lavoro invece di due tri-set, finitura da tre stazioni
invece di quattro, nessuna decompressione) e metà degli esercizi diversi.
Adesso `src/data/circuit.ts` è una trascrizione, e tre test la bloccano:
l'impronta degli esercizi, i sei passi del riscaldamento, le durate dei giri.

Manca: la verifica di `training-quality` e il gate di `release-gate` sulla
scheda nuova (dimensione L).

## Domande aperte per Alessio
1. **Volume sotto la fascia su tre gruppi.** La scheda originale dà
   quadricipiti 6 serie/settimana, petto 9, femorali-glutei 9, contro la fascia
   di riferimento del metodo di 16-20. È una conseguenza della struttura: sei
   stazioni di lavoro per seduta, tre delle quali al blocco braccia-e-vita. Se
   la priorità «braccia e vita» resta quella, il prezzo è questo. Domanda per
   `training-designer`, non da correggere cambiando la scheda di nascosto.
2. **Zero pausa tra Tri-set 2 e finitura.** L'orologio originale manda l'ultimo
   giro del Tri-set 2 dentro la finitura senza fermarsi, in tutte e quattro le
   sedute. Nella Seduta 1 vuol dire passare dal suitcase carry con il 24 allo
   swing a 15-20 ripetizioni senza un secondo in mezzo: lombare carica, poi
   cerniera d'anca balistica. Trascritto fedelmente, da far valutare a
   `training-quality` come caso di sicurezza.
3. **Le due dichiarazioni false sulla licenza RepDB**, ancora da correggere
   (vedi `compliance/PENDING.md`). Serve il tuo ok perché una toccherebbe
   `CLAUDE.md`.

## Decisioni prese
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
