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
