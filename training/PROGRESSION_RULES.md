# PROGRESSION_RULES.md — soglie di progressione

Versione **progressione 1.0 — PROPOSTA del 2026-11-08, non approvata.**
Aggiunta del 2026-11-12 `[PROPOSTA, progressione 1.1]`: salto dei gradini solo
eccentrici nei range fissi (§5, T2). Gradino di partenza: PROGRAM_RULES R1.
Aggiunta del 2026-11-14 `[progressione 2.0]`: **R5, R6, R7, R9** (§9). **R5-R7
e R8 in produzione da `a747e09` (2026-11-16)**, GO di training-quality del
2026-11-15; R9 no. R8: PROGRESS_REVIEW §6.
Aggiunta del 2026-11-16 `[PROPOSTA, progressione 3.0]`: **R10** (A17) e **R13**
(D-4, S2) in §10; R11, R12 in PROGRESS_REVIEW §6.
Motore: `src/engine/progression.ts` (fine seduta), `src/engine/review.ts`
(fine settimana), `src/engine/loading.ts` (zavorra).

Ogni soglia è un numero, non un giudizio; `[PROPOSTA]` = la regola oggi non c'è.

## 1. Condizione di avanzamento (fine seduta)

`[IN CODICE]` `evaluateProgression`. Avanza **solo se entrambe** sono vere:
- `ripetizioni ≥ massimo del range` su **tutte** le serie registrate;
- `tempoRespected === true`, risposto esplicitamente.

`null` non vale come sì: senza risposta sul tempo la leva 1 non è esaurita.
Nessun range nel blocco (cedimento, myo-reps, durata) ⇒ la regola non si applica.

## 2. Quale leva (fine seduta)

`[IN CODICE]` La prima disponibile nell'ordine `reps → tempo → iso-pause →
variant → load`. Indisponibilità e motivo:

| leva | indisponibile quando |
|---|---|
| tempo | TUT non a quattro fasi · eccentrica `X` · eccentrica ≥ **5"** |
| iso-pause | TUT non a quattro fasi · fase `X` · pausa ≥ **2"** |
| variant | `pattern === null` · gradino = **6** |
| load | `loadPolicy = inherent` o `forbidden` · settimana < **3** · massimale sotto la soglia «sconsigliata» |

Esaurite tutte: nessun suggerimento, e il testo dice che serve un cambio di
programmazione, non un altro giro.

## 3. Zavorra

`[IN CODICE]` `src/data/method.ts`, `src/engine/loading.ts`
- Passo unico **2,5 kg**. Nessun altro valore è proponibile.
- Bloccata come leva fino alla **settimana 3**; il peso usato resta sempre
  **scrivibile** (`recordable`), anche quando non è una leva.
- Soglie: trazione verticale necessaria sopra **15** rip, sconsigliata sotto
  **8**; dip necessaria sopra **18**, sconsigliata sotto **10**. Altri schemi:
  nessuna soglia, `unknown`.
- Carico di partenza proposto: `2,5 × round((massimale − 10) / 2,5)`, 0 se
  massimale ≤ 10. È una proposta ricavata da tre righe di tabella, non una legge.
- Calibrazione sul fatto: bersaglio **6-8 rip a RIR 1**; media ≥ **10** ⇒ +2,5 kg;
  media ≤ **4** ⇒ −2,5 kg; in mezzo si tiene. Media su tutte le serie, non
  sull'ultima.

Quando la zavorra si può proporre: **R6** (§9), dopo tempo e pausa (**R10a**).
+2,5 kg a settimana al massimo (S2): oggi `stepLoad` lo rispetta **solo per
proposta**; revisione + fine seduta ravvicinate sommano +5 kg (rischio R-1 del
2026-11-16). Su 7 giorni: **R13a** (§10).

## 4. Quando la variante scavalca tempo e pause

`[IN CODICE]` Il gradino si considera «troppo facile» e la variante passa davanti
quando l'esercizio si misura in ripetizioni, la variante è disponibile e almeno
uno dei tre segnali misurati è vero:
1. **ogni** serie sopra il massimo del range (non solo a toccarlo);
2. media ≥ **25** ripetizioni (soglia resistenza);
3. **ogni** serie registrata con `rir > rir.max` prescritto.

Tempo e pause restano elencate ma dichiarate scavalcate, con il motivo.

## 5. Verdetti di fine settimana

`[IN CODICE]` `reviewWeek`, con almeno **3 serie** nella settimana (oggi conta
le **righe**; R8: coppia delle ultime 2 sedute, serie vere) e un range
confrontabile. Con R5-R8 ogni aumento passa da R5, la salita da R7, il peso da R6:

| verdetto | condizione | effetto accettando |
|---|---|---|
| `scendi-di-livello` | **tutte** le serie sotto il minimo, gradino > 1 | gradino −1, bonus tempo/pause a 0 |
| `range-da-rifare` | tutte sotto il minimo e gradino 1 (o nessuna scala) | niente: si rifà il test |
| `sali-di-livello` | **tutte** le serie sopra il massimo, gradino < 6 | gradino +1, bonus a 0 |
| `aggiungi-peso` | tutte **≥** massimo e zavorra disponibile in settimana+1 | +2,5 kg |

Se i numeri sono sparsi (una sotto, due sopra) **non succede niente**: è la
settimana normale di chiunque. Niente si applica da solo: la revisione propone.

`[IN CODICE, progressione 1.1]` **Gradini solo eccentrici sui range fissi**:
«±1» è il gradino **eseguibile** successivo o precedente (`adjacentLevel` salta
`eccentricOnly`): trazioni 1 ↔ 3, dip 1 ↔ 3, pike 2 ↔ 4. 6-8 negative da 5" a
TUT 3-0-1-0 non sono eseguibili. Fuori dai range fissi ±1 resta letterale.

## 6. Tetti e divieti

`[IN CODICE]` eccentrica ≤ 5" · pausa in allungamento ≤ 2" · gradino ≤ 6 ·
passo zavorra 2,5 kg · zavorra solo da settimana 3 e solo in whitelist.

T1-T4 della 1.0 **sostituiti**: gradini → R7, T3 → R5, T4 → R9 (14 giorni),
T1 sulle altre leve → **R13** (§10: R13a = S2, R13b = D-4 da decidere). In
discesa non c'è tetto.

## 7. Quando si tiene fermo

- Numeri dentro il range: si tiene. Nessun messaggio, nessuna azione.
- Tempo non risposto: si tiene e si chiede la risposta.
- Settimana di deload: nessun aumento (R5 E4; a fine seduta in lavorazione).
- Sedute di rientro dopo una pausa: nessun aumento (R5 E5, R9).
- `[PROPOSTA]` Stallo (PROGRESS_REVIEW §4): si tiene, si spiega, non si aumenta.

## 8. Quando si riduce

- Tutte le serie sotto il minimo ⇒ gradino −1 (§5). È la direzione che il motore
  delle leve non ha mai avuto e va tenuta sempre raggiungibile a mano.
- Zavorra: media ≤ 4 ripetizioni ⇒ −2,5 kg.
- `[PROPOSTA]` Dolore dichiarato su un esercizio ⇒ l'esercizio esce dal
  programma, nessuna progressione proposta, nessuna riduzione «terapeutica»
  suggerita. Vedi BOUNDARIES L2 e L3.

## 9. R5, R6, R7, R9 — le soglie approvate

`[progressione 2.0 — 2026-11-14]` Attuano S1, S3, S5, S6 e chiudono A2, A3, A4
(in codice, `a747e09`) e M4 (R9, non ancora). R8: PROGRESS_REVIEW §6; testi:
ADVICE §7; L9. **Tabelle 5.x, 6.x, 7.x: `ARCHIVE.md`** (con le righe che R10
cambia).

**Notazione.** `chiuse`: sedute `completed` in ordine `(date, id)`; in corso e
abbandonate non contano mai (R3). `voce`: `LoggedExercise` con sets; `serieVere`:
R8. **Voci utili**: fine seduta, la voce del blocco; revisione, le due della
**coppia** di R8 (ultime 2 sedute allo stato `L`, nei 14 giorni fino a
`fine(W)`, anche a cavallo di W−1 e W). `L`: stato su cui si giudica — revisione
`states.get(e) ?? R1`, fine seduta lo stato **di prima della scelta**
(`sessionDecisions().toEvaluate`). `esaurita(e, L, fisso)` ⇔ `pattern === null
|| L.level === null || adjacentLevel(pattern, L.level, 1, fisso) === null`:
strutturale, R7 non la rende vera. `scarico(w)` ⇔ `DELOAD_WEEKS.includes(w)`.
`ridotta`: R9. `oggi`: revisione = data del calcolo (`today` di
`WeeklyReviewInput`), che R8 tiene nella settimana W+1; fine seduta = `draft.date`.

### R5 — Una sola regola di avanzamento (S3 · chiude A2 · P-2c, caso 4a)

`cancello` è vero **solo se tutte**:
- **E1** ogni serie vera di ogni voce utile ha `value ≥ range.max`;
- **E2** ogni voce utile ha `tempoRespected === true` (`null` e `false` no):
  in revisione, tutte e due le sedute della coppia;
- **E3** serie vere ≥ 3. Fine seduta: nella voce (`poche-serie`, invariato).
  Revisione: R8 (2 sedute, 3 serie vere sulla coppia), che viene prima: lì
  `poche-serie` non scatta mai;
- **E4** nessun aumento si applica in scarico né nasce da numeri di scarico.
  Fine seduta: `!scarico(session.week)`. Revisione: `!scarico(W+1)` e **nessuna
  seduta della coppia con `scarico(seduta.week)`** (rev. 2026-11-15: la coppia
  di W=7 può contenere una seduta della 6);
- **E5** fine seduta: la seduta non è ridotta. Revisione: nessuna voce utile
  viene da una seduta ridotta.

Vale per **ogni aumento** (gradino, tempo, pausa, zavorra, manubrio) in
`reviewWeek` e in `evaluateProgression`, con una funzione condivisa. La discesa
non passa dal cancello. `cautelaTempo` di `review.ts` sparisce.
Ordine nella revisione, per esercizio: R8 (revisione aperta, chi compare,
`rimandati`, coppia) → tutte sotto il minimo (discesa, in codice) → tutte ≥ max:
E4/E5 → E2 → R7, R6 → altrimenti `inRange`. In codice: la revisione chiama
`motivoBlocco` con `tempo` delle due voci, `serieVere` della coppia, `scarico`
come in E4, `rientro` come in E5; la funzione non cambia.

| esito, con E1 vero | revisione | fine seduta |
|---|---|---|
| E4 o E5 falsa | elenco `fermi` (scarico / rientro) | `blockedReason` scarico / rientro |
| almeno un `false` | verdetto **`rifai-al-tempo-giusto`**, stato invariato | in codice |
| almeno un `null`, nessun `false` | verdetto **`rispondi-sul-tempo`**, stato invariato | in codice |
| E3 falsa | `pocheProve` (R8) | «servono 3 serie complete» |

*Casi limite.* Tempo null: mai un sì. perSide: il tempo è per voce, le serie
vere per coppia di lati (R8). Blocchi esclusi: non si valutano, niente domanda sul
tempo (in codice). Solo eccentrici: nessun effetto. Scarico: E4. Ritest appena
fatto: nessun effetto. Decisione registrata: fine seduta, una leva per blocco
(`sessionDecisions`); revisione, una per `(W, e)`, anche per i due verdetti
nuovi («Ho capito» registra `postponed`).

Tabella 5.1-5.15: `ARCHIVE.md`.

### R6 — Prima la variante, poi la zavorra (S5 · chiude A3 · P-2d, caso 4b)

Un aumento di carico (`aggiungi-peso`, leva `load`) si propone **solo se tutte**:
- **Z1** `cancello` di R5;
- **Z2** `esaurita(e, L, isFixedRange(blocco))`. La variante in attesa per R7
  **non** è esaurita: il carico non prende il suo posto;
- **Z3** `getLoadAvailability(e, w).allowed`, w = W+1 in revisione,
  `session.week` a fine seduta (in codice);
- **Z4** se `getLoadThreshold(e.pattern) ≠ null` (trazione verticale, dip):
  `M = tests.get(testBaseline(e.pattern).testId)?.value` esiste e
  `assessLoadNeed(e, M).need ≠ 'discouraged'` (M ≥ 8 trazioni, ≥ 10 dip).
  `M` assente ⇒ niente carico. A fine seduta `M` si passa **sempre**: oggi
  `SessionSummary` passa `null` fuori da `reps-from-test`, cioè su tutto il
  circuito, e la soglia non è mai letta.

`inherent` (manubri, kettlebell; oggi tutti `pattern: null`): Z2 vera per
costruzione, Z4 non si applica. Revisione con Z1 vera e il resto no ⇒ elenco
`alMassimo` con un motivo: `tempo` (tutte ≥ max ma non tutte sopra, variante
non esaurita), `settimana` (Z3), `soglia` o `nessun-test` (Z4), `leve-finite`.
Fine seduta: `load.available = false` con lo stesso motivo; se la variante è
in attesa e non resta altra leva, `blockedReason` è il testo di R7, non «hai
esaurito tutte le leve».

*Casi limite.* Tempo null: R5 prima. perSide: nessun effetto. Blocchi esclusi:
mai (lo swing non riceve +2,5 kg). Solo eccentrici: Z2 salta come
`adjacentLevel` (trazioni al 1: non esaurita, la prossima è il 3). Scarico: E4.
Ritest appena fatto: `M` è l'ultimo test, un ritest sotto soglia toglie subito
la zavorra. Decisione registrata: come R5.

Tabella 6.1-6.11: `ARCHIVE.md`. Con R10: 6.4-6.7 e 6.10 solo a tempo e pausa
esauriti; 6.11 superata da R10c.

### R7 — Un gradino ogni due settimane (S1 · chiude A4 · P-4b, caso 4c)

Ingressi: `e`, `L`, `oggi`, `chiuse` (la seduta in corso no).
- `voci(e)`: voci di `e` in `chiuse` con `level ≠ null`, di qualunque blocco.
- `inizio(e, L)`: data della prima voce della **serie finale ininterrotta** con
  `level === L.level`; `null` se l'ultima voce ha un altro gradino o non ce ne sono.
- **Salita consentita ⇔ `inizio ≠ null` e `daysBetween(inizio, oggi) ≥ 14`**;
  `dal = addDays(inizio, 14)`.

La salita resta di **un** gradino eseguibile (`adjacentLevel(…, 1,
isFixedRange)`): 1→3 sui range fissi è una salita (lettura di S1 approvata).
Vale per `sali-di-livello` e per la leva `variant`. Mai per scendere; non tocca
tempo, pausa e carico. Effetti voluti: un gradino accettato e non ancora
eseguito blocca ogni altra salita (seconda difesa su B11 Q2); dopo una discesa
si risale solo dopo 14 giorni al gradino più basso (assorbe W-18, ping-pong
1↔3); con i soli stati di R1 non si sale.
Esiti: revisione ⇒ elenco `inAttesa` (L, `inizio`, `dal`), nessuna zavorra al
suo posto; si valuta solo su una coppia valida di R8 e con `oggi` nella
settimana W+1: aprirla più tardi può solo raggiungere un `dal`, mai scavalcarlo
(8.23). Fine seduta ⇒ `variant.available = false` con il motivo; si propone la
prima leva disponibile fra tempo e pausa, o nessuna.

*Casi limite.* Tempo null: R5 prima. perSide: nessun effetto. Blocchi esclusi:
le loro voci contano per `inizio`, l'esercizio non si valuta. Solo eccentrici:
sopra; sul programma archiviato 1→2 è una salita. Scarico: i giorni contano nei
14, l'aumento lo blocca R5. Ritest: il gradino non cambia, salvo R9b, che fa
ripartire il conto. Decisione registrata: a fine seduta `L` è lo stato di
prima, quindi dopo una ricarica il riepilogo mostra la stessa proposta con
«Scelta registrata», non quella successiva.

Tabella 7.1-7.12: `ARCHIVE.md`.

### R9 — Rientro dopo una pausa (S6 · chiude M4 · scenario S3)
In **PROGRAM_RULES §8**: dopo ≥ 14 giorni senza sedute chiuse, 4 sedute (≥ 7
giorni) a giri dimezzati, tutte le stazioni, nessun aumento (R5 E5), ritest.

Ordine seguito: R8 → R5 → R6 → R7 (fatto, `a747e09`); R9 (con E5) resta da fare.

## 10. R10, R13 — A17 e D-4 `[PROPOSTA, progressione 3.0 — 2026-11-16]`

Tabelle 10.1-10.15, 13.1-13.11, proprietà 10.P e 13.P, testi: rapporto
`reports/2026-11-16-training.md` e ADVICE §7. R11 (M17), R12 (L15): PROGRESS_REVIEW §6.

### R10 — In revisione, le leve nell'ordine della fine seduta (chiude A17)
Con E1 vero e il cancello di R5 superato sulla coppia allo stato `L`; `blocco` =
blocco della voce di `a`; `tp = leveDiTempo(blocco, L)` (le stesse `tempoLever`
e `isoPauseLever` della fine seduta, esportate).
**R10a** (primo vero): (1) tutte sopra il massimo ∧ variante strutturale ⇒ R7:
`sali-di-livello` | `inAttesa` (scavalco, §4); (2) `tp.tempo` disponibile ⇒
`alMassimo` `tempo`; (3) `tp.pausa` ⇒ `alMassimo` `pausa`; (4) variante non
esaurita ⇒ `alMassimo` `variante` (+ data R7); (5) `forbidden` ⇒ `leve-finite`;
(6) `inherent` ⇒ R10c; (7) `allowed` ⇒ R6 Z3, Z4 ⇒ R13a ⇒ `aggiungi-peso`.
La revisione propone solo gradino e carico; tempo e pausa solo la fine seduta.
**R10b** stato completo: la coppia vale solo se, oltre a gradino e carico (R8),
nel registro (`SuggestionRecord`) non c'è un `accepted` su `e` che alza
`eccentricBonusSeconds` o `bottomPauseBonusSeconds` con `date ≥ b.date`.
Altrimenti `rimandati` motivo `leva`. Le sedute non registrano i bonus.
**R10c** manubri. **R10c-0** (subito; è il metodo scritto: `LoadPolicy`,
catalogo, fine seduta): mai `aggiungi-peso` su `inherent` ⇒ `leve-finite`.
**R10c-1** (solo con D-19 = sì): per `e ∈ LEVA_MANUBRIO` a ripetizioni il
manubrio successivo è la leva 5, stessa funzione in revisione e a fine seduta:
cancello R5, tempo e pausa esauriti, settimana ≥ 3, R13a; `loadKg = L + 2,5`
come **tetto**, bonus a 0. Kettlebell fuori (salto 4 kg > S2).
Servono tutte e due: solo (a) lascia il carico se la leva accettata era l'ultimo
passo di tempo (10.10); solo (b) lascia il carico prima di tempo e pausa a bonus
0 (10.8). Registro perso ⇒ R10b fail-open: scrittura atomica (T-2).

### R13 — Un aumento per esercizio ogni 7 giorni (D-4, S2)
`aumenti(e)`: (i) decisioni `accepted` del registro con gradino, eccentrica,
pausa o carico in salita (data `r.date`); (ii) dal diario, sedute chiuse di `e`
con carico massimo o gradino più alti della seduta chiusa precedente (peso o
livello scritti dall'atleta; a fine seduta anche quella in corso). Mai le note.
**R13a** (S2 approvata, letta su 7 giorni): un aumento di carico si propone il
giorno `oggi` solo se nessun aumento di carico ha `daysBetween(d, oggi) < 7`.
**R13b** (D-4 da decidere): lo stesso per ogni aumento; raccomandata con il
gradino nel conto e nel blocco, alla lettera solo tempo, pausa, carico.
`oggi`: `draft.date` a fine seduta, `today` in revisione; `dal = d + 7`. Discese
mai ferme; `postponed` non conta. Fine seduta: leva non disponibile e
`blockedReason` R13 se era quella da proporre. Revisione: `fermi` `sette-giorni`.
**D-4 da sola non chiude A17** (13.2: tempo accettato lunedì, revisione il
lunedì dopo = 7 giorni; 10.8: ordine). Chiude i doppi a fine seduta su sedute
ravvicinate; R13a chiude S2, che oggi vale per proposta.

### Ordine di implementazione (giro 2026-11-16)
R12 → registro in ingresso + scrittura atomica → R10a + R10c-0 → R10b → R11 →
R13a: un rilascio. Poi R13b (D-4) e R10c-1 (D-19, solo dopo R13a). R9 dopo.
