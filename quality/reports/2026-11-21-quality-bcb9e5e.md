# training-quality · 2026-11-21h · `bcb9e5e` contro `9c62f84`

### Riepilogo ed esito rispetto alle soglie

**GO per il push di `bcb9e5e`.** Il commit chiude **B20** (Bloccante, era già in produzione). Non introduce né
peggiora nessun Bloccante o Alto (eccezione «non peggiorati», approvata il 2026-11-16). L'app resta **NO-GO**: B6, B8,
M4 più i 4ᵖ, e gli Alti A10 e A16.

- **B20 chiuso, su tutti e due i player.** `28` (nuovo) riprende 27.12-27.14 e 27.16-27.22 con la composizione nuova.
  - Dopo ogni cambio a 0 kg il campo parte da 0 kg e la chiusura tiene lo stato a 0 kg. Le vie sono B18, R9b, salita,
    leva variante e selettore (stessa seduta e seduta dopo).
  - Esito: le 15 righe 28.12-28.22 sono OK su `bcb9e5e`. Su `9c62f84` 12 sono NO; i 3 positivi (28.14, 28.21, 28.22)
    sono OK su tutte e due le radici.
  - Allo stesso gradino, al 6, la volta scorsa arriva ancora al campo (28.30).
  - I manubri non cambiano (28.32-28.34). L'unico `allowed` senza scala tiene i suoi kg (28.35).
  - Griglia sui 16 `allowed` con scala, 8.064 campi: nessun campo sopra il massimo fra stato e volta scorsa. A
    gradino diverso il campo è sempre lo stato: 0 eccezioni (2.304 in produzione).
- **`27` su `bcb9e5e`.**
  - 27.1-27.9 OK, come su `3c4a8d7`; 27.10 INFO (L46).
  - 27.11-27.22 sono INFO «composizione non riconosciuta». `27` conosce solo la composizione vecchia: lo sostituisce
    `28`.
  - Su `9c62f84` l'uscita è identica alla misura g (16 NO).
- **Nucleo v16 per intero.** `bcb9e5e`: 3 PASS · 3 FALLITI · 2 NON COPERTI. `9c62f84`: identico alla misura g, byte
  per byte.
  - Su `bcb9e5e` il caso 4 fallisce **solo** perché il controllo dice «composizione non riconosciuta: controllo da
    riscrivere», in 4j e 4o (viii). È un modello da aggiornare, non un FALLITO da contare.
- **Nucleo v17** (4j e 4o viii riconoscono `kgDellaVoltaScorsa`, più un positivo nuovo). `bcb9e5e`: **4 PASS · 2
  FALLITI · 2 NON COPERTI**, caso 4 PASS. `9c62f84`: 3 · 3 · 2, con un'uscita identica byte per byte alla v16.
  - Positivi su copie mutate di `bcb9e5e`:
    - guardia tolta (`return kg`): viii ×2;
    - guardia che azzera sempre: il positivo nuovo dice «la fixture non misura».
  - **La v17 non è committata.** Se il gate esegue il file committato (la v16), su `bcb9e5e` ottiene il caso 4
    FALLITO (domanda 1).
- **Storico vecchio senza `level`: non è un problema.** Il campo si abbassa, non si alza mai, e il caso non nasce dai
  percorsi dell'app (sezione dedicata sotto).
- **Nuovi Bassi:** L47 (con lo stato assente i due player non danno lo stesso numero), L48 (documentazione).
- **verify** sulla copia di `bcb9e5e`: 986 test in 43 file, verdi; URL video puliti.
- **Smoke e offline:** la sessione principale li dichiara verdi; io non li ho eseguiti, quindi per me sono NON
  COPERTI. **Browser:** NON COPERTO (vincolo del brief).

| Soglia | Esito |
|---|---|
| Bloccanti = 0 | no: 3 + 4ᵖ (B6, B8, M4). **B20 chiuso**; nessuno introdotto o peggiorato |
| Alti = 0 | no: 2 (A10, A16), invariati |
| C1-C8 | invariati dalla misura 2026-11-21g, salvo C1: B20 chiuso |

### Oggetto

- **Commit.**
  - `bcb9e5e` (HEAD). Sopra `9c62f84` (produzione) ci sono anche `3c4a8d7` (L42) e `fa0eee6` (rapporto).
  - `diff -rq` di `src/` fra le due radici: `draft.ts`, `draft.test.ts`, `GuidedSession.tsx`, `SessionScreen.tsx`.
- **`bcb9e5e`.**
  - `kgDellaVoltaScorsa(exercise, passato, kg, livelloOggi)` in `src/engine/draft.ts`. Per gli `allowed` vale
    `passato.level === livelloOggi ? kg : 0`; per tutti gli altri esercizi, `kg`.
  - Il player guidato la chiama col gradino di oggi `contesto.states.get(slug)?.level ?? stazione.gradino`.
  - `SessionScreen` la chiama con `exerciseState?.level ?? null`.
- **Regole, catalogo e figure.** Invariati: progressione 4.3, consigli 4.3, limiti 1.6 PROPOSTA (R23), catalogo 72.
- **Immagini.** Nessuna in esame.
- **Dove ho misurato.** Copie `git archive` nuove in `/tmp/claude-0/-home-user-Training/24e1260e-eabf-5fa5-a9f5-1a45e3602775/scratchpad/g-bcb9e5e`
  e `/tmp/claude-0/-home-user-Training/24e1260e-eabf-5fa5-a9f5-1a45e3602775/scratchpad/g-9c62f84`, con `node_modules` collegato. Mai dal tree
  principale. Gli script sono copiati dal file di lavoro in tutte e due.
- **Versioni del nucleo.** La v16 è quella committata in `fa0eee6`. La v17 è nel file di lavoro
  `quality/scripts/safety-core.mts`, copiata nelle radici come `safety-core-v17.mts`.

### Risultati per criterio della griglia, con confronto con la misura precedente

- **Sicurezza (C1).**
  - **B20 chiuso.** Su tutte e cinque le vie di R23 il campo parte da 0 kg sotto il gradino nuovo, nei due player.
    Lasciato così, la chiusura tiene `{L, 0 kg}` (28.12-28.20).
  - Il positivo «peso portato a 0 a mano» è OK (28.14).
  - Al 6, con 7,5 kg accettati, il campo parte dallo stato (A18, 28.22).
  - Proprietà sulla griglia (28.40-28.41). Il campo non supera mai il massimo fra stato e volta scorsa. Con il gradino
    della volta scorsa diverso da quello di oggi, il campo è lo stato.
  - **Scostamento possibile, non deciso (28.31, INFO).** Sotto il 6, allo stesso gradino, i kg scritti a mano la
    volta scorsa si ripropongono (trazioni `{5, 0 kg}`, volta scorsa al 5 con 5 kg: il campo dice 5). La chiusura li
    mette nello stato: `{5, 5 kg}`.
    - Come in produzione: è la domanda (b) al designer, ancora aperta.
    - Non lo conto come difetto finché la regola non è decisa.
  - Gli altri limiti sono invariati: S1-S4 e S7 come il 2026-11-21g, S6 assente (M4).
- **Rimandi (C2).** = (B1-B4ᵖ).
- **Fedeltà (C3).** Dopo un cambio, il testo «la zavorra si toglie» e il campo Peso a 0 kg ora dicono la stessa cosa:
  l'incoerenza contata dentro B20 non c'è più.
- **Coerenza (C4), personalizzazione (C5), concretezza (C6).** = (A16).
- **Analisi dei progressi (C7).** = 100%: il `src/` delle metriche è identico.
- **Durata (C8).** = (nessun piano cambiato).
- **Input non fidato.** La guardia legge `level` e `loadKg`, che sono campi numerici. Nessun testo libero entra nel
  calcolo: caso 7 PASS su tutte e due le radici.
- **Altri script che leggono la composizione.** `17` e `18` D19.19 riconoscevano solo la composizione vecchia. Su
  `bcb9e5e` davano «DIVERSO» con gli stessi numeri (12 / 12). Aggiunta la composizione nuova: le uscite su `bcb9e5e`
  sono identiche a quelle su `9c62f84`, e su `9c62f84` non cambiano. Resta in tutte e due una riga diversa nota
  (M22.6r).

#### Storico vecchio senza `level` sulle voci: perde la precompilazione, ma non è un problema

- **Cosa succede** (28.36 con `level: null`, 28.37 con la chiave assente). Trazioni al 6, volta scorsa con 5 kg:
  - con lo stato `{6, 0 kg}` il campo dice 0 kg nei due player (prima della guardia diceva 5);
  - con lo stato `{6, 5 kg}` il campo dice 5 kg, cioè lo stato, come prima.
- **Sicurezza.** Non è un problema: la guardia porta solo verso 0, mai sopra (28.40), quindi S1 e S5 sono rispettati.
- **Il caso non nasce dai percorsi dell'app.**
  - `level` è nel tipo `LoggedExercise` dal primo commit (`5fdc99f`, 2026-09-10), e `buildDraftSession` lo scrive da
    allora (`state?.level ?? exercise.defaultLevel`).
  - Il ripristino da backup rifiuta una voce senza `level`, perché `expectNullableLevel` vuole un numero o `null`.
  - Firestore riceve quello che Dexie aveva.
  - `level: null` compare di proposito solo in due casi:
    - sull'unico `allowed` senza scala (`dip-panche-o-diamond-pushup`): lì il gradino di oggi è `null` e i kg restano
      (28.35 OK);
    - su `setBlockExercise` (alternativa scelta), latente perché il circuito ha 0 alternative (L7).
- **Quando costerebbe qualcosa.** Ci vogliono tre condizioni insieme: lo stato a 0 kg, la volta scorsa con kg e la
  voce senza gradino.
  - Dal 2026-09-19 (`b0b5a64`) ogni chiusura con kg li scrive nello stato, quindi il campo parte dallo stato e la
    «porta di servizio» non serve.
  - Il costo massimo è un campo da riscrivere una volta. Se l'atleta al 6 non lo riscrive, la chiusura salva 0 kg e
    la zavorra riparte da zero: direzione prudente, con progresso perso.
  - Non apro un difetto per questo. Non ho i dati di Alessio: se qualche sua voce sia senza gradino resta NON COPERTO.

### Difetti

**Bloccante**

- Nessuno nuovo. **B20 chiuso** (sopra).

**Alto**

- Nessuno nuovo. Restano A10 e A16, invariati.

**Medio**

- Nessuno nuovo.

**Basso**

- **L47 (nuovo, introdotto da `bcb9e5e`, latente). Con lo stato assente, i due player confrontano la volta scorsa con
  due gradini di oggi diversi.**
  - **Scenario.** P3, trazioni `circuito-1/A1` senza stato salvato; la volta scorsa è al 3 (gradino di default) con
    5 kg.
  - **Ottenuto.**
    - Il player guidato usa `stato.level ?? stazione.gradino`, cioè il gradino della bozza (3): il campo parte da
      5 kg.
    - `SessionScreen` usa `exerciseState?.level ?? null`: il campo parte da 0 kg.
    - Su `9c62f84` i due player davano 5 / 5.
  - **Atteso.** Lo stesso numero nei due player, per la stessa regola.
  - **Perché è Basso.** Le due direzioni non superano quello che l'atleta ha scritto. Il 5 sotto il 6 allo stesso
    gradino è la domanda (b). Il caso è latente: dal 2026-09-19 una chiusura con kg crea lo stato, e `SessionScreen`
    apre solo le sedute fuori circuito.
  - **Misura.** `28` 28.38 (NO su `bcb9e5e`, OK su `9c62f84`).
- **L48 (nuovo). Documentazione di `pesoIniziale` staccata dalla sua funzione.**
  - **Dove.** `src/engine/draft.ts`, circa righe 463-493.
  - **Cosa.** `kgDellaVoltaScorsa` è stata inserita fra il JSDoc di `pesoIniziale` (A18, R14d, R-7) e la funzione.
    Ci sono due JSDoc di fila, e `pesoIniziale` resta senza la spiegazione di R-7.
  - **Commento impreciso.** Il commento nuovo dice «sui manubri vale sempre». Il codice restituisce i kg per ogni
    esercizio non `allowed`, `forbidden` compreso: oggi è innocuo.

**Restano aperti** (testo in `quality/RESULTS.md`):

- **B1ᵖ** Nessun rimando sul dolore dichiarato.
- **B2ᵖ** Nessun campo né rimando per una condizione medica dichiarata.
- **B3ᵖ** Nessuna soglia né rimando sui segnali di rapporto problematico con cibo e corpo.
- **B4ᵖ** Nessuna verifica dell'età, nessuna decisione sui minorenni.
- **B6** Nessun modello dell'attrezzatura: 37 blocchi su 52 senza alternativa.
- **B8** L'app serve figure zero approvate: 255 file nel bundle, 0 approvati.
- **M4** (Bloccante) Nessun adattamento al rientro dopo una pausa lunga (S6; R9 rimandata, `rientro` sempre `null`).
- **A10** `review.ts` scarta in silenzio l'entrata il cui esercizio non coincide con quello del blocco.
- **A16** C4, C5 e C6 sotto soglia insieme valgono un Alto.
- Medi 12, Bassi 33 (+L47, +L48).

### Esito della verifica delle immagini

Nessuna immagine in esame in questo giro. Il caso 6 del nucleo è invariato: 255 file nel bundle, 0 approvati (B8).

### Ipotesi di correzione

- **L47, per training-designer (regola) e per la sessione principale (codice).** Usare in tutti e due i player lo
  stesso «gradino di oggi».
  - La scelta coerente con A11 è il gradino a cui la serie viene scritta. `buildDraftSession` confronta l'etichetta
    con `state?.level ?? exercise.defaultLevel`.
  - In `SessionScreen` basterebbe passare `gradinoAttuale` (`logged?.level ?? exerciseState?.level ?? null`) invece
    di `exerciseState?.level ?? null`.
  - L'alternativa prudente, cioè 0 a stato assente in tutti e due, dipende dalla domanda (b).
- **L48, per la sessione principale.** Rimettere il JSDoc di R-7 sopra `pesoIniziale`. Nel commento di
  `kgDellaVoltaScorsa` scrivere «per ogni esercizio che non è `allowed`», oppure limitare il codice agli `inherent`.
- **Per il gate.** La v17 del nucleo, perché la v16 su `bcb9e5e` non riconosce la composizione.

### Decisioni per Alessio

- **Nessuna nuova decisione chiesta.** Il GO per il push vale con la regola approvata: B20 si chiude e non entra
  niente di Bloccante o Alto.
- **Da sapere.**
  - Sotto il 6, allo stesso gradino, i kg scritti a mano si ripropongono ancora (domanda (b) al designer).
  - Se il designer risponde «0 anche allo stesso gradino», è un cambio di regola, da misurare con `28` 28.31.
- **Invariate.**
  - In attesa: V-LEVE, D5 in C8 (v4), convenzioni GRID, D-Q1. D-Q2 superata, da chiudere.
  - Non decisi: B6, B8, D-12…D-15, D-17, D-18, R4.

### Domande aperte

1. **(release-gate, sessione principale) Versione del nucleo.**
   - La v17 (`quality/scripts/safety-core.mts`: 4j e 4o viii riconoscono `kgDellaVoltaScorsa`, più un positivo) è
     nel file di lavoro e non è committata: io non faccio commit.
   - La v16 committata, su `bcb9e5e`, dà il caso 4 FALLITO per «composizione non riconosciuta: controllo da
     riscrivere», che non è una violazione.
   - Il gate la copia nella radice `git archive`, come ho fatto io, o si committa prima?
   - Su `9c62f84` la v17 dà la stessa uscita della v16.
2. **(training-designer) B20.**
   - (a) Confermi la regola «i kg della volta scorsa valgono solo allo stesso gradino»? È quella che `bcb9e5e`
     implementa.
   - (b) Allo stesso gradino sotto il 6, i kg scritti a mano dall'atleta la volta scorsa vanno riproposti nel campo?
     Oggi lo sono, e la chiusura li mette nello stato (28.31). Oppure il campo parte da 0, perché «sotto il 6 nessun
     kg prescritto dall'app»?
3. **(training-designer) L47.** Con lo stato assente, qual è il «gradino di oggi» per la guardia?
   - Il gradino della bozza (`defaultLevel`), come fa il player guidato e come fa A11 per l'etichetta?
   - Oppure nessuno, con il campo a 0, come fa `SessionScreen`?
4. **(training-designer) L46.** Un ritorno al gradino di partenza, nella stessa seduta e nello stesso selettore, è un
   cambio a mano (D-23 e R23), o lo stato torna quello dell'apertura?
5. **(sessione principale o release-gate) Il positivo di 21.14** (lo smoke deve fallire con la partenza automatica)
   non l'ha eseguito nessuno. Si esegue una volta su una copia con la partenza automatica, o resta NON COPERTO?
6. **(training-designer) L44 (a).**
   - Con un ritest migliore fatto lo stesso giorno prima della seduta, su uno stato mai salvato, T-39 fissa lo stato
     sotto il gradino che l'atleta ha fatto quel giorno, senza testo né proposta. Esempio: trazioni con la seduta al
     3 e lo stato all'1.
   - La specifica dice che l'unico scarto è il ritest peggiore.
   - Lo accetti come secondo scarto, o lo stato dello stesso giorno va fissato sul gradino scritto nella seduta?
7. **(training-designer) L44 (b).**
   - Il ripiego sullo stesso giorno fissa sopra il gradino eseguito (1 → 3), quando il test è venuto dopo la seduta e
     non ci sono risultati precedenti.
   - Confermi che R4 punto 2 rende impossibile una seduta senza nessun risultato di quel test, anche per un test
     aggiunto al catalogo dopo l'onboarding?
8. **(exercise-media-lead) L45 e L35.**
   - Le quattro righe «da rifare» di `horizontal-pull-l2`, `l4`, `l5` e `l6` vanno a «ritirata»?
   - Le SVG nascoste con il titolo «agli anelli» su un disegno con la cinghia del TRX restano nel bundle così?
9. **Restano aperte, invariate dal 2026-11-21e:**
   - **(sessione principale, dopo il gate)** La ricetta del browser di `23` su `644bd8c` non è stata eseguita.
     - Gli attesi A-D e i cinque punti R9b sono nel rapporto `2026-11-21-quality-644bd8c.md`, domanda 1.
     - Per B18 in `ReviewScreen`, «Applica» su `scendi-di-livello` dal 6 con 5 kg deve scrivere `[5,0,0,0]`.
     - Per me resta NON COPERTA.
   - **(sessione principale)** Perché la migrazione è arrivata tardi nel browser il 2026-11-21c? La causa non è
     spiegata; la fase D di `23` la misura.
   - **(sessione principale)** `SettingsScreen` monta `useAuthStatus`, che rifà `attachUser` a ogni visita.
     Preesistente, non misurato.
   - In quale settimana è Alessio, e quando arriva il suo primo ritest con R9b?
   - Come si dividono i suoi stati fra salvati e virtuali? NON COPERTO: non ho accesso ai dati.
   - La domanda 5 del designer: a che gradino è Alessio sul rematore, e con quali bonus? Dice quanto conta R-23.
     Dice anche se B20 lo tocca: usa la zavorra? E ha voci senza gradino nello storico (sezione sullo storico)?
   - Dal 2026-11-21d:
     - la 2: su quale albero il gate rifà gli smoke di 20.8, 21.2-21.7 e 21.12;
     - la 4: la prova vitest di 21.9 confronta verdetti e `setsCounted`, non volume e Progressi;
     - la 5: A19 sul numero nuovo, il circuito 1 a 39′.
   - Le 6 domande e le 3 dubbie del media lead del 2026-11-21 (`2026-11-21-quality-50793fd.md`).
10. **Chiuse in questo giro.**
    - La mia domanda 3 del 2026-11-21g (B20, «la correzione arriva da sola?»): è arrivata in `bcb9e5e`.
    - La mia domanda 4 del 2026-11-21g (v16 non committata): la v16 è committata in `fa0eee6`; ora la stessa
      domanda vale per la v17 (domanda 1).

**Dettagli e uscite.**

- Script in `quality/scripts/`:
  - `28-b20-peso.mts`, nuovo;
  - `safety-core.mts` v17;
  - `17-b2.mts` e `18-c.mts`, D19.19 con la composizione nuova.
- Uscite in `/tmp/claude-0/-home-user-Training/24e1260e-eabf-5fa5-a9f5-1a45e3602775/scratchpad/`:
  - `v16-bcb9e5e.txt`, `v16-9c62f84.txt`, `v17-bcb9e5e.txt`, `v17-9c62f84.txt`;
  - `q27-bcb9e5e.txt`, `q27-9c62f84.txt`, `q28-bcb9e5e.txt`, `q28-9c62f84.txt`;
  - `q17-*.txt`, `q18b-*.txt`;
  - `verify-bcb9e5e.log`.
