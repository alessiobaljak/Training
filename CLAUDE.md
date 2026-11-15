# Shadow — istruzioni di progetto

PWA di personal trainer. Locale prima di tutto, offline, in italiano, pensata per il telefono appoggiato a terra con le mani sudate. Oggi la usa solo Alessio; è progettata per diventare un servizio pubblico.

Contesto esteso e storia in `docs/`. Leggili solo quando servono: `docs/configurazione.md` (Firebase, deploy, variabili), `docs/SESSION_STATE.md` (dove siamo adesso).

## Due regole di architettura

1. **I numeri li decidono regole deterministiche.** Carichi, serie, ripetizioni, progressioni e scelta degli esercizi vengono da regole scritte e testabili in `src/data/` e `src/engine/`. Oggi nell'app non c'è nessun modello AI, ed è una proprietà da difendere: se un giorno ne arriverà uno, spiegherà e motiverà, non deciderà numeri né sceglierà esercizi fuori catalogo.
2. **L'app mostra solo immagini approvate da Alessio.** Stanno in `src/assets/`, entrano nel bundle a build time e nella cache del service worker. In produzione non si genera nessuna immagine al volo.

## Chi fa cosa

| ambito | a chi va |
|---|---|
| Metodo, catalogo esercizi, regole dei programmi e della progressione, analisi dei progressi, regole dei consigli, limiti di sicurezza | `training-designer` |
| Immagini degli esercizi: stile, checklist, registro, copertura, licenze, specifica del generatore | `exercise-media-lead` |
| Qualità e sicurezza del metodo, verifica tecnica indipendente delle immagini | `training-quality` |
| Test prima del rilascio, verdetto GO / NO-GO | `release-gate` |
| Codice, interfaccia, testi dell'app, integrazioni, pubblicazione delle immagini | sessione principale |

Chi progetta non valuta. Le regole di rilascio le decide Alessio (vedi «Regole che non si toccano»).

## Flussi

- **Modifica al metodo**: `training-designer` → implementazione → `training-quality` → `release-gate` (dimensione L) → ok di Alessio → deploy.
- **Immagine**: scheda tecnica di `training-designer` → verifica di `exercise-media-lead` → verifica indipendente di `training-quality` → approvazione di Alessio → pubblicazione (sessione principale) → `release-gate` (dimensione M) → ok di Alessio → deploy.
- **Tutto il resto**: implementazione → `release-gate` con la dimensione corretta → ok di Alessio → deploy.

Fino al rilascio pubblico il passo «ok di Alessio» nei flussi non c'è: vale la regola sul deploy in «Regole che non si toccano».

## Regole sui token, per tutti i subagent

- All'inizio di ogni invocazione si legge `INDEX.md` della propria cartella e **solo** i file pertinenti. Mai "tutto all'inizio".
- Log e registri: voci aperte e ultime 10 nel file principale, il resto in `ARCHIVE.md`. Nessun file di memoria oltre le 300 righe.
- Rapporto completo su file; alla sessione principale massimo 30 righe (20 per `release-gate`). Difetti Bloccanti e Alti e domande aperte sempre testuali e completi, anche se sforano.
- Brief compatti: richiesta, vincoli, criteri di accettazione e percorsi dei file. Mai contenuti che il subagent può leggere da solo.
- Immagini: si guardano a bassa risoluzione, si ingrandisce solo il dettaglio dubbio, non si riguardano quelle già approvate.
- Prima si cerca (`Grep`, `Glob`), poi si leggono solo le righe necessarie. Non si rilegge un file non modificato. Non si leggono `node_modules/`, `dist/`, `package-lock.json`, `.screenshots/`, file binari.
- Test e build: solo riepilogo e fallimenti. Log: solo errori, avvisi e righe pertinenti.
- Modifiche mirate, mai riscritture integrali. Nelle risposte ad Alessio niente file ristampati: esito, cosa è stato fatto, cosa serve da lui, dove sono i dettagli.
- `docs/SESSION_STATE.md` aggiornato a ogni tappa. A compito chiuso o con contesto lungo, si suggerisce di compattare.
- Ogni subagent creato in futuro segue queste regole; chi lo crea adatta il suo file e segnala cosa ha cambiato.

## Regole che non si toccano, qualunque sia il risparmio

- Il nucleo di sicurezza di `release-gate` si esegue per intero a ogni rilascio, anche S.
- Carichi, serie, ripetizioni e scelta degli esercizi vengono da regole deterministiche.
- L'app serve solo immagini approvate; nessuna generazione di immagini in produzione.
- Nessun GO, PASS o test superato su ciò che non è stato eseguito davvero. Ciò che non è verificabile è NON COPERTO, mai PASS.
- Nessuna compressione di difetti Bloccanti o Alti e di domande aperte.
- Fino al rilascio pubblico, un push con verify, smoke e offline verdi va in produzione senza ok; le modifiche al metodo aspettano training-quality. Dal rilascio pubblico l'ok di Alessio torna obbligatorio. (Decisione di Alessio, 2026-11-15: l'ambiente è ancora privato. Su Vercel ogni push su questo ramo è un rilascio.)

## Comandi

`npm run verify` (typecheck + test + controllo URL video) · `npm run smoke` · `npm run offline` · `npm run shots` · `npm run svg`.

**`smoke` e `offline` non si lanciano mai in parallelo**: usano le stesse porte dell'emulatore Firebase (8080, 9099).

## Vincoli di contenuto

- **Nessun URL di video nel codice.** L'app compone una ricerca YouTube a runtime da `Exercise.videoQuery`. Lo verifica `npm run check:no-video-urls`.
- **Licenza RepDB** (`src/data/exercise-art.ts`): uso in-app anche commerciale con attribuzione visibile. Il termine 3 vieta di ripubblicare l'archivio come dataset; il **termine 5 vieta di usare quelle immagini come input, riferimento o materiale di condizionamento per modelli generativi**. L'attribuzione deve restare visibile nell'app.
- **Un titolo, un esercizio.** Un nome che ne contiene due fa fallire un test: le varianti stanno nei gradini della scala o in `ProgramBlock.alternatives`.
