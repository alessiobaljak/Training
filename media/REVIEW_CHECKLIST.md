# REVIEW_CHECKLIST.md — come si verifica un'immagine

Una figura non si guarda contro il buon senso: si guarda contro la scheda
tecnica dell'esercizio. È già successo tre volte che una figura **corretta**
mostrasse l'esercizio **sbagliato** (vedi REJECTIONS.md). Quello è il difetto
da cercare per primo, non l'anatomia.

## 0. Prima di guardare
1. Leggi la scheda: `src/data/exercises.ts`, campi `name`, `cues`, `measurement`.
2. Se la scheda è incompleta rispetto a `training/EXERCISE_SCHEMA.md` — oggi
   mancano `equipment` e `frames` su **tutti e 72** gli esercizi — la verifica
   è **provvisoria**: si fa sui `cues`, e lo stato registrato in LIBRARY.md lo
   dice. Nessuna immagine va in «approvata» su una scheda incompleta.
3. Guarda la figura **in foglio di contatto**, non una per una (vedi §3).

## 1. Gli otto punti (ognuno: OK o PROBLEMA)
| # | punto | cosa guardo |
|---|---|---|
| 1 | Corrispondenza con la scheda | stesso esercizio, fotogramma giusto, attrezzo giusto. Contro nome, cue **e `variantNote` del blocco**; per le foto RepDB anche mani, gambe, appoggi e inclinazione (R11) |
| 2 | Archetipo | la figura mostra il gesto di *questo* esercizio, non di uno simile |
| 3 | Anatomia | arti e dita nel numero giusto, articolazioni piegate nel verso naturale, proporzioni realistiche, nessun arto che attraversa la testa o il tronco |
| 4 | Tecnica | colonna, allineamento ginocchia/piedi, spalle e scapole, **presa e larghezza della presa** coerenti con i cue |
| 5 | Attrezzo | forma, dimensione e uso: bilanciere, sbarra, anelli, TRX, elastici, cintura, manubri, kettlebell, corda. Due manubri devono leggersi come due, non come un bilanciere |
| 6 | Coerenza | stessa figura, stessa inquadratura, stesso stile tra i fotogrammi e con il resto della libreria |
| 7 | Pulizia | nessun testo, numero, freccia, logo, marchio o persona riconoscibile |
| 8 | Leggibilità | si capisce su uno schermo da telefono, a 210 px di larghezza, con il telefono a terra |

## 2. Regola di scarto
- Un solo PROBLEMA su **anatomia (3), tecnica (4) o archetipo (2)** ⇒ stato
  `da rifare`. Non si discute, non si media.
- Un PROBLEMA su attrezzo (5), coerenza (6) o leggibilità (8) da solo ⇒
  `verificata` con la riserva scritta in LIBRARY.md; **due o più** ⇒ `da rifare`.
- Un PROBLEMA su pulizia (7) ⇒ `da rifare` sempre: testo e frecce dentro
  l'immagine non sono traducibili e non si correggono a valle.
- `verificata` non è `approvata`. Approva solo Alessio, dopo la verifica
  indipendente di `training-quality`.

## 3. Come si guarda (procedura, non opinione)
Le figure sono SVG monocromatiche: si rasterizzano in un foglio di contatto e
si guardano in blocco. Chromium di Playwright è già sul disco.

```
node media/scripts/contact-sheet.mjs <out.png> <colonne> <px per tile> \
     /percorso/figura.svg::didascalia ...
```
- Primo passaggio: 4 colonne, 230 px per tile. È la dimensione in cui un
  difetto di archetipo si vede e un dettaglio no.
- Secondo passaggio: solo i dubbi, 2 colonne, 460 px.
- Non si ringuarda una figura già approvata.
- Lo script cerca da solo il Chromium di Playwright in `/opt/pw-browsers`
  (la versione cambia con gli aggiornamenti); `CHROMIUM_PATH` lo forza.
- Figure con i gettoni colore (prove di stile, STYLE_TRIALS.md):
  `SHEET_CSS=media/style-trials/tokens.css SHEET_THEME=light|dark` mette gli
  SVG inline e li colora come l'app. Si guardano **tutti e due i temi**.

## 3b. Le misure prima dell'occhio
```
node media/scripts/pose-audit.mjs src/assets/exercises src/assets/steps [--only slug,slug]
```
Legge gli SVG, non tocca nulla; se il pannello porta `data-pose` legge da lì
(vale per qualunque stile), altrimenti dalla geometria a linea. Per ogni pannello:
- **E1** testa fuori dall'asse del tronco oltre 40° → PROBLEMA anatomia (R8).
- **E2** gomito o mano dentro il cerchio della testa → PROBLEMA anatomia.
- **E3** braccio a meno di r=6 dalla testa: «sopra la testa» (entro 40°
  dall'asse) è la testa fra le braccia, **non** è un errore; altrimenti
  PROBLEMA (R2).
- **L** stesso segmento sotto l'80% del suo omologo: **segnale**, non
  scarto. Si guarda a 460 px: scorcio legittimo o arto accorciato (R9)?
Le misure dicono dove guardare; il giudizio resta sui `cues`. Un `<path>` non
è una freccia finché non lo si guarda (falso positivo del 2026-11-09).

## 4. Due prove che la checklist non copre e che fa il codice
`src/data/art.test.ts` già garantisce: una figura per esercizio e per gradino
senza orfane, `currentColor` e nessun colore fisso, stessa tela `0 0 210 110`,
`aria-label` e `<title>` presenti, nessuno script e nessuna risorsa remota,
nessuna immagine RepDB copiata e mai usata (termine 3 della licenza).
Quello che i test **non** possono vedere è se la figura dice la verità: è
esattamente il lavoro di questa checklist.
