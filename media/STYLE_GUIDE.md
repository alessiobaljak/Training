# STYLE_GUIDE.md — stile unico della libreria

Un'immagine in un'app di allenamento non è decorazione: è un'istruzione
tecnica. Vale per tutte le immagini, da qualunque fonte vengano.

## 1. Le fonti, e come convivono

| | RepDB | figure schematiche | foto generate da testo (dal 2026-11-21) |
|---|---|---|---|
| cosa | 85 `.webp` (2026-11-21), 26 esercizi + 35 gradini | 174 `.svg`, 72 esercizi + 102 gradini | nessuna ancora; pilota di 4 esercizi |
| aspetto | colore, personaggio umano, fondo azzurro | linea monocromatica, fondo trasparente | §8, definito da zero |
| tela | 512×512 (quadrata) | 210×110 (due riquadri da 100 + 10 di stacco) | 768×768 per fotogramma (§8.6) |
| origine | acquistate, generate con AI da RepDB | codice parametrico, deterministico | Qwen-Image da solo testo, approvate da Alessio (LICENSING §3) |

Alessio ha rifiutato le figure schematiche («non voglio gli omini»,
2026-11-21): restano solo dove non c'è altro, finché non arriva la foto
generata. La riga «aspetto» di RepDB serve a farle convivere e **non entra
mai in un prompt** (LICENSING §3.3, C1). Le regole che tengono insieme le
fonti sono quattro, e valgono per tutte.

1. **Una scheda, una fonte.** Dentro la stessa scheda esercizio non si mischiano
   foto e figura. L'app sceglie: RepDB se c'è, altrimenti la figura (ordine in
   `ExerciseArt.tsx`). Mai due fonti affiancate, nemmeno foto RepDB e foto
   generata: i due fotogrammi di un esercizio vengono dalla stessa fonte.
2. **Stessa inquadratura per lo stesso esercizio.** I due fotogrammi di un
   esercizio si guardano dallo stesso punto, alla stessa distanza, con la
   figura della stessa altezza. Un cambio di scala tra inizio e fine fa
   leggere come movimento quello che è solo zoom.
3. **Stessa logica di lettura.** Primo riquadro = posizione iniziale, secondo =
   posizione finale, sempre in quest'ordine, anche quando la fine è più in
   basso dell'inizio. Chi guarda legge da sinistra a destra una volta sola.
4. **Fondo neutro.** Trasparente per le SVG (il tema dell'app fa da fondo),
   azzurro uniforme per RepDB. Niente ombre lunghe, niente ambienti, niente
   palestra sullo sfondo.

**Debito dichiarato**: 512×512 contro 210×110 è una differenza che si vede
quando l'app passa da un esercizio all'altro. Non si risolve ritagliando le
foto (si perderebbe il corpo): si risolve nel contenitore dell'app, che deve
riservare la stessa area alle due fonti. Non è lavoro di questa cartella —
è una nota per la sessione principale.

## 2. Inquadratura: la sceglie il criterio, non l'abitudine

L'inquadratura si sceglie per far vedere **l'articolazione o il piano su cui
l'esercizio si giudica**. Non è una preferenza estetica: è la differenza tra
una figura che insegna e una che decora.

| cosa decide la ripetizione | inquadratura |
|---|---|
| profondità, cerniera d'anca, linea della colonna, angolo del gomito | **laterale** |
| allineamento ginocchio-piede, simmetria, larghezza della presa | **frontale** |
| rotazione e anti-rotazione, carico su un lato solo | **tre quarti** o **dall'alto** |

Conseguenza che oggi non è rispettata: pallof press e suitcase carry sono
disegnati di lato, e di lato l'anti-rotazione e l'anti-inclinazione **non
esistono**. Vanno rifatti in frontale o tre quarti (vedi GENERATOR_SPEC.md).

## 3. Fotogrammi per esercizio
- **Due** di norma: inizio e fine del range.
- **Uno** per le isometrie (plank, hollow, wall sit, dead hang, L-sit,
  verticale) e per le attività continue (corsa, camminata, carry).
- **Tre** quando è il punto intermedio a essere sbagliato: swing, nordic curl,
  sissy squat. Oggi nessuna figura ne ha tre: è una proposta, non lo stato.
- La posa singola resta nella **stessa tela** delle altre, centrata. Una tela
  larga la metà farebbe la figura il doppio più grande: lo fa già `render()`.

## 4. Anatomia e tecnica dentro il disegno
- Proporzioni realistiche: testa ≈ 1/7 dell'altezza, arti di lunghezza
  coerente tra i due fotogrammi dello stesso esercizio.
- Articolazioni piegate nel verso naturale. Ginocchio e gomito non si
  invertono mai, nemmeno per far entrare la posa nella tela.
- **Nessun segmento attraversa la testa.** Quando il braccio parte dal collo e
  va in alto, passa dentro il cranio: si stacca la spalla dal collo (`sh`,
  `sh2`) e si fa passare il braccio fuori dalla circonferenza.
- La figura mostra la **ripetizione valida**, mai l'errore tipico. L'errore si
  scrive nei cue; disegnarlo insegna l'errore con la stessa autorevolezza.
- La presa si vede: larghezza delle mani e orientamento dell'attrezzo sono
  parte della tecnica, non un dettaglio.

## 5. Attrezzi: devono leggersi per quello che sono
Due manubri vicini diventano un bilanciere. Una ruota diventa una maniglia.
Un elastico tratteggiato diventa una fune. Regole:
- due attrezzi distinti si disegnano **separati e riconoscibili** anche a 210 px;
- l'elastico è tratteggiato, la cinghia (TRX/anelli) è continua e parte da un
  ancoraggio visibile, la corda è una curva aperta che arriva a un ancoraggio;
- un attrezzo non si sovrappone mai al tronco al punto da leggersi come corpo
  (oggi il kettlebell del goblet squat legge come pancia);
- se la scheda dice manubri, non si disegna un bilanciere, e viceversa.

## 6. Cosa non entra mai nell'immagine
Nessun testo, numero, freccia, logo, marchio, filigrana o persona
riconoscibile. Etichette e frecce le mette l'app in sovrimpressione: così
restano corrette, traducibili e aggiornabili senza rigenerare niente.
**Violazione aperta**: l'archetipo `hip-thrust` disegna una freccia
(`arrowUp`) dentro 1 figura di esercizio e 7 di gradino.

## 7. Formato e dimensioni
**In revisione (B8, 2026-11-18)**: tratto 3 e attrezzi a `opacity 0.32` sono
lo stile di oggi, non quello da tenere (attrezzi a 2,1:1 in chiaro, sotto il
3:1). Le tre direzioni in prova sono in `STYLE_TRIALS.md`; questa sezione si
riscrive quando Alessio sceglie.
- SVG: `viewBox="0 0 210 110"`, `currentColor` ovunque, nessun colore fisso,
  `<title>` e `aria-label` sempre presenti (lo verifica `art.test.ts`).
  Tratto 3 per il corpo, 2–2,5 per gli attrezzi, attrezzi a `opacity 0.32`.
- WebP RepDB: 512×512, ~11 KB l'uno, 1,5 MB in tutto. Restano come sono finché
  non c'è una misura che dica che pesano: comprimerli è permesso dalla licenza.
- Peso totale di riferimento: SVG 632 KB, WebP 1,5 MB.
- Leggibilità: la prova è il foglio di contatto a 230 px per tile. Se a quella
  dimensione non si capisce quale esercizio è, la figura non serve.

## 8. Foto generate da testo (fonte 3) — definito il 2026-11-21
Definito da zero, a partire da cosa deve leggere chi guarda un telefono a
terra con le mani sudate. Nessuna immagine RepDB è stata guardata per
scriverlo, e nessuna è descritta qui (LICENSING §3.3, C1–C2). Valgono §1
(regole 1–3), §2–§6; questa sezione aggiunge quello che serve a una foto.

### 8.1 Soggetto
- **Una persona sola, la stessa in tutta la libreria** (blocco `ATHLETE`):
  uomo adulto sui trentacinque anni, corporatura atletica ma realistica —
  non culturista, non modello. Volto neutro e concentrato, mai rivolto
  all'obiettivo; niente tatuaggi, gioielli, occhiali, barba lunga.
  Genere e aspetto per il pubblico sono una decisione di Alessio: questo è il
  default del pilota.
- Proporzioni vere: testa circa 1/7,5 dell'altezza, arti e mani della stessa
  misura nei due fotogrammi.
- **Non riconoscibile**: nessun nome di persona nel prompt; se il volto
  ricorda qualcuno di noto, si scarta (checklist G8).

### 8.2 Abbigliamento: deve far vedere le articolazioni
- maglietta a maniche corte **aderente, blu scuro, tinta unita**: la linea
  della colonna e le scapole si leggono attraverso il tessuto;
- pantaloncini **aderenti sopra il ginocchio, grigio medio**: il ginocchio
  scoperto mostra l'allineamento con il piede; grigio medio perché kettlebell,
  manubri e corda sono neri e devono staccare quando passano davanti alle gambe;
- calze bianche basse, scarpe nere con **suola bianca**: la suola segna il
  contatto con il pavimento;
- niente loghi, scritte, stampe, righe, orologi, cuffie. Uguale ovunque.

### 8.3 Fondale e luce
- Fondale da studio senza giunzione, **grigio chiaro caldo**, pavimento e
  parete dello stesso colore. Nella scena c'è solo l'attrezzo della scheda.
- **Ombra di contatto** morbida sotto piedi, mani, ginocchia, schiena e
  attrezzi a terra: è l'unico segno che dice se un appoggio tocca o è staccato.
- Luce diffusa e uniforme dal davanti, colori naturali, nessuna ombra dura,
  nessun controluce, nessuna atmosfera.
- Grigio chiaro perché stacca pelle, blu e nero degli attrezzi; sul tema
  scuro dell'app è un riquadro chiaro arrotondato, come fa già `ExerciseArt`.

### 8.4 Inquadratura
- La sceglie §2 e la scrive il designer in `frames[].viewpoint` (laterale,
  tre quarti, frontale, posteriore).
- **Corpo intero sempre**: testa, mani, piedi, l'attrezzo e il suo
  ancoraggio dentro il quadro con circa il 6% di margine per lato. Eccezione:
  la corda da battaglia esce dal quadro stesa a terra verso l'àncora.
- Macchina in bolla all'altezza dell'anca, 50 mm equivalenti da circa 4 m:
  poca prospettiva, proporzioni vere. **A terra** (supino, in ginocchio,
  plank) la macchina sale a circa 1 m e guarda appena in basso.
- Tutto a fuoco, nessun mosso: si fotografa una posizione, non un'azione.
- **Un lato solo**: lavora il lato **sinistro**, ed è quello vicino alla
  macchina. Stessa regola ovunque, così due esercizi simili si confrontano.

### 8.5 Fotogrammi
- **Due** per i movimenti: 1 partenza a sinistra, 2 arrivo a destra (§1,
  regola 3). **Uno** per isometrie e tenute. **Tre no**: affiancati sul
  telefono sarebbero larghi 110 px. Dove si sbaglia il punto medio (swing) i
  due fotogrammi sono i due estremi, e il punto medio sta nei cue.
- **Stessa persona** nei due: stesso volto, vestiti, luce, macchina, scala,
  fondale. Si ottiene nell'ordine: **T2** dittico (un prompt, due pannelli,
  si taglia a metà: solo testo, la persona è una per costruzione); poi **E**
  (fotogramma 2 modificato dal fotogramma 1), solo se Alessio lo ammette
  (LICENSING §3.4). Due prompt separati con lo stesso seme non bastano.

### 8.6 File
- **WebP** con perdita, sRGB, senza trasparenza: `cwebp -q 80 -m 6
  -metadata none` (poi l'XMP facoltativo di LICENSING C7).
- **768×768**, quadrato. L'app affianca i fotogrammi (`flex-1`): su un
  telefono da 390 px ognuno è largo circa 170 px CSS, ~510 px reali a
  densità 3; 768 copre anche il fotogramma singolo a tutta larghezza, e il
  quadrato tiene ferma l'altezza del contenitore fra un esercizio e l'altro.
- **Peso**: massimo **60 KB** per file (obiettivo 35–50), 120 KB per
  esercizio. Oltre: si scende di qualità fino a 70, non di misura.
- **Dal grezzo al file**: T1 si genera 1328×1328 e si riduce. T2 si genera
  1664×928, si taglia a metà (832×928), da ogni metà un quadrato 832×832
  con la figura intera, poi 768 (Lanczos). Nessun ritocco, nessun altro
  modello (C6).
- **Cartella e nomi**: `src/assets/exercises-ai/<chiave>-1.webp` e
  `<chiave>-2.webp`; foto singola: solo `-1`. `<chiave>` = slug di esercizio o
  di gradino, come in `exercise-art.ts`. La fase (partenza, picco, fondo) sta
  in LIBRARY.md, non nel nome. Cartella separata da `exercises-repdb/`:
  licenza, credito e test del termine 3 sono diversi.
- **Prompt eseguito e parametri**: `media/prompts/<chiave>.md` (C3).

### 8.7 Modello di prompt (in inglese)
I blocchi in maiuscolo sono **fissi**: sono lo stile, non si toccano per
esercizio. I `{segnaposto}` vengono dalla scheda del designer (tabella 8.8).
Totale **≤ 360 parole** (i blocchi fissi e T2 ne usano circa 240): `diffusers` taglia il prompt a 512 token per
default (`max_sequence_length`; in locale si alza a 1024, la Space ufficiale
non lo espone). Un prompt tagliato perde la fine, cioè lo stile.

```
ATHLETE: a man in his mid-thirties, athletic but realistic build, not a bodybuilder, short dark-brown hair, clean-shaven, no tattoos or jewellery, calm focused expression, not looking at the camera.
CLOTHING: fitted plain deep-blue short-sleeved T-shirt, fitted plain medium-grey shorts ending above the knee, low white socks, plain black training shoes with white soles; no logos, prints, stripes or text on anything.
STUDIO: seamless light warm-grey backdrop, floor and wall the same colour, nothing else in the scene but the listed equipment; soft even light from the front, natural colours, soft contact shadows where body and equipment touch the floor.
CAMERA: realistic photograph, {CAM_EN}, 50 mm lens from about four metres, whole body and equipment inside the frame with a margin on every side, all in sharp focus.
ANATOMY: correct anatomy, two arms, two legs, five fingers on each hand wrapping naturally around what they hold, joints bending only in their natural direction, realistic proportions.
```

**T2 — due fotogrammi**, dittico 16:9 (1664×928):
```
A realistic studio photograph of two side-by-side panels of equal width showing the same man in two positions of one {EXERCISE_EN}. One continuous backdrop, no line between the panels; same face, hair, build, clothing, light, camera and scale in both; he is centred in each panel and nothing crosses the middle.
LEFT PANEL, {PHASE_1_EN}: {POSE_1} Clearly visible: {READ_1}.
RIGHT PANEL, {PHASE_2_EN}: {POSE_2} Clearly visible: {READ_2}.
EQUIPMENT: {EQUIPMENT_EN}
VIEW: {VIEW_EN}{SIDE_EN}.
[ATHLETE] [CLOTHING] [STUDIO] [CAMERA] [ANATOMY]
```
**T1 — fotogramma unico**, 1:1 (1328×1328):
```
A realistic studio photograph of one man holding the {PHASE_1_EN} of one {EXERCISE_EN}: {POSE_1} Clearly visible: {READ_1}.
EQUIPMENT: {EQUIPMENT_EN}
VIEW: {VIEW_EN}{SIDE_EN}.
[ATHLETE] [CLOTHING] [STUDIO] [CAMERA] [ANATOMY]
```
**E — fotogramma 2 dal fotogramma 1** (solo se ammesso), Qwen-Image-Edit-2511:
```
Keep exactly the same man, face, hair, clothing, equipment, backdrop, light, camera position and scale. Change only his position to the {PHASE_2_EN} of the {EXERCISE_EN}: {POSE_2} Clearly visible: {READ_2}. [ANATOMY]
```
**Negativo** (Qwen-Image in locale: `true_cfg_scale` 4,0, 50 passi; la Space
ufficiale lo fissa a «text, watermark, copyright, blurry, low resolution»):
```
text, letters, numbers, watermark, logo, brand, label, caption, arrow, diagram, border, divider line, gym, mirror, window, other people, extra arms, extra legs, extra fingers, missing fingers, fused fingers, deformed hands, twisted wrist, backwards knee, hyperextended elbow, cropped head, cropped hands, cropped feet, motion blur, blurred background, cartoon, illustration, 3D render, plastic skin, dramatic lighting, tattoo, jewellery, headphones, watch, {MUST_NOT}
```

### 8.8 Segnaposto: da dove si prendono
| segnaposto | dalla scheda | come si scrive |
|---|---|---|
| `{EXERCISE_EN}` | `name`, `videoQuery` | nome inglese generico, senza marchi: «kettlebell swing» |
| `{PHASE_n_EN}` | `frames[n]` fase | partenza → *starting position*; picco → *top position*; fondo → *bottom position*; appoggio → *support position* |
| `{POSE_n}` | `frames[n]`, `execution`, `cues` | ≤ 30 parole, articolazione per articolazione dal basso: piedi, ginocchia, anche, colonna, spalle e scapole, gomiti, mani e presa, testa e sguardo. **Solo la ripetizione valida**, mai l'errore. Chiude con un punto |
| `{READ_n}` | `frames[n]` «cosa deve essere leggibile» | 2–4 fatti visibili, affermativi, ≤ 15 parole: «the lower back stays flat» |
| `{MUST_NOT}` | `frames[n]` «cosa non deve comparire» + errore tipico dei cue | parole chiave per il negativo: «rounded lower back, squatting» |
| `{EQUIPMENT_EN}` | `equipment` | dal dizionario 8.9, testo fisso |
| `{VIEW_EN}` | `frames[n]` punto di vista | laterale → *strict side view, camera at 90 degrees to the direction he faces*; tre quarti → *three-quarter front view, camera at 45 degrees*; frontale → *front view*; posteriore → *rear view* |
| `{SIDE_EN}` | lato che lavora | *, his left side towards the camera* in laterale e tre quarti, anche se l'esercizio è simmetrico; vuoto in frontale e posteriore |
| `{CAM_EN}` | posizione | in piedi → *camera level with his hips*; a terra → *camera about one metre above the floor, tilted slightly down* |

Mai nel prompt: aggettivi di resa (*perfect, epic, 4K, cinematic*), nomi di
persone, marchi, fotografi, app o librerie di immagini, «come le immagini
esistenti». Se la scheda non dice una cosa, il prompt non la inventa: si
chiede al designer.

### 8.9 Dizionario dell'attrezzo (`{EQUIPMENT_EN}`)
| `equipment` | testo fisso |
|---|---|
| `kettlebell` | *one {KG} kg cast-iron kettlebell, matte black, plain, with a single smooth handle, no markings.* |
| `corda-battaglia` | *one heavy black battle rope looped around a distant anchor, one end in each hand, both halves lying parallel on the floor and leaving the frame.* |
| `anelli` | *two plain wooden gymnastic rings on black straps hanging from a bar above, both straps visible up to the bar.* |
| `trx` | *an all-black nylon suspension trainer with two plain black handles, hanging from one anchor point above, both straps visible up to the anchor, no logos.* |
| `elastici` | *one plain solid-red resistance band, no markings*, più dove è fissato. |
| `manubri` | *two plain black hexagonal dumbbells, {KG} kg each, one in each hand.* |
| `panca` | *one plain flat padded black bench with a steel frame.* |
| `box` | *one plain wooden plyometric box, {CM} cm high.* |
| `sbarra` | *one straight steel pull-up bar fixed overhead.* |
| `corpo-libero` | *no equipment.* |
| altri (`cintura-zavorra`, `bilanciere`, `ruota-ab`, `macchine`) | da scrivere quando servono, prima del primo prompt che li usa. |
Un attrezzo che la scheda non elenca non compare (nemmeno un tappetino).
