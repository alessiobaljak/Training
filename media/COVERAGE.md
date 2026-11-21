# COVERAGE.md — copertura della libreria

Aggiornato al **2026-11-21, sera** (`88da16a`): registro allineato al codice dopo `50793fd`, `c8964ff`, `3b548e4` (R12); fonte 3 aperta (rapporto `reports/2026-11-21-media-generate.md`). Mattina: controllo dell'attrezzo sui 4 circuiti (`reports/2026-11-21-media.md`).
Numeri contati sul repo, non stimati.

## 1. Conti
| | quante | note |
|---|---|---|
| esercizi in anagrafica | **72** | erano 56: +16 con il commit `f63c9f1` |
| esercizi con figura schematica | 72 | una per slug, nessuna mancante |
| esercizi con foto RepDB | **26** | erano 32: 6 voci tolte dalla sessione principale il 2026-11-21 (R11), 1 rimappata (`rematore-inverso-trx` → `trx-row`) |
| esercizi che vedono **solo** la figura generata | **38** | più **8 senza nessuna immagine** (`FIGURE_SENZA_IMMAGINE`) |
| gradini nelle scale | 102 | 35 con foto, 55 con la sola figura, 12 senza nessuna immagine |
| file RepDB nel repo | **85** | erano 91: 6 file tolti perché senza usi (termine 3); tutti gli 85 usati |
| file SVG nel repo | **174** | 72 esercizi + 102 gradini |
| registrate in LIBRARY.md | 309 | 174 figure + 135 righe RepDB (+2 `trx-row` per `rematore-inverso-trx`) |
| stato in LIBRARY.md | 25 verificate · 36 da rifare · 206 da verificare · **42 ritirate** | zero approvate; le 42 ritirate sono immagini che l'app non mostra più (R12) |
| con freccia dentro l'immagine | **0** | erano 10 (non 11: `curl-panca-inclinata` era un falso positivo), §4.1 chiusa |
| con difetto anatomico **misurato** (GENERATOR_SPEC §4.2, E1–E3) | **14** | 7 esercizi + 7 gradini; più 3 figure giuste a cui manca solo `sh` |
| con un segmento sotto l'80% del suo omologo | 120 su 174 | segnale da guardare, non scarto (§4.25) |

**Esercizi senza immagine: 8, gradini: 12** — per scelta (`FIGURE_SENZA_IMMAGINE`, 20 chiavi: meglio niente che un'immagine sbagliata). **Immagini orfane: nessuna.** Entrambe le
cose sono tenute ferme da `src/data/art.test.ts`, non dalla buona volontà.

## 2. Dove si concentra il rischio
**46 esercizi su 72** non hanno foto (2026-11-21 sera): 38 mostrano la figura generata, 8 nessuna immagine. Alessio ha rifiutato le figure («non voglio gli omini»): la copertura vera arriva dalla fonte 3 (§6). Dei
16 arrivati con `f63c9f1`, il 2026-11-12 ne sono passati dalla checklist 5:
`hip-thrust-panca-bilaterale` e `curl-panca-inclinata` verificate; `burpee`,
`curl-trx` ed `estensione-tricipiti-trx` **da rifare**, tutte e tre in sedute
attive e senza foto. Il 2026-11-18 altre 3 **da rifare**: `military-press-manubri`
(R3, R4: §4.26), `plank-tocco-spalla` (manca il braccio d'appoggio, R3: §4.28),
`respirazione-360` (R10: §4.27); e `hollow-hold`, `core-l1…l3` (R10, R1:
§4.27), dei quali solo `core-l2` si vede in app.
**Mai verificate: 8** — `affondi-rapidi-alternati`, `apertura-anche`,
`corda-battaglia-cerchi`, `corda-battaglia-onde-doppie`, `corda-battaglia-slam`,
`corda-per-saltare`, `curl-manubri-supino`, `plank-trascinamento-kb`. Da
guardare per primi: `corda-per-saltare` (braccia alte come in un jumping
jack), `corda-battaglia-slam` (pannello 1 frontale, pannello 2 laterale),
`plank-trascinamento-kb` (anche qui un braccio solo nel pannello 2?).
`corda-battaglia-cerchi` disegna la traiettoria come cerchio tratteggiato: segno d'annotazione dentro l'immagine, decisione di Alessio.

**Figure difettose che l'app mostra oggi** (sedute attive, nessuna foto):
`pull-over-trx`, `curl-trx`, `estensione-tricipiti-trx`, `burpee`,
`step-rapidi-box`, `estensione-tricipiti-sopra-testa`, e dal 2026-11-18
`military-press-manubri`, `plank-tocco-spalla`, `respirazione-360` (più
`mobilita-anche-torace-spalle`, fuori dalle quattro sedute); nei gradini senza foto
`vertical-push-l2` `l3` `l4` `l6` e `handstand-l1` (testa fuori asse o gomito
dentro la testa), `core-l2` (R1, R10). `pike-pushup-piedi-rialzati` e `negative-hspu` hanno la
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
| `hang-l1` = `l2` = `l3` = `l4` = `l5` = `l6` (2026-11-21) | **non suo** per 5 su 6: piedi a terra (l1), trave a pinza (l3), una mano (l4–l6), asciugamano (l6). Solo `hang-l2` è giusto, e in app vince la foto |
| `single-leg-squat-l4` = `l5` (2026-11-21) | **non suo** per lo shrimp: manca la mano che tiene il piede dietro |
| `hollow-hold` = `core-l1` = `core-l2` = `core-l3` (2026-11-18) | **non suo** per `core-l1` (plank sugli avambracci) e `core-l2` (ginocchia piegate; senza foto, si vede in app); legittimo per `core-l3`. Tutti e quattro sospesi sopra il pavimento (R10) → §4.27 |

**Censimento del 2026-11-12**: i gruppi identici in `src/assets/exercises/`
sono **quattro** (erano sei): rollout, diamond, trazioni, corsa. Nella famiglia
hip-thrust i 9 file danno **6 md5**, uno per variante disegnabile; restano
uguali solo `hip-thrust-l3` = `posterior-chain-l1` (stessa etichetta) e
`hip-thrust-l4` = `l5` = `hip-thrust-monopodalico` (la pausa non si disegna).

## 4. Foto RepDB che non corrispondono alla scheda
Qui l'immagine non si può «rifare»: si rimappa o si ritira. Erano 12 il
2026-11-21 mattina; **la sessione principale ne ha applicate 10** lo stesso
giorno (`50793fd`, `c8964ff`, `3b548e4`): ritirate o rimappate, e «nessuna
immagine» ora esiste (`FIGURE_SENZA_IMMAGINE`). **Restano aperte 2**:
`hip-thrust-monopodalico` e `face-pull-elastico`. Un file RepDB che resta
senza voce va tolto dal repo (termine 3 e test «mai usate»). La tabella resta
come storia; la colonna «esito» dice cosa è stato fatto.

| esercizio | foto in uso | cosa dice la scheda | esito |
|---|---|---|---|
| `hip-thrust-monopodalico` | `single-leg-glute-bridge` (spalle **a terra**) | «spalle su panca», cue 1 «scapole appoggiate sul bordo della panca» | la figura generata ha la panca ed è **verificata** dal 2026-11-12: **ritirare la foto**, la figura è pronta a sostituirla |
| `dip-panche-piedi-rialzati` | `bench-dips` (piedi **a terra**) | «talloni su una seconda panca» | la figura generata ha il rialzo: **ritirare la foto** — **applicato in `50793fd`** |
| `rematore-inverso-trx-piedi-rialzati` | `rings-inverted-row` (anelli, piedi **a terra**) | TRX, «piedi su un rialzo, corpo orizzontale» | la figura generata ha il rialzo: **ritirare la foto**. È lo stesso motivo per cui `exercise-art.ts` aveva già scartato questa foto per il gradino `horizontal-pull-l4` — **applicato in `3b548e4`, file tolti** |
| `rematore-inverso-trx` (2026-11-21) | `inverted-row` (**sbarra**) | TRX, «maniglie a larghezza spalle», gradino 2 «TRX a 45°» | **rimappare a `trx-row`**; se il designer conferma la nota «agli anelli» di circuito-2 A3, `rings-inverted-row` — **applicato in `50793fd` (`trx-row`); la nota «agli anelli» è ancora aperta (rapporto 2026-11-21-media-generate, punto 5)** |
| `pike-pushup-piedi-rialzati` (2026-11-21) | `pike-push-ups` (piedi **a terra**) | «piedi su un rialzo» | ritirare dalla voce (resta su `vertical-push-l1`); la SVG ha il rialzo ma è da rifare (§4.2) — **applicato in `50793fd`: nessuna immagine** |
| `bulgarian-split-squat` (2026-11-21) | `bulgarian-split-squat` (**manubri ai fianchi**) | nota circuito-1 A2: kettlebell in rack, «meglio di due manubri ai fianchi» | **decisione del designer**: nota o immagine; la SVG ha la panca e nessun carico — **applicato in `50793fd`: foto tolta dalla voce, resta la SVG** |
| `vertical-pull-l1` (2026-11-21) | `band-assisted-pull-ups` (**elastico**) | nota circuito-1 A1 al gradino 1: «un piede appoggiato sul box» | **decisione del designer**; la SVG non mostra nessuna assistenza — **applicato in `50793fd`: nessuna immagine, file tolti** |
| `dip-l1` (2026-11-21) | `bench-dips` (una panca, piedi a terra) | «Dip tra due panche» | ritirare; la SVG `dip-l1` ha lo stesso difetto, quella giusta è `dip-panche-piedi-rialzati.svg` — **applicato in `50793fd`: nessuna immagine** |
| `vertical-push-l5` (2026-11-21) | `handstand-push-ups` (**parallette, nessun muro**) | «HSPU al muro complete» | ritirare; la SVG ha il muro ma è da rifare (§4.2). Stessa foto su `negative-hspu-muro-o-pike-pushup`, fuori dai circuiti — **applicato in `50793fd`: nessuna immagine, file tolti** |
| `horizontal-pull-l3` (2026-11-21) | `trx-row` (TRX a **~45°**) | «Rematore TRX orizzontale» | spostare la foto su `rematore-inverso-trx`; la SVG `l3` è identica a `l1`/`l2` (stesso angolo) — **applicato in `50793fd`: nessuna immagine** |
| `rematore-trx-monobraccio` (2026-11-21, fuori circuiti) | `trx-row` (**due mani**) | «una maniglia sola» | ritirare; la SVG di ripiego ha i piedi sul rialzo, da verificare — **applicato in `c8964ff`: nessuna immagine** |
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

## 6. Fonte 3 — foto generate da testo (dal 2026-11-21)
**Da coprire per primi: i 32 esercizi delle 4 sedute attive senza foto**
(contati su `CIRCUIT_SESSIONS` e `REPDB_ART`, 39 esercizi distinti, 7 con foto):
`bulgarian-split-squat`, `curl-martello-manubri`, `estensione-tricipiti-sopra-testa`*,
`suitcase-carry`, `kb-swing`, `corda-battaglia-onde-alternate`, `step-rapidi-box`,
`corda-battaglia-slam`, `apertura-anche`, `respirazione-360`,
`pike-pushup-piedi-rialzati`*, `stacco-rumeno-manubri`*, `curl-manubri-supino`*,
`pallof-press-elastico`, `burpee`, `corda-per-saltare`, `affondi-rapidi-alternati`,
`corda-battaglia-onde-doppie`, `goblet-squat`, `pull-over-trx`, `curl-trx`,
`estensione-tricipiti-trx`, `mountain-climber`, `corda-battaglia-cerchi`,
`hip-thrust-panca-bilaterale`, `rematore-manubrio-un-braccio`,
`military-press-manubri`, `curl-panca-inclinata`, `dip-panche-piedi-rialzati`,
`plank-trascinamento-kb`, `jumping-jack`, `plank-tocco-spalla`.
(* oggi senza nessuna immagine.) Ai 32 si aggiungono i gradini senza foto
che le sedute raggiungono, da contare quando il designer chiude T-34.

**Pilota**: `kb-swing` (T2), `corda-battaglia-slam` (T2), `apertura-anche`
(T1), `respirazione-360` (T1). Prompt in `media/prompts/`, in bozza finché
il designer non scrive `frames`. Nessun file generato.

**Catalogo RepDB per i 32: NON COPERTO.** Il catalogo completo non è
consultabile nel repo (ci sono solo gli 85 file che l'app usa) e non si è
scaricato niente. Fra gli 85 che abbiamo, **un candidato**: `hammer-curl`
(manubri, presa neutra, già sulla voce `curl-elastico-presa-neutra`, stesso
gesto) per `curl-martello-manubri`. Da riconfermare contro i cue (in piedi,
gomito fermo) in un'invocazione che non scrive prompt (C2).

