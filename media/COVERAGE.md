# COVERAGE.md — copertura della libreria

Aggiornato al **2026-11-09**. Numeri contati sul repo, non stimati.

## 1. Conti
| | quante | note |
|---|---|---|
| esercizi in anagrafica | **72** | erano 56: +16 con il commit `f63c9f1` |
| esercizi con figura schematica | 72 | una per slug, nessuna mancante |
| esercizi con foto RepDB | 32 | invariato: i 16 nuovi non ne hanno |
| esercizi che vedono **solo** la figura generata | **40** | erano 24 |
| gradini nelle scale | 102 | tutti con figura, 39 con foto |
| file RepDB nel repo | 91 | tutti usati (lo verifica un test) |
| file SVG nel repo | **174** | 72 esercizi + 102 gradini |
| registrate in LIBRARY.md | 308 | tutte |
| con freccia dentro l'immagine | **11** | erano 8: §4.1 non è stata fatta e i nuovi archetipi chiamano `arrowUp` |

**Esercizi senza immagine: nessuno. Immagini orfane: nessuna.** Entrambe le
cose sono tenute ferme da `src/data/art.test.ts`, non dalla buona volontà.

## 2. Dove si concentra il rischio
Il rischio è raddoppiato: **40 esercizi su 72** non hanno foto e mostrano solo
la figura generata. I 16 arrivati con `f63c9f1` sono tutti lì, e 15 di loro
**non sono mai passati dalla checklist** (registrati `da verificare` il
2026-11-09). Primo sguardo di gruppo a 215 px: nessuno riusa l'archetipo di un
altro (md5 tutti distinti, ognuno ha il suo archetipo), ma quattro vanno
guardati per davvero — `corda-per-saltare` (braccia alte come in un jumping
jack invece che basse all'anca), `military-press-manubri` (i due manubri in
alto leggono come una barra: R4), `curl-panca-inclinata` (freccia dentro
l'immagine) e `burpee` (freccia, e due pannelli per un gesto in quattro
tempi). `corda-battaglia-cerchi` disegna la traiettoria come cerchio
tratteggiato: è un segno d'annotazione dentro l'immagine, da decidere con
Alessio se vale la regola delle frecce.

## 3. Figure che riusano un archetipo non loro
Trovate col confronto md5 a etichetta rimossa (GENERATOR_SPEC §2). Le
specifiche §4.3, §4.4, §4.5, §4.17 e §4.19 hanno il testo in `ARCHIVE.md`.

| coppia identica | giudizio |
|---|---|
| `circonduzioni-spalle` = `mobilita-anche-torace-spalle` | **non suo**: sono due gesti diversi nello stesso riscaldamento → §4.3 |
| `step-rapidi-box` = `step-up-box-alto` | **non suo**: box alto contro gradino basso, lavoro di forza contro metabolico → §4.4 |
| `rollout-trx` = `ab-wheel-o-rollout-trx` | **non suo**: la figura ha la ruota e sta in ginocchio; il TRX è sospeso e si sta in piedi → §4.5 |
| `dip-panche-o-diamond-pushup` = `push-up` | **non suo**, ma coperto: il diamond ha le mani a rombo sotto lo sterno. Vince la foto RepDB, che è giusta. Figura di ripiego da parametrizzare |
| 4 trazioni identiche (media, larga, supina, supina stretta) | **tollerato oggi**: la forma del corpo è la stessa, cambia la presa. Tutte e quattro hanno la foto giusta → §4.19 |
| `corsa-continua-piano` = `zona-2-conclusiva` | **legittimo**: stesso gesto. La zona 2 ammette anche bici e camminata, ma la corsa è il caso principale |

**Censimento del 2026-11-09**: i gruppi identici in `src/assets/exercises/`
restano **sei**. `hip-thrust-panca-bilaterale` non ne apre un settimo: è
l'unico file della libreria con quel md5. Il duplicato vero sta un piano sotto
e nessuno l'aveva contato: **8 file identici** nei gradini —
`hip-thrust-l1..l6`, `posterior-chain-l1` e `hip-thrust-monopodalico` sono lo
stesso disegno, e due di quelle etichette dicono «due gambe» (GENERATOR_SPEC
§4.18).

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
- **Schede incomplete**: nessuno dei **72** esercizi ha i campi `equipment` e
  `frames` previsti da `training/EXERCISE_SCHEMA.md` 1.0. Finché mancano,
  ogni verifica è fatta sui `cues` ed è provvisoria.
- **Tre figure di ripiego con l'attrezzo sbagliato** (GENERATOR_SPEC §4.17).
- **Una freccia dentro 11 immagini** (GENERATOR_SPEC §4.1), tre in più di ieri.
- **15 figure nuove mai verificate** (§2 qui sopra).
- **Tre gradini «a terra» disegnati con la panca** (GENERATOR_SPEC §4.18).
- **Nessun esercizio ha tre fotogrammi**, nemmeno swing, nordic curl e sissy
  squat, dove è il punto intermedio a essere sbagliato (STYLE_GUIDE §3).
