# INDEX — training-designer

**Stato.** 2026-11-08 audit · 11-12 R1-R4 · 11-14/15 R5-R9 · 11-16 R10-R13 ·
11-18 R14-R18 · 11-20 e 11-21 risposte a quality. **In produzione `e30cdc6`:
progressione 4.0** (rilascio A + rev. 11-20 + D-21 a, D-22 a con R19 a fine seduta,
D-23 a); R9 no. **Rilascio B** (T-15 R14a/c/e, T-16 R14d) in corso nella sessione
principale. **PROPOSTA rev. 2026-11-21** (`reports/2026-11-21-training.md`, vale sopra
11-18 e 11-20): D-19 b manubrio esatto (T-24, nel B), R19 in revisione M22 (T-25),
σ′ L25 (T-26), nota + `DEVIAZIONI_NOTA` L26 (T-27). Nessuna decisione aperta per
Alessio sul giro. Rischio R-7 residuo in `SessionScreen`. `src/` mai toccato.

**Decisioni chiave.** Nessuna AI nel prodotto: i consigli sono verdetti
deterministici di `engine/progression.ts` e `engine/review.ts` → ADVICE.md
descrive quelli, non prompt. Programma attivo = 4 circuiti senza giorni; Shadow
archiviato. Range fissi nei circuiti: si sposta il gradino. Il livello è
dell'esercizio, non dell'atleta. **L'app non ha nessun limite di sicurezza.**

## File di memoria — cosa contiene, quando leggerlo
- `METHOD.md` — leve, range, volume, frequenza, RIR, recupero, riscaldamento, deload, livelli. Leggi se tocchi un principio o un livello.
- `EXERCISE_SCHEMA.md` — campi della scheda esercizio: 9 esistono, 7 mancano. Leggi se aggiungi o correggi un esercizio, o se prepari una scheda per le immagini.
- `PROGRAM_RULES.md` — circuito e R2 (§2), R1 e R4 (§3), serie, **R18 minimo con i bonus (§4)**, **R19 tetto 55′ e σ′ (§5)**, sostituzioni, **R9 rientro (§8)**. Leggi se tocchi un blocco, un test, il volume o la durata. ~296 righe: condensa prima di aggiungere.
- `PROGRESSION_RULES.md` — soglie, leve (§2 con R19 e manubri), verdetti, R5-R7 (§9), R10 (R10c-1 con D-19 b) e R13 (§10), **R14, R15, R17c e ordine (§11, rev. 11-21)**. Leggi prima di cambiare qualunque numero. ~297 righe: condensa prima di aggiungere.
- `PROGRESS_REVIEW.md` — metriche, massimale, record, stallo, presentazione, **R8 + R11 (con R16), R12, R10b (con R14c) (§6)**. Leggi se tocchi i progressi o la revisione.
- `ADVICE.md` — sorgenti, verdetti, difetti, **testi di R5-R9, consigli 3.0 e 4.0 (R14-R17) in §7**. Leggi prima di toccare un testo di consiglio. 299 righe: condensa prima di aggiungere.
- `BOUNDARIES.md` — **il file che vale di più.** 14 limiti; **L9 = S1-S6** (limiti 1.4: S2 dal giorno dell'esecuzione). Leggi sempre. ~296 righe: condensa prima di aggiungere.
- `RULES_CHANGELOG.md` · `DECISIONS.md` (D-1…D-23 e D-19 b: D-19…D-23 decise; P-12) · `BACKLOG.md` (W-23; W-37 B, W-43 T-24, W-44 T-25…T-27, W-45 manubri dell'atleta) · `ARCHIVE.md` (voci chiuse, casi limite e tabelle 5.x-7.x) · `reports/`. R3 volume: METHOD §3 + PROGRESS_REVIEW §5.

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
