# Misure

Una riga per misura. Il set di atleti e gli scenari sono deterministici: a
parità di regole la misura si ripete identica. Se un numero si muove, è una
regola che si è mossa.

## Misure

| Data | Regole / catalogo | Set | C1 Sic. | C2 Rim. | C3 Fed. | C4 Coer. | C5 Pers. | C6 Concr. | C7 Progr. | C8 Dur. | Bloc. | Alti | Medi | Bassi | Nucleo | Rapporto |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-09 | stesso catalogo · engine al commit `1802631` | PERSONAS v1, SCENARIOS v1 | 14% (1/7) | 0% (0/4) | 67% (2/3) | 33% (2/6) | 67% (2/3) | 75% (3/4) | 83% (5/6) | 100% (4/4) | 6 | 4 | 8 | 4 | 2 PASS / 2 FALLITI / 4 NON COPERTI | `quality/reports/2026-11-09-quality.md` |
| 2026-11-08 | `circuit.ts` 4 circuiti, 56 esercizi, 13 scale · engine al 2026-11-08 | PERSONAS v1 (11 persone), SCENARIOS v1 (30 scenari) | 14% (1/7) | 0% (0/4) | 67% (2/3) | 43% (3/7) | 50% (1/2) | 50% (2/4) | 67% (4/6) | 100% (4/4) | 6 | 7 | 7 | 2 | 2 PASS / 3 FALLITI / 3 NON COPERTI | `quality/reports/2026-11-08-quality.md` |

Soglie proposte in GRID.md: C1 100 · C2 100 · C3 100 · C4 ≥90 · C5 ≥80 ·
C6 ≥90 · C7 100 · C8 100. **Nessuna soglia è ancora approvata da Alessio.**
Esito del 2026-11-08 contro le soglie proposte: **NO-GO** (6 Bloccanti).
Aggiornamento del 2026-11-08 (secondo giro, immagini): 1 figura giudicata,
1 SCARTATA, 0 idonee. Difetto M7 aperto.
Aggiornamento del 2026-11-08 (terzo giro, verifica cieca di 2 figure):
2 giudicate, 2 SCARTATE, 0 idonee. Nuovo rilievo di convenzione sui manubri
(punto 5), comune a tutte le figure viste finora: decisione aperta per Alessio.
Misura del 2026-11-09 (commit `1802631`): **NO-GO contro soglie proposte**.
C4, C5, C6 e C7 salgono di una voce ciascuno; C1, C2, C3 e C8 invariati. Le
colonne di C3, C4 e C5 del 2026-11-08 **non si riproducevano** dalla
composizione scritta: baseline ricalcolata C3 67% (2/3), C4 17% (1/6), C5 33%
(1/3); la composizione è ora esplicita in GRID.md. Nessuna immagine nuova da
verificare in questo giro.

## Voci aperte

| ID | Grav. | Titolo | Scenario | Dove | Aperta il |
|---|---|---|---|---|---|
| B1 | Bloccante | Nessun rimando sul dolore dichiarato | L1 | manca la regola (`BOUNDARIES.md`) | 2026-11-08 |
| B2 | Bloccante | Nessun campo né rimando per una condizione medica dichiarata | L2 | manca la regola | 2026-11-08 |
| B3 | Bloccante | Nessuna soglia né rimando sui segnali di rapporto problematico con cibo e corpo | L3 | `engine/metrics.ts`, manca la regola | 2026-11-08 |
| B4 | Bloccante | Nessuna verifica dell'età, nessuna decisione sui minorenni | L5 | manca la regola | 2026-11-08 |
| B5 | Bloccante | Gradino di partenza: lo zero misurato è coperto dal 2026-11-09, sopra lo zero il valore del test non entra ancora; `SessionScreen` scrive `defaultLevel` sull'alternativa scelta | G7, caso 2 | manca la regola (mappatura valore → gradino), `ui/session/SessionScreen.tsx:292` | 2026-11-08, ridotto il 2026-11-09 |
| B6 | Bloccante | Nessun modello dell'attrezzatura: 32 blocchi su 48 senza alternativa | G1, G3, S5, caso 3 | `types/exercise.ts`, `data/circuit.ts`, `db/db.ts` | 2026-11-08 |
| A2 | Alto | La revisione settimanale propone la salita di gradino col tempo non rispettato | P-2c, caso 4a | `engine/review.ts` | 2026-11-08 |
| A3 | Alto | La zavorra scavalca la variante e non consulta mai `assessLoadNeed` | P-2d, caso 4b | `engine/review.ts` | 2026-11-08 |
| A4 | Alto | Nessun tetto alla velocità di salita nella scala: da 1 a 6 in 5 settimane | P-4b, caso 4c | `engine/review.ts` | 2026-11-08 |
| A7 | Alto | Volume mostrato all'atleta: include la finitura metabolica e le sedute non chiuse | V-VOLUME | `engine/metrics.ts` `volumeByGroup` | 2026-11-08 |
| M1 | Medio | `MIN_SETS_FOR_VERDICT` conta le righe, non le serie | caso 4d | `engine/review.ts` | 2026-11-08 |
| M3 | Medio | Nessuna regola di stallo | S1, P-8a | manca la regola | 2026-11-08 |
| M4 | Medio | Nessun adattamento al rientro dopo una pausa lunga | S3 | `engine/rotation.ts`, manca la regola | 2026-11-08 |
| M5 | Medio | Nessuna seduta sotto i 40 minuti | G6 | `data/circuit.ts` | 2026-11-08 |
| M6 | Medio | Scarico e ritest arrivano per calendario, non per lavoro svolto | — | `engine/schedule.ts` `programWeek` | 2026-11-08 |
| M8 | Medio | Aderenza: dovute e numeratore partono dal lunedì della settimana di inizio, non dalla data di inizio (inizio di venerdì: 2 sedute dovute al primo giorno; conta una seduta precedente all'inizio). Latente: l'onboarding scrive sempre un lunedì | M-ADER | `engine/metrics.ts` | 2026-11-09 |
| M9 | Medio | La pausa di blocco non nomina il blocco che finisce né quello che comincia: modifica dichiarata e non presente. `groupLabel` è esportato ma usato solo dalla scheda, dove sostituisce una funzione locale identica | — | `engine/circuit.ts` `restBetween` | 2026-11-09 |
| M7 | Medio | Schede esercizio incomplete (`equipment`, `frames` assenti su tutti e 56): ogni verifica immagine resta provvisoria e nessuna figura è approvabile | verifica immagini | `src/data/exercises.ts` vs `training/EXERCISE_SCHEMA.md` | 2026-11-08 |
| L1 | Basso | CSV: una nota che comincia con `=` viene esportata come formula | U3 | `db/csv.ts` `escapeCell` | 2026-11-08 |
| L2 | Basso | `syncStatesFromLog` azzera il carico di un esercizio `inherent` se le serie non hanno kg (ipotesi) | — | `engine/draft.ts` | 2026-11-08 |
| L3 | Basso | La conferma dell'azzeramento totale accetta `cancella` minuscolo (`trim().toUpperCase()`): la parola scritta a mano rallenta meno di quanto dichiari | — | `ui/screens/SettingsScreen.tsx` | 2026-11-09 |
| L4 | Basso | Senza data di inizio l'aderenza dichiara «0 sedute chiuse» anche con sedute nel diario | M-ADER | `engine/metrics.ts` `adherenceFromSessions` | 2026-11-09 |

## Voci chiuse (ultime 10)

| ID | Grav. | Titolo | Chiusa il | Verifica di chiusura |
|---|---|---|---|---|
| A1 | Alto | `review.ts` non leggeva `excludeFromReview` | 2026-11-09 | caso 4f del nucleo: `kb-swing` 12-11-12 su 15-20 → nessun verdetto, `serie=0`. I 12 blocchi con il flag sono esattamente i 12 blocchi `F`; `effectiveBlock` conserva il flag sull'alternativa |
| A5 | Alto | Aderenza: denominatore su giorni assegnati | 2026-11-09 | `03-metriche.mts` M1: le dovute coincidono col mio ricalcolo proporzionale troncato su tutti e 7 i giorni (0,1,1,2,2,3,4) |
| A6 | Alto | Aderenza: contava tutte le sedute di sempre (833%) | 2026-11-09 | `03-metriche.mts` M1: 24 sedute archiviate + 1 nel programma → 1/1 = 100%; una seduta `upper-a` del programma archiviato → 0/4 |
| M2 | Medio | Stazioni a tempo fisso in «al massimo senza leva» ogni settimana | 2026-11-09 | `02-revisione.mts` R1: corda e step ai 30" prescritti → nessuna uscita. Tutti i 10 blocchi con `min === max` stanno dentro `F` |

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
| Aderenza | 2026-11-08 **non coincide** (A5, A6) · 2026-11-09 **coincide** su tutti e 7 i giorni e sullo storico archiviato, col troncamento come riferimento (convenzione da approvare); resta M8, latente | `03-metriche.mts` |
| Gradino di partenza con i 9 test di P1 | 2026-11-09: zero → gradino 1 su tutti gli esercizi prescritti; `hanging-leg-raise` resta al 5 | `safety-core.mts` caso 2, `02-revisione.mts` R4 |
| Volume da log | **non coincide**: vedi A7 | `03-metriche.mts` |
| Riepilogo esercizio (totali, RIR medio, kg max) | coincide | `04-input-non-fidato.mts` |
