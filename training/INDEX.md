# INDEX — training-designer

**Stato.** 2026-11-08 audit · 11-12 R1-R4 · 11-14/15 R5-R9 · 11-16 R10-R13 · 11-18
R14-R18 · 11-20/21 risposte a quality. **In produzione `6cbb759` (rilascio C):
progressione 4.1** (B: R14a-e, D-19 b; C: M22, L25, L26, B14); R9 no. **PROPOSTA
2026-11-21b** (`reports/2026-11-21-training-b9-b10-m4.md`, vale sopra le precedenti):
T-28 R-16 il ritest riscrive la data di inizio (**per primo**) · T-29 R20 giro della
finitura (B10) · T-30 R21 Z1 dead hang (B9) · T-31 R22 settimane (D-17 a) · T-32 R9a rev.
«prima i test» · T-33 R9b (D-18 sì) + R9c (R-17) · T-34 manubri · T-35/36 L27-L32.
Nessuna domanda aperta per Alessio. `src/` mai toccato.

**Decisioni chiave.** Nessuna AI nel prodotto: i consigli sono verdetti
deterministici di `engine/progression.ts` e `engine/review.ts` → ADVICE.md
descrive quelli, non prompt. Programma attivo = 4 circuiti senza giorni; Shadow
archiviato. Range fissi nei circuiti: si sposta il gradino. Il livello è
dell'esercizio, non dell'atleta. **L'app non ha nessun limite di sicurezza.**

## File di memoria — cosa contiene, quando leggerlo
- `METHOD.md` — leve, range, volume, frequenza, RIR, recupero, riscaldamento, deload, livelli. Leggi se tocchi un principio o un livello.
- `EXERCISE_SCHEMA.md` — campi della scheda esercizio: 9 esistono, 7 mancano. Leggi se aggiungi o correggi un esercizio, o se prepari una scheda per le immagini.
- `PROGRAM_RULES.md` — circuito, R2 e **R20 (§2)**, R1 e R4 (§3), serie, R18 e **R21 (§4)**, R19 tetto 55′ (§5), sostituzioni, **R9 rev. + R9b, R9c, R22 (§8)**. Leggi se tocchi un blocco, un test, il volume, la durata o le settimane. 291 righe: condensa prima di aggiungere.
- `PROGRESSION_RULES.md` — soglie, leve (§2), verdetti, R5-R7 e R9 (§9), R10 (manubri, kettlebell) e R13 (§10), R14, R15, R17c, ordine e L30 (§11). Leggi prima di cambiare qualunque numero. 299 righe: condensa prima di aggiungere.
- `PROGRESS_REVIEW.md` — metriche, massimale, record, stallo, presentazione, R8 + R11 (con R16), R12, R10b, **R22 in R8 (§6)**. Leggi se tocchi i progressi o la revisione.
- `ADVICE.md` — sorgenti, verdetti, difetti, testi di R5-R9, consigli 3.0, 4.0 e **puntatori 4.2 (§7)**. Leggi prima di toccare un testo di consiglio. 298 righe: condensa prima di aggiungere.
- `BOUNDARIES.md` — **il file che vale di più.** 14 limiti; **L9 = S1-S6** (+ limiti 1.5: un test non alza mai un gradino, giorno di test senza seduta), L14 con R20. Leggi sempre. 299 righe: condensa prima di aggiungere.
- `RULES_CHANGELOG.md` · `DECISIONS.md` (D-17, D-18, D-19 b chiuse il 2026-11-21; P-13 attrezzatura; aperte D-1…D-15) · `BACKLOG.md` (W-46 T-28, W-23 R9, W-47 B9/B10, W-48 manubri, W-49 L27-L32, W-50 per quality) · `ARCHIVE.md` (voci chiuse, casi limite, tabelle 5.x-7.x e 9.x) · `reports/`. R3 volume: METHOD §3 + PROGRESS_REVIEW §5.

## Percorsi del catalogo e delle regole (modificabili da me)
- Catalogo: `src/data/exercises.ts` (56) · `src/data/exercise-art.ts` (fotogrammi)
- Metodo e soglie: `src/data/method.ts` · `src/types/core.ts` · `src/types/progression.ts`
- Programmi: `src/data/circuit.ts` (ATTIVO) · `src/data/program.ts` (archiviato) · `src/data/sessions.ts`
- Scale e test: `src/data/progressions.ts` (17 scale × 6) · `src/data/tests.ts` (9) · `src/data/deviations.ts` · `src/data/reference.ts`
- Motore (non lo tocco, lo leggo): `engine/progression.ts` · `review.ts` · `ranges.ts` · `loading.ts` · `metrics.ts` · `schedule.ts` · `rotation.ts` · `circuit.ts` · `history.ts`
- Tipi: `src/types/exercise.ts` · `program.ts` · `log.ts` · `test.ts`
- Contorno: `compliance/PENDING.md` (privacy, termini, licenze — non è mio)

## Regole di questa cartella
Leggi INDEX + solo i file pertinenti; a fine invocazione aggiorna file toccati e indice.
Max 300 righe per file; log: aperte + ultime 10, resto in `ARCHIVE.md`. Rapporto su file, max 30 righe alla sessione principale.
