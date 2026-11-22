# BACKLOG.md

Ordinato per rischio, non per fatica. `D-nn` = difetto trovato nell'audit del
2026-11-08; `W-nn` = lavoro di metodo da fare.
Ogni voce serve codice e passa da `training-quality` e `release-gate`. Chiuse
o assorbite: `ARCHIVE.md`.

## Bloccanti oggi (decisione di Alessio, 2026-11-12)

W-19…W-22 (R5-R8) chiusi in codice, in produzione `a747e09`: `ARCHIVE.md`.

| id | cosa | dove | chi |
|---|---|---|---|
| W-23 | R9 rientro con R9a rev. «prima i test» (T-32), resto di T-33 (giorno di test, testi dei ritest, M16), R22 settimane (T-31) — M4, D-04, M16. R9b e R9c in produzione `22f3d31` | `rotation.ts`, `schedule.ts`, `rest.ts`, `circuit.ts`, `HomeScreen`, `OnboardingScreen` | sessione principale |
| W-51 | **T-37** rematore S2 A3 agli anelli: nomi, cue, gradini 1-2-3-5, test, deviazioni; figura TRX fuori nello stesso commit (rapporto 11-21c §2) | `exercises.ts`, `progressions.ts`, `tests.ts`, `deviations.ts`, `exercise-art.ts` | sessione principale + exercise-media-lead |
| W-52 | **T-38** R23 zavorra a 0 a ogni cambio di gradino (L43, L14, L42) · **T-39** `testAllaData` `<` con ripiego · **T-40** prova 21.14 (Z1 al via) · **T-41** `videoQuery` apertura anche | `review.ts`, `ritest.ts`, `progression.ts`, `VariantPicker`, `repository.ts`, test | sessione principale |
| W-55 | **T-42…T-48** verticale S3 H1 (R24, R25, R1 riga 3 rev., L15, catalogo), **in un push solo**, dopo D-24…D-26 e training-quality (rapporto 11-22) | `circuit.ts`, `deviations.ts`, `exercises.ts`, `progressions.ts`, `review.ts`, `progression.ts`, `GuidedSession`, `VariantPicker`, impostazioni | sessione principale + exercise-media-lead (figura 5.1) |
| W-56 | **T-49** nessuna salita a un gradino con un'altra misura (hollow hold S3 B3 → hanging knee raise a 30-45″), Medio latente | `progressions.ts`, `progression.ts`, `review.ts`, `VariantPicker` | sessione principale |

W-24…W-31 (giro 2026-11-16, R10-R13): in produzione `fe85203`, `ARCHIVE.md`.

## Rilascio B e dopo (spec: rapporti 2026-11-18, 2026-11-20, 2026-11-21)

W-32…W-37, W-39…W-44 in produzione (`6cbb759`, rilascio C; W-37, W-43, W-44 da
chiudere in `ARCHIVE.md` dopo conferma di quality). Attesi dai rapporti, non dal codice.

| id | cosa | dove | gravità (quality) |
|---|---|---|---|
| W-48 | **T-34** `LEVA_MANUBRIO` + goblet, stacco rumeno, estensione tricipiti; `DEVIAZIONI_VARIANTE` (S1 B2, S2 A2); consiglio dello swing tecnico senza il 16 | `method.ts`, `circuit.ts`, `deviations.ts` | — |
| W-49 | **T-35** L27, L28, L29, L30 (a), L31 · **T-36** L32 testi di `range-da-rifare` a range fisso | `SessionSummary`, `decadenza.ts`, `review.ts` | Bassi |

## Bloccanti per l'uso pubblico

| id | cosa | dove | chi |
|---|---|---|---|
| W-14 | R1 gradino di partenza (B5 di quality) + `eccentricOnly` + `variantNoteLevel` + nome gradino 1 trazione verticale — spec: rapporto 2026-11-12. In codice in gran parte (2026-11-14); il nome del gradino 1 è ancora «Trazioni assistite» | `progression.ts`, `progressions.ts`, `circuit.ts` | sessione principale |
| W-01 | Limiti L1, L2, L13, L11, L12 di BOUNDARIES.md: screening, dolore, sintomi gravi, minorenni, test di non-regressione sul testo dell'atleta | onboarding, player, settings | sessione principale |
| W-45 | `MANUBRI_KG` diventa l'elenco dei manubri dell'atleta (attrezzatura dichiarata, L8, D-2); il motore lo riceve già come parametro | impostazioni, onboarding, `backup.ts` | sessione principale |
| W-02 | Campi mancanti nella scheda esercizio: `equipment`, `minLevel`, `prerequisites`, `sites`, `contraindications`, `execution`, `commonErrors`, `frames` | `src/types/exercise.ts`, `src/data/exercises.ts` | training-designer + sessione principale |
| W-53 | Schede delle figure generate: pilota fatto (rapporto 11-21c §5.1-5.5); poi `vertical-pull-l1`, `dip-l1`, `horizontal-pull-l1`…`l6`, poi i 31 di §5.6 in ordine. Prima, domande del media lead 2, 3, 4, 5 (b, c) e 6 del 2026-11-21 | rapporti, `exercise-art.ts` | training-designer → exercise-media-lead |

## Alti

| id | cosa | dove |
|---|---|---|
| D-04 | Deload e ritest importati dal programma archiviato; `RETEST_BANNER` promette un ricalcolo impossibile nei circuiti. Testo: T-33 (rapporto 11-21b); l'importazione resta (D-10) | `src/engine/schedule.ts`, `src/data/program.ts` |
| W-03 | Regola di sostituzione per attrezzo mancante (PROGRAM_RULES §6): oggi 5 blocchi su 48 hanno un'alternativa, tutti e cinque nella finitura | `src/data/circuit.ts` |
| W-16 | R3 volume: una funzione sola, F e Z fuori, fasce per gruppo, Progressi fatte/previste/fascia (A7, M10) | `metrics.ts`, `ProgressScreen.tsx` |
| W-17 | R4 test richiesti calcolati (7), «non eseguito» al posto di 0 | `tests.ts`, `OnboardingScreen.tsx` |
| W-04 | Verdetto `stallo` (PROGRESS_REVIEW §4); `rifai-al-tempo-giusto` è passato a W-20 | `src/engine/review.ts` |

## Medi

| id | cosa |
|---|---|
| D-05 | `reviewWeek` mescola serie di blocchi con range diversi sullo stesso slug: latente oggi. Lo chiude R8 rev. 2026-11-15 (stesso range nella coppia) quando W-19 è in codice |
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
| W-10 | Il titolo di `aggiungi-peso` dice «passa al manubrio successivo» anche sulla kettlebell (salti di 4 kg). **Assorbito da W-26** (R10c-0); con R10c-1 kettlebell fuori dall'elenco |
| W-11 | `SESSIONS_PER_WEEK` in `ProgressScreen.tsx` è corretto (4) ma il commento sopra dice «sei»: denominatore dell'aderenza, vale la pena che il commento non menta |
| W-13 | Il riscaldamento non è saltabile dall'app quando la seduta ha un blocco a RIR 0-1 o una stazione balistica (METHOD §7) |
| W-54 | Hip thrust e bulgaro al gradino 6: +2,5 kg non si fa con le kettlebell (residuo B6, da W-50) |
