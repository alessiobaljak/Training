# DECISIONS.md

Due elenchi: le decisioni già prese (dal codice e dalla sessione principale) e
quelle che spettano ad Alessio e bloccano il lavoro.

## Già prese

| # | decisione | dove sta scritta |
|---|---|---|
| P-1 | I numeri li decidono regole deterministiche. Nessuna AI nel prodotto. | `CLAUDE.md`, `docs/SESSION_STATE.md` |
| P-2 | Programma attivo: 4 circuiti senza giorni. Shadow archiviato, si legge solo nel diario. | `src/data/circuit.ts`, `src/data/sessions.ts` |
| P-3 | Range fissi nei circuiti, non derivati dal test: quello che si sposta è il gradino. | `src/data/circuit.ts`, commento di testa |
| P-4 | Un titolo, un esercizio. Varianti nei gradini o in `alternatives`. | `src/types/exercise.ts`, test |
| P-5 | Livello di partenza = minore tra gradino prescritto e gradino misurato dal test. **Da sostituire con R1** (PROGRAM_RULES §3, proposta 2026-11-12). | `startingLevel`, `src/engine/progression.ts` |
| P-6 | Il livello è dell'esercizio, non dell'atleta. L'onboarding non calcola nulla. | `STARTING_LEVEL_POLICY` |
| P-7 | Ogni deviazione dalla scheda originale si dichiara, con il motivo. | `src/data/deviations.ts` |
| P-8 | Solo immagini approvate, nel bundle. Nessuna generazione in produzione. | `CLAUDE.md` |
| P-9 | Nessun URL di video nel codice: solo `videoQuery`. | `check:no-video-urls` |
| P-10 | La schermata delle misure non ha obiettivi di peso né azioni suggerite. | `src/ui/screens/MeasuresScreen.tsx` |

## Da decidere — spettano ad Alessio

**D-1 · Obiettivi supportati.** Oggi il metodo ne serve uno solo, non
dichiarato: ipertrofia e forza a corpo libero con richiami metabolici.
Si dichiara questo e basta, o si aprono anche calisthenics skill-oriented,
condizionamento, forza con bilanciere? Ogni obiettivo in più è un insieme di
scale, test, range e limiti da scrivere, non una voce di menu.

**D-2 · Attrezzature supportate.** Elenco chiuso da fissare prima di scrivere
`equipment` nella scheda esercizio. Proposta: corpo libero, sbarra, anelli, TRX,
elastici, cintura per zavorra, manubri, kettlebell, corda da battaglia, panca,
box, ruota ab. Fuori per ora: bilanciere e macchine — il metodo non ha né scale
né soglie per loro, e dichiararli supportati senza averle sarebbe falso.

**D-3 · Livello dell'atleta.** Si introduce il livello globale di METHOD §9
(principiante/intermedio/avanzato con mediana dei gradini), usato **solo** per
decidere cosa l'app ha diritto di proporre? Senza, il limite L8 non è esprimibile.

**D-4 · Soglie di progressione.** Confermi i cinque tetti mancanti di
PROGRESSION_RULES §6 così come sono scritti: 1 aumento per esercizio ogni 7
giorni, 1 gradino alla volta, +2,5 kg a settimana, nessuna salita senza tempo
confermato, nessun aumento al rientro da ≥ 21 giorni?

**D-5 · Questionario di idoneità.** PAR-Q+ nella sua forma standard, o una
versione corta a sette domande? E: resta saltabile per te, con la scelta
registrata, o vale per tutti dal primo giorno?

**D-6 · Risorse di supporto per L7.** Quali enti, per quale paese, verificati
quando. Non ho scritto nessun numero: inventarne uno in quella schermata farebbe
più danno del silenzio. Serve la tua riga, con data della verifica.

**D-7 · Numero di emergenza per L13.** Dipende dal paese. Serve un campo «paese»
nelle impostazioni, o si mostra un testo senza numero («chiama il numero di
emergenza del posto dove sei»)?

**D-8 · Minorenni.** Confermi: non destinata a chi ha meno di 18 anni, con
dichiarazione di età all'onboarding e programma non generabile sotto quella
soglia?

**D-9 · Lingue.** Oggi tutto è in italiano, nel codice e nei dati. Si resta
monolingua — e allora il paese di D-7 è una scelta ristretta — o si prevede
l'estrazione dei testi? I testi dei consigli nascono dentro il motore
(`progression.ts`, `review.ts`): tradurli richiede di separarli, ed è un lavoro
che costa più se fatto dopo.

**D-10 · Deload e ritest sotto il programma attivo.** Il calendario 6/12/18
viene dal programma archiviato e il banner del ritest promette un ricalcolo dei
range che nei circuiti non può avvenire (ADVICE D-04). Si tiene il calendario
scollegato dal programma, o il deload diventa un dato del programma attivo?

**D-12 · Scambio di stazioni nella finitura (2026-11-12).** Con R2 la
giunzione ha 15", ma in S1 si passa ancora da suitcase carry a swing e in S3 da
hollow hold a cedimento a swing. Raccomando di scambiare S1 F1↔F3 (swing ↔ step
rapidi) e S3 F1↔F2 (swing ↔ mountain climber): costo zero sull'orologio. Cambia
l'ordine della trascrizione: decidi tu. E la scheda originale aveva una pausa
non scritta alla giunzione?

**D-13 · Gruppi prioritari e fasce (2026-11-12).** Confermi braccia, dorsali e
core prioritari (16-20 per muscolo, braccia 32-40) e gli altri in mantenimento
(≥ 6)? Polpacci restano a 0 per scelta della scheda?

**D-14 · Regole di ordinamento violate dalla trascrizione.** «Mai due stazioni
di presa consecutive» è violata in S1 (B1-B3 e finitura): la tieni come regola
per blocchi futuri con eccezioni nominate, o la ritiri?

**D-15 · Push-up S3 A2.** La nota della scheda dice declinati (gradino 3); con
R1 si parte al massimo dal gradino del test (2) e si sale alla prima settimana
con tutte le serie sopra 18. Ti va bene, o vuoi un gradino prescritto per
blocco che permetta di partire dal 3?

**D-11 · Testi che parlano della forma del corpo.** Due `variantNote` collegano
un esercizio alla silhouette e alla «vita sottile» (ADVICE D-06). Li riscrivo in
termini di funzione, o restano come sono finché l'utente sei solo tu?
