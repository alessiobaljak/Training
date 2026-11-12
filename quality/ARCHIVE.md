# ARCHIVE.md — voci spostate dai file principali di /quality/

Niente qui è riaperto o richiuso per il fatto di essere qui: sono registri
più vecchi delle ultime 10 voci, spostati per il limite delle 300 righe.

## Da IMAGES.md (spostate il 2026-11-12)

Verifiche del 2026-11-08 e del 2026-11-09b, testo integrale. La figura
`hip-thrust-panca-bilaterale.svg` del 2026-11-09b è stata **rifatta** in
`47c7f6d` e riverificata il 2026-11-12 (IMAGES.md).

## 2026-11-09b · `src/assets/exercises/hip-thrust-panca-bilaterale.svg`

**Esito: SCARTATA.** Verifica provvisoria (§0.2: la scheda non ha `equipment`
né `frames`). Scheda: `hip-thrust-panca-bilaterale`, gradino 2 della scala
`hip-thrust`. Render: `reports/immagini/2026-11-09-hipthrust.png` (4 col /
230 px), `...-hipthrust-460.png` (2 col / 460 px sui dubbi).

| # | punto | esito |
|---|---|---|
| 1 | Corrispondenza | **PROBLEMA** — nessun braccio, nessuna mano; il cue 2 dice «tenuto con le mani». L'`aria-label` dice «spalle sulla panca», il disegno appoggia la testa sopra un blocco |
| 2 | Archetipo | **PROBLEMA** — la seconda gamba è sfalsata di 2 unità su una tela da 210 (`58,84 78,78 86,100` contro `58,84 76,81 84,100`): a 210 px fonde nella prima, e accanto al monopodalico le due figure sono lo stesso disegno |
| 3 | Anatomia | OK |
| 4 | Tecnica | **PROBLEMA** — in chiusura l'anca (y 56) sta 18 unità sopra il ginocchio (y 74): rampa, non piano. È l'iperestensione che il cue 4 chiama errore tipico |
| 5 | Attrezzo | **PROBLEMA** — la «panca» è un rettangolo 26×52 in piedi, toccato solo dalla testa. La campana invece si legge (cerchio + manico) |
| 6 | Coerenza | OK |
| 7 | Pulizia | **PROBLEMA** — freccia dentro l'immagine: `M 78 72 L 78 58 M 74 63 L 78 58 L 82 63`. Da sola basta a scartare |
| 8 | Leggibilità | **PROBLEMA** — a 230 px non si distingue dal monopodalico |

Scarto per §2: archetipo (2) e tecnica (4) ⇒ `da rifare` senza discussione;
pulizia (7) ⇒ `da rifare` sempre.

**Convergenza.** `exercise-media-lead` aveva già registrato questa figura come
`da rifare` (`media/LIBRARY.md` riga 36, 2026-11-09) con quattro dei cinque
rilievi. Il quinto è mio e va aggiunto al suo registro: **la panca disegnata
come blocco verticale è la causa geometrica della rampa del punto 4** —
correggere la panca corregge due punti insieme. La figura è stata **pubblicata
in `src/assets/` dopo essere stata respinta** (difetto B8).

Non guardate in questo giro: le altre 15 figure nuove del commit `f63c9f1` e la
modifica a `curl-martello-manubri.svg`. Nessuna dichiarazione su di loro.

## 2026-11-08 · `test-fixtures/passo-7/stacco-schiena-curva.svg`

**Esito: SCARTATA.**
Scheda di riferimento: `stacco-rumeno-manubri` (`src/data/exercises.ts`).
Render: `reports/immagini/2026-11-08-passo7-p1.png` (primo passaggio),
`reports/immagini/2026-11-08-passo7-p2-dubbi.png` (secondo passaggio).

| # | punto | esito |
|---|---|---|
| 1 | Corrispondenza con la scheda | **PROBLEMA** |
| 2 | Archetipo | **PROBLEMA** |
| 3 | Anatomia | **PROBLEMA** |
| 4 | Tecnica | **PROBLEMA** |
| 5 | Attrezzo | OK |
| 6 | Coerenza | **PROBLEMA** (minore) |
| 7 | Pulizia | OK |
| 8 | Leggibilità | OK |

Regola §2 della checklist: un solo PROBLEMA su archetipo, anatomia o tecnica
basta e non si media. Qui sono tre.

**4 — Tecnica (il difetto principale).** Il secondo fotogramma disegna la
colonna come un arco: `path d="M 31 57 Q 44 44 58 56"`. Spalla (31,57) e anca
(58,56) sono quasi alla stessa altezza — tronco orizzontale — e il punto di
controllo a y=44 sta *sopra* la corda, quindi la convessità è verso l'alto, che
su un tronco orizzontale significa **schiena arrotondata in flessione**. La
scheda la chiama per nome: «Errore tipico: … arrotondare la lombare per
scendere di più», e «il punto di arrivo lo decide la schiena neutra». La figura
mostra l'errore nominato nei cue, non il gesto.

**4 — Tecnica, secondo punto.** Anca (58,56) → ginocchio (70,80) → caviglia
(56,100): la tibia è inclinata di circa 35° sulla verticale e il ginocchio è
avanti rispetto alla caviglia di 14 unità. Il cue dice «le tibie restano
verticali» e «Errore tipico: piegare le ginocchia e trasformarlo in uno squat».

**3 — Anatomia.** Testa (24,62) e spalla (31,57) stanno a x basso: la figura
guarda a sinistra. Il ginocchio (x=70) sporge *dietro* sia l'anca (x=58) sia la
caviglia (x=56): il ginocchio è piegato nel verso opposto a quello naturale, e
a 460 px le gambe si leggono come una «>» con il vertice dietro il corpo. La
lettura alternativa — figura rivolta a destra — non salva niente: sarebbe un
tronco piegato all'indietro sopra i talloni, che non è questo esercizio.

**2 — Archetipo.** Tronco a 90°, schiena curva, ginocchia avanti e manubri a
y=88 con la caviglia a y=100, cioè il carico quasi a terra: il composto legge
come uno stacco da terra tirato di schiena, non come uno stacco rumeno, che
scende a metà tibia per flessione d'anca con la schiena neutra. È il difetto
che la checklist mette per primo: figura pulita, esercizio sbagliato.

**1 — Corrispondenza con la scheda.** `aria-label` e `<title>` dichiarano
«Stacco rumeno: in piedi, poi **discesa con la schiena curva**»: l'immagine
annuncia da sola di mostrare l'errore, sotto il nome dell'esercizio. Se questa
figura entrasse nella libreria, chi legge il titolo vedrebbe l'errore e
copierebbe quello — e lo copierebbe con un carico in mano e la colonna in
flessione.

**6 — Coerenza (minore).** La libreria disegna l'arto lontano con
`stroke-width="2"` e quello vicino con `3`, per dare profondità (lo fa la
figura in uso in entrambi i fotogrammi). Qui tutti gli arti sono a `3`: le due
gambe e le due braccia si appiattiscono su un piano solo. Da sola questa
sarebbe una riserva, non uno scarto.

**Nota di metodo (§0.2 della checklist).** La scheda di
`stacco-rumeno-manubri` è incompleta rispetto a `training/EXERCISE_SCHEMA.md`
— mancano `equipment` e `frames`, come su tutti e 56 gli esercizi — quindi
qualunque verifica oggi è **provvisoria** e nessuna immagine può andare in
«approvata». Questo non attenua lo scarto: un difetto di tecnica, anatomia e
archetipo si giudica sui cue, che ci sono e sono espliciti.

### La figura in uso nell'app passa?
`src/assets/exercises/stacco-rumeno-manubri.svg`: **sì, 8 punti su 8 OK** —
ma per §0.2 il suo stato resta *verificata provvisoria*, non approvabile,
finché la scheda è incompleta.
Secondo fotogramma: tronco disegnato come **segmento retto** (32,50 → 60,62),
cioè colonna neutra; ginocchio (62,82) in mezzo tra anca (60,62) e caviglia
(60,100), con la tibia fuori dalla verticale di circa 6°, cioè verticale;
anche portate indietro; manubri a y=81 con il ginocchio a y=82, cioè all'altezza
del ginocchio e lungo le gambe. Corrisponde ai cue 1, 2, 3 e 5 della scheda.
I due manubri si leggono come due anche a 230 px, non c'è testo né freccia, e
la convenzione dello spessore sugli arti lontani è rispettata in entrambi i
fotogrammi.

**Osservazione utile a `exercise-media-lead`:** il primo fotogramma delle due
figure è identico tranne che per lo spessore degli arti lontani. L'unica
differenza che conta sta nel secondo, ed è tutta in una curva al posto di un
segmento: è esattamente il tipo di difetto che un diff testuale non segnala e
che un test automatico non vede. Vale la pena che `art.test.ts` controlli
almeno che il tronco sia un `polyline`/`line` e non un `path` con curva, dove
la scheda chiede schiena neutra. Non lo chiedo come blocco: lo propongo.

---

## 2026-11-08 · verifica cieca `test-fixtures/passo-7/cieco/figura-a.svg`

**Esito: SCARTATA.**
Scheda di riferimento: `stacco-rumeno-manubri` (`src/data/exercises.ts`, `cues`).
Verifica **provvisoria** (§0.2: schede senza `equipment`/`frames`).
Render: `reports/immagini/2026-11-08-cieco-230.png` (4 col/230 px),
`reports/immagini/2026-11-08-cieco-460-dubbi.png` (2 col/460 px).
Geometria misurata con uno script indipendente sui comandi SVG, non a occhio.

| # | punto | esito |
|---|---|---|
| 1 | Corrispondenza con la scheda | **PROBLEMA** |
| 2 | Archetipo | **PROBLEMA** |
| 3 | Anatomia | **PROBLEMA** |
| 4 | Tecnica | **PROBLEMA** |
| 5 | Attrezzo | **PROBLEMA** |
| 6 | Coerenza | OK (spessore 3 uniforme sui due fotogrammi) |
| 7 | Pulizia | OK (nessun testo/freccia; `<title>` non è reso) |
| 8 | Leggibilità | OK |

Motivi geometrici (fotogramma di destra, il basso del range):
- **(4) colonna.** Il tronco è un `path Q` da spalla (29,59) ad anca (57,58) con
  controllo (43,45): il punto medio della curva sta 6,75 unità **sopra** la
  corda, su 28 di tronco (24%). Dorso convesso verso l'alto = flessione
  lombare. La scheda dice «il punto di arrivo lo decide la schiena neutra» e
  mette l'opposto fra gli errori tipici.
- **(3) ginocchia.** Ginocchio a 13,1 e 14,7 unità **dietro** la corda
  anca-caviglia (il soggetto guarda a sinistra): è iperestensione di ~20°, un
  ginocchio piegato al contrario. Visibile a 230 px come una ">" rovesciata.
- **(4) tibie.** 36,4° e 32,3° dalla verticale, contro «le tibie restano
  verticali» della scheda.
- **(2) archetipo.** Tronco a 88° (orizzontale pieno), testa 33,5° fuori
  dall'asse della colonna, manubri a 13 unità da terra e 35 davanti alle gambe:
  l'insieme legge come una flessione in avanti a toccare i piedi, non come
  un'anca che spinge indietro. L'anca sta 2 unità **davanti** alle caviglie,
  mai dietro.
- **(1).** Il fotogramma mostra l'errore nominato nella scheda, non la
  ripetizione valida; quindi non è il fotogramma giusto per quella voce.
- **(5)** vedi la nota comune qui sotto.

Regola §2: un solo PROBLEMA su 2, 3 o 4 basta. Qui sono tre. `da rifare`.

## 2026-11-08 · verifica cieca `test-fixtures/passo-7/cieco/figura-b.svg`

**Esito: SCARTATA** per la regola §2 (due PROBLEMI nel gruppo 5/6/8), **ma il
gesto è giusto**: nessun rilievo su archetipo, anatomia e tecnica. I due difetti
sono di forma e di convenzione, non di contenuto. Vedi la decisione per Alessio.

| # | punto | esito |
|---|---|---|
| 1 | Corrispondenza con la scheda | OK |
| 2 | Archetipo | OK |
| 3 | Anatomia | OK |
| 4 | Tecnica | OK |
| 5 | Attrezzo | **PROBLEMA** |
| 6 | Coerenza | **PROBLEMA** |
| 7 | Pulizia | OK |
| 8 | Leggibilità | OK |

Cosa è corretto, misurato: tronco **rettilineo** (`polyline`, sagitta 0) a 66,8°
dalla verticale; testa a 3,4° dall'asse della colonna; tibie a 6,3° dalla
verticale su entrambe le gambe; ginocchia a 2,0 e 4,8 unità dietro la corda
anca-caviglia, sotto lo spessore del tratto (3) e leggibili come «ginocchia
morbide»; braccia appese verticali dalla spalla; manubri a 21 unità da terra,
cioè all'altezza del ginocchio (20) — coerente con «scendi finché senti i
femorali tirare, non più in basso».

- **(6) coerenza.** La seconda gamba è disegnata con `stroke-width="2"` in
  **entrambi** i fotogrammi, mentre ogni altro arto — compreso il braccio
  lontano, che sarebbe il pari grado — sta a 3. Se fosse una convenzione di
  profondità varrebbe anche per il braccio; non vale, quindi è un'incoerenza
  interna di stile.
- **(5) attrezzo.** Nota comune alle due figure: i manubri sono due barre da 11
  unità alla **stessa** quota, sovrapposte per 2, per un ingombro continuo di
  20 unità = 2,4 volte la larghezza delle spalle (8). L'unico segno che li
  distingue è il tratto di sovrapposizione, più scuro (grigio 118 contro 173)
  ma largo 2 px alla dimensione dichiarata di 210 px. Alla dimensione d'uso si
  contano come **uno**, cioè come un bilanciere: è il caso che il punto 5 della
  checklist nomina per nome.

Ipotesi di correzione per `exercise-media-lead`: separare i due manubri di 2-3
unità in verticale (vicino/lontano) oppure accorciarli a 8 unità perché non si
tocchino; e portare la gamba lontana a `stroke-width` 3 o applicare la
convenzione «arto lontano più sottile» anche al braccio.

### Nota di metodo su questa verifica
Il punto 5 non è un difetto di *questa* figura ma della convenzione con cui la
libreria disegna i manubri: lo stesso costrutto compare identico in tutti e
quattro i fotogrammi giudicati oggi. Lo segno comunque PROBLEMA perché la
checklist lo nomina, e porto ad Alessio la domanda che ne discende invece di
deciderla io.

## Da RESULTS.md (spostate il 2026-11-12)

### Voci chiuse

| ID | Grav. | Titolo | Chiusa il | Verifica di chiusura |
|---|---|---|---|---|
| M2 | Medio | Stazioni a tempo fisso in «al massimo senza leva» ogni settimana | 2026-11-09 | `02-revisione.mts` R1: corda e step ai 30" prescritti → nessuna uscita. Tutti i 10 blocchi con `min === max` stanno dentro `F` |

### Verifiche tecniche delle immagini

| Data | Immagine | Scheda | Esito | Punti con PROBLEMA | Dettaglio |
|---|---|---|---|---|---|
| 2026-11-08 | `test-fixtures/passo-7/stacco-schiena-curva.svg` | `stacco-rumeno-manubri` | **SCARTATA** | 1 corrispondenza · 2 archetipo · 3 anatomia · 4 tecnica · 6 coerenza (minore) | `IMAGES.md` |
| 2026-11-08 | `src/assets/exercises/stacco-rumeno-manubri.svg` (confronto) | `stacco-rumeno-manubri` | 8/8 OK, *verificata provvisoria* (scheda incompleta, §0.2) | nessuno | `IMAGES.md` |
| 2026-11-08 | `test-fixtures/passo-7/cieco/figura-a.svg` (cieca) | `stacco-rumeno-manubri` | **SCARTATA** | 1 corrispondenza · 2 archetipo · 3 anatomia · 4 tecnica · 5 attrezzo | `IMAGES.md` |
| 2026-11-09b | `src/assets/exercises/hip-thrust-panca-bilaterale.svg` | `hip-thrust-panca-bilaterale` | **SCARTATA** | 1 corrispondenza · 2 archetipo · 4 tecnica · 5 attrezzo · 7 pulizia · 8 leggibilità | `IMAGES.md` |
| 2026-11-08 | `test-fixtures/passo-7/cieco/figura-b.svg` (cieca) | `stacco-rumeno-manubri` | **SCARTATA** per §2 (2 problemi nel gruppo 5/6/8); gesto corretto, difetti di sola forma | 5 attrezzo · 6 coerenza | `IMAGES.md` |

### Ricalcoli indipendenti

| Metrica | Esito | Script |
|---|---|---|
| Gradino di partenza con i 9 test di P1 | 2026-11-09: zero → gradino 1 su tutti gli esercizi prescritti; `hanging-leg-raise` resta al 5 | `safety-core.mts` caso 2, `02-revisione.mts` R4 |
| Durata delle 4 sedute, commit `f63c9f1` | coincide al secondo (scarto 0 s su tutte e quattro); 35:48-39:13 su 40' | `06-circuito-trascrizione.mts` |
| Volume settimanale, commit `f63c9f1` | coincide al decimale con il test del progetto (braccia 34,5 · core 16,5 · dorsali 15 · spalle 13,5 · petto 9 · femorali-glutei 9 · quadricipiti 6 · **polpacci 0**); 24 stazioni × 3 = 72 crediti primari + 31,5 secondari = **103,5 contro i 128 che la fascia pretende**: fuori fascia per aritmetica | `06-circuito-trascrizione.mts` |
| Volume da log | 2026-11-09 non coincideva (A7) · 2026-11-12 coincide con la convenzione R3 (abbandonate contano: il controllo M2 di `03` resta sulla convenzione vecchia) | `10-volume-r3.mts` |
| Durata delle 4 sedute | coincide al secondo con il mio ricalcolo; 39,6-39,9' su 40' dichiarati | `01-durata-volume.mts` |
| Volume settimanale per gruppo | coincide; 5 gruppi su 8 fuori dalla fascia 16-20 del metodo | `01-durata-volume.mts` |

## Da RESULTS.md (spostate il 2026-11-12b)

### Voci chiuse e ricalcoli usciti dagli ultimi 10

| ID / metrica | … | … | … | … |
|---|---|---|---|---|
| A1 | Alto | `review.ts` non leggeva `excludeFromReview` | 2026-11-09 | caso 4f del nucleo: `kb-swing` 12-11-12 su 15-20 → nessun verdetto, `serie=0`. I 12 blocchi con il flag sono esattamente i 12 blocchi `F`; `effectiveBlock` conserva il flag sull'alternativa |
| A5 | Alto | Aderenza: denominatore su giorni assegnati | 2026-11-09 | `03-metriche.mts` M1: le dovute coincidono col mio ricalcolo proporzionale troncato su tutti e 7 i giorni (0,1,1,2,2,3,4) |
| A6 | Alto | Aderenza: contava tutte le sedute di sempre (833%) | 2026-11-09 | `03-metriche.mts` M1: 24 sedute archiviate + 1 nel programma → 1/1 = 100%; una seduta `upper-a` del programma archiviato → 0/4 |
| M9 | Medio | La pausa di blocco non nominava i blocchi | 2026-11-12 | piano guidato: «Tri-set A finito, ora Tri-set B» in tutte e 4 le sedute |
| Media mobile a 7 giorni | coincide su tutti i punti | `03-metriche.mts` |
| Medie settimanali e delta | coincide; `comparedTo` dichiarato correttamente | `03-metriche.mts` |
| Aderenza | 2026-11-08 **non coincide** (A5, A6) · 2026-11-09 **coincide** su tutti e 7 i giorni e sullo storico archiviato, col troncamento come riferimento (convenzione da approvare); resta M8, latente | `03-metriche.mts` |
| Riepilogo esercizio (totali, RIR medio, kg max) | coincide | `04-input-non-fidato.mts` |

### Note di misura del 2026-11-09b, 2026-11-09 e 2026-11-08 (e paragrafo sulle soglie proposte)

Soglie proposte in GRID.md: C1 100 · C2 100 · C3 100 · C4 ≥90 · C5 ≥80 ·
C6 ≥90 · C7 100 · C8 100. **Nessuna soglia è ancora approvata da Alessio.**
Esito del 2026-11-08 contro le soglie proposte: **NO-GO** (6 Bloccanti).
Aggiornamento del 2026-11-08 (secondo giro, immagini): 1 figura giudicata,
1 SCARTATA, 0 idonee. Difetto M7 aperto.
Aggiornamento del 2026-11-08 (terzo giro, verifica cieca di 2 figure):
2 giudicate, 2 SCARTATE, 0 idonee. Nuovo rilievo di convenzione sui manubri
(punto 5), comune a tutte le figure viste finora: decisione aperta per Alessio.

Misura del 2026-11-09b (commit `f63c9f1`, trascrizione del circuito):
**NO-GO contro soglie proposte**. C3 scende (67% → 33%): i numeri proposti
all'atleta non vengono più tutti dalle regole (B7, A9). C8 resta 100% e migliora
in valore (39,6-39,9' → 35:48-39:13). `*` C5 e C6 non rimisurati, nessuna regola
di consiglio toccata. **Il confronto del caso 3 del nucleo (32/48 → 37/52) non è
uno a uno**: la mia mappa degli attrezzi non conosceva i 16 esercizi nuovi e
sottostimava; estesa in questo giro. Cinque fixture del nucleo sono state
ripuntate perché la riscrittura dei dati le aveva svuotate senza farle fallire.

Misura del 2026-11-09 (commit `1802631`): **NO-GO contro soglie proposte**.
C4, C5, C6 e C7 salgono di una voce ciascuno; C1, C2, C3 e C8 invariati. Le
colonne di C3, C4 e C5 del 2026-11-08 **non si riproducevano** dalla
composizione scritta: baseline ricalcolata C3 67% (2/3), C4 17% (1/6), C5 33%
(1/3); la composizione è ora esplicita in GRID.md. Nessuna immagine nuova da
verificare in questo giro.

