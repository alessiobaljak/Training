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
| P-11 | **Alessio, 2026-11-16**: GO al push di R5-R8 (eccezione «non peggiorati» estesa agli Alti A10, A16, A17); A17, M17 e L15 al giro di training-designer insieme a D-4; confermate la composizione dei criteri v2 e la lettura di S1 sui gradini eseguibili. In produzione `a747e09`. | `docs/SESSION_STATE.md` |
| D-16 | **Decisa da Alessio il 2026-11-15** (alternativa): per un verdetto della revisione contano le ultime 2 sedute chiuse dell'esercizio allo stesso gradino e carico, entrambe negli ultimi 14 giorni, non la settimana di calendario. S4 non si allenta (≥ 2 sedute, ≥ 3 serie vere). Finestra ancorata alla fine della settimana rivista. training-quality: lettura di S4 OK (2026-11-15), riserva L15 ⇒ R12. | PROGRESS_REVIEW §6, rapporto `reports/2026-11-15-training.md` |

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

**D-4 · Un aumento per esercizio ogni 7 giorni (R13b).** *S1-S10 approvate il
2026-11-12.* La parte sul carico è S2 e la propongo subito (R13a, 7 giorni
mobili: oggi S2 vale solo per proposta). Da decidere l'estensione: (a)
**raccomandata** un aumento di qualunque leva, gradino compreso (al massimo 7
giorni di attesa su un gradino); (b) alla lettera: tempo, pausa, carico; (c) no.
Non chiude A17 da sola: lo chiude R10 (PROGRESSION §10, rapporto 2026-11-16).

**D-19 · Il manubrio successivo è una leva? (2026-11-16)** Oggi fine seduta dice
no, revisione propone +2,5 kg. Il metodo scritto (`LoadPolicy`, catalogo) dice
no ⇒ correggo la revisione (R10c-0, «leve finite» dopo tempo e pausa). Proposta
**raccomandata** (R10c-1): leva 5 come la zavorra, solo dopo tempo e pausa, da
settimana 3, cancello R5, R13a, **tetto** +2,5 kg e non bersaglio, tempo e pausa
tornano alla scheda. Se sì: elenco (proposti curl ×4, military press, rematore a
un braccio, alzate laterali, croci; fuori le kettlebell; goblet squat, stacco
rumeno, estensione tricipiti: manubri o kettlebell?) e fuori chi ha salti > 2,5
kg. Sotto-domanda: cambio di manubrio a mano ⇒ tempo e pausa alla scheda?

**D-17 · Settimana del programma dopo una pausa (M6).** Il numero di settimana
è di calendario: chi si ferma 3 settimane in settimana 3 rientra in settimana 6,
e lo scarico di calendario cade sulle sedute già ridotte di R9 (si dimezza una
volta sola: lo scarico vero va perso). Sposti la data di inizio della durata
della pausa, o resta il calendario? *Da D-16 (2026-11-15)*: se sposti la data,
R8 legge la finestra sulle date e «chi compare» su `session.week`: va deciso
anche se il `week` delle sedute passate si riscrive, o resta quello di allora.

**D-18 · R9b, effetto del ritest.** Il ritest di rientro può proporre di
**scendere** di gradino (mai salire) dove R1 dice che il massimale non regge il
range. Lo vuoi? E lo stesso ai ritest di settimana 6 e 12 (chiuderebbe M16)?

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
