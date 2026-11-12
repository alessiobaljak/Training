# COVERAGE.md — copertura della libreria

Aggiornato al **2026-11-12** (commit `47c7f6d`). Numeri contati sul repo, non
stimati.

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
| registrate in LIBRARY.md | 307 | 174 figure + 133 righe RepDB (il 308 dei giorni scorsi era un errore di conto) |
| stato in LIBRARY.md | 25 verificate · 39 da rifare · 243 da verificare | zero approvate |
| con freccia dentro l'immagine | **0** | erano 10 (non 11: `curl-panca-inclinata` era un falso positivo), §4.1 chiusa |
| con difetto anatomico **misurato** (GENERATOR_SPEC §4.2, E1–E3) | **14** | 7 esercizi + 7 gradini; più 3 figure giuste a cui manca solo `sh` |
| con un segmento sotto l'80% del suo omologo | 120 su 174 | segnale da guardare, non scarto (§4.25) |

**Esercizi senza immagine: nessuno. Immagini orfane: nessuna.** Entrambe le
cose sono tenute ferme da `src/data/art.test.ts`, non dalla buona volontà.

## 2. Dove si concentra il rischio
**40 esercizi su 72** non hanno foto e mostrano solo la figura generata. Dei
16 arrivati con `f63c9f1`, il 2026-11-12 ne sono passati dalla checklist 5:
`hip-thrust-panca-bilaterale` e `curl-panca-inclinata` verificate; `burpee`,
`curl-trx` ed `estensione-tricipiti-trx` **da rifare**, tutte e tre in sedute
attive e senza foto. **Mai verificate: 11** — `affondi-rapidi-alternati`,
`apertura-anche`, `corda-battaglia-cerchi`, `corda-battaglia-onde-doppie`,
`corda-battaglia-slam`, `corda-per-saltare`, `curl-manubri-supino`,
`military-press-manubri`, `plank-tocco-spalla`, `plank-trascinamento-kb`,
`respirazione-360`. Da guardare per primi: `corda-per-saltare` (braccia alte
come in un jumping jack), `military-press-manubri` (due manubri che leggono
come una barra: R4), `corda-battaglia-slam` (pannello 1 frontale, pannello 2
laterale). `corda-battaglia-cerchi` disegna la traiettoria come cerchio
tratteggiato: segno d'annotazione dentro l'immagine, decisione di Alessio.

**Figure difettose che l'app mostra oggi** (sedute attive, nessuna foto):
`pull-over-trx`, `curl-trx`, `estensione-tricipiti-trx`, `burpee`,
`step-rapidi-box`, `estensione-tricipiti-sopra-testa` (più
`mobilita-anche-torace-spalle`, fuori dalle quattro sedute); nei gradini senza foto
`vertical-push-l2` `l3` `l4` `l6` e `handstand-l1` (testa fuori asse o gomito
dentro la testa). `pike-pushup-piedi-rialzati` e `negative-hspu` hanno la
stessa posa sbagliata, ma in app vince la foto RepDB.

## 3. Figure che riusano un archetipo non loro
Trovate col confronto md5 a etichetta rimossa (GENERATOR_SPEC §2). Le
specifiche §4.3, §4.4, §4.5, §4.17 e §4.19 hanno il testo in `ARCHIVE.md`.

| coppia identica | giudizio |
|---|---|
| ~~`circonduzioni-spalle` = `mobilita-anche-torace-spalle`~~ | **risolto il 2026-11-12**: archetipo `shoulder-circle` (§4.3 chiusa) |
| ~~`step-rapidi-box` = `step-up-box-alto`~~ | **risolto il 2026-11-12**: box basso e scambio dei piedi (§4.4 chiusa) |
| `rollout-trx` = `ab-wheel-o-rollout-trx` | **non suo**: la figura ha la ruota e sta in ginocchio; il TRX è sospeso e si sta in piedi → §4.5 |
| `dip-panche-o-diamond-pushup` = `push-up` | **non suo**, ma coperto: il diamond ha le mani a rombo sotto lo sterno. Vince la foto RepDB, che è giusta. Figura di ripiego da parametrizzare |
| 4 trazioni identiche (media, larga, supina, supina stretta) | **tollerato oggi**: la forma del corpo è la stessa, cambia la presa. Tutte e quattro hanno la foto giusta → §4.19 |
| `corsa-continua-piano` = `zona-2-conclusiva` | **legittimo**: stesso gesto. La zona 2 ammette anche bici e camminata, ma la corsa è il caso principale |

**Censimento del 2026-11-12**: i gruppi identici in `src/assets/exercises/`
sono **quattro** (erano sei): rollout, diamond, trazioni, corsa. Nella famiglia
hip-thrust i 9 file danno **6 md5**, uno per variante disegnabile; restano
uguali solo `hip-thrust-l3` = `posterior-chain-l1` (stessa etichetta) e
`hip-thrust-l4` = `l5` = `hip-thrust-monopodalico` (la pausa non si disegna).

## 4. Foto RepDB che non corrispondono alla scheda
Qui l'immagine non si può «rifare»: si rimappa o si ritira. In tre casi su
quattro **la figura generata è già più corretta della foto**.

| esercizio | foto in uso | cosa dice la scheda | esito |
|---|---|---|---|
| `hip-thrust-monopodalico` | `single-leg-glute-bridge` (spalle **a terra**) | «spalle su panca», cue 1 «scapole appoggiate sul bordo della panca» | la figura generata ha la panca ed è **verificata** dal 2026-11-12: **ritirare la foto**, la figura è pronta a sostituirla |
| `dip-panche-piedi-rialzati` | `bench-dips` (piedi **a terra**) | «talloni su una seconda panca» | la figura generata ha il rialzo: **ritirare la foto** |
| `rematore-inverso-trx-piedi-rialzati` | `rings-inverted-row` (anelli, piedi **a terra**) | TRX, «piedi su un rialzo, corpo orizzontale» | la figura generata ha il rialzo: **ritirare la foto**. È lo stesso motivo per cui `exercise-art.ts` aveva già scartato questa foto per il gradino `horizontal-pull-l4` |
| `face-pull-elastico` | `trx-face-pull` (**cinghie**) | «elastico fissato all'altezza del viso» | la figura generata ha l'elastico. RepDB non ha un face pull con elastico: **decisione di Alessio** (tenere la foto con l'attrezzo diverso, o passare alla figura) |

## 5. Debiti aperti
- **Schede incomplete**: nessuno dei **72** esercizi ha i campi `equipment` e
  `frames` previsti da `training/EXERCISE_SCHEMA.md` 1.0. Finché mancano,
  ogni verifica è fatta sui `cues` ed è provvisoria.
- **Tre figure di ripiego con l'attrezzo sbagliato** (GENERATOR_SPEC §4.17).
- **11 figure nuove mai verificate** (§2 qui sopra).
- **14 figure con la testa fuori asse, un giunto dentro la testa o braccia
  senza spalle** (GENERATOR_SPEC §4.2), di cui 10 senza foto RepDB davanti.
- **Proporzioni mai controllate**: 120 figure su 174 con almeno un segmento
  sotto l'80% del suo omologo (GENERATOR_SPEC §4.25, R9).
- **Nessun esercizio ha tre fotogrammi**, nemmeno swing, nordic curl e sissy
  squat, dove è il punto intermedio a essere sbagliato (STYLE_GUIDE §3).
