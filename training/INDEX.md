# INDEX — training-designer

**Stato.** 2026-11-08 audit. 2026-11-12: R1-R4 (R1 in codice). 2026-11-14: R5-R9
(A2, A3, A4, M1, M4; soglie **approvate** S1, S3-S6), ordine R8→R5→R6→R7→R9.
**2026-11-15: D-16 decisa** → R8 riscritta: ultime 2 sedute allo stesso stato nei
14 giorni fino a `fine(W)`, `rimandati`, revisione in-corso/aperta/scaduta;
allineate le parti di revisione di R5-R7; fine seduta invariata
(`reports/2026-11-15-training.md`). Serve l'ok di training-quality su S4.
**Regole in produzione: nessuna versione approvata.** Proposte: progressione/
progressi/consigli 2.0 (rev. 11-15), programmi 2.1, limiti 1.2. `src/` mai toccato.

**Decisioni chiave.** Nessuna AI nel prodotto: i consigli sono verdetti
deterministici di `engine/progression.ts` e `engine/review.ts` → ADVICE.md
descrive quelli, non prompt. Programma attivo = 4 circuiti senza giorni; Shadow
archiviato. Range fissi nei circuiti: si sposta il gradino. Il livello è
dell'esercizio, non dell'atleta. **L'app non ha nessun limite di sicurezza.**

## File di memoria — cosa contiene, quando leggerlo
- `METHOD.md` — leve, range, volume, frequenza, RIR, recupero, riscaldamento, deload, livelli. Leggi se tocchi un principio o un livello.
- `EXERCISE_SCHEMA.md` — campi della scheda esercizio: 9 esistono, 7 mancano. Leggi se aggiungi o correggi un esercizio, o se prepari una scheda per le immagini.
- `PROGRAM_RULES.md` — circuito e R2 (§2), R1 e R4 (§3), serie, durata, sostituzioni, **R9 rientro (§8)**. Leggi se tocchi un blocco, un test o il volume. ~290 righe: condensa prima di aggiungere.
- `PROGRESSION_RULES.md` — soglie, leve, verdetti, **R5 R6 R7 (§9) con tabelle di prova e ordine di implementazione**. Leggi prima di cambiare qualunque numero. **300 righe: condensa prima di aggiungere.**
- `PROGRESS_REVIEW.md` — metriche, massimale, record, stallo, presentazione, **R8 coppia di sedute e finestra di 14 giorni (§6, tabella 8.1-8.28)**. Leggi se tocchi i progressi o la revisione.
- `ADVICE.md` — sorgenti, verdetti, difetti, **testi di R5-R9 (§7)**. Leggi prima di toccare un testo di consiglio.
- `BOUNDARIES.md` — **il file che vale di più.** 14 limiti; **L9 = S1-S6** (limiti 1.2). Leggi sempre. ~296 righe: condensa prima di aggiungere.
- `RULES_CHANGELOG.md` · `DECISIONS.md` (D-1…D-18; D-16 decisa) · `BACKLOG.md` (W-19…W-23 Bloccanti oggi) · `ARCHIVE.md` (voci chiuse) · `reports/`. R3 volume: METHOD §3 + PROGRESS_REVIEW §5.

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
