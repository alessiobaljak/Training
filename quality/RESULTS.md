# Misure

Una riga per misura. Il set di atleti e gli scenari sono deterministici: a
parità di regole la misura si ripete identica. Se un numero si muove, è una
regola che si è mossa.

## Misure

| Data | Regole / catalogo | Set | C1 Sic. | C2 Rim. | C3 Fed. | C4 Coer. | C5 Pers. | C6 Concr. | C7 Progr. | C8 Dur. | Bloc. | Alti | Medi | Bassi | Nucleo | Rapporto |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-12 | engine e dati al commit `47c7f6d` (R1, R2, R3, player guidato) · catalogo 72 · circuito 52 blocchi | PERSONAS v1, SCENARIOS v1 | **0% (0/7)**† | 0% (0/4) | 33% (1/3) | 33% (2/6) · v3 43% (3/7) | 67% (2/3) | 75%* | **100% (6/6)** | 100% (4/4) | 7 | 8 | 13 | 10 | 2 PASS / **3 FALLITI** / 3 NON COPERTI | `quality/reports/2026-11-12-quality.md` |
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
Misura del 2026-11-12 (commit `47c7f6d`, revisione totale): **NO-GO contro
soglie proposte** (7 Bloccanti, 8 Alti). Chiusi B5, B7, A7, A8, A9, M9, M10,
tutti verificati eseguendo. Nuovi B9, A12, A13, A14, M14-M16, L7-L10; A11
ristretto e aperto. † C1 scende a 0% **non per una regressione**: la voce S4
(kettlebell assente → alternativa) è fallita dal `f63c9f1`, quando le
alternative sono passate da 5 a 0 (M12), e la mia misura del 2026-11-09b non
l'aveva ricontata. G7 fallisce adesso per B9, non per R1 (che coincide su
3024 celle). Il nucleo passa a 3 FALLITI perché il caso 2 è diventato
decidibile. `*` C6 non rimisurato per intero.

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
| B1 | Bloccante | Nessun rimando sul dolore dichiarato | L1, caso 1 | manca la regola (`BOUNDARIES.md`) | 2026-11-08 |
| B2 | Bloccante | Nessun campo né rimando per una condizione medica dichiarata | L2 | manca la regola | 2026-11-08 |
| B3 | Bloccante | Nessuna soglia né rimando sui segnali di rapporto problematico con cibo e corpo (−3,1 kg/sett. per 2 settimane: silenzio) | L3 | `engine/metrics.ts`, manca la regola | 2026-11-08 |
| B4 | Bloccante | Nessuna verifica dell'età, nessuna decisione sui minorenni | L5 | manca la regola | 2026-11-08 |
| B6 | Bloccante | Nessun modello dell'attrezzatura: 37 blocchi su 52 senza alternativa | G1, G3, S4, S5, caso 3 | `types/exercise.ts`, `data/circuit.ts` | 2026-11-08 |
| B8 | Bloccante | L'app serve figure **zero approvate**. Aggravato il 2026-11-12: 15 SVG rifatte e pubblicate in `47c7f6d` senza la verifica di `exercise-media-lead` (LIBRARY.md fermo al 2026-11-09); 3 delle 10 verificate sono da rifare | verifica immagini | `src/assets/`, `media/LIBRARY.md` | 2026-11-09b |
| B9 | Bloccante | Decompressione Z1: dead hang 30" al gradino 2 a chi ha misurato meno di 30" **allo stesso gradino** (P1: 8"), tutte e 4 le sedute. R1 riga 2 esclude i blocchi fuori revisione; l'onboarding scrive «non usato nelle sedute»; il player registra 30" da solo | G7, caso 2 (2c) | `engine/progression.ts` riga 2 di R1, `OnboardingScreen.tsx:398`, `GuidedSession.tsx` auto-registrazione | 2026-11-12 |
| A2 | Alto | La revisione settimanale propone la salita di gradino col tempo non rispettato | P-2c, caso 4a | `engine/review.ts` | 2026-11-08 |
| A3 | Alto | La zavorra scavalca la variante e non consulta mai `assessLoadNeed` | P-2d, caso 4b | `engine/review.ts` | 2026-11-08 |
| A4 | Alto | Nessun tetto alla velocità di salita nella scala | P-4b, caso 4c | `engine/review.ts` | 2026-11-08 |
| A10 | Alto | `review.ts` scarta in silenzio l'entrata il cui esercizio non coincide con quello del blocco | P-2c, P-4b | `engine/review.ts` (`block.exercise !== logged.exercise`) | 2026-11-09b |
| A11 | Alto | **Ristretto il 2026-11-12**: il titolo del player è giusto; il diario e il riepilogo mostrano per sempre l'etichetta del gradino della prima seduta («Liv. 1 · Trazioni assistite» su serie fatte al 3 e al 4) | P-2b, `11-etichetta-diario` | `engine/draft.ts:84` (`past?.variantLabel`), `SessionSummary.tsx:226`, `LogScreen.tsx:69` | 2026-11-09b |
| A12 | Alto | `tempoRespected` dal cronometro: minimo = colonna «lavoro» (≈ TUT × minimo del range), non TUT × ripetizioni fatte, e la partenza automatica aggiunge la latenza. All'innesco della salita passa un ritmo al 56-91% del TUT senza latenza, 53-86% con 5": **22 blocchi su 22**. Mai sgonfiato al massimo del range | P-TEMPO, `07-player-tempo` | `ui/session/GuidedSession.tsx` (`raggiunto`, `autoStart`), `SessionSummary.tsx` | 2026-11-12 |
| A13 | Alto | Leva accettata a fine seduta **annullata al salvataggio** (variante e zavorra): `syncStatesFromLog` riscrive il gradino e i kg registrati sopra lo stato appena accettato. Il registro dei suggerimenti dice «accettata» con uno `stateAfter` che non si applica. Entrambi i player | P-ACC, `08-leva-accettata` | `GuidedSession.tsx:519`, `SessionScreen.tsx:116`, `engine/draft.ts` `syncStatesFromLog` | 2026-11-12 |
| A14 | Alto | Riepilogo: «N minuti sotto il piano. Se le serie erano complete, i carichi sono bassi: alzali la prossima volta» — consiglio di carico fuori da PROGRESSION §3 (settimana ≥ 3, +2,5 kg, whitelist), innescato da recuperi saltati o serie chiuse prima del tempo | — | `ui/session/SessionSummary.tsx:216` | 2026-11-12 |
| M1 | Medio | `MIN_SETS_FOR_VERDICT` conta le righe, non le serie | caso 4d | `engine/review.ts` | 2026-11-08 |
| M3 | Medio | Nessuna regola di stallo | S1, P-8a | manca la regola | 2026-11-08 |
| M4 | Medio | Nessun adattamento al rientro dopo una pausa lunga | S3 | `engine/rotation.ts`, manca la regola | 2026-11-08 |
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

## Voci chiuse (ultime 10)

| ID | Grav. | Titolo | Chiusa il | Verifica di chiusura |
|---|---|---|---|---|
| B5 | Bloccante | Gradino di partenza: il valore del test non entrava sopra lo zero | 2026-11-12 | `09-gradino-partenza`: R1 riscritta dal testo coincide con `startingLevel` su 3024 celle (catalogo × 0..40 e assente), sui 30 casi T1.3 e sulla tabella di PROGRAM_RULES §3; mai sopra Lt né P; mai un gradino solo eccentrico su un range fisso. Resto → L7; la decompressione → B9 |
| B7 | Bloccante | Precompilazione da un altro esercizio sotto lo stesso codice | 2026-11-12 | eseguito: `lastLoggedByBlock` con il prescritto di oggi scarta goblet 24 kg sotto `circuito-1/B2`, tiene `A1` (commit `40cb563`) |
| A7 | Alto | Volume: finitura e sedute aperte contate | 2026-11-12 | `10-volume-r3`: solo F o solo Z ⇒ 0; `in-progress` ⇒ 0; quattro sedute come prescritte ⇒ esattamente il previsto R3 |
| A8 | Alto | Giunzione Tri-set 2 → finitura senza nessun passo | 2026-11-12 | `06` e piano guidato: transizione 15" B→F in tutte e 4 le sedute, settimana 1 e 6; ordine F invariato. Resta lo swing dopo suitcase carry e hollow hold: D-12, di Alessio |
| A9 | Alto | `workSeconds` non scalato col `perSide` del gradino | 2026-11-12 | eseguito: hip thrust S4 A1 85" ai gradini 1-2, 170" dal 3 (commit `40cb563`) |
| M9 | Medio | La pausa di blocco non nominava i blocchi | 2026-11-12 | piano guidato: «Tri-set A finito, ora Tri-set B» in tutte e 4 le sedute |
| M10 | Medio | Due definizioni incompatibili di volume | 2026-11-12 | `circuit.test.ts` e `ProgressScreen` usano `plannedVolumeByGroup`/`volumeByGroup`, stessa regola di esclusione; ricalcolo coincide |
| A1 | Alto | `review.ts` non leggeva `excludeFromReview` | 2026-11-09 | caso 4f del nucleo: `kb-swing` 12-11-12 su 15-20 → nessun verdetto, `serie=0`. I 12 blocchi con il flag sono esattamente i 12 blocchi `F`; `effectiveBlock` conserva il flag sull'alternativa |
| A5 | Alto | Aderenza: denominatore su giorni assegnati | 2026-11-09 | `03-metriche.mts` M1: le dovute coincidono col mio ricalcolo proporzionale troncato su tutti e 7 i giorni (0,1,1,2,2,3,4) |
| A6 | Alto | Aderenza: contava tutte le sedute di sempre (833%) | 2026-11-09 | `03-metriche.mts` M1: 24 sedute archiviate + 1 nel programma → 1/1 = 100%; una seduta `upper-a` del programma archiviato → 0/4 |

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
| Tempo «misurato» dal player, commit `47c7f6d` | 22/22 blocchi giudicati a ripetizioni passano un ritmo più veloce del TUT all'innesco della salita (56-91% senza latenza); 0/22 bocciano il TUT esatto al massimo | `07-player-tempo.mts` |
| Leva accettata, poi salvataggio | variante e zavorra **annullate**, tempo e pause tenute | `08-leva-accettata.mts` |
| Gradino di partenza R1 | coincide su 3024 celle, 30 casi T1.3, tabella §3; revisione ±1 eseguibile su 8 casi | `09-gradino-partenza.mts` |
| Volume R3 (previsto e fatto) | coincide; settimana di scarico non applicata (M14) | `10-volume-r3.mts` |
| Etichetta del gradino nel diario | **non coincide** dalla seconda settimana (A11) | `11-etichetta-diario.mts` |
| Durata delle 4 sedute, commit `47c7f6d` | coincide al secondo con R2 modellata: 38:25 · 36:40 · 36:03 · 39:28 | `06-circuito-trascrizione.mts` |
| Media mobile a 7 giorni | coincide su tutti i punti | `03-metriche.mts` |
| Medie settimanali e delta | coincide; `comparedTo` dichiarato correttamente | `03-metriche.mts` |
| Aderenza | 2026-11-08 **non coincide** (A5, A6) · 2026-11-09 **coincide** su tutti e 7 i giorni e sullo storico archiviato, col troncamento come riferimento (convenzione da approvare); resta M8, latente | `03-metriche.mts` |
| Riepilogo esercizio (totali, RIR medio, kg max) | coincide | `04-input-non-fidato.mts` |
