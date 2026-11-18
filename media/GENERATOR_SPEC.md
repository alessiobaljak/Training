# GENERATOR_SPEC.md — specifica del generatore di figure

Il file è `scripts/generate-exercise-svg.mjs` (1.098 righe al `47c7f6d`, `npm run svg`).
**Lo modifica la sessione principale. Qui si scrive cosa deve fare.**
**Stile in revisione (B8)**: tre direzioni da provare in `STYLE_TRIALS.md`;
finché Alessio non sceglie, qui si specificano solo pose e archetipi.

## 1. Come è fatto

```
primitive di disegno  →  figure(pose)  →  ARCHETYPES  →  EXERCISES / STEPS  →  render()
```

- **Tela**: 2 riquadri da 100 px + 10 di stacco = `viewBox 0 0 210 110`.
  Pavimento a y=102. Posa singola: stessa tela, figura centrata.
- **Primitive**: `poly` `head` `floor` `bar` `box` `wall` `band` (tratteggio =
  elastico) `weight` (manubrio: barretta spessa) `bell` (kettlebell: campana +
  maniglia) `strap` (cinghia TRX/anelli) `prop` (opacità 0.32 per gli attrezzi).
  `arrowUp` è stata eliminata il 2026-11-12: nessuna freccia dentro le figure.
- **Controllo a fine esecuzione**: oggi stampa i segmenti di braccio a meno di
  r=6 dal centro della testa; il criterio da adottare è in §4.2.
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

- **`ARCHETYPES`**: 57 funzioni `(options) => [pannello1, pannello2?]`.
- **`EXERCISES`** (72 voci) e **`STEPS`** (102 voci): `slug → [archetipo,
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

Chiuse il 2026-11-12 con `47c7f6d` (esito in `ARCHIVE.md`): 4.1, 4.3, 4.4,
4.18, 4.20, 4.21.

### 4.2 Braccia e testa: cosa è errore e cosa no (riscritta il 2026-11-12)
**Oggi**: il generatore stampa ogni segmento di braccio a meno di r=6 dal
centro della testa: **40 segmenti, 21 pose giuste e 19 difetti veri**. Il
criterio segnala la testa fra le braccia (verticale, hollow, rollout, slam),
che è anatomia, e non vede il difetto che produce: per far passare il braccio
si sposta la testa e si spezza il collo (pull-over pannello 1, 66°, nato con
`47c7f6d`; pike, HSPU ed estensione al TRX lo avevano già).
**Deve**: tre controlli, stampati a fine esecuzione come oggi.
- **E1 testa in asse**: angolo tra `he − ne` e `ne − hi` ≤ 40°. Oltre è
  errore. La testa non si sposta mai per far posto a un braccio.
- **E2 nessun gomito o mano dentro la testa**: distanza dal centro ≥ r.
- **E3 braccio sulla testa** (segmento a meno di r): errore se `sh`/`sh2`
  non sono dichiarate, o se il braccio non sta sopra la testa (vettore
  spalla→mano oltre 40° dall'asse `ne − hi`). Spalla dichiarata e braccio
  sopra la testa = testa fra le braccia: si stampa come informazione.
- Regola di scrittura, non misura: in vista frontale `sh`/`sh2` a ±5 dal
  collo sempre. Due braccia che partono dal punto del collo sono antenne.
**Accettazione**: sul generatore di `47c7f6d` E1–E3 danno errore esattamente
su: `pull-over-trx` #1 (E1), `pike-pushup-piedi-rialzati` #1 (E1 95°) e #2
(E2, E3), `negative-hspu-muro-o-pike-pushup` #1 (E1 58°),
`estensione-tricipiti-trx` #1 #2 (E1 79°/84°), `curl-trx` #1 (E2, E3),
`burpee` #1 e `mobilita-anche-torace-spalle` (E3, spalla), più i gradini che
copiano quelle pose (`vertical-push-l1…l6`, `handstand-l1`), e su `ab-wheel`
(`rollout-trx`, `core-l6`) solo per la spalla non dichiarata. **Nessun errore**
su `verticale-al-muro`, `handstand-l2…l6`, `hollow-hold`, `core-l1…l3`,
`corda-battaglia-slam`. Dopo le correzioni qui sotto: zero errori. Verifica
indipendente dagli SVG: `node media/scripts/pose-audit.mjs`.

| figura (gradini) | difetto | correzione |
|---|---|---|
| `pike-pushup-piedi-rialzati` (`vertical-push-l1` `l2`, `handstand-l1`) | #1 testa sopra il collo: guarda avanti invece che a terra. #2 gomito dentro la testa e piegato verso il viso; testa 12 unità sopra il pavimento | #1 testa in asse fra le braccia. #2 gomito verso i piedi, avambraccio quasi verticale, testa davanti alle mani vicino a terra (triangolo) |
| `negative-hspu-muro-o-pike-pushup` (`vertical-push-l3…l6`) | #1 testa spostata di 58° verso il muro | testa in asse, fra le braccia |
| `estensione-tricipiti-trx` | testa piegata indietro di 79° e 84°; braccio da 8 a 21 tra i pannelli | testa in asse, lunghezze uguali, `sh` dichiarata |
| `curl-trx` | #1 braccio collassato (1 + 6 unità), mano al mento; l'etichetta dice «braccia distese» | #1 braccia distese verso l'ancoraggio, cinghia in linea; `sh` |
| `mobilita-anche-torace-spalle`, `jumping-jack` #2, `burpee` #1 | braccia frontali dal punto del collo | `sh`/`sh2` a ±5 |
| `ab-wheel` | posa giusta, spalla non dichiarata | `sh: [42, 78]` |
| `pull-over-trx` | vedi §4.24 | |

### 4.5–4.7, 4.12–4.17, 4.19, «da rifinire» — testo integrale in `ARCHIVE.md`
Specifiche **aperte**, scritte per intero il 2026-11-08 e non ancora
implementate; spostate per tenere questo file sotto le 300 righe.
- 4.5 `rollout-trx` → archetipo nuovo `trx-rollout`, in piedi e sospeso.
- 4.6 `pallof-press-elastico`: dall'alto o tre quarti, elastico fuori dal tronco.
- 4.7 `suitcase-carry`: frontale, peso staccato dalla gamba, spalle in bolla.
- 4.12 `corda-battaglia-onde-alternate`: ancoraggio, due onde a S, mezzo squat.
- 4.13 `curl-martello-manubri`: manubrio verticale per la presa neutra.
- 4.14 `stacco-rumeno-manubri`: due manubri che si contano come due.
- 4.15 `rematore-manubrio-un-braccio`: ginocchio sulla panca (o cue cambiato).
- 4.16 `mountain-climber`: polsi sotto le spalle, ginocchio al petto.
- 4.17 tre figure di ripiego con l'elastico al posto dei manubri.
- 4.19 prese delle trazioni: `grip` su `hang-pull`.
- Da rifinire: gamba libera dell'hip thrust monopodalico; tronco del curl su panca inclinata.

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
**2026-11-12**: fatta solo la parte §4.2 (nessun segmento entro 6 dalla
testa). Vista frontale, peso all'altezza dell'orecchio, avambraccio sopra il
cranio e ordine dei pannelli: tutto ancora aperto.

### 4.22 `step-rapidi-box` — la tibia sul box (nuova, 2026-11-12)
**Oggi**: §4.4 è chiusa nei suoi criteri. La gamba sul box però ha la tibia di
12 unità contro le 20 di quella a terra (−40%), in tutti e due i pannelli: il
ginocchio è troppo basso perché la gamba ci stia.
**Deve**: stesse lunghezze per le due gambe. Con anca `[48, 58]` e piede
`[64, 84]`, ginocchio a `[69, 65]` (coscia 22, tibia 20): `kn` nel pannello 1,
`kn2` nel pannello 2.
**Accettazione**: `pose-audit` non segnala `L tibia`; il ginocchio sul box sta
più in alto di quello a terra.

### 4.23 `burpee` — una vista, le spalle, il braccio intero (nuova)
**Oggi**: freccia tolta (§4.1). Pannello 1 frontale e pannello 2 laterale;
nel pannello 1 le braccia partono dal collo e toccano la testa (5,7); nel
pannello 2 il braccio è 14,6 contro 24,7 (−41%), gomito sotto la spalla.
**Deve**: tutti e due i pannelli **di lato**. Pannello 1: salto, piedi
staccati, braccia sopra la testa con `sh` dichiarata (testa fra le braccia:
E3 la accetta). Pannello 2: petto vicino a terra, mani sotto il petto,
gomito **non sotto** la linea del tronco e dietro la spalla (~45°), braccio e
avambraccio lunghi come nel pannello 1, caviglia-anca-spalla in linea (cue 3).
**Accettazione**: `pose-audit` senza errori E1–E3 e senza `L` sulle braccia;
nessuno dei due pannelli ha gambe simmetriche da vista frontale.

### 4.24 `pull-over-trx` — rifare la posa (nuova)
**Oggi**: il fix di §4.2 ha spostato la testa a `[39, 48]`: collo piegato di
66°, la testa pende di fianco al tronco sotto il braccio. Non visti il
2026-11-08: anca piegata di 20° e 28° tra gambe e tronco (cue 3: «il bacino
non si piega»); nel pannello 2 mani 8 unità **dietro** la linea del tronco e
cinghie che attraversano il busto; braccio 17 → 10 tra i pannelli.
**Deve**: figura rivolta all'ancoraggio, inclinata indietro, corpo dritto
caviglia-ginocchio-anca-collo-testa in entrambi i pannelli. Pannello 1 più
inclinato (~25–30° dalla verticale), braccia distese sopra la testa verso
l'ancoraggio, `sh` dichiarata. Pannello 2 meno inclinato (~10–15°: il gesto
tira su il corpo), braccia distese lungo i fianchi, mani davanti o sulla linea
dell'anca, mai dietro. Lunghezze uguali nei due pannelli.
**Accettazione**: ogni giunto entro 2 unità dalla retta caviglia→collo;
`pose-audit` pulito; le cinghie non intersecano né il segmento `ne`–`hi` né il
cerchio della testa; gomito flesso ≤ 15°.

### 4.25 Proporzioni: misurarle prima di ridisegnare (nuova)
**Oggi**: nessun controllo sulle lunghezze. `pose-audit` trova **120 figure su
174** con almeno un segmento sotto l'80% dello stesso segmento in un altro
pannello o sul lato lontano. Molte sono scorci legittimi (curl visti di
fronte); altre sono arti accorciati per far stare la posa (R9): tibia sul box,
braccio nel plank del burpee, braccio collassato del curl al TRX.
**Deve**: il generatore stampa a fine esecuzione, come per la testa, i
segmenti fuori ±20%. Le pose nuove si calcolano dalle lunghezze (come la
panca dell'hip thrust). Lo scorcio voluto si scrive nel commento
dell'archetipo. Nessun ridisegno di massa: si correggono le figure quando
passano dalla checklist.
**Accettazione**: l'elenco esiste e non cresce; nessun archetipo nuovo entra
con segmenti fuori soglia senza commento.

### 4.26 `military-press-manubri` — di lato, e due manubri (nuova, 2026-11-18)
**Oggi**: vista frontale. I cue 2–4 (manubri sopra le orecchie e non davanti,
lombare che non si inarca) si giudicano solo di lato (R3). I due manubri
leggono come una barra: nel pannello 1 la testa riempie lo stacco fra i pesi
(bilanciere dietro il collo), nel pannello 2 lo stacco è di 5 u (R4).
**Deve**: vista **laterale**. Pannello 1: manubrio all'altezza della spalla,
gomito sotto e un poco davanti al busto, avambraccio verticale. Pannello 2:
braccio disteso verticale, manubrio sulla verticale dell'orecchio, testa fra
le braccia (`sh` dichiarata). Tronco dritto e verticale nei due pannelli.
Manubrio lontano sfalsato di 3–4 u dietro il vicino.
**Accettazione**: `pose-audit` senza E1/E2; pannello 2 |`ha`.x − `he`.x| ≤ 3;
tronco entro 5° dalla verticale in entrambi; a 230 px due pesi, non una barra.

### 4.27 Corpi sdraiati sospesi sopra il pavimento (nuova, R10)
**Oggi**: `hollow-hold` (e `core-l1…l3`: stesso SVG, md5 a etichetta tolta)
ha l'anca a y 88, pavimento a 102: nessun punto a terra, cioè la lombare
staccata che i cue 1 e 4 vietano. `respirazione-360`: tronco 12–14 u sopra.
In più (R1): `core-l1` è un plank sugli avambracci disegnato come hollow;
`core-l2` dice ginocchia piegate e mostra gambe distese (in app, senza foto).
**Deve**: il segmento che appoggia tocca il pavimento, bordo su bordo (col
tratto 3 `hi`.y = 99). Hollow: anca a terra, spalle staccate (`ne` 6–10 u
sopra `hi`), gambe distese a 20–30°, braccia oltre la testa. `core-l2`:
stessa posa a ginocchia piegate (parametro). `core-l1`: archetipo plank.
Respirazione: tronco e testa a terra, ginocchia piegate, piedi a terra.
**Accettazione**: tronco entro 1 u dal pavimento, bordi e non assi (stile nuovo:
dallo spessore, STYLE_TRIALS §1.7); `core-l1` e `core-l2` con md5 propri.

### 4.28 `plank-tocco-spalla` — il braccio d'appoggio, e la vista (nuova)
**Oggi**: vista laterale; nel pannello 2 c'è un braccio solo, quello che
tocca la spalla: il corpo in plank non ha appoggio. Di lato il cue 3 (bacino
immobile, nessuna rotazione) non esiste (R3).
**Deve**: vista **frontale dalla testa** o tre quarti dall'alto: si vedono la
linea delle spalle e i due piedi alla larghezza delle anche. Pannello 1:
plank alto, mani sotto le spalle. Pannello 2: una mano sulla spalla opposta,
l'altro braccio verticale sotto la sua spalla.
**Accettazione**: il braccio d'appoggio c'è in tutti e due i pannelli; linea
delle spalle orizzontale (± 3°) in entrambi; mano entro 4 u dalla spalla
opposta nel pannello 2.
