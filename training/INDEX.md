# INDEX — training-designer

**Stato.** 2026-11-08 audit · 11-12 R1-R4 · 11-14/15 R5-R9 · 11-16 R10-R13.
**In produzione `fe85203`: progressione/progressi/consigli 3.0** (R5-R8, R10-R13
con D-4 a e R10c-1, A18), GO quality 2026-11-16; R9 no. **2026-11-18: R14-R18**
(M18, L18-L21, minimo con i bonus), progressione 4.0 · progressi 3.1 · consigli
4.0 · programmi 2.2 · limiti 1.4, PROPOSTA (`reports/2026-11-18-training.md`,
T-10…T-16). Aspettano Alessio: **D-20** (data di un aumento), **D-19 (b)**
(manubri). Rischio aperto R-7: il player propone il tetto del manubrio. `src/` mai toccato.

**Decisioni chiave.** Nessuna AI nel prodotto: i consigli sono verdetti
deterministici di `engine/progression.ts` e `engine/review.ts` → ADVICE.md
descrive quelli, non prompt. Programma attivo = 4 circuiti senza giorni; Shadow
archiviato. Range fissi nei circuiti: si sposta il gradino. Il livello è
dell'esercizio, non dell'atleta. **L'app non ha nessun limite di sicurezza.**

## File di memoria — cosa contiene, quando leggerlo
- `METHOD.md` — leve, range, volume, frequenza, RIR, recupero, riscaldamento, deload, livelli. Leggi se tocchi un principio o un livello.
- `EXERCISE_SCHEMA.md` — campi della scheda esercizio: 9 esistono, 7 mancano. Leggi se aggiungi o correggi un esercizio, o se prepari una scheda per le immagini.
- `PROGRAM_RULES.md` — circuito e R2 (§2), R1 e R4 (§3), serie, durata, **R18 minimo con i bonus (§4)**, sostituzioni, **R9 rientro (§8)**. Leggi se tocchi un blocco, un test o il volume. ~296 righe: condensa prima di aggiungere.
- `PROGRESSION_RULES.md` — soglie, leve, verdetti, R5-R7 (§9; casi limite e tabelle in ARCHIVE), R10 e R13 (§10), **R14, R15, R17 e ordine del giro 11-18 (§11)**. Leggi prima di cambiare qualunque numero. 299 righe: condensa prima di aggiungere.
- `PROGRESS_REVIEW.md` — metriche, massimale, record, stallo, presentazione, **R8 + R11 (con R16), R12, R10b (con R14c) (§6)**. Leggi se tocchi i progressi o la revisione.
- `ADVICE.md` — sorgenti, verdetti, difetti, **testi di R5-R9, consigli 3.0 e 4.0 (R14-R17) in §7**. Leggi prima di toccare un testo di consiglio. ~297 righe: condensa prima di aggiungere.
- `BOUNDARIES.md` — **il file che vale di più.** 14 limiti; **L9 = S1-S6** (limiti 1.4: S2 dal giorno dell'esecuzione). Leggi sempre. ~296 righe: condensa prima di aggiungere.
- `RULES_CHANGELOG.md` · `DECISIONS.md` (D-1…D-20; P-12) · `BACKLOG.md` (W-23; giro 11-18 W-32…W-37; W-38) · `ARCHIVE.md` (voci chiuse, casi limite e tabelle 5.x-7.x) · `reports/`. R3 volume: METHOD §3 + PROGRESS_REVIEW §5.

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
