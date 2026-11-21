# REJECTIONS.md — errori ricorrenti e la correzione che li risolve

Ordinati per quante volte sono comparsi. Il primo è di gran lunga il più
frequente e il più pericoloso: **non è un errore di disegno, è una figura
corretta messa sull'esercizio sbagliato**, e si vede solo confrontandola con
la scheda.

## R1 — Archetipo di un esercizio simile (17 casi)
**Sintomo**: la figura è pulita, l'anatomia è giusta, l'esercizio è un altro.
**Casi**: affondo con rotazione → box del bulgaro · rematore con manubrio →
maniglie TRX · curl a martello → elastici (tutti e tre corretti il 2026-11-08)
· circonduzioni di spalla → mobilità generica · step rapidi → step-up su box
alto (questi due corretti il 2026-11-12) · rollout TRX → ruota ab in ginocchio · diamond push-up → push-up normale
· curl e alzate «con manubri» → elastici · hip thrust «spalle su panca» → foto
di un glute bridge a terra · dip piedi rialzati → foto con i piedi a terra.
· plank sugli avambracci (`core-l1`) e hollow a ginocchia piegate (`core-l2`)
→ hollow hold a gambe distese (2026-11-18).
· `hang-l1…l6` un solo SVG a due mani sulla sbarra · shrimp squat = skater
· push-up zavorrati senza zavorra · HSPU con deficit senza rialzo (2026-11-21).
**Correzione**: la regola di GENERATOR_SPEC §2 — archetipo nuovo quando cambia
il gesto o l'attrezzo, parametro quando cambia solo un appoggio o un'ampiezza.
**Come si trova prima**: confronto md5 a etichetta rimossa (GENERATOR_SPEC §2)
+ lettura dei `cues` prima di guardare la figura, mai dopo.

## R2 — Un segmento attraversa la testa (4 casi)
**Sintomo**: il braccio parte dal collo, va in alto e taglia il cerchio del
cranio; a 230 px la testa sparisce dentro un nodo di linee.
**Casi**: estensione tricipiti sopra la testa, pull-over TRX, swing
(pannello alto), corda da battaglia; il 2026-11-12, misurando: burpee e
mobilità (braccia frontali dal collo), curl al TRX (braccio collassato fino
al mento), pike push-up (gomito dentro la testa).
**Correzione**: si dichiara la spalla (`sh`/`sh2`). **Attenzione**: la testa
fra le braccia in verticale, hollow, rollout e slam **non** è questo errore:
è anatomia. Il criterio che distingue i due casi è GENERATOR_SPEC §4.2 (E1–E3).

## R3 — L'inquadratura non può mostrare il criterio (5 casi)
**Sintomo**: la figura è corretta ma il piano in cui l'esercizio si giudica è
perpendicolare a quello del disegno. Anti-rotazione e anti-inclinazione
disegnate di lato **non esistono**.
**Casi**: pallof press, suitcase carry, affondo con rotazione; dal 2026-11-18
military press (frontale, ma lombare e «sopra le orecchie» sono di lato) e
plank con tocco (di lato la rotazione del bacino non esiste).
**Correzione**: l'inquadratura la sceglie il criterio (STYLE_GUIDE §2):
laterale per profondità e cerniera, frontale per simmetria e allineamento,
tre quarti o dall'alto per rotazione e carico asimmetrico.

## R4 — L'attrezzo non legge come attrezzo (4 casi)
**Sintomo**: due manubri vicini diventano un bilanciere; un kettlebell
sovrapposto al tronco diventa una pancia.
**Casi**: stacco rumeno con manubri · goblet squat · hip thrust bilaterale
(il cerchio del kettlebell attraversato dalla linea del corpo legge come un
anello intorno alla coscia, e prima ancora, da `weight` largo 18, come un
gradino del pavimento) · military press con manubri (i due pesi in alto
leggono come una barra).
**Correzione**: gli attrezzi si disegnano separati dal corpo e separati tra
loro; se non ci stanno, si sfalsano in profondità.

## R5 — La figura mostra l'errore tipico invece della ripetizione valida (1 caso)
**Sintomo**: la posa disegnata coincide con quella che i `cues` chiamano
errore o fine serie.
**Caso**: swing con kettlebell — in basso il peso è disegnato basso e davanti,
cioè la posizione in cui il cue dice di **fermare la serie**.
**Correzione**: la figura mostra sempre la ripetizione valida. Quando un
commento nel codice descrive la posa giusta, si verifica che le coordinate la
disegnino davvero: nello swing il commento diceva il contrario del disegno.

## R6 — Testo, numeri o frecce dentro l'immagine (10 file, chiuso il 2026-11-12)
**Sintomo**: una freccia disegnata nell'SVG.
**Casi**: `arrowUp` in `hip-thrust` (9 figure) e in `burpee`. Primitiva
eliminata con `47c7f6d`. `incline-curl` era un falso positivo mio: il
`<path>` era la panca. Un `<path>` non è una freccia finché non lo si guarda.
**Perché cresce**: finché la primitiva resta nel generatore, ogni archetipo
nuovo la ricopia da uno vecchio. Si toglie la primitiva, non le chiamate.
**Correzione**: etichette e frecce le mette l'app in sovrimpressione, così
restano traducibili. Dentro l'immagine non entra niente di leggibile.

## R7 — Il parametro nuovo arriva all'esercizio e non ai suoi gradini (1 caso)
**Sintomo**: una figura viene corretta, e la stessa bugia resta nei gradini
della scala che l'app disegna nella pagina accanto.
**Caso**: `bilateral` aggiunto a `hip-thrust` per
`hip-thrust-panca-bilaterale`, mentre `hip-thrust-l1` e `hip-thrust-l2`, che
hanno «due gambe» nell'etichetta, continuano a passare `{}`. Corretto il
2026-11-12: la mappa dei gradini passa `bench` e `bilateral` voce per voce.
**Correzione**: quando un archetipo prende un parametro nuovo, si rileggono
**tutte** le voci di `FIGURES` e `STEPS` che usano quell'archetipo e si decide
per ognuna. Il controllo è un `grep` dell'archetipo nella mappa, non un ricordo.

## R8 — La testa spostata per far passare il braccio (5 casi)
**Sintomo**: il braccio non attraversa più la testa perché la testa è stata
messa altrove: il collo si piega di 60–95° e la figura guarda di lato, in
avanti o all'indietro. È un errore **prodotto dalla correzione di R2**.
**Casi**: pull-over TRX (66°, nato con `47c7f6d`), pike push-up (95°), HSPU
negativa (58°), estensione tricipiti al TRX (79° e 84°).
**Correzione**: la testa sta sull'asse del tronco (≤ 40°, controllo E1 di
GENERATOR_SPEC §4.2). Se il braccio passa sulla testa, si sposta il braccio o
si accetta la sovrapposizione quando è anatomica (braccia sopra la testa).
**Come si trova prima**: `node media/scripts/pose-audit.mjs`, righe `E1`.

## R9 — Arto accorciato per far stare la posa (4 casi certi, 120 segnali)
**Sintomo**: un segmento è molto più corto dello stesso segmento nell'altro
pannello o sull'altro lato, senza uno scorcio che lo giustifichi. Succede
quando una coordinata viene spostata a occhio per far toccare un appoggio.
**Casi**: step rapidi (tibia sul box 12 contro 20), burpee (braccio nel plank
14,6 contro 24,7), curl al TRX (braccio di 1 + 6 unità), estensione al TRX
(braccio da 8 a 21). Al limite: gamba libera dell'hip thrust monopodalico
(−18%, lato lontano, tollerata).
**Correzione**: le pose si calcolano dalle lunghezze dei segmenti, come la
panca dell'hip thrust (§4.21 chiusa). Lo scorcio voluto si scrive nel
commento dell'archetipo.
**Come si trova prima**: `pose-audit`, righe `L` (soglia 80%): sono un
segnale da guardare, non uno scarto automatico (GENERATOR_SPEC §4.25).

## R11 — La foto RepDB scelta per nome, non per attrezzo (11 voci; nuovo 2026-11-21)
**Sintomo**: la foto è un buon disegno della stessa famiglia, ma l'attrezzo,
la presa o gli appoggi sono quelli di un'altra variante. Il nome inglese
somiglia, l'esercizio no.
**Casi**: `rematore-inverso-trx` → sbarra (`inverted-row`) · `horizontal-pull-l3`
«TRX orizzontale» → TRX a 45° · `rematore-trx-monobraccio` → due mani ·
`pike-pushup-piedi-rialzati` → piedi a terra · `vertical-push-l5` «al muro» →
parallette senza muro · `dip-l1` «tra due panche» → una panca ·
`dip-panche-piedi-rialzati` → piedi a terra · `bulgarian-split-squat` → due
manubri ai fianchi contro la nota del blocco (kettlebell in rack) ·
`vertical-pull-l1` → elastico contro la nota «piede sul box».
**Correzione**: prima di legare una foto, cinque domande con risposta scritta
nella voce: attrezzo, una o due mani, una o due gambe, appoggi (piedi a terra
o rialzati, muro), inclinazione. Si confronta con nome, cue **e nota del
blocco** (`variantNote` in `circuit.ts`), che l'utente legge accanto
all'immagine. Una risposta diversa ⇒ niente foto.
**Come si trova prima**: elenco delle voci di `exercise-art.ts` con le cinque
risposte accanto; ogni voce nuova o spostata ripassa le cinque domande.

## R10 — Il corpo sospeso sopra l'appoggio (2 pose, 5 file; nuovo 2026-11-18)
**Sintomo**: una posa sdraiata in cui nessun punto del tronco tocca il
pavimento. Nell'hollow hold è peggio di un difetto di disegno: la lombare
staccata è l'errore che il cue chiede di evitare (R5).
**Casi**: `hollow-hold` e `core-l1…l3`, stesso SVG (anca 14 u sopra il
pavimento); `respirazione-360` (tronco 12–14 u sopra).
**Correzione**: il contatto si misura fra i bordi, non fra gli assi: bordo del
tratto sul bordo del pavimento (GENERATOR_SPEC §4.27). Con uno stile più
spesso il contatto si ricalcola dallo spessore (STYLE_TRIALS §1.7, B2).
**Come si trova prima**: y del punto più basso del tronco contro `FLOOR`.

## R12 — Il registro resta indietro rispetto al codice (42 righe; nuovo 2026-11-21)
**Sintomo**: LIBRARY.md dice `da rifare` o `da verificare` per immagini che
l'app non mostra più, o non ha la riga di quelle che mostra. Il registro
racconta una libreria che non c'è.
**Casi**: dopo `50793fd`, `c8964ff` e `3b548e4` (sessione principale, stesso
giorno dell'audit): 22 righe RepDB tolte dalle voci, 20 SVG nascoste da
`FIGURE_SENZA_IMMAGINE`, 2 righe `trx-row` mancanti per `rematore-inverso-trx`.
**Correzione**: allineate il 2026-11-21 (`ritirata`, con il commit).
**Come si trova prima**: a ogni invocazione, prima di tutto,
`node --experimental-strip-types media/scripts/library-drift.mts`. Nessuna
riga stampata = allineato. Le foto generate (fonte 3) entreranno nello
stesso controllo quando il codice avrà la loro tabella.
