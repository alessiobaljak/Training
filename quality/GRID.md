# Griglia di valutazione e soglie

Versione griglia: v2 · 2026-11-09 · **soglie PROPOSTE, nessuna approvata**.
Approva Alessio. Finché non approva, in RESULTS.md l'esito si legge «misurato
contro soglie proposte».

## Gravità dei difetti

| Gravità | Definizione | Effetto |
|---|---|---|
| **Bloccante** | l'app può proporre un esercizio oltre il livello o fuori attrezzatura, superare una soglia di progressione, o manca un rimando dovuto | NO-GO. Nessuna eccezione, nessuna compressione |
| **Alto** | un numero mostrato all'atleta è sbagliato, o una regola del metodo è applicata al contrario, sempre e per tutti | NO-GO su rilascio di dimensione L; su M serve una mitigazione dichiarata |
| **Medio** | l'app è corretta ma inutile o rumorosa in uno scenario reale | si può rilasciare, si registra con una data |
| **Basso** | difetto cosmetico o rischio che si attiva solo con il secondo utente | si registra |

## Gli otto criteri

| # | Criterio | Misura | Soglia proposta |
|---|---|---|---|
| C1 | **Sicurezza** | % di scenari di sicurezza senza violazione dei limiti (livello, attrezzatura, soglie di progressione) | **100%** — ogni violazione è Bloccante |
| C2 | **Rimandi** | % di rimandi corretti sui 4 scenari di limite che li richiedono (L1, L2, L3, L5) | **100%** — un rimando mancato è Bloccante |
| C3 | **Fedeltà** | % di uscite senza esercizi fuori catalogo, senza dati sui progressi non ricalcolabili, senza numeri del consiglio diversi da quelli delle regole | **100%** |
| C4 | **Coerenza con il metodo** | % di scenari coerenti con METHOD.md e PROGRAM_RULES.md (volume, frequenza, recupero, struttura, ordine delle leve) | **≥ 90%** |
| C5 | **Personalizzazione** | % di consigli che citano almeno un dato reale dell'atleta (numeri, range, gradino, settimana) | **≥ 80%** |
| C6 | **Concretezza** | % di uscite che dicono cosa fare nella prossima seduta | **≥ 90%** |
| C7 | **Analisi dei progressi** | % di metriche che coincidono con il ricalcolo indipendente | **100%** |
| C8 | **Durata** | % di sedute entro il tetto dichiarato dal programma | **100%** |

Regola di esito complessivo proposta: **GO possibile solo con Bloccanti = 0 e
Alti = 0 su rilascio L**. C4-C6 sotto soglia non bloccano da soli, ma tre
criteri sotto soglia contemporaneamente valgono come un Alto.

## Soglie di sicurezza sulla progressione (proposte)

Oggi nel codice non esiste nessuna di queste: `review.ts` e `progression.ts`
non hanno tetti temporali. Sono il contenuto che chiedo a `training-designer`
di mettere in `BOUNDARIES.md` e che poi questa griglia misura.

| ID | Soglia proposta | Perché |
|---|---|---|
| S1 | massimo **1 gradino di scala per esercizio ogni 2 settimane** | oggi si va da 1 a 6 in 5 settimane su 5 settimane di numeri sopra il range; una scala a 6 gradini attraversata in 5 settimane non è una progressione, è un cambio di esercizio ogni lunedì |
| S2 | massimo **+2,5 kg per esercizio a settimana** (già rispettata da `stepLoad`) | passo unico del metodo |
| S3 | nessuna salita di gradino **senza `tempoRespected === true`** su tutte le sedute della settimana | è la regola di `METHOD.md` (`ADVANCEMENT_REQUIRES_REACHING_MAX` + tempo prescritto); oggi la revisione settimanale la aggira con una semplice cautela testuale |
| S4 | nessun verdetto con **meno di 2 sedute** e **meno di 3 serie vere** (non righe) su quell'esercizio nella settimana | oggi 2 serie per lato (4 righe) di una sola seduta bastano |
| S5 | **zavorra solo dopo che la variante è esaurita**, e mai sotto le soglie di `getLoadThreshold` (8 trazioni, 10 dip) | il metodo mette il carico alla leva 5; oggi la revisione lo propone al gradino 1 e non consulta mai `assessLoadNeed` |
| S6 | dopo **≥ 14 giorni** senza sedute chiuse: volume ridotto per 1 settimana e ritest proposto | oggi dopo 20 giorni la seduta proposta è identica |
| S7 | nessun esercizio al di sopra del **gradino compatibile con il valore misurato dal test**, non solo con l'esercizio del test | oggi trazioni complete e dip completi a chi ha misurato 0 |
| S9 | **nessuna stazione balistica carica (swing, slam, clean) subito dopo una stazione di stabilizzazione del tronco a RIR 0-1 o a cedimento**: minimo una transizione dichiarata | proposto il 2026-11-09b. Oggi `circuito-1` manda il suitcase carry con il 24 dentro lo swing 15-20 senza nessun passo, e `circuito-3` fa lo stesso dall'hollow hold. Se approvato, il difetto A8 diventa Bloccante e il nucleo passa a 9 casi |
| S8 | perdita di peso **> 1% del peso corporeo a settimana** per 2 settimane di fila: nessun commento, nessun obiettivo, rimando alle risorse | oggi −3 kg a settimana per 3 settimane passano in silenzio |

## Composizione dei criteri (v2, 2026-11-09)

Il 2026-11-09 C3, C4 e C5 della baseline **non si riproducevano** dalla mappa
di SCENARIOS.md §6: una misura che non si ripete non è una misura. La
composizione è fissata qui, e la baseline ricalcolata con essa è l'unico
confronto valido. **Da approvare da Alessio: è il righello.**

| # | Voci contate | Baseline ricalcolata |
|---|---|---|
| C1 | G1, G3, G5, G7, P-2d, P-4b, S4 (7) | 1/7 = 14% |
| C2 | L1, L2, L3, L5 (4) | 0/4 = 0% |
| C3 | 3 clausole: esercizi fuori catalogo · progressi ricalcolabili · numeri del consiglio uguali a quelli delle regole | 2/3 = 67% |
| C4 | G2, P-2c, P-2d, P-8c, V-FINITURA, V-VOLUME (6) · **proposta v3: + V-GIUNZIONE** (sequenze dentro la seduta: balistici, prese consecutive, picchi sistemici — PROGRAM_RULES §2) | 1/6 = 17% |
| C5 | G7-pers (il gradino di partenza dipende dal valore misurato), P-2b, S6 (3) | 1/3 = 33% |
| C6 | P-2b, P-2c, S1, R-ALMASSIMO (4) | 2/4 = 50% |
| C7 | M-MM, M-SETT, M-VOL, M-ADER, M-RIEP, M-DUR (6) | 4/6 = 67% |
| C8 | D1-D4, una per seduta (4) | 4/4 = 100% |

`N/C` (la funzione non esiste) conta come voce non superata, come in C2.

## Convenzioni in attesa di approvazione

| Cosa | Scelta dell'app | Mio riferimento | Stato |
|---|---|---|---|
| La finitura metabolica conta nel volume settimanale | **due risposte diverse nello stesso repository**: il test di `circuit.test.ts` la esclude (quadricipiti 6), `engine/metrics.ts` la include (quadricipiti 14) | nessuno, finché METHOD §3 non lo dice | **da decidere**: cambia i numeri di V-VOLUME e il numero che l'atleta vede (difetto M10) |
| Fascia 16-20 su otto gruppi | il programma attivo produce 103,5 crediti-serie contro i 128 che otto gruppi × 16 pretendono: nessuna distribuzione lo soddisfa | la fascia come pavimento su tutti e otto | **da decidere**: o la fascia vale sui gruppi bersaglio, o cambia la struttura |
| Arrotondamento delle sedute dovute | troncamento: 0 dovute il primo giorno, 2 su 4 al quarto giorno di sette | dal 2026-11-09 **troncamento**, allineato: non dichiara mai in ritardo chi è in pari. Prima arrotondamento | **da approvare**: se diventa arrotondamento, M-ADER torna a non coincidere e C7 scende a 67% |
| «in pari» al posto della percentuale | compare con 0 sedute dovute | accettato come risposta, non come dato mancante | da confermare |

## Come si misura (riproducibilità)

Non c'è nessun modello nel prodotto: la stessa fixture dà sempre lo stesso
numero. Quindi una misura che cambia da un giro all'altro è **una regola che è
cambiata**, mai rumore. Chi misura:
1. esegue `quality/scripts/01..05` nell'ordine;
2. confronta criterio per criterio con l'ultima riga di RESULTS.md;
3. ogni scostamento va spiegato con una modifica a `src/data/` o `src/engine/`,
   altrimenti è un difetto nuovo da aprire.

Gli script non leggono il codice che produce la metrica: ricalcolano durata,
volume, aderenza e medie dai dati della scheda e confrontano.
