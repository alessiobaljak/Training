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
