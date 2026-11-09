# INDEX.md — memoria di `exercise-media-lead`

**Stato al 2026-11-09.** 72 esercizi (erano 56), 174 figure SVG + 91 foto
RepDB, 308 registrate, **zero approvate**: 14 verificate, 36 da rifare, 257 da
verificare. **40 esercizi su 72** non hanno foto e mostrano solo la figura
generata (erano 24): è lì che sta il rischio.

**Oggi**: verificata `hip-thrust-panca-bilaterale` → **da rifare** (archetipo,
tecnica, attrezzo, freccia). Registrate le 15 figure arrivate con `f63c9f1` e
mai guardate. Nuove specifiche §4.20 (la figura), §4.21 (il lockout di tutte e
9 le figure hip-thrust), §4.18 riscritta (panca e due gambe nei gradini).

**Fonti.** RepDB: 91 `.webp`, 32 esercizi e 39 gradini. Figure generate: 174
`.svg` da `scripts/generate-exercise-svg.mjs`. Dove c'è la foto, vince.

**Decisioni chiave.**
1. Non si generano immagini con modelli AI. Il termine 5 della licenza RepDB
   vieta quelle immagini anche come riferimento (testo in LICENSING.md).
2. Un esercizio prende un archetipo nuovo quando cambiano il gesto o
   l'attrezzo, non quando «assomiglia».
3. Quando un archetipo prende un **parametro** nuovo, si rileggono tutte le
   voci di `FIGURES` e `STEPS` che lo usano (R7, imparata oggi).
4. `verificata` ≠ `approvata`: approva solo Alessio.
5. Senza `frames` ed `equipment` nelle schede ogni verifica è **provvisoria**.

**Cosa contiene ogni file.**
- `STYLE_GUIDE.md` — stile unico, convivenza delle due fonti, inquadrature, fotogrammi, attrezzi, formato.
- `GENERATOR_SPEC.md` — generatore, chiavi della posa, mappa archetipo↔schema motorio, la regola dell'archetipo, **§4: specifiche aperte** (299 righe, al limite).
- `ARCHIVE.md` — testo integrale di §4.3, 4.4, 4.5, 4.17, 4.19: **aperte**, spostate solo per il limite di righe.
- `REVIEW_CHECKLIST.md` — gli 8 punti, la regola di scarto, come si guarda.
- `LIBRARY.md` — una riga per immagine (308), si legge con `grep`. Unico file che può superare le 300 righe.
- `COVERAGE.md` — conti, duplicati (6 gruppi negli esercizi + 8 file identici nei gradini hip-thrust), foto RepDB che non corrispondono, debiti.
- `REJECTIONS.md` — sette errori ricorrenti (R1–R7) con la correzione.
- `LICENSING.md` — licenza RepDB v1.2, termine 5 per esteso.
- `scripts/contact-sheet.mjs` — foglio di contatto (il PNG in uscita vuole un percorso **assoluto**).
- `reports/` — 2026-11-08 (primo avvio), 2026-11-09 (hip thrust bilaterale).

**Prossima invocazione**: le 15 figure di `f63c9f1` mai verificate, partendo
da `corda-per-saltare`, `military-press-manubri`, `curl-panca-inclinata`,
`burpee`; poi riverifica delle figure hip-thrust rifatte.
