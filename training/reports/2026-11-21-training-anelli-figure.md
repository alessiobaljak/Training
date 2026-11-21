# training-designer — 2026-11-21c — D-Q3 (a), rematore agli anelli, L43, `testAllaData`, schede delle figure

Fonti lette: `quality/reports/2026-11-21-quality-644bd8c.md` (domande 3 e 5, L41-L43),
`2026-11-21-quality-4d06a4b.md` (D-Q3, deviazione di Z1), la mia specifica
`2026-11-21-training-b9-b10-m4.md` §2; nel codice `data/exercises.ts`, `progressions.ts`,
`tests.ts`, `circuit.ts`, `deviations.ts`, `exercise-art.ts`, `engine/media.ts`, `review.ts` (r. 583-597,
726-741), `ritest.ts` (r. 111), `loading.ts` (B14), `db/repository.ts` (r. 57-63), `types/log.ts`.
`src/` non toccato.

### Riepilogo

| # | richiesta | esito | task |
|---|---|---|---|
| 1 | D-Q3 = (a) | **R21 rev.**: S7 sui blocchi `recordActual` si legge «nessuna dose sopra il misurato», con sei condizioni verificabili per il controllo 2c. Z1 parte solo al «Via», anche quando ci si arriva avanzando | T-40 (solo un test) |
| 2 | Rematore S2 A3 agli anelli | **Basta un nome nuovo con lo stesso slug.** Nessuna migrazione. Nome «Rematore inverso», senza attrezzo, perché si legge anche sulle sedute fatte al TRX; l'attrezzo va nei gradini, nei cue, nella nota del test. Scala della trazione orizzontale tutta agli anelli; test agli anelli a 45° con la presa della seduta; varianti archiviate senza «TRX». La figura TRX esce nello stesso commit | T-37 |
| 3 | L43 | **(a) confermata ed estesa: R23.** Ogni cambio di gradino porta la zavorra a 0: in discesa (com'è), in salita (L14) e a mano (L42). Un testo solo, vero in tutti i casi | T-38 |
| 4 | `testAllaData` | **`<`, con un ripiego**: l'ultimo risultato prima del giorno della seduta; se non ce n'è nessuno, quello dello stesso giorno | T-39 |
| 5 | Schede delle figure | Pilota completo (4 schede) più il rematore agli anelli, perché T-37 gli toglie la figura. Elenco ordinato degli altri 31 | — |

Versioni: **programmi 2.5 · progressione 4.3 · consigli 4.3 · limiti 1.6**, tutte PROPOSTA.
Nessun limite allentato: R23 e la revisione di `testAllaData` stringono, D-Q3 (a) è una
lettura decisa da Alessio. Un compito in più, piccolo: T-41 (`videoQuery` dell'apertura
delle anche).

### Stato attuale del metodo (dall'ultima versione)

- **Produzione `22f3d31`** (rilascio F): R9b, R9c, B18. Prima il rilascio E (`4d06a4b`: R20,
  R21) e il D (`85d1dd8`: figure e T-28).
  - Restano da fare: T-31 R22, T-32 R9 rientro, il resto di T-33 (giorno di test, testi dei
    ritest, M16), T-34…T-36.
- **Z1.** R21 è in produzione: il player scrive il tempo vero, e Z1 parte al «Via». B9 resta
  aperto, ridotto, solo perché il controllo 2c non ha una lettura per il blocco escluso.
- **S2 A3**, `rematore-inverso-trx`. Il nome è «Rematore inverso TRX» e i cue parlano di
  maniglie e di «gomiti indietro lungo il busto». La nota del blocco dice invece «Agli anelli
  e con la presa larga: porta i gomiti verso l'esterno, non ai fianchi». La contraddizione
  c'era già prima della scelta di Alessio: il cue 3 e la nota prescrivono due gomiti diversi.
- **Scala `horizontal-pull`.** Tre gradini nominano il TRX (2, 3, 5). L'1 non dice l'angolo:
  «piedi a terra» vale per l'1, il 2 e il 3. Le figure dei gradini mostrano attrezzi diversi
  fra loro: sbarra all'1, SVG con «TRX» nel titolo al 2 e al 3.
- **B18.** `scendi-di-livello` e `riparti-dal-test` portano la zavorra a 0. `sali-di-livello`
  e la leva `variant` la tengono (L14), e il `VariantPicker` anche (L42).
- **`testAllaData`.** Usa `date ≤ ultima seduta`. Un `TestResult` non ha l'ora: l'id è
  `testId@date`.

### Modifiche proposte o fatte a regole, catalogo e consigli, con versione

#### 1 · D-Q3 (a): R21 rev. e S7 su Z1 `[programmi 2.5 · limiti 1.6]`

Alessio, 2026-11-21: «Dead hang va bene così».

**R21 rev.** (PROGRAM_RULES §4)
- Invariati: bersaglio 30″, tempo vero, gradino P = 2 (R1 riga 2), fuori dalla revisione.
- **«Finché la presa regge»** vuol dire fino al primo segno che la presa si apre, non fino a
  cedere: lo dice la nota «Se la presa sta per cedere prima del segnale, scendi sui piedi».
  Z1 non è una serie a cedimento.
- **Z1 parte solo al «Via»**, anche quando ci si arriva avanzando dalla finitura, cioè per la
  strada normale.
  - È la deviazione che quality ha accettato su `4d06a4b`: ora è regola.
  - Se un giorno arriva una regola generale del tipo «arrivati avanzando, la serie è già
    cominciata», non vale per i blocchi `recordActual`.
  - La protegge un test, non una frase: T-40.

**Lettura di S7 sui blocchi `recordActual`** (oggi Z1 dei quattro circuiti)

Su questi blocchi S7 vale come **«nessuna dose sopra il misurato»**. È rispettata se e solo
se, su ogni blocco `recordActual`, sono vere tutte e sei:
1. il gradino è P, mai sopra (oggi 2);
2. la prescrizione mostrata è «bersaglio <max>″, o finché la presa regge», senza «almeno» e
   senza un minimo da raggiungere;
3. il conto si ferma al bersaglio: nessun tempo oltre i 30″ viene chiesto o registrato;
4. la serie scritta è il tempo vero: «Ho mollato» (`floor`, almeno 1 s), «Sì, 30″», oppure il
   campo numerico 1-29. Mai il bersaglio scritto da solo, nessun campo di testo;
5. il tempo di Z1 non entra in R1, R9b, verdetti, volume, record e Progressi, e non diventa
   mai un `TestResult`;
6. la nota di sicurezza è visibile prima del «Via».

Su ogni altro blocco, escluso dalla revisione o no, S7 resta com'è: nessun gradino sopra
quello compatibile con il test (R1, R9b).

**Per training-quality, controllo 2c.**
- Sui blocchi `recordActual` controlla le condizioni 1-5. La 6 si verifica dal sorgente o nel
  browser.
- Sugli altri blocchi resta la lettura approvata («valore sotto il minimo del blocco»).
- Positivi che devono fallire:
  - Z1 al gradino 3;
  - Z1 con `autoComplete` vero;
  - un testo con «almeno»;
  - un `TestResult` scritto da Z1;
  - un blocco escluso senza `recordActual` con un test sotto il minimo.
- Con 2c riscritta così, B9 si chiude.

**Il rischio che resta, accettato da Alessio.** Chi regge 8″ fa ogni volta una tenuta fino al
primo cedimento della presa, a fine seduta, quattro volte a settimana. La nota lo ferma prima
che ceda. Nessuna regola legge il tempo di Z1, quindi da qui non nasce nessun numero.

#### 2 · Il rematore della Seduta 2 agli anelli `[programmi 2.5 · catalogo]`

Alessio: agli anelli. **Un nome nuovo con lo stesso slug mi basta.**
- Lo slug resta `rematore-inverso-trx`. Nessuna migrazione: lo stato salvato di Alessio
  (gradino, tempo, pausa) vale com'è.
- Il precedente c'è già: `dip-parallele-anelli` si chiama «Dip alle parallele». È lo stesso
  caso di W-09: lo slug mente sull'attrezzo, il resto dice il vero.

**Perché il nome non dice l'attrezzo.**
- Il nome dell'esercizio si legge dallo slug, anche sulle sedute già fatte al TRX.
- Il gradino invece si scrive nel diario seduta per seduta (`LoggedExercise.variantLabel`).
- Quindi l'attrezzo va dove si scrive giorno per giorno: nel nome del gradino, nella nota del
  blocco, nei cue e nella nota del test.
- Il diario dirà il vero sulle sedute vecchie e su quelle nuove:
  - vecchie: «Rematore inverso · Rematore TRX a 45°»;
  - nuove: «Rematore inverso · Rematore agli anelli a 45°».
- Con «Rematore inverso agli anelli» le sedute vecchie direbbero anelli senza esserlo state.

**Esercizio `rematore-inverso-trx`** (S2 A3 e test)
- Nome: **«Rematore inverso»**.
- Invariati: pattern, gradino 2, muscoli, `loadPolicy`, misura. Volume e Progressi non
  cambiano.
- Cue, testo esatto:
  1. «Agli anelli, un po’ più larghi delle spalle, presa prona: palmi rivolti verso i piedi. Corpo teso in linea dalle caviglie alla testa, talloni a terra.»
  2. «L’inclinazione decide la difficoltà: più orizzontale sei, più è dura. A braccia distese le cinghie stanno verticali.»
  3. «Tira con i gomiti larghi, a metà fra i fianchi e la linea delle spalle, e stringi le scapole. Gli anelli non si allargano e non oscillano.»
  4. «Errore tipico: bacino che cede verso il basso, che scarica il lavoro sulle braccia.»
  5. «Ripetizione valida: anelli all’altezza del petto con le scapole strette, ritorno a braccia distese senza perdere la linea.»
- `videoQuery`: `wide grip ring row proper form tutorial`.
- La nota del blocco A3 non cambia. È il testo della scheda, e ora è vera.

**Test `inverted-row-trx`: si fa agli anelli.**
- Il test misura il gradino su cui si lavora. R1 riga 8 confronta il valore con la soglia del
  blocco (10). Misurarlo al TRX con un'altra presa vorrebbe dire confrontare due varianti
  diverse (S7).
- Invariati:
  - l'id, perché i `TestResult` sono salvati con quell'id;
  - l'esercizio;
  - `testBaseline('horizontal-pull')`, che resta al gradino 2.
- Etichetta: **«Rematore inverso»**.
- Nota, testo esatto: «Agli anelli a 45°, con la presa larga della seduta. Conta solo le
  ripetizioni con il corpo in linea e gli anelli al petto.»
- R1 invariata: soglia 10; M ≥ 10 ⇒ 2; 0 < M < 10 ⇒ 1; M = 0 o nessun risultato ⇒ 1.
- I test già salvati, fatti al TRX, restano come sono.
  - Il primo ritest agli anelli può dare meno ripetizioni. R9b può solo proporre di scendere,
    e R9c non alza niente.
  - Nessuna regola confronta due test fra loro per decidere un numero.

**Scala `horizontal-pull`: una scala, un attrezzo.** Le figure dei gradini sono della scala,
non dell'esercizio: con due attrezzi nella stessa scala, una delle due figure sarebbe sempre
sbagliata.

| gradino | oggi | nuovo | definizione (figure ed `execution`) |
|---|---|---|---|
| 1 | Rematore inverso piedi a terra | **Rematore agli anelli a 60°** | corpo a circa 60° dal pavimento, talloni a terra, cinghie verticali a braccia distese |
| 2 | Rematore TRX a 45° | **Rematore agli anelli a 45°** | corpo a 45°, talloni a terra. È il gradino del test |
| 3 | Rematore TRX orizzontale | **Rematore agli anelli orizzontale** | corpo parallelo al pavimento a braccia distese, talloni a terra |
| 4 | Piedi rialzati + pausa 1" | invariato | corpo orizzontale con i piedi su un rialzo, pausa 1″ con gli anelli al petto |
| 5 | Rematore monobraccio TRX | **Rematore monobraccio agli anelli** | un anello solo, per lato; l'angolo lo fissa la scheda del gradino (prossimo giro) |
| 6 | Rematore monobraccio piedi rialzati | invariato | un anello solo, piedi rialzati, per lato |

- **Il gradino 1 cambia nome anche se non nomina il TRX.** «Piedi a terra» non dice cosa lo
  distingue dal 2. L'angolo è l'unica leva fra 1 e 3, e il cue 2 lo dice già. A 60° il carico
  sulle braccia è sensibilmente minore che a 45°, quindi il gradino resta una regressione vera.
  - Ci arriva chiunque abbia meno di 10 ripetizioni al test (R1).
- Il 4 e il 6 restano come li scrive la scheda: non nominano un attrezzo diverso.
- Invariati: `perSide`, `eccentricOnly`, numero e ordine dei gradini. Nessuna soglia cambia.

**Varianti archiviate** (Shadow: solo Libreria e diario)
- `rematore-inverso-trx-piedi-rialzati`:
  - nome «Rematore inverso piedi rialzati»;
  - cue 3: «Pausa di 1" con le mani alle costole, scapole strette.»;
  - resta in `FIGURE_SENZA_IMMAGINE`, con il motivo «La foto ha i piedi a terra; l’esercizio è a
    piedi rialzati.»
- `rematore-trx-monobraccio`:
  - nome «Rematore inverso monobraccio». Non «Rematore monobraccio», perché la Libreria ha già
    «Rematore con manubrio a un braccio»;
  - cue 1: «Una presa sola, piedi leggermente più larghi per stabilizzare.»;
  - `videoQuery`: `single arm inverted row proper form tutorial`.
- Slug invariati. Il nome perde l'attrezzo per la stessa ragione: il diario dello Shadow mostra
  sedute fatte al TRX.
- Le sedute archiviate non cambiano: né esercizi, né blocchi, né prescrizioni.
- Lasciarle «TRX» metterebbe sulla stessa schermata della Libreria (`ExerciseScreen` mostra i
  sei gradini con le loro figure) un esercizio al TRX e una scala agli anelli.

**Deviazioni** (`DEVIAZIONI`, P-7), scheda → app:
- «Rematore inverso TRX» → «Rematore inverso». Motivo, testo esatto: «Alessio, 2026-11-21: il
  rematore della Seduta 2 si fa agli anelli, come dice la nota della scheda («Agli anelli e con
  la presa larga»). Il nome non dice l’attrezzo perché vale anche per le sedute già fatte al
  TRX: l’attrezzo lo dicono il gradino, la nota e i cue.»
- «Rematore inverso TRX piedi rialzati» → «Rematore inverso piedi rialzati», e «Rematore TRX
  monobraccio» → «Rematore inverso monobraccio». Motivo: «La scala della trazione orizzontale è
  passata agli anelli (2026-11-21). Il nome perde «TRX» perché il diario mostra le sedute dello
  Shadow fatte al TRX.»
- Se i nomi dei gradini passano da un controllo di trascrizione, serve una voce per i gradini 1,
  2, 3 e 5. Motivo: «Una scala, un attrezzo: le figure dei gradini sono della scala, e la
  Seduta 2 è agli anelli. Il gradino 1 dice l’angolo, perché «piedi a terra» vale anche per il 2
  e il 3.»

**Figure: decide exercise-media-lead, io segnalo.**
- `rematore-inverso-trx` al gradino 2 mostra oggi una foto d'archivio con il TRX.
  - Nello stesso commit di T-37 va in `FIGURE_SENZA_IMMAGINE`, con il motivo «La foto mostra il
    TRX; l’esercizio è agli anelli.»
  - L'alternativa è una figura agli anelli già verificata dal media lead.
  - Meglio nessuna figura che l'attrezzo sbagliato.
- I gradini `horizontal-pull-l1`…`l6` vanno riverificati tutti per gli anelli.
  - L'1 oggi è una foto alla sbarra.
  - Il 2 e il 3 sono SVG con «TRX» nel titolo e nell'`aria-label`: vengono dai nomi, quindi
    `npm run svg` dopo T-37.
- La scheda del gradino 2 è al §5.5. Quelle degli altri gradini arrivano nel prossimo giro.

#### 3 · R23 — Un cambio di gradino porta la zavorra a 0 `[progressione 4.3 · consigli 4.3 · limiti 1.6]`

Risposta a L43 e alla domanda 3 di quality su `644bd8c`: **(a)**, estesa a L14 e L42.

**Regola.** Ogni cambio di gradino che l'app propone o esegue scrive `loadKg = 0`, insieme a
tempo e pausa a 0 (D-23). Vale per gli esercizi `loadPolicy: 'allowed'` con `loadKg > 0` prima
del cambio, su ogni via:
- `scendi-di-livello` (B18: già così);
- `riparti-dal-test` (R9b: già così);
- `sali-di-livello`, e la leva `variant` a fine seduta (L14: oggi tengono i kg);
- il gradino cambiato a mano nel `VariantPicker` (L42: oggi tiene i kg, mentre D-23 azzera già
  tempo e pausa).

Su `inherent` (manubri, kettlebell) il peso è l'esercizio, non una zavorra: R23 non lo tocca.
Oggi nessun esercizio `inherent` ha una scala.

**Perché (a) e non (b).**
- **S5**: la zavorra la propone il programma, e solo all'ultimo gradino (R6). Se l'app la tiene
  su un gradino nuovo, i kg scritti a mano diventano un numero prescritto dall'app. Vale anche in
  salita: per questo L14 si decide insieme.
- **(b) al 6** («la prima discesa toglie il carico») lascerebbe il gradino 6 a 0 kg.
  - «Trazioni zavorrate» senza zavorra sono le trazioni complete del gradino 3, e «Push-up
    zavorrati» senza zavorra sono i push-up a terra del 2.
  - Il gradino non sarebbe più quello che dice il suo nome, e la discesa sarebbe più lunga di
    quella al 5.
- **Nei circuiti non c'è una leva di carico in discesa.** B14 ha tolto la calibrazione −2,5 kg,
  per buone ragioni. Inventarne una per un caso raro aggiungerebbe una regola.
- **Il costo.** Con kg scritti a mano sotto il 6 si scende di un gradino e si toglie il carico
  insieme: due riduzioni, tutte e due nella direzione prudente. Il peso resta sempre scrivibile
  (`recordable`).

**Testi** (`consigli 4.3`). La clausola si aggiunge al «cambio» solo se prima del cambio
c'erano kg.
- Discesa con arrivo sotto il 6 (`scendi-di-livello`, `riparti-dal-test`): «Livello <L> → <g>.
  Tempo e pause tornano a quelli della scheda; la zavorra si toglie: sotto l’ultimo gradino il
  programma non la usa.»
  - Sostituisce «…; la zavorra si toglie, perché si mette solo all’ultimo gradino», che era vera
    solo per la zavorra proposta dall'app.
- Salita con arrivo sotto il 6 (`sali-di-livello`): «Livello <L> → <g>. Si riparte dal minimo
  del range, al tempo della scheda; la zavorra si toglie: sotto l’ultimo gradino il programma
  non la usa.»
- Salita al 6 con kg scritti: «…; la zavorra riparte da zero: all’ultimo gradino è il programma
  a proporla.»
- Leva `variant` a fine seduta: la clausola giusta fra le due, in coda al testo di oggi.
- A 0 kg: i testi di oggi, senza nessuna parola sulla zavorra.

#### 4 · `testAllaData` rev. `[programmi 2.5, R9c]`

Risposta alla domanda 5 di quality su `644bd8c`.

**Regola.** Si fissa lo stato di un esercizio alla chiusura, con «Archivia» o con la migrazione
di R9c; D è la data dell'ultima seduta che lo contiene. Per ogni test si usa:
- l'ultimo risultato con `date < D`;
- se non ce n'è nessuno, quello con `date = D`.

**Perché.**
- Un risultato non ha l'ora (`id = testId@date`). Se test e seduta cadono lo stesso giorno, non
  si sa quale è venuto prima.
- Se c'è un risultato precedente, quello dello stesso giorno è un ritest. I ritest seguono già
  due regole: R9c, mai una salita, e R9b, solo una proposta di discesa. Con `<` il ritest arriva
  dopo lo stato fissato e lo tratta R9b, come ogni altro ritest.
- Con `≤` succedono due cose sbagliate:
  - un ritest migliore fatto dopo la seduta fissa il gradino alzato, senza R5 né R7 (S1, S3: è
    il caso 4l c);
  - un ritest peggiore fatto dopo la seduta fissa una discesa che nessuno ha scelto.
- Con un `<` puro, chi ha fatto test d'ingresso e prima seduta nello stesso giorno avrebbe
  «nessun test», quindi il gradino 1 (R1 riga 6), anche con 8 trazioni. Il ripiego lo evita:
  senza un risultato precedente, quello del giorno è il test d'ingresso, e senza di lui il
  programma non si apriva (R4 punto 2).
- L'unico scarto dal gradino eseguito è un ritest peggiore fatto lo stesso giorno, prima della
  seduta.
  - Lo stato fissato è quello di prima del ritest, e R9b propone la discesa.
  - È lo stesso esito di un ritest peggiore fatto il giorno dopo.

#### 5 · Versioni

| famiglia | versione | cosa |
|---|---|---|
| programmi | 2.5 PROPOSTA | R21 rev. (S7 su Z1, partenza al via); scala `horizontal-pull` agli anelli e test agli anelli; `testAllaData` rev. |
| progressione | 4.3 PROPOSTA | R23. Stringe: nessuna soglia cambia, cambia l'effetto di tre vie su un campo, solo verso 0 |
| consigli | 4.3 PROPOSTA | clausola della zavorra (quattro testi); nomi del rematore |
| limiti | 1.6 PROPOSTA | S7 su Z1 (D-Q3 a); R23 in L9 |

### Da sviluppare (per la sessione principale): task con criteri di accettazione

Tutti toccano il metodo: training-quality, poi release-gate con dimensione **L**. Gli attesi
vengono da questo rapporto, non dal codice.
- **T-37** va in un commit unico con la modifica delle figure di exercise-media-lead (37.8).
- T-38, T-39, T-40 e T-41 sono indipendenti fra loro e dal resto (T-31…T-36).

**T-37 · Rematore agli anelli**
- File:
  - `data/exercises.ts` (tre esercizi);
  - `data/progressions.ts` (gradini 1, 2, 3, 5 e il commento di testa);
  - `data/tests.ts` (etichetta, nota, commento alla r. 137);
  - `data/deviations.ts`;
  - `data/exercise-art.ts`, con exercise-media-lead;
  - i test; poi `npm run svg`.
- Criteri:
  - **37.1** Slug invariati. Nomi esatti: «Rematore inverso», «Rematore inverso piedi rialzati»,
    «Rematore inverso monobraccio».
  - **37.2** Cue esatti (§2). Nessun nome, cue, gradino o etichetta della trazione orizzontale
    contiene «TRX» o «maniglie». Ricerca su `src/data`, esclusi i campi `scheda` di
    `deviations.ts` e i commenti.
  - **37.3** Gradini: i sei nomi della tabella, nell'ordine. `perSide` ed `eccentricOnly`
    invariati.
  - **37.4** Test:
    - id `inverted-row-trx`, esercizio `rematore-inverso-trx`, etichetta «Rematore inverso», nota
      esatta;
    - `testBaseline('horizontal-pull')` = `{ testId: 'inverted-row-trx', level: 2, measurement: 'reps' }`;
    - l'onboarding mostra la nota. Se oggi `TestDefinition.note` non si mostra, il criterio
      fallisce e la nota va mostrata.
  - **37.5** R1 su S2 A3, invariata: M = 10 ⇒ 2, M = 9 ⇒ 1, nessun risultato ⇒ 1.
  - **37.6** Nessuna migrazione.
    - Uno stato salvato `{ rematore-inverso-trx, level 3, +1″, +1″ }` si legge identico prima e
      dopo.
    - `reviewWeek` ed `evaluateProgression` su una storia di sole sedute al TRX danno la stessa
      uscita prima e dopo, nomi a parte.
  - **37.7** Diario: una seduta vecchia con `variantLabel` «Rematore TRX a 45°» mostra ancora
    quell'etichetta.
  - **37.8** Figure:
    - `rematore-inverso-trx` è fuori da `REPDB_ART` e dentro `FIGURE_SENZA_IMMAGINE`, oppure ha
      una figura agli anelli verificata da exercise-media-lead;
    - lo stesso per `horizontal-pull-l1`;
    - nessuna figura della scala mostra un TRX o una sbarra (verifica del media lead);
    - titoli e `aria-label` degli SVG rigenerati.
  - **37.9** Deviazioni: tre voci, più quelle dei gradini se il controllo di trascrizione le
    chiede. `npm run verify` verde.

**T-38 · R23, la zavorra a ogni cambio di gradino**
- File:
  - `engine/review.ts` (`scendi-di-livello` r. 583-597, `sali-di-livello` r. 726-741);
  - `engine/ritest.ts` (r. 111);
  - `engine/progression.ts` (leva `variant`);
  - `VariantPicker` / `SessionScreen` (L42);
  - i test.
- Criteri:
  - **23.1** Trazioni al 6 con 5 kg, +2″/+2″, 3-3-3 in due sedute ⇒ `scendi-di-livello` con
    stato `{5, 0, 0, 0 kg}` e il testo esatto della discesa.
  - **23.2** Push-up al 2 con 10 kg scritti, sotto il minimo in due sedute ⇒ `{1, 0, 0, 0 kg}`,
    stesso testo.
  - **23.3** Trazioni al 3 con 5 kg scritti, sopra il massimo, R5 e R7 aperti ⇒
    `sali-di-livello` con `{4, 0, 0, 0 kg}` e il testo della salita con la clausola. Oggi dà
    `{4, 5 kg}` (L14).
  - **23.4** Trazioni al 5 con 5 kg scritti, in salita ⇒ `{6, 0 kg}` e la clausola «riparte da
    zero».
  - **23.5** Leva `variant` a fine seduta con 5 kg: dopo «Applica» lo stato ha 0 kg, e il testo
    ha la clausola.
  - **23.6** `riparti-dal-test` dal 6 con 5 kg (9.20) ⇒ `{1, 0, 0, 0}` con il testo nuovo.
  - **23.7** `VariantPicker`: stato al 6 con 5 kg e +2″/+2″, si sceglie il 5 ⇒ `{5, 0, 0, 0 kg}`.
    Chiude L42.
  - **23.8** A 0 kg i testi restano identici a oggi (regressione).
  - **23.9** Su `inherent` nessun cambio. È una guardia, oggi non raggiungibile.
  - **23.P** Proprietà: su storie casuali, dopo ogni cambio di gradino accettato o eseguito,
    `loadKg = 0` sugli esercizi `allowed`. Nessuno stato sotto il 6 con kg > 0 nasce da
    un'azione dell'app. Nello script `18` di quality le 146 discese restano a 0 kg, con il testo
    nuovo.

**T-39 · `testAllaData` rev.**
- File: `db/repository.ts` (r. 57-63) e i test.
- Criteri, su stati mai salvati, per tutte e due le vie («Archivia» e migrazione R9c):
  - **9.30** Trazioni: test il 03-01 con M = 8, ritest il 04-11 con M = 4, ultima seduta con le
    trazioni il 04-11 ⇒ stato fissato **3**. R9b propone 3 → 1 (scheda «Dai test»). Oggi: 1, e
    nessuna proposta.
  - **9.31** Test il 03-01 con M = 4, ritest il 04-11 con M = 9, ultima seduta il 04-11 ⇒ stato
    fissato **1**, nessuna proposta. Oggi: 3.
  - **9.37** Test d'ingresso e prima seduta lo stesso giorno (03-01, M = 8), nessun test prima ⇒
    **3**. Come oggi.
  - **9.38** Ritest il 04-12, ultima seduta il 04-11 ⇒ il ritest non entra. Come oggi.
  - **9.29**, la proprietà di quality, estesa a storie con test e sedute nello stesso giorno:
    - 0 salite dovute a un risultato dello stesso giorno quando ne esiste uno precedente;
    - se lo stato fissato è sopra il gradino che R1 dà con il risultato del giorno, la
      proposta R9b c'è.

**T-40 · Z1 parte solo al «Via»** (R21 rev.). È solo un test.
- File: `engine/circuit.test.ts`, oppure il test del player.
- **21.14** Si arriva a Z1 avanzando da F4 del giro 2 ⇒ l'orologio resta fermo su «Parte al tuo
  via», senza serie e senza conto finché non si tocca «Via».
- Positivo: con la partenza automatica il test deve fallire.

**T-41 · `videoQuery` dell'apertura delle anche** (Basso)
- File: `data/exercises.ts`.
- `couch stretch hip flexor opener cool down` cerca lo stretch con il piede dietro al muro o sul
  divano. Il cue descrive invece l'affondo con il ginocchio a terra.
- Nuova: `half kneeling hip flexor stretch tutorial`.
- Criteri: testo esatto; `check:no-video-urls` verde.

### Schede tecniche per le immagini (per exercise-media-lead)

**Regole per tutte.**
- Le schede nascono dal testo del metodo e da nient'altro.
- Nessuna descrive o cita immagini d'archivio: licenza RepDB, termine 5. La figura generata non
  deve prendere come riferimento nessuna figura di quell'archivio.
- Ogni figura: un atleta solo, un attrezzo solo (quello della scheda), proporzioni plausibili.
- Mai in nessuna figura:
  - testi, numeri di peso, loghi, marchi;
  - un secondo attrezzo sullo sfondo che si possa scambiare per quello dell'esercizio;
  - frecce che descrivono un movimento diverso da quello della scheda.
- Gli angoli hanno una tolleranza: sono il criterio con cui training-quality verifica la figura
  in modo indipendente.

#### 5.1 Swing con kettlebell — `kb-swing` (pilota)

- **Dove.** Nel riscaldamento delle quattro sedute (10 tecnici) e nella finitura S1 F1, S3 F1,
  S4 F3 (15-20). Sono 7 passi su 4 sedute: la figura più vista dell'app.
- **Gesto.** Cerniera d'anca balistica a due mani. Non è uno squat, e non è un'alzata frontale.
- **Attrezzo e presa.**
  - Un kettlebell di ghisa con una maniglia, su un pavimento piano.
  - Due mani sulla maniglia, vicine al centro, presa prona: dorsi delle mani in avanti, pollici
    chiusi attorno alla maniglia.
  - La campana è larga circa quanto la coscia dell'atleta. Nessun numero sopra.
- **Fotogrammi: 3.** Il punto che si sbaglia è il caricamento.
  1. **Partenza da terra.**
     - Kettlebell a terra circa 30 cm davanti alle punte, al centro fra i piedi, con la
       maniglia inclinata verso l'atleta.
     - Piedi a larghezza spalle o poco più, punte un po' in fuori (10-15°), talloni a terra.
     - Cerniera: anche indietro, più alte delle ginocchia e più basse delle spalle; tibie quasi
       verticali; ginocchia appena piegate.
     - Schiena piatta dal bacino alla nuca. Braccia distese verso la maniglia, spalle lontane
       dalle orecchie, sguardo a terra uno o due metri avanti.
  2. **Caricamento**, il fondo del lancio indietro.
     - Kettlebell fra le cosce, dietro la linea delle ginocchia, con la **maniglia sopra il
       livello delle ginocchia** e vicina all'inguine; il fondo della campana guarda indietro.
     - Avambracci a contatto con l'interno delle cosce.
     - Anche spinte indietro oltre i talloni, tibie quasi verticali, ginocchia appena piegate,
       talloni a terra.
     - Schiena piatta, testa in linea con la schiena.
  3. **Picco**, il plank in piedi.
     - Corpo dritto: caviglie, anche e spalle sulla stessa verticale. Ginocchia distese, glutei
       contratti, costole chiuse: nessuna inclinazione all'indietro.
     - Braccia distese davanti, fra l'orizzontale e 20° sotto.
     - Kettlebell all'altezza del petto, in linea con le braccia (il fondo della campana guarda
       avanti), mai sopra le spalle.
     - Spalle basse, sguardo avanti, piedi interi a terra.
- **Angoli chiave.**
  - Fotogrammi 1-2:
    - tibia ≤ 15° dalla verticale;
    - ginocchio flesso di 15-35°;
    - busto 30-50° sopra l'orizzontale;
    - colonna neutra: nessuna curva visibile della lombare o della dorsale.
  - Fotogramma 2: maniglia più alta del ginocchio; anca dietro la verticale del tallone.
  - Fotogramma 3:
    - anca distesa (180° ± 5°);
    - busto verticale ± 5°, mai dietro la verticale;
    - braccio 0-20° sotto l'orizzontale.
- **Vista.** Laterale pura. È l'unica che mostra insieme le tibie, l'angolo del busto, l'altezza
  della maniglia e la linea della schiena. Il braccio vicino copre l'altro, e va bene.
- **Deve vedersi.**
  - Nei fotogrammi 1-2 la cerniera, non lo squat: anche indietro, tibie verticali.
  - Nel 2 la maniglia alta fra le cosce.
  - Nel 3 il corpo dritto senza arco, e il peso non oltre il petto.
  - In tutti e tre la schiena piatta.
- **Non deve comparire mai.**
  - Il kettlebell sopra la testa o sopra le spalle (lo swing «americano»).
  - Il busto inclinato indietro, o la lombare inarcata al picco. La schiena tonda.
  - Le ginocchia avanti oltre le punte; i talloni sollevati.
  - Braccia piegate che tirano; spalle verso le orecchie.
  - Nel caricamento, la campana bassa vicino al pavimento o fra le caviglie.
  - Una mano sola, due kettlebell, un manubrio.
- **Controllo di training-quality.**
  - Gli angoli sopra, misurati sui tre fotogrammi.
  - Nel 2, la maniglia sopra la linea del ginocchio.
  - Nel 3, il centro della campana sotto la linea delle spalle.

#### 5.2 Apertura delle anche — `apertura-anche`, Z2 (pilota)

- **Dove.** Z2 delle quattro sedute: 60″, metà per lato.
- **Gesto.** Allungamento del flessore dell'anca della gamba dietro, in mezzo inginocchiato.
  - Non è lo stretch con il piede dietro al muro o sul divano, il cosiddetto couch stretch,
    anche se oggi la `videoQuery` cerca quello (T-41).
- **Attrezzo.** Nessuno. Sotto il ginocchio dietro è ammesso un tappetino o un asciugamano
  piegato.
- **Fotogrammi: 2.**
  1. **Partenza.**
     - Mezzo inginocchiato: ginocchio dietro a terra, sotto l'anca; collo del piede dietro
       appoggiato a terra, con la pianta in su.
     - Piede avanti piatto, ginocchio avanti a circa 90°, sopra la caviglia.
     - Busto verticale, bacino neutro, mani sui fianchi o sulla coscia avanti.
  2. **Apertura**, la posizione da tenere.
     - Il bacino è avanzato e sceso in avanti: la coscia dietro è inclinata all'indietro
       rispetto alla verticale.
     - Il ginocchio avanti è andato verso le punte, con il tallone a terra.
     - Busto ancora verticale, costole sopra il bacino, nessun arco lombare.
     - Il gluteo della gamba dietro è contratto: si legge come bacino «in sotto», non come
       pancia in avanti.
- **Angoli chiave.**
  - Fotogramma 1:
    - coscia dietro verticale ± 10°;
    - ginocchio avanti 80-100°;
    - tibia avanti verticale ± 10°;
    - busto verticale ± 10°.
  - Fotogramma 2:
    - coscia dietro 10-25° oltre la verticale;
    - tibia avanti 10-30° in avanti;
    - busto verticale ± 10°, mai inclinato indietro;
    - tallone avanti a terra.
- **Vista.** Laterale, dal lato della gamba dietro: la gamba allungata è la più vicina a chi
  guarda.
- **Deve vedersi.**
  - Il ginocchio dietro e il collo del piede a terra.
  - Il bacino avanti con il busto dritto.
  - La lombare neutra.
- **Non deve comparire mai.**
  - Il piede dietro sollevato: contro un muro, su un divano, o tenuto con la mano.
  - Il busto inclinato indietro con la lombare inarcata, oppure piegato in avanti sulla coscia.
  - Le mani a terra: è un altro allungamento.
  - Il ginocchio dietro staccato da terra: diventa un affondo.
  - Una torsione del busto, le braccia sopra la testa, il tallone avanti sollevato.
  - Segni di molleggio.
- **Controllo di training-quality.** Gli angoli dei due fotogrammi. Nel 2, la coscia dietro
  oltre la verticale con il busto verticale ± 10°.

#### 5.3 Respirazione 360° da supino — `respirazione-360`, Z3 (pilota)

- **Dove.** Z3 delle quattro sedute: 30″, tre respiri da 4″ + 6″.
- **Gesto.** Respirazione che espande le costole di lato e dietro, da supino. Non è la
  respirazione «di pancia».
- **Attrezzo.** Nessuno. È ammesso un tappetino; sotto la testa al massimo un asciugamano
  piegato basso.
- **Fotogrammi: 1**, la posizione a fine inspirazione.
  - Uno solo perché fra inspirazione ed espirazione la differenza non si vede alla misura
    dell'app, e due fotogrammi farebbero cercare un movimento della pancia.
  - Supino, ginocchia piegate, piedi piatti a terra alla larghezza delle anche.
  - Una mano sullo sterno, in mezzo al petto. L'altra sulle costole basse di lato, sotto
    l'ascella e sopra l'osso del bacino, con le dita in avanti.
  - Testa a terra, collo lungo, mento né alzato né schiacciato. Spalle rilassate e a terra.
  - Lombare nella sua curva naturale: né schiacciata a terra né inarcata.
  - Se lo stile ammette segni di direzione: piccoli segni simmetrici verso l'esterno sulle
    costole laterali, e uno verso il pavimento sotto le costole. Mai sulla pancia.
- **Angoli chiave.**
  - Ginocchio 80-110°.
  - Piedi interi a terra, distanti fra loro circa la larghezza del bacino.
  - Testa e bacino a terra.
- **Vista.** Tre quarti dall'alto, dal lato della mano sulle costole. Devono vedersi tutte e due
  le mani, le ginocchia piegate e i piedi a terra: il profilo puro nasconde una delle due mani.
- **Deve vedersi.**
  - Le due mani al loro posto: sterno e costole laterali.
  - Le ginocchia piegate con i piedi a terra.
  - Testa e spalle a terra, rilassate.
- **Non deve comparire mai.**
  - Gambe distese; piedi sollevati o appoggiati al muro (è un altro esercizio).
  - Mani sulla pancia, o la pancia gonfia come unico segno del respiro.
  - Spalle alzate verso le orecchie; testa sollevata; schiena inarcata.
  - Pesi o elastici; bocca spalancata o guance gonfie.
- **Controllo di training-quality.** La posizione delle due mani; il ginocchio a 80-110°; i
  piedi interi a terra.

#### 5.4 Corda da battaglia, slam — `corda-battaglia-slam` (pilota)

- **Dove.** S1 F4 e S4 F1: 30″, due giri.
- **Gesto.** Le due estremità della corda alzate sopra la testa e scagliate a terra insieme, con
  tutto il corpo.
  - Non sono le onde, alternate o doppie, in cui le mani restano fra le anche e le spalle.
- **Attrezzo e presa.**
  - Una corda da battaglia spessa, circa 4 cm di diametro, piegata attorno a un ancoraggio a
    terra davanti all'atleta. Le due metà corrono parallele verso di lui; l'ancoraggio può
    restare fuori dall'inquadratura.
  - Un'estremità per mano: pugno chiuso attorno al manicotto, presa neutra (pollici in alto con
    le braccia avanti).
- **Fotogrammi: 2.**
  1. **In alto.**
     - Braccia distese sopra la testa, appena davanti alla testa e mai dietro, gomiti quasi
       dritti.
     - Atleta sulle punte, ginocchia e anche distese.
     - Busto verticale, costole chiuse: nessuna inclinazione all'indietro.
     - Le due metà della corda salgono da terra alle mani.
  2. **Impatto.**
     - Anche indietro e busto inclinato in avanti, con la schiena piatta.
     - Ginocchia piegate come in un mezzo piegamento, talloni a terra.
     - Braccia distese in avanti e in basso, mani all'altezza delle ginocchia o poco sotto.
     - Le due metà della corda colpiscono il pavimento insieme, uno o due metri davanti, con la
       stessa onda.
- **Angoli chiave.**
  - Fotogramma 1:
    - spalla 160-180°, braccia vicino alle orecchie;
    - gomito flesso al massimo di 15°;
    - talloni sollevati;
    - busto al massimo 5° dietro la verticale.
  - Fotogramma 2:
    - busto 35-60° dalla verticale;
    - ginocchio flesso di 30-60°;
    - colonna neutra;
    - mani fra il ginocchio e metà tibia;
    - talloni a terra.
- **Vista.** Laterale, oppure tre quarti a non più di 30° dal profilo: quanto basta perché le
  due metà della corda non si sovrappongano. La linea della schiena deve restare leggibile.
- **Deve vedersi.**
  - Nel fotogramma 1, le mani sopra la testa.
  - Nel 2, la cerniera con la schiena piatta, non la schiena che si piega.
  - Le due metà della corda che toccano il pavimento insieme.
- **Non deve comparire mai.**
  - La schiena tonda all'impatto; il busto inclinato indietro con l'arco lombare in alto.
  - Le braccia dietro la testa.
  - Le due metà a ritmo alternato: sono le onde alternate. Le mani ferme all'altezza delle
    spalle: sono le onde doppie. Un'estremità sola.
  - I piedi staccati da terra in un salto; le ginocchia che cadono in dentro.
  - La corda legata alla vita o arrotolata alle mani; altri attrezzi.
- **Controllo di training-quality.**
  - Nel fotogramma 1, le mani sopra la sommità della testa.
  - Nel 2, busto a 35-60°, colonna neutra, le due metà in fase.

#### 5.5 Rematore inverso agli anelli — `rematore-inverso-trx`, gradino 2 (fuori dal pilota)

- **Dove.** S2 A3 (8-10, 3 serie, RIR 1-2), più il test d'ingresso e i ritest. Serve perché
  T-37 toglie la figura di oggi.
- **Gesto.** Trazione orizzontale in sospensione agli anelli, presa larga e gomiti larghi. La
  scheda dice «È spessore, non ampiezza»: lavora il dorso alto e la parte dietro delle spalle,
  non l'ampiezza dei dorsali.
- **Attrezzo e presa.**
  - Due anelli da ginnastica su due cinghie separate, appese in alto (fuori inquadratura, o a
    una trave).
  - Anelli un po' più larghi delle spalle.
  - Presa prona: palmi rivolti verso i piedi, pollice chiuso attorno all'anello.
- **Fotogrammi: 2.**
  1. **Partenza**, a braccia distese.
     - Corpo rigido, in linea dalle caviglie alla testa, a 45° dal pavimento.
     - Talloni a terra, gambe distese, piedi uniti o alla larghezza delle anche, punte in alto.
     - Cinghie verticali, braccia distese, spalle lontane dalle orecchie.
  2. **Arrivo.**
     - Anelli all'altezza del petto, fra lo sterno e le ascelle.
     - Gomiti dietro la linea del busto, e larghi: il braccio sta a metà fra il fianco e la
       linea delle spalle.
     - Scapole strette, polsi dritti, collo neutro.
     - Il corpo è ancora in linea: il bacino non cede.
- **Angoli chiave.**
  - Fotogrammi 1-2: corpo a 45° ± 5° dal pavimento; anca flessa al massimo di 10°.
  - Fotogramma 1: cinghie verticali ± 10°; gomito flesso al massimo di 10°.
  - Fotogramma 2: braccio a 45-75° dal busto, né ai fianchi né a T.
- **Vista.** Tre quarti, circa 45° dal profilo, dal lato della testa e appena dall'alto. Il
  profilo puro nasconde la larghezza dei gomiti.
- **Deve vedersi.**
  - Due anelli separati, non maniglie.
  - Il corpo in linea a 45°.
  - I gomiti larghi all'arrivo.
- **Non deve comparire mai.**
  - Il TRX (maniglie, cinghia unica a Y, ancoraggio unico) o una sbarra.
  - Ginocchia piegate o piedi piatti; il bacino che cede.
  - Gomiti stretti ai fianchi, o braccia a T (90° dal busto).
  - Mento proteso; spalle alle orecchie.
  - Un braccio solo; piedi su un rialzo; corpo orizzontale.
  - Palmi verso il viso; anelli che si toccano.
- **Controllo di training-quality.** Corpo a 40-50°; due anelli separati; nel fotogramma 2 il
  braccio a 45-75°.

#### 5.6 Gli altri, in ordine

**Criterio dell'elenco.**
- Esercizi delle sedute attive (`circuit.ts`, blocchi e riscaldamento) che al proprio gradino non
  hanno una foto.
- `artFor` dà `exercise`, e lo slug non è in `REPDB_ART` oppure è in `FIGURE_SENZA_IMMAGINE`.
- Sono **36**, compreso il rematore dopo T-37. Tolti i 5 sopra, ne restano **31**.
- La differenza con i 28 del brief: i 3 esercizi solo di riscaldamento (2, 3 e 4 dell'elenco).
- Ordine:
  - prima per numero di sedute;
  - a parità, per numero di passi;
  - poi i blocchi giudicati prima della finitura (A, poi B);
  - dentro, prima chi espone di più la colonna o la spalla.

| # | slug | sedute | dove | nota |
|---|---|---|---|---|
| 1 | `corda-battaglia-onde-alternate` | 4 (5 passi) | riscaldamento ×4, S1 F2 | — |
| 2 | `scapular-pull-up` | 4 | riscaldamento | — |
| 3 | `circonduzioni-spalle` | 4 | riscaldamento | dubbio aperto del media lead |
| 4 | `affondo-con-rotazione` | 4 | riscaldamento | — |
| 5 | `step-rapidi-box` | 2 | S1 F3, S3 F4 | — |
| 6 | `stacco-rumeno-manubri` | 1 | S2 A2 | cerniera con carico |
| 7 | `goblet-squat` | 1 | S3 A1 | — |
| 8 | `bulgarian-split-squat` | 1 | S1 A2 | al gradino 2 il proprio esercizio non ha foto, ma il gradino 2 della scala sì: forse manca solo la voce in `REPDB_ART`. Prima va decisa la nota sul kettlebell (domanda 2 del media lead) |
| 9 | `hip-thrust-panca-bilaterale` | 1 | S4 A1 | — |
| 10 | `military-press-manubri` | 1 | S4 A3 | — |
| 11 | `rematore-manubrio-un-braccio` | 1 | S4 A2 | — |
| 12 | `pike-pushup-piedi-rialzati` | 1 | S2 A1 | — |
| 13 | `pull-over-trx` | 1 | S3 A3 | — |
| 14 | `suitcase-carry` | 1 | S1 B3 | — |
| 15 | `plank-trascinamento-kb` | 1 | S4 B3 | — |
| 16 | `pallof-press-elastico` | 1 | S2 B3 | — |
| 17 | `estensione-tricipiti-sopra-testa` | 1 | S1 B2 | kettlebell tenuto per le corna |
| 18 | `dip-panche-piedi-rialzati` | 1 | S4 B2 | «due panche»: domanda 4 del media lead |
| 19 | `curl-martello-manubri` | 1 | S1 B1 | — |
| 20 | `curl-manubri-supino` | 1 | S2 B1 | — |
| 21 | `curl-panca-inclinata` | 1 | S4 B1 | — |
| 22 | `curl-trx` | 1 | S3 B1 | — |
| 23 | `estensione-tricipiti-trx` | 1 | S3 B2 | — |
| 24 | `burpee` | 1 | S2 F1 | — |
| 25 | `affondi-rapidi-alternati` | 1 | S2 F3 | — |
| 26 | `mountain-climber` | 1 | S3 F2 | — |
| 27 | `plank-tocco-spalla` | 1 | S4 F4 | — |
| 28 | `corda-battaglia-onde-doppie` | 1 | S2 F4 | — |
| 29 | `corda-battaglia-cerchi` | 1 | S3 F3 | — |
| 30 | `corda-per-saltare` | 1 | S2 F2 | — |
| 31 | `jumping-jack` | 1 | S4 F2 | — |

**Fuori dall'elenco, ma raggiungibili nelle sedute attive**: gradini senza figura su cui R1 manda
chiunque sia sotto la soglia del test.
- `vertical-pull-l1`, S1 A1. Ci va chi ha meno di 8 trazioni, quindi probabilmente Alessio, con
  il massimale a 4. Prima va decisa la domanda 3 del media lead: piede sul box o elastico.
- `dip-l1`, S1 A3.
- `horizontal-pull-l1`…`l6` dopo T-37.
- Le loro schede vengono subito dopo il pilota, prima del numero 1.

### Rischi (sicurezza, dati)

- **R-21 · Z1 con D-Q3 (a)** (Basso, accettato da Alessio).
  - Per chi regge poco, Z1 è una tenuta fino al primo cedimento della presa, a fine seduta,
    quattro volte a settimana.
  - Attenuazioni: la nota ferma prima del cedimento; il tetto è a 30″; nessun numero nasce da Z1.
- **R-22 · Figura assente.** Dopo T-37, S2 A3 e il suo test restano senza figura finché Alessio
  non ne approva una. È la scelta prudente: l'alternativa è l'attrezzo sbagliato.
- **R-23 · Storia mista TRX e anelli** (Basso).
  - La prima coppia di sedute di R8 dopo T-37 può essere tutta al TRX, e proporre una salita su
    dati TRX per un esercizio agli anelli.
  - Angolo e range sono gli stessi. La salita la sceglie l'atleta, e R7 la tiene a 14 giorni.
  - Il test agli anelli non alza niente (R9c).
- **R-24 · Progressi del test.** Lo storico di `inverted-row-trx` mescola TRX e anelli. Nessuna
  regola ne legge il confronto, e le etichette nuove dicono il vero. Il grafico, se c'è, non lo
  dice.
- **R-25 · R23 riduce due volte** (Basso). Con kg scritti a mano sotto il 6 si scende di gradino
  e di carico insieme. È la direzione prudente, e il peso resta scrivibile.
- **R-26 · `testAllaData` con `<`** (Basso).
  - Caso 9.30: fra lo stato fissato e la scelta, la seduta successiva mostra il gradino di prima
    del ritest, con la scheda «Dai test» in Home.
  - È lo stesso esito di ogni ritest peggiore sotto R9b, che quality ha accettato (2d nella v14).
- **Dati.** Nessuna migrazione, nessun campo nuovo. Nessun testo dell'atleta entra in un calcolo.

### Decisioni per Alessio

- **Nessuna nuova.** D-Q3 è chiusa: (a).
- Due scelte mie, dichiarate, che Alessio può rovesciare senza costi di dati:
  1. nome senza attrezzo («Rematore inverso»), scala della trazione orizzontale tutta agli
     anelli, varianti archiviate senza «TRX», gradino 1 «a 60°»;
  2. L43: la (a), estesa alla salita e al cambio a mano (R23).

### Domande aperte

1. **(training-quality)** R23 estende B18 alla salita (L14) e al cambio a mano (L42). Il tuo 4o
   va esteso con 23.3, 23.5 e 23.7, con i positivi sul codice di oggi?
2. **(training-quality)** Controllo 2c sulle sei condizioni di S7 per `recordActual`. La 6, la
   nota prima del via, fuori dal browser è verificabile solo dal sorgente. La consideri NON
   COPERTA fino allo smoke?
3. **(exercise-media-lead)** Per il gradino 2 del rematore agli anelli c'è già una figura che
   puoi verificare nello stesso commit di T-37, o va in `FIGURE_SENZA_IMMAGINE`? Puoi anche
   riverificare `horizontal-pull-l1`…`l6` per gli anelli?
4. **(sessione principale)** L'onboarding mostra `TestDefinition.note`? Se no, il protocollo
   «agli anelli a 45°» non arriva all'atleta, e 37.4 lo chiede.
5. **(sessione principale)** A che gradino è oggi Alessio sul rematore, e ha bonus di tempo o di
   pausa? Non cambia la regola, ma dice quanto conta R-23.
6. **(exercise-media-lead)** Il bulgaro al gradino 2: manca solo la voce in `REPDB_ART`, visto che
   il gradino 2 della scala ha già la figura? O la nota sul kettlebell lo esclude?
7. **(exercise-media-lead)** Le tue domande 2, 3, 4, 5 (seconda e terza parte) e 6 del 2026-11-21
   le prendo nel prossimo giro, insieme alle schede di `vertical-pull-l1` e `dip-l1`. Qui rispondo
   alla 1 (anelli, presa larga, gomiti larghi) e alla prima parte della 5 (`horizontal-pull-l1`:
   anelli a 60°).
