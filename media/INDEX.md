# INDEX.md — memoria di `exercise-media-lead`

**Stato al 2026-11-21 sera** (`db2544e`, T-37). 72 esercizi: 25 con foto, 38 solo SVG,
9 senza. 81 foto RepDB, 174 SVG, **0 generate**. LIBRARY 309: 25 verificate, 40 da
rifare, 196 da verificare, 48 ritirate, **0 approvate**. 33 delle sedute attive senza foto (COVERAGE §6).

**Oggi**: fonte 3 aperta (Alessio: foto da solo testo; «non voglio gli omini»). T-37:
`rings-inverted-row` scartata per ogni gradino; `horizontal-pull-l2`, `l4`, `l5`, `l6` (SVG `row` = TRX) da togliere (R13).

**Fonti.** RepDB (81 `.webp`); SVG solo dove non c'è altro; **fonte 3**:
`Qwen/Qwen-Image` @ `75e0b4b` via Space `mcp-tools/Qwen-Image` @ `bce5b19` (§3.5, S1–S4).

**Decisioni chiave.**
1. Il media lead **non genera**. La fonte 3 è solo testo (C1–C8, LICENSING
   §3.3): nessun file RepDB in ingresso, né descritto nel prompt. **Mai foto
   RepDB nella stessa invocazione in cui si scrivono stile o prompt** (C2).
2. Un esercizio prende un archetipo (o una scheda) nuovo quando cambiano il
   gesto o l'attrezzo, non quando «assomiglia».
3. Parametro nuovo → si rileggono tutte le voci (R7); prima le misure, poi l'occhio (R8).
4. `verificata` ≠ `approvata`: approva solo Alessio. Senza `frames`/`equipment` ogni verifica è provvisoria.
5. Catena: livello proprio → `REPDB_ART` poi `exercises/*.svg`; altro gradino → `REPDB_STEP_ART` poi `steps/*.svg`; `FIGURE_SENZA_IMMAGINE` = niente. La foto si confronta con la `variantNote` del blocco (R11).
6. **Prima cosa a ogni invocazione**: `node --experimental-strip-types media/scripts/library-drift.mts` (R12).

**Cosa contiene ogni file.**
- `STYLE_GUIDE.md` — fonti e convivenza, inquadrature, fotogrammi; **§8 foto generate**: soggetto, vestiti, fondale, file, prompt T1/T2/E, segnaposto, dizionario attrezzi.
- `LICENSING.md` — RepDB v1.2 (termine 5 per esteso); **§3 fonte 3**: modelli verificati, C1–C8, fotogramma 1 come ingresso (E1–E4); §4 escluse.
- `REVIEW_CHECKLIST.md` — 8 punti, scarto, foglio di contatto, misure; **§5 G0–G11** per le foto generate.
- `LIBRARY.md` — una riga per immagine (309), con `grep`; formato delle righe «generata AI» in testa. Unico oltre le 300.
- `COVERAGE.md` — conti, rischio, archetipi, foto RepDB non corrispondenti (10 su 12 applicate), debiti, §6 i 32 da generare.
- `REJECTIONS.md` — R1–R13. `GENERATOR_SPEC.md` — SVG, congelato (300 righe). `STYLE_TRIALS.md` — prove SVG, superate dal rifiuto.
- `prompts/` — un file per esercizio: prompt eseguito, parametri, esecuzioni. Pilota in bozza: kb-swing, corda-battaglia-slam, apertura-anche, respirazione-360.
- `scripts/` — `contact-sheet.mjs` (anche webp), `pose-audit.mjs`, `library-drift.mts`. `reports/` — 11-08 … 11-21, 11-21-media-generate, 11-21-media-anelli.
  STYLE_GUIDE riga 10 conta ancora 85 foto: da correggere in un'invocazione di stile.

**Prossima invocazione**: schede del designer per il pilota → prompt
riempiti → file del pilota in `media/pilot/` → G0–G11. In attesa: Alessio su
modello, fotogramma 1 come ingresso, soggetto, foto o illustrazione, RepDB da
tenere; designer su swing a 2 fotogrammi, apertura anche (affondo o couch),
schede dei gradini `horizontal-pull` 1, 3-6, `hammer-curl` per il curl a martello.
