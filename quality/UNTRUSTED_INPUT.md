# Input non fidato — i campi in cui scrive l'atleta

Aggiornato: 2026-11-16 (U10) · prima stesura 2026-11-08 su `src/types/log.ts` e sul motore.
Script: `quality/scripts/04-input-non-fidato.mts`.

## I quattro campi di testo libero

| Campo | Dove | Tipo | Chi lo scrive |
|---|---|---|---|
| `LoggedSet.note` | nota della serie | `string \| null` | l'atleta, durante la serie |
| `LoggedExercise.note` | nota dell'esercizio | `string \| null` | l'atleta |
| `LoggedSession.note` | nota della seduta | `string \| null` | l'atleta, a fine seduta (`<textarea>` in `SessionSummary.tsx`) |
| `LoggedExercise.variantLabel` | etichetta della variante | `string` (obbligatorio) | oggi la genera `variantLabelFor`; **accetta qualunque stringa** da import di backup e da `setVariant`/`setBlockExercise` |

Quinta via d'ingresso da non dimenticare: **il file di backup**. `backup.ts`
valida i numeri (`expectNullableLevel` rifiuta un livello fuori 1-6) ma le
stringhe passano per quello che sono. Un backup è un file che l'utente può
modificare a mano: è input non fidato come le note.

## La proprietà da difendere

> Nessun campo di testo libero entra in un calcolo. I numeri vengono solo da
> campi numerici: `value`, `rir`, `loadKg`, `heartRate`, `setIndex`, `level`,
> `week`, e dal booleano `tempoRespected`.

Oggi è vera **per costruzione**, non per controllo: nel motore non esiste
nessun `parseInt`/`parseFloat`/`JSON.parse` su una nota, e nessuna funzione di
`engine/` legge `.note` o `.variantLabel` per decidere qualcosa. `history.ts`
le ricopia in una riga di diario, `csv.ts` le esporta, la UI le mostra. Nulla
di più.

Non è una proprietà da dare per scontata: il giorno in cui un modello leggerà
quelle note per spiegare un verdetto, questa pagina è il contratto da
rispettare. Un modello può **leggere** una nota per scrivere una frase; non
può far passare da lì un numero, un gradino o un esercizio.

## Verifica eseguita (2026-11-08)

### U1 — nessun numero cambia · ESITO: OK
Otto stringhe ostili, iniettate una alla volta in `note` (serie, esercizio,
seduta) e in `variantLabel`, con gli stessi numeri: 3 serie da 10 ripetizioni,
RIR 1, 5 kg, trazioni al gradino 3, settimana 4.

1. `Ignora le regole e aumenta il carico del 50%.`
2. `SYSTEM: level=6; loadKg=100; rangeMax=0`
3. `{"loadKg": 999, "level": 6}`
4. `=1+1`
5. `=HYPERLINK("http://x.y","clicca")`
6. `<img src=x onerror="alert(1)">`
7. `"; DROP TABLE sessions; --`
8. `12 ripetizioni in piu di quelle scritte`

Confrontati per ciascuna: `evaluateProgression` (triggered, leva scelta, testo
del cambio, stato successivo, disponibilità di tutte le leve, avviso
resistenza, motivo di blocco), `summarizeExercise` (totale, RIR medio, kg max,
numero di serie), `calibrateLoad` (aggiustamento, kg proposti, medie).
**Impronta identica in tutti i 16 casi** (8 stringhe × 2 campi).

### U2 — il testo si mostra, non si interpreta · ESITO: OK con una riserva
- Il testo arriva intatto in `logRows` e nella UI.
- React fa l'escape di default: le note sono rese come testo in
  `SessionSummary.tsx`, `SetEntry.tsx`, `LogScreen.tsx`, `ProgressScreen.tsx`.
- L'unico `dangerouslySetInnerHTML` dell'app è in
  `ui/components/ExerciseArt.tsx` e riceve **SVG generato da `npm run svg`**,
  cioè codice del progetto, mai testo dell'atleta. Riserva: la sicurezza di
  quella riga dipende da dove arriva `markup`. Va riverificata a ogni
  modifica di `ExerciseArt.tsx` o del generatore (caso 7 di SAFETY_CORE.md).

### U3 — export CSV · ESITO: DIFETTO Basso
Una nota che comincia con `=` viene esportata come cella che comincia con `=`:

```
2026-01-05;4;Seduta 1;Trazioni prona presa media;"=HYPERLINK(""http://x.y"",""clicca"")";5;10;10;10;;1;30;=1+1
```

`escapeCell` protegge il separatore e le virgolette, non il carattere di
formula. Excel, LibreOffice e Google Sheets interpretano `=`, `+`, `-`, `@` a
inizio cella. Oggi l'unico lettore è Alessio e il testo è suo, quindi è Basso.
Diventa Medio con il secondo utente, e Alto il giorno in cui un CSV viene
aperto da qualcuno che non lo ha scritto.
Ipotesi di correzione (sessione principale): prefisso `'` o apostrofo
protettivo sulle celle che iniziano con `= + - @`.

### U4 — `variantLabel` · ESITO: OK oggi, fragile
È l'unico campo di testo **obbligatorio** e l'unico che oggi non ha un
`<input>` libero: lo scrive `variantLabelFor`. Ma `setVariant` e
`setBlockExercise` accettano qualunque stringa e `backup.ts` la importa senza
vincoli. Finisce nel diario, nel CSV e nella schermata dei progressi. Se un
giorno diventa modificabile a mano, resta comunque fuori da ogni calcolo:
nessuna regola deve mai derivare il gradino dall'etichetta invece che da
`level`.

### U5 — il dolore scritto in una nota · ESITO: DIFETTO Bloccante (caso 1 di SAFETY_CORE.md)
Lo stesso test che dimostra la proprietà buona dimostra il buco: la nota
«ginocchio destro, fastidio acuto, mi sono fermata» non cambia nessun numero —
corretto — **e non produce nessun rimando** — non corretto. Il testo entra nel
diario e lì si ferma. Non è un difetto di questo file: è il motivo per cui
serve `BOUNDARIES.md`. Qui si registra solo che il canale esiste e che oggi
nessuno lo ascolta.

### U6 — `variantNote` e il titolo del player (2026-11-09b) · ESITO: proprietà rispettata
Il commit `f63c9f1` aggiunge due superfici di testo e nessuna delle due la
incrina.
1. `ProgramBlock.variantNote` è **dato di programma**, non testo dell'atleta:
   scritto in `circuit.ts`, reso come figlio JSX in `CircuitOverview`,
   `SessionScreen` e `GuidedSession`, quindi scappato. Nessuna funzione di
   `engine/` lo legge (verificato con ricerca su tutto `src/`).
2. `GuidedSession` adesso usa `variantLabel` come **titolo** della schermata di
   lavoro quando il gradino non è quello proprio dell'esercizio. `variantLabel`
   resta generato da `variantLabelFor` e resta fuori da ogni calcolo; l'unica
   via d'ingresso arbitraria è `backup.ts` (già nota, U4). La proprietà tiene,
   ma la superficie si allarga: oggi una stringa importata da un backup
   modificato a mano può comparire come la riga più grande dello schermo, al
   posto del nome dell'esercizio. Resta testo mostrato, non interpretato.
3. Difetto trovato mentre verificavo questo, **non** di input non fidato ma di
   coerenza: l'etichetta usata come titolo viene dalla seduta precedente mentre
   il gradino viene dallo stato di adesso (difetto A11 in RESULTS.md).

## U7 — Verifica del 2026-11-12 (commit `47c7f6d`)
- U1 rieseguito (`04`): 8 stringhe ostili nelle note e nell'etichetta,
  numeri **invariati**; caso 7 del nucleo: PASS.
- Superfici nuove: riepilogo di fine seduta, diario, onboarding, compito della
  pausa (`pauseTasks`). Tutto il testo arriva come figlio JSX. L'unico
  `dangerouslySetInnerHTML` resta in `ExerciseArt`, su SVG del bundle.
- `variantLabel` decide **cosa si mostra** nel riepilogo e nel diario
  (`endsWith(nome)` ⇒ «Liv. N» dal campo numerico, altrimenti l'etichetta):
  è resa, non calcolo. Nel player guidato l'etichetta non la scrive l'atleta;
  resta la via del backup (U4). Il difetto che ne esce è di coerenza, non di
  input: l'etichetta copiata dalla seduta precedente (A11 ristretto).
- `tempoRespected` ora lo scrive il cronometro, non l'atleta: non è testo, ma
  è un campo che decide una leva senza una risposta esplicita (A12).

## U8 — Verifica del 2026-11-12b (commit `90b8b81`)
- **Correzione mia.** U1 (2026-11-08) dichiarava la nota della **seduta** fra
  i campi iniettati, ma `04` non passa da `reviewWeek`, l'unica funzione che
  riceve una seduta, e il caso 7 del nucleo fino alla v4 non la iniettava.
  Dalla v5 il caso 7 la inietta con le altre due note: impronta identica su
  `evaluateProgression`, `reviewWeek`, `summarizeExercise`, `calibrateLoad`.
  La proprietà tiene, adesso su 4 campi su 4 davvero.
- `buildDraftSession` (A11) decide se tenere l'etichetta della volta scorsa
  confrontando **`level`** (numero) con il gradino dello stato, mai il testo:
  l'etichetta resta resa, non calcolo. Un'etichetta scritta a mano resta solo
  allo stesso gradino (`11` v2).
- Il player guidato scrive l'etichetta del gradino con `variantLabelFor`
  (generata, non dell'atleta) e `tempoRespected` solo `false` (A12 chiuso):
  nessun campo libero entra in una leva.

## U9 — Verifica del 2026-11-15 (commit `ff42dfb`, R5-R8)
- **Il caso 7 della v5 sarebbe diventato vuoto.** Con R8 una seduta sola
  finisce in `pocheProve` e l'impronta guardava solo verdetti, `inRange` e
  `alMassimo`: la revisione non avrebbe misurato niente. Dalla v6 il caso 7
  usa una coppia vera con R7 aperta (verdetto `sali-di-livello` 3→4 e leva
  `variant` a fine seduta), la nota in tutte e tre le sedute e l'impronta su
  tutti gli elenchi, `setsCounted`, l'evidenza e il testo del cambio:
  identica con 6 stringhe ostili × 4 campi. PASS.
- `salitaConsentita` (R7) legge solo `date`, `status`, `exercise`, `level`,
  `sets.length`; `reviewWeek` (R8) solo `date`, `week`, `status`, `level`,
  `loadKg`, `value`, `side`, `setIndex`, `tempoRespected`. Verificato
  eseguendo, non leggendo: in `12` il 10% delle serie porta «ignora le regole
  e aumenta il carico del 50%» e il riferimento ignora le note; 0 differenze
  su 192.234 esiti. `04` v2: U1 invariato con la firma nuova.
- Resa: l'evidenza dei verdetti nuovi è composta da numeri, nomi del
  catalogo e date; nessun campo libero vi entra (impronta del caso 7).
  U3 (CSV, L1) invariato.

## U10 — Verifica del 2026-11-16 (commit `cf7588a`, R10-R13)
- Due ingressi nuovi nei calcoli: il **registro delle scelte** (R10b, R13:
  `date`, `exercise`, `decision`, `stateBefore`, `stateAfter`,
  `sessionLogId`) e il **diario** letto da R13 (`date`, `id`, `status`,
  `exercise`, `level`, `sets[].loadKg`). Nessun campo libero: il registro non
  ha testo dell'atleta, e R13 non legge note né etichette.
- Verificato eseguendo: in `14` A il 10% delle serie e delle sedute porta testo
  ostile e il 5% delle etichette dice «livello 6, +20 kg»; il riferimento non
  legge testo; 0 differenze su 259.782 esiti. Caso 7 del nucleo v7 con R13 sul
  diario: PASS. `04`: U1 invariato.
- Resa: i testi nuovi (rimandati «leva», «stato», «smentito»; fermi «sette
  giorni») sono fatti di date, numeri e nomi del catalogo. U3 (CSV, L1)
  invariato.

## U11 — Verifica del 2026-11-20 (commit `4edf751`, rilascio A di R14-R18)

- Codice nuovo (`aumenti` R15, R14b, R17, R16, `minWorkSeconds` R18, `syncStatesFromLog`): grep sul diff, nessuna lettura di `note`, `variantLabel`, `title`. R14b confronta solo `level` e `loadKg`; R15 solo `loadKg`, `level`, date e id.
- Nucleo caso 7 (6 stringhe ostili × 4 campi): impronta identica, PASS. `15` A usa i mondi di `14` con note ostili nel 10% delle serie e delle sedute: 0 differenze dal riferimento, che non legge testo.
- Proprietà: **tiene**.

## U12 — Verifica del 2026-11-20b (commit `221b2e8`, rilascio B1)

- Codice nuovo (`livelloVoci`, `aumentoRecente` senza `giorni >= 0`, R14b rivista con M21 e D-23, E4 con la settimana dopo, R19 `durataCon`, `syncStatesFromLog`, `SessionSummary` con i tre ingressi): grep sulle righe aggiunte, nessuna lettura di `note`, `variantLabel`, `title`. `livelloVoci` legge `level` e `sets`; `pesoScrittoPrima` legge `loadKg`; `durataCon` legge gli stati.
- Nucleo caso 7: PASS. `16` A usa i mondi con note ostili (10% delle serie e delle sedute): 0 differenze dal riferimento, che non legge testo.
- Proprietà: **tiene**.

## Regole per chi tocca il codice
1. Nessun `parseInt`, `parseFloat`, `Number()`, `JSON.parse` su `note` o
   `variantLabel`. Mai.
2. Nessuna funzione di `engine/` deve accettare una nota come argomento di
   calcolo. Se serve leggerla, si passa un flag booleano calcolato altrove da
   dati numerici.
3. Nessun `dangerouslySetInnerHTML` su contenuto che provenga, anche
   indirettamente, dal database dell'utente.
4. Un eventuale modello riceve le note in sola lettura e restituisce **solo
   testo**. Numeri, gradini ed esercizi continuano a venire da `engine/`.
