# METHOD.md — principi di allenamento

Versione **metodo 1.0 — PROPOSTA del 2026-11-08, non approvata.**
Aggiunta del 2026-11-12 `[PROPOSTA, metodo 1.1]`: R3, volume (§3).
Le righe marcate `[IN CODICE]` descrivono ciò che l'app fa già oggi e sono una
trascrizione, non una proposta. Quelle marcate `[PROPOSTA]` non esistono ancora:
nessuna riga di codice è stata toccata.

## 1. Sovraccarico progressivo: le cinque leve, in ordine obbligato

`[IN CODICE]` `src/types/progression.ts` · `OVERLOAD_LEVERS`

1. **Ripetizioni** — più ripetizioni dentro il range, stessa variante, stesso tempo.
2. **Tempo** — eccentrica 3" → 4" → 5". Tetto 5".
3. **Pause isometriche** — 1" poi 2" nel punto di massimo allungamento. Tetto 2".
4. **Variante** — un gradino più su nella scala dello schema motorio.
5. **Zavorra** — passi da 2,5 kg, solo dagli esercizi in whitelist e dalla settimana 3.

La leva si cambia solo quando quella precedente è esaurita. Unica eccezione in
codice: se il gradino non fa più resistenza (vedi PROGRESSION_RULES §4) la
variante scavalca tempo e pause, e la schermata dichiara lo scavalco.

## 2. Range di lavoro

`[IN CODICE]` `src/data/method.ts` · `src/engine/ranges.ts`

- `rangeMin = round(massimale × 0,55)`, `rangeMax = round(massimale × 0,75)`.
- Arrotondamento a metà per eccesso. Massimale ≤ 0 ⇒ range vuoto: la risposta
  è scendere di gradino, non allenarsi a zero.
- Oltre **25-30 ripetizioni** si allena la resistenza, non l'ipertrofia
  (`ENDURANCE_REP_THRESHOLD`). La soglia è in ripetizioni e non si applica alle
  isometrie: 40" di wall sit non sono 40 ripetizioni.
- Il programma attivo (i quattro circuiti) **non deriva i range dai test**: usa
  range fissi — 6-10 nei blocchi di forza, 10-14/12-18 in quelli di volume — e
  quello che si sposta è il gradino. Il massimale alle trazioni è 4: un range
  calcolato dal test prescriverebbe numeri ineseguibili.

## 3. Volume settimanale per gruppo muscolare

`[IN CODICE]` `src/types/core.ts` · `WEEKLY_SET_TARGET = 16-20 serie`

- Otto gruppi: dorsali, petto, spalle, braccia, quadricipiti, femorali-glutei,
  polpacci, core.
- Serie piena sui gruppi primari, **mezza serie** sui secondari
  (`SECONDARY_SET_WEIGHT = 0,5`): una trazione è una serie di dorsali e mezza di
  braccia.
- Una serie per lato conta **una volta**, non due.

`[PROPOSTA, metodo 1.1 — R3]` Cosa conta e contro cosa si confronta:
1. **Contano solo le serie dei blocchi senza `excludeFromReview`**: tri-set A e
   B. Finitura (F) e decompressione (Z) **non contano**: 30" a tempo senza RIR
   né range, lavoro metabolico, non volume. Vale per il test sui dati e per
   `metrics.ts`, con una sola funzione.
2. **Contano solo le sedute `completed` e `abandoned`** (le serie fatte sono
   fatte); `in-progress` no.
3. **Previsto dal programma** = la stessa formula sui blocchi di una settimana
   completa (4 sedute), con `effectiveSets` nelle settimane di deload. Oggi:
   braccia 34,5 · core 16,5 · dorsali 15 · spalle 13,5 · petto 9 ·
   femorali-glutei 9 · quadricipiti 6 · polpacci 0 (totale 103,5).
4. **Fascia del metodo per gruppo**, dichiarata dal programma (non dall'atleta):
   - gruppo **prioritario**: 16-20 serie per muscolo; `braccia` sono due
     muscoli (flessori ed estensori del gomito) ⇒ **32-40**;
   - gruppo **in mantenimento**: **≥ 6**, nessun tetto sotto il 20.
   Circuito, proposta: prioritari braccia, dorsali, core; mantenimento gli altri
   cinque. Esito: braccia, core in fascia; dorsali 1 sotto; spalle, petto,
   femorali, quadricipiti in mantenimento; **polpacci 0, sotto anche il
   mantenimento, per scelta dichiarata della scheda**.
   La fascia 16-20 su tutti e otto è irraggiungibile per aritmetica (103,5
   crediti contro un pavimento di 128): non è un obiettivo che l'atleta possa
   mancare, e non si mostra come tale.

## 4. Frequenza

`[IN CODICE]` Quattro sedute, nessun giorno assegnato (`src/data/circuit.ts`).
Si fanno nell'ordine in cui stanno; la rotazione propone la successiva
all'ultima chiusa (`src/engine/rotation.ts`). Due avvisi, nessun blocco:
sovrapposizione muscolare se l'ultima seduta è di ieri o di oggi
(`OVERLAP_DAYS = 1`), e `IN_A_ROW_WARNING = 3` giorni di fila.

## 5. Intensità: RIR

`[IN CODICE]` Il RIR è prescritto per blocco (`ProgramBlock.rir`, valori
`0`, `1`, `2`, `0-1`, `1-2`, `—`) e registrato per serie (`LoggedSet.rir`).
Nei circuiti: 1-2 nei tri-set di forza e volume, 0-1 nel blocco braccia e sugli
isolamenti, `—` nella finitura metabolica. Il metodo non usa l'RPE.

## 6. Recupero

`[IN CODICE]` Quattro livelli distinti (`src/data/circuit.ts`):
transizione tra stazioni, recupero di giro, pausa di blocco, recupero tra serie
sulle stazioni isolate. Valori del circuito in PROGRAM_RULES §2 (tri-set 1
forza 35"/45"/90", volume 20"/30"/60"; tri-set 2 20"/30" e 15"/20-25"; finitura
15"/0"/0"; giunzione B→F: R2). **Il tempo si recupera nelle transizioni, mai
nel recupero di giro.** Tra i test di massimale: 4-5 minuti.

## 7. Riscaldamento

`[IN CODICE]` Nei circuiti è dentro la sequenza cronometrata, non prima:
4-6 passi con durata dichiarata, chiusi dal giro di prova del primo tri-set a
metà carico e metà ripetizioni (`WarmupStep.rampGroup`). Nel metodo scritto:
4' generali + 4' di avvicinamento, 2 serie di avvicinamento con la variante più
facile (`WARMUP_MINUTES`, `WARMUP_RAMP_SETS`), e almeno 40 minuti tra la sveglia
e il primo lavoro intenso su spalle e catena posteriore (`MORNING_DELAY_MINUTES`).

`[PROPOSTA]` Il riscaldamento non è saltabile dall'app quando la seduta contiene
un blocco a RIR 0-1 o una stazione balistica (swing): se l'atleta lo salta, la
schermata lo dice una volta e non lo ripropone.

## 8. Deload

`[IN CODICE]` Settimane **6, 12, 18**: stessa difficoltà, metà delle serie
(`effectiveSets`, minimo 1). Ritest dei massimali a fine settimana 6 e 12.
`[PROPOSTA]` Rientro dopo ≥ 14 giorni di pausa: stessa formula per 4 sedute e
almeno 7 giorni, ritest proposto (PROGRAM_RULES §8, R9).
**Difetto noto:** quel calendario è importato da `src/data/program.ts`, che è il
programma archiviato, e il banner del ritest promette di ricalcolare i range —
cosa che sotto il programma attivo non può avvenire, perché nessun blocco dei
circuiti deriva il range da un test. Vedi BACKLOG D-04.

`[PROPOSTA]` Deload anticipato quando, nella stessa settimana, almeno 4 esercizi
ricevono un verdetto di stallo (PROGRESS_REVIEW §4), oppure quando 3 sedute
consecutive registrano RIR medio 0 su blocchi prescritti a RIR 1-2.

## 9. Livelli

`[IN CODICE]` Il livello **non è dell'atleta: è dell'esercizio.** Ogni schema
motorio ha una scala a 6 gradini (`src/data/progressions.ts`, 17 schemi) e ogni
esercizio ha un `defaultLevel`. Il livello di partenza
(`startingLevel`, `src/engine/progression.ts`) è il minore tra il gradino
prescritto e il gradino a cui il test di settimana 0 è stato davvero eseguito,
confrontabili solo dentro la stessa unità di misura; sulle scale senza test si
parte dal gradino 1. `STARTING_LEVEL_POLICY = 'program-default'`: l'onboarding
non calcola nessun livello globale e non chiede nulla all'atleta.

`[PROPOSTA]` **Livello dell'atleta**, da usare solo per decidere cosa l'app ha
il diritto di proporre — mai per prescrivere numeri:

| livello | criterio deterministico |
|---|---|
| principiante | nessun giro di test completo, **oppure** mediana dei gradini attivi ≤ 2 |
| intermedio | mediana dei gradini attivi 3-4 e nessun esercizio al gradino 6 |
| avanzato | mediana dei gradini attivi ≥ 5 |

Mediana calcolata sugli esercizi con almeno 3 serie registrate nelle ultime 4
settimane. Il livello si ricalcola a ogni revisione settimanale, scende subito e
sale solo con 2 revisioni consecutive che lo confermano. Conseguenza unica:
l'app non propone mai un esercizio il cui `minLevel` è sopra il livello
dell'atleta (BOUNDARIES L8).

## 10. Cosa il metodo non fa

Non prescrive alimentazione, non fissa obiettivi di peso, non stima la
composizione corporea, non promette risultati. La schermata delle misure è già
scritta così e deve restare così: «qui non c'è nessun obiettivo di peso e
nessuna azione suggerita» (`src/ui/screens/MeasuresScreen.tsx`).
