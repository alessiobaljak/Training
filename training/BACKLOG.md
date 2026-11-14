# BACKLOG.md

Ordinato per rischio, non per fatica. `D-nn` = difetto trovato nell'audit del
2026-11-08; `W-nn` = lavoro di metodo da fare.
Ogni voce serve codice e passa da `training-quality` e `release-gate`. Chiuse
o assorbite: `ARCHIVE.md`.

## Bloccanti oggi (decisione di Alessio, 2026-11-12) — spec 2026-11-14

Ordine obbligato: W-19 → W-20 → W-21 → W-22 → W-23 (PROGRESSION_RULES §9).

| id | cosa | dove | chi |
|---|---|---|---|
| W-19 | R8 serie vere, 2 sedute, voci allo stato attuale (M1) | `review.ts`, `ReviewScreen.tsx` | sessione principale |
| W-20 | R5 cancello unico, verdetti sul tempo, scarico (A2) | `progression.ts`, `review.ts`, `SessionSummary.tsx` | sessione principale |
| W-21 | R6 variante prima del carico, soglia del test anche a fine seduta (A3) | `review.ts`, `progression.ts`, `SessionSummary.tsx` | sessione principale |
| W-22 | R7 un gradino ogni 14 giorni (A4; assorbe D-02 e W-18) | `review.ts`, `progression.ts`, `ReviewScreen.tsx` | sessione principale |
| W-23 | R9 rientro, R9a ritest, R9b separabile (M4) | `rotation.ts`, `schedule.ts`, `rest.ts`, `circuit.ts` (motore), `HomeScreen.tsx` | sessione principale |

## Bloccanti per l'uso pubblico

| id | cosa | dove | chi |
|---|---|---|---|
| W-14 | R1 gradino di partenza (B5 di quality) + `eccentricOnly` + `variantNoteLevel` + nome gradino 1 trazione verticale — spec: rapporto 2026-11-12. In codice in gran parte (2026-11-14); il nome del gradino 1 è ancora «Trazioni assistite» | `progression.ts`, `progressions.ts`, `circuit.ts` | sessione principale |
| W-15 | R2 transizione 15" B→F + L14 (A8 di quality) | `circuit.ts`, `circuit.test.ts` | sessione principale |
| W-01 | Limiti L1, L2, L13, L11, L12 di BOUNDARIES.md: screening, dolore, sintomi gravi, minorenni, test di non-regressione sul testo dell'atleta | onboarding, player, settings | sessione principale |
| W-02 | Campi mancanti nella scheda esercizio: `equipment`, `minLevel`, `prerequisites`, `sites`, `contraindications`, `execution`, `commonErrors`, `frames` | `src/types/exercise.ts`, `src/data/exercises.ts` | training-designer + sessione principale |

## Alti

| id | cosa | dove |
|---|---|---|
| D-04 | Deload e ritest importati dal programma archiviato; `RETEST_BANNER` promette un ricalcolo impossibile nei circuiti | `src/engine/schedule.ts`, `src/data/program.ts` |
| W-03 | Regola di sostituzione per attrezzo mancante (PROGRAM_RULES §6): oggi 5 blocchi su 48 hanno un'alternativa, tutti e cinque nella finitura | `src/data/circuit.ts` |
| W-16 | R3 volume: una funzione sola, F e Z fuori, fasce per gruppo, Progressi fatte/previste/fascia (A7, M10) | `metrics.ts`, `ProgressScreen.tsx` |
| W-17 | R4 test richiesti calcolati (7), «non eseguito» al posto di 0 | `tests.ts`, `OnboardingScreen.tsx` |
| W-04 | Verdetto `stallo` (PROGRESS_REVIEW §4); `rifai-al-tempo-giusto` è passato a W-20 | `src/engine/review.ts` |

## Medi

| id | cosa |
|---|---|
| D-05 | `reviewWeek` mescola serie di blocchi con range diversi sullo stesso slug: latente oggi, basta un blocco nuovo |
| D-06 | Due `variantNote` parlano di silhouette e «vita sottile» in un'app che misura la circonferenza vita |
| W-05 | Record personali (PROGRESS_REVIEW §3): non esistono |
| W-06 | 25 esercizi su 56 hanno `pattern: null`: nessuna regressione, nessuna progressione, nessuna via d'uscita |
| W-07 | Almeno 4 esercizi su 56 senza cue «Errore tipico»; almeno 18 senza criterio esplicito di ripetizione valida o di fine serie |
| W-08 | Versione delle regole nel `SuggestionRecord` (ADVICE §4.7) |
| D-07 | Due regole di ordinamento dei blocchi vivono come commenti in `circuit.ts` (niente due stazioni di presa consecutive; niente terza cerniera d'anca a fine seduta): vanno diventate test sui dati |

## Bassi

| id | cosa |
|---|---|
| W-09 | Tre slug mentono sull'attrezzo (`alzate-laterali-elastico`, `curl-elastico-presa-neutra`, `croci-elastico-o-pushup-presa-larga`): gli slug restano, `equipment` dice la verità |
| W-10 | Il titolo di `aggiungi-peso` dice «passa al manubrio successivo» anche sulla kettlebell, i cui salti reali sono di 4 kg |
| W-11 | `SESSIONS_PER_WEEK` in `ProgressScreen.tsx` è corretto (4) ma il commento sopra dice «sei»: denominatore dell'aderenza, vale la pena che il commento non menta |
| W-12 | Tetto di durata della seduta (PROGRAM_RULES §5): oggi `estimatedMinutes` è un dato scritto a mano, 40 su tutti e quattro i circuiti |
| W-13 | Il riscaldamento non è saltabile dall'app quando la seduta ha un blocco a RIR 0-1 o una stazione balistica (METHOD §7) |
