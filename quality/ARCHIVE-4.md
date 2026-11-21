# ARCHIVE-4.md — voci spostate dai file principali (dal 2026-11-21f)

`ARCHIVE-3.md` è pieno (~215 righe più le sezioni lunghe): da qui si scrive in questo file.

## SAFETY_CORE.md, spostato il 2026-11-21f

### Testa della v14

Versione: **v14** · 2026-11-21e · misurata su `src/` al commit `644bd8c` (R9c completato, R9b, B18) e, al
contrario, su `4d06a4b`, `7863e31` e `cc95fac`. **v14**: 2d esteso alla proposta R9b (tre vie: stato salvato,
sola chiusura, migrazione arrivata dopo il ritest; M = soglia − 1 e M = 0; «Applica» e «Lascia com'è»; alla
soglia nessuna proposta); 4l (c) migrazione dopo un ritest migliore; 4n sul gestore nuovo
(`repository.archiviaSeduta`, con il gestore di prima come positivo, e un ritest fra apertura e archiviazione);
**4o** nuovo (B18, S5: `scendi-di-livello` e R9b dal 6 con 5 kg). La v13 su `644bd8c` diceva da sola
«modello da aggiornare» (4n) e «va esteso alla proposta» (2d). Testa della v13: `ARCHIVE-3.md`.

### Esito del 2026-11-21d (v13, `4d06a4b`, R20 e R21, ramo **senza** R9c): 2 PASS · 4 FALLITI · 2 NON COPERTI

Eseguito su copia `git archive` (v13 = `69d8c32`), mai dal tree principale. Rispetto a `85d1dd8`
cambia solo **4h: superato** (7 giunzioni tronco → balistico, tutte 15″; prima `circuito-4` F4 → F1
giro 2 a 0″). Caso 4 fallisce per 4l ×2 e 4n (R9c assente su questo ramo, come su `c8964ff`); caso 2
per 2c (4 Z1: il dato resta 30-30, R21 cambia il player, non il minimo; D-Q3) e 2d 7. `64180fa`
(solo R20) dà già questo esito. Con la v14: stesso conteggio (caso 4: 4l ×2 + 4n + 4o; 2d 14).

### Caso 2, storia di 2c (spostata il 2026-11-21f)

- **2026-11-12b.** S7 è approvata. L'onboarding non scrive più «non usato
  nelle sedute» ma «solo nella decompressione, non si giudica» (`2d84d87`):
  vero, ma non cambia i 30" prescritti a chi ne regge 8. Il caso resta
  FALLITO per lo stesso motivo.
- **2026-11-21d (`4d06a4b`, R21).** Il player non chiede più 30" a chi ne regge 8 («bersaglio 30″
  o finché la presa regge», tempo vero, `recordActual`), ma il dato resta 30-30 al gradino 2: 2c
  FALLITO per lettura e per costruzione. Per R1 riga 8 (soglia 36") il gradino compatibile con 8" è
  l'1. Riscrivere 2c per `recordActual` è una decisione (**D-Q3**), non una correzione dello script.

## RESULTS.md, spostato il 2026-11-21f

### Riga di misura

| 2026-11-16 | `cf7588a` (head locale non pushato, incrementale su `a747e09` in produzione): R10-R13, progressione 3.0, progressi 3.0, consigli 3.0; D-4 (a), D-19 sì · catalogo 72 · circuito 52 blocchi · griglia v3, composizione v2 confermata | PERSONAS v1, SCENARIOS v1 | 29% (2/7) | 0% (0/4)ᵖ | **33% (1/3)** rimisurato (A18) | 71% (5/7) | 67% (2/3) | 75% (3/4) | 86% (6/7) | 100% (4/4) | **5** + 4ᵖ (B12 aperto e chiuso) | 3 | 12 | 21 | 2 PASS / 4 FALLITI / 2 NON COPERTI (v7, caso 4 solo 4h) | `quality/reports/2026-11-16-quality.md` |

### Nota di misura

Verifica figure del 2026-11-21 (commit `50793fd`, incrementale su `96a90c2`): **GO per il
push** (nessun Bloccante o Alto nuovo o peggiorato); app ancora NO-GO. `19-figure` (nuovo):
264 posizioni esercizio × gradino, 35 cambiano; 27 → nessuna figura, 6 → figura proposta,
**2 sbagliata → sbagliata (M23)**, 0 giusta → sbagliata; 0 chiavi orfane, 0 collisioni.
Positivo su `96a90c2`: le 35 mostrano le figure dell'audit (sbarra, verticale libera,
elastico…). Foto `trx-row` NON COPERTA (termine 5: non guardata). Nuovi M23, M24, L33-L36.
verify (927) da me; smoke, offline dalla sessione principale (per me NON COPERTI).

### Nota di misura

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

### Voce chiusa

| M22 | Medio | Revisione e riepilogo si contraddicono sul circuito 4 oltre il tetto | 2026-11-20d (`17ea244`) | `18` M22.0-M22.5 sulla durata vera; M22.P 0 su 1.801 (C3, C3R; 38 su `fb560e7`); revisione = riferimento in due giri su 5.440 (82 diverse in produzione); M22.7 0 su 218.147. Residuo L30 |

### Voce chiusa

| B14 | Bloccante | Riquadro di calibrazione «Aggiungi 2,5 kg» senza cancelli | 2026-11-20d (`f7f945d`) | `18` B14.1 (kind delle sedute, sorgente di `SessionSummary`); simulazioni: 0 su 61.410 voci pesate (51.443 su `fb560e7`). Residui L31, L32 |

### Voce chiusa

| M24 | Medio | Shrimp squat disegnato come skater | 2026-11-21b (`c8964ff`) | `19`: nessuna figura a livello nullo e 5 |

### Voce chiusa

| M23 | Medio | Il monobraccio mostrava il disegno del gradino 6 | 2026-11-21b (`c8964ff`) | `19`: nessuna figura a livello nullo e 5, nient'altro cambiato |

### Verifica immagine

| 2026-11-12 | `exercises/pull-over-trx.svg` | **SCARTATA** | 1 · 3 · 4 · 5 | `IMAGES.md` |

### Ricalcolo

| R-16 e T-28 nel browser (build, emulatori, Chromium), `c8964ff` contro `6cbb759` | `c8964ff`: ritest senza «Quando parte», «Salva e torna alla Home» attivo, data 10-05 invariata; dopo «Azzera tutto» data nulla e primo giro come prima. `6cbb759`: data 10-05 → 11-23 | `20-ritest-r16.mjs` |

### Ricalcolo

| R-17 (9.26) col repository vero, `c8964ff` e `6cbb759` | mai salvato 1 → 2; salvato fermo; 7 esercizi su 39 esposti | `21-r17.mts` |

### Ricalcolo

| Figura visibile per esercizio × gradino (264 posizioni), `50793fd` contro `96a90c2` | 35 cambiate: 27 → nessuna, 6 → proposta, 2 sbagliata → sbagliata (M23); 0 orfane, 0 collisioni; positivo: in produzione le 35 mostrano le figure dell'audit | `19-figure.mts` |

### Voci aperte chiuse il 2026-11-21f (testo dell'ultima versione aperta)

| B9 | Bloccante (**ridotto** il 2026-11-21d, `4d06a4b`) | Decompressione Z1: dead hang al gradino 2 a chi ha misurato meno di 30" **allo stesso gradino** (P1: 8"), tutte e 4 le sedute. R1 riga 2 esclude i blocchi fuori revisione. **Dal `4d06a4b` (R21)**: bersaglio «30″ o finché la presa regge», «Ho mollato» e «Hai tenuto fino al segnale?», tempo vero nel diario, nota per scendere: la dose e il 30 «da solo» sono chiusi. **Resta il gradino**: con 8" R1 riga 8 (soglia 36") darebbe il gradino 1 («piedi che sfiorano terra»); «finché regge» per chi regge 8" è una tenuta quasi a cedimento a fine seduta, cioè quello che R21 stessa evita sopra i 30". Nucleo 2c FALLITO (il dato resta 30-30). **D-Q3** | G7, caso 2 (2c) | `engine/progression.ts` riga 2 di R1, `data/circuit.ts` Z1 | 2026-11-12 |
| L14 | Basso | Salita di gradino con la zavorra conservata: `sali-di-livello` e leva `variant` tengono `loadKg` (trazioni al 3 con 5 kg → 4 con 5 kg). Latente: con R6 la zavorra si propone solo al 6, uno stato con kg sotto il 6 viene solo da kg scritti a mano | caso 7 v6 | `engine/review.ts`, `buildSuggestion` `variant` | 2026-11-15 |
| L43 | Basso | B18 è una regola di progressione nuova (`scendi-di-livello` toglie la zavorra, anche a chi l'ha scritta a mano sotto il 6: push-up al 2 con 10 kg → 1 a 0 kg) scritta senza la specifica di training-designer; PROGRESSION_RULES non la dice. La direzione è quella di S5 e di R9b | `18` (146 casi) | `training/PROGRESSION_RULES.md`, `engine/review.ts` | 2026-11-21e |

## SAFETY_CORE.md, spostato il 2026-11-21g

### Testa della v15

Versione: **v15** · 2026-11-21f · misurata su `src/` al commit `9d7b20f` (T-37, T-38 R23, T-39) e, al contrario,
su `22f3d31` (produzione) e `85d1dd8` (prima di R21). **v15**: **2c riscritto** per i blocchi `recordActual` con la
lettura di S7 di R21 rev. (D-Q3 = a di Alessio: sei condizioni, cinque positivi; «2c-Z»); **4o esteso** a R23
(salita 3 → 4 e 5 → 6 con 5 kg, leva variante a fine seduta, gradino scritto nel diario diverso dallo stato);
**4l (d)** nuovo (T-39: ritest migliore lo stesso giorno dell'ultima seduta, «Archivia» e migrazione). La v14 su
`9d7b20f` dà 3 · 3 · 2 per costruzione (2c senza la lettura decisa). Testa della v14: `ARCHIVE-4.md`.

## Lettura dopo le decisioni del 2026-11-12

- **Soglie approvate**: i casi 2 e 4 misurano soglie vincolanti, non più
  proposte. Una violazione è un difetto Bloccante (GRID.md).
- **B1-B4 bloccano solo il rilascio pubblico.** Il caso 1 (B1) e i rimandi
  di B2-B4 si eseguono comunque per intero e si riportano per quello che sono:
  NON COPERTO o FALLITO, **mai PASS**. Il conteggio del nucleo non cambia per
  la decisione: cambia solo il peso sull'esito del rilascio a un utente.

## Fixture: la regola del 2026-11-09b (storia in `ARCHIVE-3.md`)

**Regola che ne esce, da applicare a ogni fixture futura**: una fixture si
puntella sull'**esercizio e sul rapporto con il range** (dentro / al massimo /
sopra), mai sul codice di blocco da solo. Un codice di blocco è un indirizzo,
non un'identità.

### Esito del 2026-11-21e (v14, `644bd8c`): 3 PASS · 3 FALLITI · 2 NON COPERTI

Copie `git archive`, mai dal tree principale. **Caso 4 PASS** (14 + 3 controlli: 4l a, b, c; 4n i, ii col
positivo; 4o ×4 e 9.20). Caso 2 FALLITO solo per **2c** (B9, D-Q3): **2d** 42 controlli, 42 proposte L →
atteso, positivo 7/7, nessuna proposta alla soglia. Casi 3, 6 FALLITI (B6, B8; 6b: 259 file, 0 approvati);
1 e 8 NON COPERTI; 5 e 7 PASS. La v13 su `644bd8c`: 2 · 4 · 2 (4n «gestore cambiato», 2d «va esteso»).
`7863e31` (v14): 2 · 4 · 2, caso 4 = **4l (c)** (migrazione dopo il ritest: fissato a 2) + 4n + 4o, 2d 28.
`cc95fac`: caso 4 = 4o, 2d 42. Browser (`23`, R9b nella Home): NON COPERTO.

### Storico delle esecuzioni, righe v6-v9

| Data | Versione | PASS | FALLITI | NON COPERTI | Chi |
|---|---|---|---|---|---|
| 2026-11-15 | v6 | 2 | 4 | 2 | training-quality (commit `ff42dfb`, R5-R8; caso 4 fallisce solo per 4h) |
| 2026-11-16 | v7 | 2 | 4 | 2 | training-quality (commit `cf7588a`, R10-R13; 4e su 7 giorni; caso 4 solo 4h; su `a747e09` anche S2 ×2) |
| 2026-11-20 | v8 | 2 | 4 | 2 | training-quality (commit `4edf751`, rilascio A di R14-R18; 4e sul carico sollevato, D-20 a; caso 4 solo 4h; su `001de30` anche S2, B13) |
| 2026-11-20b | v9 | 2 | 4 | 2 | training-quality (commit `221b2e8`, rilascio B1; 4e fuori dalla settimana 5 per D-21; caso 4 solo 4h; su `001de30` anche S2) |

## RESULTS.md, spostato il 2026-11-21g

### Riga di misura

| 2026-11-20 | `4edf751` (head locale non pushato, incrementale su `001de30` in produzione): rilascio A di R14-R18 (R18, R16, R17, R15, R14b), progressione 4.0, progressi 3.1, consigli 4.0, programmi 2.2; D-20 (a, b) · catalogo 72 · circuito 52 blocchi · griglia v3 | PERSONAS v1, SCENARIOS v1 | 29% (2/7) | 0% (0/4)ᵖ | 33% (1/3) (A18 chiuso, A19 aperto) | 71% (5/7) | 67% (2/3) | 75% (3/4) | 86% (6/7) | 100% (4/4) (con D5 proposta: 80%) | **5** + 4ᵖ (B13 aperto e chiuso) | 3 | 15 | 19 | 2 PASS / 4 FALLITI / 2 NON COPERTI (v8, caso 4 solo 4h) | `quality/reports/2026-11-20-quality.md` |

### Nota di misura

Misura del 2026-11-21b (commit `c8964ff`): **GO per il push** (nessun Bloccante o Alto
introdotto o peggiorato); app ancora NO-GO. `20` (nuovo, browser + emulatori): su `c8964ff`
il riepilogo di un ritest (inizio 10-05, settimana 7) non ha «Quando parte», «Salva e torna
alla Home» attivo, data invariata; dopo «Azzera tutto» la data è nulla e il primo giro torna
come prima. Su `6cbb759` la data diventa 11-23 (R-16, **B15**, chiuso). `21` (nuovo): R-17 su
tutti e due, push-up 1 → 2 (**B16**), 7 esercizi su 39 esposti. Nucleo v12 (4l, 4m). `19`:
4 posizioni in più senza figura, nient'altro. verify (929) da me.

### Voce aperta chiusa il 2026-11-21g (testo dell'ultima versione aperta)

| L42 | Basso | Gradino cambiato a mano nel `VariantPicker` di `SessionScreen`: `confirmExercise({ ...exerciseState, level })` salva subito zavorra, tempo e pausa (S5, D-23, R23). **2026-11-21f**: R23 corregge la chiusura (`syncStatesFromLog`), non lo handler; modellato in `26` 23.7b: `{6, 5 kg, +2/+2}` → 5 ⇒ `{5, 5 kg, +2″/+2″}` (atteso `{5, 0, 0, 0}`); la prova 23.7 dell'app esercita la chiusura. Latente: `SessionScreen` serve solo le sedute fuori dai circuiti | `26` 23.7b | `ui/session/SessionScreen.tsx` (`onChange` del `VariantPicker`) | 2026-11-21e |

### Voce chiusa

| B15 | Bloccante (preesistente in produzione) | R-16: il riepilogo di un ritest riscriveva la data di inizio (settimana 7 → 0), gli id `revisione-<W>:<slug>` si ripetevano e un verdetto nuovo, anche una discesa, spariva dietro una decisione vecchia | 2026-11-21b (`c8964ff`, T-28) | `20` nel browser: data invariata su `c8964ff`, 10-05 → 11-23 su `6cbb759`; `pendingVerdicts` su `6cbb759` nasconde «scendi» con l'id vecchio; nucleo 4m |

### Ricalcolo

| Nucleo v13 (4l rifatto, 4n, 2d) | `704dbfa`: caso 4 = 4h + 4n, caso 2 = 2c + 2d 14 (positivo 7/7); `c8964ff`: 4h + 4l + 4n, 2d 7 | `safety-core.mts` v13 |

### Ricalcolo

| R9c e domanda 4 sul codice, `704dbfa` contro `c8964ff` | A: `scendi-di-livello` 6 → 5 con 5 kg (S5), su tutti e due. B (9.29, 1500 storie, 4664 test): 0 salite e 0 discese con la chiusura dell'app; 1047 e 329 con quella di prima. C: ritest M=1, 0 su 7 scendono (7 su 7 prima) | `22-r9c.mts` |

### Dal nucleo (SAFETY_CORE.md), spostato il 2026-11-21h

#### Esito del 2026-11-21f (v15, `9d7b20f`): 4 PASS · 2 FALLITI · 2 NON COPERTI

Copie `git archive`, mai dal tree principale. **Caso 2 PASS** (2c-Z: 4 Z1, sei condizioni vere, la 6 dal sorgente;
positivi 5/5; 2c minima 0 casi; 2d 42/42). **Caso 4 PASS** (4l a-d, 4n, 4o i-vi). Casi 3, 6 FALLITI (B6; B8: 255 file,
0 approvati); 1 e 8 NON COPERTI; 5 e 7 PASS. **`22f3d31` (produzione) con la v15: 3 · 3 · 2**: caso 2 PASS (B9 si
chiude per decisione), caso 4 FALLITO per 4l (d) ×2 (B19) e 4o (iii)-(vi) ×7 (L14, chiusura). **`85d1dd8`** (prima di
R21): 2 · 4 · 2, 2c minima su 4 Z1 (il positivo vero di 2c). La v14 su `9d7b20f` e `22f3d31`: 3 · 3 · 2.

### Spostati da RESULTS.md il 2026-11-21h

#### Voce aperta chiusa il 2026-11-21h (testo dell'ultima versione aperta)

| B20 | Bloccante (preesistente in produzione `9c62f84`) | Dopo un cambio di gradino che porta la zavorra a 0 (`scendi-di-livello`, R9b, `sali-di-livello`, leva `variant`, selettore) il campo Peso riparte dalla volta scorsa dello stesso blocco, registrata al gradino di prima: trazioni `{5, 0 kg}` dopo il 6 a 5 kg ⇒ campo 5 kg; serie lasciate così ⇒ chiusura `{5, 5 kg}`, e da lì 5 kg proposti sotto il 6 a ogni seduta (S5, R6; limiti 1.6 R23: «sotto il 6 nessun kg prescritto dall'app»). Nello stesso giro di `SessionScreen` già dopo il selettore (27.12-27.13). Il testo del cambio dice «la zavorra si toglie» e il campo dice 5 kg | `27` 27.12-27.13, 27.16-27.20; nucleo v16 4o (viii) ×2 | `engine/draft.ts` `pesoIniziale` (usato da `GuidedSession.tsx` ~1089) e `ui/session/SessionScreen.tsx` (`kgDalloStato > 0 ? kgDalloStato : kgDalLog`): la volta scorsa vale a qualunque gradino (`lastLoggedByBlock` non lo guarda; l'etichetta sì, A11) | 2026-11-21g |

#### Paragrafo di misura

Misura del 2026-11-21c (commit `704dbfa`, R9c): **NO-GO** per la regola approvata (B17 esteso
da questo commit); decisione D-Q2 per Alessio. **B16 ridotto, non chiuso**: chiusure del player e
storia fissate (4l v13 superato; `23` nel browser: push-up `[1,0,0,0]` alla chiusura, ritest 16 ⇒
resta), ma «Archivia» dalla Home non scrive nessuno stato (4n; `23`: bulgaro 1 → 2). **B17**: dopo
un test peggiore nessun esercizio fatto scende e non c'è proposta (R9b assente): 2d 14/14 (7 su
`c8964ff`), `22` C 7/7 restano (prima 7/7 scendevano), 9.29 casuale 0 salite e 0 discese su 4664
test (1047 e 329 con la chiusura di prima). **B18** (domanda 4): `scendi-di-livello` 6 → 5 con 5 kg.
Migrazione nel browser NON COPERTA (seconda esecuzione di `23` sovrapposta a uno smoke altrui).
verify (936) da me; smoke e offline no.

#### Voce chiusa

| B10 | Bloccante | S9 violata: `circuito-4` F4 plank tocco spalla → F1 corda slam del giro 2 senza nessun passo (finitura 15" fra stazioni, 0 fra i giri) | 2026-11-21d (`4d06a4b`, non ancora rilasciato) | nucleo v13 4h superato (7 giunzioni tronco → balistico, tutte 15″; 0″ su `85d1dd8`); `24` 20.5: 0 eccezioni su 4.392 piani (settimane 1-18 × 61 stati), 3.660 sulla radice di prima; 20.2/20.3 testo e posizione dei 3.660 passi; durate +15 s (20.1, 20.7). Panoramica nel browser NON COPERTA (20.8) |

#### Ricalcolo

| R9c nel browser (build, emulatori, Chromium), `704dbfa` | chiusura dal player ⇒ push-up `[1,0,0,0]`; ritest push-up 16 ⇒ resta «Push-up su rialzo»; «Archivia» ⇒ nessuno stato, ritest ⇒ «Bulgarian split squat» (1 → 2). Bulgaro scritto a `[2,0,0,0]` dopo il ritest da uno scrittore non identificato (solo `fissaStatiMancanti` scrive così: domanda aperta). Migrazione nel ramo Firestore: NON COPERTA | `23-r9c-browser.mjs` |

#### Ricalcolo

| Nucleo v13 su `4d06a4b` e `85d1dd8` (copie `git archive`, v13 = `69d8c32`); `18` e `01` sulle due radici | nucleo 2 · 4 · 2 su tutte e due; caso 4: 4l ×2 + 4n su `4d06a4b`, 4h + 4l ×2 + 4n su `85d1dd8`. `18`: 217 OK e gli stessi 3 non OK, numeri +15″. `01`: piano +0,25′, volume uguale | `safety-core.mts` v13, `18-c.mts`, `01-durata-volume.mts` |
