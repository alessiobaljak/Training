# ARCHIVE.md — testo integrale delle voci tolte dai file principali

Niente qui è chiuso per il solo fatto di essere qui: le voci `4.x` sono
**specifiche aperte** di GENERATOR_SPEC §4, spostate per il limite delle 300
righe, salvo quelle marcate **CHIUSA**. L'indice che le richiama sta in
`GENERATOR_SPEC.md` §4. In fondo, l'esito delle specifiche chiuse.

### 4.3 `circonduzioni-spalle` — archetipo nuovo `shoulder-circle` — **CHIUSA 2026-11-12**
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

### 4.4 `step-rapidi-box` — stesso archetipo, parametri diversi — **CHIUSA 2026-11-12** (difetto nuovo in GENERATOR_SPEC §4.22)
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

### 4.12 `corda-battaglia-onde-alternate` — la corda deve leggersi come corda
**Oggi**: le due `wave` sono curve chiuse che si incrociano e passano sopra il
tronco: a 230 px leggono come un mantello. Non c'è ancoraggio. La postura è
quasi eretta, mentre il cue chiede un mezzo squat con le anche indietro.
**Deve**: ancoraggio visibile al bordo destro (un `wall` corto o un box
basso). Due onde a **S aperta**, che non si incrociano e non passano sopra il
tronco: una in salita dalla mano alta, una in discesa dalla mano bassa.
Postura: ginocchia piegate, anche indietro, busto inclinato in avanti —
mezzo squat, non inchino.
**Accettazione**: a 230 px si distinguono due corde separate e l'ancoraggio;
l'anca è visibilmente dietro la linea del tallone.

### 4.13 `curl-martello-manubri` — la presa neutra non si vede
**Oggi**: il `weight` è una barretta **orizzontale**: di fronte, è il manubrio
di un curl a presa supina. L'esercizio esiste solo per la presa neutra.
**Deve**: una variante verticale del manubrio (`weight(x, y, { vertical:
true })`) allineata all'avambraccio, per tutti i gesti a presa neutra.
**Accettazione**: messe affianco, la figura del curl a presa neutra e quella
del curl a martello si distinguono per l'orientamento del manubrio.

### 4.14 `stacco-rumeno-manubri` — due manubri, non un bilanciere
**Oggi**: `weight(46, 61)` e `weight(55, 61)` sono a 9 px di distanza e larghi
11: si sovrappongono e leggono come **una barra sola**. Il repo ha già
scartato una foto RepDB perché aveva il bilanciere addosso; qui lo ridisegna.
**Deve**: i due manubri separati e riconoscibili come due, in entrambi i
pannelli (distanza tra i centri ≥ larghezza del segno, o uno leggermente più
in alto dell'altro per effetto prospettico).
**Accettazione**: a 230 px si contano due attrezzi.

### 4.15 `rematore-manubrio-un-braccio` — manca il ginocchio sulla panca
**Oggi**: mano sulla panca, ma **entrambi i piedi a terra** e nessun ginocchio
appoggiato. Il cue 1 dice «una mano **e un ginocchio** appoggiati alla panca».
**Deve**: ginocchio della gamba vicina appoggiato sopra la panca, tibia
orizzontale, gamba lontana a terra distesa indietro; schiena parallela a
terra. **Oppure** `training-designer` cambia il cue: una sola delle due cose
può restare, e la decisione è sua, non mia.
**Accettazione**: figura e cue descrivono lo stesso appoggio.

### 4.16 `mountain-climber` — spalle sopra i polsi
**Oggi**: il polso sta ~8 px dietro la spalla (cue: «spalle sopra i polsi») e
il ginocchio che sale arriva a metà tronco, non verso il petto.
**Deve**: mano sulla verticale della spalla (stessa `x`); il ginocchio che
sale arriva all'altezza del gomito; bacino alla **stessa** altezza nei due
pannelli.
**Accettazione**: `ha[0] ≈ sh[0]` entro 2 px; `hi` identica nei due pannelli.


## Specifiche chiuse — esito

Chiuse il **2026-11-12** con il commit `47c7f6d`, verificate sul foglio di
contatto (230 px, poi 460 px sui dubbi) e con `media/scripts/pose-audit.mjs`.

- **4.1 frecce** — `grep -c arrowUp` = 0; l'unico `<path d="M … L …">` nelle
  174 SVG è la panca di `curl-panca-inclinata`, che è un attrezzo. Correzione
  al conto del 2026-11-08/09: i file con la freccia erano **10**, non 11. La
  «freccia» di `curl-panca-inclinata` era il tracciato della panca: falso
  positivo mio.
- **4.3 circonduzioni** — archetipo `shoulder-circle`, md5 unico, corpo
  identico nei due pannelli, solo il braccio si muove.
- **4.4 step rapidi** — box 16, scambio dei piedi, non più uguale allo
  step-up alto. Criteri rispettati; la figura resta `da rifare` per la tibia
  (§4.22).
- **4.18 scala hip-thrust** — panca e due gambe dove le etichette le dicono;
  nessun `<rect>` nelle figure «a terra». **6 md5 distinti su 9 file**, uno per
  variante: l1, l2, l3 = `posterior-chain-l1`, l4 = l5 = monopodalico, l6,
  bilaterale. Il criterio scritto («non più di 4») era sbagliato: valeva «uno
  per variante disegnabile».
- **4.20 hip thrust bilaterale** — due gambe e due piedi a 230 px, campana
  tangente alla coscia (7,0 e 7,1 dal centro, r=6), braccia alla maniglia,
  piede sotto il ginocchio in chiusura (0 unità), niente freccia.
- **4.21 lockout** — panca con il bordo a y=77; in chiusura spalla, anca e
  ginocchio a y=73, tibia verticale; segmenti 26/20/27 costanti. Nelle tre
  figure **a terra** l'allineamento è giusto (anca 0,3 sotto la retta) e il
  ginocchio è a 85°: la tibia a 24° dalla verticale è la geometria corretta del
  ponte a terra. Il criterio «tibia entro 10°» valeva per la panca, non per
  tutte e nove.
