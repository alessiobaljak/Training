# Misure

Una riga per misura. Il set di atleti e gli scenari sono deterministici: a
parità di regole la misura si ripete identica. Se un numero si muove, è una
regola che si è mossa.

## Misure

| Data | Regole / catalogo | Set | C1 Sic. | C2 Rim. | C3 Fed. | C4 Coer. | C5 Pers. | C6 Concr. | C7 Progr. | C8 Dur. | Bloc. | Alti | Medi | Bassi | Nucleo | Rapporto |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-21c | `704dbfa` (head locale non pushato, incrementale su `c8964ff`): R9c (B16) — `statiDaFissare` alla chiusura dei due gestori, `fissaStatiMancanti` all'accesso; regole delle sedute e catalogo invariati | PERSONAS v1, SCENARIOS v1 | = | = | = | = | = | = | = | = (non rimisurati: gli scenari chiamano il motore, non la chiusura; A19 ricalcolato) | **8** + 4ᵖ (B16 ridotto, **B17 esteso**, B18 nuovo preesistente) | 2 | 12 | 28 | 2 PASS / 4 FALLITI / 2 NON COPERTI (**v13**: 4 = 4h + 4n; 2 = 2c + 2d) | `quality/reports/2026-11-21-quality-704dbfa.md` |
| 2026-11-21b | `c8964ff` (head locale non pushato, incrementale su `96a90c2` = `6cbb759` per `src/`): T-28 (R-16, calendario) e M23/M24 nella lista delle figure; regole delle sedute invariate | PERSONAS v1, SCENARIOS v1 | = | = | = | = | = | = | = | = (nessuna funzione usata dagli scenari cambiata: `schedule.ts` solo un'aggiunta) | **6** + 4ᵖ (B16 nuovo, preesistente) | 2 | 12 | 26 | 2 PASS / 4 FALLITI / 2 NON COPERTI (**v12**: caso 4 = 4h + 4l) | `quality/reports/2026-11-21-quality-c8964ff.md` |
| 2026-11-21 | `50793fd` (head locale non pushato, incrementale su `96a90c2` in produzione): solo figure (`exercise-art.ts`, `ExerciseArt.tsx`, 4 webp tolti), regole e catalogo invariati · verifica tecnica contro `media/reports/2026-11-21-media.md` | PERSONAS v1, SCENARIOS v1 | = | = | = | = | = | = | = | = (C1-C8 non rimisurati: nessuna regola cambiata) | **5** + 4ᵖ | 2 | 14 | 25 | 2 PASS / 4 FALLITI / 2 NON COPERTI (v11; caso 6: 261 file, 0 approvati) | `quality/reports/2026-11-21-quality-50793fd.md` |
| 2026-11-20d | `f7f945d` (head locale non pushato, incrementale su `fb560e7` in produzione): rilascio C (T-27 L26, T-26 L25, T-25 M22, B14), progressione 4.1, consigli 4.1, programmi 2.3 rev. 11-21, limiti 1.4 rev. 11-21 · catalogo 72 · circuito 52 blocchi · griglia v3 | PERSONAS v1, SCENARIOS v1 | 29% (2/7) | 0% (0/4)ᵖ | **67% (2/3)** (M22, B14 chiusi) | 71% (5/7); v4 **75%** | 67% (2/3) | 75% (3/4) | 86% (6/7) | 100% (4/4); D5 100% con la nota nuova | **5** + 4ᵖ | 2 | 12 | 21 | 2 PASS / 4 FALLITI / 2 NON COPERTI (**v11**) | `quality/reports/2026-11-20-quality-f7f945d.md` |
| 2026-11-20c | `0d85597` (head locale non pushato, incrementale su `e30cdc6` in produzione): rilascio B2 (T-15 R14a/c/e + `lapsed`, T-16 rev. R14d, T-24 D-19 b; `d5f72e2` solo CSS), progressione 4.1, consigli 4.1, limiti 1.4 rev. 11-21 · catalogo 72 · circuito 52 blocchi · griglia v3 | PERSONAS v1, SCENARIOS v1 | 29% (2/7) | 0% (0/4)ᵖ | 33% (1/3) (A19 chiuso; M22, B14) | 71% (5/7); v4 63% | 67% (2/3) | 75% (3/4) | 86% (6/7) | 100% (4/4) (D5 80%) | **6** + 4ᵖ (B14 nuovo, preesistente) | 2 | 13 | 20 | 2 PASS / 4 FALLITI / 2 NON COPERTI (**v10**, caso 4 solo 4h) | `quality/reports/2026-11-20-quality-0d85597.md` |
| 2026-11-20b | `221b2e8` (head locale non pushato, incrementale su `59daf79` = `0f3f191` in produzione): rilascio B1 (L23, L24, M21, 17.2, D-21 a, D-22 a / R19, D-23 a), progressione 4.0 rev., consigli 4.0 rev., progressi 3.1 rev., limiti 1.4 rev. · catalogo 72 · circuito 52 blocchi · griglia v3 | PERSONAS v1, SCENARIOS v1 | 29% (2/7) | 0% (0/4)ᵖ | 33% (1/3) (A19 non eseguito, M22) | 71% (5/7) | 67% (2/3) | 75% (3/4) | 86% (6/7) | 100% (4/4) (D5 proposta: 80%, circuito-4 fino a 59′ con la variante) | **5** + 4ᵖ | 3 | 14 | 19 | 2 PASS / 4 FALLITI / 2 NON COPERTI (**v9**, caso 4 solo 4h) | `quality/reports/2026-11-20-quality-221b2e8.md` |
| 2026-11-20 | `4edf751` (head locale non pushato, incrementale su `001de30` in produzione): rilascio A di R14-R18 (R18, R16, R17, R15, R14b), progressione 4.0, progressi 3.1, consigli 4.0, programmi 2.2; D-20 (a, b) · catalogo 72 · circuito 52 blocchi · griglia v3 | PERSONAS v1, SCENARIOS v1 | 29% (2/7) | 0% (0/4)ᵖ | 33% (1/3) (A18 chiuso, A19 aperto) | 71% (5/7) | 67% (2/3) | 75% (3/4) | 86% (6/7) | 100% (4/4) (con D5 proposta: 80%) | **5** + 4ᵖ (B13 aperto e chiuso) | 3 | 15 | 19 | 2 PASS / 4 FALLITI / 2 NON COPERTI (v8, caso 4 solo 4h) | `quality/reports/2026-11-20-quality.md` |
| 2026-11-16 | `cf7588a` (head locale non pushato, incrementale su `a747e09` in produzione): R10-R13, progressione 3.0, progressi 3.0, consigli 3.0; D-4 (a), D-19 sì · catalogo 72 · circuito 52 blocchi · griglia v3, composizione v2 confermata | PERSONAS v1, SCENARIOS v1 | 29% (2/7) | 0% (0/4)ᵖ | **33% (1/3)** rimisurato (A18) | 71% (5/7) | 67% (2/3) | 75% (3/4) | 86% (6/7) | 100% (4/4) | **5** + 4ᵖ (B12 aperto e chiuso) | 3 | 12 | 21 | 2 PASS / 4 FALLITI / 2 NON COPERTI (v7, caso 4 solo 4h) | `quality/reports/2026-11-16-quality.md` |
| 2026-11-15 | `ff42dfb` (head locale non pushato; `2c9d822` R5-R7 a fine seduta, `ff42dfb` R8 e R5-R7 in revisione; B11/A15 da `79d2cb0`) · catalogo 72 · circuito 52 blocchi · soglie approvate, griglia v3, S4 nella lettura D-16 | PERSONAS v1, SCENARIOS v1 | **29% (2/7)** | 0% (0/4)ᵖ | **67% (2/3)** | **71% (5/7)** | 67% (2/3) | 75% (3/4) | 86% (6/7) | 100% (4/4) | **5** + 4ᵖ | 3 | 12 | 17 | 2 PASS / 4 FALLITI / 2 NON COPERTI (caso 4 solo per 4h) | `quality/reports/2026-11-15-quality.md` |

Soglie **approvate da Alessio il 2026-11-12** (GRID.md v3): C1 100 · C2 100 ·
C3 100 · C4 ≥90 · C5 ≥80 · C6 ≥90 · C7 100 · C8 100; GO solo con Bloccanti = 0
e Alti = 0 su L. ᵖ = blocca solo il rilascio pubblico (B1-B4, decisione del
2026-11-12; C2 è fatto solo di loro).

Misura del 2026-11-21c (commit `704dbfa`, R9c): **NO-GO** per la regola approvata (B17 esteso
da questo commit); decisione D-Q2 per Alessio. **B16 ridotto, non chiuso**: chiusure del player e
storia fissate (4l v13 superato; `23` nel browser: push-up `[1,0,0,0]` alla chiusura, ritest 16 ⇒
resta), ma «Archivia» dalla Home non scrive nessuno stato (4n; `23`: bulgaro 1 → 2). **B17**: dopo
un test peggiore nessun esercizio fatto scende e non c'è proposta (R9b assente): 2d 14/14 (7 su
`c8964ff`), `22` C 7/7 restano (prima 7/7 scendevano), 9.29 casuale 0 salite e 0 discese su 4664
test (1047 e 329 con la chiusura di prima). **B18** (domanda 4): `scendi-di-livello` 6 → 5 con 5 kg.
Migrazione nel browser NON COPERTA (seconda esecuzione di `23` sovrapposta a uno smoke altrui).
verify (936) da me; smoke e offline no.

Misura del 2026-11-21b (commit `c8964ff`): **GO per il push** (nessun Bloccante o Alto
introdotto o peggiorato); app ancora NO-GO. `20` (nuovo, browser + emulatori): su `c8964ff`
il riepilogo di un ritest (inizio 10-05, settimana 7) non ha «Quando parte», «Salva e torna
alla Home» attivo, data invariata; dopo «Azzera tutto» la data è nulla e il primo giro torna
come prima. Su `6cbb759` la data diventa 11-23 (R-16, **B15**, chiuso). `21` (nuovo): R-17 su
tutti e due, push-up 1 → 2 (**B16**), 7 esercizi su 39 esposti. Nucleo v12 (4l, 4m). `19`:
4 posizioni in più senza figura, nient'altro. verify (929) da me.

Verifica figure del 2026-11-21 (commit `50793fd`, incrementale su `96a90c2`): **GO per il
push** (nessun Bloccante o Alto nuovo o peggiorato); app ancora NO-GO. `19-figure` (nuovo):
264 posizioni esercizio × gradino, 35 cambiano; 27 → nessuna figura, 6 → figura proposta,
**2 sbagliata → sbagliata (M23)**, 0 giusta → sbagliata; 0 chiavi orfane, 0 collisioni.
Positivo su `96a90c2`: le 35 mostrano le figure dell'audit (sbarra, verticale libera,
elastico…). Foto `trx-row` NON COPERTA (termine 5: non guardata). Nuovi M23, M24, L33-L36.
verify (927) da me; smoke, offline dalla sessione principale (per me NON COPERTI).

Misura del 2026-11-20d (commit `f7f945d`, incrementale su `fb560e7`): **GO per
il push del rilascio C** (nessun Bloccante o Alto introdotto o peggiorato; B14
chiuso); app ancora NO-GO. `18` (nuovo): F 222 righe, 219 OK, 1 DIVERSO (M22.6r =
L30), NC b.8, L26.2s; A 0; A2 (revisione con durata come l'app) 144 differenze, tutte
L30; M22.7 0 su 194.667 + 24.480; C3 e C3R (accetto e rifiuto, scelte non eseguite,
gradini a mano): σ′ = §3 su 63.343 leve, L25.P1 0 su 8.129 passi, M22.P 0 su 1.801,
R-14 0 su 137 carichi, max circuito 4 56:43 (teorico 59:15); B14 0 su 61.410 voci.
Positivo su `fb560e7`: F 13, σ′ 154, L25.P1 12, M22.P 38, revisioni 82, B14 51.443,
nucleo 4k non misura. Chiusi **B14**, M22, L25, L26. Nuovi L30, L31, L32. verify
(924), smoke, offline eseguiti da me in sequenza.

Misura del 2026-11-20c (commit `0d85597`, incrementale su `e30cdc6`): **GO per
il push di B2** (nessun Bloccante o Alto introdotto o peggiorato); app ancora NO-GO.
`17` (nuovo): F 198 righe, 197 come atteso (R19.R = M22); 14.1-14.17, 15.12, b.8,
D19.1-D19.20 OK (D19.21 non applicabile); A 0 su 259.782 col riferimento D-19 b +
R14c; B 0; D19.P 0 su 145 + 292; simulazioni con la chiusura dell'app: M18 0,
predicato R14 = testo, 13.P/S1/E7 0, revisioni = riferimento su 18.430; P14 5.288
scelte tolte, 0 differenze, 55 testi che tacciono un azzeramento (L29); sync =
testo su 20.000. Positivo su `e30cdc6`: F 37 diverse, A 302, D19.P 294 + 288, M18
7, sync 200, nucleo 4j ×2. Chiusi M18, L2, L22, A19. Nuovi **B14** (calibrazione,
preesistente: 37.196 «Aggiungi 2,5 kg» su 46.064 voci pesate, identico in
produzione), L27, L28, L29. verify (908), smoke, offline eseguiti da me in sequenza.

Note delle misure fino al 2026-11-09b: `ARCHIVE.md`; dal 2026-11-12 al 2026-11-20: `ARCHIVE-2.md`; dal 2026-11-20b e righe fino al 2026-11-12b: `ARCHIVE-3.md`.

## Voci aperte

| ID | Grav. | Titolo | Scenario | Dove | Aperta il |
|---|---|---|---|---|---|
| B1 | **Bloccante al rilascio pubblico** (oggi non blocca, decisione 2026-11-12) | Nessun rimando sul dolore dichiarato | L1, caso 1 | manca la regola (`BOUNDARIES.md`) | 2026-11-08 |
| B2 | **Bloccante al rilascio pubblico** (oggi non blocca, decisione 2026-11-12) | Nessun campo né rimando per una condizione medica dichiarata | L2 | manca la regola | 2026-11-08 |
| B3 | **Bloccante al rilascio pubblico** (oggi non blocca, decisione 2026-11-12) | Nessuna soglia né rimando sui segnali di rapporto problematico con cibo e corpo (−3,1 kg/sett. per 2 settimane: silenzio) | L3 | `engine/metrics.ts`, manca la regola | 2026-11-08 |
| B4 | **Bloccante al rilascio pubblico** (oggi non blocca, decisione 2026-11-12) | Nessuna verifica dell'età, nessuna decisione sui minorenni | L5 | manca la regola | 2026-11-08 |
| B6 | Bloccante | Nessun modello dell'attrezzatura: 37 blocchi su 52 senza alternativa | G1, G3, S4, S5, caso 3 | `types/exercise.ts`, `data/circuit.ts` | 2026-11-08 |
| B8 | Bloccante | L'app serve figure **zero approvate**. Aggravato il 2026-11-12: 15 SVG rifatte e pubblicate in `47c7f6d` senza la verifica di `exercise-media-lead` (LIBRARY.md fermo al 2026-11-09); 3 delle 10 verificate sono da rifare. **2026-11-12b**: misurato dal caso 6 su `LIBRARY.md`: 265 file nel bundle, 0 approvati; 25 verificate da `exercise-media-lead`, tutte provvisorie (M7, checklist §0.2: nessuna approvazione su scheda incompleta). Non deciso | verifica immagini | `src/assets/`, `media/LIBRARY.md` | 2026-11-09b |
| B9 | Bloccante | Decompressione Z1: dead hang 30" al gradino 2 a chi ha misurato meno di 30" **allo stesso gradino** (P1: 8"), tutte e 4 le sedute. R1 riga 2 esclude i blocchi fuori revisione; onboarding corretto in `2d84d87` («solo nella decompressione, non si giudica»: vero, non cambia i 30"); il player registra 30" da solo. Non deciso (S7 nei blocchi esclusi) | G7, caso 2 (2c) | `engine/progression.ts` riga 2 di R1, `OnboardingScreen.tsx:398`, `GuidedSession.tsx` auto-registrazione | 2026-11-12 |
| B10 | Bloccante | **S9 violata**: `circuito-4`, ogni settimana tranne lo scarico (6), F4 plank tocco spalla → F1 corda slam del giro 2 **senza nessun passo** (finitura: 15" fra stazioni, 0 fra i giri). R2 copre solo la giunzione B → F; L14 verifica solo quella | caso 4h, V-GIUNZIONE | `src/data/circuit.ts` (`FINITURA`, ordine F di S4), `buildGuidedPlan` | 2026-11-12b |
| B16 | Bloccante | **R-17: un test alza il gradino di uno stato mai salvato**, senza R5 né R7 (S1, S3). `getExerciseState` → `initialExerciseState(…, latestTests())`; `syncStatesFromLog` salva solo gli stati cambiati. 9.26: push-up 1 → 2 con M=16; con lo stato salvato resta. Esposti 7 esercizi su 39 dei circuiti (trazioni e dip fino a 1 → 3). Preesistente (trovato da training-designer, misurato da me il 2026-11-21b). Chiude R9c (T-33): **prima della settimana 6 di Alessio** **2026-11-21c (`704dbfa`, R9c): ridotto.** Chiusure del player e storia fissate (4l v13 superato; `23`: stato `[1,0,0,0]` alla chiusura, ritest ⇒ resta). **Resta «Archivia»** dalla Home (`HomeScreen.tsx:489`): seduta rimasta aperta con serie, chiusa senza nessuno stato (4n; `23`: bulgaro 1 → 2 dopo il ritest) | caso 4l, `21` | `db/repository.ts:254`, `engine/draft.ts:387` | 2026-11-21b |
| B17 | Bloccante | **S7 dopo un test peggiore: nessun esercizio fatto scende e non c'è proposta** (R9b non implementata; R9c punto 4 «solo in discesa, con R9b»). Preesistente per gli stati salvati, mai misurato prima; **esteso da `704dbfa`** a ogni esercizio fatto almeno una volta. 2d: 14 su 14 (7 su `c8964ff`); `22` C: ritest M=1, 7 su 7 restano (su `c8964ff` scendevano tutti e 7); 9.29 casuale: 329 discese automatiche → 0. Mitigazione parziale: la revisione dà `scendi-di-livello` di un gradino solo con tutte le serie sotto il minimo in due sedute | S3, G4, caso 2 (2d) | R9b assente (`engine`), `db/repository.ts` | 2026-11-21c |
| B18 | Bloccante | **`scendi-di-livello` tiene la zavorra sotto l'ultimo gradino (S5)**, domanda 4 del designer. Trazioni e dip al 6 con 5 kg, 3-3-3 in due sedute: verdetto 6 → 5 con `loadKg` 5; il testo («Livello 6 → 5. Tempo e pause tornano a quelli della scheda.») tace la zavorra; «Applica» scrive `stateAfter` com'è (`ReviewScreen.decidi`). Preesistente, identico su `c8964ff` | `22` A | `engine/review.ts` (`stateAfter: { ...before, level: giu, … }`) | 2026-11-21c |
| A10 | Alto | `review.ts` scarta in silenzio l'entrata il cui esercizio non coincide con quello del blocco | P-2c, P-4b | `engine/review.ts` (`block.exercise !== logged.exercise`) | 2026-11-09b |
| A16 | Alto | Regola di esito approvata: C4 (29%), C5 (67%) e C6 (75%*) sotto soglia insieme valgono un Alto. Si chiude quando uno dei tre torna in soglia | griglia | — | 2026-11-12b |
| M3 | Medio | Nessuna regola di stallo | S1, P-8a | manca la regola | 2026-11-08 |
| M4 | **Bloccante** (era Medio: S6 approvata) | Nessun adattamento al rientro dopo una pausa lunga. **2026-11-15**: R9 rimandata a un secondo rilascio (decisione di Alessio); `evaluateProgression` ha già il parametro `rientro` (E5), il prodotto passa sempre `null` | S3 | `engine/rotation.ts`, manca la regola | 2026-11-08 |
| M5 | Medio | Nessuna seduta sotto i 40 minuti | G6 | `data/circuit.ts` | 2026-11-08 |
| M6 | Medio | Scarico e ritest arrivano per calendario, non per lavoro svolto | — | `engine/schedule.ts` | 2026-11-08 |
| M7 | Medio | Schede esercizio senza `equipment` e `frames`: ogni verifica immagine resta provvisoria | verifica immagini | `src/data/exercises.ts` | 2026-11-08 |
| M8 | Medio | Aderenza dal lunedì, non dalla data di inizio (latente) | M-ADER | `engine/metrics.ts` | 2026-11-09 |
| M11 | Medio | `hip-thrust-panca-bilaterale.videoQuery` dice `barbell` per un esercizio con kettlebell | G5 | `data/exercises.ts` | 2026-11-09b |
| M12 | Medio | Alternative dichiarate: 0 (erano 5). Aggrava B6 | S4, S5 | `data/circuit.ts` | 2026-11-09b |
| M13 | Medio | Regole di ordinamento violate dalla trascrizione (prese consecutive, balistici e cerniere) senza un predicato calcolabile: ora dichiarate in PROGRAM_RULES §2, decisione D-14 | V-GIUNZIONE | `training/PROGRAM_RULES.md` | 2026-11-09b |
| M14 | Medio | Settimana di scarico ignorata: Progressi confronta con il previsto pieno (braccia 34,5 invece di 23) e il riepilogo dice «Seduta chiusa prima della fine: 12 serie su 18» a chi ha fatto lo scarico intero | V-VOLUME, M-RIEP-SEDUTA | `ProgressScreen.tsx:93`, `SessionSummary.tsx` (`pianificate`) | 2026-11-12 |
| M15 | Medio | Pausa di blocco S1: «Due trazioni negative: sali con un salto o dal box» a chiunque, gradino 1 e senza sbarra compresi; non registrata; il «salto» non è nella scheda né nelle regole; accanto a «questa pausa serve tutta» | G1, G5 | `data/circuit.ts` `pauseTasks`, `engine/circuit.ts` | 2026-11-12 |
| M16 | Medio | Banner del ritest: «l'app ricalcola da che gradino riparti». Gli stati salvati non si ricalcolano mai (R1 «dopo ogni ritest» contro T1.7). **2026-11-21c**: con R9c il banner è falso per ogni esercizio fatto almeno una volta (B17) | S3, G4 | `HomeScreen.tsx:491`, `db/repository.ts:255` | 2026-11-12 |
| M20 | Medio | E4 all'esecuzione. **2026-11-20b**: D-21 (a) chiude la via principale (fine seduta in W5, 11, 17): aumenti eseguiti in scarico 1.349 → 119 su 12.192 scelte in salita. Restano (1) fine seduta in W4/10/16 con l'esercizio rifatto solo in scarico (sedute a più di 7 giorni) e (2) revisione W4 aperta in W5 (Q5.R1: domenica 5 aprile zavorra 0 → 2,5, prima seduta lunedì 6 in W6). Preesistente | `16` E4 all'esecuzione, Q5.R1 | PROGRESSION_RULES E4, `review.ts` E4 | 2026-11-20 |
| L1 | Basso | CSV: una nota che comincia con `=` viene esportata come formula | U3 | `db/csv.ts` | 2026-11-08 |
| L3 | Basso | La conferma dell'azzeramento accetta `cancella` minuscolo | — | `SettingsScreen.tsx` | 2026-11-09 |
| L4 | Basso | Senza data di inizio l'aderenza dichiara «0 sedute chiuse» | M-ADER | `engine/metrics.ts` | 2026-11-09 |
| L5 | Basso | `estimatedMinutes` sotto il piano: 38/36/35/39 contro 38:25/36:40/36:03/39:28 (con R2) | D1-D4 | `data/circuit.ts` | 2026-11-09b |
| L6 | Basso | Gradino 2 e esercizio con due nomi per la stessa cosa | — | `data/progressions.ts` | 2026-11-09b |
| L7 | Basso | Resto di B5: `SessionScreen:292` scrive `defaultLevel` sull'alternativa scelta. Latente: solo programma archiviato, finché il circuito ha 0 alternative | — | `ui/session/SessionScreen.tsx:292` | 2026-11-12 |
| L8 | Basso | 25 stazioni a tempo fisso si registrano da sole al valore prescritto: il diario non distingue il fatto dal prescritto | — | `GuidedSession.tsx` (`autoCompleta`) | 2026-11-12 |
| L9 | Basso | Hollow hold 30-45": il conto chiede 38" e chiama «chiusa prima del tempo minimo» una tenuta valida da 30-37" | — | `data/circuit.ts` `workSeconds: 38` | 2026-11-12 |
| L10 | Basso | T1.7 di R1 (riallineare gli stati salvati senza serie) non implementato. Latente | — | `db/repository.ts` | 2026-11-12 |
| L11 | Basso | Leva accettata, poi gradino abbassato a mano tornando alla seduta (VariantPicker): al salvataggio vince l'accettata, non l'ultima scelta. Flusso modellato, non eseguito | `08` D | `statesToSave`, `SessionScreen.tsx` | 2026-11-12b |
| L12 | Basso | Resto di A11 sui dati: le registrazioni salvate prima di `90b8b81` tengono l'etichetta della prima seduta; diario e Progressi la mostrano com'è, nessuna migrazione | `11` | `LogScreen.tsx:69`, `ProgressScreen.tsx:78` | 2026-11-12b |
| L13 | Basso | Riepilogo, anticipo sul piano: «lo leggerà la revisione della settimana». La revisione non legge l'orologio (nessun riferimento a durate in `review.ts`): legge ripetizioni e RIR | — | `SessionSummary.tsx:229` | 2026-11-12b |
| L14 | Basso | Salita di gradino con la zavorra conservata: `sali-di-livello` e leva `variant` tengono `loadKg` (trazioni al 3 con 5 kg → 4 con 5 kg). Latente: con R6 la zavorra si propone solo al 6, uno stato con kg sotto il 6 viene solo da kg scritti a mano | caso 7 v6 | `engine/review.ts`, `buildSuggestion` `variant` | 2026-11-15 |
| L16 | Basso | PROGRESS_REVIEW §6, base delle prove: «bulgarian `circuito-1/A2` 8-12»; la scheda dice **8-10**. Gli attesi tengono (13 sopra, 7 sotto), ma una fixture costruita su 11-12 sarebbe sbagliata | — | `training/PROGRESS_REVIEW.md` | 2026-11-15 |
| L17 | Basso | Kg col punto in un testo italiano. **2026-11-16**: revisione e manubrio ora con la virgola; restano «Passa da 5 kg a 7.5 kg» (fine seduta, zavorra), «volta scorsa» del player, scheda del circuito, Progressi | `14` F 10.4 | `progression.ts` 878, `GuidedSession.tsx` 363, `CircuitOverview.tsx` 87, `ProgressScreen.tsx` 71, 78 | 2026-11-15 |
| L27 | Basso | **La revisione chiede la risposta a una domanda che il riepilogo non ha fatto.** Con R14a `closedRange` è false e «Hai tenuto il tempo?» non compare: S resta col tempo null. Dove R14c non scatta (zavorra; gradino a bonus uguali) la revisione W4 dà `rispondi-sul-tempo` «…a fine seduta rispondi alla domanda sul tempo prescritto». 14.7 («la coppia vale») non si realizza. Prudente: si perde una settimana. Nuovo in B2 | `17` OSS-T | `progression.ts` R14a, `SessionSummary.tsx` 329 | 2026-11-20c |
| L28 | Basso | Testo R14a per il livello con v < B non in specifica («Oggi hai fatto il livello <v>, sotto quello di prima… Da qui comanda quello che hai scritto[: tempo e pausa tornano a quelli della scheda].»). Vero sullo stato salvato in 288/288 casi P14 e 2 righe F; da ratificare (training-designer) | `17` R14a.v<B, P14 | `decadenza.ts` | 2026-11-20c |
| L29 | Basso | R14a sul carico tace l'azzeramento di tempo e pausa (D-23) quando nella stessa seduta il gradino è stato abbassato a mano: 55 su 5.288 scelte tolte in P14 (es. hip thrust 2,5 → 5 al 3, seduta al 2: e0 p1 → e0 p0 senza una parola). Nessun numero sale | `17` P14 verità | `decadenza.ts` testi R14a | 2026-11-20c |
| L30 | Basso | **Col tetto, revisione e riepilogo discordano sul peso mai scritto o fuori elenco.** Revisione `alMassimo` «tetto» («non ci sono altre leve. Si resta così finché la seduta non torna sotto i 55 minuti…»), riepilogo R17c (3) («12,5 kg non è fra i tuoi manubri: scrivi nel player il peso…»). M22.P (iii) 113 nei mondi (78 mai scritto, 35 fuori elenco); F M22.6r. Nessun numero sale. §2 ambiguo: «(6) inherent fuori elenco». Nuovo nel rilascio C | `18` M22.6r, A2 | `review.ts` R10a (6) col tetto | 2026-11-20d |
| L31 | Basso | Residuo di B14: la calibrazione «Aggiungi 2,5 kg» resta sulle sedute archiviate (`kind: 'strength'`), senza cancelli; ci si arriva solo da `#/seduta/<id>` o riprendendo una bozza archiviata di oggi. Latente | `18` B14.2 | `loading.ts` `calibrazioneDaMostrare`, `router.ts` | 2026-11-20d |
| L32 | Basso | Con B14 nei circuiti sparisce anche «troppo pesante, togli 2,5 kg» (media ≤ 4), e nessuna regola lo sostituisce (M3). Per gli esercizi senza scala la revisione sotto il minimo dice «il range viene dal test, e va rifatto quello» anche sui range fissi dei manubri (testo preesistente). Nuovo nel rilascio C | `18` B14.2 | `SessionSummary.tsx`, `review.ts` `range-da-rifare` | 2026-11-20d |
| L33 | Basso | `dip-panche` «Dip tra due panche» mostra `bench-dips` (una panca) al gradino 1: la stessa foto nascosta su `dip-l1` col motivo «il dip è tra due panche». Domanda 4 del media lead | `19` | `exercise-art.ts` | 2026-11-21 |
| L34 | Basso | `single-leg-squat-l2` (Shrimp squat al gradino 2) mostra la foto del bulgaro con due manubri, tolta al bulgaro nel circuito. Domande 2 e 6 | `19` | `REPDB_STEP_ART` | 2026-11-21 |
| L35 | Basso | `media/LIBRARY.md` non segue `50793fd`: manca `rematore-inverso-trx` → `trx-row`, restano 9 mappature tolte e 4 file cancellati, le 17 voci senza figura non hanno stato (exercise-media-lead) | — | `media/LIBRARY.md` | 2026-11-21 |
| L36 | Basso | Figura assente per scelta: quadrato bianco vuoto nella panoramica (`CircuitOverview.tsx:68`), Card vuota nella scheda (`ExerciseScreen.tsx:66`); `hasExerciseArt` ignora la lista (oggi non usata) | — | UI | 2026-11-21 |
| L37 | Basso | Con T-28 la data di inizio, una volta scritta, non si sposta più se non con «Azzera tutto»: chi rifà un test prima del lunedì di partenza non può più scegliere «questa settimana / la prossima», e non c'è un modo di ricominciare il calendario senza cancellare lo storico. Direzione prudente; per training-designer (R22) | `20` | `OnboardingScreen.tsx`, `chiusuraDelGiro` | 2026-11-21b |
| L38 | Basso | Numerazione delle prove di R9c: `repository.test.ts` chiama 9.29, 9.30 e 9.31 tre prove diverse da quelle della specifica (9.29 = proprietà, 9.30 = test di sabato, 9.31 = ritest di rientro in settimana 6). La proprietà 9.29, chiesta come criterio di T-33, non c'è; l'ho misurata io (`22` B) | — | `src/db/repository.test.ts` | 2026-11-21c |
| L39 | Basso | `hasConfirmedState` dice «l'utente ha già confermato variante e livello»: da R9c lo stato lo scrive anche l'app. Nessun chiamante. L'effetto dichiarato nel commit `704dbfa` («il player non chiede più la conferma a ogni seduta») non esiste: la conferma è tolta da `64ecfbe` (`mustConfirm = false`). Unico uso reale di «salvato o no»: `SessionScreen.tsx:334` (alternativa scelta, L7), latente con 0 alternative | — | `db/repository.ts:325-333` | 2026-11-21c |

## Voci chiuse (ultime 10)

| ID | Grav. | Titolo | Chiusa il | Verifica di chiusura |
|---|---|---|---|---|
| B15 | Bloccante (preesistente in produzione) | R-16: il riepilogo di un ritest riscriveva la data di inizio (settimana 7 → 0), gli id `revisione-<W>:<slug>` si ripetevano e un verdetto nuovo, anche una discesa, spariva dietro una decisione vecchia | 2026-11-21b (`c8964ff`, T-28) | `20` nel browser: data invariata su `c8964ff`, 10-05 → 11-23 su `6cbb759`; `pendingVerdicts` su `6cbb759` nasconde «scendi» con l'id vecchio; nucleo 4m |
| M23 | Medio | Il monobraccio mostrava il disegno del gradino 6 | 2026-11-21b (`c8964ff`) | `19`: nessuna figura a livello nullo e 5, nient'altro cambiato |
| M24 | Medio | Shrimp squat disegnato come skater | 2026-11-21b (`c8964ff`) | `19`: nessuna figura a livello nullo e 5 |
| B14 | Bloccante | Riquadro di calibrazione «Aggiungi 2,5 kg» senza cancelli | 2026-11-20d (`f7f945d`) | `18` B14.1 (kind delle sedute, sorgente di `SessionSummary`); simulazioni: 0 su 61.410 voci pesate (51.443 su `fb560e7`). Residui L31, L32 |
| M22 | Medio | Revisione e riepilogo si contraddicono sul circuito 4 oltre il tetto | 2026-11-20d (`17ea244`) | `18` M22.0-M22.5 sulla durata vera; M22.P 0 su 1.801 (C3, C3R; 38 su `fb560e7`); revisione = riferimento in due giri su 5.440 (82 diverse in produzione); M22.7 0 su 218.147. Residuo L30 |
| L25 | Basso | σ′ senza la variante, la sincronizzazione e le decadenze | 2026-11-20d (`4142059`) | `18` L25.1-L25.5; σ′ = §3 su 63.343 leve (154 in produzione); L25.P1 0 su 8.129 passi (12 in produzione) |
| L26 | Basso | Nota del circuito 4 senza il 59, deviazione non dichiarata | 2026-11-20d (`d8c18ce`) | `18` L26.1-L26.4: note = `f63c9f1` + `DEVIAZIONI_NOTA` (git show), 59:07 costruito, 59:15 teorico. Contro la scheda originale: NON COPERTO (L26.2s) |
| M18 | Medio | Manubrio accettato e non scritto: tempo e pausa persi senza cambiare peso | 2026-11-20c (`0d85597`) | `17` 14.1, 14.6, 14.9, 14.11, D19.18, Q5 con la chiusura dell'app `{12, +2, +2}`; M18 nelle simulazioni 0 (7 su `e30cdc6`); smoke eseguito da me: record `lapsed` e stato `[null,1,1,8]` dall'emulatore |
| A19 | Alto | Durata in Home senza gli stati | 2026-11-20c | `npm run smoke` eseguito da me su `0d85597`: «A19: Seduta 2 in Home 38′ → 41′ con +2″/+2″; panoramica 41′» (due `check`) |
| L22 | Basso | Scrittura non atomica alla chiusura | 2026-11-20c | stato accettato e `lapsed` solo con `putTogether` (tutte e due le schermate), `statesToSave` esclude le accettate; `17` 14.14 (MemoryStore che rifiuta: né stato né record), smoke. Ramo Firestore non eseguito |

## Verifiche tecniche delle immagini (ultime 10)

| Data | Immagine | Esito | Punti con PROBLEMA | Dettaglio |
|---|---|---|---|---|
| 2026-11-21 | `exercises-repdb/trx-row` su `rematore-inverso-trx` | **NON COPERTO** (termine 5: non guardata); fonte, gradino, file e ordine verificati | — | `IMAGES.md` |
| 2026-11-21 | `exercises/rematore-trx-monobraccio.svg` | **SCARTATA** (= `horizontal-pull-l6`, piedi rialzati; M23) | 1 · 2 | `IMAGES.md` |
| 2026-11-21 | `exercises/bulgarian-split-squat.svg` | attrezzo e archetipo giusti, **non inoltrabile** (manca la checklist del media lead, M7, domanda 2) | — | `IMAGES.md` |
| 2026-11-21 | `exercises/dip-panche-piedi-rialzati.svg` | due panche giuste, **non inoltrabile** (manca la checklist del media lead, M7) | — | `IMAGES.md` |
| 2026-11-12 | `steps/hip-thrust-l3.svg` | nessun problema, non inoltrabile; l'app mostra la foto RepDB | — | `IMAGES.md` |
| 2026-11-12 | `steps/hip-thrust-l6.svg` | nessun problema, non inoltrabile | — (nota sul punto 5) | `IMAGES.md` |
| 2026-11-12 | `exercises/circonduzioni-spalle.svg` | **SCARTATA** | 3 anatomia | `IMAGES.md` |
| 2026-11-12 | `exercises/step-rapidi-box.svg` | verificata con riserva, non inoltrabile | 8 (riserva) | `IMAGES.md` |
| 2026-11-12 | `exercises/pull-over-trx.svg` | **SCARTATA** | 1 · 3 · 4 · 5 | `IMAGES.md` |
| 2026-11-12 | `exercises/estensione-tricipiti-sopra-testa.svg` | **SCARTATA** | 1 · 3 · 4 | `IMAGES.md` |

## Ricalcoli indipendenti eseguiti (ultimi 10)

| Metrica | Esito | Script |
|---|---|---|
| R9c nel browser (build, emulatori, Chromium), `704dbfa` | chiusura dal player ⇒ push-up `[1,0,0,0]`; ritest push-up 16 ⇒ resta «Push-up su rialzo»; «Archivia» ⇒ nessuno stato, ritest ⇒ «Bulgarian split squat» (1 → 2). Bulgaro scritto a `[2,0,0,0]` dopo il ritest da uno scrittore non identificato (solo `fissaStatiMancanti` scrive così: domanda aperta). Migrazione nel ramo Firestore: NON COPERTA | `23-r9c-browser.mjs` |
| R9c e domanda 4 sul codice, `704dbfa` contro `c8964ff` | A: `scendi-di-livello` 6 → 5 con 5 kg (S5), su tutti e due. B (9.29, 1500 storie, 4664 test): 0 salite e 0 discese con la chiusura dell'app; 1047 e 329 con quella di prima. C: ritest M=1, 0 su 7 scendono (7 su 7 prima) | `22-r9c.mts` |
| Nucleo v13 (4l rifatto, 4n, 2d) | `704dbfa`: caso 4 = 4h + 4n, caso 2 = 2c + 2d 14 (positivo 7/7); `c8964ff`: 4h + 4l + 4n, 2d 7 | `safety-core.mts` v13 |
| R-16 e T-28 nel browser (build, emulatori, Chromium), `c8964ff` contro `6cbb759` | `c8964ff`: ritest senza «Quando parte», «Salva e torna alla Home» attivo, data 10-05 invariata; dopo «Azzera tutto» data nulla e primo giro come prima. `6cbb759`: data 10-05 → 11-23 | `20-ritest-r16.mjs` |
| R-17 (9.26) col repository vero, `c8964ff` e `6cbb759` | mai salvato 1 → 2; salvato fermo; 7 esercizi su 39 esposti | `21-r17.mts` |
| Figura visibile per esercizio × gradino (264 posizioni), `50793fd` contro `96a90c2` | 35 cambiate: 27 → nessuna, 6 → proposta, 2 sbagliata → sbagliata (M23); 0 orfane, 0 collisioni; positivo: in produzione le 35 mostrano le figure dell'audit | `19-figure.mts` |
| Rilascio C dal testo della specifica 2026-11-21 §2-§4, commit `f7f945d` | F 219/222 (M22.6r = L30; NC b.8, L26.2s); A 0; A2 144 = L30; M22.7 0 su 218.147; C3/C3R come l'app: σ′ = §3 su 63.343, L25.P1 0 su 8.129, M22.P 0 su 1.801, R-14 0 su 137; B14 0 su 61.410. Su `fb560e7`: F 13, σ′ 154, L25.P1 12, M22.P 38, B14 51.443 | `18-c.mts` |
| Nucleo v11 (4k, R-14: revisione con la durata) | `f7f945d`: solo S9; `fb560e7`: S9 + 4k non misura (durata assente) | `safety-core.mts` v11 |
| B2 dal testo delle specifiche 11-18 (R14, rev. 11-20) e 11-21 §1 (D-19 b), commit `0d85597` | F 197/198 (R19.R = M22); A 0 su 259.782; B 0; D19.P 0 su 437; simulazioni con la chiusura dell'app: M18 0, predicato R14 = testo, revisioni = riferimento su 18.430; P14 5.288 tolte, 0 differenze, 55 testi muti (L29); sync = testo su 20.000; B14 37.196. Su `e30cdc6`: F 37, A 302, D19.P 582, M18 7, sync 200 | `17-b2.mts` |
| Nucleo v10 (4j, R-7) | `0d85597`: solo S9; `e30cdc6`: S9 + 4j ×2 (campo e stato a 14,5 con la volta scorsa a 0) | `safety-core.mts` v10 |
