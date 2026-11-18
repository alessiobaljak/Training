# STYLE_TRIALS.md — tre direzioni di stile per le figure (2026-11-18)

Richiesta di Alessio: «per le immagini stilizzate, altre prove». Nessuna
figura è approvata (B8): lo stile si rifà, non si rifinisce. Qui c'è la
specifica delle prove. **La sessione principale implementa e rende; io
verifico con §7; sceglie Alessio.** Il generatore resta procedurale: niente
modelli AI, nessuna foto RepDB come riferimento (termine 5, LICENSING.md).

## 0. Perché lo stile di oggi non regge (misure, non gusto)
Unità = unità del `viewBox`. Figura a tutta larghezza su un telefono da 6,1″
(358 px CSS ≈ 65 mm): 1 u ≈ 1,7 px ≈ 0,31 mm. A 1,5 m un primo d'arco (1′,
il limite dell'acuità) vale 0,44 mm ≈ **1,4 u**.
- **Tratto 3** ≈ 2′: si vede, ma la posa non si legge di colpo (foglio a 150 px).
- **Attrezzi a `opacity 0.32`**: 2,06:1 in chiaro e 2,73:1 in scuro sul vetro,
  sotto il 3:1 dei grafici (WCAG 1.4.11). E l'attrezzo è proprio dove la
  libreria ha mentito più spesso (R1, R4).
- **Testa ad anello**: a tratto spesso diventa una ciambella; un braccio a 6 u
  dal centro ci si fonde (il disaccordo sulle circonduzioni nasce qui).
- **Lato lontano**: 2 contro 3 solo sulle gambe, niente sulle braccia: la
  profondità non si legge. **Verso**: senza piedi, di lato e a gambe dritte
  non si sa da che parte guarda la figura.
- **Calibrazione** (copie degli SVG con tratto 6, foglio a 150 px): meglio in
  6 figure su 7, ma testa e braccia si fondono (press, circonduzioni) e il
  kettlebell dell'hip thrust diventa una macchia. Lo spessore serve; da solo
  non basta: servono strati e stacchi (§1.3).

## 1. Base comune (A, B e C)
1. **Tela invariata**: `viewBox 0 0 210 110`, pannelli 100 + 10, posa singola
   al centro. Sulla radice `data-panels="1|2"`; **nessun divisorio** dentro
   l'SVG. (In produzione `ExerciseArt` smette di cercare `x1="105"` e legge
   `data-panels`: oggi il ritaglio della miniatura dipende dal divisorio.)
2. **Colori fuori dall'SVG.** Nessun esadecimale; gli elementi disegnano in
   `currentColor`; ogni gruppo ha una classe `fig-near` `fig-far` `fig-gear`
   `fig-ground` `fig-gear-c` `fig-ghost` e il CSS del tema gli dà `color`.
   Valori e contrasti in `media/style-trials/tokens.css`. Soglie, in chiaro e
   in scuro, contro il vetro (superficie al 60% sul canvas): vicino ≥ 7:1,
   attrezzo ≥ 4,5:1, lontano e appoggi ≥ 3:1, fantasma 1,4–2:1.
3. **Strati**, dal basso: appoggi (pavimento, muro, panca, box, sbarra,
   ancoraggio) → fantasma (solo C) → arti lontani → tronco e testa →
   attrezzo «davanti» (kettlebell al petto o sull'anca, cinghie) → gamba
   vicina → braccio vicino → attrezzo «in cima» (manubri in mano).
   **Stacco**: ogni elemento dagli arti lontani in su ritaglia, con 2 u di
   margine (≈ 1,4′ a 1,5 m), gli elementi del corpo e dell'attrezzo che ha
   sotto. Mai gli appoggi (i contatti si toccano), mai fra la mano e ciò che
   impugna (entro 3 u dalla mano), mai fra segmenti dello stesso arto. Lo
   stacco è un **ritaglio** (`mask` o taglio geometrico), **mai una pennellata
   del colore di fondo**: il vetro è traslucido e la pennellata si vedrebbe.
4. **Lo scheletro resta leggibile alle macchine.** Ogni gruppo-pannello porta
   `data-pose="he:x,y ne:x,y hi:x,y sh:… el:… ha:… sh2:… el2:… ha2:… kn:… fo:…
   kn2:… fo2:…"` (le chiavi della posa, quelle presenti) e
   `data-view="side|front"`. `media/scripts/pose-audit.mjs` lo legge già: le
   misure E1–E3 e L valgono per qualunque stile, anche a sagoma piena.
5. **Vista e verso** dichiarati per pannello: `view: 'front'` → tutti gli arti
   nel tono vicino; `view: 'side'` → gli arti «2» nel tono lontano;
   `facing: -1|1` = da che parte puntano le punte dei piedi.
6. **Piedi**: solo di lato e solo con la caviglia entro 3 u dal pavimento:
   un piede in avanti lungo il pavimento (misure per direzione). Di fronte,
   appesi, sdraiati, in aria: nessun piede (salvo B, §3).
7. **Pavimento**: uno per pannello, x 6–94 (lo stacco fra i due pavimenti
   separa i fotogrammi); il bordo superiore tocca il bordo inferiore del piede.
8. **Attrezzi con strato e mano**: `layer: 'ground'|'front'|'top'`,
   `hand: 'near'|'far'`. Un archetipo, tre stili: pose e posizioni degli
   attrezzi non si duplicano per stile.
9. **Id unici**: `cut-<slug>-p<n>-<k>`. In produzione `ExerciseArt` prefissa
   gli id per istanza (`useId`): la stessa figura due volte nella pagina non
   deve prendere in prestito la maschera dell'altra.
10. **Le prove non toccano l'app.** Uscita in `preview/stile-2026-11-18/
    {A,B,C,C0}/<slug>.svg` + `index.html`, alla radice del repo, fuori da
    `src/` e da `public/`. Dopo la resa `git status src/assets` è pulito;
    `npm run svg` resta com'è (importare il generatore non deve cancellare
    `src/assets/`).
11. **Pose di oggi.** Le prove giudicano lo stile, non le pose: si usano le
    pose del generatore così come sono; i difetti noti stanno nella didascalia
    dell'anteprima (fuori dall'immagine), §5.
12. **Dentro l'immagine niente** testo, numeri, frecce, loghi (come oggi).

## 2. Direzione A — «Linea» (pittogramma a tratto pieno)
L'idea: la figura di oggi, portata allo spessore di un'icona di sistema.
- **Tratto**: arti vicini 6 u, tronco 8 u (il busto pesa più degli arti: si
  legge subito dove sta il corpo); terminali e giunzioni tondi; il tronco
  finisce piatto al collo. Arti lontani 6 u nel tono lontano, sotto il tronco.
- **Proporzioni e testa**: lunghezze invariate; testa **disco pieno** r 6
  (⌀ 12 ≈ 1/7 dell'altezza, STYLE_GUIDE §4), nessun collo disegnato, ≥ 2 u fra
  il bordo della testa e il tronco. Mani: il terminale tondo. Piedi: tratto
  di 6 u in avanti.
- **Riempimento**: solo linea; pieni solo la testa e i pesi.
- **Colore**: monocromo a quattro toni: vicino (inchiostro), lontano, attrezzo,
  appoggi. Chiaro `#0f1720 / #78879a / #56657a / #78879a`; scuro
  `#eef3f8 / #6b7b8e / #98a6b8 / #617286`.
- **Fondo**: SVG trasparente, **direttamente sul vetro** della card.
- **Attrezzi**: sbarra linea 4; panca e box contorno 3, angoli r 2; muro 3;
  pavimento 3. Manubrio = impugnatura 3 + due dischi pieni 3×8 (una «I»
  coricata: due manubri vicini restano due «I», non una barra). Kettlebell =
  disco pieno r 6 + maniglia ad arco 3, staccato dal corpo (§1.3). TRX =
  cinghia continua 2,5 da un anello pieno r 2,5 a una maniglia piena 3×6.
  Elastico tratteggio 3 (5/4). Corda curva continua 3,5.
- **Fotogrammi**: inizio a sinistra, fine a destra, stessa scala; li separano
  lo stacco fra i pavimenti e l'impaginazione dell'app. Miniatura: il
  pannello 2 da solo, come oggi.
- **Costo**: primitive, `figure()`, strati e ritagli. Pose invariate.

## 3. Direzione B — «Sagoma» (silhouette piena)
L'idea: il pittogramma da segnaletica. La massa si legge più lontano della linea.
- **Tratto → forme**: ogni segmento è una capsula piena rastremata, diametro
  prossimale → distale: coscia 9 → 6,5; tibia 6,5 → 4,5; braccio 6 → 4,5;
  avambraccio 4,5 → 3,5. Tronco: di lato un quadrilatero arrotondato (r 3)
  lungo `ne`→`hi`, profondo 11 alle spalle e 9 all'anca; di fronte largo 17
  alle spalle, 11 in vita (al 60%), 13 all'anca, cosce che partono da
  `hi` ± 4. Piatto al collo. Arti lontani: stesse forme, tono lontano, dietro.
  **Il ritaglio di §1.3 è obbligatorio**: un braccio pieno davanti a un busto
  pieno dello stesso colore sparisce.
- **Proporzioni e testa**: testa ellisse piena rx 6, ry 6,8 (≈ 1/6,3: un po'
  più grande, per bilanciare la massa), ≥ 2,5 u dal tronco. Mani disco r 2,5.
  Piedi: di lato cuneo pieno 8×3,5 in avanti, tallone alla caviglia; di
  fronte ellisse 4×2,5 sotto la caviglia.
- **Riempimento**: pieno, nessun contorno sul corpo.
- **Colore**: monocromo a profondità tonale, stessi gettoni di A.
- **Fondo**: un **pozzetto** opaco per pannello dentro la card di vetro
  (superficie ≥ 92%, raggio = raggio della card − 8 px), disegnato dall'app
  dietro l'SVG a x 0–100 e 110–210. Il vetro fa da cornice; il pozzetto
  garantisce il contrasto della sagoma qualunque cosa passi sotto la card.
- **Attrezzi**: **solo contorno**, tratto 3, tono attrezzo: «pieno = corpo,
  linea = cosa». Manubrio: due dischi a contorno + impugnatura; kettlebell:
  cerchio a contorno + maniglia; sbarra 4; panca e box contorno 3; TRX 2,5 +
  maniglia a contorno; pavimento 3 nel tono appoggi.
- **Contatti**: la sagoma ha spessore, quindi tocca gli appoggi col bordo,
  non con l'asse. Nella prova il pavimento scende sotto il cuneo del piede; le
  pose sdraiate galleggeranno (R10): si misura, non si corregge qui.
- **Fotogrammi**: due pozzetti affiancati, inizio a sinistra.
- **Costo**: il più alto: costruttore di capsule, tronco di lato e di fronte,
  `view` su ogni pannello delle 174 figure, contatti ricalcolati.

## 4. Direzione C — «Manichino» a due toni
L'idea: lo schizzo del tecnico. Le articolazioni, dove la tecnica si giudica,
sono segnate; il colore dice l'attrezzo; il secondo pannello porta la traccia
del primo.
- **Tratto**: 5 u ovunque (tronco compreso), terminali tondi; **dischi
  articolari** pieni r 4 a spalla (`sh`, o `ne`), gomito, anca, ginocchio;
  mani disco r 3; piedi tratto 5 in avanti. Arti lontani: tratto e dischi nel
  tono lontano, dietro.
- **Proporzioni e testa**: lunghezze invariate; testa disco pieno r 6, ≥ 2 u
  dal tronco.
- **Riempimento**: linea + dischi; nessun busto pieno.
- **Colore**: duotono. Corpo in inchiostro; **attrezzi in viola**
  (`--color-fig-gear-c`: `#6a3fc8` chiaro 6,4:1, `#a48bff` scuro 6,7:1), l'unica
  tinta libera del tema (blu = azione, verde = fatto, ambra = avviso, rosso =
  pericolo). Pesi pieni, sbarra, cinghie e contorni di panca e box in viola;
  pavimento e muro nel tono appoggi (ambiente, non attrezzo).
- **Fantasma**: nel pannello 2 i segmenti che si sono mossi (un estremo
  spostato ≥ 4 u rispetto al pannello 1), e l'attrezzo nella mano che si è
  mossa, ridisegnati **dove stavano nel pannello 1**, tono fantasma, tratto 5,
  senza dischi né ritagli, sopra gli appoggi e sotto tutto il resto. Posa
  singola: niente fantasma. Interruttore `ghost`: si rende **C** (con) e **C0**
  (senza), stesso codice.
- **Fondo**: come A, direttamente sul vetro.
- **Fotogrammi**: pannello 1 inizio; pannello 2 fine più la traccia
  dell'inizio: la miniatura (solo il pannello 2) racconta il movimento.
- **Costo**: medio: A + dischi + confronto fra pannelli.

## 5. Il set di prova: 6 esercizi + 1 controllo, per ogni direzione
| # | slug | perché | vista, verso | attrezzi → strato | difetto di posa noto (didascalia) |
|---|---|---|---|---|---|
| 1 | `scapular-pull-up` | trazione; braccia accanto alla testa; differenza minima fra i fotogrammi | front | sbarra → ground | nessuno (verificata) |
| 2 | `military-press-manubri` | spinta; due manubri in mano | front | manubri → top | §4.26: frontale (R3), due manubri come una barra (R4) |
| 3 | `goblet-squat` | squat; peso davanti al tronco | front | kettlebell → front | §4.8: mezzo squat, frontale |
| 4 | `hollow-hold` | a terra; posa singola; braccia oltre la testa | side, nessun piede | — | §4.27: corpo sospeso sopra il pavimento |
| 5 | `hip-thrust-panca-bilaterale` | attrezzo: panca + kettlebell sull'anca | side, `facing 1` | panca → ground, kettlebell → front | nessuno (verificata) |
| 6 | `pull-over-trx` | **difetto aperto**; TRX dall'ancoraggio | side, `facing −1` | ancoraggio → ground, cinghie → front | §4.24: collo a 66°, cinghie sul busto. **Deve vedersi** |
| 7 | `circonduzioni-spalle` | **controllo**: il disaccordo con training-quality è una questione di disegno | side, `facing −1` | — | braccio a 6,0 dal centro della testa: deciderà Alessio |

28 SVG (A, B, C, C0 × 7). Gli altri difetti aperti (§4.11 estensione sopra la
testa, §4.22 step rapidi) sono di posa: nessuno stile li corregge.

## 6. L'anteprima per Alessio (la rende la sessione principale)
`preview/stile-2026-11-18/index.html`, una riga per esercizio, per ogni
direzione una card **chiara** e una **scura**:
- fondo pagina = canvas del tema, e sotto metà card un blocco di testo e una
  pillola color accento, perché il vetro abbia qualcosa da sfocare; card =
  superficie al 60% + `backdrop-filter: blur(20px)`, raggio 28 px; per B i
  due pozzetti;
- tre misure: tutta larghezza 358 px · compatta alta 144 px · miniatura
  80 px col solo pannello 2 (come `frame="last"`);
- **striscia del metro e mezzo**: la figura rasterizzata a 150 px di larghezza
  (acuità 1′ a 1,5 m) e a 100 px (riflessi, sudore) e riportata a 358 px
  **senza** ridisegnare il vettore;
- C anche in scala di grigi (`filter: grayscale(1)`);
- didascalie fuori dall'immagine: slug, direzione, tema, difetto di posa noto.
Colori da `media/style-trials/tokens.css`. Nessun link dall'app.

## 7. Checklist delle prove (ogni punto OK o PROBLEMA, per figura e tema)
Strumenti: `SHEET_CSS=media/style-trials/tokens.css SHEET_THEME=light|dark
node media/scripts/contact-sheet.mjs …` (SVG inline con i gettoni) e
`pose-audit.mjs preview/stile-2026-11-18/<dir>`.

**Comuni (T)**
- T1 **1,5 m**: a 150 px si riconosce l'esercizio. Prova cieca: la fa chi non
  ha scelto il set (training-quality o Alessio); la mia non è cieca e lo dico.
- T2 **Due tempi**: a 150 px si vede che inizio e fine sono diversi (il caso
  difficile è `scapular-pull-up`).
- T3 **Profondità**: a 230 px gli arti si contano; nessuna «frangia» (un arto
  lontano che spunta per meno di 2 u lungo quello vicino).
- T4 **Testa**: mai fusa con un braccio: o 2 u d'aria o il ritaglio; mai ad anello.
- T5 **Attrezzi**: due manubri si contano due (press, pannello 2); kettlebell
  staccato dal tronco (goblet, hip thrust); cinghia da un ancoraggio visibile.
- T6 **Contrasto**: numeri dei gettoni sopra le soglie di §1.2, nei due temi.
- T7 **Onestà**: lo stile non cambia né nasconde la posa: `pose-audit` sui
  `data-pose` dà le stesse righe E e L degli SVG di oggi per i 7; il collo a
  66° del pull-over si vede a 230 px.
- T8 **Pulizia**: niente testo, numeri, frecce, loghi.
- T9 **Miniatura**: a 80 px, solo pannello 2, l'esercizio si riconosce.
- T10 **File**: tela 210×110, `currentColor`, nessun esadecimale, `<title>` e
  `aria-label`, `data-pose`, `data-panels`, id con lo slug; peso ≤ 2× oggi
  (oggi 1,0–2,8 KB); `src/assets` intatto.
- T11 **Coerenza**: stessi spessori e stessa scala fra i 7 e fra i due pannelli.

**Solo A**: A1 a 150 px il tronco più spesso fa capire l'orientamento del
corpo (hollow, hip thrust). A2 i piedi dicono il verso (circonduzioni, hip
thrust, pull-over). A3 gli attrezzi a tratto 3 reggono a 150 px.
**Solo B**: B1 il ritaglio del braccio vicino sul busto si vede a 230 px
(goblet, hip thrust, press). B2 contatti: bordo della sagoma entro 1,5 u
dall'appoggio (hip thrust su panca e pavimento, piedi); l'hollow sospeso è
della posa (§4.27), non di B. B3 di fronte le spalle sono più larghe
dell'anca. B4 spessori uguali fra i pannelli. B5 a 150 px l'attrezzo a
contorno legge come oggetto, non come parte del corpo.
**Solo C**: C1 il fantasma non legge come un arto in più: a 230 px gli arti
del pannello 2 si contano come nel pannello 1 (rischio: hip thrust, press,
goblet). PROBLEMA in 2 figure o più ⇒ vale C0. C2 col fantasma la miniatura
racconta il movimento (scapular, press). C3 in grigio l'attrezzo si distingue
dal corpo senza la tinta. C4 nella posa più raccolta (goblet, pannello 2) i
dischi non fanno una macchia a 230 px. C5 il viola non sembra un comando:
giudizio di Alessio, non mio.

**Esito di una direzione**: scartata se ha un PROBLEMA su T1, T4, T5 o T7 in
2 figure o più, o un PROBLEMA su T6, T8 o T10 anche in una sola (si correggono
e si rifà la prova). I difetti di posa di §5 non contano contro nessuna.

## 8. Raccomandazione: A, con B di riserva e il viola di C da innestare
1. **Leggibilità**: lo spessore 6 dà già il guadagno misurato in §0; testa
   piena, stacchi e piedi tolgono i tre difetti specifici (testa fusa, verso
   ambiguo, attrezzo sbiadito).
2. **Onestà**: A disegna l'asse che `pose-audit` misura. In B una coscia da 9
   u nasconde un errore di 2, e lo spessore crea una famiglia di errori nuova
   su 174 figure (contatti: oggi due figure galleggiano anche col tratto 3).
3. **Costo e rischio**: A cambia primitive e `figure()`, non le pose. B
   chiede forme, vista e contatti ovunque. C aggiunge un fantasma che la mia
   checklist potrebbe dover scartare come «arto in più».
4. **Vetro**: tratto tondo e uniforme è la famiglia delle icone di sistema e
   dei pulsanti a pillola; nessun pozzetto da aggiungere.
**Riserva**: se a 100 px A non regge e B sì (T1), vince B: la leggibilità
viene prima del costo. **Il viola** di C è indipendente: si può mettere sugli
attrezzi di A se ad Alessio piace, e attacca il difetto più frequente della
libreria. Raccomandazione **a priori**: la confermo o la ritiro sul foglio
delle prove rese.

## 9. Dopo la scelta
Si rigenerano tutte le 174 figure nello stile scelto; la verifica visiva
delle 236 «da verificare» si fa **nello stile nuovo** (lo stile vecchio non
va guardato due volte); le misure di `pose-audit` valgono già oggi.
