# Misure

Una riga per misura. Il set di atleti e gli scenari sono deterministici: a
parità di regole la misura si ripete identica. Se un numero si muove, è una
regola che si è mossa.

## Misure

| Data | Regole / catalogo | Set | C1 Sic. | C2 Rim. | C3 Fed. | C4 Coer. | C5 Pers. | C6 Concr. | C7 Progr. | C8 Dur. | Bloc. | Alti | Medi | Bassi | Nucleo | Rapporto |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-09b | catalogo 72 esercizi · circuito 52 blocchi · engine al commit `f63c9f1` | PERSONAS v1, SCENARIOS v1 | 14% (1/7) | 0% (0/4) | 33% (1/3) | 33% (2/6) | 67%* | 75%* | 83% (5/6) | 100% (4/4) | 8 | 8 | 13 | 6 | 2 PASS / 2 FALLITI / 4 NON COPERTI | `quality/reports/2026-11-09-quality-circuito.md` |
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
Misura del 2026-11-09b (commit `f63c9f1`, trascrizione del circuito):
**NO-GO contro soglie proposte**. C3 scende (67% → 33%): i numeri proposti
all'atleta non vengono più tutti dalle regole (B7, A9). C8 resta 100% e migliora
in valore (39,6-39,9' → 35:48-39:13). `*` C5 e C6 non rimisurati, nessuna regola
di consiglio toccata. **Il confronto del caso 3 del nucleo (32/48 → 37/52) non è
uno a uno**: la mia mappa degli attrezzi non conosceva i 16 esercizi nuovi e
sottostimava; estesa in questo giro. Cinque fixture del nucleo sono state
ripuntate perché la riscrittura dei dati le aveva svuotate senza farle fallire.

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
| B7 | Bloccante | Zavorra, valore di partenza ed etichetta precompilati da un **altro esercizio**: `lastLoggedByBlock` indicizza solo per `blockCode` e 33 codici su 36 hanno cambiato esercizio (goblet 24 kg → estensione tricipiti sopra la testa; wall-sit 45" → 45 ripetizioni di estensione al TRX) | G1, G3 | `engine/draft.ts:243`, `data/circuit.ts` | 2026-11-09b |
| B8 | Bloccante | L'app serve 72 figure, **zero approvate**; 16 pubblicate in `f63c9f1` fuori dal flusso, una (`hip-thrust-panca-bilaterale`) già `da rifare` nel registro di `exercise-media-lead` | verifica immagini | `src/assets/exercises/`, `media/LIBRARY.md` | 2026-11-09b |
| A8 | Alto | Giunzione Tri-set 2 → finitura **senza nessun passo**, nemmeno la transizione da 15": suitcase carry 24 kg → swing (circuito-1, anche 3ª stazione di presa di fila) e hollow hold → swing (circuito-3) | V-GIUNZIONE (proposto) | `data/circuit.ts` `FORZA_BRACCIA`, `volumeBraccia` | 2026-11-09b |
| A9 | Alto | `workSeconds` non si scala più quando il gradino ribalta `perSide`: countdown 85" su ~170 reali all'hip thrust dal gradino 3, 30" su 60" al dead-hang dal 4, 45" su 90" al rematore TRX dal 5. L'override `perSide: step.perSide` in `buildGuidedPlan` è codice morto su tutti e 52 i blocchi | P-2d | `engine/circuit.ts:64` | 2026-11-09b |
| A10 | Alto | `review.ts:131` scarta in silenzio l'entrata registrata il cui esercizio non coincide con quello del blocco: tutto lo storico dei 33 codici cambiati sparisce dai verdetti senza un messaggio | P-2c, P-4b | `engine/review.ts:131` | 2026-11-09b |
| A11 | Alto | Titolo del player dal `variantLabel` della seduta scorsa, figura dal gradino di adesso: dopo ogni salita accettata il titolo nomina il gradino vecchio sopra la figura del nuovo | P-2b | `engine/draft.ts:60`, `ui/session/GuidedSession.tsx:561`, `SessionScreen.tsx:260` | 2026-11-09b |
| M10 | Medio | Due definizioni incompatibili di volume settimanale: il test esclude la finitura (quadricipiti 6), `metrics.ts` la include (quadricipiti 14). L'atleta vede la seconda | V-VOLUME | `data/circuit.test.ts`, `engine/metrics.ts` | 2026-11-09b |
| M11 | Medio | `hip-thrust-panca-bilaterale.videoQuery` dice `barbell` per un esercizio con kettlebell sull'anca | G5 | `data/exercises.ts` | 2026-11-09b |
| M12 | Medio | Alternative dichiarate da 5 a **0**: il selettore «Quale stai facendo» non compare più nel programma attivo. Aggrava B6 | S5 | `data/circuit.ts` | 2026-11-09b |
| M13 | Medio | Regole disallineate dai dati: PROGRAM_RULES §2/§5/§6, METHOD §2/§6. La regola «swing mai in una seduta con due cerniere d'anca» ha perso il suo unico ancoraggio nel codice e non è un predicato calcolabile | V-GIUNZIONE | `training/PROGRAM_RULES.md`, `METHOD.md` | 2026-11-09b |
| L5 | Basso | `estimatedMinutes` sotto il piano calcolato in tutte e quattro (38 vs 38:10 … 39 vs 39:13), e il piano è già un pavimento | D1-D4 | `data/circuit.ts` | 2026-11-09b |
| L6 | Basso | Gradino 2 e esercizio hanno due nomi diversi per la stessa cosa | — | `data/progressions.ts`, `data/exercises.ts` | 2026-11-09b |
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
| 2026-11-09b | `src/assets/exercises/hip-thrust-panca-bilaterale.svg` | `hip-thrust-panca-bilaterale` | **SCARTATA** | 1 corrispondenza · 2 archetipo · 4 tecnica · 5 attrezzo · 7 pulizia · 8 leggibilità | `IMAGES.md` |
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
| Durata delle 4 sedute, commit `f63c9f1` | coincide al secondo (scarto 0 s su tutte e quattro); 35:48-39:13 su 40' | `06-circuito-trascrizione.mts` |
| Volume settimanale, commit `f63c9f1` | coincide al decimale con il test del progetto (braccia 34,5 · core 16,5 · dorsali 15 · spalle 13,5 · petto 9 · femorali-glutei 9 · quadricipiti 6 · **polpacci 0**); 24 stazioni × 3 = 72 crediti primari + 31,5 secondari = **103,5 contro i 128 che la fascia pretende**: fuori fascia per aritmetica | `06-circuito-trascrizione.mts` |
| Volume da log | **non coincide**: vedi A7 | `03-metriche.mts` |
| Riepilogo esercizio (totali, RIR medio, kg max) | coincide | `04-input-non-fidato.mts` |
