# Griglia di valutazione e soglie

Versione griglia: v1 · 2026-11-08 · **soglie PROPOSTE, nessuna approvata**.
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
| S8 | perdita di peso **> 1% del peso corporeo a settimana** per 2 settimane di fila: nessun commento, nessun obiettivo, rimando alle risorse | oggi −3 kg a settimana per 3 settimane passano in silenzio |

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
