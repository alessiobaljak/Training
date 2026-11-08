# BACKLOG.md

Ordinato per rischio, non per fatica. `D-nn` = difetto trovato nell'audit del
2026-11-08; `W-nn` = lavoro di metodo da fare.
Niente di questo elenco è stato implementato: serve codice e passa da
`training-quality` e `release-gate`.

## Bloccanti per l'uso pubblico

| id | cosa | dove | chi |
|---|---|---|---|
| D-01 | `excludeFromReview` non è letto da nessuno: la finitura metabolica entra nella revisione e può produrre `aggiungi-peso` su uno swing e `range-da-rifare` con un testo falso | `src/engine/review.ts` | sessione principale |
| D-02 | Nessun tetto agli aumenti: tre salite di gradino in 7 giorni sono accettabili | `progression.ts` + `review.ts` + `suggestions` | sessione principale |
| W-01 | Limiti L1, L2, L13, L11, L12 di BOUNDARIES.md: screening, dolore, sintomi gravi, minorenni, test di non-regressione sul testo dell'atleta | onboarding, player, settings | sessione principale |
| W-02 | Campi mancanti nella scheda esercizio: `equipment`, `minLevel`, `prerequisites`, `sites`, `contraindications`, `execution`, `commonErrors`, `frames` | `src/types/exercise.ts`, `src/data/exercises.ts` | training-designer + sessione principale |

## Alti

| id | cosa | dove |
|---|---|---|
| D-03 | La revisione propone `sali-di-livello` anche con il tempo non rispettato; la fine seduta no | `src/engine/review.ts` |
| D-04 | Deload e ritest importati dal programma archiviato; `RETEST_BANNER` promette un ricalcolo impossibile nei circuiti | `src/engine/schedule.ts`, `src/data/program.ts` |
| W-03 | Regola di sostituzione per attrezzo mancante (PROGRAM_RULES §6): oggi 5 blocchi su 48 hanno un'alternativa, tutti e cinque nella finitura | `src/data/circuit.ts` |
| W-04 | Verdetto `stallo` e `rifai-al-tempo-giusto` (PROGRESS_REVIEW §4, PROGRESSION_RULES T3) | `src/engine/review.ts` |

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
