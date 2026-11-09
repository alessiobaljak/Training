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

`training-quality` ha dato **NO-GO**: 8 Bloccanti, 8 Alti. Tre difetti che la
riscrittura aveva causato sono gia' corretti (vedi sotto). Questi restano tuoi.

1. **La giunzione Tri-set 2 -> finitura non ha nessun passo**, nemmeno la
   transizione da 15" che la finitura da' a tutte le altre stazioni: non c'e'
   il tempo di posare la campana da 24. `training-quality` la chiama Alto, e
   Bloccante se approvi il limite nuovo S9. La peggiore e' la Seduta 3
   (hollow hold a cedimento -> swing: cede proprio cio' che allo swing
   impedisce alla lombare di flettersi), non la Seduta 1. Correzione proposta
   a costo zero sull'orologio: scambiare F1 con F3 nella Seduta 1 e F1 con F2
   nella Seduta 3. Cambia l'ordine della scheda, quindi non la faccio io.
2. **Il volume non puo' stare nella fascia, qualunque distribuzione.** 24
   stazioni x 3 serie = 103,5 crediti contro i 128 che otto gruppi x 16
   pretendono come pavimento. METHOD §3 e `circuit.ts` non possono essere veri
   insieme: o cambia la fascia, o cambia la struttura della scheda.
3. **La finitura conta nel volume?** Oggi `circuit.test.ts` dice no
   (quadricipiti 6) e `engine/metrics.ts` dice si' (quadricipiti 14).
   L'atleta vede il secondo numero, il rapporto al progettista cita il primo.
4. **A10: la revisione settimanale scarta in silenzio** lo storico dei 33
   codici il cui esercizio e' cambiato (`review.ts:131`). Non l'ho toccata:
   dire all'atleta che il suo storico e' stato scartato e' una scelta di
   prodotto, non una correzione.
5. **B8: 16 figure nuove sono nel bundle senza aver fatto il flusso**, e una
   di queste era gia' stata respinta dal suo proprietario. Si ritirano dal
   bundle finche' non passano, o si tengono e si verificano in coda?
6. **Le schede dei 16 esercizi nuovi non hanno `equipment` e `frames`**:
   finche' mancano, nessuna immagine puo' passare in «approvata».
7. Le due dichiarazioni false sulla licenza RepDB (`compliance/PENDING.md`),
   una delle quali tocca `CLAUDE.md`.
8. Le soglie di `GRID.md` e i 30 scenari non sono mai stati validati da te:
   senza, ogni rilascio e' NO-GO per costruzione.

### Risposte che posso dare io, alle domande di `training-quality`
- *La giunzione non ha pausa nell'originale?* La tabella dell'orologio e'
  esplicita: Seduta 1, B giro 3 alle 27:10 e finitura alle 30:30, cioe' 200
  secondi esatti, che sono il giro senza nessuna coda. Lo stesso in tutte e
  quattro. Ma e' un orologio al minuto scritto a mano: non distingue «zero»
  da «dentro l'arrotondamento».
- *`circuito-2/B2` e' il diamond push-up o il dip tra due panche?* Il diamond
  push-up: la scheda scrive «Push-up presa diamante». Lo slug
  `dip-panche-o-diamond-pushup` e' un residuo, il suo `name` e' gia' «Diamond
  push-up» e il dip su panca esiste separato come `dip-panche`.
- *Lo swing tecnico e' nel riscaldamento di tutte e quattro?* Si', la scheda
  dice «come Seduta 1» per tutte.
- *Quante sedute chiuse ci sono prima di `f63c9f1`?* Non lo so e non posso
  saperlo: il database sta sul tuo telefono. Se hai usato «Ricomincia da
  zero», sono zero e B7 e A10 non hanno fatto danno.

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
