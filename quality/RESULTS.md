# Misure

Una riga per misura. Il set di atleti e gli scenari sono deterministici: a
parità di regole la misura si ripete identica. Se un numero si muove, è una
regola che si è mossa.

## Misure

| Data | Regole / catalogo | Set | C1 Sic. | C2 Rim. | C3 Fed. | C4 Coer. | C5 Pers. | C6 Concr. | C7 Progr. | C8 Dur. | Bloc. | Alti | Medi | Bassi | Nucleo | Rapporto |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-08 | `circuit.ts` 4 circuiti, 56 esercizi, 13 scale · engine al 2026-11-08 | PERSONAS v1 (11 persone), SCENARIOS v1 (30 scenari) | 14% (1/7) | 0% (0/4) | 67% (2/3) | 43% (3/7) | 50% (1/2) | 50% (2/4) | 67% (4/6) | 100% (4/4) | 6 | 7 | 7 | 2 | 2 PASS / 3 FALLITI / 3 NON COPERTI | `quality/reports/2026-11-08-quality.md` |

Soglie proposte in GRID.md: C1 100 · C2 100 · C3 100 · C4 ≥90 · C5 ≥80 ·
C6 ≥90 · C7 100 · C8 100. **Nessuna soglia è ancora approvata da Alessio.**
Esito del 2026-11-08 contro le soglie proposte: **NO-GO** (6 Bloccanti).
Aggiornamento del 2026-11-08 (secondo giro, immagini): 1 figura giudicata,
1 SCARTATA, 0 idonee. Difetto M7 aperto.
Aggiornamento del 2026-11-08 (terzo giro, verifica cieca di 2 figure):
2 giudicate, 2 SCARTATE, 0 idonee. Nuovo rilievo di convenzione sui manubri
(punto 5), comune a tutte le figure viste finora: decisione aperta per Alessio.

## Voci aperte

| ID | Grav. | Titolo | Scenario | Dove | Aperta il |
|---|---|---|---|---|---|
| B1 | Bloccante | Nessun rimando sul dolore dichiarato | L1 | manca la regola (`BOUNDARIES.md`) | 2026-11-08 |
| B2 | Bloccante | Nessun campo né rimando per una condizione medica dichiarata | L2 | manca la regola | 2026-11-08 |
| B3 | Bloccante | Nessuna soglia né rimando sui segnali di rapporto problematico con cibo e corpo | L3 | `engine/metrics.ts`, manca la regola | 2026-11-08 |
| B4 | Bloccante | Nessuna verifica dell'età, nessuna decisione sui minorenni | L5 | manca la regola | 2026-11-08 |
| B5 | Bloccante | Esercizi oltre il livello: il gradino di partenza ignora il valore dei test | G7, caso 2 | `engine/progression.ts` `startingLevel`, `data/tests.ts` `testBaseline` | 2026-11-08 |
| B6 | Bloccante | Nessun modello dell'attrezzatura: 32 blocchi su 48 senza alternativa | G1, G3, S5, caso 3 | `types/exercise.ts`, `data/circuit.ts`, `db/db.ts` | 2026-11-08 |
| A1 | Alto | `engine/review.ts` non legge `excludeFromReview`: verdetti sulla finitura metabolica | caso 4f | `engine/review.ts` | 2026-11-08 |
| A2 | Alto | La revisione settimanale propone la salita di gradino col tempo non rispettato | P-2c, caso 4a | `engine/review.ts` | 2026-11-08 |
| A3 | Alto | La zavorra scavalca la variante e non consulta mai `assessLoadNeed` | P-2d, caso 4b | `engine/review.ts` | 2026-11-08 |
| A4 | Alto | Nessun tetto alla velocità di salita nella scala: da 1 a 6 in 5 settimane | P-4b, caso 4c | `engine/review.ts` | 2026-11-08 |
| A5 | Alto | Aderenza: il denominatore presuppone giorni assegnati su un programma che non ne ha | S2 | `engine/metrics.ts` `plannedSessionsSoFar` | 2026-11-08 |
| A6 | Alto | Aderenza: conta tutte le sedute chiuse di sempre, anche prima dell'inizio (misurato 833%) | M-ADER | `engine/metrics.ts` `adherenceFromSessions` | 2026-11-08 |
| A7 | Alto | Volume mostrato all'atleta: include la finitura metabolica e le sedute non chiuse | V-VOLUME | `engine/metrics.ts` `volumeByGroup` | 2026-11-08 |
| M1 | Medio | `MIN_SETS_FOR_VERDICT` conta le righe, non le serie | caso 4d | `engine/review.ts` | 2026-11-08 |
| M2 | Medio | Le stazioni a tempo fisso finiscono ogni settimana in «al massimo senza leva» | R-ALMASSIMO | `engine/review.ts` | 2026-11-08 |
| M3 | Medio | Nessuna regola di stallo | S1, P-8a | manca la regola | 2026-11-08 |
| M4 | Medio | Nessun adattamento al rientro dopo una pausa lunga | S3 | `engine/rotation.ts`, manca la regola | 2026-11-08 |
| M5 | Medio | Nessuna seduta sotto i 40 minuti | G6 | `data/circuit.ts` | 2026-11-08 |
| M6 | Medio | Scarico e ritest arrivano per calendario, non per lavoro svolto | — | `engine/schedule.ts` `programWeek` | 2026-11-08 |
| M7 | Medio | Schede esercizio incomplete (`equipment`, `frames` assenti su tutti e 56): ogni verifica immagine resta provvisoria e nessuna figura è approvabile | verifica immagini | `src/data/exercises.ts` vs `training/EXERCISE_SCHEMA.md` | 2026-11-08 |
| L1 | Basso | CSV: una nota che comincia con `=` viene esportata come formula | U3 | `db/csv.ts` `escapeCell` | 2026-11-08 |
| L2 | Basso | `syncStatesFromLog` azzera il carico di un esercizio `inherent` se le serie non hanno kg (ipotesi) | — | `engine/draft.ts` | 2026-11-08 |

## Voci chiuse (ultime 10)

Nessuna: questa è la prima misura.

## Verifiche tecniche delle immagini

| Data | Immagine | Scheda | Esito | Punti con PROBLEMA | Dettaglio |
|---|---|---|---|---|---|
| 2026-11-08 | `test-fixtures/passo-7/stacco-schiena-curva.svg` | `stacco-rumeno-manubri` | **SCARTATA** | 1 corrispondenza · 2 archetipo · 3 anatomia · 4 tecnica · 6 coerenza (minore) | `IMAGES.md` |
| 2026-11-08 | `src/assets/exercises/stacco-rumeno-manubri.svg` (confronto) | `stacco-rumeno-manubri` | 8/8 OK, *verificata provvisoria* (scheda incompleta, §0.2) | nessuno | `IMAGES.md` |
| 2026-11-08 | `test-fixtures/passo-7/cieco/figura-a.svg` (cieca) | `stacco-rumeno-manubri` | **SCARTATA** | 1 corrispondenza · 2 archetipo · 3 anatomia · 4 tecnica · 5 attrezzo | `IMAGES.md` |
| 2026-11-08 | `test-fixtures/passo-7/cieco/figura-b.svg` (cieca) | `stacco-rumeno-manubri` | **SCARTATA** per §2 (2 problemi nel gruppo 5/6/8); gesto corretto, difetti di sola forma | 5 attrezzo · 6 coerenza | `IMAGES.md` |

## Ricalcoli indipendenti eseguiti

| Metrica | Esito | Script |
|---|---|---|
| Durata delle 4 sedute | coincide al secondo con il mio ricalcolo; 39,6-39,9' su 40' dichiarati | `01-durata-volume.mts` |
| Volume settimanale per gruppo | coincide; 5 gruppi su 8 fuori dalla fascia 16-20 del metodo | `01-durata-volume.mts` |
| Media mobile a 7 giorni | coincide su tutti i punti | `03-metriche.mts` |
| Medie settimanali e delta | coincide; `comparedTo` dichiarato correttamente | `03-metriche.mts` |
| Aderenza | **non coincide**: vedi A5 e A6 | `03-metriche.mts` |
| Volume da log | **non coincide**: vedi A7 | `03-metriche.mts` |
| Riepilogo esercizio (totali, RIR medio, kg max) | coincide | `04-input-non-fidato.mts` |
