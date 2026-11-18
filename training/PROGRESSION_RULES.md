# PROGRESSION_RULES.md — soglie di progressione

**In produzione: progressione 3.0** (`fe85203`): R5-R7 (§9), R10 con R10c-1 e
R13 con D-4 (a) (§10); R8, R11, R12 in PROGRESS_REVIEW §6. GO quality 2026-11-16
su `cf7588a`. R9 no. Storia: RULES_CHANGELOG. **PROPOSTA 2026-11-18,
progressione 4.0: R14, R15, R17 (§11)**; R16 PROGRESS_REVIEW §6; R18
PROGRAM_RULES §4. Gradino di partenza: PROGRAM_RULES R1. Motore: `src/engine/progression.ts` (fine seduta), `src/engine/review.ts`
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
S2 (+2,5 kg a settimana) su 7 giorni: **R13** (§10); data dell'esecuzione: **R15**.

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
T1 sulle altre leve → **R13** (§10, D-4 a). In discesa non c'è tetto.

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

*Casi limite* e tabella 5.1-5.15: `ARCHIVE.md`.

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

*Casi limite* e tabella 6.1-6.11 (con le righe che R10 cambia): `ARCHIVE.md`.

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

*Casi limite* e tabella 7.1-7.12: `ARCHIVE.md`.

### R9 — Rientro dopo una pausa (S6 · chiude M4 · scenario S3)
In **PROGRAM_RULES §8**: dopo ≥ 14 giorni senza sedute chiuse, 4 sedute (≥ 7
giorni) a giri dimezzati, tutte le stazioni, nessun aumento (R5 E5), ritest.

Ordine seguito: R8 → R5 → R6 → R7 (fatto, `a747e09`); R9 (con E5) resta da fare.

## 10. R10, R13 — A17 e D-4 `[progressione 3.0 — 2026-11-16, in produzione `fe85203`]`

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
(6) `inherent` ⇒ R10c; (7) `allowed` ⇒ R6 Z3, Z4 ⇒ R13 ⇒ `aggiungi-peso`.
La revisione propone solo gradino e carico; tempo e pausa solo la fine seduta.
**R10b** stato completo: la coppia vale solo se, oltre a gradino e carico (R8),
nel registro non c'è un `accepted` su `e` (con R14c anche un `lapsed`) che alza
`eccentricBonusSeconds` o `bottomPauseBonusSeconds` con `date ≥ b.date`.
Altrimenti `rimandati` `leva` (`decaduta`). Le sedute non registrano i bonus.
**R10c** manubri. **R10c-0**: mai `aggiungi-peso` su `inherent` fuori elenco ⇒
`leve-finite`. **R10c-1** (D-19 sì, 2026-11-16): per `e ∈ LEVA_MANUBRIO` a
ripetizioni il manubrio successivo è la leva 5, stessa funzione in revisione e
a fine seduta: cancello R5, tempo e pausa esauriti, settimana ≥ 3, R13;
`loadKg = L + 2,5` come **tetto**, bonus a 0. Kettlebell fuori (salto 4 kg > S2).
Registro perso ⇒ R10b fail-open: scrittura atomica (L22 aperto).

### R13 — Un aumento per esercizio ogni 7 giorni (D-4, S2)
`aumenti(e)`: (i) decisioni `accepted` del registro con gradino, eccentrica,
pausa o carico in salita (data `r.date`); (ii) dal diario, sedute chiuse di `e`
con carico massimo o gradino più alti della seduta chiusa precedente (peso o
livello scritti dall'atleta; a fine seduta anche quella in corso). Mai le note.
**R13** (S2 su 7 giorni + D-4 (a), decisa da Alessio il 2026-11-16): un
aumento di qualunque leva, gradino compreso, si propone il giorno `oggi` solo se
nessun aumento ha `daysBetween(d, oggi) < 7`. `oggi`: `draft.date` a fine
seduta, `today` in revisione; `dal = d + 7`. Discese mai ferme; `postponed` non
conta. Fine seduta: leve non disponibili e `blockedReason` R13 (con R17a solo se
c'è una leva da fermare). Revisione: `fermi` `sette-giorni`. Date e spiegazioni
del diario: **R15** (§11). Giro 2026-11-16 implementato in quell'ordine.

## 11. R14, R15, R17 — M18, L18, L19, L21 `[PROPOSTA, progressione 4.0 — 2026-11-18]`

Prove 14.x, b.x, 15.x, 17.x, motivazioni e testi: `reports/2026-11-18-training.md`.
**Notazione.** Scelta in salita `c` su `g` ∈ {carico, livello}: `accepted` con
`stateAfter.g > stateBefore.g`; `B`, `T` i due valori (manubrio: `T` è un tetto).
`v_g(X)`: carico = max `loadKg` delle voci di `e` in X, livello = primo `level`.
Peso non scritto: `inherent`, `v = 0`, stato > 0. `D(c)`: prima seduta di `e` in
`(date, id)` con `id ≠ c.sessionLogId`, `date ≥ c.date`, `v_g` scritto e `≠ B` (a
fine seduta anche quella in corso). **Eseguita** ⇔ non decaduta, `B < v_g(D(c)) ≤ T`.

### R14 — Scelta in salita non eseguita (M18)
**In attesa a S**: `c.sessionLogId ≠ S.id`, non decaduta, nessun'altra seduta è
`D(c)`, stato di `e` = `c.stateAfter`. **Decade in S** ⇔ in attesa e `v_g(S) ≤ B`.
Alla chiusura: stato = sincronizzazione di S da `before = c.stateBefore` (a `v = B`
è `c.stateBefore`, tempo e pausa compresi) + record `lapsed` con `ref = c.id`,
insieme (`putTogether`). Decaduta non conta per R13; in attesa conta da `c.date`.
**R14a** riepilogo di S: nessuna leva su `e`. **R14b** fine seduta: una leva solo
con la voce allo stato `L` come in R8; motivi: senza range · R14a · R14e · E1 ·
E2-E5 · R13 · R14b · leve. **R14c** R10b legge anche i `lapsed` che rialzano un
bonus ⇒ `rimandati` `decaduta`. **R14d** player: manubrio in attesa ⇒ peso
proposto `B` (zavorra `T`), fino a D-19 (b). **R14e** peso non scritto: stato
invariato (chiude L2), scelta ancora in attesa, nessuna leva.

### R15 — Il diario esegue una scelta (L18, L19)
Un aumento del diario in `D` è spiegato ⇔ una scelta in salita sulla stessa
grandezza è eseguita in `D` (una scelta di tempo non spiega un peso). In
`aumenti`: in attesa ⇒ `c.date`; **eseguita ⇒ `D.date`** («carico B → v kg, scelta
del <giorno>»); superata (`v > T`) ⇒ `c.date` + «scritto da te» in `D`; decaduta ⇒
niente. Data dell'esecuzione perché S2 è sul carico sollevato: con la data della
scelta la prima seduta al peso nuovo propone il successivo (13.4). Tempo e
pausa: data della scelta, salvo D-20 (b).

### R17 — R13 parla solo con una leva da fermare (L21)
**R17a** fine seduta: R13 blocca solo se dopo R5 resta una leva ≠ `reps`
disponibile. **R17b** ogni «si può proporre dal» dà la data più lontana fra R7 e
R13, con il testo della regola che la fissa (fine seduta; revisione R10a 1, 2-3, 4).
**R17c** fine seduta senza leve: R7 in attesa ⇒ R7 (o R13 se più lontana); carico
fermo solo per settimana o test ⇒ il suo motivo; altrimenti «leve finite».

### Ordine di implementazione (giro 2026-11-18)
Rilascio A: R18 → R16 → R17 → R15 → R14b. Rilascio B: R14a, c, e (record
`lapsed`) → R14d. R15 prima di R14 perché R14 usa `D(c)`. R9 dopo.
