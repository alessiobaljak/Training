# Misure

Una riga per misura. Il set di atleti e gli scenari sono deterministici: a
parità di regole la misura si ripete identica. Se un numero si muove, è una
regola che si è mossa.

## Misure

| Data | Regole / catalogo | Set | C1 Sic. | C2 Rim. | C3 Fed. | C4 Coer. | C5 Pers. | C6 Concr. | C7 Progr. | C8 Dur. | Bloc. | Alti | Medi | Bassi | Nucleo | Rapporto |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-21e | `644bd8c` (HEAD del ramo, copie `git archive`; sopra `4d06a4b`: `7863e31` R9c, `cc95fac` R9c completato, `7b28b13` B18, `3b548e4` figura, `93cf066` R9b, `644bd8c` smoke); R9b, R9c della specifica 2026-11-21 §3; catalogo invariato, una figura tolta | PERSONAS v1, SCENARIOS v1 | **S1/S3 (B16), S7 dopo un test (B17), S5 (B18) rispettate**; S7 su Z1 no (B9) | = | proposta R9b coi numeri dell'atleta | = | = | = | = | 100% (`01` identico) | **4** + 4ᵖ (B16, B17, B18 chiusi) | 2 | 12 | 31 (−L38; +L41, L42, L43) | **3 PASS** / 3 FALLITI / 2 NON COPERTI (v14: caso 4 PASS; 2 = 2c) | `quality/reports/2026-11-21-quality-644bd8c.md` |
| 2026-11-21d | `4d06a4b` (HEAD staccato del worktree `t2930`, incrementale su `85d1dd8` = `c8964ff` per `src/`; **senza R9c**): T-29 R20 (B10, transizione di 15″ fra i giri della finitura) e T-30 R21 (B9, Z1 con il tempo vero, `recordActual`); programmi 2.4, consigli 4.2 PROPOSTA; catalogo invariato | PERSONAS v1, SCENARIOS v1 | S9 rispettata | = | Z1 vera (L8: 21) | = | = | = | = | 100% (+15 s; massimi 46:40 · 51:58 · 49:30; estremo 59:15) | **7** + 4ᵖ (B10 chiuso, B9 ridotto; B17 solo via «stato salvato») | 2 | 12 | 27 (+L40; L38, L39 sono di R9c) | 2 PASS / 4 FALLITI / 2 NON COPERTI (v13: 4 = 4l ×2 + 4n, **4h superato**; 2 = 2c + 2d 7) | `quality/reports/2026-11-21-quality-4d06a4b.md` |
| 2026-11-21c | `704dbfa` (head locale non pushato, incrementale su `c8964ff`): R9c (B16) — `statiDaFissare` alla chiusura dei due gestori, `fissaStatiMancanti` all'accesso; regole delle sedute e catalogo invariati | PERSONAS v1, SCENARIOS v1 | = | = | = | = | = | = | = | = (non rimisurati: gli scenari chiamano il motore, non la chiusura; A19 ricalcolato) | **8** + 4ᵖ (B16 ridotto, **B17 esteso**, B18 nuovo preesistente) | 2 | 12 | 28 | 2 PASS / 4 FALLITI / 2 NON COPERTI (**v13**: 4 = 4h + 4n; 2 = 2c + 2d) | `quality/reports/2026-11-21-quality-704dbfa.md` |
| 2026-11-21b | `c8964ff` (head locale non pushato, incrementale su `96a90c2` = `6cbb759` per `src/`): T-28 (R-16, calendario) e M23/M24 nella lista delle figure; regole delle sedute invariate | PERSONAS v1, SCENARIOS v1 | = | = | = | = | = | = | = | = (nessuna funzione usata dagli scenari cambiata: `schedule.ts` solo un'aggiunta) | **6** + 4ᵖ (B16 nuovo, preesistente) | 2 | 12 | 26 | 2 PASS / 4 FALLITI / 2 NON COPERTI (**v12**: caso 4 = 4h + 4l) | `quality/reports/2026-11-21-quality-c8964ff.md` |
| 2026-11-21 | `50793fd` (head locale non pushato, incrementale su `96a90c2` in produzione): solo figure (`exercise-art.ts`, `ExerciseArt.tsx`, 4 webp tolti), regole e catalogo invariati · verifica tecnica contro `media/reports/2026-11-21-media.md` | PERSONAS v1, SCENARIOS v1 | = | = | = | = | = | = | = | = (C1-C8 non rimisurati: nessuna regola cambiata) | **5** + 4ᵖ | 2 | 14 | 25 | 2 PASS / 4 FALLITI / 2 NON COPERTI (v11; caso 6: 261 file, 0 approvati) | `quality/reports/2026-11-21-quality-50793fd.md` |
| 2026-11-20d | `f7f945d` (head locale non pushato, incrementale su `fb560e7` in produzione): rilascio C (T-27 L26, T-26 L25, T-25 M22, B14), progressione 4.1, consigli 4.1, programmi 2.3 rev. 11-21, limiti 1.4 rev. 11-21 · catalogo 72 · circuito 52 blocchi · griglia v3 | PERSONAS v1, SCENARIOS v1 | 29% (2/7) | 0% (0/4)ᵖ | **67% (2/3)** (M22, B14 chiusi) | 71% (5/7); v4 **75%** | 67% (2/3) | 75% (3/4) | 86% (6/7) | 100% (4/4); D5 100% con la nota nuova | **5** + 4ᵖ | 2 | 12 | 21 | 2 PASS / 4 FALLITI / 2 NON COPERTI (**v11**) | `quality/reports/2026-11-20-quality-f7f945d.md` |
| 2026-11-20c | `0d85597` (head locale non pushato, incrementale su `e30cdc6` in produzione): rilascio B2 (T-15 R14a/c/e + `lapsed`, T-16 rev. R14d, T-24 D-19 b; `d5f72e2` solo CSS), progressione 4.1, consigli 4.1, limiti 1.4 rev. 11-21 · catalogo 72 · circuito 52 blocchi · griglia v3 | PERSONAS v1, SCENARIOS v1 | 29% (2/7) | 0% (0/4)ᵖ | 33% (1/3) (A19 chiuso; M22, B14) | 71% (5/7); v4 63% | 67% (2/3) | 75% (3/4) | 86% (6/7) | 100% (4/4) (D5 80%) | **6** + 4ᵖ (B14 nuovo, preesistente) | 2 | 13 | 20 | 2 PASS / 4 FALLITI / 2 NON COPERTI (**v10**, caso 4 solo 4h) | `quality/reports/2026-11-20-quality-0d85597.md` |
| 2026-11-20b | `221b2e8` (head locale non pushato, incrementale su `59daf79` = `0f3f191` in produzione): rilascio B1 (L23, L24, M21, 17.2, D-21 a, D-22 a / R19, D-23 a), progressione 4.0 rev., consigli 4.0 rev., progressi 3.1 rev., limiti 1.4 rev. · catalogo 72 · circuito 52 blocchi · griglia v3 | PERSONAS v1, SCENARIOS v1 | 29% (2/7) | 0% (0/4)ᵖ | 33% (1/3) (A19 non eseguito, M22) | 71% (5/7) | 67% (2/3) | 75% (3/4) | 86% (6/7) | 100% (4/4) (D5 proposta: 80%, circuito-4 fino a 59′ con la variante) | **5** + 4ᵖ | 3 | 14 | 19 | 2 PASS / 4 FALLITI / 2 NON COPERTI (**v9**, caso 4 solo 4h) | `quality/reports/2026-11-20-quality-221b2e8.md` |
| 2026-11-20 | `4edf751` (head locale non pushato, incrementale su `001de30` in produzione): rilascio A di R14-R18 (R18, R16, R17, R15, R14b), progressione 4.0, progressi 3.1, consigli 4.0, programmi 2.2; D-20 (a, b) · catalogo 72 · circuito 52 blocchi · griglia v3 | PERSONAS v1, SCENARIOS v1 | 29% (2/7) | 0% (0/4)ᵖ | 33% (1/3) (A18 chiuso, A19 aperto) | 71% (5/7) | 67% (2/3) | 75% (3/4) | 86% (6/7) | 100% (4/4) (con D5 proposta: 80%) | **5** + 4ᵖ (B13 aperto e chiuso) | 3 | 15 | 19 | 2 PASS / 4 FALLITI / 2 NON COPERTI (v8, caso 4 solo 4h) | `quality/reports/2026-11-20-quality.md` |
| 2026-11-16 | `cf7588a` (head locale non pushato, incrementale su `a747e09` in produzione): R10-R13, progressione 3.0, progressi 3.0, consigli 3.0; D-4 (a), D-19 sì · catalogo 72 · circuito 52 blocchi · griglia v3, composizione v2 confermata | PERSONAS v1, SCENARIOS v1 | 29% (2/7) | 0% (0/4)ᵖ | **33% (1/3)** rimisurato (A18) | 71% (5/7) | 67% (2/3) | 75% (3/4) | 86% (6/7) | 100% (4/4) | **5** + 4ᵖ (B12 aperto e chiuso) | 3 | 12 | 21 | 2 PASS / 4 FALLITI / 2 NON COPERTI (v7, caso 4 solo 4h) | `quality/reports/2026-11-16-quality.md` |

Soglie **approvate da Alessio il 2026-11-12** (GRID.md v3): C1 100 · C2 100 ·
C3 100 · C4 ≥90 · C5 ≥80 · C6 ≥90 · C7 100 · C8 100; GO solo con Bloccanti = 0
e Alti = 0 su L. ᵖ = blocca solo il rilascio pubblico (B1-B4, decisione del
2026-11-12; C2 è fatto solo di loro).

Misura del 2026-11-21e (commit `644bd8c`, R9c completato, R9b, B18, figura): **GO per il push** (nessun
Bloccante o Alto introdotto o peggiorato; **B16, B17, B18 chiusi**); app ancora NO-GO (B6 B8 B9 M4 + 4ᵖ).
Nucleo **v14** 3 · 3 · 2: caso 4 PASS (4l a-c, 4n, 4o), 2d 42/42 con proposta; v13 sullo stesso commit 2 · 4 · 2
per costruzione (4n «gestore cambiato», 2d «va esteso»). `25` (nuovo): 9.29 su 1.200 storie, 4.792 ritest,
1.044 «Archivia», 555 migrazioni, 139 «Applica»: 0 salite, 0 discese da sole, 0 proposte diverse da R9b, 0
stati fissati diversi dal gradino della seduta (su `7863e31` B4 149, B3 654). 9.19-9.25 conformi; R7 dopo
«Applica» a 14 giorni, R13 non conta la discesa. `18` col riferimento B18: 0 differenze (146 su `4d06a4b`, tutte
zavorra tolta). `7863e31` da solo: NO-GO (4l c fissa 2, 4n, 2d 28). verify (965) da me. Browser NON COPERTO.

Misura del 2026-11-21d (commit `4d06a4b`, R20 e R21, ramo senza R9c): **GO per il push** (nessun
Bloccante o Alto introdotto o peggiorato); app ancora NO-GO. **B10 chiuso**: nucleo 4h superato (7
giunzioni, tutte 15″); `24` (nuovo) 20.5 0 su 4.392 piani (3.660 sulla radice di prima). **B9
ridotto**: nessun 30 «da solo», bersaglio «o finché la presa regge»; resta il gradino 2 a chi regge
8″ (R1 riga 8 darebbe 1) ⇒ **D-Q3**. Deviazione dichiarata (Z1 parte al via) accettata. `18` sulle
due radici: 217 OK, stessi 3 non OK, numeri +15″ (L30 un po' più frequente). Browser NON COPERTO
(20.8, 21.2-21.7, 21.12), 20.4 rientro e metà di 21.10 NON COPERTI. Misure su copie `git archive`
(md5 dell'albero = oggetti git), mai dal tree principale. verify (939) da me.

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
| B9 | Bloccante (**ridotto** il 2026-11-21d, `4d06a4b`) | Decompressione Z1: dead hang al gradino 2 a chi ha misurato meno di 30" **allo stesso gradino** (P1: 8"), tutte e 4 le sedute. R1 riga 2 esclude i blocchi fuori revisione. **Dal `4d06a4b` (R21)**: bersaglio «30″ o finché la presa regge», «Ho mollato» e «Hai tenuto fino al segnale?», tempo vero nel diario, nota per scendere: la dose e il 30 «da solo» sono chiusi. **Resta il gradino**: con 8" R1 riga 8 (soglia 36") darebbe il gradino 1 («piedi che sfiorano terra»); «finché regge» per chi regge 8" è una tenuta quasi a cedimento a fine seduta, cioè quello che R21 stessa evita sopra i 30". Nucleo 2c FALLITO (il dato resta 30-30). **D-Q3** | G7, caso 2 (2c) | `engine/progression.ts` riga 2 di R1, `data/circuit.ts` Z1 | 2026-11-12 |
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
| M16 | Medio | Banner del ritest: «l'app ricalcola da che gradino riparti». Gli stati salvati non si ricalcolano mai (R1 «dopo ogni ritest» contro T1.7). **2026-11-21c**: con R9c il banner è falso per ogni esercizio fatto almeno una volta (B17). **2026-11-21e** (`644bd8c`): invariato; con R9b l'app propone le discese ma la Home della settimana 6 e `RETEST_BANNER` promettono ancora «ricalcola»; i testi di T-33 non ci sono | S3, G4 | `HomeScreen.tsx:491`, `db/repository.ts:255` | 2026-11-12 |
| M20 | Medio | E4 all'esecuzione. **2026-11-20b**: D-21 (a) chiude la via principale (fine seduta in W5, 11, 17): aumenti eseguiti in scarico 1.349 → 119 su 12.192 scelte in salita. Restano (1) fine seduta in W4/10/16 con l'esercizio rifatto solo in scarico (sedute a più di 7 giorni) e (2) revisione W4 aperta in W5 (Q5.R1: domenica 5 aprile zavorra 0 → 2,5, prima seduta lunedì 6 in W6). Preesistente | `16` E4 all'esecuzione, Q5.R1 | PROGRESSION_RULES E4, `review.ts` E4 | 2026-11-20 |
| L1 | Basso | CSV: una nota che comincia con `=` viene esportata come formula | U3 | `db/csv.ts` | 2026-11-08 |
| L3 | Basso | La conferma dell'azzeramento accetta `cancella` minuscolo | — | `SettingsScreen.tsx` | 2026-11-09 |
| L4 | Basso | Senza data di inizio l'aderenza dichiara «0 sedute chiuse» | M-ADER | `engine/metrics.ts` | 2026-11-09 |
| L5 | Basso | `estimatedMinutes` sotto il piano: 38/36/35/39 contro 38:40/36:55/36:18/39:43 (con R2 e, dal `4d06a4b`, R20). Nessun lettore in UI o motore: latente | D1-D4 | `data/circuit.ts` | 2026-11-09b |
| L6 | Basso | Gradino 2 e esercizio con due nomi per la stessa cosa | — | `data/progressions.ts` | 2026-11-09b |
| L7 | Basso | Resto di B5: `SessionScreen:292` scrive `defaultLevel` sull'alternativa scelta. Latente: solo programma archiviato, finché il circuito ha 0 alternative | — | `ui/session/SessionScreen.tsx:292` | 2026-11-12 |
| L8 | Basso | 21 stazioni a tempo fisso (25 fino a `4d06a4b`: Z1 ora scrive il tempo vero, R21) si registrano da sole al valore prescritto: il diario non distingue il fatto dal prescritto | — | `GuidedSession.tsx` (`autoCompleta`) | 2026-11-12 |
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
| L39 | Basso (ridotto il 2026-11-21e) | `hasConfirmedState`: la documentazione dice «l'utente ha già confermato variante e livello… Il player usa questo dato per fermarsi prima della prima serie»; da R9c lo stato lo scrive anche l'app, e nessuno lo chiama. Il messaggio di `704dbfa` è corretto in `cc95fac`; la documentazione no | — | `db/repository.ts` (`hasConfirmedState`) | 2026-11-21c |
| L40 | Basso | Panoramica in settimana di scarico (6, 12, 18): la finitura mostra «2 giri» e, da R20, «tra le stazioni e fra i giri 15″»; il piano ha un giro solo. `CircuitOverview` legge la scheda, non la settimana. Preesistente per i giri, esteso nel testo da `64180fa` | — | `CircuitOverview.tsx` (`getAnySession`, badge della finitura) | 2026-11-21d |
| L41 | Basso | Schermata di un ritest con **0** scritto: «Cosa dice il ritest» mostra «Scrivi il risultato e qui compare il gradino da cui parti.» invece della riga R9b («0 · ti propongo …»), per la condizione `value > 0`; il riepilogo la mostra. Letto dal sorgente, non eseguito | — | `OnboardingScreen.tsx` (blocco `partenza`) | 2026-11-21e |
| L42 | Basso | Gradino cambiato a mano nel `VariantPicker` di `SessionScreen`: `confirmExercise({ ...exerciseState, level })` tiene zavorra, tempo e pausa (S5 e D-23 sulla via a mano). Latente: `SessionScreen` serve solo le sedute fuori dai circuiti. Letto dal sorgente, non eseguito | — | `ui/session/SessionScreen.tsx` (`onChange` del `VariantPicker`) | 2026-11-21e |
| L43 | Basso | B18 è una regola di progressione nuova (`scendi-di-livello` toglie la zavorra, anche a chi l'ha scritta a mano sotto il 6: push-up al 2 con 10 kg → 1 a 0 kg) scritta senza la specifica di training-designer; PROGRESSION_RULES non la dice. La direzione è quella di S5 e di R9b | `18` (146 casi) | `training/PROGRESSION_RULES.md`, `engine/review.ts` | 2026-11-21e |

## Voci chiuse (ultime 10)

| ID | Grav. | Titolo | Chiusa il | Verifica di chiusura |
|---|---|---|---|---|
| B16 | Bloccante | R-17: un test alzava il gradino di uno stato mai salvato (chiusura, storia, «Archivia», migrazione in ritardo) | 2026-11-21e (`644bd8c`, non ancora rilasciato) | nucleo v14 4l a-c e 4n i-ii superati (positivi 1 → 2; `7863e31` 4l c fissa 2); `25` B: 0 salite su 4.792 ritest, B4 0 su 1.044 «Archivia» e 555 migrazioni (149 su `7863e31`). Browser NON COPERTO su `644bd8c` («Archivia», ramo Firestore: ricetta nel rapporto) |
| B17 | Bloccante | S7 dopo un test peggiore: nessuna discesa e nessuna proposta | 2026-11-21e (`644bd8c`, R9b, non ancora rilasciato) | nucleo v14 2d: 42/42 proposte L → giù(Lt) o primo, 0 kg, «Applica» e «Lascia com'è», nessuna alla soglia; `25` B3 0 su 368 proposte attese (654 su `7863e31`); 9.19-9.25 conformi. Scheda in Home e «Applica» nel browser: smoke della sessione principale, per me NON COPERTO |
| B18 | Bloccante | `scendi-di-livello` teneva la zavorra sotto l'ultimo gradino (S5) | 2026-11-21e (`7b28b13`, non ancora rilasciato) | nucleo v14 4o (6 → 5 a 0 kg col testo; 0 kg senza testo; R9b 9.20); `18` 146 discese con zavorra, tutte a 0 kg (0 differenze col riferimento B18; 146 su `4d06a4b`); 0 esercizi `inherent` con scala. Residui L42, L43 |
| L38 | Basso | Numerazione delle prove di R9c | 2026-11-21e (`cc95fac`) | 9.29 è la proprietà; 9.30 e 9.31 libere per la specifica; prove proprie 9.32-9.36 |
| B10 | Bloccante | S9 violata: `circuito-4` F4 plank tocco spalla → F1 corda slam del giro 2 senza nessun passo (finitura 15" fra stazioni, 0 fra i giri) | 2026-11-21d (`4d06a4b`, non ancora rilasciato) | nucleo v13 4h superato (7 giunzioni tronco → balistico, tutte 15″; 0″ su `85d1dd8`); `24` 20.5: 0 eccezioni su 4.392 piani (settimane 1-18 × 61 stati), 3.660 sulla radice di prima; 20.2/20.3 testo e posizione dei 3.660 passi; durate +15 s (20.1, 20.7). Panoramica nel browser NON COPERTA (20.8) |
| B15 | Bloccante (preesistente in produzione) | R-16: il riepilogo di un ritest riscriveva la data di inizio (settimana 7 → 0), gli id `revisione-<W>:<slug>` si ripetevano e un verdetto nuovo, anche una discesa, spariva dietro una decisione vecchia | 2026-11-21b (`c8964ff`, T-28) | `20` nel browser: data invariata su `c8964ff`, 10-05 → 11-23 su `6cbb759`; `pendingVerdicts` su `6cbb759` nasconde «scendi» con l'id vecchio; nucleo 4m |
| M23 | Medio | Il monobraccio mostrava il disegno del gradino 6 | 2026-11-21b (`c8964ff`) | `19`: nessuna figura a livello nullo e 5, nient'altro cambiato |
| M24 | Medio | Shrimp squat disegnato come skater | 2026-11-21b (`c8964ff`) | `19`: nessuna figura a livello nullo e 5 |
| B14 | Bloccante | Riquadro di calibrazione «Aggiungi 2,5 kg» senza cancelli | 2026-11-20d (`f7f945d`) | `18` B14.1 (kind delle sedute, sorgente di `SessionSummary`); simulazioni: 0 su 61.410 voci pesate (51.443 su `fb560e7`). Residui L31, L32 |
| M22 | Medio | Revisione e riepilogo si contraddicono sul circuito 4 oltre il tetto | 2026-11-20d (`17ea244`) | `18` M22.0-M22.5 sulla durata vera; M22.P 0 su 1.801 (C3, C3R; 38 su `fb560e7`); revisione = riferimento in due giri su 5.440 (82 diverse in produzione); M22.7 0 su 218.147. Residuo L30 |

## Verifiche tecniche delle immagini (ultime 10)

| Data | Immagine | Esito | Punti con PROBLEMA | Dettaglio |
|---|---|---|---|---|
| 2026-11-21e | `exercises-repdb/rings-inverted-row-start/peak` su `rematore-inverso-trx-piedi-rialzati` (tolte in `3b548e4`) | **SCARTATA** (archetipo: anelli invece di TRX; piedi a terra invece che rialzati, dal media lead). Non guardata (termine 5): fonte e motivo da `exercise-art.ts` e media 11-08. Rimozione verificata | 1 attrezzo · 2 archetipo | `IMAGES.md` |
| 2026-11-21 | `exercises-repdb/trx-row` su `rematore-inverso-trx` | **NON COPERTO** (termine 5: non guardata); fonte, gradino, file e ordine verificati | — | `IMAGES.md` |
| 2026-11-21 | `exercises/rematore-trx-monobraccio.svg` | **SCARTATA** (= `horizontal-pull-l6`, piedi rialzati; M23) | 1 · 2 | `IMAGES.md` |
| 2026-11-21 | `exercises/bulgarian-split-squat.svg` | attrezzo e archetipo giusti, **non inoltrabile** (manca la checklist del media lead, M7, domanda 2) | — | `IMAGES.md` |
| 2026-11-21 | `exercises/dip-panche-piedi-rialzati.svg` | due panche giuste, **non inoltrabile** (manca la checklist del media lead, M7) | — | `IMAGES.md` |
| 2026-11-12 | `steps/hip-thrust-l3.svg` | nessun problema, non inoltrabile; l'app mostra la foto RepDB | — | `IMAGES.md` |
| 2026-11-12 | `steps/hip-thrust-l6.svg` | nessun problema, non inoltrabile | — (nota sul punto 5) | `IMAGES.md` |
| 2026-11-12 | `exercises/circonduzioni-spalle.svg` | **SCARTATA** | 3 anatomia | `IMAGES.md` |
| 2026-11-12 | `exercises/step-rapidi-box.svg` | verificata con riserva, non inoltrabile | 8 (riserva) | `IMAGES.md` |
| 2026-11-12 | `exercises/pull-over-trx.svg` | **SCARTATA** | 1 · 3 · 4 · 5 | `IMAGES.md` |

## Ricalcoli indipendenti eseguiti (ultimi 10)

| Metrica | Esito | Script |
|---|---|---|
| R9b, R9c completato e B18 dal testo della specifica 2026-11-21 §3, `644bd8c` contro `cc95fac` e `7863e31` | D2 `rigaOtto` = R1 riga 8 riscritta sui 7 esercizi; 9.19-9.25 conformi; 9.29 (1.200 storie, 4.792 ritest, 1.044 «Archivia», 555 migrazioni): B1-B4 0 (su `7863e31` B3 654, B4 149; su `cc95fac` B3 586); R7 dopo «Applica» a 14 giorni, R13 non conta la discesa; 0 `inherent` con scala | `25-r9b-r9c-b18.mts` |
| Nucleo v14 (2d alla proposta, 4l c, 4n nuovo, 4o) su `644bd8c`, `cc95fac`, `7863e31`, `4d06a4b`; `18` col riferimento B18, `01`, `13`, `04` | 3 · 3 · 2 su `644bd8c` (caso 4 PASS), 2 · 4 · 2 sugli altri; `18` 0 differenze (146 su `4d06a4b`); `01`, `13`, `04` identici | `safety-core.mts` v14, `18-c.mts` |
| R20 e R21 dal testo della specifica 2026-11-21 §1-§2, `4d06a4b` contro `85d1dd8` e `64180fa` | 24 OK: durate 2.320 · 2.215 · 2.178 · 2.383; 3.660 passi inseriti, solo dove R20 li vuole; 20.5 0 su 4.392 piani (3.660 prima); massimi 46:40 · 51:58 · 49:30, estremo 59:15; R19 +15 su 400 σ; Z1 non automatica in 72/72 (prima 72 automatiche); `tenutaMollata` 0 su 3.501, `tenutaDichiarata` mai fuori 1-29; revisione e volume identici con Z1 a 8/12/30. Positivo (radice di prima come nuova): DIVERSO dove atteso | `24-r20-r21.mts` |
| Nucleo v13 su `4d06a4b` e `85d1dd8` (copie `git archive`, v13 = `69d8c32`); `18` e `01` sulle due radici | nucleo 2 · 4 · 2 su tutte e due; caso 4: 4l ×2 + 4n su `4d06a4b`, 4h + 4l ×2 + 4n su `85d1dd8`. `18`: 217 OK e gli stessi 3 non OK, numeri +15″. `01`: piano +0,25′, volume uguale | `safety-core.mts` v13, `18-c.mts`, `01-durata-volume.mts` |
| R9c nel browser (build, emulatori, Chromium), `704dbfa` | chiusura dal player ⇒ push-up `[1,0,0,0]`; ritest push-up 16 ⇒ resta «Push-up su rialzo»; «Archivia» ⇒ nessuno stato, ritest ⇒ «Bulgarian split squat» (1 → 2). Bulgaro scritto a `[2,0,0,0]` dopo il ritest da uno scrittore non identificato (solo `fissaStatiMancanti` scrive così: domanda aperta). Migrazione nel ramo Firestore: NON COPERTA | `23-r9c-browser.mjs` |
| R9c e domanda 4 sul codice, `704dbfa` contro `c8964ff` | A: `scendi-di-livello` 6 → 5 con 5 kg (S5), su tutti e due. B (9.29, 1500 storie, 4664 test): 0 salite e 0 discese con la chiusura dell'app; 1047 e 329 con quella di prima. C: ritest M=1, 0 su 7 scendono (7 su 7 prima) | `22-r9c.mts` |
| Nucleo v13 (4l rifatto, 4n, 2d) | `704dbfa`: caso 4 = 4h + 4n, caso 2 = 2c + 2d 14 (positivo 7/7); `c8964ff`: 4h + 4l + 4n, 2d 7 | `safety-core.mts` v13 |
| R-16 e T-28 nel browser (build, emulatori, Chromium), `c8964ff` contro `6cbb759` | `c8964ff`: ritest senza «Quando parte», «Salva e torna alla Home» attivo, data 10-05 invariata; dopo «Azzera tutto» data nulla e primo giro come prima. `6cbb759`: data 10-05 → 11-23 | `20-ritest-r16.mjs` |
| R-17 (9.26) col repository vero, `c8964ff` e `6cbb759` | mai salvato 1 → 2; salvato fermo; 7 esercizi su 39 esposti | `21-r17.mts` |
| Figura visibile per esercizio × gradino (264 posizioni), `50793fd` contro `96a90c2` | 35 cambiate: 27 → nessuna, 6 → proposta, 2 sbagliata → sbagliata (M23); 0 orfane, 0 collisioni; positivo: in produzione le 35 mostrano le figure dell'audit | `19-figure.mts` |
