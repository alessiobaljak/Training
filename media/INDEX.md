# INDEX.md — memoria di `exercise-media-lead`

**Stato al 2026-11-21** (figure invariate da `47c7f6d`). 72 esercizi, 174
SVG + 91 foto RepDB, 307 righe, **zero approvate**: 25 verificate, 70 da
rifare, 212 da verificare. 40 esercizi su 72 mostrano solo la figura.

**Oggi**: controllo urgente dell'attrezzo sui 4 circuiti (88 collegamenti:
66 OK, 19 sbagliati, 3 dubbi). Errore nuovo R11: foto RepDB scelte per nome
(`rematore-inverso-trx` → sbarra; `trx-row` va lì). Lo stile si rifà (B8,
`STYLE_TRIALS.md`, raccomandata A): sulle SVG solo elenco, niente spec.

**Fonti.** RepDB: 91 `.webp`, 32 esercizi e 39 gradini. Figure generate: 174
`.svg` da `scripts/generate-exercise-svg.mjs`. Dove c'è la foto, vince.

**Decisioni chiave.**
1. Non si generano immagini con modelli AI. Il termine 5 della licenza RepDB
   vieta quelle immagini anche come riferimento (testo in LICENSING.md).
2. Un esercizio prende un archetipo nuovo quando cambiano il gesto o
   l'attrezzo, non quando «assomiglia».
3. Parametro nuovo → si rileggono tutte le voci (R7); prima le misure, poi l'occhio (R8).
4. `verificata` ≠ `approvata`: approva solo Alessio. Senza `frames`/`equipment` ogni verifica è provvisoria.
5. Catena: livello proprio → `REPDB_ART` poi `exercises/*.svg`; altro gradino → `REPDB_STEP_ART` poi `steps/*.svg` (`engine/media.ts`). La foto si confronta anche con la `variantNote` del blocco (R11).

**Cosa contiene ogni file.**
- `STYLE_GUIDE.md` — stile unico, convivenza delle due fonti, inquadrature, fotogrammi, attrezzi, formato.
- `STYLE_TRIALS.md` + `style-trials/` — tre direzioni, set, anteprima, checklist T/A/B/C, raccomandazione; `tokens.css` (gettoni e contrasti), baseline `pose-audit` per T7.
- `GENERATOR_SPEC.md` — generatore, regola dell'archetipo, mappa schema↔archetipo, **§4 specifiche aperte** (300 righe: la prossima sposta testo in ARCHIVE).
- `ARCHIVE.md` — testo di 4.5–4.7, 4.12–4.17, 4.19, «da rifinire», esito delle chiuse. `REVIEW_CHECKLIST.md` — 8 punti, scarto, foglio di contatto, §3b misure.
- `LIBRARY.md` — una riga per immagine (307), si legge con `grep`. Unico file oltre le 300 righe.
- `COVERAGE.md` — conti, figure difettose visibili in app, duplicati, foto RepDB che non corrispondono, debiti.
- `REJECTIONS.md` — undici errori ricorrenti (R1–R11) con la correzione.
- `LICENSING.md` — licenza RepDB v1.2, termine 5 per esteso.
- `scripts/` — `contact-sheet.mjs` (PNG, percorso **assoluto**; `SHEET_CSS`/`SHEET_THEME` per i gettoni), `pose-audit.mjs` (E1–E3, L; legge `data-pose`).
- `reports/` — 11-08 (primo avvio), 11-09, 11-12, 11-18 (stile), 11-21 (attrezzo nei circuiti).

**Prossima invocazione**: esito di training-quality e del designer sul
rapporto 11-21 (anelli o TRX, kettlebell del bulgaro, box o elastico, «due
panche»); Alessio sceglie fra «vuota» e ripiego SVG. Poi le prove di stile
(STYLE_TRIALS §7). Ancora attese: stile, circonduzioni, vetro sì/no, T1 cieca;
designer su ponte a terra, pull-over, gamba libera, `equipment`/`frames`.
