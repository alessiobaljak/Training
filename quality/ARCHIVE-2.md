# Archivio 2 — `quality/` (aperto il 2026-11-15)

`ARCHIVE.md` è a 296 righe: da qui le voci spostate da `RESULTS.md`.

## Note delle misure

Misura del 2026-11-12 (commit `47c7f6d`, revisione totale): **NO-GO contro
soglie proposte** (7 Bloccanti, 8 Alti). Chiusi B5, B7, A7, A8, A9, M9, M10,
tutti verificati eseguendo. Nuovi B9, A12, A13, A14, M14-M16, L7-L10; A11
ristretto e aperto. † C1 scende a 0% **non per una regressione**: la voce S4
(kettlebell assente → alternativa) è fallita dal `f63c9f1`, quando le
alternative sono passate da 5 a 0 (M12), e la mia misura del 2026-11-09b non
l'aveva ricontata. G7 fallisce adesso per B9, non per R1 (che coincide su
3024 celle). Il nucleo passa a 3 FALLITI perché il caso 2 è diventato
decidibile. `*` C6 non rimisurato per intero.

## Voci chiuse spostate il 2026-11-15

| ID | Grav. | Titolo | Chiusa il | Verifica di chiusura |
|---|---|---|---|---|
| M10 | Medio | Due definizioni incompatibili di volume | 2026-11-12 | `circuit.test.ts` e `ProgressScreen` usano `plannedVolumeByGroup`/`volumeByGroup`, stessa regola di esclusione; ricalcolo coincide |
| A9 | Alto | `workSeconds` non scalato col `perSide` del gradino | 2026-11-12 | eseguito: hip thrust S4 A1 85" ai gradini 1-2, 170" dal 3 (commit `40cb563`) |
| A8 | Alto | Giunzione Tri-set 2 → finitura senza nessun passo | 2026-11-12 | `06` e piano guidato: transizione 15" B→F in tutte e 4 le sedute, settimana 1 e 6; ordine F invariato. Resta lo swing dopo suitcase carry e hollow hold: D-12, di Alessio |
| A7 | Alto | Volume: finitura e sedute aperte contate | 2026-11-12 | `10-volume-r3`: solo F o solo Z ⇒ 0; `in-progress` ⇒ 0; quattro sedute come prescritte ⇒ esattamente il previsto R3 |
| B7 | Bloccante | Precompilazione da un altro esercizio sotto lo stesso codice | 2026-11-12 | eseguito: `lastLoggedByBlock` con il prescritto di oggi scarta goblet 24 kg sotto `circuito-1/B2`, tiene `A1` (commit `40cb563`) |
| B5 | Bloccante | Gradino di partenza: il valore del test non entrava sopra lo zero | 2026-11-12 | `09-gradino-partenza`: R1 riscritta dal testo coincide con `startingLevel` su 3024 celle (catalogo × 0..40 e assente), sui 30 casi T1.3 e sulla tabella di PROGRAM_RULES §3; mai sopra Lt né P; mai un gradino solo eccentrico su un range fisso. Resto → L7; la decompressione → B9 |

## Ricalcoli spostati il 2026-11-15

| Metrica | Esito | Script |
|---|---|---|
| Gradino di partenza R1 | coincide su 3024 celle, 30 casi T1.3, tabella §3; revisione ±1 eseguibile su 8 casi | `09-gradino-partenza.mts` |
| Volume R3 (previsto e fatto) | coincide; settimana di scarico non applicata (M14) | `10-volume-r3.mts` |
| Etichetta del gradino nel diario | **non coincide** dalla seconda settimana (A11) | `11-etichetta-diario.mts` |
| Durata delle 4 sedute, commit `47c7f6d` | coincide al secondo con R2 modellata: 38:25 · 36:40 · 36:03 · 39:28 | `06-circuito-trascrizione.mts` |

## Note delle misure spostate il 2026-11-16

Misura del 2026-11-12b (commit `90b8b81`, incrementale): **NO-GO contro soglie
approvate**. Il NO-GO non dipende dalla riclassificazione: B6, B8, B9 (non
decisi) bastano. Chiusi **A11, A12, A13, A14**, verificati eseguendo (`08` v2,
`11` v2, 4i). Bloccanti: erano 7 (B1-B4, B6, B8, B9), oggi **10 attivi** + 4 al rilascio
pubblico, **nessuna regressione**. B1-B4 passano a «rilascio pubblico»; A2, A3, A4, M1, M4
diventano Bloccanti perché la soglia che violano (S3, S5, S1, S4, S6) adesso è
approvata; nuovi **B10** (S9: giro della finitura di `circuito-4`, 0" fra
plank e slam: c'era già, il controllo 4h no) e **B11** (ricarica fra «Accetto» e
«Salva e chiudi»: leva annullata o doppia). Nuovi A15 (dopo «Accetto» il
riepilogo mostra la leva *successiva* sopra «Scelta registrata»), A16 (C4, C5,
C6 sotto soglia insieme = un Alto, regola approvata), L11-L13. C4 e C7 si
leggono sul righello v3: V-GIUNZIONE fallisce per B10 (il 2026-11-12 l'avevo
data superata guardando solo B → F), M-RIEP-SEDUTA per M14. Il nucleo passa a
4 FALLITI perché il caso 6 è eseguibile su `media/LIBRARY.md`, che esisteva dal
2026-11-08: la mia lettura era ferma. Caso 7: la nota della seduta non era
iniettata, ora sì (PASS invariato).

## Voci chiuse spostate il 2026-11-16

| ID | Grav. | Titolo | Chiusa il | Verifica di chiusura |
|---|---|---|---|---|
| A13 | Alto | Leva accettata annullata al salvataggio | 2026-11-12b | `08` v2 (con `statesToSave`, l'ordine dei due player): 6/6 leve tenute (variante, tempo, zavorra), 2/2 «Rimando» lasciano il diario. Resto sul percorso con ricarica → **B11**; display → **A15** |
| A12 | Alto | `tempoRespected` «sì» dal cronometro | 2026-11-12b | nucleo 4i: il player scrive solo `false` (1 scrittura, controllo statico), e senza «sì» l'engine non propone leve (eseguito). Il «sì» lo dà l'atleta nel riepilogo. Ma la revisione settimanale sale lo stesso con `null`: **A2** |
| A11 | Alto | Etichetta del gradino ferma alla prima seduta | 2026-11-12b | `11` v2: 4 settimane 1-3-3-4 coincidono; etichetta a mano tenuta allo stesso gradino, sostituita al gradino nuovo. Resto sui dati vecchi → **L12** |
| A14 | Alto | «Alzali la prossima volta» dall'orologio | 2026-11-12b | nessun testo di carico nel riepilogo (ricerca su `src/ui`: «alzali» solo nei commenti). Resto testuale → **L13** |

## Ricalcoli spostati il 2026-11-16

| Metrica | Esito | Script |
|---|---|---|
| Tempo «misurato» dal player, commit `47c7f6d` | 22/22 blocchi giudicati a ripetizioni passano un ritmo più veloce del TUT all'innesco della salita (56-91% senza latenza); 0/22 bocciano il TUT esatto al massimo | `07-player-tempo.mts` |
| Leva accettata, poi salvataggio | variante e zavorra **annullate**, tempo e pause tenute | `08-leva-accettata.mts` |
| Immagini nel bundle contro il registro | 265 file, 0 approvati, 0 non registrati (B8) | `safety-core.mts` caso 6 |

## SAFETY_CORE — note di versione v6 e v5 ed esiti 2026-11-12b e 2026-11-15 (spostati il 2026-11-20)

v6 (2026-11-15, `ff42dfb`): con R8 una revisione legge solo le ultime 2
sedute chiuse allo stesso stato nei 14 giorni fino a `fine(W)`; le fixture di
4a-4d e 4g avevano una seduta sola e sarebbero passate senza misurare niente.
Ora ogni controllo ha una coppia vera e un **controllo positivo** che deve
produrre il verdetto (se non lo produce il controllo fallisce: fixture vuota).
Provato al contrario: sul codice di `0d2bb92` lo stesso caso 4 dà 31
violazioni (S3 ×5, S5, S1 ×2 serie di date, S4 ×3), su `ff42dfb` solo S9.
4e porta tempo e pausa a fine corsa (prima la leva era il tempo e il
controllo non misurava S2); 4f con due sedute; caso 7 su una coppia che
arriva a un verdetto, impronta su tutti gli elenchi e sull'evidenza.
v5: 4a anche su `null`, 4h (S9), 4i (S10); caso 7 con la nota della seduta.

Esito del 2026-11-15 (v6): stesso conteggio del 2026-11-12b, contenuto diverso: il caso 4 fallisce
**solo per 4h** (S9, B10). 4a (S3), 4b (S5), 4c (S1), 4d (S4) superati con la
finestra nuova e i controlli positivi; 4e, 4f, 4g, 4i superati. Casi 2, 3, 6
FALLITI invariati (B9, B6, B8); 1 e 8 NON COPERTI invariati; 5 e 7 PASS.

Esito del 2026-11-12b (2 PASS · 4 FALLITI · 2 NON COPERTI): il caso 6 era
passato a FALLITO su `media/LIBRARY.md`; 4 aveva 6 violazioni su 10 controlli.

## RESULTS — voci chiuse e ricalcoli spostati il 2026-11-20

| ID | Grav. | Titolo | Chiusa il | Verifica di chiusura |
|---|---|---|---|---|
| A2 | Bloccante | Salita di gradino in revisione senza «sì» sul tempo (S3) | 2026-11-15 | nucleo 4a v6: coppia 03-05/03-12, 5 combinazioni di tempo → `rifai-al-tempo-giusto` / `rispondi-sul-tempo` a stato invariato, positivo [sì, sì] 2→3; fine seduta con «no» nessuna leva; `12` B: 0 salite o zavorre senza «sì» su 120.000 revisioni |
| A3 | Bloccante | Zavorra sopra la variante, soglia del test mai letta (S5) | 2026-11-15 | nucleo 4b v6 con test 12 (gradino 1 → `alMassimo` «tempo», gradino 6 → +2,5 kg, 9-9-9 → `inAttesa`); `13` 6.8, 6.9, Z4, R6/R7; `12` D 6.1-6.10, B 0 violazioni S5. Resto sulle leve 2-3 → **A17** |
| A4 | Bloccante | Nessun tetto alla velocità di salita (S1) | 2026-11-15 | nucleo 4c v6: (i) 1 salita, (ii) 2 a 14 giorni, ciclo senza `break`; `12` C: 300 atleti simulati 12 settimane con fine seduta e revisione, 0 salite sotto i 14 giorni; `13` 7.3, R7 |
| M1 | Bloccante | Verdetto da righe, non da serie (S4) | 2026-11-15 | nucleo 4d v6 (1)-(6) `pocheProve`, `setsCounted` 2, positivo 2→1; `12` A: 192.234 esiti identici al riferimento scritto da PROGRESS_REVIEW §6, D 32 righe della specifica |
| B11 | Bloccante | Ricarica fra «Accetto» e «Salva e chiudi» | 2026-11-15 | `08` v3 su `sessionDecisions`: Q1 tenuta 2/2, Q2 stessa leva e blocco deciso 2/2; `npm run smoke` eseguito da me su `ff42dfb`: verde (percorso con ricarica vera, tre giri) |
| A15 | Alto | Leva successiva sopra «Scelta registrata» | 2026-11-15 | `08` v3 V: 6/6 il riquadro mostra la leva accettata (`toEvaluate` = stato di prima); smoke verde |

| Metrica | Esito | Script |
|---|---|---|
| Etichetta del gradino nel diario, commit `90b8b81` | **coincide** su 4 settimane e sui 2 casi di etichetta scritta a mano (A11 chiuso) | `11-etichetta-diario.mts` v2 |
| Giunzioni tronco → balistico nel piano guidato (S9) | B3 → F: 15" in tutte e 4; F4 → F1 fra i giri di `circuito-4`: **0"** (B10) | `safety-core.mts` 4h |

## Spostati il 2026-11-20b (da `RESULTS.md`)

Misura del 2026-11-15 (commit `ff42dfb`, incrementale su `90b8b81`): **GO per
il push delle modifiche al metodo** nel perimetro chiesto (nessun Bloccante o
Alto introdotto o peggiorato); la regola di esito approvata resta NO-GO per
l'app (5 Bloccanti attivi, 3 Alti). Chiusi **A2, A3, A4, M1** (eseguiti: nucleo
4 v6 con controlli positivi, `12` A-D, `13`) e **B11, A15** (`08` v3 su
`sessionDecisions` + `npm run smoke` eseguito da me, verde). Nuovi **A17**
(revisione: zavorra o manubrio sopra una leva di tempo appena accettata, due
aumenti dalle stesse due sedute; c'è anche su `0d2bb92`, più largo), **M17**
(rimandati perpetuo), L14-L17. C1 0→29, C3 33→67, C4 29→71; C6 rimisurato
per intero (75%, senza asterisco). Nucleo invariato nei numeri, 4 fallisce
solo per 4h (B10).

| ID | Grav. | Titolo | Chiusa il | Verifica di chiusura |
|---|---|---|---|---|
| B12 | Bloccante | S2 «+2,5 kg a settimana» valeva per proposta: revisione + fine seduta +5 kg in 3 giorni, due sedute nello stesso giorno +5 kg (in produzione fino a `a747e09`). Aperto e chiuso il 2026-11-16 | 2026-11-16 (`cf7588a`; in produzione fino al push) | eseguito su `a747e09`: 13.3 2,5 → 5 kg il 03-26, 13.5 +2,5 due volte, `14` C 739 coppie, nucleo v7 4e S2 ×2. Su `cf7588a`: «dal lunedì 30 marzo», 13.4 positivo 2,5 → 5 il 03-30, `14` C 0 su 400 atleti, 4e superato |
| A17 | Alto | Revisione: due aumenti dalle stesse due sedute (carico sopra una leva di tempo accettata) | 2026-11-16 | `13` v2 X 8/8 (con registro: `rimandati` «leva»; registro perso: `alMassimo` «tempo»); `14` F 10.1-10.15 16/16; `14` B 0 R10a/R10b/10.P su 259.782 esiti; su `a747e09` 1.578 R10a, 79 R10b, 2.619 10.P. Resto: R-2 fail-open (10.10 con registro perso), L22 |
| M17 | Medio | «Rimandati» perpetuo | 2026-11-16 | `14` F 11.1-11.14 14/14, 11.13 W2-W7 «scendi» come aprendo prima; `13` v2 M17; su `a747e09` `rimandati` W1-W7. Scheda della Home (`daLeggere`) letta, non eseguita. Resto: L20 |
| L15 | Basso | Due sedute nello stesso giorno contavano 2 per S4 | 2026-11-16 | `14` F 12.1-12.6 6/6; B 0 coppie con la stessa data; su `a747e09` 783 |

| Metrica | Esito | Script |
|---|---|---|
| Nucleo caso 4 v6 contro il codice di produzione `0d2bb92` | 31 violazioni (S3 ×5, S5, S1, S4): le fixture nuove discriminano; su `ff42dfb` solo S9 | `safety-core.mts` (copia su worktree temporaneo) |
| Leva accettata, `statesToSave`, commit `90b8b81` | 6/6 tenute, 2/2 «Rimando» corretti; V: dopo «Accetto» il riquadro mostra la leva successiva (A15); Q: con una ricarica la leva si annulla o raddoppia (B11) | `08-leva-accettata.mts` v2 |

## Nucleo: esito spostato il 2026-11-20b (da `SAFETY_CORE.md`)

Esito del 2026-11-16 (v7, `cf7588a`): 2 PASS · 4 FALLITI · 2 NON COPERTI

Conteggio invariato. Caso 4 fallisce **solo per 4h** (S9, B10): 4e v7 (S2 su 7
giorni) superato con i positivi, 4b v7 superato. Sul codice di produzione
`a747e09` lo stesso caso 4 fallisce anche per S2 ×2 e R10a (B12, chiuso da
`cf7588a`). Casi 2, 3, 6 FALLITI (B9, B6, B8); 1 e 8 NON COPERTI; 5 e 7 PASS.
