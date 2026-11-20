# Misure

Una riga per misura. Il set di atleti e gli scenari sono deterministici: a
parità di regole la misura si ripete identica. Se un numero si muove, è una
regola che si è mossa.

## Misure

| Data | Regole / catalogo | Set | C1 Sic. | C2 Rim. | C3 Fed. | C4 Coer. | C5 Pers. | C6 Concr. | C7 Progr. | C8 Dur. | Bloc. | Alti | Medi | Bassi | Nucleo | Rapporto |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-20b | `221b2e8` (head locale non pushato, incrementale su `59daf79` = `0f3f191` in produzione): rilascio B1 (L23, L24, M21, 17.2, D-21 a, D-22 a / R19, D-23 a), progressione 4.0 rev., consigli 4.0 rev., progressi 3.1 rev., limiti 1.4 rev. · catalogo 72 · circuito 52 blocchi · griglia v3 | PERSONAS v1, SCENARIOS v1 | 29% (2/7) | 0% (0/4)ᵖ | 33% (1/3) (A19 non eseguito, M22) | 71% (5/7) | 67% (2/3) | 75% (3/4) | 86% (6/7) | 100% (4/4) (D5 proposta: 80%, circuito-4 fino a 59′ con la variante) | **5** + 4ᵖ | 3 | 14 | 19 | 2 PASS / 4 FALLITI / 2 NON COPERTI (**v9**, caso 4 solo 4h) | `quality/reports/2026-11-20-quality-221b2e8.md` |
| 2026-11-20 | `4edf751` (head locale non pushato, incrementale su `001de30` in produzione): rilascio A di R14-R18 (R18, R16, R17, R15, R14b), progressione 4.0, progressi 3.1, consigli 4.0, programmi 2.2; D-20 (a, b) · catalogo 72 · circuito 52 blocchi · griglia v3 | PERSONAS v1, SCENARIOS v1 | 29% (2/7) | 0% (0/4)ᵖ | 33% (1/3) (A18 chiuso, A19 aperto) | 71% (5/7) | 67% (2/3) | 75% (3/4) | 86% (6/7) | 100% (4/4) (con D5 proposta: 80%) | **5** + 4ᵖ (B13 aperto e chiuso) | 3 | 15 | 19 | 2 PASS / 4 FALLITI / 2 NON COPERTI (v8, caso 4 solo 4h) | `quality/reports/2026-11-20-quality.md` |
| 2026-11-16 | `cf7588a` (head locale non pushato, incrementale su `a747e09` in produzione): R10-R13, progressione 3.0, progressi 3.0, consigli 3.0; D-4 (a), D-19 sì · catalogo 72 · circuito 52 blocchi · griglia v3, composizione v2 confermata | PERSONAS v1, SCENARIOS v1 | 29% (2/7) | 0% (0/4)ᵖ | **33% (1/3)** rimisurato (A18) | 71% (5/7) | 67% (2/3) | 75% (3/4) | 86% (6/7) | 100% (4/4) | **5** + 4ᵖ (B12 aperto e chiuso) | 3 | 12 | 21 | 2 PASS / 4 FALLITI / 2 NON COPERTI (v7, caso 4 solo 4h) | `quality/reports/2026-11-16-quality.md` |
| 2026-11-15 | `ff42dfb` (head locale non pushato; `2c9d822` R5-R7 a fine seduta, `ff42dfb` R8 e R5-R7 in revisione; B11/A15 da `79d2cb0`) · catalogo 72 · circuito 52 blocchi · soglie approvate, griglia v3, S4 nella lettura D-16 | PERSONAS v1, SCENARIOS v1 | **29% (2/7)** | 0% (0/4)ᵖ | **67% (2/3)** | **71% (5/7)** | 67% (2/3) | 75% (3/4) | 86% (6/7) | 100% (4/4) | **5** + 4ᵖ | 3 | 12 | 17 | 2 PASS / 4 FALLITI / 2 NON COPERTI (caso 4 solo per 4h) | `quality/reports/2026-11-15-quality.md` |
| 2026-11-12b | `90b8b81` (incrementale su `47c7f6d`: `2d84d87` A11-A14 e onboarding, `90b8b81` A11) · catalogo 72 · circuito 52 blocchi · **soglie approvate**, griglia v3 | PERSONAS v1, SCENARIOS v1 | 0% (0/7) | 0% (0/4)ᵖ | 33% (1/3) | **29% (2/7)** v3 | 67% (2/3) | 75%* | **86% (6/7)** v3 | 100% (4/4) | **10** + 4ᵖ | 3 | 11 | 13 | 2 PASS / **4 FALLITI** / 2 NON COPERTI | `quality/reports/2026-11-12-quality-90b8b81.md` |
| 2026-11-12 | engine e dati al commit `47c7f6d` (R1, R2, R3, player guidato) · catalogo 72 · circuito 52 blocchi | PERSONAS v1, SCENARIOS v1 | **0% (0/7)**† | 0% (0/4) | 33% (1/3) | 33% (2/6) · v3 43% (3/7) | 67% (2/3) | 75%* | **100% (6/6)** | 100% (4/4) | 7 | 8 | 13 | 10 | 2 PASS / **3 FALLITI** / 3 NON COPERTI | `quality/reports/2026-11-12-quality.md` |
| 2026-11-09b | catalogo 72 esercizi · circuito 52 blocchi · engine al commit `f63c9f1` | PERSONAS v1, SCENARIOS v1 | 14% (1/7) | 0% (0/4) | 33% (1/3) | 33% (2/6) | 67%* | 75%* | 83% (5/6) | 100% (4/4) | 8 | 8 | 13 | 6 | 2 PASS / 2 FALLITI / 4 NON COPERTI | `quality/reports/2026-11-09-quality-circuito.md` |
| 2026-11-09 | stesso catalogo · engine al commit `1802631` | PERSONAS v1, SCENARIOS v1 | 14% (1/7) | 0% (0/4) | 67% (2/3) | 33% (2/6) | 67% (2/3) | 75% (3/4) | 83% (5/6) | 100% (4/4) | 6 | 4 | 8 | 4 | 2 PASS / 2 FALLITI / 4 NON COPERTI | `quality/reports/2026-11-09-quality.md` |
| 2026-11-08 | `circuit.ts` 4 circuiti, 56 esercizi, 13 scale · engine al 2026-11-08 | PERSONAS v1 (11 persone), SCENARIOS v1 (30 scenari) | 14% (1/7) | 0% (0/4) | 67% (2/3) | 43% (3/7) | 50% (1/2) | 50% (2/4) | 67% (4/6) | 100% (4/4) | 6 | 7 | 7 | 2 | 2 PASS / 3 FALLITI / 3 NON COPERTI | `quality/reports/2026-11-08-quality.md` |

Soglie **approvate da Alessio il 2026-11-12** (GRID.md v3): C1 100 · C2 100 ·
C3 100 · C4 ≥90 · C5 ≥80 · C6 ≥90 · C7 100 · C8 100; GO solo con Bloccanti = 0
e Alti = 0 su L. ᵖ = blocca solo il rilascio pubblico (B1-B4, decisione del
2026-11-12; C2 è fatto solo di loro).

Misura del 2026-11-20b (commit `221b2e8`, incrementale su `59daf79`): **GO per
il push di B1** (nessun Bloccante o Alto nuovo o peggiorato); app ancora NO-GO.
`16` (nuovo): F 153 righe eseguite, 2 DIVERSE (R19.R = M22 nuovo; Q5 = M18), NC
15.12, b.8; A 0 su 259.782; B 0; 15.19 (b) 0 su 128.653, (a) 0 su 133.507; 16.P 0
su 32; C/C2/C2R 18 settimane: 13.P, S2, E7, S1 all'esecuzione 0, 24.6 0 su 40.550,
leve in W5-6/11-12/17-18 0; C3 (R19, circuito intero, 5.952 sedute): σ′ oltre il
tetto 0, S5 0 su 466, 7 sedute oltre il tetto con una variante (L25), 54
revisioni che promettono un passo fermato (M22). D-21 in C2: 912 proposte tolte
sullo stesso ingresso, netto −540 aumenti su 3.091 (−17,5%). Positivo su
`59daf79`: F 26, A 35, B 33, 15.19 128.653, W5-6 2.590, E4 all'esecuzione 1.349
(119 su `221b2e8`). Nucleo v9 (4e fuori dalla W5): su `001de30` S2. Chiusi L23,
L24, M21, M19. verify (880) eseguito da me; smoke, offline no (sessione principale).

Misura del 2026-11-20 (commit `4edf751`, incrementale su `001de30`): **GO per
il push del rilascio A** (nessun Bloccante o Alto introdotto o peggiorato); app
ancora NO-GO per la regola approvata. `15` (nuovo): F 107 righe eseguite, 1 DIVERSO (Q5 =
M18, rilascio B), NC 15.12, b.8, 16.4 non costruibile; A 0 differenze su 259.782
esiti; B 1 (R11, L23); C/C2 800 atleti: 13.P 0, S1 0, E7 0, R13 di fine seduta
= riferimento su 23.060 sedute; R14b toglie 226 proposte su 2.318 in C2, 0
allo stato. Positivo su `001de30`: F 41, A 64, E7 36, 237 leve su voci non allo
stato, nucleo v8 4e S2. Chiusi **B13** (aperto e chiuso), **A18**, L18-L21.
Nuovi A19 (preesistente), M19-M21, L23, L24. verify (857), smoke eseguiti da me
in sequenza: verdi; offline no (non tocca il metodo).

Misura del 2026-11-16 (commit `cf7588a`, incrementale su `a747e09`): **GO per
il push delle modifiche al metodo** (nessun Bloccante o Alto introdotto o
peggiorato); app ancora NO-GO. Chiusi **A17, M17, L15** (`14` F 52/52 righe
della specifica, A 0 differenze su 259.782 esiti, B 0 violazioni, C 0 su 400
atleti; `13` v2; positivo su `a747e09`) e **B12** (S2 su 7 giorni: violata in
produzione, +5 kg in 3 giorni, chiusa da R13; nucleo v7 4e). Nuovi **A18**
(player guidato senza stato accettato, preesistente), **M18**, L18-L22. C3
rimisurato 67 → 33 per A18 (c'era anche prima: non guardavo il player).
verify (811), smoke, offline eseguiti da me in sequenza: verdi.

Note delle misure fino al 2026-11-09b: `ARCHIVE.md`; dal 2026-11-12 al 2026-11-15: `ARCHIVE-2.md`.

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
| A10 | Alto | `review.ts` scarta in silenzio l'entrata il cui esercizio non coincide con quello del blocco | P-2c, P-4b | `engine/review.ts` (`block.exercise !== logged.exercise`) | 2026-11-09b |
| A16 | Alto | Regola di esito approvata: C4 (29%), C5 (67%) e C6 (75%*) sotto soglia insieme valgono un Alto. Si chiude quando uno dei tre torna in soglia | griglia | — | 2026-11-12b |
| A19 | Alto | **Durata in Home senza gli stati.** Corretto nel codice in `0f3f191` (`buildGuidedPlan(session, 1, stati)`, stessa formula di R19.0 = riferimento su 1.200 stati). **Non eseguito nell'interfaccia** (release-gate: nessuna asserzione smoke): resta aperto finché un controllo eseguito non lo prova | `15` R-6, `16` R19.0 | `HomeScreen.tsx` 59-66 | 2026-11-20 |
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
| M16 | Medio | Banner del ritest: «l'app ricalcola da che gradino riparti». Gli stati salvati non si ricalcolano mai (R1 «dopo ogni ritest» contro T1.7) | S3, G4 | `HomeScreen.tsx:491`, `db/repository.ts:255` | 2026-11-12 |
| M20 | Medio | E4 all'esecuzione. **2026-11-20b**: D-21 (a) chiude la via principale (fine seduta in W5, 11, 17): aumenti eseguiti in scarico 1.349 → 119 su 12.192 scelte in salita. Restano (1) fine seduta in W4/10/16 con l'esercizio rifatto solo in scarico (sedute a più di 7 giorni) e (2) revisione W4 aperta in W5 (Q5.R1: domenica 5 aprile zavorra 0 → 2,5, prima seduta lunedì 6 in W6). Preesistente | `16` E4 all'esecuzione, Q5.R1 | PROGRESSION_RULES E4, `review.ts` E4 | 2026-11-20 |
| M18 | Medio | **Manubrio accettato e non scritto nel player: lo stato perde tempo e pausa senza cambiare peso.** Curl 12 kg +2"/+2", accettato «al massimo 14,5» (bonus a 0), seduta dopo a 12 kg precompilati → salvato 12 kg +0"/+0"; R13 blocca 7 giorni, poi la catena tempo-pausa riparte. Su `a747e09` tornava a 12 kg con i bonus. Nuovo in `cf7588a` (R10c-1 + reset), conseguenza di A18 | `14` Q5 | `engine/draft.ts` `syncStatesFromLog`, R10c-1 | 2026-11-16 |
| M22 | Medio | **Revisione e riepilogo si contraddicono sul circuito 4 oltre il tetto (R19 solo a fine seduta).** Revisione R10a (2-3): «La prossima leva è il tempo, eccentrica da 3" a 4": te la propone il riepilogo…»; il riepilogo allo stesso stato ferma il tempo (R19) e propone il manubrio (military press 10 → 12,5) o dice «Hai esaurito tutte le leve… Serve un cambio di programmazione» (plank, tempo e pausa liberi). C3: 54 revisioni, 66 «leve finite». Nuovo con R19 | `16` R19.R, R19.L, C3 | `review.ts` R10a (2-3), `progression.ts` R17c | 2026-11-20 |
| L1 | Basso | CSV: una nota che comincia con `=` viene esportata come formula | U3 | `db/csv.ts` | 2026-11-08 |
| L2 | Basso | `syncStatesFromLog` azzera il carico di un esercizio `inherent` senza kg (ipotesi). **2026-11-16**: con il reset del manubrio azzera anche tempo e pausa (eseguito: 12 kg +2"/+2" → 0 kg +0"/+0"). Latente: dipende da come il player scrive il peso. **2026-11-20**: con R14b il riepilogo lo dice («Oggi hai usato 0 kg e lo stato era 12 kg… dalla prossima seduta a 0 kg»); una leva accettata non lo maschera più. Chiude R14e (rilascio B) | — | `engine/draft.ts` | 2026-11-08 |
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
| L22 | Basso | La scrittura atomica non arriva alla chiusura: `decide` chiama `recordDecision` con `void`, poi «Salva e chiudi» riscrive lo stato accettato con `saveExerciseState` da solo. Se la traccia è fallita, lo stato cambia senza traccia (R10b/R13 fail-open, R-2). Letto, non eseguito; latente | — | `GuidedSession.tsx` `decide` e chiusura, `SessionScreen.tsx` | 2026-11-16 |
| L25 | Basso | σ′ di R19 non contiene una variante proposta sopra nello stesso riepilogo: C3 7 sedute su 5.952 (circuito-4) chiuse oltre il tetto con tempo o pausa accettati, fino a 56:07 (es. 54:07 senza i passi, 55:31 con). Il §7 lo scrive così, ma dice anche «finché il circuito è sopra il tetto non si propongono tempo né pausa» | `16` C3 | §7, `SessionSummary.tsx` `statiRiepilogo` | 2026-11-20 |
| L26 | Basso | Nota del circuito 4 «può arrivare a 55 minuti»: con la variante dell'hip thrust 59:07 (costruito), 56:07 (C3). Deviazione dalla scheda («togli 2 ripetizioni») dichiarata solo in un commento: nessun test confronta le note. PROGRAM_RULES §5 ha ancora il `[PROPOSTA]` che taglia transizioni e finitura, contro R19 | `16` R19.4 | `circuit.ts` nota, `deviations.ts`, PROGRAM_RULES §5 | 2026-11-20 |

## Voci chiuse (ultime 10)

| ID | Grav. | Titolo | Chiusa il | Verifica di chiusura |
|---|---|---|---|---|
| L23 | Basso | R15 senza «date ≤ oggi»: una seduta datata dopo oggi faceva sparire l'aumento da R13 | 2026-11-20b (`221b2e8`) | `16` 15.16 (date originali, dal 30 marzo), 15.16′, 15.17, 15.18; 15.19 (b) 0 su 128.653, (a) 0 su 133.507; A 0, B 0. Su `59daf79`: A 35, B 33 |
| L24 | Basso | Gradino della seduta: prima voce, ultima voce, peso massimo | 2026-11-20b | `16` 24.1-24.5 (fixture a due voci), 24.6 0 su 40.550 fine seduta, 24.6a sui 4 circuiti; su `59daf79` 24.1-24.3, 24.5 falliscono |
| M21 | Medio | R14b rumoroso alla prima seduta pesata | 2026-11-20b | `16` 21.1-21.5; testo M21 in 106 sedute di C2; il blocco della leva resta |
| M19 | Medio | Durata oltre i 40′ con i bonus | 2026-11-20b (D-22 a, R19) | `16` R19.0-R19.4, C3: 0 passi di tempo o pausa con σ′ oltre 55′. Residui: variante oltre il tetto (voluta, fino a 59:07), L25 |
| B13 | Bloccante | S2 e D-4 (a) contati all'esecuzione (D-20 a, b, Alessio 2026-11-20) violati in produzione `001de30`: 13.4 (2,5 kg sollevati il 03-30, +2,5 proposti lo stesso giorno). Aperto e chiuso il 2026-11-20 | 2026-11-20 (`4edf751`; in produzione fino al push) | su `001de30`: nucleo v8 4e S2, `15` E7 36, 15.6 `load`; su `4edf751`: 4e superato, E7 0 su 800 atleti, 15.5-15.7 |
| A18 | Alto | Player guidato senza lo stato accettato | 2026-11-20 (corretto in `fe85203`) | `15` A18 statico; `npm run smoke` eseguito da me su `4edf751`: eccentrica annunciata, peso dallo stato (14 kg), R18 36″. Resto: peso dei manubri dalla volta scorsa (R-7, voluto) → M18 |
| L18 | Basso | Manubrio sotto il tetto contato due volte | 2026-11-20 | `15` 15.1, 15.2; positivo su `001de30` |
| L19 | Basso | Spiegazione larga del diario | 2026-11-20 | `15` 15.4, b.10; C su `001de30` R13 ≠ riferimento |
| L20 | Basso | Scarico e scarico-coppia in R11 | 2026-11-20 | `15` 16.1-16.3, 16.5; A 0 differenze (62 su `001de30`) |
| L21 | Basso | R13 senza leve a fine seduta | 2026-11-20 | `15` 17.1, 17.10 |

## Verifiche tecniche delle immagini (ultime 10)

| Data | Immagine | Esito | Punti con PROBLEMA | Dettaglio |
|---|---|---|---|---|
| 2026-11-12 | `exercises/hip-thrust-panca-bilaterale.svg` | nessun problema, **non inoltrabile**: manca la verifica di `exercise-media-lead`, scheda incompleta (M7) | — | `IMAGES.md` |
| 2026-11-12 | `exercises/hip-thrust-monopodalico.svg` | nessun problema, non inoltrabile; l'app mostra la foto RepDB (archetipo sbagliato) | — | `IMAGES.md` |
| 2026-11-12 | `steps/hip-thrust-l1.svg` | nessun problema, non inoltrabile; l'app mostra la foto RepDB | — (nota sulla spec §4.21) | `IMAGES.md` |
| 2026-11-12 | `steps/hip-thrust-l2.svg` | nessun problema, non inoltrabile | — | `IMAGES.md` |
| 2026-11-12 | `steps/hip-thrust-l3.svg` | nessun problema, non inoltrabile; l'app mostra la foto RepDB | — | `IMAGES.md` |
| 2026-11-12 | `steps/hip-thrust-l6.svg` | nessun problema, non inoltrabile | — (nota sul punto 5) | `IMAGES.md` |
| 2026-11-12 | `exercises/circonduzioni-spalle.svg` | **SCARTATA** | 3 anatomia | `IMAGES.md` |
| 2026-11-12 | `exercises/step-rapidi-box.svg` | verificata con riserva, non inoltrabile | 8 (riserva) | `IMAGES.md` |
| 2026-11-12 | `exercises/pull-over-trx.svg` | **SCARTATA** | 1 · 3 · 4 · 5 | `IMAGES.md` |
| 2026-11-12 | `exercises/estensione-tricipiti-sopra-testa.svg` | **SCARTATA** | 1 · 3 · 4 | `IMAGES.md` |

## Ricalcoli indipendenti eseguiti (ultimi 10)

| Metrica | Esito | Script |
|---|---|---|
| B1 dal testo dell'appendice 2026-11-20 + D-21 a, D-22 a, D-23 a, commit `221b2e8` | F 151/153 = atteso (R19.R = M22, Q5 = M18); A 0 su 259.782; B 0; 15.19 0; 16.P 0; C/C2/C2R 18 settimane: 13.P, S2, E7, S1 all'esecuzione, 24.6, leve W5-6 a 0; C3 R19 σ′ 0, S5 0, L25 7, M22 54 + 66. Su `59daf79`: F 26, A 35, B 33, W5-6 2.590 | `16-b1.mts` |
| Nucleo v9 (4e spostato a W8-W10, fuori da D-21) | `221b2e8` e `59daf79`: solo S9; `001de30`: S2 il 05-04 (la fixture discrimina). Con la v8 su `221b2e8`: «positivo mancato» per D-21 | `safety-core.mts` v9 |
| R14b, R15, R16, R17, R18 dal testo della specifica 2026-11-18 + D-20, commit `4edf751` | F 106 righe su 107 = atteso (Q5 = M18 resta aperto); A 0 differenze su 259.782 esiti; B 1 (L23); C + C2 800 atleti: 13.P, S1, E7 0, R13 di fine seduta = riferimento; R14b 226 proposte tolte, 0 allo stato; R-6 durate. Su `001de30`: F 41, A 64, E7 36, 237 leve fuori stato | `15-r14-r18.mts` |
| Nucleo v8 (4e sul carico sollevato) contro `001de30` | S2 il 03-30 + S9: la fixture nuova discrimina; su `4edf751` solo S9 | `safety-core.mts` v8 |
| R10-R13, riferimento scritto dal testo di R10-R13, commit `cf7588a` | **coincide**: 259.782 esiti su 80.000 revisioni (categoria, motivo, stato dopo, `sessionsCounted`, `setsCounted`); 52/52 righe della specifica; 0 violazioni S3/S4/S5/E4/R10a/R10b/R10c/R12/R13/10.P/R11; 400 atleti simulati: 13.P 0, S1 0, S2 0. Su `a747e09`: 45.672 differenze, 6.273 violazioni, 13.P 2.889, S2 739 | `14-r10-r13.mts` |
| Nucleo v7 (4e su 7 giorni, 4b R10a) contro `a747e09` | S2 ×2 (+5 kg in 3 giorni, +5 kg nello stesso giorno), R10a, S9: le fixture nuove discriminano; su `cf7588a` solo S9 | `safety-core.mts` v7 (copia con `git archive`) |
| Leva accettata e R13 nel riepilogo, commit `cf7588a` | A 6/6, V 6/6, Q 2/2, R 2/2; senza il filtro della seduta il riquadro si svuoterebbe (scostamento necessario) | `08-leva-accettata.mts` v4 |
| R8 + R5/R6/R7 della revisione, riferimento scritto dalla specifica, commit `ff42dfb` | **coincide**: 192.234 esiti per esercizio su 120.000 revisioni (stato, finestra, sessionsCounted, setsCounted, categoria, stato dopo); 32 righe di PROGRESS_REVIEW §6 e PROGRESSION_RULES §9 = atteso; 0 violazioni S1-S5/E4/T2; 300 atleti simulati: 0 salite sotto i 14 giorni | `12-r8-revisione.mts` |
| R5, R6, R7 a fine seduta, commit `2c9d822` | 12/12 righe come la specifica; X: tempo accettato + zavorra in revisione = due aumenti (A17); M17: revisione aperta dopo la seduta del lunedì = «rimandati» W1-W7 | `13-fine-seduta-r5r6r7.mts` |
| Leva accettata e ricarica su `sessionDecisions`, commit `ff42dfb` | A 6/6 tenute, R 2/2, Q1 2/2, Q2 2/2 stessa leva e blocco deciso, V coerente 6/6; L11 invariato | `08-leva-accettata.mts` v3 |
