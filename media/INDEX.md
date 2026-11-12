# INDEX.md — memoria di `exercise-media-lead`

**Stato al 2026-11-12** (commit `47c7f6d`). 72 esercizi, 174 figure SVG + 91
foto RepDB, 307 righe registrate, **zero approvate**: 25 verificate, 39 da
rifare, 243 da verificare. 40 esercizi su 72 mostrano solo la figura generata.

**Oggi**: chiuse §4.1, 4.3, 4.4, 4.18, 4.20, 4.21; hip-thrust verificata (9
figure). Da rifare: pull-over (collo a 66° dopo il fix §4.2), burpee, step
rapidi, estensione sopra la testa. §4.2 riscritta (E1–E3: 21 pose giuste, 19
difetti); nuove §4.22–4.25, R8, R9.

**Fonti.** RepDB: 91 `.webp`, 32 esercizi e 39 gradini. Figure generate: 174
`.svg` da `scripts/generate-exercise-svg.mjs`. Dove c'è la foto, vince.

**Decisioni chiave.**
1. Non si generano immagini con modelli AI. Il termine 5 della licenza RepDB
   vieta quelle immagini anche come riferimento (testo in LICENSING.md).
2. Un esercizio prende un archetipo nuovo quando cambiano il gesto o
   l'attrezzo, non quando «assomiglia».
3. Parametro nuovo su un archetipo → si rileggono tutte le voci che lo usano (R7).
4. `verificata` ≠ `approvata`: approva solo Alessio.
5. Senza `frames` ed `equipment` nelle schede ogni verifica è **provvisoria**.
6. Prima le misure (`pose-audit`), poi l'occhio; ogni correzione su tutti i criteri (R8).

**Cosa contiene ogni file.**
- `STYLE_GUIDE.md` — stile unico, convivenza delle due fonti, inquadrature, fotogrammi, attrezzi, formato.
- `GENERATOR_SPEC.md` — generatore, regola dell'archetipo, mappa schema↔archetipo, **§4 specifiche aperte** (292 righe).
- `ARCHIVE.md` — testo integrale di 4.5, 4.12–4.17, 4.19 (aperte) ed esito delle chiuse.
- `REVIEW_CHECKLIST.md` — gli 8 punti, la regola di scarto, foglio di contatto, §3b misure.
- `LIBRARY.md` — una riga per immagine (307), si legge con `grep`. Unico file oltre le 300 righe.
- `COVERAGE.md` — conti, figure difettose visibili in app, duplicati, foto RepDB che non corrispondono, debiti.
- `REJECTIONS.md` — nove errori ricorrenti (R1–R9) con la correzione.
- `LICENSING.md` — licenza RepDB v1.2, termine 5 per esteso.
- `scripts/contact-sheet.mjs` — foglio di contatto (PNG con percorso **assoluto**; trova Chromium da solo).
- `scripts/pose-audit.mjs` — misure E1–E3 e proporzioni dagli SVG, sola lettura.
- `reports/` — 2026-11-08 (primo avvio), 2026-11-09 (hip thrust bilaterale), 2026-11-12 (`47c7f6d`).

**Prossima invocazione**: riverifica delle figure corrette (§4.2, 4.22–4.24),
poi le 11 di `f63c9f1` mai verificate. Attese risposte di training-designer
(ponte a terra, pull-over, gamba libera: rapporto 11-12).
