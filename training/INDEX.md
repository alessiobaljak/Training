# INDEX — training-designer

**Stato.** Primo avvio fatto il 2026-11-08: audit + prima specifica.
**Regole in produzione: nessuna versione approvata.** Il comportamento dell'app
è quello del codice; le proposte `metodo/programmi/progressione/progressi/
consigli/schema/limiti 1.0` attendono Alessio. Nessun file di `src/` toccato.

**Decisioni chiave.** Nessuna AI nel prodotto: i consigli sono verdetti
deterministici di `engine/progression.ts` e `engine/review.ts` → ADVICE.md
descrive quelli, non prompt. Programma attivo = 4 circuiti senza giorni; Shadow
archiviato. Range fissi nei circuiti: si sposta il gradino. Il livello è
dell'esercizio, non dell'atleta. **L'app non ha nessun limite di sicurezza.**

## File di memoria — cosa contiene, quando leggerlo
- `METHOD.md` — leve, range, volume, frequenza, RIR, recupero, riscaldamento, deload, livelli. Leggi se tocchi un principio o un livello.
- `EXERCISE_SCHEMA.md` — campi della scheda esercizio: 9 esistono, 7 mancano. Leggi se aggiungi o correggi un esercizio, o se prepari una scheda per le immagini.
- `PROGRAM_RULES.md` — struttura della settimana, scelta del gradino, serie, recuperi, durata, sostituzioni per attrezzo mancante. Leggi se tocchi un blocco.
- `PROGRESSION_RULES.md` — tutte le soglie numeriche di avanzamento e i tetti. Leggi prima di cambiare qualunque numero.
- `PROGRESS_REVIEW.md` — metriche, massimale (misurato, nessuna stima), record, stallo, regole di presentazione. Leggi se tocchi i progressi.
- `ADVICE.md` — le tre sorgenti dei consigli, i verdetti, i 6 difetti aperti. Leggi prima di toccare un testo di consiglio.
- `BOUNDARIES.md` — **il file che vale di più.** 13 limiti con dove, innesco, cosa fa l'app, cosa legge l'atleta, come si verifica. Leggi sempre.
- `RULES_CHANGELOG.md` · `DECISIONS.md` (11 decisioni per Alessio) · `BACKLOG.md` (D-01…D-07, W-01…W-13) · `reports/`.

## Percorsi del catalogo e delle regole (modificabili da me)
- Catalogo: `src/data/exercises.ts` (56) · `src/data/exercise-art.ts` (fotogrammi)
- Metodo e soglie: `src/data/method.ts` · `src/types/core.ts` · `src/types/progression.ts`
- Programmi: `src/data/circuit.ts` (ATTIVO) · `src/data/program.ts` (archiviato) · `src/data/sessions.ts`
- Scale e test: `src/data/progressions.ts` (17 scale × 6) · `src/data/tests.ts` (9) · `src/data/deviations.ts` · `src/data/reference.ts`
- Motore (non lo tocco, lo leggo): `engine/progression.ts` · `review.ts` · `ranges.ts` · `loading.ts` · `metrics.ts` · `schedule.ts` · `rotation.ts` · `circuit.ts` · `history.ts`
- Tipi: `src/types/exercise.ts` · `program.ts` · `log.ts` · `test.ts`
- Contorno: `compliance/PENDING.md` (privacy, termini, licenze — non è mio)

## Regole di questa cartella
Leggi `INDEX.md` + solo i file pertinenti. Aggiorna i file toccati e questo
indice a fine invocazione. Nessun file oltre 300 righe. Log: voci aperte e
ultime 10, il resto in `ARCHIVE.md`. Rapporto completo su file, max 30 righe
alla sessione principale.
