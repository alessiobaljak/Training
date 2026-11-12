# RULES_CHANGELOG.md — versioni delle regole

Formato: versione · data · cosa è cambiato · perché · esito `training-quality`.
Voci chiuse più vecchie delle ultime 10 ⇒ `ARCHIVE.md`.

## In produzione oggi

**Nessuna versione approvata.** Il comportamento dell'app è quello del codice,
che fino a oggi non era descritto da nessun documento di metodo. Le regole
effettivamente in vigore sono trascritte, con il marcatore `[IN CODICE]`, in
METHOD.md, PROGRAM_RULES.md, PROGRESSION_RULES.md, PROGRESS_REVIEW.md e
ADVICE.md. Quella trascrizione **non cambia niente**: descrive.

## Voci aperte

### programmi 2.0 · progressione 1.1 · metodo 1.1 · progressi 1.1 · schema 1.1 · limiti 1.1
- **Data.** 2026-11-12
- **Stato.** PROPOSTA. Nessun file di `src/` toccato.
- **Cosa.** R1 gradino di partenza dal test (PROGRAM_RULES §3, chiude B5:
  trazioni M=4 ⇒ gradino 1, hip thrust ⇒ 2). Salto dei gradini solo eccentrici
  nei range fissi (PROGRESSION §5, T2). R2 transizione 15" alla giunzione B→F
  (PROGRAM_RULES §2) e limite L14 (= S9). R3 volume: finitura e decompressione
  fuori; fascia per gruppo prioritario/mantenimento, braccia 32-40; Progressi
  mostra fatte/previste/fascia (METHOD §3, PROGRESS_REVIEW §5). R4 test
  richiesti calcolati dal programma: 7 su 9; «non eseguito» al posto di 0.
- **Perché.** Richiesta della sessione principale dopo la revisione totale;
  A8, M10, I3 del rapporto quality del 2026-11-09.
- **Vincolo rispettato.** Nessun esercizio e nessun ordine di stazione cambiato:
  gli scambi sono domande per Alessio.
- **Esito training-quality.** Non ancora valutato.

### metodo 1.0 · programmi 1.0 · progressione 1.0 · progressi 1.0 · consigli 1.0 · schema 1.0 · limiti 1.0
- **Data.** 2026-11-08
- **Stato.** PROPOSTA, in attesa di approvazione. Nessuna riga di codice toccata.
- **Cosa.** Primo avvio: audit del metodo in produzione e prima specifica
  scritta. Trascrizione delle regole esistenti più le proposte marcate
  `[PROPOSTA]`, tenute separate riga per riga.
- **Perché.** L'app è stata costruita prima della sua specifica. Prima di
  aprirla al pubblico serve un testo che dica quali soglie valgono, dove
  stanno, e cosa l'app non fa — soprattutto l'ultima cosa: limiti di sicurezza
  non ne aveva nessuno.
- **Novità con peso.** `limiti 1.0` (BOUNDARIES.md, 13 limiti operativi);
  definizione dello stallo; 5 tetti di progressione mancanti (T1-T4 + zavorra);
  7 campi obbligatori mancanti nella scheda esercizio; regola deterministica di
  sostituzione per attrezzo mancante.
- **Esito training-quality.** Non ancora valutato.
- **Esito release-gate.** Non applicabile: nessuna modifica al prodotto.

## Regola di versionamento

1. Quattro famiglie indipendenti: metodo, programmi, progressione, consigli.
   Più tre di supporto: schema, progressi, limiti. Ognuna ha il suo numero.
2. Cambio di **soglia numerica** ⇒ minor (1.0 → 1.1). Cambio di **struttura**
   di una regola o di un verdetto ⇒ major (1.1 → 2.0). Riformulazione di un
   testo senza effetti su un numero ⇒ patch (1.0 → 1.0.1).
3. Nessuna versione entra in produzione senza: esito di `training-quality`,
   verdetto di `release-gate` con la dimensione corretta, ok esplicito di Alessio.
4. Ogni consiglio prodotto registra la versione delle regole che lo ha generato
   (ADVICE §4.7): uno storico generato da soglie diverse va riletto sapendo quali.
5. Un limite di BOUNDARIES.md non si allenta mai senza una voce qui che dica chi
   lo ha deciso e sulla base di cosa.
