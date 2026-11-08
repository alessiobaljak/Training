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
alto · rollout TRX → ruota ab in ginocchio · diamond push-up → push-up normale
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
(pannello alto), corda da battaglia.
**Correzione**: `figure()` accetta già `sh` e `sh2` proprio per questo — gli
archetipi nuovi non li usano. Si dichiara la spalla staccata dal collo.

## R3 — L'inquadratura non può mostrare il criterio (3 casi)
**Sintomo**: la figura è corretta ma il piano in cui l'esercizio si giudica è
perpendicolare a quello del disegno. Anti-rotazione e anti-inclinazione
disegnate di lato **non esistono**.
**Casi**: pallof press, suitcase carry, affondo con rotazione.
**Correzione**: l'inquadratura la sceglie il criterio (STYLE_GUIDE §2):
laterale per profondità e cerniera, frontale per simmetria e allineamento,
tre quarti o dall'alto per rotazione e carico asimmetrico.

## R4 — Due attrezzi che leggono come uno (2 casi)
**Sintomo**: due manubri vicini diventano un bilanciere; un kettlebell
sovrapposto al tronco diventa una pancia.
**Casi**: stacco rumeno con manubri, goblet squat.
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

## R6 — Testo, numeri o frecce dentro l'immagine (8 file)
**Sintomo**: una freccia disegnata nell'SVG.
**Caso**: `arrowUp` nell'archetipo `hip-thrust`.
**Correzione**: etichette e frecce le mette l'app in sovrimpressione, così
restano traducibili. Dentro l'immagine non entra niente di leggibile.
