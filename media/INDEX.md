# INDEX.md — memoria di `exercise-media-lead`

**Stato al 2026-11-08 (primo avvio).** Libreria completa come copertura, non
come qualità: 56/56 esercizi e 102/102 gradini hanno un'immagine, **zero
approvate**. Verificate 22 figure (le 16 del programma a circuito più le 6 che
condividono un archetipo con loro): **16 da rifare, 2 passate**, più 4
mappature RepDB che mostrano un esercizio diverso da quello della scheda.

**Fonti in uso.** Due. RepDB: 91 `.webp` acquistati, coprono 32 esercizi e 39
gradini. Figure generate: 158 `.svg` da `scripts/generate-exercise-svg.mjs`,
43 archetipi di posa. Dove c'è la foto vince la foto; i 16 esercizi del
circuito non ne hanno e vedono solo la figura generata.

**Decisioni chiave.**
1. Non si generano immagini con modelli AI. Il termine 5 della licenza RepDB
   vieta quelle immagini anche come riferimento (testo integrale verificato
   alla fonte in LICENSING.md). Le figure non RepDB sono codice parametrico.
2. Un esercizio prende un archetipo nuovo quando cambiano il gesto o
   l'attrezzo, non quando «assomiglia». È la regola che ha salvato tre figure.
3. L'inquadratura la sceglie il criterio dell'esercizio, non l'abitudine.
4. `verificata` ≠ `approvata`: approva solo Alessio.
5. Finché le schede non hanno `frames` ed `equipment` (EXERCISE_SCHEMA.md 1.0,
   oggi assenti su tutti i 56) ogni verifica è **provvisoria**, fatta sui `cues`.

**Cosa contiene ogni file.**
- `STYLE_GUIDE.md` — stile unico, convivenza delle due fonti, inquadrature, fotogrammi, attrezzi, formato.
- `GENERATOR_SPEC.md` — generatore, chiavi della posa, mappa archetipo↔schema motorio, la regola dell'archetipo, **§4: 19 correzioni aperte con criteri di accettazione**. 300 righe, al limite: le specifiche chiuse vanno in `ARCHIVE.md`.
- `REVIEW_CHECKLIST.md` — gli 8 punti, la regola di scarto, come si guarda.
- `LIBRARY.md` — una riga per immagine (291), si legge con `grep`. Unico file che può superare le 300 righe.
- `COVERAGE.md` — conti, archetipi riusati a sproposito, foto RepDB che non corrispondono alla scheda, debiti aperti.
- `REJECTIONS.md` — sei errori ricorrenti (R1–R6) con la correzione.
- `LICENSING.md` — licenza RepDB v1.2 letta alla fonte, termine 5 per esteso, tre affermazioni del repo che la licenza non conferma.
- `scripts/contact-sheet.mjs` — rasterizza le SVG in foglio di contatto.
- `reports/2026-11-08-media.md` — rapporto completo del primo avvio.

**Prossima invocazione**: riverificare le figure rifatte dalla sessione
principale, nell'ordine di GENERATOR_SPEC §4; `kb-swing` per primo.
