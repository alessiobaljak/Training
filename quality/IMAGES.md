# Verifica tecnica indipendente delle immagini

Checklist applicata: `media/REVIEW_CHECKLIST.md` (v. del 2026-11-08).
Io non approvo: l'esito per immagine è **IDONEA PER APPROVAZIONE** o
**SCARTATA** con motivo. Approva Alessio.

Procedura seguita, come prescrive §3 della checklist: foglio di contatto a 4
colonne / 230 px (primo passaggio), poi 2 colonne / 460 px solo sui dubbi.
Render conservati in `quality/reports/immagini/`.

---

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
