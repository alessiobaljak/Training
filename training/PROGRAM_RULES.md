# PROGRAM_RULES.md — regole deterministiche del programma

Versione **programmi 1.0 — PROPOSTA del 2026-11-08, non approvata.**
Aggiunte del 2026-11-12, `[PROPOSTA, programmi 2.0]`: R1 (§3), R2 (§2), R4 (§3).
Programma attivo: `src/data/circuit.ts` (4 circuiti). Archiviato: `src/data/program.ts`.

## 1. Il programma non si genera: si sceglie

`[IN CODICE]` Oggi l'app **non genera** nessun programma. I quattro circuiti
sono dati scritti a mano, blocco per blocco, e l'unica cosa che l'app decide è
quale dei quattro proporre adesso: il successivo all'ultimo chiuso, in ordine
circolare (`src/engine/rotation.ts`, `CIRCUIT_ORDER`). Niente giorni assegnati.

Questa è la proprietà più forte dell'app e va difesa: nessuna combinazione di
esercizi nasce a runtime. Qualunque regola di generazione futura sceglie dentro
un catalogo di blocchi approvati, non compone esercizi liberamente.

## 2. Struttura della settimana

`[IN CODICE]` Quattro sedute (35-39' stimati), struttura identica, **trascrizione
della scheda originale: esercizi e ordine delle stazioni non si cambiano per
regola** (vincolo di Alessio, 2026-11-12). Recuperi trans./giro/blocco:

| blocco | serie | recupero forza (S1-S2) | recupero volume (S3-S4) |
|---|---|---|---|
| A1-A3 tri-set 1 | 3 | 35" / 45" / 90" | 20" / 30" / 60" |
| B1-B3 tri-set 2, braccia e vita | 3 | 20" / 30" / **giunzione** | 15" / 20-25" / **giunzione** |
| F1-F4 finitura metabolica | 2 | 15" / 0" / 0" | 15" / 0" / 0" |
| Z1-Z3 decompressione | 1 | 0" | 0" |

**R2 — Giunzione Tri-set 2 → finitura** `[PROPOSTA, programmi 1.1]`. Oggi 0":
dall'ultima serie del gruppo B si entra nel primo passo di lavoro F senza
nessun passo in mezzo (training-quality A8). Regola: **tra l'ultimo passo di
lavoro del gruppo B e il primo del gruppo F c'è una transizione di 15", in
tutte e quattro le sedute** — è la transizione della finitura, non una pausa di
blocco. Non cambia esercizi né ordine; costa 15" a seduta (la più lunga ≈ 39:28).
Soddisfa BOUNDARIES L14. Lo scambio di stazioni (I2 di training-quality) cambia
l'ordine: è una domanda per Alessio, non una regola (rapporto 2026-11-12).

Regole di ordinamento **per blocchi futuri** (la trascrizione ne viola due,
dichiarate e lasciate ad Alessio):
- **Tri-set non competitivi**: tre stazioni i cui muscoli non si contendono niente.
- Due stazioni di presa non consecutive. *Violata dalla trascrizione*: B1-B3 di
  S1 (curl, estensione KB, suitcase carry) e F di S1 (swing, corda, slam).
  Nessun ordine delle 4 stazioni F di S1 la rispetta: 3 su 4 sono di presa.
- Picchi sistemici separati da stazioni locali.
- Balistici solo in riscaldamento e finitura, mai nei tri-set, mai in una seduta
  con già due cerniere d'anca.
- Nessun balistico carico subito dopo una stazione di tronco a RIR 0-1 o a
  cedimento senza transizione dichiarata (BOUNDARIES L14).

`[PROPOSTA]` Diventano test sui dati (BACKLOG D-07); quelle violate dalla
trascrizione entrano come eccezioni nominate, slug per slug.

## 3. Scelta dell'esercizio e del gradino

`[IN CODICE]` L'esercizio di un blocco è fissato nel dato. Quello che si muove è
il **gradino**: si sceglie quello su cui il massimo tecnico cade dentro il range
prescritto. Oggi questa regola vive come prosa italiana nel campo `variantNote`
del blocco A1 di `circuito-1` e non è calcolata da nessuna funzione.

### R1 — Gradino di partenza dal test `[PROPOSTA, programmi 2.0]` (chiude B5)

Sostituisce `startingLevel`. Si applica alla creazione dello stato iniziale e
dopo ogni ritest. Notazione: `P` = `exercise.defaultLevel` (tetto: il gradino
dell'esercizio scritto nella scheda); `Lt` = gradino a cui si esegue il test
della scala (`testBaseline`); `M` = `TestResult.value` (già il lato più debole);
`B` = blocchi del programma attivo con quello slug.
Gradino **solo eccentrico** = nuovo flag `ProgressionStep.eccentricOnly`, vero
per: trazione verticale 2, spinta verticale 3, dip 2, catena posteriore 2-3-4.
`giù(L)` = il gradino più alto `< L` non solo eccentrico, minimo 1.

Si valuta in ordine; la prima riga che si applica decide.
1. `pattern` o `P` nulli ⇒ `P`.
2. Tutti i blocchi in `B` hanno `excludeFromReview` ⇒ `P` (nessun test, nessuna
   progressione: oggi solo `dead-hang` in Z1).
3. Scala senza test ⇒ `P` se `P ≤ 2`, altrimenti **1**. (Hip thrust S4 A1: `P=2`
   ⇒ 2, come la scheda. I gradini 1-2 delle scale senza test non sono mai
   monopodalici né solo eccentrici; resta 1 per hip thrust monopodalico, single-leg
   RDL, calf, step-up, sissy.)
4. `P < Lt` ⇒ `P` (scelta voluta della scheda: dip su panca).
5. Misura del test diversa da quella dell'esercizio ⇒ `P` (invariato).
6. Nessun risultato, risultato «non eseguito» (R4), o `M ≤ 0` ⇒ il primo
   gradino non solo eccentrico della scala: **oggi 1 in tutte**.
7. Nessun blocco in `B` a range fisso (`reps`/`seconds` con `min`) ⇒ `min(P, Lt)`
   (programma archiviato, invariato).
8. Soglia: `b*` = il blocco di `B` (non escluso, a range fisso) con soglia più
   alta. `soglia = min + RIRmax` sulle ripetizioni, con `RIRmax` dal campo `rir`
   (`0`→0, `1`/`0-1`→1, `2`/`1-2`→2, `—`→0); `soglia = min + ceil(0,2 × min)`
   sui secondi. `M ≥ soglia` ⇒ `Lt`; altrimenti ⇒ `giù(Lt)`.

Mai sopra `Lt`, mai sopra `P`. Un solo gradino eseguibile sotto `Lt`: se non
basta, la prima settimana lo dice (`scendi-di-livello`, PROGRESSION §5).

Esiti sul circuito:

| blocco | esercizio | P | Lt | soglia | M ≥ soglia | 0 < M < soglia | M = 0 / nessuno |
|---|---|---|---|---|---|---|---|
| S1 A1 | trazioni | 3 | 3 | 8 | 3 | **1** | 1 |
| S1 A2 | bulgarian | 2 | 2 | 10/lato | 2 | 1 | 1 |
| S1 A3 | dip parallele | 3 | 3 | 8 | 3 | 1 | 1 |
| S2 A1 | pike piedi rialzati | 2 | 2 | 8 | 2 | 1 | 1 |
| S2 A3 | rematore TRX | 2 | 2 | 10 | 2 | 1 | 1 |
| S3 A2 | push-up | 2 | 2 | 14 | 2 | 1 | 1 |
| S3 B3 | hollow hold | 3 | 3 | 36" | 3 | 2 | 1 |
| S4 A1 | hip thrust panca | 2 | — | — | 2 (riga 3) | — | — |
| S4 B2 | dip panche piedi rialzati | 1 | 3 | — | 1 (riga 4) | 1 | 1 |
| Z1 | dead hang | 2 | 2 | — | 2 (riga 2) | 2 | 2 |

Caso trazioni con `M = 4`: 4 < 8 ⇒ `giù(3)`; il 2 è solo eccentrico ⇒ **1**,
che la scheda chiama «un piede sul box». Dati collegati `[PROPOSTA, schema 1.1]`:
- nome del gradino 1 della trazione verticale: «Trazioni assistite: elastico o
  un piede sul box»;
- `ProgramBlock.variantNoteLevel` opzionale: la `variantNote` si mostra solo se
  il gradino attuale coincide. S1 A1 → 1 (la nota parla del box e del
  «massimo a corpo libero è quattro»); S3 A2 → 3 (parla dei declinati, che il
  gradino 2 non sono). Oggi la nota mente a chiunque stia su un altro gradino.

Abbandonata la vecchia proposta «serie di prova alla prima seduta»: aggiusta
dentro la seduta, è difficile da testare e la revisione settimanale fa lo
stesso con numeri veri. Resta valido il punto: mai un gradino con `minLevel`
sopra il livello dell'atleta né con `prerequisites` non soddisfatti
(EXERCISE_SCHEMA §2), quando quei campi esisteranno.

### R4 — Test di settimana 0 del circuito `[PROPOSTA, programmi 2.0]`

**Test richiesti = calcolati, non elencati a mano**: `testBaseline(pattern).testId`
per ogni blocco del programma attivo con `pattern ≠ null`, senza
`excludeFromReview`, con `P ≥ Lt` (righe 1-4 di R1: sono gli unici blocchi in
cui il risultato decide). Sul circuito sono **7**: pull-up, dip, push-up,
inverted-row-trx, pike-push-up, bulgarian-split-squat, hollow-hold.
**Fuori**: `nordic-curl` (nessuna seduta usa la catena posteriore) e `dead-hang`
(solo in Z1, esclusa). Tolgono due serie a cedimento all'onboarding, e il nordic
è la più rischiosa delle nove per chi parte da zero.

1. L'onboarding mostra solo i test richiesti, nell'ordine di `tests.ts`. Gli
   altri restano in `tests.ts` per il programma archiviato e non si chiedono.
2. Il programma **si apre quando ogni test richiesto ha un esito**: un valore
   `> 0`, oppure «non eseguito» registrato esplicitamente. Niente apertura con
   test mancanti; nessun blocco senza uscita (chi non ha la sbarra può chiudere).
3. «Salta questo test» registra **«non eseguito»**, non `0` (PROGRESS_REVIEW §5.5:
   mai zero al posto di «non misurato»). Per R1 i due casi danno lo stesso
   gradino (riga 6); per i progressi no.
4. Chi ha già un giro completo dei nove non rifà niente: i sette sono un
   sottoinsieme.
5. Il giro resta una serie unica a cedimento tecnico con 4-5' tra i test; resta
   dietro lo screening L1 quando esisterà.

## 4. Serie, ripetizioni, recupero

`[IN CODICE]`
- Serie: dal dato del blocco; nelle settimane di deload (6, 12, 18) si
  dimezzano con minimo 1 (`effectiveSets`). `[PROPOSTA]` Stessa formula nelle
  sedute di rientro (§8, R9), una volta sola se coincidono.
- Ripetizioni: range fisso nei circuiti; `round(max × 0,55)`-`round(max × 0,75)`
  dove la prescrizione è `reps-from-test` (solo nel programma archiviato).
- Durata minima di serie: `workSeconds`, oppure calcolata da TUT × minimo del
  range. Non è un tetto: è il monito che 8 ripetizioni a 3-0-1-0 durano 32
  secondi e chiuderle in 18 vuol dire che il tempo non c'era.
  **R18** `[PROPOSTA, programmi 2.2 — 2026-11-18]`: con lo stato σ della
  stazione, `minimo = minWorkSeconds(…) + Δrip × n × lati`, dove `Δrip =
  repDurationSeconds(effectiveTempo(tut, σ)) − repDurationSeconds(parseTut(tut))`,
  `n` è il minimo del range (myo-reps: attivazione; altrimenti niente aggiunta) e
  `lati` = 2 se eseguita per lato. Per serie. A bonus 0 resta identico a oggi.
  Stesso numero per countdown, «Deve durare almeno», anteprima, riepilogo del
  circuito, stima (trazioni +2″/+2″: 30 → 54). Prove 18.x: rapporto 2026-11-18.
- Recupero: quattro livelli, §2.

## 5. Durata massima della seduta

`[IN CODICE]` `estimatedMinutes` 38, 36, 35, 39 (scheda, bonus a 0); la durata vera
è `estimatedSeconds` con gli stati (R18): ai bonus massimi 46-59′, 66′ (M19, D-22).

`[PROPOSTA]` Tetto duro **55 minuti** di piano guidato, riscaldamento compreso.
Se un blocco nuovo porta il piano sopra il tetto, il tempo si recupera in questo
ordine e in nessun altro: transizioni → pausa di blocco → serie della finitura.
**Il recupero di giro e le serie dei tri-set di forza non si toccano:** tagliarli
cambia l'allenamento, non la fretta. Da verificare con un test sui dati.

## 6. Sostituzioni quando manca un attrezzo

`[IN CODICE]` Esistono solo le alternative scritte a mano in
`ProgramBlock.alternatives`: **5 blocchi su 48**, tutti e cinque nella finitura
metabolica (corda → jumping jack, swing → mountain climber o jumping jack).
Nei 43 blocchi di lavoro non c'è nessuna alternativa: il resto del programma
**non ha alternative**: chi non ha sbarra, TRX, anelli, manubri, kettlebell,
box o panca non ha nessuna via.

`[PROPOSTA]` Regola di sostituzione deterministica, possibile solo dopo il campo
`equipment` (EXERCISE_SCHEMA §2):

1. L'atleta dichiara la sua attrezzatura all'onboarding. Il dato è una lista di
   `Equipment`, modificabile dalle impostazioni.
2. Un blocco il cui esercizio richiede un attrezzo mancante viene sostituito con
   il **primo** candidato di una lista ordinata, scritta e approvata per quel
   blocco. La lista è un dato, non un calcolo: ogni candidato dichiara attrezzo,
   schema motorio e gradino equivalente.
3. Un candidato è ammesso solo se: stesso schema motorio **o** stessi
   `primaryMuscles`; `minLevel` ≤ livello dell'atleta; prerequisiti soddisfatti;
   attrezzatura disponibile.
4. Se nessun candidato è ammesso, il blocco **si salta** e la schermata lo dice:
   «Questo blocco chiede <attrezzo>. Senza, oggi non ho un sostituto che valga
   lo stesso: salta il blocco, non improvvisare.» L'app non inventa un
   esercizio e non sceglie un attrezzo che l'atleta non ha dichiarato.
5. Una sostituzione non cambia mai serie, range, RIR o recupero del blocco: se il
   candidato non regge quella prescrizione, non è un candidato.
6. Il volume previsto si ricalcola dopo le sostituzioni (METHOD §3, R3) e si
   mostra: se un gruppo scende sotto la sua fascia, va detto, non nascosto.

## 7. Cosa non cambia mai

- Nessun esercizio fuori dal catalogo approvato.
- Nessuna immagine generata a runtime: solo `src/assets/`.
- Nessun numero di questo file nasce da un testo scritto dall'atleta.

## 8. R9 — Rientro dopo una pausa `[PROPOSTA, programmi 2.1 — 2026-11-14]`

Attua S6 (approvata il 2026-11-12), chiude **M4** (scenario S3 di quality,
`05`). Notazione e R5: PROGRESSION_RULES §9. Oggi `rotation.ts` calcola
`daysSince` e non lo usa per niente: dopo 20 giorni la seduta è identica.

**Ingressi**: `oggi`, `chiuse` (sedute `completed` di qualunque programma, in
ordine `(date, id)`), `TestResult`.
- **Ancora**: una seduta chiusa `A` preceduta da una chiusa `P` con
  `daysBetween(P.date, A.date) ≥ 14`; `inizioPausa = P.date`. La prima seduta
  in assoluto non è un'ancora.
- `rientro(oggi, chiuse)`: (1) nessuna chiusa ⇒ pieno; (2)
  `daysBetween(ultima.date, oggi) ≥ 14` ⇒ **ridotta**, posizione 1 (la seduta
  di oggi sarà l'ancora); (3) `A` = ancora più recente, nessuna ⇒ pieno; (4)
  `k` = chiuse da `A` compresa: **ridotta ⇔ `k < 4` oppure
  `daysBetween(A.date, oggi) ≤ 6`**, posizione `k + 1`. 4 =
  `CIRCUIT_ORDER.length`: un giro di rotazione, ogni esercizio una volta.
- Una seduta chiusa `s` è ridotta se `rientro(s.date, chiuse prima di s)` lo
  dice. Derivato dalle date: nessun campo nuovo nel database.

**Volume ridotto nel circuito.**
- **Giri**: ogni gruppo `max(1, round(giri / 2))`, la formula dello scarico:
  tri-set A e B 3 → 2, finitura 2 → 1, decompressione 1 → 1. Serie per
  stazione = giri. Passi di lavoro per seduta **29 → 19** (A 9→6, B 9→6, F 8→4,
  Z 3→3); serie dei tri-set 18 → 12.
- **Stazioni**: tutte, nell'ordine della trascrizione. Nessuna tolta.
- **Invariati**: esercizi, gradini, range, TUT, RIR, recuperi, riscaldamento con
  il giro di prova. Il volume è il problema di chi rientra, non il gradino.
- Scarico e rientro insieme: si dimezza **una volta**.
- Nessun aumento (R5 E5); la discesa resta permessa.
- Piano guidato, riepilogo («N serie su M»), Progressi (R3): stesse serie ridotte.

**Fine**: alla prima seduta che `rientro` dice piena, cioè dopo **4 sedute
chiuse dall'ancora e non prima del giorno A+7**. Più lunga di una settimana solo
per chi si allena meno di 4 volte in 7 giorni: più prudente, non meno.
**Rotazione**: invariata. La prossima resta `sessionAfter(ultima chiusa)`; con 4
ridotte in ordine, ogni circuito ne ha una. Il numero di settimana resta di
calendario (M6, DECISIONS D-17).

**R9a — Ritest proposto.** Scheda in Home visibile ⇔ esiste un'ancora `A` con
≥ 2 sedute chiuse da `A`; nessuna seduta piena chiusa dopo `A`; nessun
`TestResult` con `date > inizioPausa`; nessuna seduta chiusa con data `oggi` (un
massimale dopo una seduta misura la fatica). Test: quelli richiesti da R4. Non
blocca niente; senza test sparisce alla prima seduta piena. In settimana 6 o 12
un ritest vale per entrambi i banner.
**R9b — Effetto del ritest (separabile, DECISIONS D-18).** Per gli esercizi in
cui R1 arriva alla riga 8, con `M` del ritest: `0 < M < soglia` e `L > giù(Lt)`
⇒ proposta `riparti-dal-test` L → `giù(Lt)`, bonus a 0; `M = 0` ⇒ verso il
primo gradino eseguibile, se L è sopra; `M ≥ soglia` ⇒ niente. **Mai una
salita.** Decisione `rientro-<A.date>:<slug>`. Senza R9b la scheda non dice che
i gradini si ricontrollano (M16).

*Casi limite.* Tempo null: non serve. perSide: si dimezzano i giri, i lati
restano due. Blocchi esclusi: la finitura scende a 1 giro, la decompressione
resta. Solo eccentrici: nessun effetto. Scarico: una riduzione sola. Ritest
appena fatto: la scheda sparisce, la riduzione resta (il volume è tolleranza,
non capacità). Decisione registrata: nelle ridotte non ci sono leve. Seduta in
corso o abbandonata: non interrompe la pausa e non conta fra le 4. Bozza: si
giudica su `draft.date`.

Base: ultima chiusa `circuito-2` il 2026-03-02.

| # | ingresso | atteso |
|---|---|---|
| 9.1 | oggi 03-15 (13 giorni) | piena, nessuna scheda |
| 9.2 | oggi 03-16 (14) | ridotta 1 di 4, `circuito-3`; giri 2 / 2 / 1 / 1; 19 passi |
| 9.3 | chiuse 03-16, 03-18, 03-20, 03-21 | tutte ridotte |
| 9.4 | 5ª il 03-23 | piena |
| 9.5 | una al giorno dal 03-16 al 03-20 | 5 ridotte; la 6ª il 03-23 piena |
| 9.6 | 03-16 poi 03-29 (13) | 03-29 ridotta 2 di 4 |
| 9.7 | 03-16 poi 03-31 (15) | nuova ancora, ridotta 1 di 4 |
| 9.8 | rientro in settimana 6 | 3→2, 2→1, una volta |
| 9.9 | bozza del 03-05 mai chiusa, oggi 03-16 | ridotta |
| 9.10 | fine di una ridotta, 11-11-11, sì | nessuna leva, testo rientro |
| 9.11 | revisione con voci da ridotte, tutte sopra | nessun aumento; tutte sotto: discesa |
| 9.12 | chiuse 03-16 e 03-18, oggi 03-19 | scheda ritest visibile |
| 9.13 | 9.12 più una seduta chiusa il 03-19 | scheda non visibile quel giorno |
| 9.14 | test il 03-19 | scheda via; il 03-20 resta ridotta |
| 9.15 | nessun test, 5ª seduta (piena) chiusa | scheda via |
| 9.16 | prima seduta in assoluto | piena |
| 9.17 | R9b trazioni: L=3 M=5 · L=3 M=9 · L=5 M=9 · L=1 M=5 | 3→1 · niente · niente · niente |
