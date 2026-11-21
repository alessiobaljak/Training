# Verifica tecnica indipendente delle immagini

Checklist applicata: `media/REVIEW_CHECKLIST.md` (v. del 2026-11-08).
Io non approvo: l'esito per immagine è **IDONEA PER APPROVAZIONE** o
**SCARTATA** con motivo. Approva Alessio.

Procedura seguita, come prescrive §3 della checklist: foglio di contatto a 4
colonne / 230 px (primo passaggio), poi 2 colonne / 460 px solo sui dubbi.
Render conservati in `quality/reports/immagini/`.

---


Verifiche più vecchie (2026-11-08, 2026-11-09b): testo integrale in
`ARCHIVE.md`.

## 2026-11-21e · figura tolta in `3b548e4` (`rematore-inverso-trx-piedi-rialzati`)

Nessun foglio: è una foto RepDB, **non guardata (termine 5)**. Verifica senza immagini (`19` sulle due radici,
hash, sorgente, registri).
- `exercises-repdb/rings-inverted-row-start.webp` e `-peak.webp` su `rematore-inverso-trx-piedi-rialzati`:
  **SCARTATA** (1 attrezzo, 2 archetipo). Fonte RepDB «Rings Inverted Row»: anelli, l'esercizio è al TRX
  (scheda: «Piedi su un rialzo… il corpo resta orizzontale», gradino proprio 4). «Piedi a terra» viene dal
  media lead (2026-11-08): per me NON COPERTO, ma l'attrezzo basta a scartarla.
- **Rimozione verificata.** `19`: cambiano solo le 2 posizioni dell'esercizio (livello nullo e 4), da
  «FOTO rings-inverted-row» a «NESSUNA (lista)»; le altre 262 identiche; i gradini 1-6 restano quelli della
  scala. Nessun altro riferimento ai due file in `src/`, nessun duplicato per hash; bundle 261 → 259.
- Cosa vede l'atleta: nessuna figura (`ExerciseArt` restituisce `null`, non la SVG generata). L'esercizio non
  è nei circuiti (solo programma archiviato e Libreria): lì vale L36 (Card vuota).
- Per exercise-media-lead: `LIBRARY.md` righe 182-183 puntano a file cancellati; la riga 19 dà «da verificare»
  alla SVG `exercises/rematore-inverso-trx-piedi-rialzati.svg`, che il commit dice rifiutata da Alessio e che
  resta nel bundle senza essere mostrata (L35).

## 2026-11-21 · correzione delle figure `50793fd` (audit attrezzo del media lead)

Foglio 4 × 230 px: `reports/immagini/2026-11-21-figure-1.png`. Nessun ingrandimento
(il dubbio sul monobraccio l'ha chiuso l'hash). **Foto RepDB: nessuna guardata, termine 5**
(io sono un modello generativo): restano NON COPERTE per il loro aspetto.
- `exercises-repdb/trx-row` su `rematore-inverso-trx`: **NON COPERTO**. Verificati senza
  guardare fonte «TRX Row», gradino proprio 2 «TRX a 45°», cue «maniglie», file, ordine.
- `exercises/rematore-trx-monobraccio.svg`: **SCARTATA** (1, 2). Identica a
  `steps/horizontal-pull-l6.svg` (piedi rialzati); l'esercizio è al gradino 5. M23.
- `exercises/bulgarian-split-squat.svg`: attrezzo e archetipo giusti (panca, nessun
  carico); non inoltrabile (checklist del media lead assente, M7, domanda 2).
- `exercises/dip-panche-piedi-rialzati.svg`: due panche, talloni sulla seconda; non inoltrabile.
- Muro presente in `handstand-l2/l3/l4`, `verticale-al-muro`, `vertical-push-l3/l4` (solo
  il punto 3 della richiesta). `vertical-push-l3/l4` hanno E1 58° come `l5`: «da rifare».
- Duplicati per hash (titolo escluso): `shrimp-squat-o-skater-squat.svg` = `single-leg-squat-l4/l5/l6`
  (M24); `vertical-push-l2` = `pike-pushup-piedi-rialzati.svg`; `vertical-push-l3..l6` =
  `negative-hspu…svg`; `dip-panche.svg` = `dip-l1`; i 6 `hang` = `dead-hang.svg`.

## 2026-11-12b · nessuna figura nuova, stato delle dieci

`src/assets/` identico da `47c7f6d` a `90b8b81`: nessuna figura da guardare,
nessuna riguardata. Cosa è cambiato è il primo passaggio:
- **Hip thrust (1-6)**: `exercise-media-lead` le ha verificate (LIBRARY.md,
  2026-11-12). La precondizione che mancava c'è. Restano **non idonee per
  approvazione** per la regola della checklist §0.2: «nessuna immagine va in
  approvata su una scheda incompleta» (M7: niente `equipment` né `frames`).
  Non è un mio scrupolo: è la checklist, ed è la stessa di media-lead.
- **circonduzioni-spalle**: media-lead `verificata`, io **SCARTATA (3)**.
  Abbiamo misurato lo stesso numero (braccio a 6,0 dal centro della testa,
  raggio 6): per lei è l'anatomia di un braccio sopra la testa visto di lato,
  per me a 460 px il braccio attraversa il contorno. Disaccordo da portare ad
  Alessio con la figura davanti, non da comporre fra noi.
- **step-rapidi-box**: media-lead `da rifare` per la tibia sul box −40%
  (anatomia, punto 3). Io l'avevo data «con riserva» sul punto 8: **la tibia
  corta non l'avevo vista**. Si riguarda dopo il rifacimento.
- **pull-over-trx, estensione-tricipiti-sopra-testa**: `da rifare` per tutte e
  due le verifiche. Coerenti.
- Caso 6 del nucleo ora eseguito su LIBRARY.md: 265 file nel bundle, 0
  approvati (B8).

## 2026-11-12 · dieci figure rifatte in `47c7f6d`

**Precondizione mancante.** Il flusso (CLAUDE.md) vuole la verifica di
`exercise-media-lead` **prima** della mia. Non c'è: `media/LIBRARY.md` ha
ancora per tutte e dieci lo stato `da rifare` del 2026-11-08/09 e nessun
commit fra `40cb563` e `54e1bab` tocca `media/` tranne lo script del foglio di
contatto. Ho verificato lo stesso, in modo indipendente; ma **nessuna** delle
dieci è IDONEA PER APPROVAZIONE oggi: manca il primo passaggio, e la scheda
resta incompleta (M7, §0.2: verifica **provvisoria**).

Render: `reports/immagini/2026-11-12-dieci-230.png` (4/230, con 5 figure di
confronto), `2026-11-12-dubbi-460.png` e `-dubbi2-460.png` (2/460),
`2026-11-12-hipthrust-210.png` (4/210, il punto 8). Geometria misurata sui
comandi SVG, unità della tela 210×110.

| # | figura | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | esito |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `exercises/hip-thrust-panca-bilaterale` | OK | OK | OK | OK | OK | OK | OK | OK | nessun problema · non inoltrabile (precondizione) |
| 2 | `exercises/hip-thrust-monopodalico` | OK | OK | OK | OK | OK | OK | OK | OK | nessun problema · **l'app non la mostra** |
| 3 | `steps/hip-thrust-l1` | OK | OK | OK | OK¹ | OK | OK | OK | OK | nessun problema · **l'app non la mostra** |
| 4 | `steps/hip-thrust-l2` | OK | OK | OK | OK | OK | OK | OK | OK | nessun problema |
| 5 | `steps/hip-thrust-l3` | OK | OK | OK | OK¹ | OK | OK | OK | OK | nessun problema · **l'app non la mostra** |
| 6 | `steps/hip-thrust-l6` | OK | OK | OK | OK | OK² | OK | OK | OK | nessun problema |
| 7 | `exercises/circonduzioni-spalle` | OK | OK | **PROBLEMA** | OK | OK | OK | OK | OK | **SCARTATA** |
| 8 | `exercises/step-rapidi-box` | OK | OK | OK | OK | OK | OK | OK | riserva³ | verificata con riserva |
| 9 | `exercises/pull-over-trx` | **PROBLEMA** | OK | **PROBLEMA** | **PROBLEMA** | **PROBLEMA** | OK | OK | OK | **SCARTATA** |
| 10 | `exercises/estensione-tricipiti-sopra-testa` | **PROBLEMA** | OK | **PROBLEMA** | **PROBLEMA** | OK | OK | OK | OK | **SCARTATA** |

**Hip thrust (1-6).** Le specifiche §4.18, §4.20, §4.21 sono soddisfatte dove
si applicano. Bilaterale, pannello finale: spalla `30,73`, anca `56,73`,
ginocchio `76,73` (allineati, `|kn.y−hi.y| = 0`), tibia verticale, piede sotto
il ginocchio (`|76−76| = 0`); seconda gamba con piede a 8 unità; campana
tangente dall'alto (centro `63,66`, distanza dalla coscia 7 > r 6) e tenuta
dalla mano (`59,61` sul manico). A 210 px si contano due tibie e si distingue
dal monopodalico. Nessuna freccia (`arrowUp` = 0 nel generatore). Panca a
`y = 77`, 4 unità sotto il ginocchio.
¹ Ponte a terra: tibia a 24° dalla verticale, ma ginocchio a 85°. Il criterio
di §4.21 «tibia entro 10°» è scritto per la panca (coscia orizzontale) e non si
applica al ponte a terra, dove spalla-anca-ginocchio è una rampa: qui
l'angolo giusto è quello del ginocchio (~90°). Da correggere nella spec.
² `l6`, pannello 2: la gamba libera passa a 5,83 dal centro della campana
(r 6): sfiora il fondo del cerchio. A 210 px legge come campana appoggiata
sull'anca. Nota, non problema.
**Mostrate davvero.** `hip-thrust-monopodalico`, `hip-thrust-l1` e
`hip-thrust-l3` hanno una foto RepDB in `src/data/exercise-art.ts`, e la foto
vince (`ExerciseArt`): l'atleta vede `single-leg-glute-bridge` e
`glute-bridge`. Per il monopodalico quella foto è l'archetipo sbagliato (ponte
a terra contro «spalle su panca»), `da rifare` in LIBRARY dal 2026-11-08: la
figura giusta c'è e non si vede.

**7 · circonduzioni-spalle — SCARTATA (3).** Pannello 2, braccio
`51,34 → 54,20 → 56,6`: il primo segmento passa a **6,02** dal centro della
testa (`47,24`, r 6), il secondo a 6,37. La linea del braccio corre sopra il
contorno della testa per tutto il tratto: a 460 px si legge un braccio che
attraversa la testa, a 230 attaccato. La spalla è a +1 dal collo, §4.2 chiede
±5. Il resto è giusto: archetipo nuovo, distinto dalla mobilità generale,
gomito dritto, busto fermo.

**8 · step-rapidi-box — verificata con riserva (8).** Box alto 16 contro un
ginocchio a 22, nessun pannello con la figura sopra il box, diversa da
`step-up-box-alto`: §4.4 soddisfatta. ³ Il cambio di piede c'è nei dati —
gamba vicina (tratto 3) sul box nel pannello 1, gamba lontana (tratto 2) nel
2 — ma a 210 px un'unità di tratto non si vede: l'alternanza la dicono solo le
braccia.

**9 · pull-over-trx — SCARTATA (1, 3, 4, 5).** Lettura coerente: atleta
rivolto all'ancoraggio, inclinato indietro, braccia sopra la testa.
- 3 Anatomia: testa (`39,48`) **di fianco** alla spalla (`47,47`), a 66° dall'asse
  del busto: il collo piegato di 66°. È l'effetto collaterale di §4.2 risolta
  spostando la testa invece della spalla.
- 4 Tecnica: il corpo non è «una linea sola» (cue 3): busto a 31° dalla
  verticale, gambe a 11° ⇒ anca in estensione di ~20° nel pannello 1, **~28°**
  nel 2. E il pannello finale è **più** inclinato del primo (busto 39° contro
  31°): il contrario del gesto, che finisce più dritto.
- 5 Attrezzo: nel pannello 2 le cinghie attraversano il busto, in `44,0/57,6`
  e `46,4/60,5`.
- 1 Corrispondenza: le mani finiscono **dietro** la linea del busto, non «ai
  fianchi».

**10 · estensione-tricipiti-sopra-testa — SCARTATA (1, 3, 4).**
- 3 Anatomia: gli omeri corrono a 6,45-6,56 dal centro della testa (r 6, tratti
  da 3): in tutti e due i pannelli le braccia stanno sul contorno della testa,
  il «nodo» di §4.11 è ancora lì.
- 4 Tecnica: vista **frontale** (braccia simmetriche a 44 e 56, gambe aperte),
  non laterale come vuole §4.11; il peso (`54,5-65,5`, y 23) sta **di fianco**
  all'orecchio, non dietro la nuca.
- 1 Corrispondenza: l'`aria-label` dice «peso dietro la testa, poi braccia
  distese»: l'ordine dei pannelli è ancora quello che §4.11 chiedeva di
  invertire (cue 1: si parte a braccia distese).

**Non guardate in questo giro** (cambiate in `47c7f6d`, fuori dall'elenco
ricevuto): `burpee`, `hip-thrust-l4`, `hip-thrust-l5`, `posterior-chain-l1`,
`vertical-pull-l1`. `hip-thrust-l4`, `hip-thrust-l5` e `posterior-chain-l1`
compaiono nel foglio come confronto, non giudicate.
