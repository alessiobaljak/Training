# STYLE_GUIDE.md — stile unico della libreria

Un'immagine in un'app di allenamento non è decorazione: è un'istruzione
tecnica. Vale per tutte le immagini, da qualunque fonte vengano.

## 1. Le due fonti, e come convivono

| | RepDB | figure schematiche |
|---|---|---|
| cosa | 91 `.webp`, 32 esercizi + 39 gradini | 158 `.svg`, 56 esercizi + 102 gradini |
| aspetto | colore, personaggio umano, fondo azzurro | linea monocromatica, fondo trasparente |
| tela | 512×512 (quadrata) | 210×110 (due riquadri da 100 + 10 di stacco) |
| origine | acquistate, generate con AI da RepDB | codice parametrico, deterministico |

Non sono due librerie: è una libreria con due livelli di dettaglio. Le regole
che le tengono insieme sono quattro, e valgono per entrambe.

1. **Una scheda, una fonte.** Dentro la stessa scheda esercizio non si mischiano
   foto e figura. L'app sceglie: RepDB se c'è, altrimenti la figura (ordine in
   `ExerciseArt.tsx`). Mai le due affiancate.
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
