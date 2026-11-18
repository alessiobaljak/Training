# INDEX.md — memoria di `exercise-media-lead`

**Stato al 2026-11-18** (figure invariate da `47c7f6d`). 72 esercizi, 174
SVG + 91 foto RepDB, 307 righe, **zero approvate**: 25 verificate, 46 da
rifare, 236 da verificare. 40 esercizi su 72 mostrano solo la figura.

**Oggi**: lo stile si rifà (B8). Tre direzioni (A Linea, B Sagoma, C Manichino
+ C0) in `STYLE_TRIALS.md`, raccomandata A; 28 prove da rendere fuori da
`src/assets/`. Da rifare: military press, plank con tocco, respirazione,
hollow + `core-l1…l3` (R10 nuovo, §4.26–4.28).

**Fonti.** RepDB: 91 `.webp`, 32 esercizi e 39 gradini. Figure generate: 174
`.svg` da `scripts/generate-exercise-svg.mjs`. Dove c'è la foto, vince.

**Decisioni chiave.**
1. Non si generano immagini con modelli AI. Il termine 5 della licenza RepDB
   vieta quelle immagini anche come riferimento (testo in LICENSING.md).
2. Un esercizio prende un archetipo nuovo quando cambiano il gesto o
   l'attrezzo, non quando «assomiglia».
3. Parametro nuovo → si rileggono tutte le voci (R7); prima le misure, poi l'occhio (R8).
4. `verificata` ≠ `approvata`: approva solo Alessio.
5. Senza `frames` ed `equipment` nelle schede ogni verifica è **provvisoria**.

**Cosa contiene ogni file.**
- `STYLE_GUIDE.md` — stile unico, convivenza delle due fonti, inquadrature, fotogrammi, attrezzi, formato.
- `STYLE_TRIALS.md` + `style-trials/` — tre direzioni, set, anteprima, checklist T/A/B/C, raccomandazione; `tokens.css` (gettoni e contrasti), baseline `pose-audit` per T7.
- `GENERATOR_SPEC.md` — generatore, regola dell'archetipo, mappa schema↔archetipo, **§4 specifiche aperte** (300 righe: la prossima sposta testo in ARCHIVE).
- `ARCHIVE.md` — testo integrale di 4.5–4.7, 4.12–4.17, 4.19, «da rifinire» (aperte) ed esito delle chiuse.
- `REVIEW_CHECKLIST.md` — gli 8 punti, la regola di scarto, foglio di contatto, §3b misure.
- `LIBRARY.md` — una riga per immagine (307), si legge con `grep`. Unico file oltre le 300 righe.
- `COVERAGE.md` — conti, figure difettose visibili in app, duplicati, foto RepDB che non corrispondono, debiti.
- `REJECTIONS.md` — dieci errori ricorrenti (R1–R10) con la correzione.
- `LICENSING.md` — licenza RepDB v1.2, termine 5 per esteso.
- `scripts/` — `contact-sheet.mjs` (PNG, percorso **assoluto**; `SHEET_CSS`/`SHEET_THEME` per i gettoni), `pose-audit.mjs` (E1–E3, L; legge `data-pose`).
- `reports/` — 11-08 (primo avvio), 11-09 (hip thrust), 11-12 (`47c7f6d`), 11-18 (direzioni di stile).

**Prossima invocazione**: verificare le prove rese (STYLE_TRIALS §7, due temi,
`pose-audit` contro la baseline), poi ad Alessio. Attese: scelta dello stile,
circonduzioni, vetro sopra contenuti sì/no, chi fa T1 cieca; designer su
ponte a terra, pull-over, gamba libera, `equipment`/`frames`.
