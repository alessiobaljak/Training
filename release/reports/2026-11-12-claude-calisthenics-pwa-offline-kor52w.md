# Rapporto release-gate 2026-11-12 — L — head 2d84d87

### Riepilogo e verdetto
**NO-GO.** verify, smoke, offline passati. Nucleo: 2 PASS, 3 FALLITI, 3 NON COPERTI. 7 Bloccanti di training-quality aperti (B1, B2, B3, B4, B6, B8, B9), nessun esito positivo di training-quality (obbligatorio per L). A11 ancora aperto (Alto). A12, A13, A14 chiusi nel codice.

### Oggetto
claude/calisthenics-pwa-offline-kor52w, 2d84d87 (da 03c7395). Dimensione L confermata: metodo (R1/R2/R3, progressione), analisi dei progressi, dati personali. Serve conferma di Alessio sulla classificazione.

### FAT
- verify: typecheck, 34 file / 709 test passati, nessun URL video. 11 s.
- smoke: superato (2m25). offline: superato (39 s). Eseguiti in sequenza.
- Nucleo (node --experimental-strip-types quality/scripts/safety-core.mts):
  1 NON COPERTO (nessuna regola sul dolore) · 2 FALLITO (2c: dead hang 30" al gradino 2 con 8" misurati, 4 blocchi Z1) · 3 FALLITO (37/52 blocchi senza alternativa a corpo libero, nessun campo attrezzatura) · 4 FALLITO (4a S3, 4b S5, 4c S1, 4d S4 superate; 4e,4f,4g ok) · 5 PASS · 6 NON COPERTO (6a ok, 6b nessun registro) · 7 PASS · 8 NON COPERTO (regola presente, nessun accesso incrociato eseguito).
- Verifica correzioni (script 07-11 rieseguiti + lettura del diff 47c7f6d..2d84d87):
  - A12 chiuso: il cronometro dice solo «no» (SessionSummary); il «sì» lo dà l'atleta. Script 07 misura ancora il vecchio controllo (22/22 passano ritmi veloci) ma il sì automatico non esiste più. Non rieseguito nell'app reale: NON TESTATO a runtime.
  - A13 chiuso nel codice: `statesToSave` in draft.ts, usato da GuidedSession e SessionScreen, con test in draft.test.ts (verify verde). Lo script 08 stampa ANNULLATA perché riproduce il vecchio ordine delle funzioni e non chiama `statesToSave`: è lo script ad essere obsoleto, non la prova che il difetto sia aperto. Nessuna prova end-to-end nell'app (smoke non lo esercita: NON TESTATO).
  - A14 chiuso: testo del riepilogo riscritto, non consiglia più di alzare i carichi.
  - A11 APERTO: script 11 (usa il vero buildDraftSession) → NO in settimana 2, 3, 4: etichetta «Liv. 1 · Trazioni assistite» con stato al gradino 3/4. `draft.ts:84` copia ancora `past?.variantLabel`; nessuna correzione nel diff.
  - Nuovi: script 10 → 1 NO (M14, Progressi mostra il «previsto» pieno in settimana 6 di scarico), già noto. Nessun difetto nuovo oltre a questo.
  - B9 solo in parte: l'onboarding ora nomina il dead hang (testOutcomes con notJudged), ma il 30" al gradino 2 resta (caso 2c).
- Figure: media/reports/2026-11-12-media.md: 4 da rifare, pull-over-trx peggiorata. B8 (zero approvate da Alessio) aperto.
- Rollback in produzione: NON VERIFICATO (nessuna procedura scritta, invariato).

### UAT (due persone fittizie)
NON ESEGUITO (debito per ogni L). Con Bloccanti aperti non ha senso valutare «allenatore o app generica» prima delle correzioni.

### Checklist UAT per Alessio (max 10 minuti, telefono, da fare solo dopo correzione dei Bloccanti)
Seduta guidata vera, dall'inizio alla fine:
1. Apri la Home e tocca «Apri Seduta N» → parte il riscaldamento. Sì/No
2. Finito il riscaldamento il primo esercizio parte da solo (partenza automatica, senza tocchi). Sì/No
3. Durante il recupero compare l'anteprima dell'esercizio successivo (figura chiara, leggibile da terra). Sì/No
4. Registri una serie con «Fatto» con una mano: rapido (meno di 3 secondi)? Sì/No
5. Nelle stazioni a tempo il conto scorre da solo e passa alla successiva. Sì/No
6. «Salta il recupero» su un recupero: il riepilogo non ti dice di alzare i carichi. Sì/No
7. Il riepilogo finale compare, non parla di «tempo tenuto» deciso dal cronometro, e il gradino/etichetta di ogni esercizio è quello di oggi. Sì/No
8. Accetta una leva suggerita («Accetto, dalla prossima volta») poi «Salva e chiudi». Riapri la scheda: la leva accettata è ancora lì (gradino o kg nuovi). Sì/No
9. Diario: l'etichetta dell'esercizio corrisponde al gradino accettato (non «Liv. 1» vecchio). Sì/No
10. Modalità aereo: apri l'app e la scheda, vedi le figure. Sì/No

### Non testato e da confermare
- NON TESTATO: leva accettata (A13) e stato del cronometro (A12) nell'app reale; nessuno smoke li esercita.
- NON TESTATO: prova con 2 persone fittizie; qualità sul telefono reale; misura delle miniature (0/12 non ritagliate al 2026-11-09, non rimisurata).
- NON COPERTO: nucleo casi 1, 6, 8. Caso 8: da confermare alla sessione principale (regole Firestore non esercitate; azzeramento sul server mai provato su emulatore).
- Script quality/scripts/08 obsoleto (non usa statesToSave): da aggiornare da training-quality, altrimenti segnala un falso difetto.
- Tempi L: verify 11 s, smoke 2m25, offline 39 s, nucleo <2 s.

### Domande aperte
1. Alessio: conferma la classificazione L?
2. Alessio: S7 vale per i blocchi esclusi (decompressione)? Decide se il caso 2c è FALLITO o PASS.
3. A11 (etichetta del gradino nel diario): chi la corregge? Proposta: `buildDraftSession` usa `variantLabelFor` e non `past?.variantLabel`.
4. Serve un nuovo passaggio di training-quality su 2d84d87 prima di un nuovo gate L.
