# ARCHIVE.md — testo integrale delle voci tolte dai file principali

Niente qui è chiuso per il solo fatto di essere qui: le voci `4.x` sono
**specifiche aperte** di GENERATOR_SPEC §4, spostate per il limite delle 300
righe. L'indice che le richiama sta in `GENERATOR_SPEC.md` §4.

### 4.3 `circonduzioni-spalle` — archetipo nuovo `shoulder-circle`
**Oggi**: usa `mobility`, ed è **identica pixel per pixel** a
`mobilita-anche-torace-spalle`. Due esercizi diversi nello stesso
riscaldamento, una sola immagine.
**Deve**: due pannelli, vista **laterale**. Pannello 1: in piedi, braccio
vicino teso lungo il fianco, busto verticale, costole chiuse. Pannello 2:
stesso corpo, identico, con il braccio teso in alto in avanti (ore 12) —
gomito dritto in entrambi. Nessun box, nessun attrezzo. Il tronco, l'anca e le
gambe hanno **le stesse coordinate** nei due pannelli: l'unica cosa che si
muove è il braccio, ed è il punto dell'esercizio.
**Accettazione**: il confronto md5 (§2) non la accoppia più a nessun'altra
figura; a 230 px si distingue dalla figura della mobilità generale.

### 4.4 `step-rapidi-box` — stesso archetipo, parametri diversi
**Oggi**: `['step-up', {}]`, identica a `step-up-box-alto` (box all'altezza
del ginocchio). La scheda dice «box o gradino **basso**», «cambio rapido e
continuo», «appoggio di pianta piena».
**Deve**: `['step-up', { height: 16, alternate: true }]`. `height: 16` è il
gradino basso. `alternate: true` cambia il secondo pannello: non la figura in
piedi **sopra** il box, ma lo scambio dei piedi — piede destro sul box e
sinistro a terra nel primo, invertiti nel secondo, bacino alla stessa altezza
nei due. Piede appoggiato per intero sul bordo, mai di punta.
**Accettazione**: il box è visibilmente più basso del ginocchio; nessuno dei
due pannelli mostra la figura interamente sopra il box; non è più identica a
`step-up-box-alto`.

### 4.5 `rollout-trx` — archetipo nuovo `trx-rollout`
**Oggi**: usa `ab-wheel`, che disegna **la ruota** e la figura **in
ginocchio**. La scheda dice «maniglie in mano, braccia tese davanti, corpo
inclinato in avanti **sulle punte**». Attrezzo sbagliato e appoggio sbagliato:
è lo stesso difetto del rematore che mostrava il TRX, al contrario.
**Deve**: ancoraggio in alto, due `strap` continui dall'ancoraggio alle mani,
nessun cerchio a terra. Figura in piedi inclinata in avanti, appoggio sulle
punte dei piedi, corpo in linea dalle caviglie alla testa. Pannello 1: braccia
tese davanti al petto. Pannello 2: braccia oltre la testa, lombare neutra —
la linea collo-anca-caviglia resta **retta** in entrambi.
**Accettazione**: non c'è nessun cerchio; i piedi non sono mai in ginocchio;
non è più identica a `ab-wheel-o-rollout-trx`.

### 4.17 Figure di ripiego che mostrano l'attrezzo sbagliato
Tre slug mentono (lo dice anche `training/EXERCISE_SCHEMA.md` §2): il nome
dice manubri, lo slug dice elastico, e la figura segue lo slug. Oggi queste
figure non si vedono perché l'app preferisce la foto RepDB, ma restano nel
bundle e tornano a galla appena la mappatura cambia.
- `curl-elastico-presa-neutra` (nome: «Curl con manubri presa neutra»):
  `curl` → **`db-curl`** con manubrio verticale (§4.13).
- `alzate-laterali-elastico` (nome: «Alzate laterali con manubri»):
  `band-raise` → serve `db-raise`, stessa posa senza tratteggio, con un
  manubrio per mano.
- `croci-elastico-o-pushup-presa-larga` (nome: «Croci con manubri»): `fly`
  disegna due elastici ancorati ai lati; servono due manubri.
**Accettazione**: nessuna figura di un esercizio con i manubri contiene un
tratteggio da elastico.

### 4.19 Prese delle trazioni (priorità bassa)
`trazioni-prona-presa-media`, `trazioni-presa-larga`, `chin-up-presa-supina` e
`chin-up-presa-supina-stretta` producono **quattro file identici**, mentre tre
cue su quattro nominano la larghezza della presa. Serve `grip: 'stretta' |
'media' | 'larga'` su `hang-pull` (distanza delle mani sulla sbarra). Bassa
perché tutti e quattro hanno la foto RepDB, che la presa la mostra davvero.
