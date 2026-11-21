# INDEX — training-designer

**Stato.** 2026-11-08 audit · 11-12 R1-R4 · 11-14/15 R5-R9 · 11-16 R10-R13 · 11-18 R14-R18 ·
11-21 rilasci D, E, F. **In produzione `22f3d31` (rilascio F)**: progressione 4.1, più R9b, R9c,
B18, R20, R21, T-28. Da fare dal rapporto 11-21b: T-31 R22, T-32 R9, resto di T-33, T-34…T-36.
**PROPOSTA 2026-11-21c** (`reports/2026-11-21-training-anelli-figure.md`): T-37 rematore S2 A3
agli anelli (stesso slug, nome senza attrezzo, scala agli anelli; con il media lead) · T-38 R23
zavorra a 0 a ogni cambio di gradino · T-39 `testAllaData` `<` con ripiego · T-40 Z1 al via ·
T-41 `videoQuery`. Schede delle figure: pilota fatto (§5), altri 31 in ordine (§5.6). Nessuna
decisione aperta per Alessio. `src/` mai toccato.

**Decisioni chiave.** Nessuna AI nel prodotto: i consigli sono verdetti deterministici di
`engine/progression.ts`, `review.ts`, `ritest.ts`. ADVICE.md descrive quelli, non prompt.
Programma attivo = 4 circuiti senza giorni; Shadow archiviato. Range fissi: si sposta il gradino.
Il livello è dell'esercizio. D-Q3 (a): S7 su Z1 = «nessuna dose sopra il misurato». Una scala, un
attrezzo. **L'app non ha nessun limite di sicurezza** per il pubblico (L1-L7, L11-L13).

## File di memoria — cosa contiene, quando leggerlo
- `METHOD.md` — leve, range, volume, frequenza, RIR, recupero, riscaldamento, deload, livelli. Leggi se tocchi un principio o un livello.
- `EXERCISE_SCHEMA.md` — campi della scheda: 9 esistono, 7 mancano; slug che mentono; **regola 6 «una scala, un attrezzo»**; puntatore alle prime schede delle figure. Leggi se tocchi un esercizio o prepari una figura.
- `PROGRAM_RULES.md` — circuito, R20 (§2), R1 e R4 (§3), **R21 rev. + S7 su Z1 (§4)**, R19 (§5), sostituzioni, R9, R9b, R9c + `testAllaData`, R22 (§8). Leggi se tocchi un blocco, un test, la durata o le settimane. 297 righe: condensa prima di aggiungere.
- `PROGRESSION_RULES.md` — soglie, leve (§2), verdetti (§5), **R23 (§8)**, R5-R7, R9 (§9), R10, R13 (§10), R14, R15, R17 (§11). Leggi prima di cambiare un numero. 299 righe: condensa prima di aggiungere.
- `PROGRESS_REVIEW.md` — metriche, massimale, record, stallo, presentazione, R8, R11 (con R16), R12, R10b, R22 in R8 (§6).
- `ADVICE.md` — sorgenti, verdetti, difetti, testi di R5-R9, consigli 3.0-4.3 (§7, puntatori). 298 righe: condensa prima di aggiungere.
- `BOUNDARIES.md` — **il file che vale di più.** 14 limiti; L9 = S1-S6 + limiti 1.5 e **1.6 (S7 su Z1, R23)**; L14 con R20. Leggi sempre. 297 righe.
- `RULES_CHANGELOG.md` (voce aperta 2.5/4.3, 11-21c) · `DECISIONS.md` (D-Q3, P-14 anelli, L43 il 2026-11-21; aperte D-1…D-15) · `BACKLOG.md` (W-23, W-51 T-37, W-52 T-38…T-41, W-53 figure) · `ARCHIVE.md` (voci chiuse, casi limite, tabelle) · `reports/`.

## Percorsi del catalogo e delle regole (modificabili da me)
- Catalogo: `src/data/exercises.ts` (56) · `src/data/exercise-art.ts` (figure: `REPDB_ART`, `REPDB_STEP_ART`, `FIGURE_SENZA_IMMAGINE`) · scelta della figura: `engine/media.ts` (`artFor`)
- Metodo e soglie: `src/data/method.ts` · `src/types/core.ts` · `src/types/progression.ts`
- Programmi: `src/data/circuit.ts` (ATTIVO) · `src/data/program.ts` (archiviato) · `src/data/sessions.ts`
- Scale e test: `src/data/progressions.ts` (17 scale × 6) · `src/data/tests.ts` (9) · `src/data/deviations.ts` · `src/data/reference.ts`
- Motore (non lo tocco, lo leggo): `engine/progression.ts` · `review.ts` · `ritest.ts` · `ranges.ts` · `loading.ts` · `metrics.ts` · `schedule.ts` · `rotation.ts` · `circuit.ts` · `history.ts` · `db/repository.ts` (`testAllaData`)
- Tipi: `src/types/exercise.ts` · `program.ts` · `log.ts` · `test.ts`
- Contorno: `compliance/PENDING.md` (privacy, termini, licenze — non è mio) · `media/` (del media lead; domande per me nel suo rapporto 11-21)

## Regole di questa cartella
Leggi INDEX + solo i file pertinenti; a fine invocazione aggiorna file toccati e indice.
Max 300 righe per file; log: aperte + ultime 10, resto in `ARCHIVE.md`. Rapporto su file, max 30 righe alla sessione principale.
