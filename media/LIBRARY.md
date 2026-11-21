# LIBRARY.md — registro della libreria

Una riga per immagine. Si legge con `grep`, non a occhio.
Stati: `da verificare` · `verificata` (checklist passata, non ancora
approvata) · `approvata` (**solo Alessio**) · `da rifare` · `ritirata`.
Nessuna immagine è oggi `approvata`: la libreria non era mai stata registrata.
Le verifiche del 2026-11-08 sono **provvisorie**: le schede non hanno ancora i
campi `equipment` e `frames` di EXERCISE_SCHEMA.md, quindi il confronto è
fatto sui `cues`.

**Allineato al codice il 2026-11-21** (`88da16a`): 22 righe RepDB e 20 SVG
che l'app non mostra più sono `ritirata`, con il commit. Il controllo si rifà
con `node --experimental-strip-types media/scripts/library-drift.mts` (R12).

**Righe `generata AI`** (fonte 3, LICENSING.md §3; formato in STYLE_GUIDE.md §8):
- `fonte` = `generata AI`; `fotogramma` = `1 partenza` · `2 arrivo` · `unica`.
- colonna `archetipo · modello e seme` = `qwen-image@75e0b4b · seme 1234 · T2`
  (T1 = foto singola, T2 = dittico da un prompt, E = secondo fotogramma
  modificato dal primo, con `qwen-image-edit-2511@6f3ccc0`).
- `data` = giorno della generazione; `motivo / nota` = file del prompt in
  `media/prompts/`, servizio usato (locale o Space con il suo sha), ingresso
  per E (il file del fotogramma 1), semi scartati.
- Si entra in `da verificare` quando il file esiste; `approvata` la scrive
  solo Alessio, mai su un'immagine che non ha visto.

| id | fotogramma | fonte | archetipo · modello e seme | stato | file | data | motivo / nota |
|---|---|---|---|---|---|---|---|
| trazioni-prona-presa-media | inizio+fine | generata | `hang-pull` | da verificare | src/assets/exercises/trazioni-prona-presa-media.svg | 2026-11-08 |  |
| trazioni-presa-larga | inizio+fine | generata | `hang-pull` | da verificare | src/assets/exercises/trazioni-presa-larga.svg | 2026-11-08 |  |
| chin-up-presa-supina-stretta | inizio+fine | generata | `hang-pull` | da verificare | src/assets/exercises/chin-up-presa-supina-stretta.svg | 2026-11-08 |  |
| chin-up-presa-supina | inizio+fine | generata | `hang-pull` | da verificare | src/assets/exercises/chin-up-presa-supina.svg | 2026-11-08 |  |
| dead-hang | unica | generata | `hang-hold` | da verificare | src/assets/exercises/dead-hang.svg | 2026-11-08 |  |
| rematore-inverso-trx | inizio+fine | generata | `row` | ritirata | src/assets/exercises/rematore-inverso-trx.svg | 2026-11-21 | in app nessuna immagine da db2544e (T-37, `FIGURE_SENZA_IMMAGINE`): il file resta nel repo, l'app non lo mostra. Prima: T-37 (scala agli anelli), verifica del 2026-11-21 sul working tree: `row` disegna ancoraggio unico e cinghia unica, nessun anello (GENERATOR_SPEC: `row` = TRX); corpo a ~35°, la scheda §5.5 vuole 45° ± 5, due anelli separati, gomiti larghi. L'etichetta rigenerata dice «agli anelli», il disegno no. Va in `FIGURE_SENZA_IMMAGINE` con T-37, poi `ritirata` |
| rematore-inverso-trx-piedi-rialzati | inizio+fine | generata | `row` | ritirata | src/assets/exercises/rematore-inverso-trx-piedi-rialzati.svg | 2026-11-21 | in app nessuna immagine da 3b548e4 (`FIGURE_SENZA_IMMAGINE`): il file resta nel repo, l'app non lo mostra. Prima: mai verificata |
| rematore-trx-monobraccio | inizio+fine | generata | `row` | ritirata | src/assets/exercises/rematore-trx-monobraccio.svg | 2026-11-21 | in app nessuna immagine da c8964ff (`FIGURE_SENZA_IMMAGINE`): il file resta nel repo, l'app non lo mostra. Prima: mai verificata |
| push-up | inizio+fine | generata | `pushup` | da verificare | src/assets/exercises/push-up.svg | 2026-11-08 |  |
| pushup-archer-o-pseudo-planche | inizio+fine | generata | `pushup` | da verificare | src/assets/exercises/pushup-archer-o-pseudo-planche.svg | 2026-11-08 |  |
| croci-elastico-o-pushup-presa-larga | inizio+fine | generata | `fly` | da rifare | src/assets/exercises/croci-elastico-o-pushup-presa-larga.svg | 2026-11-08 | ripiego con attrezzo sbagliato: elastici per un esercizio con i manubri — spec 4.17 |
| pike-pushup-piedi-rialzati | inizio+fine | generata | `pike` | ritirata | src/assets/exercises/pike-pushup-piedi-rialzati.svg | 2026-11-21 | in app nessuna immagine da 50793fd (`FIGURE_SENZA_IMMAGINE`): il file resta nel repo, l'app non lo mostra. Prima: Misurata con pose-audit (2026-11-12), guardata a 230 px. Anatomia: pannello 1 testa sopra il collo, 95 gradi fuori asse (guarda avanti invece che a terra); pannello 2 gomito dentro la testa (4,5) e piegato verso il viso. In app vince la foto RepDB — spec 4.2 |
| negative-hspu-muro-o-pike-pushup | inizio+fine | generata | `hspu` | ritirata | src/assets/exercises/negative-hspu-muro-o-pike-pushup.svg | 2026-11-21 | in app nessuna immagine da 50793fd (`FIGURE_SENZA_IMMAGINE`): il file resta nel repo, l'app non lo mostra. Prima: Misurata con pose-audit (2026-11-12). Anatomia: pannello 1 testa spostata di 58 gradi fuori asse verso il muro; in verticale va fra le braccia. In app vince la foto RepDB — spec 4.2 |
| dip-parallele-anelli | inizio+fine | generata | `dip` | da verificare | src/assets/exercises/dip-parallele-anelli.svg | 2026-11-08 |  |
| dip-panche-o-diamond-pushup | inizio+fine | generata | `pushup` | da rifare | src/assets/exercises/dip-panche-o-diamond-pushup.svg | 2026-11-08 | ripiego: push-up a mani larghe per un diamond push-up (mani a rombo sotto lo sterno) |
| dip-panche | inizio+fine | generata | `bench-dip` | da verificare | src/assets/exercises/dip-panche.svg | 2026-11-08 |  |
| dip-panche-piedi-rialzati | inizio+fine | generata | `bench-dip` | da verificare | src/assets/exercises/dip-panche-piedi-rialzati.svg | 2026-11-08 |  |
| bulgarian-split-squat | inizio+fine | generata | `split-squat` | da verificare | src/assets/exercises/bulgarian-split-squat.svg | 2026-11-08 |  |
| step-up-box-alto | inizio+fine | generata | `step-up` | da verificare | src/assets/exercises/step-up-box-alto.svg | 2026-11-08 |  |
| sissy-squat | inizio+fine | generata | `sissy` | da verificare | src/assets/exercises/sissy-squat.svg | 2026-11-08 |  |
| wall-sit | unica | generata | `wallsit` | da verificare | src/assets/exercises/wall-sit.svg | 2026-11-08 |  |
| shrimp-squat-o-skater-squat | inizio+fine | generata | `shrimp` | ritirata | src/assets/exercises/shrimp-squat-o-skater-squat.svg | 2026-11-21 | in app nessuna immagine da c8964ff (`FIGURE_SENZA_IMMAGINE`): il file resta nel repo, l'app non lo mostra. Prima: mai verificata |
| nordic-curl | inizio+fine | generata | `nordic` | da verificare | src/assets/exercises/nordic-curl.svg | 2026-11-08 |  |
| hip-thrust-panca-bilaterale | inizio+fine | generata | `hip-thrust` `{bilateral, bell}` | verificata | src/assets/exercises/hip-thrust-panca-bilaterale.svg | 2026-11-12 | verifica provvisoria (scheda senza equipment/frames). Rifatta con 47c7f6d: chiuse 4.20, 4.21, 4.1. Due gambe e due piedi a 230 px, piede sotto il ginocchio in chiusura, spalla-anca-ginocchio in linea, coscia orizzontale, tibia verticale, campana appoggiata sulla piega dell-anca e tenuta con le mani, nessuna freccia. Riserva (6): nel pannello basso braccio e avambraccio sono un terzo piu corti (12+9 contro 18+14): scorcio plausibile, gomiti aperti ai lati, da scrivere nel commento dell-archetipo |
| hip-thrust-monopodalico | inizio+fine | generata | `hip-thrust` | verificata | src/assets/exercises/hip-thrust-monopodalico.svg | 2026-11-12 | verifica provvisoria (scheda senza equipment/frames). Rifatta con 47c7f6d: panca, gamba libera sollevata (cue 1), lockout in linea, niente freccia. Riserve (8): gamba libera 18% piu corta (tibia 19 contro 27, distesa non sta nel pannello); nel pannello basso la coscia libera incrocia la tibia vicina sotto il ginocchio. In app vince ancora la foto RepDB del glute bridge a terra, che contraddice la scheda: ora la figura e quella giusta |
| single-leg-rdl | inizio+fine | generata | `rdl` | da verificare | src/assets/exercises/single-leg-rdl.svg | 2026-11-08 |  |
| calf-monopodalico-rialzo | inizio+fine | generata | `calf` | da verificare | src/assets/exercises/calf-monopodalico-rialzo.svg | 2026-11-08 |  |
| calf-monopodalico-seduto | inizio+fine | generata | `calf` | da verificare | src/assets/exercises/calf-monopodalico-seduto.svg | 2026-11-08 |  |
| hollow-hold | unica | generata | `hollow` | da rifare | src/assets/exercises/hollow-hold.svg | 2026-11-18 | tecnica (R10/R5): anca 14 u sopra il pavimento, nessun punto del corpo a terra: disegna la lombare staccata che i cue 1 e 4 vietano. Braccio sul mento: E3 sopra la testa, accettato — spec 4.27 (verifica provvisoria) |
| hanging-leg-raise | inizio+fine | generata | `leg-raise` | da verificare | src/assets/exercises/hanging-leg-raise.svg | 2026-11-08 |  |
| ab-wheel-o-rollout-trx | inizio+fine | generata | `ab-wheel` | da verificare | src/assets/exercises/ab-wheel-o-rollout-trx.svg | 2026-11-08 | 2026-11-12, solo misura: braccio sulla testa nel pannello 2 (5,8) con braccia sopra la testa, posa giusta; manca solo `sh` dichiarata — spec 4.2 |
| rollout-trx | inizio+fine | generata | `ab-wheel` | da rifare | src/assets/exercises/rollout-trx.svg | 2026-11-08 | archetipo non suo: ruota ab e appoggio in ginocchio invece di maniglie TRX in piedi — spec 4.5 |
| l-sit | unica | generata | `lsit` | da verificare | src/assets/exercises/l-sit.svg | 2026-11-08 |  |
| verticale-al-muro | unica | generata | `handstand` | da verificare | src/assets/exercises/verticale-al-muro.svg | 2026-11-08 |  |
| alzate-laterali-elastico | inizio+fine | generata | `band-raise` | da rifare | src/assets/exercises/alzate-laterali-elastico.svg | 2026-11-08 | ripiego con attrezzo sbagliato: elastici per un esercizio con i manubri — spec 4.17 |
| face-pull-elastico | inizio+fine | generata | `face-pull` | da verificare | src/assets/exercises/face-pull-elastico.svg | 2026-11-08 |  |
| curl-elastico-presa-neutra | inizio+fine | generata | `curl` | da rifare | src/assets/exercises/curl-elastico-presa-neutra.svg | 2026-11-08 | ripiego con attrezzo sbagliato: elastici per un esercizio con i manubri — spec 4.17 |
| camminata-mobilita-dinamica | unica | generata | `walk` | da verificare | src/assets/exercises/camminata-mobilita-dinamica.svg | 2026-11-08 |  |
| corsa-continua-piano | unica | generata | `run` | da verificare | src/assets/exercises/corsa-continua-piano.svg | 2026-11-08 |  |
| mobilita-anche-torace-spalle | unica | generata | `mobility` | da rifare | src/assets/exercises/mobilita-anche-torace-spalle.svg | 2026-11-12 | Misurata con pose-audit (2026-11-12). Anatomia: vista frontale, braccia che partono dal collo e toccano la testa (5,7): senza spalle — spec 4.2 |
| zona-2-conclusiva | unica | generata | `run` | da verificare | src/assets/exercises/zona-2-conclusiva.svg | 2026-11-08 |  |
| corda-battaglia-onde-alternate | inizio+fine | generata | `rope` | da rifare | src/assets/exercises/corda-battaglia-onde-alternate.svg | 2026-11-08 | attrezzo e postura: le onde leggono come un mantello, nessun ancoraggio, busto eretto invece del mezzo squat — spec 4.12 |
| scapular-pull-up | inizio+fine | generata | `scap-pull` | verificata | src/assets/exercises/scapular-pull-up.svg | 2026-11-08 | braccia dritte in entrambi i pannelli, escursione minima: mostra cio che lo distingue dalla trazione (verifica provvisoria: scheda senza frames) |
| circonduzioni-spalle | unica | generata | `shoulder-circle` | verificata | src/assets/exercises/circonduzioni-spalle.svg | 2026-11-12 | verifica provvisoria (scheda senza equipment/frames). Chiusa 4.3: archetipo suo, md5 unico, tronco e gambe identici nei due pannelli, braccio teso lungo il fianco poi in alto, gomito dritto. Il braccio alto e tangente alla testa (6,0): e l-anatomia di un braccio sopra la testa visto di lato |
| affondo-con-rotazione | inizio+fine | generata | `lunge` | da rifare | src/assets/exercises/affondo-con-rotazione.svg | 2026-11-08 | tecnica: braccia piegate e rotazione verso la gamba dietro invece che avanti — spec 4.10 |
| stacco-rumeno-manubri | inizio+fine | generata | `hinge` | ritirata | src/assets/exercises/stacco-rumeno-manubri.svg | 2026-11-21 | in app nessuna immagine da 50793fd (`FIGURE_SENZA_IMMAGINE`): il file resta nel repo, l'app non lo mostra. Prima: attrezzo: i due manubri si sovrappongono e leggono come un bilanciere — spec 4.14 |
| goblet-squat | inizio+fine | generata | `goblet` | da rifare | src/assets/exercises/goblet-squat.svg | 2026-11-08 | tecnica: anca sopra il ginocchio (mezzo squat) e kettlebell che legge come pancia — spec 4.8 |
| pull-over-trx | inizio+fine | generata | `pullover` | da rifare | src/assets/exercises/pull-over-trx.svg | 2026-11-12 | Il braccio non attraversa piu la testa, ma per farlo passare la testa e stata spostata: collo piegato di 66 gradi, la testa pende di fianco al tronco (nuovo con 47c7f6d). Non visti il 2026-11-08: anca piegata di 20 e 28 gradi tra gambe e tronco (cue 3), mani 8 unita dietro il tronco nel pannello 2 con le cinghie che attraversano il busto, braccio 17 contro 10 — spec 4.24 |
| rematore-manubrio-un-braccio | inizio+fine | generata | `db-row` | da rifare | src/assets/exercises/rematore-manubrio-un-braccio.svg | 2026-11-08 | tecnica: manca il ginocchio sulla panca prescritto dal cue 1 — spec 4.15 |
| curl-martello-manubri | inizio+fine | generata | `db-curl` | da rifare | src/assets/exercises/curl-martello-manubri.svg | 2026-11-08 | tecnica: la presa neutra non si distingue da un curl supino — spec 4.13 |
| estensione-tricipiti-sopra-testa | inizio+fine | generata | `overhead-ext` | ritirata | src/assets/exercises/estensione-tricipiti-sopra-testa.svg | 2026-11-21 | in app nessuna immagine da 50793fd (`FIGURE_SENZA_IMMAGINE`): il file resta nel repo, l'app non lo mostra. Prima: Chiusa la parte 4.2: nessun segmento entro 6 dal centro della testa. Resta 4.11 per intero: vista frontale, peso di fianco alla testa all-altezza dell-orecchio invece che dietro la nuca, l-avambraccio vicino passa sopra il cranio, ordine dei pannelli invertito rispetto alla scheda |
| suitcase-carry | unica | generata | `carry` | da rifare | src/assets/exercises/suitcase-carry.svg | 2026-11-08 | inquadratura: di lato non si vede la linea delle spalle; il peso si sovrappone alla coscia — spec 4.7 |
| pallof-press-elastico | inizio+fine | generata | `pallof` | da rifare | src/assets/exercises/pallof-press-elastico.svg | 2026-11-08 | inquadratura: di lato l-anti-rotazione non esiste; il tratteggio attraversa il tronco — spec 4.6 |
| step-rapidi-box | inizio+fine | generata | `step-up` `{height:16, alternate}` | da rifare | src/assets/exercises/step-rapidi-box.svg | 2026-11-12 | Chiusa 4.4 (box sotto il ginocchio, scambio dei piedi, non piu uguale allo step-up alto). Difetto nuovo, anatomia: la gamba sul box ha la tibia di 12 contro 20 di quella a terra (-40%) in tutti e due i pannelli — spec 4.22 |
| mountain-climber | inizio+fine | generata | `mountain-climber` | da rifare | src/assets/exercises/mountain-climber.svg | 2026-11-08 | tecnica: polsi dietro le spalle, ginocchio che non arriva al petto — spec 4.16 |
| jumping-jack | inizio+fine | generata | `jack` | verificata | src/assets/exercises/jumping-jack.svg | 2026-11-08 | range completo, braccia sopra la testa, atterraggio morbido leggibile (verifica provvisoria: scheda senza frames). Riserva 2026-11-12 (8): nel pannello 2 le braccia partono dal collo come in burpee e mobilita; non toccano la testa (6,3) ma le linee si sfiorano a 230 px — `sh`/`sh2` in spec 4.2 |
| kb-swing | inizio+fine | generata | `swing` | da rifare | src/assets/exercises/kb-swing.svg | 2026-11-08 | tecnica: in basso il peso e disegnato basso e davanti, la posizione che il cue chiama fine serie — spec 4.9 |
| vertical-pull-l1 | inizio+fine | generata | `hang-pull` | ritirata | src/assets/steps/vertical-pull-l1.svg | 2026-11-21 | in app nessuna immagine da 50793fd (`FIGURE_SENZA_IMMAGINE`): il file resta nel repo, l'app non lo mostra. Prima: mai verificata |
| vertical-pull-l2 | inizio+fine | generata | `hang-pull` | da verificare | src/assets/steps/vertical-pull-l2.svg | 2026-11-08 |  |
| vertical-pull-l3 | inizio+fine | generata | `hang-pull` | da verificare | src/assets/steps/vertical-pull-l3.svg | 2026-11-08 |  |
| vertical-pull-l4 | inizio+fine | generata | `hang-pull` | da verificare | src/assets/steps/vertical-pull-l4.svg | 2026-11-08 |  |
| vertical-pull-l5 | inizio+fine | generata | `hang-pull` | da verificare | src/assets/steps/vertical-pull-l5.svg | 2026-11-08 |  |
| vertical-pull-l6 | inizio+fine | generata | `hang-pull` | da verificare | src/assets/steps/vertical-pull-l6.svg | 2026-11-08 |  |
| horizontal-pull-l1 | inizio+fine | generata | `row` | ritirata | src/assets/steps/horizontal-pull-l1.svg | 2026-11-21 | in app nessuna immagine da db2544e (T-37, `FIGURE_SENZA_IMMAGINE`): il file resta nel repo, l'app non lo mostra. Prima: T-37 (scala agli anelli), verifica del 2026-11-21 sul working tree: `row` disegna ancoraggio unico e cinghia unica, nessun anello (GENERATOR_SPEC: `row` = TRX); corpo a ~35° come l2, l3 e l5 (stesse coordinate): l'etichetta rigenerata dice «anelli a 60 gradi», il disegno mostra né anelli né 60°. Va in `FIGURE_SENZA_IMMAGINE` |
| horizontal-pull-l2 | inizio+fine | generata | `row` | da rifare | src/assets/steps/horizontal-pull-l2.svg | 2026-11-21 | T-37 (scala agli anelli), verifica del 2026-11-21 sul working tree: `row` disegna ancoraggio unico e cinghia unica, nessun anello (GENERATOR_SPEC: `row` = TRX); corpo a ~35° (scheda: 45° ± 5), identico a l1 e l3. Va in `FIGURE_SENZA_IMMAGINE` |
| horizontal-pull-l3 | inizio+fine | generata | `row` | ritirata | src/assets/steps/horizontal-pull-l3.svg | 2026-11-21 | T-37 (2026-11-21): resta senza immagine anche agli anelli, stesso rig TRX e corpo a ~35° (il gradino è orizzontale); il motivo in `FIGURE_SENZA_IMMAGINE` va aggiornato. Prima: in app nessuna immagine da 50793fd (`FIGURE_SENZA_IMMAGINE`): il file resta nel repo, l'app non lo mostra. Prima: mai verificata |
| horizontal-pull-l4 | inizio+fine | generata | `row` | da rifare | src/assets/steps/horizontal-pull-l4.svg | 2026-11-21 | T-37 (scala agli anelli), verifica del 2026-11-21 sul working tree: `row` disegna ancoraggio unico e cinghia unica, nessun anello (GENERATOR_SPEC: `row` = TRX); rialzo e corpo quasi orizzontale coerenti col gradino, l'attrezzo no. Va in `FIGURE_SENZA_IMMAGINE` |
| horizontal-pull-l5 | inizio+fine | generata | `row` | da rifare | src/assets/steps/horizontal-pull-l5.svg | 2026-11-21 | T-37 (scala agli anelli), verifica del 2026-11-21 sul working tree: `row` disegna ancoraggio unico e cinghia unica, nessun anello (GENERATOR_SPEC: `row` = TRX); un braccio, corpo a ~35° come l1; la scheda del gradino (angolo) non c'è ancora. Va in `FIGURE_SENZA_IMMAGINE` |
| horizontal-pull-l6 | inizio+fine | generata | `row` | da rifare | src/assets/steps/horizontal-pull-l6.svg | 2026-11-21 | T-37 (scala agli anelli), verifica del 2026-11-21 sul working tree: `row` disegna ancoraggio unico e cinghia unica, nessun anello (GENERATOR_SPEC: `row` = TRX); rialzo e un braccio coerenti, l'attrezzo no; scheda del gradino non ancora scritta. Va in `FIGURE_SENZA_IMMAGINE` |
| horizontal-push-l1 | inizio+fine | generata | `pushup` | da verificare | src/assets/steps/horizontal-push-l1.svg | 2026-11-08 |  |
| horizontal-push-l2 | inizio+fine | generata | `pushup` | da verificare | src/assets/steps/horizontal-push-l2.svg | 2026-11-08 |  |
| horizontal-push-l3 | inizio+fine | generata | `pushup` | da verificare | src/assets/steps/horizontal-push-l3.svg | 2026-11-08 |  |
| horizontal-push-l4 | inizio+fine | generata | `pushup` | da verificare | src/assets/steps/horizontal-push-l4.svg | 2026-11-08 |  |
| horizontal-push-l5 | inizio+fine | generata | `pushup` | da verificare | src/assets/steps/horizontal-push-l5.svg | 2026-11-08 |  |
| horizontal-push-l6 | inizio+fine | generata | `pushup` | ritirata | src/assets/steps/horizontal-push-l6.svg | 2026-11-21 | in app nessuna immagine da 50793fd (`FIGURE_SENZA_IMMAGINE`): il file resta nel repo, l'app non lo mostra. Prima: attrezzo (R1): «push-up zavorrati» senza zavorra disegnata |
| vertical-push-l1 | inizio+fine | generata | `pike` | da rifare | src/assets/steps/vertical-push-l1.svg | 2026-11-12 | Stessa posa di pike-pushup-piedi-rialzati: testa 95 gradi fuori asse nel pannello 1, gomito dentro la testa nel pannello 2 — spec 4.2 |
| vertical-push-l2 | inizio+fine | generata | `pike` | da rifare | src/assets/steps/vertical-push-l2.svg | 2026-11-12 | Stessa posa di pike-pushup-piedi-rialzati: testa 95 gradi fuori asse nel pannello 1, gomito dentro la testa nel pannello 2 — spec 4.2 |
| vertical-push-l3 | inizio+fine | generata | `hspu` | da rifare | src/assets/steps/vertical-push-l3.svg | 2026-11-12 | Stessa posa di negative-hspu-muro-o-pike-pushup: testa 58 gradi fuori asse nel pannello 1 — spec 4.2 |
| vertical-push-l4 | inizio+fine | generata | `hspu` | da rifare | src/assets/steps/vertical-push-l4.svg | 2026-11-12 | Stessa posa di negative-hspu-muro-o-pike-pushup: testa 58 gradi fuori asse nel pannello 1 — spec 4.2 |
| vertical-push-l5 | inizio+fine | generata | `hspu` | ritirata | src/assets/steps/vertical-push-l5.svg | 2026-11-21 | in app nessuna immagine da 50793fd (`FIGURE_SENZA_IMMAGINE`): il file resta nel repo, l'app non lo mostra. Prima: Stessa posa di negative-hspu-muro-o-pike-pushup: testa 58 gradi fuori asse nel pannello 1 — spec 4.2 |
| vertical-push-l6 | inizio+fine | generata | `hspu` | ritirata | src/assets/steps/vertical-push-l6.svg | 2026-11-21 | in app nessuna immagine da 50793fd (`FIGURE_SENZA_IMMAGINE`): il file resta nel repo, l'app non lo mostra. Prima: Stessa posa di negative-hspu-muro-o-pike-pushup: testa 58 gradi fuori asse nel pannello 1 — spec 4.2 |
| dip-l1 | inizio+fine | generata | `bench-dip` | ritirata | src/assets/steps/dip-l1.svg | 2026-11-21 | in app nessuna immagine da 50793fd (`FIGURE_SENZA_IMMAGINE`): il file resta nel repo, l'app non lo mostra. Prima: mai verificata |
| dip-l2 | inizio+fine | generata | `dip` | da verificare | src/assets/steps/dip-l2.svg | 2026-11-08 |  |
| dip-l3 | inizio+fine | generata | `dip` | da verificare | src/assets/steps/dip-l3.svg | 2026-11-08 |  |
| dip-l4 | inizio+fine | generata | `dip` | da verificare | src/assets/steps/dip-l4.svg | 2026-11-08 |  |
| dip-l5 | inizio+fine | generata | `dip` | da verificare | src/assets/steps/dip-l5.svg | 2026-11-08 |  |
| dip-l6 | inizio+fine | generata | `dip` | da verificare | src/assets/steps/dip-l6.svg | 2026-11-08 |  |
| single-leg-squat-l1 | inizio+fine | generata | `split-squat` | da verificare | src/assets/steps/single-leg-squat-l1.svg | 2026-11-08 |  |
| single-leg-squat-l2 | inizio+fine | generata | `split-squat` | da verificare | src/assets/steps/single-leg-squat-l2.svg | 2026-11-08 |  |
| single-leg-squat-l3 | inizio+fine | generata | `split-squat` | da verificare | src/assets/steps/single-leg-squat-l3.svg | 2026-11-08 |  |
| single-leg-squat-l4 | inizio+fine | generata | `shrimp` | da verificare | src/assets/steps/single-leg-squat-l4.svg | 2026-11-08 |  |
| single-leg-squat-l5 | inizio+fine | generata | `shrimp` | ritirata | src/assets/steps/single-leg-squat-l5.svg | 2026-11-21 | in app nessuna immagine da 50793fd (`FIGURE_SENZA_IMMAGINE`): il file resta nel repo, l'app non lo mostra. Prima: presa (R1): stesso SVG dello skater (l4), manca la mano che tiene il piede dietro |
| single-leg-squat-l6 | inizio+fine | generata | `shrimp` | da verificare | src/assets/steps/single-leg-squat-l6.svg | 2026-11-08 |  |
| posterior-chain-l1 | inizio+fine | generata | `hip-thrust` `{bench:false}` | verificata | src/assets/steps/posterior-chain-l1.svg | 2026-11-12 | Come hip-thrust-l3, identica e giustificata. In app vince la foto RepDB |
| posterior-chain-l2 | inizio+fine | generata | `nordic` | da verificare | src/assets/steps/posterior-chain-l2.svg | 2026-11-08 |  |
| posterior-chain-l3 | inizio+fine | generata | `nordic` | da verificare | src/assets/steps/posterior-chain-l3.svg | 2026-11-08 |  |
| posterior-chain-l4 | inizio+fine | generata | `nordic` | da verificare | src/assets/steps/posterior-chain-l4.svg | 2026-11-08 |  |
| posterior-chain-l5 | inizio+fine | generata | `nordic` | da verificare | src/assets/steps/posterior-chain-l5.svg | 2026-11-08 |  |
| posterior-chain-l6 | inizio+fine | generata | `nordic` | da verificare | src/assets/steps/posterior-chain-l6.svg | 2026-11-08 |  |
| core-l1 | unica | generata | `hollow` | da rifare | src/assets/steps/core-l1.svg | 2026-11-18 | archetipo (R1): «plank sugli avambracci» disegnato come hollow hold (stesso SVG di hollow-hold, md5 a etichetta tolta); più R10. In app vince la foto RepDB — spec 4.27 |
| core-l2 | unica | generata | `hollow` | da rifare | src/assets/steps/core-l2.svg | 2026-11-18 | corrispondenza (R1): «ginocchia piegate», gambe distese; tecnica (R10): corpo sospeso. Senza foto: in app si vede questa — spec 4.27 |
| core-l3 | unica | generata | `hollow` | da rifare | src/assets/steps/core-l3.svg | 2026-11-18 | tecnica (R10): stesso SVG di hollow-hold, corpo sospeso sopra il pavimento. In app vince la foto RepDB — spec 4.27 |
| core-l4 | inizio+fine | generata | `leg-raise` | da verificare | src/assets/steps/core-l4.svg | 2026-11-08 |  |
| core-l5 | inizio+fine | generata | `leg-raise` | da verificare | src/assets/steps/core-l5.svg | 2026-11-08 |  |
| core-l6 | inizio+fine | generata | `ab-wheel` | da verificare | src/assets/steps/core-l6.svg | 2026-11-08 |  |
| hip-thrust-l1 | inizio+fine | generata | `hip-thrust` `{bench:false, bilateral}` | verificata | src/assets/steps/hip-thrust-l1.svg | 2026-11-12 | Rifatta con 47c7f6d: a terra senza panca, due gambe, spalla-anca-ginocchio in linea, ginocchio a 85 gradi in chiusura, niente freccia. La tibia a 24 gradi dalla verticale e giusta per il ponte a terra: il criterio della tibia verticale di 4.21 valeva per la panca. In app vince la foto RepDB |
| hip-thrust-l2 | inizio+fine | generata | `hip-thrust` `{bilateral}` | verificata | src/assets/steps/hip-thrust-l2.svg | 2026-11-12 | Rifatta con 47c7f6d: panca, due gambe distinguibili, lockout in linea, niente freccia. Senza foto: e la figura che l-app mostra |
| hip-thrust-l3 | inizio+fine | generata | `hip-thrust` `{bench:false}` | verificata | src/assets/steps/hip-thrust-l3.svg | 2026-11-12 | Rifatta con 47c7f6d: a terra, gamba libera sollevata, allineamento giusto, niente freccia. Riserva (8): nel pannello basso il ginocchio libero tocca la tibia vicina. Identica a posterior-chain-l1 (stesso gesto, stessa etichetta). In app vince la foto RepDB |
| hip-thrust-l4 | inizio+fine | generata | `hip-thrust` | verificata | src/assets/steps/hip-thrust-l4.svg | 2026-11-12 | Come hip-thrust-monopodalico, stesso file a etichetta tolta (stesso gesto). Riserve (8) uguali |
| hip-thrust-l5 | inizio+fine | generata | `hip-thrust` | verificata | src/assets/steps/hip-thrust-l5.svg | 2026-11-12 | Come hip-thrust-l4: la pausa di 2 secondi non si disegna |
| hip-thrust-l6 | inizio+fine | generata | `hip-thrust` `{bell}` | verificata | src/assets/steps/hip-thrust-l6.svg | 2026-11-12 | Rifatta con 47c7f6d: monopodalico con campana sull-anca tenuta con le mani, niente freccia. Riserve: (6) braccio corto nel pannello basso come nel bilaterale; (8) gamba libera corta, nel pannello alto passa dietro la campana |
| hip-hinge-l1 | inizio+fine | generata | `rdl` | da verificare | src/assets/steps/hip-hinge-l1.svg | 2026-11-08 |  |
| hip-hinge-l2 | inizio+fine | generata | `rdl` | da verificare | src/assets/steps/hip-hinge-l2.svg | 2026-11-08 |  |
| hip-hinge-l3 | inizio+fine | generata | `rdl` | da verificare | src/assets/steps/hip-hinge-l3.svg | 2026-11-08 |  |
| hip-hinge-l4 | inizio+fine | generata | `rdl` | da verificare | src/assets/steps/hip-hinge-l4.svg | 2026-11-08 |  |
| hip-hinge-l5 | inizio+fine | generata | `rdl` | da verificare | src/assets/steps/hip-hinge-l5.svg | 2026-11-08 |  |
| hip-hinge-l6 | inizio+fine | generata | `rdl` | da verificare | src/assets/steps/hip-hinge-l6.svg | 2026-11-08 |  |
| calf-l1 | inizio+fine | generata | `calf` | da verificare | src/assets/steps/calf-l1.svg | 2026-11-08 |  |
| calf-l2 | inizio+fine | generata | `calf` | da verificare | src/assets/steps/calf-l2.svg | 2026-11-08 |  |
| calf-l3 | inizio+fine | generata | `calf` | da verificare | src/assets/steps/calf-l3.svg | 2026-11-08 |  |
| calf-l4 | inizio+fine | generata | `calf` | da verificare | src/assets/steps/calf-l4.svg | 2026-11-08 |  |
| calf-l5 | inizio+fine | generata | `calf` | da verificare | src/assets/steps/calf-l5.svg | 2026-11-08 |  |
| calf-l6 | inizio+fine | generata | `calf` | da verificare | src/assets/steps/calf-l6.svg | 2026-11-08 |  |
| step-up-l1 | inizio+fine | generata | `step-up` | da verificare | src/assets/steps/step-up-l1.svg | 2026-11-08 |  |
| step-up-l2 | inizio+fine | generata | `step-up` | da verificare | src/assets/steps/step-up-l2.svg | 2026-11-08 |  |
| step-up-l3 | inizio+fine | generata | `step-up` | da verificare | src/assets/steps/step-up-l3.svg | 2026-11-08 |  |
| step-up-l4 | inizio+fine | generata | `step-up` | da verificare | src/assets/steps/step-up-l4.svg | 2026-11-08 |  |
| step-up-l5 | inizio+fine | generata | `step-up` | da verificare | src/assets/steps/step-up-l5.svg | 2026-11-08 |  |
| step-up-l6 | inizio+fine | generata | `step-up` | da verificare | src/assets/steps/step-up-l6.svg | 2026-11-08 |  |
| sissy-squat-l1 | inizio+fine | generata | `sissy` | da verificare | src/assets/steps/sissy-squat-l1.svg | 2026-11-08 |  |
| sissy-squat-l2 | inizio+fine | generata | `sissy` | da verificare | src/assets/steps/sissy-squat-l2.svg | 2026-11-08 |  |
| sissy-squat-l3 | inizio+fine | generata | `sissy` | da verificare | src/assets/steps/sissy-squat-l3.svg | 2026-11-08 |  |
| sissy-squat-l4 | inizio+fine | generata | `sissy` | da verificare | src/assets/steps/sissy-squat-l4.svg | 2026-11-08 |  |
| sissy-squat-l5 | inizio+fine | generata | `sissy` | da verificare | src/assets/steps/sissy-squat-l5.svg | 2026-11-08 |  |
| sissy-squat-l6 | inizio+fine | generata | `sissy` | da verificare | src/assets/steps/sissy-squat-l6.svg | 2026-11-08 |  |
| handstand-l1 | inizio+fine | generata | `pike` | da rifare | src/assets/steps/handstand-l1.svg | 2026-11-12 | Stessa posa di pike-pushup-piedi-rialzati: testa 95 gradi fuori asse nel pannello 1, gomito dentro la testa nel pannello 2 — spec 4.2 |
| handstand-l2 | unica | generata | `handstand` | da verificare | src/assets/steps/handstand-l2.svg | 2026-11-08 |  |
| handstand-l3 | unica | generata | `handstand` | da verificare | src/assets/steps/handstand-l3.svg | 2026-11-08 |  |
| handstand-l4 | unica | generata | `handstand` | da verificare | src/assets/steps/handstand-l4.svg | 2026-11-08 |  |
| handstand-l5 | unica | generata | `handstand` | da verificare | src/assets/steps/handstand-l5.svg | 2026-11-08 |  |
| handstand-l6 | unica | generata | `handstand` | da verificare | src/assets/steps/handstand-l6.svg | 2026-11-08 |  |
| wall-sit-l1 | unica | generata | `wallsit` | da verificare | src/assets/steps/wall-sit-l1.svg | 2026-11-08 |  |
| wall-sit-l2 | unica | generata | `wallsit` | da verificare | src/assets/steps/wall-sit-l2.svg | 2026-11-08 |  |
| wall-sit-l3 | unica | generata | `wallsit` | da verificare | src/assets/steps/wall-sit-l3.svg | 2026-11-08 |  |
| wall-sit-l4 | unica | generata | `wallsit` | da verificare | src/assets/steps/wall-sit-l4.svg | 2026-11-08 |  |
| wall-sit-l5 | unica | generata | `wallsit` | da verificare | src/assets/steps/wall-sit-l5.svg | 2026-11-08 |  |
| wall-sit-l6 | unica | generata | `wallsit` | da verificare | src/assets/steps/wall-sit-l6.svg | 2026-11-08 |  |
| l-sit-l1 | unica | generata | `lsit` | da verificare | src/assets/steps/l-sit-l1.svg | 2026-11-08 |  |
| l-sit-l2 | unica | generata | `lsit` | da verificare | src/assets/steps/l-sit-l2.svg | 2026-11-08 |  |
| l-sit-l3 | unica | generata | `lsit` | da verificare | src/assets/steps/l-sit-l3.svg | 2026-11-08 |  |
| l-sit-l4 | unica | generata | `lsit` | da verificare | src/assets/steps/l-sit-l4.svg | 2026-11-08 |  |
| l-sit-l5 | unica | generata | `lsit` | da verificare | src/assets/steps/l-sit-l5.svg | 2026-11-08 |  |
| l-sit-l6 | unica | generata | `lsit` | da verificare | src/assets/steps/l-sit-l6.svg | 2026-11-08 |  |
| hang-l1 | unica | generata | `hang-hold` | ritirata | src/assets/steps/hang-l1.svg | 2026-11-21 | in app nessuna immagine da 50793fd (`FIGURE_SENZA_IMMAGINE`): il file resta nel repo, l'app non lo mostra. Prima: posizione (R1): sei gradini hang con lo stesso SVG; qui i piedi devono sfiorare terra e non c'è pavimento |
| hang-l2 | unica | generata | `hang-hold` | da verificare | src/assets/steps/hang-l2.svg | 2026-11-08 |  |
| hang-l3 | unica | generata | `hang-hold` | ritirata | src/assets/steps/hang-l3.svg | 2026-11-21 | in app nessuna immagine da 50793fd (`FIGURE_SENZA_IMMAGINE`): il file resta nel repo, l'app non lo mostra. Prima: attrezzo e presa (R1): sbarra e presa normale, il gradino è presa a pinza sulla trave |
| hang-l4 | unica | generata | `hang-hold` | ritirata | src/assets/steps/hang-l4.svg | 2026-11-21 | in app nessuna immagine da 50793fd (`FIGURE_SENZA_IMMAGINE`): il file resta nel repo, l'app non lo mostra. Prima: presa (R1): due mani sulla sbarra, il gradino è una mano con l'altra sul polso |
| hang-l5 | unica | generata | `hang-hold` | ritirata | src/assets/steps/hang-l5.svg | 2026-11-21 | in app nessuna immagine da 50793fd (`FIGURE_SENZA_IMMAGINE`): il file resta nel repo, l'app non lo mostra. Prima: presa (R1): due mani sulla sbarra, il gradino è a una mano |
| hang-l6 | unica | generata | `hang-hold` | ritirata | src/assets/steps/hang-l6.svg | 2026-11-21 | in app nessuna immagine da 50793fd (`FIGURE_SENZA_IMMAGINE`): il file resta nel repo, l'app non lo mostra. Prima: attrezzo e presa (R1): due mani sulla sbarra, il gradino è a una mano su asciugamano |
| trazioni-prona-presa-media | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/pull-up-start.webp | 2026-11-08 | sorgente RepDB `pull-up` |
| trazioni-prona-presa-media | fine | RepDB | — | da verificare | src/assets/exercises-repdb/pull-up-peak.webp | 2026-11-08 | sorgente RepDB `pull-up` |
| trazioni-presa-larga | inizio | RepDB | — | verificata | src/assets/exercises-repdb/wide-grip-pull-ups-start.webp | 2026-11-08 | presa larga visibile: coerente |
| trazioni-presa-larga | fine | RepDB | — | verificata | src/assets/exercises-repdb/wide-grip-pull-ups-peak.webp | 2026-11-08 | presa larga visibile: coerente |
| chin-up-presa-supina | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/chin-ups-start.webp | 2026-11-08 | sorgente RepDB `chin-ups` |
| chin-up-presa-supina | fine | RepDB | — | da verificare | src/assets/exercises-repdb/chin-ups-peak.webp | 2026-11-08 | sorgente RepDB `chin-ups` |
| chin-up-presa-supina-stretta | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/close-grip-pull-ups-start.webp | 2026-11-08 | sorgente RepDB `close-grip-pull-ups` |
| chin-up-presa-supina-stretta | fine | RepDB | — | da verificare | src/assets/exercises-repdb/close-grip-pull-ups-peak.webp | 2026-11-08 | sorgente RepDB `close-grip-pull-ups` |
| rematore-inverso-trx | inizio | RepDB | — | ritirata | src/assets/exercises-repdb/inverted-row-start.webp | 2026-11-21 | tolta dalla voce in 50793fd: sostituita da `trx-row` (TRX); il file resta per `horizontal-pull-l1`. Prima: attrezzo (R11): sbarra, l'esercizio è al TRX con maniglie. Rimappare a `trx-row` (TRX, due mani, ~45° = gradino 2). Se il designer conferma la nota «agli anelli», `rings-inverted-row` |
| rematore-inverso-trx | fine | RepDB | — | ritirata | src/assets/exercises-repdb/inverted-row-peak.webp | 2026-11-21 | tolta dalla voce in 50793fd: sostituita da `trx-row` (TRX); il file resta per `horizontal-pull-l1`. Prima: attrezzo (R11): sbarra, l'esercizio è al TRX con maniglie. Rimappare a `trx-row` (TRX, due mani, ~45° = gradino 2). Se il designer conferma la nota «agli anelli», `rings-inverted-row` |
| rematore-inverso-trx | inizio | RepDB | — | ritirata | src/assets/exercises-repdb/trx-row-start.webp | 2026-11-21 | tolta dalla voce in db2544e (T-37), **file tolto dal repo** (nessun altro uso, termine 3). Prima: T-37, verifica del 2026-11-21: attrezzo (R11), la foto è il TRX (maniglie, ancoraggio unico), l'esercizio è agli anelli. Togliere la voce da `REPDB_ART` e mettere la chiave in `FIGURE_SENZA_IMMAGINE`; `trx-row` resta senza usi: file fuori dal repo (termine 3). Poi `ritirata` |
| rematore-inverso-trx | fine | RepDB | — | ritirata | src/assets/exercises-repdb/trx-row-peak.webp | 2026-11-21 | tolta dalla voce in db2544e (T-37), **file tolto dal repo** (nessun altro uso, termine 3). Prima: T-37, verifica del 2026-11-21: attrezzo (R11), la foto è il TRX (maniglie, ancoraggio unico), l'esercizio è agli anelli. Togliere la voce da `REPDB_ART` e mettere la chiave in `FIGURE_SENZA_IMMAGINE`; `trx-row` resta senza usi: file fuori dal repo (termine 3). Poi `ritirata` |
| rematore-inverso-trx-piedi-rialzati | inizio | RepDB | — | ritirata | src/assets/exercises-repdb/rings-inverted-row-start.webp | 2026-11-21 | Verificata per T-37 il 2026-11-21 (da `3b548e4^`, fuori dal repo, rapporto 2026-11-21-media-anelli): anelli giusti, nessun gradino. Corpo a ~35° apparenti in partenza (scheda l2: 40-50°; l1 60°; l3 orizzontale); anelli sopra le anche, braccia a ~35-50° dalla verticale, cinghie a ~12°; all'arrivo gomiti stretti al busto e anelli a larghezza spalle; vista che cambia fra i fotogrammi. Non si recupera. Prima: tolta dalla voce in 3b548e4: anelli con i piedi a terra, la scheda dice TRX e piedi rialzati. **File tolto dal repo** (nessun altro uso, termine 3); recuperabile da `3b548e4^`. Candidata per S2 A3 «agli anelli»: rapporto 2026-11-21-media-generate, punto 5. Prima: foto agli anelli con i piedi a terra, la scheda dice TRX e piedi rialzati: rimappare o ritirare |
| rematore-inverso-trx-piedi-rialzati | fine | RepDB | — | ritirata | src/assets/exercises-repdb/rings-inverted-row-peak.webp | 2026-11-21 | Verificata per T-37 il 2026-11-21 (da `3b548e4^`, fuori dal repo, rapporto 2026-11-21-media-anelli): anelli giusti, nessun gradino. Corpo a ~35° apparenti in partenza (scheda l2: 40-50°; l1 60°; l3 orizzontale); anelli sopra le anche, braccia a ~35-50° dalla verticale, cinghie a ~12°; all'arrivo gomiti stretti al busto e anelli a larghezza spalle; vista che cambia fra i fotogrammi. Non si recupera. Prima: tolta dalla voce in 3b548e4: anelli con i piedi a terra, la scheda dice TRX e piedi rialzati. **File tolto dal repo** (nessun altro uso, termine 3); recuperabile da `3b548e4^`. Candidata per S2 A3 «agli anelli»: rapporto 2026-11-21-media-generate, punto 5. Prima: foto agli anelli con i piedi a terra, la scheda dice TRX e piedi rialzati: rimappare o ritirare |
| rematore-trx-monobraccio | inizio | RepDB | — | ritirata | src/assets/exercises-repdb/trx-row-start.webp | 2026-11-21 | tolta dalla voce in c8964ff: due mani, l'esercizio è a un braccio. Prima: presa (R11): due mani, l'esercizio è a un braccio («una maniglia sola»). Fuori dai 4 circuiti |
| rematore-trx-monobraccio | fine | RepDB | — | ritirata | src/assets/exercises-repdb/trx-row-peak.webp | 2026-11-21 | tolta dalla voce in c8964ff: due mani, l'esercizio è a un braccio. Prima: presa (R11): due mani, l'esercizio è a un braccio («una maniglia sola»). Fuori dai 4 circuiti |
| push-up | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/push-up-start.webp | 2026-11-08 | sorgente RepDB `push-up` |
| push-up | fine | RepDB | — | da verificare | src/assets/exercises-repdb/push-up-peak.webp | 2026-11-08 | sorgente RepDB `push-up` |
| pushup-archer-o-pseudo-planche | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/archer-push-ups-start.webp | 2026-11-08 | sorgente RepDB `archer-push-ups` |
| pushup-archer-o-pseudo-planche | fine | RepDB | — | da verificare | src/assets/exercises-repdb/archer-push-ups-peak.webp | 2026-11-08 | sorgente RepDB `archer-push-ups` |
| dip-parallele-anelli | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/dips-start.webp | 2026-11-08 | sorgente RepDB `dips` |
| dip-parallele-anelli | fine | RepDB | — | da verificare | src/assets/exercises-repdb/dips-peak.webp | 2026-11-08 | sorgente RepDB `dips` |
| dip-panche-o-diamond-pushup | inizio | RepDB | — | verificata | src/assets/exercises-repdb/diamond-push-ups-start.webp | 2026-11-08 | foto diamond-push-ups, mani a rombo: coerente |
| dip-panche-o-diamond-pushup | fine | RepDB | — | verificata | src/assets/exercises-repdb/diamond-push-ups-peak.webp | 2026-11-08 | foto diamond-push-ups, mani a rombo: coerente |
| croci-elastico-o-pushup-presa-larga | inizio | RepDB | — | verificata | src/assets/exercises-repdb/db-fly-start.webp | 2026-11-08 | foto db-fly con manubri su panca: coerente col nome |
| croci-elastico-o-pushup-presa-larga | fine | RepDB | — | verificata | src/assets/exercises-repdb/db-fly-peak.webp | 2026-11-08 | foto db-fly con manubri su panca: coerente col nome |
| l-sit | unica | RepDB | — | da verificare | src/assets/exercises-repdb/l-sit-main.webp | 2026-11-08 | sorgente RepDB `l-sit` |
| dip-panche | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/bench-dips-start.webp | 2026-11-08 | sorgente RepDB `bench-dips` |
| dip-panche | fine | RepDB | — | da verificare | src/assets/exercises-repdb/bench-dips-peak.webp | 2026-11-08 | sorgente RepDB `bench-dips` |
| dip-panche-piedi-rialzati | inizio | RepDB | — | ritirata | src/assets/exercises-repdb/bench-dips-start.webp | 2026-11-21 | tolta dalla voce in 50793fd: piedi a terra; vale la SVG col rialzo. Prima: foto con i piedi a terra, la scheda dice talloni su una seconda panca: rimappare o ritirare |
| dip-panche-piedi-rialzati | fine | RepDB | — | ritirata | src/assets/exercises-repdb/bench-dips-peak.webp | 2026-11-21 | tolta dalla voce in 50793fd: piedi a terra; vale la SVG col rialzo. Prima: foto con i piedi a terra, la scheda dice talloni su una seconda panca: rimappare o ritirare |
| pike-pushup-piedi-rialzati | inizio | RepDB | — | ritirata | src/assets/exercises-repdb/pike-push-ups-start.webp | 2026-11-21 | tolta dalla voce in 50793fd: piedi a terra; resta su `vertical-push-l1`. Prima: posizione (R11): piedi a terra, la scheda vuole piedi su un rialzo. È la foto del gradino `vertical-push-l1`, dove resta giusta. Nessuna foto con rialzo in libreria |
| pike-pushup-piedi-rialzati | fine | RepDB | — | ritirata | src/assets/exercises-repdb/pike-push-ups-peak.webp | 2026-11-21 | tolta dalla voce in 50793fd: piedi a terra; resta su `vertical-push-l1`. Prima: posizione (R11): piedi a terra, la scheda vuole piedi su un rialzo. È la foto del gradino `vertical-push-l1`, dove resta giusta. Nessuna foto con rialzo in libreria |
| negative-hspu-muro-o-pike-pushup | inizio | RepDB | — | ritirata | src/assets/exercises-repdb/handstand-push-ups-start.webp | 2026-11-21 | tolta dalla voce in 50793fd: verticale libera senza muro. File tolto dal repo. Prima: sorgente RepDB `handstand-push-ups` |
| negative-hspu-muro-o-pike-pushup | fine | RepDB | — | ritirata | src/assets/exercises-repdb/handstand-push-ups-peak.webp | 2026-11-21 | tolta dalla voce in 50793fd: verticale libera senza muro. File tolto dal repo. Prima: sorgente RepDB `handstand-push-ups` |
| bulgarian-split-squat | inizio | RepDB | — | ritirata | src/assets/exercises-repdb/bulgarian-split-squat-start.webp | 2026-11-21 | tolta dalla voce in 50793fd: manubri ai fianchi contro la nota «kettlebell in rack»; il file resta per `single-leg-squat-l2`. Prima: attrezzo (R11): due manubri ai fianchi; la nota di circuito-1 A2 chiede kettlebell in rack «meglio di due manubri ai fianchi». Decide il designer: nota o immagine |
| bulgarian-split-squat | fine | RepDB | — | ritirata | src/assets/exercises-repdb/bulgarian-split-squat-peak.webp | 2026-11-21 | tolta dalla voce in 50793fd: manubri ai fianchi contro la nota «kettlebell in rack»; il file resta per `single-leg-squat-l2`. Prima: attrezzo (R11): due manubri ai fianchi; la nota di circuito-1 A2 chiede kettlebell in rack «meglio di due manubri ai fianchi». Decide il designer: nota o immagine |
| wall-sit | unica | RepDB | — | da verificare | src/assets/exercises-repdb/wall-sit-main.webp | 2026-11-08 | sorgente RepDB `wall-sit` |
| nordic-curl | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/nordic-hamstring-curl-start.webp | 2026-11-08 | sorgente RepDB `nordic-hamstring-curl` |
| nordic-curl | fine | RepDB | — | da verificare | src/assets/exercises-repdb/nordic-hamstring-curl-peak.webp | 2026-11-08 | sorgente RepDB `nordic-hamstring-curl` |
| hip-thrust-monopodalico | inizio | RepDB | — | da rifare | src/assets/exercises-repdb/single-leg-glute-bridge-start.webp | 2026-11-08 | foto di un glute bridge a terra, la scheda dice spalle su panca: rimappare o ritirare |
| hip-thrust-monopodalico | fine | RepDB | — | da rifare | src/assets/exercises-repdb/single-leg-glute-bridge-peak.webp | 2026-11-08 | foto di un glute bridge a terra, la scheda dice spalle su panca: rimappare o ritirare |
| single-leg-rdl | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/single-leg-romanian-deadlift-start.webp | 2026-11-08 | sorgente RepDB `single-leg-romanian-deadlift` |
| single-leg-rdl | fine | RepDB | — | da verificare | src/assets/exercises-repdb/single-leg-romanian-deadlift-peak.webp | 2026-11-08 | sorgente RepDB `single-leg-romanian-deadlift` |
| step-up-box-alto | inizio | RepDB | — | verificata | src/assets/exercises-repdb/step-ups-start.webp | 2026-11-08 | box all-altezza del ginocchio, piede intero: coerente |
| step-up-box-alto | fine | RepDB | — | verificata | src/assets/exercises-repdb/step-ups-peak.webp | 2026-11-08 | box all-altezza del ginocchio, piede intero: coerente |
| calf-monopodalico-rialzo | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/bodyweight-calf-raise-start.webp | 2026-11-08 | sorgente RepDB `bodyweight-calf-raise` |
| calf-monopodalico-rialzo | fine | RepDB | — | da verificare | src/assets/exercises-repdb/bodyweight-calf-raise-peak.webp | 2026-11-08 | sorgente RepDB `bodyweight-calf-raise` |
| calf-monopodalico-seduto | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/seated-calf-raise-start.webp | 2026-11-08 | sorgente RepDB `seated-calf-raise` |
| calf-monopodalico-seduto | fine | RepDB | — | da verificare | src/assets/exercises-repdb/seated-calf-raise-peak.webp | 2026-11-08 | sorgente RepDB `seated-calf-raise` |
| hollow-hold | unica | RepDB | — | da verificare | src/assets/exercises-repdb/hollow-body-hold-main.webp | 2026-11-08 | sorgente RepDB `hollow-body-hold` |
| hanging-leg-raise | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/hanging-leg-raise-start.webp | 2026-11-08 | sorgente RepDB `hanging-leg-raise` |
| hanging-leg-raise | fine | RepDB | — | da verificare | src/assets/exercises-repdb/hanging-leg-raise-peak.webp | 2026-11-08 | sorgente RepDB `hanging-leg-raise` |
| ab-wheel-o-rollout-trx | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/ab-wheel-rollout-start.webp | 2026-11-08 | sorgente RepDB `ab-wheel-rollout` |
| ab-wheel-o-rollout-trx | fine | RepDB | — | da verificare | src/assets/exercises-repdb/ab-wheel-rollout-peak.webp | 2026-11-08 | sorgente RepDB `ab-wheel-rollout` |
| dead-hang | unica | RepDB | — | da verificare | src/assets/exercises-repdb/dead-hang-main.webp | 2026-11-08 | sorgente RepDB `dead-hang` |
| alzate-laterali-elastico | inizio | RepDB | — | verificata | src/assets/exercises-repdb/lateral-raise-start.webp | 2026-11-08 | foto lateral-raise con manubri: coerente col nome |
| alzate-laterali-elastico | fine | RepDB | — | verificata | src/assets/exercises-repdb/lateral-raise-peak.webp | 2026-11-08 | foto lateral-raise con manubri: coerente col nome |
| curl-elastico-presa-neutra | inizio | RepDB | — | verificata | src/assets/exercises-repdb/hammer-curl-start.webp | 2026-11-08 | foto hammer-curl con manubri: coerente col nome, non con lo slug |
| curl-elastico-presa-neutra | fine | RepDB | — | verificata | src/assets/exercises-repdb/hammer-curl-peak.webp | 2026-11-08 | foto hammer-curl con manubri: coerente col nome, non con lo slug |
| face-pull-elastico | inizio | RepDB | — | da rifare | src/assets/exercises-repdb/trx-face-pull-start.webp | 2026-11-08 | foto con le cinghie TRX, la scheda dice elastico: decisione di Alessio |
| face-pull-elastico | fine | RepDB | — | da rifare | src/assets/exercises-repdb/trx-face-pull-peak.webp | 2026-11-08 | foto con le cinghie TRX, la scheda dice elastico: decisione di Alessio |
| vertical-pull-l1 | inizio | RepDB | — | ritirata | src/assets/exercises-repdb/band-assisted-pull-ups-start.webp | 2026-11-21 | tolta dalla voce in 50793fd: elastico, la nota dice piede sul box. File tolto dal repo. Prima: attrezzo (R11): assistenza con elastico; la nota di circuito-1 A1 al gradino 1 dice «un piede appoggiato sul box». Decide il designer |
| vertical-pull-l1 | fine | RepDB | — | ritirata | src/assets/exercises-repdb/band-assisted-pull-ups-peak.webp | 2026-11-21 | tolta dalla voce in 50793fd: elastico, la nota dice piede sul box. File tolto dal repo. Prima: attrezzo (R11): assistenza con elastico; la nota di circuito-1 A1 al gradino 1 dice «un piede appoggiato sul box». Decide il designer |
| vertical-pull-l2 | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/negative-pull-ups-start.webp | 2026-11-08 | sorgente RepDB `negative-pull-ups` |
| vertical-pull-l2 | fine | RepDB | — | da verificare | src/assets/exercises-repdb/negative-pull-ups-peak.webp | 2026-11-08 | sorgente RepDB `negative-pull-ups` |
| vertical-pull-l4 | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/pause-pull-up-start.webp | 2026-11-08 | sorgente RepDB `pause-pull-up` |
| vertical-pull-l4 | fine | RepDB | — | da verificare | src/assets/exercises-repdb/pause-pull-up-peak.webp | 2026-11-08 | sorgente RepDB `pause-pull-up` |
| vertical-pull-l5 | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/archer-pull-ups-start.webp | 2026-11-08 | sorgente RepDB `archer-pull-ups` |
| vertical-pull-l5 | fine | RepDB | — | da verificare | src/assets/exercises-repdb/archer-pull-ups-peak.webp | 2026-11-08 | sorgente RepDB `archer-pull-ups` |
| vertical-pull-l6 | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/weighted-pull-up-start.webp | 2026-11-08 | sorgente RepDB `weighted-pull-up` |
| vertical-pull-l6 | fine | RepDB | — | da verificare | src/assets/exercises-repdb/weighted-pull-up-peak.webp | 2026-11-08 | sorgente RepDB `weighted-pull-up` |
| horizontal-push-l1 | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/incline-push-ups-start.webp | 2026-11-08 | sorgente RepDB `incline-push-ups` |
| horizontal-push-l1 | fine | RepDB | — | da verificare | src/assets/exercises-repdb/incline-push-ups-peak.webp | 2026-11-08 | sorgente RepDB `incline-push-ups` |
| horizontal-push-l3 | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/decline-push-up-start.webp | 2026-11-08 | sorgente RepDB `decline-push-up` |
| horizontal-push-l3 | fine | RepDB | — | da verificare | src/assets/exercises-repdb/decline-push-up-peak.webp | 2026-11-08 | sorgente RepDB `decline-push-up` |
| dip-l6 | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/weighted-dips-start.webp | 2026-11-08 | sorgente RepDB `weighted-dips` |
| dip-l6 | fine | RepDB | — | da verificare | src/assets/exercises-repdb/weighted-dips-peak.webp | 2026-11-08 | sorgente RepDB `weighted-dips` |
| single-leg-squat-l1 | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/split-squat-start.webp | 2026-11-08 | sorgente RepDB `split-squat` |
| single-leg-squat-l1 | fine | RepDB | — | da verificare | src/assets/exercises-repdb/split-squat-peak.webp | 2026-11-08 | sorgente RepDB `split-squat` |
| single-leg-squat-l6 | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/pistol-squat-start.webp | 2026-11-08 | sorgente RepDB `pistol-squat` |
| single-leg-squat-l6 | fine | RepDB | — | da verificare | src/assets/exercises-repdb/pistol-squat-peak.webp | 2026-11-08 | sorgente RepDB `pistol-squat` |
| core-l1 | unica | RepDB | — | da verificare | src/assets/exercises-repdb/plank-main.webp | 2026-11-08 | sorgente RepDB `plank` |
| core-l4 | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/hanging-knee-raise-start.webp | 2026-11-08 | sorgente RepDB `hanging-knee-raise` |
| core-l4 | fine | RepDB | — | da verificare | src/assets/exercises-repdb/hanging-knee-raise-peak.webp | 2026-11-08 | sorgente RepDB `hanging-knee-raise` |
| hip-thrust-l1 | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/glute-bridge-start.webp | 2026-11-08 | sorgente RepDB `glute-bridge` |
| hip-thrust-l1 | fine | RepDB | — | da verificare | src/assets/exercises-repdb/glute-bridge-peak.webp | 2026-11-08 | sorgente RepDB `glute-bridge` |
| hip-hinge-l6 | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/one-arm-single-leg-dumbbell-romanian-deadlift-start.webp | 2026-11-08 | sorgente RepDB `one-arm-single-leg-dumbbell-romanian-deadlift` |
| hip-hinge-l6 | fine | RepDB | — | da verificare | src/assets/exercises-repdb/one-arm-single-leg-dumbbell-romanian-deadlift-peak.webp | 2026-11-08 | sorgente RepDB `one-arm-single-leg-dumbbell-romanian-deadlift` |
| calf-l4 | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/single-leg-calf-raise-start.webp | 2026-11-08 | sorgente RepDB `single-leg-calf-raise` |
| calf-l4 | fine | RepDB | — | da verificare | src/assets/exercises-repdb/single-leg-calf-raise-peak.webp | 2026-11-08 | sorgente RepDB `single-leg-calf-raise` |
| l-sit-l5 | unica | RepDB | — | da verificare | src/assets/exercises-repdb/l-sit-main.webp | 2026-11-08 | sorgente RepDB `l-sit` |
| vertical-pull-l3 | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/pull-up-start.webp | 2026-11-08 | sorgente RepDB `pull-up` |
| vertical-pull-l3 | fine | RepDB | — | da verificare | src/assets/exercises-repdb/pull-up-peak.webp | 2026-11-08 | sorgente RepDB `pull-up` |
| horizontal-pull-l1 | inizio | RepDB | — | ritirata | src/assets/exercises-repdb/inverted-row-start.webp | 2026-11-21 | tolta dalla voce in db2544e (T-37), **file tolto dal repo** (nessun altro uso, termine 3). Prima: T-37, verifica del 2026-11-21: attrezzo (R11), sbarra su montanti; la scala è agli anelli. Togliere la voce da `REPDB_STEP_ART`; `inverted-row` resta senza usi: file fuori dal repo (termine 3). Poi `ritirata` |
| horizontal-pull-l1 | fine | RepDB | — | ritirata | src/assets/exercises-repdb/inverted-row-peak.webp | 2026-11-21 | tolta dalla voce in db2544e (T-37), **file tolto dal repo** (nessun altro uso, termine 3). Prima: T-37, verifica del 2026-11-21: attrezzo (R11), sbarra su montanti; la scala è agli anelli. Togliere la voce da `REPDB_STEP_ART`; `inverted-row` resta senza usi: file fuori dal repo (termine 3). Poi `ritirata` |
| horizontal-pull-l3 | inizio | RepDB | — | ritirata | src/assets/exercises-repdb/trx-row-start.webp | 2026-11-21 | tolta dalla voce in 50793fd: corpo a ~45°, il gradino è orizzontale; spostata su `rematore-inverso-trx`. Prima: posizione (R11): TRX giusto ma corpo a ~45-50°, il gradino è «orizzontale». È il gradino 2: spostare la foto su `rematore-inverso-trx` |
| horizontal-pull-l3 | fine | RepDB | — | ritirata | src/assets/exercises-repdb/trx-row-peak.webp | 2026-11-21 | tolta dalla voce in 50793fd: corpo a ~45°, il gradino è orizzontale; spostata su `rematore-inverso-trx`. Prima: posizione (R11): TRX giusto ma corpo a ~45-50°, il gradino è «orizzontale». È il gradino 2: spostare la foto su `rematore-inverso-trx` |
| horizontal-push-l2 | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/push-up-start.webp | 2026-11-08 | sorgente RepDB `push-up` |
| horizontal-push-l2 | fine | RepDB | — | da verificare | src/assets/exercises-repdb/push-up-peak.webp | 2026-11-08 | sorgente RepDB `push-up` |
| horizontal-push-l4 | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/pseudo-planche-push-ups-start.webp | 2026-11-08 | sorgente RepDB `pseudo-planche-push-ups` |
| horizontal-push-l4 | fine | RepDB | — | da verificare | src/assets/exercises-repdb/pseudo-planche-push-ups-peak.webp | 2026-11-08 | sorgente RepDB `pseudo-planche-push-ups` |
| horizontal-push-l5 | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/archer-push-ups-start.webp | 2026-11-08 | sorgente RepDB `archer-push-ups` |
| horizontal-push-l5 | fine | RepDB | — | da verificare | src/assets/exercises-repdb/archer-push-ups-peak.webp | 2026-11-08 | sorgente RepDB `archer-push-ups` |
| vertical-push-l1 | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/pike-push-ups-start.webp | 2026-11-08 | sorgente RepDB `pike-push-ups` |
| vertical-push-l1 | fine | RepDB | — | da verificare | src/assets/exercises-repdb/pike-push-ups-peak.webp | 2026-11-08 | sorgente RepDB `pike-push-ups` |
| vertical-push-l5 | inizio | RepDB | — | ritirata | src/assets/exercises-repdb/handstand-push-ups-start.webp | 2026-11-21 | tolta dalla voce in 50793fd: parallette senza muro. File tolto dal repo. Prima: attrezzo (R11): verticale libera su parallette, nessun muro; il gradino è «HSPU al muro complete» |
| vertical-push-l5 | fine | RepDB | — | ritirata | src/assets/exercises-repdb/handstand-push-ups-peak.webp | 2026-11-21 | tolta dalla voce in 50793fd: parallette senza muro. File tolto dal repo. Prima: attrezzo (R11): verticale libera su parallette, nessun muro; il gradino è «HSPU al muro complete» |
| dip-l1 | inizio | RepDB | — | ritirata | src/assets/exercises-repdb/bench-dips-start.webp | 2026-11-21 | tolta dalla voce in 50793fd: una panca sola, il dip è tra due panche. Prima: appoggi (R11): una panca e piedi a terra; il gradino è «tra due panche». Stessa foto ritirata da `dip-panche-piedi-rialzati` |
| dip-l1 | fine | RepDB | — | ritirata | src/assets/exercises-repdb/bench-dips-peak.webp | 2026-11-21 | tolta dalla voce in 50793fd: una panca sola, il dip è tra due panche. Prima: appoggi (R11): una panca e piedi a terra; il gradino è «tra due panche». Stessa foto ritirata da `dip-panche-piedi-rialzati` |
| dip-l3 | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/dips-start.webp | 2026-11-08 | sorgente RepDB `dips` |
| dip-l3 | fine | RepDB | — | da verificare | src/assets/exercises-repdb/dips-peak.webp | 2026-11-08 | sorgente RepDB `dips` |
| dip-l5 | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/ring-dips-start.webp | 2026-11-08 | sorgente RepDB `ring-dips` |
| dip-l5 | fine | RepDB | — | da verificare | src/assets/exercises-repdb/ring-dips-peak.webp | 2026-11-08 | sorgente RepDB `ring-dips` |
| single-leg-squat-l2 | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/bulgarian-split-squat-start.webp | 2026-11-08 | sorgente RepDB `bulgarian-split-squat` |
| single-leg-squat-l2 | fine | RepDB | — | da verificare | src/assets/exercises-repdb/bulgarian-split-squat-peak.webp | 2026-11-08 | sorgente RepDB `bulgarian-split-squat` |
| posterior-chain-l1 | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/single-leg-glute-bridge-start.webp | 2026-11-08 | sorgente RepDB `single-leg-glute-bridge` |
| posterior-chain-l1 | fine | RepDB | — | da verificare | src/assets/exercises-repdb/single-leg-glute-bridge-peak.webp | 2026-11-08 | sorgente RepDB `single-leg-glute-bridge` |
| posterior-chain-l6 | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/nordic-hamstring-curl-start.webp | 2026-11-08 | sorgente RepDB `nordic-hamstring-curl` |
| posterior-chain-l6 | fine | RepDB | — | da verificare | src/assets/exercises-repdb/nordic-hamstring-curl-peak.webp | 2026-11-08 | sorgente RepDB `nordic-hamstring-curl` |
| hip-thrust-l3 | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/single-leg-glute-bridge-start.webp | 2026-11-08 | sorgente RepDB `single-leg-glute-bridge` |
| hip-thrust-l3 | fine | RepDB | — | da verificare | src/assets/exercises-repdb/single-leg-glute-bridge-peak.webp | 2026-11-08 | sorgente RepDB `single-leg-glute-bridge` |
| hip-hinge-l4 | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/single-leg-romanian-deadlift-start.webp | 2026-11-08 | sorgente RepDB `single-leg-romanian-deadlift` |
| hip-hinge-l4 | fine | RepDB | — | da verificare | src/assets/exercises-repdb/single-leg-romanian-deadlift-peak.webp | 2026-11-08 | sorgente RepDB `single-leg-romanian-deadlift` |
| calf-l2 | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/bodyweight-calf-raise-start.webp | 2026-11-08 | sorgente RepDB `bodyweight-calf-raise` |
| calf-l2 | fine | RepDB | — | da verificare | src/assets/exercises-repdb/bodyweight-calf-raise-peak.webp | 2026-11-08 | sorgente RepDB `bodyweight-calf-raise` |
| step-up-l2 | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/step-ups-start.webp | 2026-11-08 | sorgente RepDB `step-ups` |
| step-up-l2 | fine | RepDB | — | da verificare | src/assets/exercises-repdb/step-ups-peak.webp | 2026-11-08 | sorgente RepDB `step-ups` |
| core-l3 | unica | RepDB | — | da verificare | src/assets/exercises-repdb/hollow-body-hold-main.webp | 2026-11-08 | sorgente RepDB `hollow-body-hold` |
| core-l5 | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/hanging-leg-raise-start.webp | 2026-11-08 | sorgente RepDB `hanging-leg-raise` |
| core-l5 | fine | RepDB | — | da verificare | src/assets/exercises-repdb/hanging-leg-raise-peak.webp | 2026-11-08 | sorgente RepDB `hanging-leg-raise` |
| core-l6 | inizio | RepDB | — | da verificare | src/assets/exercises-repdb/ab-wheel-rollout-start.webp | 2026-11-08 | sorgente RepDB `ab-wheel-rollout` |
| core-l6 | fine | RepDB | — | da verificare | src/assets/exercises-repdb/ab-wheel-rollout-peak.webp | 2026-11-08 | sorgente RepDB `ab-wheel-rollout` |
| wall-sit-l2 | unica | RepDB | — | da verificare | src/assets/exercises-repdb/wall-sit-main.webp | 2026-11-08 | sorgente RepDB `wall-sit` |
| hang-l2 | unica | RepDB | — | da verificare | src/assets/exercises-repdb/dead-hang-main.webp | 2026-11-08 | sorgente RepDB `dead-hang` |
| affondi-rapidi-alternati | inizio+fine | generata | `lunge` `{rotate:false}` | da verificare | src/assets/exercises/affondi-rapidi-alternati.svg | 2026-11-09 | arrivata con il commit f63c9f1, mai passata dalla checklist |
| apertura-anche | inizio+fine | generata | `hip-opener` | da verificare | src/assets/exercises/apertura-anche.svg | 2026-11-09 | arrivata con il commit f63c9f1, mai passata dalla checklist |
| burpee | inizio+fine | generata | `burpee` | da rifare | src/assets/exercises/burpee.svg | 2026-11-12 | Prima verifica. Freccia tolta con 47c7f6d (4.1). Anatomia: pannello 1 braccia che partono dal collo e toccano la testa (5,7); pannello 2 braccio di 14,6 contro 24,7 (-41%) con il gomito sotto la spalla. Coerenza: pannello 1 frontale, pannello 2 laterale — spec 4.23 |
| corda-battaglia-cerchi | inizio+fine | generata | `rope-circles` | da verificare | src/assets/exercises/corda-battaglia-cerchi.svg | 2026-11-09 | arrivata con il commit f63c9f1, mai passata dalla checklist |
| corda-battaglia-onde-doppie | inizio+fine | generata | `rope-double` | da verificare | src/assets/exercises/corda-battaglia-onde-doppie.svg | 2026-11-09 | arrivata con il commit f63c9f1, mai passata dalla checklist |
| corda-battaglia-slam | inizio+fine | generata | `rope-slam` | da verificare | src/assets/exercises/corda-battaglia-slam.svg | 2026-11-09 | arrivata con il commit f63c9f1, mai passata dalla checklist |
| corda-per-saltare | inizio+fine | generata | `jump-rope` | da verificare | src/assets/exercises/corda-per-saltare.svg | 2026-11-09 | arrivata con il commit f63c9f1, mai passata dalla checklist |
| curl-manubri-supino | inizio+fine | generata | `db-curl` | ritirata | src/assets/exercises/curl-manubri-supino.svg | 2026-11-21 | in app nessuna immagine da 50793fd (`FIGURE_SENZA_IMMAGINE`): il file resta nel repo, l'app non lo mostra. Prima: attrezzo (R4): una barra unica fra le due mani legge come bilanciere, la scheda dice manubri. Stile da rifare: solo elenco — prima: arrivata con il commit f63c9f1, mai passata dalla checklist |
| curl-panca-inclinata | inizio+fine | generata | `incline-curl` | verificata | src/assets/exercises/curl-panca-inclinata.svg | 2026-11-12 | verifica provvisoria (scheda senza equipment/frames). Prima verifica. Panca a 45 gradi, braccia che pendono dietro la linea del busto, gomito fermo nei due pannelli, braccio disteso in basso. La freccia segnata il 2026-11-09 non c-e mai stata: era il tracciato della panca. Note: tronco 7 gradi piu ripido dello schienale (spalle 2 unita sopra la panca), quattro segmenti affollati alla spalla nel pannello 2 |
| curl-trx | inizio+fine | generata | `trx-curl` | da rifare | src/assets/exercises/curl-trx.svg | 2026-11-12 | Misurata con pose-audit e guardata a 230 px (2026-11-12). Anatomia: pannello 1 braccio collassato (1 + 6 unita contro 11 + 13), mano al mento; l-etichetta dice braccia distese. Seduta attiva, nessuna foto — spec 4.2 |
| estensione-tricipiti-trx | inizio+fine | generata | `trx-ext` | da rifare | src/assets/exercises/estensione-tricipiti-trx.svg | 2026-11-12 | Misurata con pose-audit e guardata a 230 px (2026-11-12). Anatomia: testa piegata all-indietro di 79 e 84 gradi nei due pannelli; braccio da 8 a 21 tra i pannelli. Seduta attiva, nessuna foto — spec 4.2 |
| military-press-manubri | inizio+fine | generata | `press` | da rifare | src/assets/exercises/military-press-manubri.svg | 2026-11-18 | tecnica (R3): frontale, i cue 2-4 (sopra le orecchie, lombare) si giudicano di lato; attrezzo (R4): i due manubri leggono come una barra, nel pannello 1 la testa riempie lo stacco. Avambraccio 8 contro 14: scorcio plausibile (gomito davanti, cue 1) — spec 4.26 (verifica provvisoria) |
| plank-tocco-spalla | inizio+fine | generata | `plank-tap` | da rifare | src/assets/exercises/plank-tocco-spalla.svg | 2026-11-18 | anatomia: nel pannello 2 manca il braccio d'appoggio, il plank non ha appoggio; tecnica (R3): di lato la rotazione del bacino (cue 3) non esiste — spec 4.28 (verifica provvisoria) |
| plank-trascinamento-kb | inizio+fine | generata | `plank-drag` | da verificare | src/assets/exercises/plank-trascinamento-kb.svg | 2026-11-09 | arrivata con il commit f63c9f1, mai passata dalla checklist |
| respirazione-360 | unica | generata | `breathing` | da rifare | src/assets/exercises/respirazione-360.svg | 2026-11-18 | tecnica (R10): «supino» ma testa e tronco 12-14 u sopra il pavimento; ginocchia piegate, piedi a terra e mani su petto e costole giusti. Fotogramma corretto: è una posa sola, non inizio+fine — spec 4.27 (verifica provvisoria) |
