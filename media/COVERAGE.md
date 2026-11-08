# COVERAGE.md — copertura della libreria

Aggiornato al **2026-11-08**. Numeri contati sul repo, non stimati.

## 1. Conti
| | quante | note |
|---|---|---|
| esercizi in anagrafica | 56 | `src/data/exercises.ts` |
| esercizi con figura schematica | 56 | una per slug, nessuna mancante |
| esercizi con foto RepDB | 32 | la foto vince sulla figura (`ExerciseArt.tsx`) |
| esercizi che vedono la figura generata | **24** | i 56 meno i 32 con foto |
| gradini nelle scale | 102 | tutti con figura |
| gradini con foto RepDB | 39 | |
| file RepDB nel repo | 91 | tutti usati (lo verifica un test) |
| file SVG nel repo | 158 | 56 esercizi + 102 gradini |

**Esercizi senza immagine: nessuno. Immagini orfane: nessuna.** Entrambe le
cose sono tenute ferme da `src/data/art.test.ts`, non dalla buona volontà.

## 2. Dove si concentra il rischio
I **16 esercizi del programma a circuito** (commit `fa15233`) hanno
`pattern: null` e **nessuna foto RepDB**: `artFor()` restituisce sempre la
figura dell'esercizio, quindi quello che l'atleta vede è **solo** la figura
generata. Sono anche i più giovani e i meno guardati. È lì che è stata fatta
la verifica di oggi.

## 3. Figure che riusano un archetipo non loro
Trovate col confronto md5 a etichetta rimossa (GENERATOR_SPEC §2).

| coppia identica | giudizio |
|---|---|
| `circonduzioni-spalle` = `mobilita-anche-torace-spalle` | **non suo**: sono due gesti diversi nello stesso riscaldamento → §4.3 |
| `step-rapidi-box` = `step-up-box-alto` | **non suo**: box alto contro gradino basso, lavoro di forza contro metabolico → §4.4 |
| `rollout-trx` = `ab-wheel-o-rollout-trx` | **non suo**: la figura ha la ruota e sta in ginocchio; il TRX è sospeso e si sta in piedi → §4.5 |
| `dip-panche-o-diamond-pushup` = `push-up` | **non suo**, ma coperto: il diamond ha le mani a rombo sotto lo sterno. Vince la foto RepDB, che è giusta. Figura di ripiego da parametrizzare |
| 4 trazioni identiche (media, larga, supina, supina stretta) | **tollerato oggi**: la forma del corpo è la stessa, cambia la presa. Tutte e quattro hanno la foto giusta → §4.19 |
| `corsa-continua-piano` = `zona-2-conclusiva` | **legittimo**: stesso gesto. La zona 2 ammette anche bici e camminata, ma la corsa è il caso principale |

## 4. Foto RepDB che non corrispondono alla scheda
Qui l'immagine non si può «rifare»: si rimappa o si ritira. In tre casi su
quattro **la figura generata è già più corretta della foto**.

| esercizio | foto in uso | cosa dice la scheda | esito |
|---|---|---|---|
| `hip-thrust-monopodalico` | `single-leg-glute-bridge` (spalle **a terra**) | «spalle su panca», cue 1 «scapole appoggiate sul bordo della panca» | la figura generata ha la panca: **ritirare la foto** |
| `dip-panche-piedi-rialzati` | `bench-dips` (piedi **a terra**) | «talloni su una seconda panca» | la figura generata ha il rialzo: **ritirare la foto** |
| `rematore-inverso-trx-piedi-rialzati` | `rings-inverted-row` (anelli, piedi **a terra**) | TRX, «piedi su un rialzo, corpo orizzontale» | la figura generata ha il rialzo: **ritirare la foto**. È lo stesso motivo per cui `exercise-art.ts` aveva già scartato questa foto per il gradino `horizontal-pull-l4` |
| `face-pull-elastico` | `trx-face-pull` (**cinghie**) | «elastico fissato all'altezza del viso» | la figura generata ha l'elastico. RepDB non ha un face pull con elastico: **decisione di Alessio** (tenere la foto con l'attrezzo diverso, o passare alla figura) |

## 5. Debiti aperti
- **Schede incomplete**: nessuno dei 56 esercizi ha i campi `equipment` e
  `frames` previsti da `training/EXERCISE_SCHEMA.md` 1.0. Finché mancano,
  ogni verifica è fatta sui `cues` ed è provvisoria.
- **Tre figure di ripiego con l'attrezzo sbagliato** (GENERATOR_SPEC §4.17).
- **Una freccia dentro 8 immagini** (GENERATOR_SPEC §4.1).
- **Tre gradini «a terra» disegnati con la panca** (GENERATOR_SPEC §4.18).
- **Nessun esercizio ha tre fotogrammi**, nemmeno swing, nordic curl e sissy
  squat, dove è il punto intermedio a essere sbagliato (STYLE_GUIDE §3).
