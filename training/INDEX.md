# INDEX — training-designer

**Stato.** 2026-11-08 audit. 2026-11-12: R1-R4. 2026-11-14/15: R5-R9, R8 su D-16.
**In produzione `a747e09` (2026-11-16): R5-R8** (progressione e progressi 2.0,
GO quality 2026-11-15); R9 no. **2026-11-16: R10-R13** (A17, M17, L15, D-4),
progressione/progressi/consigli 3.0, limiti 1.3, PROPOSTA
(`reports/2026-11-16-training.md`, T-1…T-9). Aspettano Alessio: **D-4** (R13b)
e **D-19** (manubrio = leva?). Rischio R-1: S2 vale solo per proposta. `src/` mai toccato.

**Decisioni chiave.** Nessuna AI nel prodotto: i consigli sono verdetti
deterministici di `engine/progression.ts` e `engine/review.ts` → ADVICE.md
descrive quelli, non prompt. Programma attivo = 4 circuiti senza giorni; Shadow
archiviato. Range fissi nei circuiti: si sposta il gradino. Il livello è
dell'esercizio, non dell'atleta. **L'app non ha nessun limite di sicurezza.**

## File di memoria — cosa contiene, quando leggerlo
- `METHOD.md` — leve, range, volume, frequenza, RIR, recupero, riscaldamento, deload, livelli. Leggi se tocchi un principio o un livello.
- `EXERCISE_SCHEMA.md` — campi della scheda esercizio: 9 esistono, 7 mancano. Leggi se aggiungi o correggi un esercizio, o se prepari una scheda per le immagini.
- `PROGRAM_RULES.md` — circuito e R2 (§2), R1 e R4 (§3), serie, durata, sostituzioni, **R9 rientro (§8)**. Leggi se tocchi un blocco, un test o il volume. ~290 righe: condensa prima di aggiungere.
- `PROGRESSION_RULES.md` — soglie, leve, verdetti, R5-R7 (§9, tabelle in ARCHIVE), **R10 e R13 (§10) e ordine del giro 11-16**. Leggi prima di cambiare qualunque numero. ~296 righe: condensa prima di aggiungere.
- `PROGRESS_REVIEW.md` — metriche, massimale, record, stallo, presentazione, **R8 + R11, R12, R10b (§6, ordine per esercizio, tabella 8.x)**. Leggi se tocchi i progressi o la revisione.
- `ADVICE.md` — sorgenti, verdetti, difetti, **testi di R5-R9 e consigli 3.0 (R10-R13) in §7**. Leggi prima di toccare un testo di consiglio.
- `BOUNDARIES.md` — **il file che vale di più.** 14 limiti; **L9 = S1-S6** (limiti 1.3: S2 su 7 giorni). Leggi sempre. ~296 righe: condensa prima di aggiungere.
- `RULES_CHANGELOG.md` · `DECISIONS.md` (D-1…D-19; P-11) · `BACKLOG.md` (W-23; giro 11-16 W-24…W-31) · `ARCHIVE.md` (voci chiuse, tabelle 5.x-7.x) · `reports/`. R3 volume: METHOD §3 + PROGRESS_REVIEW §5.

## Percorsi del catalogo e delle regole (modificabili da me)
- Catalogo: `src/data/exercises.ts` (56) · `src/data/exercise-art.ts` (fotogrammi)
- Metodo e soglie: `src/data/method.ts` · `src/types/core.ts` · `src/types/progression.ts`
- Programmi: `src/data/circuit.ts` (ATTIVO) · `src/data/program.ts` (archiviato) · `src/data/sessions.ts`
- Scale e test: `src/data/progressions.ts` (17 scale × 6) · `src/data/tests.ts` (9) · `src/data/deviations.ts` · `src/data/reference.ts`
- Motore (non lo tocco, lo leggo): `engine/progression.ts` · `review.ts` · `ranges.ts` · `loading.ts` · `metrics.ts` · `schedule.ts` · `rotation.ts` · `circuit.ts` · `history.ts`
- Tipi: `src/types/exercise.ts` · `program.ts` · `log.ts` · `test.ts`
- Contorno: `compliance/PENDING.md` (privacy, termini, licenze — non è mio)

## Regole di questa cartella
Leggi INDEX + solo i file pertinenti; a fine invocazione aggiorna file toccati e
indice. Max 300 righe per file; log: aperte + ultime 10, resto in `ARCHIVE.md`.
Rapporto su file, max 30 righe alla sessione principale.
