# exercise-media-lead — 2026-11-21 — T-37, rematore agli anelli

Verifica mirata, su richiesta della sessione principale. Invocazione **senza
stile né prompt** (C2): si sono guardate foto RepDB. Schede: rapporto del
designer `training/reports/2026-11-21-training-anelli-figure.md` §2 (scala) e
§5.5 (gradino 2). Durante la verifica la sessione principale ha fatto il commit
`db2544e` (T-37): lo stato qui sotto è quello di `db2544e`.

### Riepilogo
- `rings-inverted-row` (da `3b548e4^`, solo nella scratchpad): **scartata, non va
  bene per nessun gradino**. Gli anelli sono giusti; l'inclinazione (~35°) no,
  e all'arrivo i gomiti sono stretti al busto.
- Scala `horizontal-pull`: **nessun gradino ha una figura giusta**. `l1` (sbarra)
  e `rematore-inverso-trx` (TRX) sono già senza immagine da `db2544e`. **`l2`,
  `l4`, `l5`, `l6` mostrano ancora il rig del TRX** e vanno tolti. Il motivo di
  `l3` va aggiornato.
- `trx-row` e `inverted-row` restavano senza usi: tolti in `db2544e` (termine 3).
  È corretto: nel codice non resta nessun riferimento.
- Errore nuovo **R13**: `npm run svg` ha rigenerato solo i titoli. `l2` dice
  «anelli a 45 gradi» e `l5` «monobraccio agli anelli», ma disegnano una cinghia
  unica a ~35°.

### Stato della libreria (fonti, copertura, verificate, da rifare)
- 81 foto RepDB (erano 85), 174 SVG, 0 foto generate.
- 72 esercizi: 25 con foto, 38 con la sola SVG, 9 senza immagine.
- 102 gradini: 34 con foto, 55 con la sola SVG, 13 senza immagine. Dopo il punto
  1 di «Da sviluppare»: 51 con la sola SVG e 17 senza immagine.
- LIBRARY: 25 verificate · 40 da rifare · 196 da verificare · 48 ritirate · 0 approvate.
- `library-drift`: allineato.
- Sedute attive senza foto: 33 (si aggiunge `rematore-inverso-trx`, S2 A3).

### Immagini verificate (esito della checklist, motivo degli scarti)

**`rings-inverted-row-start` / `-peak`** (512 px, guardate a 380 px; ingrandite
mani, braccia e linea del corpo).

| punto | esito |
|---|---|
| Corrispondenza | **PROBLEMA**. Partenza: corpo a ~35° apparenti (caviglia-spalla, linea dritta). In vista di tre quarti l'angolo vero è ≤ 35°. l1 vuole ~60°, l2 45° ± 5 (training-quality: 40-50°), l3 orizzontale. All'arrivo ~47° apparenti, ~38° stimati |
| Archetipo | OK per la scala: rematore inverso a due braccia, talloni a terra |
| Anatomia | OK |
| Tecnica | **PROBLEMA**. Partenza: anelli sopra le anche, braccia a ~35-50° dalla verticale verso i piedi, cinghie a ~11-12° dalla verticale (scheda: ± 10°). Arrivo: gomiti vicini al busto (~35-40° apparenti; scheda: 45-75°; «gomiti stretti ai fianchi» sta fra i «non deve comparire mai»); anelli a larghezza spalle (scheda: un po' più larghi); anelli alle clavicole, al limite. Presa prona non verificabile: in partenza gli anelli sono disegnati di piatto in vista quasi di profilo, quindi si leggono come presa neutra. OK: talloni a terra, gambe distese, gomiti distesi in partenza |
| Attrezzo | OK: due anelli separati su due cinghie, nessuna maniglia, ancoraggio fuori quadro |
| Coerenza | PROBLEMA (minore): vista quasi di profilo in partenza e tre quarti frontale all'arrivo; gli anelli ruotano con la camera |
| Testo, logo | OK |
| Leggibilità | OK |

**Esito: scartata per l1, l2 e l3.** Non rientra nel repo.

**Figure dei gradini** (SVG a 200 px; geometria confrontata con `db2544e^`).
Tutte usano l'archetipo `row`: ancoraggio a T, **una cinghia sola**, nessun
anello. Per GENERATOR_SPEC, `row` è il TRX.

| chiave | in app a `db2544e` | esito |
|---|---|---|
| `rematore-inverso-trx` | niente (foto `trx-row` tolta) | corretto. La SVG sotto è `row`, a ~35° |
| `horizontal-pull-l1` | niente (foto sbarra tolta) | corretto. La SVG sotto è `row` a ~35° e dice «60 gradi» |
| `horizontal-pull-l2` | **SVG `row`**, ~35°, titolo «anelli a 45 gradi» | **togliere** |
| `horizontal-pull-l3` | niente | corretto. Il motivo parla ancora del TRX |
| `horizontal-pull-l4` | **SVG `row`** con rialzo, corpo quasi orizzontale | **togliere** (attrezzo) |
| `horizontal-pull-l5` | **SVG `row`** a un braccio, ~35°, «agli anelli» | **togliere**; la scheda del gradino manca |
| `horizontal-pull-l6` | **SVG `row`** a un braccio con rialzo | **togliere**; la scheda del gradino manca |

### Da sviluppare (per la sessione principale): correzioni con criteri di accettazione
1. **`horizontal-pull-l2`, `l4`, `l5`, `l6` in `FIGURE_SENZA_IMMAGINE`**, ciascuno
   con il suo motivo, per esempio «Il disegno ha una cinghia sola, come il TRX; il
   gradino è agli anelli (T-37).».
   Criteri:
   - `ExerciseScreen` della scala non mostra nessuna figura con la cinghia unica;
   - `art.test.ts` resta verde;
   - il test 37.8 copre anche le quattro chiavi.
2. **Motivo di `horizontal-pull-l3`**, oggi «Il TRX orizzontale si disegnava…».
   Testo proposto: «Il disegno ha una cinghia sola a ~35°; il gradino è agli
   anelli e orizzontale (T-37).».
3. **Motivo di `rematore-inverso-trx-piedi-rialzati`**: dice ancora «l'esercizio è
   al TRX». Testo del designer: «La foto ha i piedi a terra; l'esercizio è a piedi
   rialzati.».
4. **Nessuna modifica al generatore**: GENERATOR_SPEC è congelato e Alessio ha
   rifiutato le figure. Per S2 A3 il disegno arriva dalla fonte 3, con la scheda
   §5.5, in un'invocazione che non guarda foto RepDB (C2).

### Licenze
- Togliere `trx-row` e `inverted-row` (4 file) è coerente con il termine 3: nel
  repo non restano file RepDB senza voce.
- `rings-inverted-row` è stata guardata solo nella scratchpad, non nel repo. Non
  entra in nessun prompt e non è descritta in nessun prompt (termine 5, C1-C2).

### Rischi (tecnica, licenze, coerenza)
- **Tecnica, oggi in app**: la scala del rematore mostra quattro figure con un
  attrezzo che non è quello della seduta. Due di queste (`l2`, `l5`) dicono
  «anelli» nel testo alternativo.
- **R13**: ogni rinomina di attrezzo seguita da `npm run svg` ripete il problema.
- **Copertura**: S2 A3 e il test d'ingresso non hanno nessuna immagine finché la
  fonte 3 non produce una foto verificata.

### Decisioni per Alessio
- Nessuna nuova. Il rematore agli anelli entra nella coda della fonte 3, dopo
  il pilota; l'ordine lo decide lui.

### Domande aperte
- Al designer: le schede di `l1`, `l3`, `l4`, `l5`, `l6` (annunciate per il
  prossimo giro). Senza schede, nessuna figura della scala si può verificare.
