# training-designer — 2026-11-22 — La verticale nella scheda (blocco H1) e le tenute isometriche

Richiesta di Alessio (2026-11-22): «puoi aggiungere handstand da qualche parte nella scheda», e se la
scheda ha «logiche di isometric holds». Nessun file di `src/` toccato: tutto è specifica, compiti
T-42…T-49 per la sessione principale.

### Riepilogo

- **Dove.** Un blocco nuovo, **H1 «Abilità»**, in apertura della **Seduta 3**, dopo il riscaldamento
  e prima del Tri-set A: da fresco, come scriveva la scheda Shadow di Alessio («Skill a inizio
  seduta, da fresco», `program.ts` r. 556). Non sostituisce niente. La Seduta 3 è la più corta
  (36:18), apre con il goblet squat (gambe), ha già l'hollow hold (la stessa linea del corpo, da
  sdraiati). La Seduta 2 non regge: arriva a 40:00 esatti, a 55:03 al massimo (oltre il tetto di
  R19), e metterebbe la verticale subito prima del pike push-up.
- **Prescrizione.** `verticale-al-muro`, **2 serie da 20-30″**, isometrico, RIR 1-2 («mai a
  cedere»), 60″ fra le serie, 45″ prima del Tri-set A. Si parte dal **gradino 1**: mani a terra e
  piedi al muro all'altezza delle anche (D-25). Ci sono **10 oscillazioni dei polsi** nel
  riscaldamento della sola Seduta 3. Nessun test nuovo all'onboarding.
- **R1.** Non c'è un test di verticale, quindi vale la riga 3 di R1. Oggi darebbe il **2**: la
  verticale con la schiena al muro, che si sale con uno slancio che nessun test misura. Propongo
  la riga 3 rev.: su un gradino a testa in basso si parte da **1**. Lo stesso vale con uno stato
  salvato dallo Shadow.
- **Progressione.** Si giudica come l'hollow hold, con tre differenze:
  1. **tetto di tenuta.** Il conto si ferma a 30″ con il segnale «Scendi», e il valore scritto
     non supera mai 30;
  2. **in revisione «al tetto» vale «sopra il massimo»**, altrimenti il blocco non salirebbe mai;
  3. **tetto di gradino 4**: la verticale libera (5-6) l'app non la propone e in H1 non la offre.

  Nessuna leva di tempo: il range è fisso e si sposta il gradino. A testa in giù si sta al
  massimo 35″ per serie (5″ di salita più 30″), a qualunque gradino.
- **Sicurezza.**
  - **L15 — posizioni a testa in basso** in BOUNDARIES: scheda una tantum «Prima della prima
    verticale», con le controindicazioni e il rimando a un medico. «Salta» esclude la verticale
    e il pike push-up.
  - Uscita scritta gradino per gradino; segni di arresto prima del «Via»; spazio libero; audio.
  - Correzione di un cue sbagliato: oggi la scheda dice «spalle lontane dalle orecchie», ma nella
    verticale le spalle vanno spinte verso le orecchie.
- **Durate.** La Seduta 3 passa da 36:18 a **39:23** (+185″), sotto i 40′; il massimo con R20 va
  da 49:30 a 52:35, sotto i 55′. La 2 torna la più corta, quindi la nota della scheda sulla Seduta
  2 torna vera e la sua deviazione si toglie. La 4 resta la più lunga, di 20″.
- **Isometriche, la risposta ad Alessio.** Sì: l'hollow hold (S3 B3) e il suitcase carry (S1 B3)
  si giudicano; il dead hang di Z1 e le stazioni a tempo no. **Difetto latente trovato** (Medio,
  T-49): al gradino 3 l'hollow hold salirebbe all'**hanging knee raise**, un esercizio a
  ripetizioni, con la prescrizione «30-45″».
- **Decisioni per Alessio: 3** (D-24 dove, D-25 gradino 1, D-26 verticale libera fuori), ognuna
  con una raccomandazione.

### Stato attuale del metodo (verificato sul codice)

**Le tenute isometriche oggi.**

| blocco | esercizio | prescrizione | giudicata | R1 | leve |
|---|---|---|---|---|---|
| S3 B3 | hollow hold (`core`, P 3) | 3 × 30-45″ | sì | test hollow, soglia 36″: ≥ 36 ⇒ 3, sotto ⇒ 2, nessuno ⇒ 1 | arrivare a 45″ → tempo e pausa non disponibili (TUT `isometrico`) → gradino → carico vietato |
| S1 B3 | suitcase carry (`pattern: null`, KB 24) | 3 × 30-40″ per lato | sì | — | nessun gradino; il kettlebell non è leva ⇒ `leve-finite` |
| Z1 | dead hang | 30″ = 30″, `recordActual` | no (R21) | riga 2 ⇒ 2 | nessuna |
| Z2, Z3, stazioni F a tempo | — | min = max | no, si chiudono da sole | — | nessuna |

- Il conto di una tenuta giudicata **non ha tetto**: arrivato al minimo diventa verde e continua
  (`GuidedSession.tsx` r. 81). L'unico tetto è quello di Z1 (R21).
- Revisione (`review.ts` r. 575-742): `sali-di-livello` se **tutte** le serie della coppia sono
  **sopra** il massimo; `scendi-di-livello` se tutte sono sotto il minimo. Fine seduta: la leva
  `variant` solo con tutte le serie ≥ massimo, il tempo rispettato e **≥ 3 serie** (E3).
- **Difetto latente, nuovo (Medio).** La scala `core` cambia misura a metà:
  - gradini 1-3: plank 45″, hollow ginocchia piegate, hollow completo;
  - gradini 4-6: hanging knee raise, hanging leg raise, ab wheel, tutti a ripetizioni.

  `adjacentLevel` non guarda la misura. Con tutte le serie sopra 45″ in due Sedute 3 consecutive,
  l'app propone «Sali al livello 4: Hanging knee raise» dentro un blocco a 30-45″ in secondi.
  Nessun test lo copre (cercato `knee raise` e «misura» nei test e nei file di metodo: niente).

**La verticale oggi.**
- Scala `handstand` (`progressions.ts` r. 150): 6 gradini, tutti in secondi, nessuno per lato,
  nessuno solo eccentrico.
- `verticale-al-muro`: `defaultLevel` 2, spalle (core secondario), `forbidden`. Compare solo come
  alternativa del blocco A dello Shadow archiviato (3 × 30-45″, 60″, RIR 1-2).
- Nessun test della verticale in `tests.ts`: `testBaseline('handstand')` dà `null`, quindi R4
  non aggiunge test (restano 7).
- **Cue sbagliato.** «Spingi attivamente il pavimento, spalle lontane dalle orecchie»
  (`exercises.ts` r. 734): nella verticale la spalla va spinta in alto, verso le orecchie;
  abbassarla è la posizione che fa cedere. Il cue va bene per l'L-sit e per le sospensioni, non
  qui.
- **Figura.** `handstand-l1` è registrata «da rifare» (`media/LIBRARY.md` r. 163). È la posa del
  pike push-up, con la testa fuori asse; il gradino 1 descritto qui è un'altra posa.
- Nessun riscaldamento dei polsi in nessuna seduta.
- Nessun limite su glaucoma, occhi, testa, collo e reflusso. L4 parla di pressione e gravidanza,
  ma L1 non esiste ancora.

**Vincoli di tempo, misurati dai rapporti e dai test.**
- Durate a bonus 0 con R20: S1 38:40, S2 36:55, S3 36:18, S4 39:43.
- Test «sta dentro i quaranta minuti» (`circuit.test.ts` r. 34): ≤ 2.400 s.
- Massimi con R20: 46:40, 51:58, 49:30, 59:15. R19: passo di tempo o pausa solo con la durata
  ≤ 3.300 s.
- Note di seduta: la Seduta 2 oggi ha una deviazione dichiarata, perché la più corta è la 3
  (L26.4); la nota della Seduta 4 dice «la più lunga delle quattro».

### Modifiche proposte a regole, catalogo e consigli, con versione

#### 1 · R24 — Blocco H1 «Abilità» nella Seduta 3 `[programmi 2.6 — PROPOSTA]`

**Dove e perché lì.**

| opzione | S3 a bonus 0 | massimo R19 | prima della verticale / dopo | note |
|---|---|---|---|---|
| **(a) S3, apertura** — raccomandata | 36:18 → **39:23** | 49:30 → 52:35 | riscaldamento / goblet squat (gambe): «muscoli nuovi» è vero | la nota della S2 torna vera (la 2 torna la più corta); nella S3 non c'è nessuna spinta sopra la testa (la S2 ha il pike, la S4 il military press); l'hollow hold della stessa seduta lavora la stessa linea |
| (b) S2, apertura | 36:55 → 40:00 | 51:58 → **55:03** | riscaldamento / **pike push-up** | margine zero sui 40′; R19 ferma un passo prima; la verticale affatica proprio le spalle del blocco di forza; la nota «minuti di margine» della S2 diventa falsa |
| (c) S2 e S3 | 40:00 e 39:23 | 55:03 e 52:35 | come sopra | due sedute consecutive nella rotazione, spesso giorni consecutivi, con tutti e due i difetti di (b) |

Scartate:
- **nel riscaldamento delle quattro sedute.** La S4 sforerebbe i 40′ (17″ di margine); senza
  serie registrate non c'è né progressione né discesa;
- **al posto di qualcosa.** Ogni stazione della S3 è nella trascrizione; nessuna fa il lavoro a
  testa in giù sopra la testa. L'hollow hold resta: è la versione a terra della stessa linea;
- **nella pausa di blocco (`pauseTasks`).** Arriverebbe a spalle stanche.

**Il blocco.** Dati per T-42.

| campo | valore | perché |
|---|---|---|
| `code` / `group` | `H1` / `H` | gruppo suo, prima di `A`; `groupLabel` = «Abilità» |
| `exercise` | `verticale-al-muro` | stesso slug dello Shadow: storico unico |
| `sets` | **2** | prima esposizione a testa in giù: dose bassa; 4 serie vere nella coppia di R8 (≥ 3) |
| `prescription` | `seconds` 20-30 | 20″ sono una tenuta che insegna la posizione; il tetto 30″ limita il tempo a testa in giù |
| `tut` / `rir` | `isometrico` / `1-2` | come la skill dello Shadow; in questo blocco vuol dire «scendi con margine» |
| `rest` | `superset`, transizione 0, giro **60″**, blocco **45″** | 60″ fra due tenute a testa in giù; 45″ bastano per alzarsi e prendere il kettlebell |
| `workSeconds` | assente | per una tenuta il minimo è il minimo del range: un `workSeconds` più alto mostrerebbe «almeno 25» |
| stima della serie | **25″** (5″ di salita + 20″) | T-44 |
| `maxLevel` (nuovo) | **4** | §3 |
| `cappedHold` (nuovo) | `true` | §3 |
| note per gradino (nuovo) | 1-4, testi in §4 | l'entrata e l'uscita cambiano a ogni gradino |
| `pauseTasks.H` | «Prima in ginocchio per due respiri, poi in piedi. Poi prendi il kettlebell del goblet.» | alzarsi piano dopo la testa in giù |
| `excludeFromReview` | assente (giudicata) | §3: senza revisione non ci sarebbe nemmeno la discesa |

**Riscaldamento della Seduta 3.** Un passo in più, solo qui, dopo «Circonduzioni di spalla»:
«Oscillazioni dei polsi in quadrupedia», 10 ripetizioni in 20″. È un esercizio nuovo,
`oscillazioni-polsi` (T-43, scheda in §5.2). Il giro di prova resta del Tri-set A.

**Durata, conto esatto** (+185 s sulla S3, nessun cambio sulle altre):
- polsi 20″, più la transizione di riscaldamento di 10″ (`WARMUP_TRANSITION_SEC`);
- H1: 2 × 25″, più 60″ fra le serie, più 45″ prima del Tri-set A;
- il passo «riscaldamento → primo blocco» (30″) esiste già: si sposta davanti a H1.
- S3: 2.178 → **2.363 s (39:23)**. Ordine a bonus 0: S2 36:55 < S1 38:40 < S3 39:23 < S4 39:43.
  Con R20 il massimo della S3 va a 52:35 (≤ 55′).
- `estimatedMinutes` della S3: 35 → **39**, dichiarato come deviazione.
- Volume settimanale (2 serie primarie, `core` a metà): **spalle 13,5 → 15,5**, **core 16,5 →
  17,5**; gli altri gruppi invariati.

**Deviazioni dalla scheda da dichiarare** (`deviations.ts`, T-42 e T-43):
1. **Blocco aggiunto**, una forma nuova `BLOCCHI_AGGIUNTI`, simmetrica a `BLOCCHI_TOLTI`:
   - campi: `{ sessione: 'circuito-3', codice: 'H1', minuti: { scheda: 35, app: 39 }, motivo }`;
   - motivo: «Alessio, 2026-11-22: "puoi aggiungere handstand da qualche parte nella scheda".
     In apertura, da fresco, come la skill dello Shadow; nella Seduta 3 perché è la più corta,
     apre con le gambe e non con una spinta sopra la testa.»
2. **Riscaldamento diverso in una seduta**, una forma nuova `DEVIAZIONI_RISCALDAMENTO`:
   - campi: `{ sessione: 'circuito-3', passo: 'Oscillazioni dei polsi in quadrupedia', dopo:
     'Circonduzioni di spalla', motivo }`;
   - motivo: «La verticale carica i polsi in estensione con quasi tutto il peso: si preparano
     dove serve.»
3. **Nota della Seduta 2: la deviazione si toglie.**
   - Con la S3 a 39:23 la frase della scheda «È la più corta delle quattro…» torna vera, e
     l'app torna a mostrarla com'è.
   - Il test L26.4 si rovescia: la più corta è la 2. Il 20.9 cade con la deviazione.
4. **Gradino 1 rinominato**, solo se D-25 = sì. Voce in `DEVIAZIONI_GRADINO` (handstand, 1):
   scheda «Plank a mani alte contro il muro» → app «Verticale a L, piedi al muro».
5. **Nota della Seduta 4**: invariata. Resta la più lunga di 20″ e lo dice un test nuovo.

#### 2 · R1 riga 3 rev. e ingresso a 1 `[programmi 2.6 — PROPOSTA]`

- **Flag nuovo `ProgressionStep.headDown`**: posizione tenuta o ripetuta con la testa sotto il
  cuore e il peso sulle mani.
  - Vero per **`handstand` 1-6** e **`vertical-push` 1-6**: il pike push-up a terra e quello
    con i piedi rialzati portano la testa in basso quanto il gradino 1 della verticale.
  - Serve a R1 qui sotto e a L15.
- **Riga 3 rev.** Scala senza test ⇒ `P` se `P ≤ 2` **e il gradino `P` non è `headDown`**;
  altrimenti **1**.
  - Hip thrust S4 A1: 2, invariato.
  - Verticale S3 H1: `P` = 2, a testa in basso ⇒ **1**. Il gradino 2 si sale con uno slancio,
    e nessun test misura né lo slancio né l'uscita.
  - La spinta verticale ha un test: la riga 3 non la tocca.
- **Ingresso.** Finché nessuna seduta chiusa ha una voce di `verticale-al-muro` nel blocco
  `circuito-3/H1`, il gradino mostrato è quello di R1 (1), **anche con uno stato salvato**. Lo
  Shadow aveva la verticale fra le alternative; uno stato di mesi fa non dice niente di oggi.
  - Dopo la prima H1 chiusa, R9c salva lo stato come per tutti.
  - È una discesa, o niente: non passa da cancelli né da R13.
- **Tabella di R1**, riga nuova: `S3 H1 | verticale al muro | P 2 | Lt — | soglia — | 1
  (riga 3 rev.)`.
- **R4 invariato**: `testBaseline('handstand') = null`, nessun test all'onboarding. Un test
  massimale a testa in giù il primo giorno sarebbe la cosa meno prudente di tutto il blocco.

#### 3 · R25 — Tenuta con tetto, progressione e revisione `[progressione 4.4 — PROPOSTA]`

**Nel player (`cappedHold`, T-44).** Stessa meccanica di R21 (Z1), con un range:
1. Ogni serie **parte solo al «Via»**: niente partenza automatica a fine recupero. Le mani
   servono a terra, e una salita di fretta è il modo più semplice di sbagliarla.
2. «Via» ⇒ 5″ di **«Sali»** che non si contano, poi un bip e il conto da 0.
3. I segnali: bip a **20″** («minimo»), preavviso a 25″, bip **«Scendi»** a **30″**. A 30″ il
   conto si ferma.
4. «Ho mollato» prima del segnale scrive il cronometro intero (`tenutaMollata`).
5. Dopo il segnale, la domanda «Hai tenuto fino al segnale?»:
   - «Sì» ⇒ 30;
   - «No» ⇒ un intero da 1 a 29, scritto in un campo numerico (L12: è un numero, non un
     testo).
6. **Il valore scritto non supera mai 30.**
7. `tempoRespected` = valore ≥ 20.

**Progressione.**
- **Leve.** Quella delle ripetizioni (arrivare a 30″), poi il gradino, nient'altro:
  - tempo e pausa non sono disponibili (`isometrico`);
  - il carico è vietato;
  - **nessuna leva di tempo**: il range è fisso (P-3), e un tempo più lungo vorrebbe dire più
    tempo a testa in giù.
- **Salita, solo in revisione** (R10a riga 1). Sui blocchi `cappedHold`, «tutte sopra il
  massimo» si legge **«tutte al tetto»**. Valgono poi:
  - R5: E2 su tutte e due le sedute, E3 ≥ 3 serie vere nella coppia (con 2 serie per seduta
    sono 4), E4, E5;
  - R7 (14 giorni al gradino), R13 (7 giorni).

  Senza questa lettura il blocco non salirebbe mai: col tetto nessun valore supera 30, e a fine
  seduta 2 serie danno `poche-serie`.
- **A fine seduta** H1 non propone niente. Il testo di `poche-serie` («servono 3 serie
  complete») qui sarebbe falso e si ripeterebbe a ogni seduta: al suo posto, il testo di §4.
- **Discesa.** Tutte le serie della coppia sotto 20″:
  - `scendi-di-livello` dal 2 in su;
  - **al gradino 1**, un testo suo (§4) e stato invariato: non c'è un test da rifare, e il
    testo di `range-da-rifare` oggi dice di rifarlo.
- **Tetto di gradino (`maxLevel: 4`).**
  - `adjacentLevel` in H1 si ferma al 4: la variante è esaurita, e con il carico vietato si
    arriva a `leve-finite`, con il testo di §4.
  - Il `VariantPicker` di H1 offre i gradini 1-4.
  - Uno stato sopra il 4 viene mostrato al 4.
  - Il motivo: i gradini 5-6 sono la verticale libera, e chiedono un'uscita con la ruota che
    l'app non può insegnare né verificare. «Tentativi di verticale libera», poi, non è una
    tenuta da 20-30″: con questo range oscillerebbe fra 4 e 5 a ogni coppia.
- **Tempi realistici.** Con S3 una volta a settimana e R7: gradino 2 non prima della 3ª
  settimana, 3 non prima della 5ª, 4 non prima della 7ª.
- **Scarico** (settimane 6, 12, 18) **e rientro** (R9): 2 serie → 1; E4 ed E5 fermano gli
  aumenti. Dolore: L2.
- **Prove** (attesi, per `review.ts` e il player):

| # | caso | atteso |
|---|---|---|
| H.1 | prima S3, nessuno stato | gradino 1, 2 × 20-30″ |
| H.2 | stato 3 dallo Shadow, nessuna H1 chiusa | gradino 1 mostrato |
| H.3 | coppia 30, 30 / 30, 30, tempo sì, ≥ 14 giorni al gradino 1, nessun aumento negli ultimi 7 | `sali-di-livello` 1 → 2 |
| H.4 | come H.3 ma 10 giorni al gradino | `inAttesa` (R7) |
| H.5 | coppia 30, 27 / 30, 30 | `inRange`, niente |
| H.6 | coppia 18, 15 / 19, 12 al gradino 3 | `scendi-di-livello` 3 → 2 |
| H.7 | come H.6 al gradino 1 | testo «gradino 1» di §4, stato invariato |
| H.8 | coppia tutta a 30 al gradino 4 | `leve-finite` con il testo del 4; nessun 5 proposto |
| H.9 | conto lasciato correre fino a 45″, poi «Sì» | valore scritto 30 |
| H.10 | «Ho mollato» a 12,7″ | 12 |
| H.11 | fine seduta, 2 serie a 30 | nessuna leva, testo di §4 (non «servono 3 serie») |
| H.12 | settimana 6 | 1 serie; nessun aumento dalla coppia (E4) |

#### 4 · Sicurezza — L15, polsi, uscita, testi `[limiti 1.7 · consigli 4.4 — PROPOSTA]`

**L15 — Posizioni a testa in basso** (BOUNDARIES, testo completo nel file):
- **Regola.** Un gradino `headDown` non si propone a chi dichiara una di queste cose:
  - pressione alta (anche se curata), glaucoma o un altro problema agli occhi;
  - un problema alla testa o al collo, reflusso, gravidanza;
  - l'indicazione di un medico di evitare le posizioni a testa in giù.

  Nessun adattamento, nessuna versione «leggera»: rimando a un medico, come in L4.
- **Lista e diagnosi.** La lista è una domanda, non una spiegazione: l'app non collega mai un
  sintomo a una di quelle condizioni (L5).
- **Oggi, senza L1.** Scheda una tantum prima della prima serie di H1. Quando esisterà L1,
  diventa la sua domanda 8.
- **Testo della scheda «Prima della prima verticale».**
  - Corpo: *«La verticale si fa a testa in giù, e stare a testa in giù non va bene per tutti.
    Se hai la pressione alta, anche se è curata, glaucoma o un altro problema agli occhi, un
    problema alla testa o al collo, reflusso, se sei in gravidanza, o se un medico ti ha detto di
    evitare le posizioni a testa in giù, salta questo blocco e chiedine prima a un medico: io non
    posso valutarlo. Vale anche per il pike push-up, che porta la testa in basso.»*
  - Bottoni: **«Salta la verticale»** · **«Nessuna di queste, comincio»**.
  - Dopo «Salta»: *«Fatto: niente verticale e niente pike push-up finché non li riattivi dalle
    impostazioni. Non ti propongo un sostituto: quello lo decide chi ti conosce.»*
- **Cosa fa «Salta».**
  - H1 e S2 A1 escono dal piano, dai verdetti e dalle leve. Al posto di S2 A1, nel piano della
    Seduta 2: *«Pike push-up: fuori, come hai scelto prima della verticale. Non ti propongo un
    sostituto: lo riattivi dalle impostazioni quando un medico ti ha dato l'ok.»* Il testo di
    PROGRAM_RULES §6.4 parla di un attrezzo che manca: qui non vale.
  - Le durate si ricalcolano.
  - «Riattiva» nelle impostazioni ripropone la scheda.
  - Decisione registrata `inversioni:<data>`, con esito `ok` o `salta`, compresa nel backup.

**Nota prima del «Via»** (serie 1 di ogni H1), con la nota del gradino attuale:
- *«Fino al primo segno, mai a cedere: gomiti che si piegano, spalle che cedono, polsi che
  fanno male, pressione forte alla testa o agli occhi. Al primo, scendi: a testa in giù un
  cedimento è una caduta.»*
- *«Un metro e mezzo libero intorno: niente kettlebell né manubri a terra. Scalzo o con le
  scarpe, mai in calze. Volume acceso: il conto si sente, non si guarda.»*
- *«Se dopo la discesa la testa gira o la vista si annebbia, per oggi niente più verticale; se
  non passa in pochi minuti, chiedi aiuto.»* (L13)

**Note per gradino**: entrata e **uscita sicura**, mostrate solo al proprio gradino.
1. *«Mani a terra, a una gamba di distanza dal muro, dita aperte verso il muro. Appoggia i piedi
   al muro e sali camminando fino all'altezza delle anche, mentre le mani si avvicinano: spalle
   sopra i polsi. Per scendere, piedi giù un passo alla volta, poi ginocchia a terra.»*
2. *«Mani a una spanna dal muro, schiena verso il muro. Sali con uno slancio piccolo, una gamba
   alla volta: i talloni sfiorano il muro, non lo colpiscono. Per scendere, una gamba alla
   volta, come sei salito.»*
3. *«Parti come al gradino 1, poi sali con i piedi e avvicina le mani finché sono a una spanna
   dal muro, pancia verso il muro. Per scendere, allontana le mani e riporta giù i piedi, un
   passo alla volta.»*
4. *«Come al gradino 3. Stacca dal muro una gamba per volta, pochi secondi ciascuna: le spalle
   non si muovono. Si scende come al gradino 3, con tutte e due le gambe al muro.»*

**Polsi.** I polsi si caricano poco alla volta:
- le oscillazioni nel riscaldamento della S3;
- il mezzo giro di push-up della rampa;
- il gradino 1, che tiene in appoggio solo una parte del peso, a gambe orizzontali.
- **«Mi fa male»** al polso (L2) non esiste ancora (W-01). Fino ad allora l'unica uscita è la
  nota «polsi che fanno male ⇒ scendi».

**Cue di `verticale-al-muro`** (catalogo, T-48). Sostituiscono i cinque di oggi e valgono dal
gradino 1 al 4:
1. «Mani a larghezza spalle, dita aperte verso il muro: ci si corregge spingendo con i
   polpastrelli.»
2. «Braccia tese, spalle spinte verso le orecchie: spingi il pavimento lontano da te.»
3. «Testa fra le braccia e sguardo fra le mani; costole chiuse, la schiena non si inarca.»
4. «Errore tipico: tenere fino a cedere. A testa in giù un cedimento delle braccia è una caduta:
   si scende al primo segno.»
5. «Misura valida: il tempo si ferma al primo gomito che si piega o alla prima perdita di
   allineamento, non alla caduta.»

**Testi della revisione e della fine seduta** (`review.ts`, `progression.ts`, T-45; i numeri
vengono dal range):
- **Gradino 1, tutte sotto il minimo.**
  - Titolo: «Verticale al muro: sotto i <min>″ al gradino 1».
  - Prova: «<numeri> Sotto il minimo su tutte le serie, al gradino più basso della scala.».
  - Cambio: «Niente da cambiare: non c'è un gradino più facile e non c'è un test da rifare.
    Resta al gradino 1 e scendi al primo segno, senza forzare.».
  - Cautela: «Se i polsi o le spalle fanno male anche dopo la seduta, fermati e parlane con un
    medico o un fisioterapista.».
- **Gradino 4, al tetto** (`leve-finite`): «Verticale al muro: <max>″ pieni al gradino 4 in tutte
  le serie. Qui il blocco si ferma: la verticale libera, i gradini 5 e 6, chiede di saper uscire
  cadendo di lato, e non posso insegnartelo né controllarlo da un telefono. Resta al 4: se vuoi
  la verticale libera, impara l'uscita con un istruttore che ti guarda.»
- **Cautela di `sali-di-livello` sui blocchi in secondi** (vale anche per l'hollow hold): «Al
  gradino nuovo si riparte da <min>″: se non arrivano, scendi prima di cedere e scrivi il tempo
  vero. È normale perdere qualche secondo.» Oggi la cautela parla del «30-40% delle
  ripetizioni».
- **Fine seduta su H1**, al posto di «servono 3 serie complete»: «La verticale si giudica sulle
  ultime due sedute, nella revisione della settimana: oggi resta tutto com'è.»

#### 5 · Catalogo `[catalogo — PROPOSTA]`

- `verticale-al-muro`:
  - cue di §4;
  - nome del gradino 1 (D-25);
  - `contraindications` per quando il campo esisterà (W-02): «pressione alta, glaucoma o altri
    problemi agli occhi, problemi a testa o collo, reflusso, gravidanza, indicazione medica di
    evitare la testa in giù; dolore a polso o spalla. Se il dolore c'è anche a riposo o dura più
    di qualche giorno, parlane con un medico o un fisioterapista.»
- Esercizio nuovo `oscillazioni-polsi` (T-43):
  - nome «Oscillazioni dei polsi in quadrupedia»;
  - `pattern: null`, `primaryMuscles: []`, `secondaryMuscles: ['braccia']`;
  - `measurement: 'reps'`, `forbidden`;
  - cue:
    1. «In quadrupedia, mani sotto le spalle, dita aperte e in avanti, ginocchia sotto le anche.»
    2. «Porta le spalle avanti oltre i polsi e torna indietro, piano: il palmo resta tutto a
       terra.»
    3. «Errore tipico: caricare di colpo. Il peso cresce oscillazione dopo oscillazione.»
    4. «Se il polso fa male, fermati: non è un esercizio da portare oltre il fastidio.»
  - `videoQuery` «wrist warm up quadruped rocking».
- **Prerequisito futuro** (EXERCISE_SCHEMA §2, W-02). Spinta verticale 4 (HSPU al muro
  parziali) ⇐ verticale ≥ 3 con almeno 6 serie nel range. Chi fa HSPU al muro deve saper stare
  e uscire al muro. Oggi non si applica: è scritto perché la scala della S2 ci arriva.

#### 6 · Versioni

**programmi 2.6** (R24, R1 riga 3 rev. e ingresso) · **progressione 4.4** (R25) · **consigli 4.4**
(i testi di §4) · **limiti 1.7** (L15) · catalogo. Nessuna soglia esistente cambia; R25 stringe
(tetto di tenuta, tetto di gradino) e la riga 3 rev. stringe (parte più in basso). Allenta una sola
cosa, e solo sui blocchi `cappedHold`: «al tetto» vale «sopra» in revisione, senza la quale il
blocco non sale. Esito training-quality: da valutare.

### Da sviluppare (per la sessione principale): task con criteri di accettazione

**Ordine di rilascio — Bloccante.** T-42 non va in produzione da solo. Senza T-44…T-47 H1
partirebbe al gradino 2 (lo slancio), con il conto senza tetto, senza scheda delle
controindicazioni e senza note di uscita. Su Vercel ogni push è un rilascio: **T-42…T-48 in un
push solo**, dopo training-quality. T-49 è indipendente.

**T-42 — Blocco H1 nella Seduta 3, deviazioni, test dei dati** (`circuit.ts`, `deviations.ts`,
`circuit.test.ts`, `engine/circuit.ts` `groupLabel`)
- H1 come la tabella di §1, primo blocco di `SEDUTA_3`. `pauseTasks` della S3 `{ H: … }`.
  `groupLabel(S3, 'H')` = «Abilità».
- `BLOCCHI_AGGIUNTI` e `applicaDeviazioneMinuti` ⇒ `estimatedMinutes` della S3 = 39. La
  `DeviazioneNota` di `circuito-2` è tolta.
- Prove:
  - impronta S3 = `['H1 verticale-al-muro', 'A1 goblet-squat', …]`, le altre tre invariate;
  - gruppi della S3 `['H','A','B','F','Z']` con H = 1; le altre tre `['A','B','F','Z']`;
  - `estimatedSeconds(buildGuidedPlan(S3, 1)) − valore di oggi = 185` esatti (oggi 2.178 ⇒
    2.363); S1, S2, S4 invariate; tutte ≤ 2.400; la più corta è la 2, la più lunga è la 4 (test
    nuovo);
  - massimo R19 della S3 ≤ 3.300 s (atteso 52:35: i 49:30 di oggi più 185″);
  - volume: spalle 15,5, core 17,5, il resto uguale;
  - nota della S2 = testo della scheda; test «nessuna deviazione orfana» verde; L26.4: la più
    corta è la 2;
  - «esclude dalla revisione F e Z e nient'altro» invariato e verde (H1 è giudicata);
  - orologio dei giri A e B invariato (255/200 nella S3);
  - test richiesti dell'onboarding (R4) ancora 7;
  - `sharedMuscles` per (S2, S3) e (S3, S4) prima e dopo: i gruppi nuovi vanno nel rapporto di
    consegna.

**T-43 — Riscaldamento della S3 ed esercizio `oscillazioni-polsi`** (`exercises.ts`,
`circuit.ts`, `deviations.ts`, `exercise-art.ts`)
- Esercizio come in §5. Passo `{ label: 'Oscillazioni dei polsi in quadrupedia', exercise:
  'oscillazioni-polsi', seconds: 20, reps: 10, perSide: false, hint: 'Spalle avanti oltre i
  polsi e indietro, piano: il palmo resta a terra.' }` dopo `CIRCONDUZIONI`, solo nella S3.
- `DEVIAZIONI_RISCALDAMENTO`. Figura in `FIGURE_SENZA_IMMAGINE` finché Alessio non ne approva
  una (scheda in §5.2).
- Prove:
  - «stesso riscaldamento» verde, con l'eccezione dichiarata della S3;
  - «ogni passo cita un esercizio vero» verde;
  - «chiude con il giro di prova» riscritto come «del Tri-set A», verde in tutte e quattro;
  - `check:no-video-urls` verde.

**T-44 — Player: tenuta con tetto (R25)** (`ProgramBlock.cappedHold`, `GuidedSession.tsx`,
`engine/circuit.ts`)
- I punti 1-7 di §3. Si può riusare il componente di R21: per Z1 non cambia niente (le prove
  21.x restano verdi).
- La stima della serie di H1 è 25″.
- Prove, con timer finti:
  - nessuna partenza a fine recupero; «Via» ⇒ 5″ e poi 0;
  - segnali a 20, 25 e 30; il conto fermo a 30;
  - «Ho mollato» a 12,7″ ⇒ 12; a 0,6″ ⇒ niente;
  - lasciato correre 45″ e 120″ ⇒ la domanda; «Sì» ⇒ 30; «No» e «31» ⇒ «Registra» spento;
  - `tempoRespected` `true` da 20 in su, `false` sotto;
  - nessun valore > 30 in nessun percorso;
  - la nota prima del «Via» compare alla serie 1 di ogni H1.

**T-45 — Revisione e fine seduta su H1** (`review.ts`, `progression.ts`, `VariantPicker`)
- Sui blocchi `cappedHold`, «sopra» = «al tetto» (R10a riga 1). `maxLevel` letto da
  `adjacentLevel` e `varianteEsaurita` del blocco e dal `VariantPicker`. Uno stato sopra il 4
  si mostra al 4.
- I quattro testi di §4.
- Prove: H.3-H.8, H.11 e H.12 della tabella di §3, più due:
  - nessun verdetto propone 5 o 6 in H1, in nessuna sequenza di decisioni accettate;
  - il push-up S3 A2 e l'hollow hold B3 hanno gli stessi verdetti di prima a parità di
    diario.

**T-46 — R1 riga 3 rev., ingresso a 1, flag `headDown`** (`progressions.ts`, `progression.ts`)
- `headDown` su `handstand` 1-6 e `vertical-push` 1-6; un test lo tiene d'accordo con
  l'elenco.
- Riga 3 come in §2.
- Ingresso: finché manca una seduta chiusa con una voce di `circuito-3/H1`, il gradino mostrato
  e giudicato è quello di R1.
- Prove: H.1 e H.2; hip thrust ancora 2; il gradino iniziale del pike invariato (ha un test);
  tabella di R1 aggiornata.

**T-47 — L15: scheda «Prima della prima verticale», note per gradino, esclusione**
(`GuidedSession.tsx`, impostazioni, registro delle decisioni, `backup.ts`, `ProgramBlock`)
- La scheda e i bottoni di §4.
- `inversioni:<data>` registrata, con esito `ok` o `salta`, nel backup.
- Note per gradino: un campo nuovo, per esempio `levelNotes: Partial<Record<LevelIndex,
  string>>`; si mostra solo la nota del gradino attuale.
- Prove:
  - senza decisione, la prima serie di H1 non parte prima della scheda;
  - «Salta» ⇒ H1 e S2 A1 non sono in nessun piano, non hanno verdetti né leve; la Seduta 2
    mostra il testo del pike di §4; la S3 dura quanto senza H1, polsi compresi;
  - «Riattiva» ⇒ la scheda torna;
  - «ok» ⇒ la scheda non compare più;
  - la nota del gradino 2 non compare al gradino 1;
  - L12: nessun testo dell'atleta entra nel calcolo (la decisione è un bottone).

**T-48 — Catalogo della verticale** (`exercises.ts`, `progressions.ts`, `deviations.ts`,
`exercise-art.ts`)
- Cue di §4.
- Se D-25 = sì: gradino 1 «Verticale a L, piedi al muro», voce in `DEVIAZIONI_GRADINO`, test
  dei nomi aggiornato.
- `handstand-l1` va in `FIGURE_SENZA_IMMAGINE` («È la posa del pike push-up, non il gradino 1»)
  finché Alessio non approva la figura di §5.1. È una decisione del media lead: va chiesta prima
  del push.
- Prove: nessun cue della verticale contiene «lontane dalle orecchie»; `artFor('verticale-al-
  muro', 1)` non dà la posa del pike.

**T-49 — Nessuna salita a un gradino che cambia misura** (indipendente, Medio)
- Dato per gradino, la misura: per esempio `SCALE_MEASUREMENT`, con `core` = secondi 1-3 e
  ripetizioni 4-6. `adjacentLevel` di un blocco non attraversa un cambio di misura; tutte le
  altre scale restano senza cambi.
- Hollow hold al 3 tutto sopra 45″ ⇒ `leve-finite` con il testo: «Hollow hold: 45″ pieni in tutte
  le serie. Il gradino dopo, l'hanging knee raise, si misura a ripetizioni e non sta in questo
  blocco: qui le leve sono finite.»
- Il `VariantPicker` di S3 B3 offre i gradini 1-3.
- Prove:
  - nessun verdetto né leva porta S3 B3 al 4;
  - test di dati: in ogni blocco, il gradino proponibile più alto ha la misura dell'esercizio.

### Schede tecniche per le immagini (per exercise-media-lead)

Regole comuni come nel rapporto 2026-11-21c (§5): un atleta, l'attrezzo della scheda, nessun
testo né numero, nessun riferimento a immagini d'archivio (RepDB, termine 5), angoli con
tolleranza.

#### 5.1 Verticale al muro, gradino 1 — `handstand-l1` (gradino di partenza di S3 H1)

- **Dove.** S3 H1, 2 × 20-30″, gradino di partenza di tutti (R1 riga 3 rev.). Sostituisce la
  figura «da rifare» di oggi, che è la posa del pike push-up.
- **Gesto.** Tenuta isometrica in appoggio sulle mani, con i piedi al muro all'altezza delle
  anche. Il corpo fa una L capovolta: braccia e busto verticali, gambe orizzontali. Non è un
  pike push-up, non è una verticale completa, non è un plank orizzontale.
- **Attrezzo.** Un muro liscio e un pavimento piano, nient'altro. Mani a terra sul pavimento,
  non su un tappetino né su parallette.
- **Fotogrammi: 2.** Il punto che si sbaglia è la distanza delle mani dal muro.
  1. **Partenza**, il plank a mani alte contro il muro.
     - Plank sulle mani a braccia tese, spalle sopra i polsi, corpo in linea dalle caviglie alla
       testa.
     - Punte dei piedi a terra contro la base del muro; testa verso il lato opposto al muro.
     - Mani a larghezza spalle, dita aperte e rivolte verso il muro.
  2. **Tenuta a L.**
     - Mani a una lunghezza di gamba dal muro.
     - Polsi, spalle e anche sulla stessa verticale.
     - Gambe distese e orizzontali, piante dei piedi appoggiate al muro all'altezza delle anche.
     - Braccia tese, spalle spinte verso le orecchie (spalla aperta, braccio in linea col busto).
     - Testa fra le braccia, orecchie fra le braccia, sguardo al pavimento fra le mani; la testa
       non tocca terra.
     - Schiena dritta, nessun arco lombare.
- **Angoli chiave.**
  - Fotogramma 1: corpo dritto ± 10°; spalla sopra il polso ± 10°; gomiti distesi (≥ 175°).
  - Fotogramma 2:
    - linea polso-spalla-anca a ≤ 10° dalla verticale;
    - anca flessa a 90° ± 10°;
    - gambe a ≤ 10° dall'orizzontale;
    - gomiti ≥ 175°;
    - braccio-busto 170-180°.
- **Vista.** Laterale pura, con il muro di profilo sul bordo della figura. È l'unica vista che
  mostra insieme la L, l'allineamento verticale e l'altezza dei piedi.
- **Deve vedersi.**
  - Il muro.
  - I piedi sul muro all'altezza delle anche, non più su.
  - La verticale polso-spalla-anca.
  - Le braccia tese con le spalle alte.
  - La testa fra le braccia.
- **Non deve comparire mai.**
  - I piedi sopra le anche (verticale completa) o i piedi a terra nel fotogramma 2.
  - Le spalle dietro le mani, con la testa davanti alle mani: è la posa del pike push-up.
  - I gomiti piegati, la testa appoggiata o che regge peso, lo sguardo in avanti (collo
    iperesteso).
  - La schiena inarcata.
  - Un tappetino sotto le mani, parallette, un box, kettlebell o manubri nell'area.
  - Le calze.
- **Controllo di training-quality.**
  - Nel 2: anca 80-100°, verticale polso-spalla-anca entro 10°, gambe entro 10° dall'orizzontale,
    gomito ≥ 175°.
  - Nel 1: il corpo in linea.
  - In tutti e due: un muro solo e nessun altro attrezzo.

#### 5.2 Oscillazioni dei polsi in quadrupedia — `oscillazioni-polsi` (riscaldamento S3)

- **Dove.** Riscaldamento della S3, 10 ripetizioni in 20″, prima della verticale.
- **Gesto.** Mobilità dei polsi in estensione, con poco carico: le spalle oscillano avanti e
  indietro sopra le mani appoggiate.
- **Fotogrammi: 2.**
  1. **Centro.** Quadrupedia; mani sotto le spalle, a larghezza spalle, dita aperte e in avanti;
     ginocchia sotto le anche, schiena piatta, braccia tese.
  2. **Avanti.** Le spalle avanti oltre i polsi di circa una mano; il palmo resta tutto a terra;
     le ginocchia restano dove sono.
- **Angoli chiave.**
  - Fotogramma 1: braccio verticale ± 5°.
  - Fotogramma 2: braccio 15-25° davanti alla verticale; gomiti distesi; anca sopra il
    ginocchio ± 10°.
- **Vista.** Laterale pura.
- **Deve vedersi.** I palmi interi a terra; le spalle davanti ai polsi nel 2.
- **Non deve comparire mai.**
  - Le dita girate verso le ginocchia.
  - Il plank sulle punte dei piedi.
  - I pugni chiusi o le nocche a terra.
  - I gomiti piegati.
  - Un attrezzo.
- **Controllo di training-quality.** Nel 2 il braccio a 15-25° davanti alla verticale e il palmo
  a terra.

Priorità: **5.1 prima del push di T-42…T-48**, perché è il gradino di tutti al via. La 5.2 può
seguire: nel frattempo il passo resta senza figura.

### Rischi (sicurezza, dati)

- **R-27 · Caduta a testa in giù** (Alto senza attenuazioni → Basso con).
  - Il rischio: braccia che cedono, testa a terra; slancio troppo forte al gradino 2.
  - Attenuazioni:
    - gradino 1 al via, che si sale e si scende camminando;
    - tetto di tenuta a 30″;
    - «mai a cedere», con i segni di arresto;
    - uscita scritta per gradino;
    - spazio libero, niente calze;
    - tetto di gradino 4.
  - **Se T-42 esce senza T-44…T-47 torna Alto**: vedi l'ordine di rilascio.
- **R-28 · Polsi** (Basso). Oscillazioni nel riscaldamento e gradino 1 a carico parziale. Manca
  ancora «Mi fa male» (L2, W-01).
- **R-29 · Controindicazioni senza L1.**
  - Basso per Alessio, che risponde alla scheda una volta.
  - Medio per il pubblico finché L1 non esiste: la scheda è un'autodichiarazione, non uno
    screening.
- **R-30 · Conto sovrastimato** (Basso). Si tocca il telefono dopo essere scesi: 1-3″ di uscita
  possono far contare come 30 una tenuta da 27-29″. Al massimo anticipa una salita di una coppia;
  R7 e R13 restano.
- **R-31 · Audio.** A testa in giù il conto si sente, non si guarda. Se il telefono in silenzioso
  non suona i bip, l'atleta non sente il «Scendi» (domanda aperta 3). Il conto fermo a 30 limita
  comunque il valore, non il tempo a testa in giù.
- **R-32 · Interferenza** (Basso). Le spalle arrivano al push-up S3 A2 con due tenute submassimali
  di qualche minuto prima. I numeri del push-up possono scendere un poco, e lo stesso modo ogni
  settimana.
- **R-33 · Hollow hold → hanging knee raise** (Medio, latente, T-49). Scatta con due Sedute 3 di
  fila con tutte le serie sopra 45″.
- **R-34 · «Salta» toglie anche S2 A1.** È la direzione prudente: il pike porta la testa in
  basso quanto il gradino 1. Va detto ad Alessio prima che risponda (D-24).
- **Dati.**
  - Un record nuovo nel registro delle decisioni (`inversioni:<data>`); nessuna migrazione.
  - Lo stato di `verticale-al-muro` è condiviso con lo Shadow: l'ingresso a 1 non lo cancella,
    lo ignora fino alla prima H1.
  - Nessun testo dell'atleta entra in un calcolo: il «No» di T-44 è un campo numerico.

### Decisioni per Alessio

**D-24 · Dove va la verticale.**
- Opzioni:
  - (a) in apertura della **Seduta 3**, 2 serie, prima del goblet squat. La seduta arriva a
    39:23;
  - (b) in apertura della Seduta 2, prima del pike push-up. Arriva a 40:00 esatti e sfora il
    tetto di 55′ quando tempo e pausa si accumulano;
  - (c) in tutte e due.
- **Raccomando (a).** È la seduta più corta, apre con le gambe e non con una spinta sopra la
  testa, e la nota della Seduta 2 torna vera.
- Una conseguenza da sapere prima: la prima volta l'app chiede se hai pressione alta, problemi
  agli occhi, a testa o collo, o reflusso. Se rispondi «salta», escono la verticale e il pike
  push-up.

**D-25 · Il gradino 1.**
- Il foglio dice «Plank a mani alte contro il muro». Lo leggo così: mani a terra, piedi al muro
  all'altezza delle anche, corpo a L, spalle sopra i polsi. Ci si arriva dal plank, camminando
  con i piedi sul muro.
- È quello che intendevi?
- **Raccomando di sì**, e di rinominarlo «Verticale a L, piedi al muro» (deviazione
  dichiarata). Il nome di oggi si può leggere in tre modi:
  - plank orizzontale;
  - mani in alto sul muro;
  - questo.

  Il disegno deve mostrarne uno solo.

**D-26 · Verticale libera fuori dall'app.**
- Il blocco si ferma al gradino 4 (al muro, una gamba staccata). I gradini 5 e 6 (verticale
  libera) l'app non li propone e in questo blocco non li offre nemmeno a mano.
- **Raccomando di sì.** Si esce cadendo di lato con una ruota, e da un telefono non posso
  insegnarlo né controllarlo.

Mie scelte, reversibili senza costi di dati:
- 2 serie invece delle 3 dello Shadow;
- 20-30″ invece di 30-45″;
- i polsi solo nella Seduta 3;
- `headDown` esteso al pike push-up.

### Domande aperte

1. **(training-quality)** S7 («nessuna dose sopra il misurato») su un blocco senza test (R1 riga 3
   rev., come l'hip thrust): bastano gradino 1, tetto a 30″ e «fino al primo segno»? Oppure
   serve che la prima seduta di H1 valga come misura, con R25 come unica uscita?
2. **(exercise-media-lead)** `handstand-l1` può andare in `FIGURE_SENZA_IMMAGINE` nello stesso
   push di T-42…T-48, finché la figura di §5.1 non è approvata? Lo stesso per
   `oscillazioni-polsi`.
3. **(sessione principale)** I bip del player suonano con il telefono in silenzioso (Web Audio su
   iOS segue l'interruttore)? Se no, la nota prima del «Via» deve dire «togli il silenzioso», e
   T-44 deve verificarlo nello smoke.
4. **(release-gate)** Il controllo lessicale di L5 non deve far fallire la scheda di L15, che
   nomina glaucoma e reflusso come domanda. Va in un file escluso dalla ricerca, o la lista dei
   termini non li contiene?
