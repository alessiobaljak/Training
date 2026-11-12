# REJECTIONS.md — errori ricorrenti e la correzione che li risolve

Ordinati per quante volte sono comparsi. Il primo è di gran lunga il più
frequente e il più pericoloso: **non è un errore di disegno, è una figura
corretta messa sull'esercizio sbagliato**, e si vede solo confrontandola con
la scheda.

## R1 — Archetipo di un esercizio simile (11 casi)
**Sintomo**: la figura è pulita, l'anatomia è giusta, l'esercizio è un altro.
**Casi**: affondo con rotazione → box del bulgaro · rematore con manubrio →
maniglie TRX · curl a martello → elastici (tutti e tre corretti il 2026-11-08)
· circonduzioni di spalla → mobilità generica · step rapidi → step-up su box
alto (questi due corretti il 2026-11-12) · rollout TRX → ruota ab in ginocchio · diamond push-up → push-up normale
· curl e alzate «con manubri» → elastici · hip thrust «spalle su panca» → foto
di un glute bridge a terra · dip piedi rialzati → foto con i piedi a terra.
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

## R3 — L'inquadratura non può mostrare il criterio (3 casi)
**Sintomo**: la figura è corretta ma il piano in cui l'esercizio si giudica è
perpendicolare a quello del disegno. Anti-rotazione e anti-inclinazione
disegnate di lato **non esistono**.
**Casi**: pallof press, suitcase carry, affondo con rotazione.
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
