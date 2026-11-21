# ARCHIVE-3.md — voci spostate dai file principali (dal 2026-11-21)

## Verifiche tecniche delle immagini, spostate da RESULTS.md il 2026-11-21

| Data | Immagine | Esito | Punti con PROBLEMA | Dettaglio |
|---|---|---|---|---|
| 2026-11-12 | `exercises/hip-thrust-panca-bilaterale.svg` | nessun problema, **non inoltrabile**: manca la verifica di `exercise-media-lead`, scheda incompleta (M7) | — | `IMAGES.md` |
| 2026-11-12 | `exercises/hip-thrust-monopodalico.svg` | nessun problema, non inoltrabile; l'app mostra la foto RepDB (archetipo sbagliato) | — | `IMAGES.md` |
| 2026-11-12 | `steps/hip-thrust-l1.svg` | nessun problema, non inoltrabile; l'app mostra la foto RepDB | — (nota sulla spec §4.21) | `IMAGES.md` |
| 2026-11-12 | `steps/hip-thrust-l2.svg` | nessun problema, non inoltrabile | — | `IMAGES.md` |

## Ricalcoli indipendenti, spostati da RESULTS.md il 2026-11-21

| Metrica | Esito | Script |
|---|---|---|
| Nucleo v7 (4e su 7 giorni, 4b R10a) contro `a747e09` | S2 ×2 (+5 kg in 3 giorni, +5 kg nello stesso giorno), R10a, S9: le fixture nuove discriminano; su `cf7588a` solo S9 | `safety-core.mts` v7 (copia con `git archive`) |

## SAFETY_CORE.md, testa della v11 ed esito del 2026-11-20d e 2026-11-21 (spostati il 2026-11-21b)

Versione: **v11** · 2026-11-20d · misurato su `src/` al commit `f7f945d`
(head locale, rilascio C). **v11: 4k nuovo (R-14)**: la revisione riceve la durata
come in Home e nella schermata Revisione (`durataDellaSedutaDi`, M22). Circuito 4
sotto il tetto, military press `{10, +1″, 0}` e dip su panche al gradino 1 con i
passi di tempo e pausa oltre 55′: manubrio 10 → 12 esatto (S2 sui manubri, D-19 b),
niente zavorra con la variante aperta (S5). Se la military press non arriva al
manubrio la fixture non misura e il caso fallisce. Provato al contrario: su
`fb560e7` 4k non misura (la revisione dice ancora «tempo»); su `f7f945d` solo S9.
v10 (`0d85597`): 4j, R-7. Note di v10 e precedenti: `ARCHIVE-2.md`.

## Esito del 2026-11-20d (v11, `f7f945d`): 2 PASS · 4 FALLITI · 2 NON COPERTI

Conteggio invariato, identico su `fb560e7` con la v10. Caso 4 fallisce **solo per
4h** (S9, B10): 4j e il nuovo 4k superati; su `fb560e7` il 4k non misura (positivo).
Casi 2, 3, 6 FALLITI (B9, B6, B8); 1 e 8 NON COPERTI; 5 e 7 PASS (nessun campo di
testo nel codice nuovo: `DEVIAZIONI_NOTA` è testo dell'app). B14 è chiuso nei
circuiti (`18`: 0 su 61.410 voci pesate); il residuo sulle sedute archiviate (L31)
non entra nel nucleo finché training-designer non decide.

**2026-11-21 (`50793fd`, solo figure):** stesso conteggio, identico su `96a90c2`. Caso 6
non peggiora: 261 file nel bundle (265), 0 approvati, 0 non registrati; 6a verificato.

## Voci chiuse, spostate da RESULTS.md il 2026-11-21b

| ID | Grav. | Titolo | Chiusa il | Verifica di chiusura |
|---|---|---|---|---|
| L2 | Basso | `syncStatesFromLog` azzerava un manubrio senza kg | 2026-11-20c | `17` b.8; sync = testo su 20.000 ingressi (200 diversi su `e30cdc6`) |
| L23 | Basso | R15 senza «date ≤ oggi»: una seduta datata dopo oggi faceva sparire l'aumento da R13 | 2026-11-20b (`221b2e8`) | `16` 15.16 (date originali, dal 30 marzo), 15.16′, 15.17, 15.18; 15.19 (b) 0 su 128.653, (a) 0 su 133.507; A 0, B 0. Su `59daf79`: A 35, B 33 |
| L24 | Basso | Gradino della seduta: prima voce, ultima voce, peso massimo | 2026-11-20b | `16` 24.1-24.5 (fixture a due voci), 24.6 0 su 40.550 fine seduta, 24.6a sui 4 circuiti; su `59daf79` 24.1-24.3, 24.5 falliscono |

## Ricalcoli, spostati da RESULTS.md il 2026-11-21b

| Metrica | Esito | Script |
|---|---|---|
| Nucleo v8 (4e sul carico sollevato) contro `001de30` | S2 il 03-30 + S9: la fixture nuova discrimina; su `4edf751` solo S9 | `safety-core.mts` v8 |
| R10-R13, riferimento scritto dal testo di R10-R13, commit `cf7588a` | **coincide**: 259.782 esiti su 80.000 revisioni (categoria, motivo, stato dopo, `sessionsCounted`, `setsCounted`); 52/52 righe della specifica; 0 violazioni S3/S4/S5/E4/R10a/R10b/R10c/R12/R13/10.P/R11; 400 atleti simulati: 13.P 0, S1 0, S2 0. Su `a747e09`: 45.672 differenze, 6.273 violazioni, 13.P 2.889, S2 739 | `14-r10-r13.mts` |

## SAFETY_CORE.md, spostato il 2026-11-21c (v13)

### Testa della v12 (spostata il 2026-11-21c)

Versione: **v12** · 2026-11-21 · misurato su `src/` al commit `c8964ff` (head locale,
T-28 e figure). **v12: 4l (R-17)** — un test non alza il gradino di uno stato mai salvato
(9.26: push-up M=10, sei chiusure allo stesso livello, ritest M=16; controllo con lo stato
salvato); **4m (R-16)** — un ritest non riscrive la data di inizio (`chiusuraDelGiro`; il
collegamento nel browser lo misura `20`). Provato al contrario su `6cbb759`: 4l e 4m
falliscono; su `c8964ff` fallisce solo 4l. v11 (`f7f945d`): 4k, R-14. Note: `ARCHIVE-3.md`.

### Fixture ripuntate il 2026-11-09b (tabella spostata il 2026-11-21c)

La trascrizione della scheda (`f63c9f1`) ha cambiato esercizio a **33 codici di
blocco su 36** e ne ha eliminati 12 (`C1`, `C2`, `D` di tutte e quattro). Le
fixture del nucleo erano puntate ai codici, non agli esercizi, e il risultato è
stato peggiore di un fallimento: lo script **andava in crash** su
`circuito-2/C1`, e una volta tolto il crash dichiarava **2 soglie superate
invece di 4**, perché `review.ts:131` scarta in silenzio l'entrata registrata il
cui esercizio non coincide con quello del blocco. Due difetti aperti (A3 e A4)
sarebbero spariti dal rapporto senza che nessuna regola li avesse corretti.

| caso | prima | adesso | perché |
|---|---|---|---|
| 4a | `circuito-2/B1` rematore-inverso-trx | `circuito-2/A3` | l'esercizio si è spostato di blocco |
| 4b | `circuito-1/A1` 10-10-10 | `circuito-1/A1` **8-8-8** | il range è passato da 6-10 a 6-8: la fixture deve restare «massimo del range chiuso esatto», non «sopra il range» |
| 4c | `circuito-2/B2` sissy-squat | `circuito-3/A2` **push-up** | sissy-squat non è più in nessuna seduta |
| 4d | `circuito-4/A2` single-leg-rdl | `circuito-1/A2` bulgarian-split-squat | single-leg-rdl non è più in nessuna seduta |
| 4e | `circuito-2/C1` | `circuito-1/A1` | il codice `C1` non esiste più |
| 4f | `circuito-1/F3` kb-swing | `circuito-1/F1` | lo swing si è spostato di stazione |
| 3 | mappa attrezzi con 21 voci | **40 voci** | i 16 esercizi nuovi non erano nella mappa e la misura sottostimava: 32/48 → 37/52 |

### Esito del 2026-11-21b (v12, `c8964ff`): 2 PASS · 4 FALLITI · 2 NON COPERTI

Conteggio invariato. Caso 4 fallisce per **4h** (S9, B10) e per il nuovo **4l** (S1/S3,
R-17, B16: push-up 1 → 2 dopo un ritest, senza R5 né R7). 4m superato (R-16 chiuso da
T-28). Su `6cbb759` (= produzione per `src/`): 4h, 4l **e 4m**. Casi 2, 3, 6 FALLITI (B9,
B6, B8; caso 6: 261 file, 0 approvati); 1 e 8 NON COPERTI; 5 e 7 PASS (T-28 non aggiunge
campi di testo).

### Storico del nucleo, righe v1-v5 (spostate il 2026-11-21c)

| Data | Versione | PASS | FALLITI | NON COPERTI | Chi |
|---|---|---|---|---|---|
| 2026-11-08 | v1 | 2 | 3 | 3 | training-quality (baseline) |
| 2026-11-09 | v2 | 2 | 2 | 4 | training-quality (commit `1802631`) |
| 2026-11-09b | v3 | 2 | 2 | 4 | training-quality (commit `f63c9f1`, 5 fixture ripuntate) |
| 2026-11-12 | v4 | 2 | 3 | 3 | training-quality (commit `47c7f6d`) |
| 2026-11-12b | v5 | 2 | 4 | 2 | training-quality (commit `90b8b81`, soglie approvate; caso 6 eseguibile su LIBRARY.md) |

## RESULTS.md, spostato il 2026-11-21c

### Misure, righe dal 2026-11-08 al 2026-11-12b (spostate il 2026-11-21c)

| Data | Regole / catalogo | Set | C1 Sic. | C2 Rim. | C3 Fed. | C4 Coer. | C5 Pers. | C6 Concr. | C7 Progr. | C8 Dur. | Bloc. | Alti | Medi | Bassi | Nucleo | Rapporto |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-12b | `90b8b81` (incrementale su `47c7f6d`: `2d84d87` A11-A14 e onboarding, `90b8b81` A11) · catalogo 72 · circuito 52 blocchi · **soglie approvate**, griglia v3 | PERSONAS v1, SCENARIOS v1 | 0% (0/7) | 0% (0/4)ᵖ | 33% (1/3) | **29% (2/7)** v3 | 67% (2/3) | 75%* | **86% (6/7)** v3 | 100% (4/4) | **10** + 4ᵖ | 3 | 11 | 13 | 2 PASS / **4 FALLITI** / 2 NON COPERTI | `quality/reports/2026-11-12-quality-90b8b81.md` |
| 2026-11-12 | engine e dati al commit `47c7f6d` (R1, R2, R3, player guidato) · catalogo 72 · circuito 52 blocchi | PERSONAS v1, SCENARIOS v1 | **0% (0/7)**† | 0% (0/4) | 33% (1/3) | 33% (2/6) · v3 43% (3/7) | 67% (2/3) | 75%* | **100% (6/6)** | 100% (4/4) | 7 | 8 | 13 | 10 | 2 PASS / **3 FALLITI** / 3 NON COPERTI | `quality/reports/2026-11-12-quality.md` |
| 2026-11-09b | catalogo 72 esercizi · circuito 52 blocchi · engine al commit `f63c9f1` | PERSONAS v1, SCENARIOS v1 | 14% (1/7) | 0% (0/4) | 33% (1/3) | 33% (2/6) | 67%* | 75%* | 83% (5/6) | 100% (4/4) | 8 | 8 | 13 | 6 | 2 PASS / 2 FALLITI / 4 NON COPERTI | `quality/reports/2026-11-09-quality-circuito.md` |
| 2026-11-09 | stesso catalogo · engine al commit `1802631` | PERSONAS v1, SCENARIOS v1 | 14% (1/7) | 0% (0/4) | 67% (2/3) | 33% (2/6) | 67% (2/3) | 75% (3/4) | 83% (5/6) | 100% (4/4) | 6 | 4 | 8 | 4 | 2 PASS / 2 FALLITI / 4 NON COPERTI | `quality/reports/2026-11-09-quality.md` |
| 2026-11-08 | `circuit.ts` 4 circuiti, 56 esercizi, 13 scale · engine al 2026-11-08 | PERSONAS v1 (11 persone), SCENARIOS v1 (30 scenari) | 14% (1/7) | 0% (0/4) | 67% (2/3) | 43% (3/7) | 50% (1/2) | 50% (2/4) | 67% (4/6) | 100% (4/4) | 6 | 7 | 7 | 2 | 2 PASS / 3 FALLITI / 3 NON COPERTI | `quality/reports/2026-11-08-quality.md` |

### Nota della misura del 2026-11-20b (spostata il 2026-11-21c)

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

### Ricalcoli, spostati da RESULTS.md il 2026-11-21c

| Metrica | Esito | Script |
|---|---|---|
| B1 dal testo dell'appendice 2026-11-20 + D-21 a, D-22 a, D-23 a, commit `221b2e8` | F 151/153 = atteso (R19.R = M22, Q5 = M18); A 0 su 259.782; B 0; 15.19 0; 16.P 0; C/C2/C2R 18 settimane: 13.P, S2, E7, S1 all'esecuzione, 24.6, leve W5-6 a 0; C3 R19 σ′ 0, S5 0, L25 7, M22 54 + 66. Su `59daf79`: F 26, A 35, B 33, W5-6 2.590 | `16-b1.mts` |
| Nucleo v9 (4e spostato a W8-W10, fuori da D-21) | `221b2e8` e `59daf79`: solo S9; `001de30`: S2 il 05-04 (la fixture discrimina). Con la v8 su `221b2e8`: «positivo mancato» per D-21 | `safety-core.mts` v9 |
| R14b, R15, R16, R17, R18 dal testo della specifica 2026-11-18 + D-20, commit `4edf751` | F 106 righe su 107 = atteso (Q5 = M18 resta aperto); A 0 differenze su 259.782 esiti; B 1 (L23); C + C2 800 atleti: 13.P, S1, E7 0, R13 di fine seduta = riferimento; R14b 226 proposte tolte, 0 allo stato; R-6 durate. Su `001de30`: F 41, A 64, E7 36, 237 leve fuori stato | `15-r14-r18.mts` |
