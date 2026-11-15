# Misure

Una riga per misura. Il set di atleti e gli scenari sono deterministici: a
parità di regole la misura si ripete identica. Se un numero si muove, è una
regola che si è mossa.

## Misure

| Data | Regole / catalogo | Set | C1 Sic. | C2 Rim. | C3 Fed. | C4 Coer. | C5 Pers. | C6 Concr. | C7 Progr. | C8 Dur. | Bloc. | Alti | Medi | Bassi | Nucleo | Rapporto |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
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

Misura del 2026-11-15 (commit `ff42dfb`, incrementale su `90b8b81`): **GO per
il push delle modifiche al metodo** nel perimetro chiesto (nessun Bloccante o
Alto introdotto o peggiorato); la regola di esito approvata resta NO-GO per
l'app (5 Bloccanti attivi, 3 Alti). Chiusi **A2, A3, A4, M1** (eseguiti: nucleo
4 v6 con controlli positivi, `12` A-D, `13`) e **B11, A15** (`08` v3 su
`sessionDecisions` + `npm run smoke` eseguito da me, verde). Nuovi **A17**
(revisione: zavorra o manubrio sopra una leva di tempo appena accettata, due
aumenti dalle stesse due sedute; c'è anche su `0d2bb92`, più largo), **M17**
(rimandati perpetuo), L14-L17. C1 0→29, C3 33→67, C4 29→71; C6 rimisurato
per intero (75%, senza asterisco). Nucleo invariato nei numeri, 4 fallisce
solo per 4h (B10).

Misura del 2026-11-12b (commit `90b8b81`, incrementale): **NO-GO contro soglie
approvate**. Il NO-GO non dipende dalla riclassificazione: B6, B8, B9 (non
decisi) bastano. Chiusi **A11, A12, A13, A14**, verificati eseguendo (`08` v2,
`11` v2, 4i). Bloccanti: erano 7 (B1-B4, B6, B8, B9), oggi **10 attivi** + 4 al rilascio
pubblico, **nessuna regressione**. B1-B4 passano a «rilascio pubblico»; A2, A3, A4, M1, M4
diventano Bloccanti perché la soglia che violano (S3, S5, S1, S4, S6) adesso è
approvata; nuovi **B10** (S9: giro della finitura di `circuito-4`, 0" fra
plank e slam: c'era già, il controllo 4h no) e **B11** (ricarica fra «Accetto» e
«Salva e chiudi»: leva annullata o doppia). Nuovi A15 (dopo «Accetto» il
riepilogo mostra la leva *successiva* sopra «Scelta registrata»), A16 (C4, C5,
C6 sotto soglia insieme = un Alto, regola approvata), L11-L13. C4 e C7 si
leggono sul righello v3: V-GIUNZIONE fallisce per B10 (il 2026-11-12 l'avevo
data superata guardando solo B → F), M-RIEP-SEDUTA per M14. Il nucleo passa a
4 FALLITI perché il caso 6 è eseguibile su `media/LIBRARY.md`, che esisteva dal
2026-11-08: la mia lettura era ferma. Caso 7: la nota della seduta non era
iniettata, ora sì (PASS invariato).

Note delle misure fino al 2026-11-09b: `ARCHIVE.md`; del 2026-11-12: `ARCHIVE-2.md`.

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
| A17 | Alto | **Revisione: due aumenti dalle stesse due sedute.** Leva di tempo accettata a fine seduta (ecc +1"), poi la revisione della settimana sulle stesse sedute propone `aggiungi-peso` e lo stato dopo **tiene il bonus**: curl a martello 12 → 14,5 kg con ecc +1", trazioni al 6 5 → 7,5 kg con ecc +1", hip thrust al 6 10 → 12,5 kg con ecc +1", in 4 giorni. «Allo stato L» (R8) confronta solo gradino e carico, quindi la promessa «nessun doppio aumento» di PROGRESS_REVIEW §6 non vale per tempo e pause; e la revisione salta le leve 2-3 (METHOD §1: «la leva si cambia solo quando quella precedente è esaurita»), mentre la fine seduta sugli stessi numeri dice «il peso è l'esercizio, non una leva» (manubri) o propone il tempo. Preesistente: su `0d2bb92` c'è in 4 casi su 4 (anche push-up al 2: A3), su `ff42dfb` in 3. Nessuna soglia approvata violata (D-4 non decisa) | `13` X | `engine/review.ts` (`alloStato`, ramo `aggiungi-peso`), PROGRESS_REVIEW §6, PROGRESSION_RULES R6 | 2026-11-15 |
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
| M17 | Medio | **«Rimandati» perpetuo.** Chi apre la revisione dopo la seduta del lunedì (4 sedute a settimana: il lunedì è sempre lo stesso circuito) trova ogni settimana gli esercizi di quel circuito in `rimandati`: mai giudicati dalla revisione, quindi **mai la discesa**, che la fine seduta non propone. Push-up al 3 con 9-9-9 su 12-18 ogni lunedì: W1-W7 «rimandati»; aprendo prima della seduta, `scendi-di-livello` da W2. Il testo «Lo giudica la revisione della settimana prossima» è falso ogni settimana, e la scheda della Home sparisce (conta solo i verdetti) | `13` M17 | `engine/review.ts` (punto 3 di R8), `HomeScreen.tsx` (`daDecidere`) | 2026-11-15 |
| L1 | Basso | CSV: una nota che comincia con `=` viene esportata come formula | U3 | `db/csv.ts` | 2026-11-08 |
| L2 | Basso | `syncStatesFromLog` azzera il carico di un esercizio `inherent` senza kg (ipotesi) | — | `engine/draft.ts` | 2026-11-08 |
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
| L15 | Basso | Due sedute chiuse dello stesso esercizio **nello stesso giorno** contano 2 per S4 (8.27, eseguito): un giorno solo non è due campioni. Riserva al mio ok su D-16. Il circuito non lo produce, salvo rifare lo stesso circuito due volte in un giorno | `12` D 8.27 | `engine/review.ts` | 2026-11-15 |
| L16 | Basso | PROGRESS_REVIEW §6, base delle prove: «bulgarian `circuito-1/A2` 8-12»; la scheda dice **8-10**. Gli attesi tengono (13 sopra, 7 sotto), ma una fixture costruita su 11-12 sarebbe sbagliata | — | `training/PROGRESS_REVIEW.md` | 2026-11-15 |
| L17 | Basso | «Da 12 kg a 14.5 kg»: manubrio a +2,5 kg, che di solito non esiste, e decimale col punto in un testo italiano. Preesistente | `13` X | `engine/review.ts` (`stepLoad` su `inherent`) | 2026-11-15 |

## Voci chiuse (ultime 10)

| ID | Grav. | Titolo | Chiusa il | Verifica di chiusura |
|---|---|---|---|---|
| A2 | Bloccante | Salita di gradino in revisione senza «sì» sul tempo (S3) | 2026-11-15 | nucleo 4a v6: coppia 03-05/03-12, 5 combinazioni di tempo → `rifai-al-tempo-giusto` / `rispondi-sul-tempo` a stato invariato, positivo [sì, sì] 2→3; fine seduta con «no» nessuna leva; `12` B: 0 salite o zavorre senza «sì» su 120.000 revisioni |
| A3 | Bloccante | Zavorra sopra la variante, soglia del test mai letta (S5) | 2026-11-15 | nucleo 4b v6 con test 12 (gradino 1 → `alMassimo` «tempo», gradino 6 → +2,5 kg, 9-9-9 → `inAttesa`); `13` 6.8, 6.9, Z4, R6/R7; `12` D 6.1-6.10, B 0 violazioni S5. Resto sulle leve 2-3 → **A17** |
| A4 | Bloccante | Nessun tetto alla velocità di salita (S1) | 2026-11-15 | nucleo 4c v6: (i) 1 salita, (ii) 2 a 14 giorni, ciclo senza `break`; `12` C: 300 atleti simulati 12 settimane con fine seduta e revisione, 0 salite sotto i 14 giorni; `13` 7.3, R7 |
| M1 | Bloccante | Verdetto da righe, non da serie (S4) | 2026-11-15 | nucleo 4d v6 (1)-(6) `pocheProve`, `setsCounted` 2, positivo 2→1; `12` A: 192.234 esiti identici al riferimento scritto da PROGRESS_REVIEW §6, D 32 righe della specifica |
| B11 | Bloccante | Ricarica fra «Accetto» e «Salva e chiudi» | 2026-11-15 | `08` v3 su `sessionDecisions`: Q1 tenuta 2/2, Q2 stessa leva e blocco deciso 2/2; `npm run smoke` eseguito da me su `ff42dfb`: verde (percorso con ricarica vera, tre giri) |
| A15 | Alto | Leva successiva sopra «Scelta registrata» | 2026-11-15 | `08` v3 V: 6/6 il riquadro mostra la leva accettata (`toEvaluate` = stato di prima); smoke verde |
| A13 | Alto | Leva accettata annullata al salvataggio | 2026-11-12b | `08` v2 (con `statesToSave`, l'ordine dei due player): 6/6 leve tenute (variante, tempo, zavorra), 2/2 «Rimando» lasciano il diario. Resto sul percorso con ricarica → **B11**; display → **A15** |
| A12 | Alto | `tempoRespected` «sì» dal cronometro | 2026-11-12b | nucleo 4i: il player scrive solo `false` (1 scrittura, controllo statico), e senza «sì» l'engine non propone leve (eseguito). Il «sì» lo dà l'atleta nel riepilogo. Ma la revisione settimanale sale lo stesso con `null`: **A2** |
| A11 | Alto | Etichetta del gradino ferma alla prima seduta | 2026-11-12b | `11` v2: 4 settimane 1-3-3-4 coincidono; etichetta a mano tenuta allo stesso gradino, sostituita al gradino nuovo. Resto sui dati vecchi → **L12** |
| A14 | Alto | «Alzali la prossima volta» dall'orologio | 2026-11-12b | nessun testo di carico nel riepilogo (ricerca su `src/ui`: «alzali» solo nei commenti). Resto testuale → **L13** |

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
| R8 + R5/R6/R7 della revisione, riferimento scritto dalla specifica, commit `ff42dfb` | **coincide**: 192.234 esiti per esercizio su 120.000 revisioni (stato, finestra, sessionsCounted, setsCounted, categoria, stato dopo); 32 righe di PROGRESS_REVIEW §6 e PROGRESSION_RULES §9 = atteso; 0 violazioni S1-S5/E4/T2; 300 atleti simulati: 0 salite sotto i 14 giorni | `12-r8-revisione.mts` |
| R5, R6, R7 a fine seduta, commit `2c9d822` | 12/12 righe come la specifica; X: tempo accettato + zavorra in revisione = due aumenti (A17); M17: revisione aperta dopo la seduta del lunedì = «rimandati» W1-W7 | `13-fine-seduta-r5r6r7.mts` |
| Leva accettata e ricarica su `sessionDecisions`, commit `ff42dfb` | A 6/6 tenute, R 2/2, Q1 2/2, Q2 2/2 stessa leva e blocco deciso, V coerente 6/6; L11 invariato | `08-leva-accettata.mts` v3 |
| Nucleo caso 4 v6 contro il codice di produzione `0d2bb92` | 31 violazioni (S3 ×5, S5, S1, S4): le fixture nuove discriminano; su `ff42dfb` solo S9 | `safety-core.mts` (copia su worktree temporaneo) |
| Leva accettata, `statesToSave`, commit `90b8b81` | 6/6 tenute, 2/2 «Rimando» corretti; V: dopo «Accetto» il riquadro mostra la leva successiva (A15); Q: con una ricarica la leva si annulla o raddoppia (B11) | `08-leva-accettata.mts` v2 |
| Etichetta del gradino nel diario, commit `90b8b81` | **coincide** su 4 settimane e sui 2 casi di etichetta scritta a mano (A11 chiuso) | `11-etichetta-diario.mts` v2 |
| Giunzioni tronco → balistico nel piano guidato (S9) | B3 → F: 15" in tutte e 4; F4 → F1 fra i giri di `circuito-4`: **0"** (B10) | `safety-core.mts` 4h |
| Immagini nel bundle contro il registro | 265 file, 0 approvati, 0 non registrati (B8) | `safety-core.mts` caso 6 |
| Tempo «misurato» dal player, commit `47c7f6d` | 22/22 blocchi giudicati a ripetizioni passano un ritmo più veloce del TUT all'innesco della salita (56-91% senza latenza); 0/22 bocciano il TUT esatto al massimo | `07-player-tempo.mts` |
| Leva accettata, poi salvataggio | variante e zavorra **annullate**, tempo e pause tenute | `08-leva-accettata.mts` |
