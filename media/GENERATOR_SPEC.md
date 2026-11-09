# GENERATOR_SPEC.md — specifica del generatore di figure

Il file è `scripts/generate-exercise-svg.mjs` (800 righe, `npm run svg`).
**Lo modifica la sessione principale. Qui si scrive cosa deve fare.**

## 1. Come è fatto

```
primitive di disegno  →  figure(pose)  →  ARCHETYPES  →  EXERCISES / STEPS  →  render()
```

- **Tela**: 2 riquadri da 100 px + 10 di stacco = `viewBox 0 0 210 110`.
  Pavimento a y=102. Posa singola: stessa tela, figura centrata.
- **Primitive**: `poly` `head` `floor` `bar` `box` `wall` `band` (tratteggio =
  elastico) `weight` (manubrio: barretta spessa) `bell` (kettlebell: campana +
  maniglia) `strap` (cinghia TRX/anelli) `prop` (opacità 0.32 per gli attrezzi)
  `arrowUp` (**da eliminare**, vedi §4.1).
- **`figure(pose)`**: chiavi della posa, tutte coppie `[x, y]`.

| chiave | cos'è | note |
|---|---|---|
| `he` | centro della testa | cerchio r=6 |
| `ne` | base del collo | origine del tronco |
| `hi` | anca | fine del tronco |
| `sh` / `sh2` | spalla vicina / lontana | opzionali: **senza, il braccio parte dal collo e attraversa la testa** |
| `el` / `el2` | gomito | |
| `ha` / `ha2` | mano | |
| `kn` / `kn2` | ginocchio | |
| `fo` / `fo2` | piede | |

Gli arti «2» sono il lato lontano, tratto più sottile. Senza `fo2` la figura
ha una gamba sola: è la scelta giusta per i monopodalici, è un errore per gli
altri.

- **`ARCHETYPES`**: 43 funzioni `(options) => [pannello1, pannello2?]`.
- **`EXERCISES`** (56 voci) e **`STEPS`** (102 voci): `slug → [archetipo,
  opzioni, aria-label]`. L'`aria-label` è il testo alternativo che finisce
  nell'app: deve descrivere il movimento, non nominarlo.
- Lo script **cancella e riscrive** `src/assets/exercises/` e
  `src/assets/steps/` a ogni esecuzione: non si corregge un SVG a mano, si
  corregge l'archetipo.

## 2. La regola che ha già salvato tre figure

> **Un esercizio prende un archetipo nuovo quando cambia il gesto o
> l'attrezzo, non quando «assomiglia».**

Tre figure mentivano e sono state corrette il 2026-11-08: l'affondo con
rotazione mostrava il box dello split squat bulgaro, il rematore con manubrio
mostrava le maniglie del TRX, il curl a martello mostrava gli elastici. Tutte
e tre erano figure **corrette**, dell'esercizio **sbagliato**.

Come si applica, in quest'ordine:
1. **Cambia l'attrezzo?** (manubri ↔ elastico ↔ kettlebell ↔ TRX ↔ ruota)
   → archetipo nuovo, o parametro che cambia l'attrezzo disegnato. Mai riuso.
2. **Cambia il gesto?** (cerniera d'anca ↔ squat, spalla ↔ gomito, rotazione ↔
   traslazione) → archetipo nuovo.
3. **Cambia solo un appoggio, un'altezza, un'ampiezza, una presa?**
   → **parametro** dell'archetipo esistente (`feet`, `hands`, `height`,
   `wide`, `elevated`, `seated`, `oneArm`, `rearElevated`).
4. **Cambia solo il tempo, la pausa o la zavorra?** → stessa figura. La forma
   del corpo è la stessa; la differenza la dice il nome del gradino.

Corollario operativo: **due file identici byte per byte a meno dell'etichetta
sono un allarme.** Si trovano così, e vanno giustificati uno per uno:

```
for f in src/assets/exercises/*.svg; do
  h=$(sed -E 's/aria-label="[^"]*"//; s|<title>[^<]*</title>||' "$f" | md5sum | cut -c1-32)
  echo "$h $(basename $f .svg)"
done | sort | uniq -D -w32
```

## 3. Quale archetipo spetta a quale schema di movimento

| schema | archetipi | attrezzo |
|---|---|---|
| trazione verticale | `hang-pull` `hang-hold` `scap-pull` `leg-raise` | sbarra |
| trazione orizzontale | `row` `db-row` `pullover` | TRX / manubrio+panca / TRX |
| spinta orizzontale | `pushup` `fly` `bench-dip` `dip` | corpo libero / manubri |
| spinta verticale | `pike` `hspu` `handstand` `overhead-ext` | muro / manubrio |
| squat mono | `split-squat` `shrimp` `sissy` `wallsit` `step-up` `lunge` | box / corpo libero |
| squat bipodalico | `goblet` | kettlebell o manubrio |
| cerniera d'anca | `rdl` `hinge` `swing` `hip-thrust` `nordic` | corpo libero / manubri / kettlebell |
| core | `hollow` `lsit` `ab-wheel` `pallof` `carry` `mountain-climber` | corpo libero / ruota / elastico / peso |
| spalla e braccio | `band-raise` `face-pull` `curl` `db-curl` | elastico / manubri |
| polpaccio | `calf` | corpo libero |
| metabolico e mobilità | `rope` `jack` `run` `walk` `mobility` | corda / corpo libero |

## 4. Da sviluppare — specifiche aperte

Ogni voce: **cosa c'è oggi**, **cosa deve mostrare**, **criterio di
accettazione**. La sessione principale implementa; io riverifico sul foglio di
contatto prima che l'immagine passi a `training-quality`.

### 4.1 Pulizia trasversale (una modifica, undici figure)
**Oggi**: `arrowUp` è chiamata da `hip-thrust` (due volte: `{}` e
`{bilateral}`), da `burpee` e da `incline-curl`. La freccia è dentro **4
figure di esercizio e 7 di gradino**: era in 8 file il 2026-11-08, è in 11
oggi perché la primitiva è ancora lì e i nuovi archetipi la chiamano.
**Deve**: nessuna freccia dentro l'immagine (STYLE_GUIDE §6). Si tolgono le
chiamate e si elimina la primitiva.
**Accettazione**: `grep -c arrowUp scripts/generate-exercise-svg.mjs` = 0;
nessun `<path d="M ... L ...">` nelle 174 SVG oltre a quelli degli attrezzi.

### 4.2 La spalla si stacca dal collo (una modifica, quattro figure)
**Oggi**: `overhead-ext`, `pullover`, `swing` (pannello 2) e `rope` non
passano `sh`/`sh2`, quindi il braccio parte dal collo e il segmento
attraversa il cerchio della testa. Si vede a 230 px.
**Deve**: ogni archetipo con le braccia sopra o davanti alla testa dichiara
`sh` e `sh2` a ±5 px dal collo, scelti in modo che nessun segmento
braccio/avambraccio intersechi il cerchio `he` (r=6).
**Accettazione**: a 460 px, in tutte e quattro le figure, testa e braccia si
distinguono senza ambiguità.

### 4.3–4.5, 4.17, 4.19 — testo integrale in `ARCHIVE.md`
Specifiche **aperte**, scritte per intero il 2026-11-08 e non ancora
implementate; spostate per tenere questo file sotto le 300 righe.
- 4.3 `circonduzioni-spalle` → archetipo nuovo `shoulder-circle`.
- 4.4 `step-rapidi-box` → `step-up` con `boxH` basso e cadenza.
- 4.5 `rollout-trx` → archetipo nuovo `trx-rollout`, in piedi e sospeso.
- 4.17 tre figure di ripiego con l'elastico al posto dei manubri.
- 4.19 prese delle trazioni: `grip` su `hang-pull`.

### 4.6 `pallof-press-elastico` — rifare l'inquadratura
**Oggi**: vista laterale, l'elastico arriva da destra e le mani si spingono a
sinistra **attraversando il tronco**. Nel piano del disegno l'anti-rotazione
non esiste: quello che si vede è una spinta orizzontale con l'elastico.
**Deve**: vista **dall'alto** o **tre quarti**. L'elastico parte da un
ancoraggio laterale e resta sempre fuori dal tronco. Pannello 1: mani allo
sterno. Pannello 2: braccia distese **in avanti**, perpendicolari all'asse
dell'elastico; spalle e bacino **identici** nei due pannelli — la figura non
ruota di un grado, ed è l'unica cosa che l'esercizio chiede.
**Accettazione**: il tratteggio non interseca mai la figura; tronco e piedi
hanno le stesse coordinate nei due pannelli.

### 4.7 `suitcase-carry` — rifare l'inquadratura
**Oggi**: vista laterale, posa singola; il kettlebell si sovrappone alla
coscia e legge come un oggetto attaccato alla gamba. Di lato non si vede né
che le spalle sono alla stessa altezza né che il busto non si inclina.
**Deve**: vista **frontale**, posa singola. Peso in una mano sola, lungo il
fianco, staccato dalla gamba. Linea delle spalle **orizzontale**, asse del
tronco **verticale**, braccio libero rilassato. Lo squilibrio si legge dal
peso, non dalla posa.
**Accettazione**: a 230 px si vede che un lato ha il peso e l'altro no, e che
le due spalle sono alla stessa altezza.

### 4.8 `goblet-squat` — profondità e attrezzo
**Oggi**: vista frontale; l'anca resta **sopra** il ginocchio (y 76 contro
84), quindi è un mezzo squat, mentre il cue dice «piega dell'anca sotto il
ginocchio»; il `bell` si sovrappone al tronco e legge come pancia; le gambe
divaricate chiudono una forma a rombo che a 230 px non legge come squat.
**Deve**: vista **laterale**. Pannello 1: in piedi, peso al petto, gomiti
bassi e **davanti** al tronco, visibilmente staccato dal busto. Pannello 2:
anca **sotto** la linea del ginocchio (y anca > y ginocchio), tibia inclinata
in avanti, tallone a terra, busto alto.
**Accettazione**: nel pannello 2 `hi[1] > kn[1]`; il kettlebell è
riconoscibile come attrezzo separato dal tronco.

### 4.9 `kb-swing` — il fondo è pericoloso così
**Oggi**: nel pannello del fondo il kettlebell sta **basso e davanti** al
corpo, sotto il petto. È esattamente la posizione che il cue chiama fine della
serie: «il peso smette di andare indietro e comincia a scendere verso il
pavimento». Il commento nel codice dice il contrario di quello che le
coordinate disegnano.
**Deve**: nel pannello del fondo il kettlebell sta **alto e indietro**, dietro
la linea delle ginocchia, all'altezza dell'inguine, avambracci appoggiati
all'interno coscia. Nel pannello alto: corpo verticale in linea
caviglia-anca-spalla-testa (plank in piedi), kettlebell all'altezza del petto,
braccia che **non** superano la linea delle spalle, nessuna inarcatura
lombare.
**Accettazione**: nel pannello del fondo la `x` del kettlebell sta dalla parte
dell'anca rispetto alle ginocchia, non dalla parte della testa; nel pannello
alto testa, anca e caviglia sono allineate verticalmente. **Questa figura non
torna in libreria senza il parere di `training-quality`**: è l'esercizio con
il rischio più alto del catalogo.

### 4.10 `affondo-con-rotazione` — la rotazione va dalla parte giusta
**Oggi**: in fondo affondo le braccia sono **piegate** e puntano verso il lato
della gamba **dietro**. Il cue dice «ruota il busto verso il lato della gamba
**avanti**, braccia **distese** davanti al petto».
**Deve**: vista **tre quarti**. Braccia distese (gomito dritto), portate dalla
parte della gamba avanti; anche quadrate verso avanti — la rotazione viene dal
torace. Ginocchio posteriore basso, vicino a terra, senza toccarla.
**Accettazione**: gomito visibilmente esteso; le mani stanno dalla stessa
parte del piede avanzato.

### 4.11 `estensione-tricipiti-sopra-testa` — pannello 1 illeggibile
**Oggi**: nel pannello basso braccia, testa e manubrio formano un nodo; il
peso è **di fianco** alla testa invece che dietro, e i bracci passano sopra il
cranio.
**Deve**: vista **laterale**. Pannello 1 (alto, posizione iniziale secondo il
cue): braccia distese sopra la testa, peso sopra. Pannello 2 (basso): gomiti
fermi, alti e vicini alle orecchie, avambracci piegati **dietro** la testa,
peso dietro la nuca, omero verticale. **Ordine dei pannelli invertito**
rispetto a oggi: la posizione iniziale della scheda è a braccia distese.
**Accettazione**: nessun segmento interseca il cerchio della testa; il peso
nel pannello basso sta dalla parte opposta del viso.

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

### 4.18 Scala hip-thrust: la panca che non c'è, le gambe che sono due
Un archetipo solo serve 9 figure (1 esercizio + 6 gradini `hip-thrust-l*` +
`posterior-chain-l1` + il nuovo bilaterale) e oggi 8 di esse sono **lo stesso
disegno byte per byte**. Due parametri mancano, non uno.
- `bench: false` per `hip-thrust-l1`, `hip-thrust-l3`, `posterior-chain-l1`:
  etichetta «glute bridge **a terra**», figura con la panca. Spalle appoggiate
  al pavimento, nessun `box`.
- `bilateral: true` per `hip-thrust-l1` e `hip-thrust-l2`: le etichette dicono
  «a due gambe», la mappa passa `{}` e l'app mostra il monopodalico. È lo
  stesso difetto che la figura nuova doveva chiudere, lasciato nella scala che
  l'app disegna accanto ad essa.
**Accettazione**: i 9 file non producono più di 4 md5 distinti a etichetta
rimossa; nessuna figura etichettata «a terra» contiene un `<rect>`; nessuna
etichettata «due gambe» contiene un solo `polyline` di gamba.

### 4.20 `hip-thrust-panca-bilaterale` — la figura nuova, da rifare
**Oggi**: `bilateral: true` disegna la gamba lontana a 2–3 unità da quella
vicina (`kn 78,78` / `kn2 76,81`; piedi a 86 e 84) e il kettlebell come
`bell(61,72)` e `bell(57,44)`. A 210 px le due gambe fondono in una sola e
restano distinguibili dal monopodalico solo per un anello grigio da 6 unità.
**Deve**, in ordine di gravità:
1. **Due gambe leggibili.** La gamba lontana sfalsata di 8–10 unità (è la
   distanza che la libreria usa già in `hollow`, `squat`, `press`), tratto 2,
   piede lontano separato da quello vicino. Vista di lato i piedi affiancati
   si sovrappongono davvero: se la vista non può dire «due», la dice la posa,
   non un offset da 2 unità.
2. **Kettlebell appoggiato, non infilato.** Oggi la linea del corpo attraversa
   il cerchio in **tutti e due** i pannelli (distanza centro-segmento 4,9 e
   4,9 contro r=6): legge come un anello intorno alla coscia, non come un peso
   sopra l'anca. Il cerchio dev'essere tangente dall'alto al segmento
   anca→ginocchio e non intersecato da nessuna linea del corpo.
3. **Le mani.** Il cue 2 dice «tenuto con le mani» e la figura non ha braccia
   (`el`/`ha` assenti in tutto l'archetipo). Un braccio dalla spalla alla
   campana risolve il cue, dà un secondo segno contro il monopodalico e fa
   leggere la campana come un peso.
4. **Piedi sotto le ginocchia** (cue 1): oggi il piede è 8 unità avanti al
   ginocchio nel pannello 1 e 6 nel 2.
**Accettazione**: a 210 px si contano due gambe e due piedi senza ingrandire;
nessuna linea del corpo tocca il cerchio della campana; `|foot.x - kn.x| ≤ 2`
nel pannello finale; niente freccia (§4.1).

### 4.21 Il lockout dell'hip thrust (tutte e 9 le figure)
**Oggi**, pannello finale: spalla `34,48`, anca `56–60`, ginocchio `74`,
piede `100`. L'anca sta **6,7 unità sopra** la retta spalla→ginocchio e il
ginocchio 18 sotto l'anca: il bacino è il colmo di una tenda. È la posa che il
cue 4 chiama errore tipico («inarcare la lombare per guadagnare altezza») e il
contrario del cue 5 («bacino parallelo al pavimento»).
**Deve**: in chiusura spalla, anca e ginocchio quasi allineati, con l'anca mai
sopra quella retta; coscia orizzontale; tibia verticale. Questo vuole la panca
più bassa: il bordo è a `y=50` (52 unità da terra) mentre la tibia è 27, e con
quella panca il lockout corretto è geometricamente impossibile. Bordo panca
all'altezza del ginocchio, cioè `y ≈ 72–76`.
**Accettazione**: nel pannello finale `hi.y` non è minore della retta
spalla→ginocchio; `|kn.y - hi.y| ≤ 4`; tibia entro 10° dalla verticale.
