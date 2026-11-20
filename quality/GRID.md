# Griglia di valutazione e soglie

Versione griglia: **v3** · **approvate da Alessio il 2026-11-12**
(`docs/SESSION_STATE.md` § «Decisioni prese», commit `8c8253d`): soglie
C1-C8, regola di esito, S1-S10 (con la lettura di S1 sui gradini eseguibili),
voci v3 V-GIUNZIONE e M-RIEP-SEDUTA. Da qui l'esito si legge contro soglie
approvate. Restano in attesa solo le convenzioni in fondo (dipendono da R3 e
D-13, non decisi).

## Gravità dei difetti

| Gravità | Definizione | Effetto |
|---|---|---|
| **Bloccante** | l'app può proporre un esercizio oltre il livello o fuori attrezzatura, superare una soglia di progressione, o manca un rimando dovuto | NO-GO. Nessuna eccezione, nessuna compressione |
| **Alto** | un numero mostrato all'atleta è sbagliato, o una regola del metodo è applicata al contrario, sempre e per tutti | NO-GO su rilascio di dimensione L; su M serve una mitigazione dichiarata |
| **Medio** | l'app è corretta ma inutile o rumorosa in uno scenario reale | si può rilasciare, si registra con una data |
| **Basso** | difetto cosmetico o rischio che si attiva solo con il secondo utente | si registra |
| **Bloccante al rilascio pubblico** | B1-B4 (dolore, condizione medica, cibo e corpo, minorenni): decisione di Alessio del 2026-11-12 | finché l'app ha un solo utente: difetto noto, registrato, **non** blocca. Il nucleo li esegue comunque per intero e li riporta FALLITO o NON COPERTO, mai PASS. Diventano Bloccanti il giorno del secondo utente |

**Conseguenza dell'approvazione (2026-11-12).** Con S1-S10 approvate, «superare
una soglia di progressione» è un limite che esiste: le violazioni già aperte
come Alto o Medio perché la soglia era solo proposta diventano Bloccanti
(A2 = S3, A3 = S5, A4 = S1, M1 = S4, M4 = S6), come GRID prevedeva per S9.
Gli ID restano quelli storici; la gravità sta nella colonna. **C2** è fatto
solo di B1-B4: sotto soglia blocca il rilascio pubblico, non quello attuale.

## Gli otto criteri

| # | Criterio | Misura | Soglia (approvata) |
|---|---|---|---|
| C1 | **Sicurezza** | % di scenari di sicurezza senza violazione dei limiti (livello, attrezzatura, soglie di progressione) | **100%** — ogni violazione è Bloccante |
| C2 | **Rimandi** | % di rimandi corretti sui 4 scenari di limite che li richiedono (L1, L2, L3, L5) | **100%** — un rimando mancato è Bloccante |
| C3 | **Fedeltà** | % di uscite senza esercizi fuori catalogo, senza dati sui progressi non ricalcolabili, senza numeri del consiglio diversi da quelli delle regole | **100%** |
| C4 | **Coerenza con il metodo** | % di scenari coerenti con METHOD.md e PROGRAM_RULES.md (volume, frequenza, recupero, struttura, ordine delle leve) | **≥ 90%** |
| C5 | **Personalizzazione** | % di consigli che citano almeno un dato reale dell'atleta (numeri, range, gradino, settimana) | **≥ 80%** |
| C6 | **Concretezza** | % di uscite che dicono cosa fare nella prossima seduta | **≥ 90%** |
| C7 | **Analisi dei progressi** | % di metriche che coincidono con il ricalcolo indipendente | **100%** |
| C8 | **Durata** | % di sedute entro il tetto dichiarato dal programma | **100%** |

Regola di esito complessivo (approvata): **GO possibile solo con Bloccanti = 0 e
Alti = 0 su rilascio L**. C4-C6 sotto soglia non bloccano da soli, ma tre
criteri sotto soglia contemporaneamente valgono come un Alto.

## Soglie di sicurezza sulla progressione (approvate il 2026-11-12)

**Al 2026-11-20b (`221b2e8`, rilascio B1): S1, S2, S5 rispettate** anche con
R19 e D-21 (`16`: E7, S1 all'esecuzione, S5 con R19 a 0). L23 chiuso: un aumento
datato dopo oggi ferma R13. E4 a fine seduta anche nella settimana prima dello
scarico (D-21 a); resta M20 (revisione W4 aperta in W5, esercizio saltato in W5).
Tetto di durata **55′ approvato** (D-22 a, R19): vedi D5 sotto.
**Al 2026-11-20 (`4edf751`, rilascio A di R14-R18): S2 rispettata anche sul
carico sollevato** (D-20 a e b di Alessio, 2026-11-20: carico e gradino contano
dalla seduta che li esegue, tempo e pausa dalla prima seduta dopo la scelta):
nucleo v8 4e, `15` E7 0 su 800 atleti simulati. In produzione `001de30` **era
violata** (B13: 13.4, 2,5 kg sollevati il 03-30 e +2,5 proposti lo stesso
giorno; E7 36). Residuo latente: L23 (seduta con data futura).
**Al 2026-11-16 (`cf7588a`, R10-R13): S2 rispettata su 7 giorni** (R13; nucleo
v7 4e, `14` C). Fino a `a747e09` **era violata** (B12: revisione + fine seduta
+5 kg in 3 giorni): la mia «S2 rispettata» del 2026-11-12 guardava solo il
passo della singola proposta. S4 con R12 (date diverse) ha chiuso la riserva L15.
Al 2026-11-15 (`ff42dfb`, R5-R8) rispettate anche **S1, S3, S4, S5** (A4, A2, M1, A3 chiusi:
`12`, `13`, nucleo 4 v6). Restano violate S6 (M4, R9 rimandata) e S9 (B10).
Al 2026-11-12 (`90b8b81`) rispettate: S2, S10. Violate: S1, S3, S4, S5, S6,
S9 (giro della finitura, B10). S7: B9 (in attesa della decisione sui blocchi
esclusi). S8: B3 (rilascio pubblico). `BOUNDARIES.md` 1.0 è ancora proposta e
L9 non coincide con S1 e S6 (7 giorni contro 14, rientro da 21 contro 14):
va allineata a queste, che sono approvate.

| ID | Soglia proposta | Perché |
|---|---|---|
| S1 | massimo **1 gradino di scala per esercizio ogni 2 settimane** | oggi si va da 1 a 6 in 5 settimane su 5 settimane di numeri sopra il range; una scala a 6 gradini attraversata in 5 settimane non è una progressione, è un cambio di esercizio ogni lunedì |
| S2 | massimo **+2,5 kg per esercizio a settimana**. Lettura confermata da training-quality il 2026-11-16: **7 giorni mobili** (R13a; mai più permissiva della settimana di calendario). Dal 2026-11-16 (D-4 a) un solo aumento di qualunque tipo ogni 7 giorni. **Dal 2026-11-20 (D-20 a, b)**: l'aumento conta dal giorno in cui si esegue (carico e gradino: prima seduta che si stacca dal valore di prima; tempo e pausa: prima seduta dopo la scelta); accettata da training-quality come lettura della griglia | passo unico del metodo; `stepLoad` lo rispetta solo per proposta (B12) |
| S3 | nessuna salita di gradino **senza `tempoRespected === true`** su tutte le sedute della settimana | è la regola di `METHOD.md` (`ADVANCEMENT_REQUIRES_REACHING_MAX` + tempo prescritto); oggi la revisione settimanale la aggira con una semplice cautela testuale |
| S4 | nessun verdetto con **meno di 2 sedute** e **meno di 3 serie vere** (non righe) su quell'esercizio. **Lettura D-16** (Alessio, 2026-11-15; parere favorevole di training-quality il 2026-11-15): le **ultime 2 sedute chiuse** dell'esercizio, allo stesso gradino e carico, entrambe nei 14 giorni fino alla domenica che chiude la settimana rivista; mai le «ultime due buone». Riserva di training-quality: due date diverse (L15) | fino al `ff42dfb` 2 serie per lato (4 righe) di una sola seduta bastavano (M1, chiuso) |
| S5 | **zavorra solo dopo che la variante è esaurita**, e mai sotto le soglie di `getLoadThreshold` (8 trazioni, 10 dip) | il metodo mette il carico alla leva 5; oggi la revisione lo propone al gradino 1 e non consulta mai `assessLoadNeed` |
| S6 | dopo **≥ 14 giorni** senza sedute chiuse: volume ridotto per 1 settimana e ritest proposto | oggi dopo 20 giorni la seduta proposta è identica |
| S7 | nessun esercizio al di sopra del **gradino compatibile con il valore misurato dal test**, non solo con l'esercizio del test | oggi trazioni complete e dip completi a chi ha misurato 0 |
| S9 | **nessuna stazione balistica carica (swing, slam, clean) subito dopo una stazione di stabilizzazione del tronco a RIR 0-1 o a cedimento**: minimo una transizione dichiarata | proposto il 2026-11-09b. Oggi `circuito-1` manda il suitcase carry con il 24 dentro lo swing 15-20 senza nessun passo, e `circuito-3` fa lo stesso dall'hollow hold. **Approvata.** Si legge come L14: RIR 0-1, «—» o a cedimento. Nel nucleo come controllo **4h** del caso 4 (il nucleo resta a 8 casi). Controlla ogni giunzione del piano guidato, giri compresi |
| S8 | perdita di peso **> 1% del peso corporeo a settimana** per 2 settimane di fila: nessun commento, nessun obiettivo, rimando alle risorse | oggi −3 kg a settimana per 3 settimane passano in silenzio |

| S10 | **un `tempoRespected` ricavato da una misura non è mai più permissivo della regola**: all'innesco della salita (tutte le serie ≥ massimo) il controllo non accetta un ritmo più veloce del TUT prescritto | **approvata.** Rispettata dal `2d84d87`: il player scrive solo «no» (controllo 4i). Al 2026-11-12 il minimo è la colonna «lavoro» (≈ TUT × minimo del range) e il cronometro parte prima della prima ripetizione: 22 blocchi su 22 accettano il 56-91% del TUT (A12, `07-player-tempo`) |

**Lettura di S1 (approvata il 2026-11-12).** Con R1 la revisione salta i gradini
di sole negative sui range fissi (trazioni 1→3, dip 1→3, pike 2→4). Propongo
che S1 conti i gradini **eseguibili**: 1→3 è una salita sola. Il controllo 4g
del nucleo verifica che nessun gradino eseguibile venga scavalcato.

## Composizione dei criteri (v2, 2026-11-09)

Il 2026-11-09 C3, C4 e C5 della baseline **non si riproducevano** dalla mappa
di SCENARIOS.md §6: una misura che non si ripete non è una misura. La
composizione è fissata qui, e la baseline ricalcolata con essa è l'unico
confronto valido. **Approvata il 2026-11-12 come v3** (v2 + V-GIUNZIONE e
M-RIEP-SEDUTA): C4 conta 7 voci, C7 ne conta 7. Lettura mia: approvare le voci
v3 presuppone il righello v2 (domanda aperta nel rapporto del 2026-11-12b).

| # | Voci contate | Baseline ricalcolata |
|---|---|---|
| C1 | G1, G3, G5, G7, P-2d, P-4b, S4 (7) | 1/7 = 14% |
| C2 | L1, L2, L3, L5 (4) | 0/4 = 0% |
| C3 | 3 clausole: esercizi fuori catalogo · progressi ricalcolabili · numeri del consiglio uguali a quelli delle regole | 2/3 = 67% |
| C4 | G2, P-2c, P-2d, P-8c, V-FINITURA, V-VOLUME (6) · **v3: + V-GIUNZIONE** (sequenze dentro la seduta: balistici, prese consecutive, picchi sistemici — PROGRAM_RULES §2) | 1/6 = 17% |
| C5 | G7-pers (il gradino di partenza dipende dal valore misurato), P-2b, S6 (3) | 1/3 = 33% |
| C6 | P-2b, P-2c, S1, R-ALMASSIMO (4) | 2/4 = 50% |
| C7 | M-MM, M-SETT, M-VOL, M-ADER, M-RIEP, M-DUR (6) · **v3: + M-RIEP-SEDUTA** (durata vera, serie fatte su previste, scarto dal piano nel riepilogo di fine seduta) | 4/6 = 67% |
| C8 | D1-D4, una per seduta (4) | 4/4 = 100% |

`N/C` (la funzione non esiste) conta come voce non superata, come in C2.

**Proposta v4 (da approvare, decisione 3 del 2026-11-15):** C4 + **V-LEVE**,
«fine seduta e revisione rispettano l'ordine delle leve e non sommano due
aumenti», misurata con tre proprietà insieme (`14` B e C): **10.P** (ogni
aumento della revisione è lo scavalco o la prima leva che la fine seduta darebbe
allo stesso stato, settimana W+1), **R10b**, **13.P** (nessun aumento dell'app a
meno di 7 giorni da un altro). Al 2026-11-16 passa: C4 v4 = 75% (6/8). **2026-11-20c:** non regge più per B14 (il riquadro di calibrazione propone «+2,5 kg» fuori dall'ordine delle leve e senza R13): C4 v4 = 63% (5/8).

**D5 al 2026-11-20b, con il tetto approvato di 55′:** circuiti 1-3 entro (massimo
49:15). Il circuito 4 arriva a 59:07 con la variante dell'hip thrust (2 → 3,
+4:15), che il §7 di R19 lascia proponibile, e a 56:07 in C3 (L25). D5 stretta:
80%. Proposta: «entro il tetto, salvo il passo di una variante» (decisione di
Alessio).
**Proposta v4, seconda voce (2026-11-20, da approvare):** C8 + **D5**, «durata
stimata della seduta con gli stati raggiungibili (tempo e pausa ai massimi)
entro il tetto dichiarato». Con R18 la stima segue gli stati: 46-59′ (66′ con
hip thrust monopodalico) contro 40′ dichiarati (M19). Oggi C8 conta D1-D4 a
bonus 0 e resta 100%; con D5 scenderebbe all'80% (4/5).

## Convenzioni in attesa di approvazione (non coperte dalla decisione del 2026-11-12)

| Cosa | Scelta dell'app | Mio riferimento | Stato |
|---|---|---|---|
| La finitura metabolica conta nel volume settimanale | dal 2026-11-12 **una regola sola**: F e Z non contano, abbandonate sì, aperte no (R3 di training-designer, METHOD 1.1) | R3 | **da approvare** con R3; misura allineata a R3 (`10-volume-r3`) |
| Fascia 16-20 su otto gruppi | Progressi confronta fatte con previste; la fascia 16-20 sta a parte, senza colori. R3 propone fasce per gruppo (prioritari 16-20, braccia 32-40, mantenimento ≥ 6): non implementate, in attesa di D-13 | la fascia come riferimento, non come giudizio sull'atleta | **da decidere** (D-13) |
| Arrotondamento delle sedute dovute | troncamento: 0 dovute il primo giorno, 2 su 4 al quarto giorno di sette | dal 2026-11-09 **troncamento**, allineato: non dichiara mai in ritardo chi è in pari. Prima arrotondamento | **da approvare**: se diventa arrotondamento, M-ADER torna a non coincidere e C7 scende a 67% |
| «in pari» al posto della percentuale | compare con 0 sedute dovute | accettato come risposta, non come dato mancante | da confermare |

## Come si misura (riproducibilità)

Non c'è nessun modello nel prodotto: la stessa fixture dà sempre lo stesso
numero. Quindi una misura che cambia da un giro all'altro è **una regola che è
cambiata**, mai rumore. Chi misura:
1. esegue `quality/scripts/safety-core` e gli script `01..11` pertinenti (elenco in INDEX.md);
2. confronta criterio per criterio con l'ultima riga di RESULTS.md;
3. ogni scostamento va spiegato con una modifica a `src/data/` o `src/engine/`,
   altrimenti è un difetto nuovo da aprire.

Gli script non leggono il codice che produce la metrica: ricalcolano durata,
volume, aderenza e medie dai dati della scheda e confrontano.
