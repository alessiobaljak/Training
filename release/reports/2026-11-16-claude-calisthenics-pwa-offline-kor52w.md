# Gate 2026-11-16 — claude/calisthenics-pwa-offline-kor52w @ a747e09 (L)

## Riepilogo e verdetto
- Per regressioni rispetto a 79d2cb0: GO (pronto per la decisione di Alessio). Nessun peggioramento trovato; il caso 4 migliora (6 violazioni -> 1).
- Con i criteri pieni del gate (nucleo 4 FALLITI, 5 Bloccanti attivi di training-quality: B6, B8, B9, B10, M4): NO-GO. Il GO regge solo sulla decisione di Alessio del 2026-11-15/16 («non peggiorati», esteso agli Alti A10, A16, A17).
- verify, smoke, offline verdi, in sequenza. Rollback: procedura scritta ma non eseguibile alla lettera (vedi sotto). UAT con 2 persone fittizie: NON ESEGUITA.

## Oggetto
Branch claude/calisthenics-pwa-offline-kor52w, head a747e09, 47 file da 79d2cb0 (R5-R8, revisione riscritta, smoke B11/A15, rollback §10, versione build). Dimensione L confermata (regole di progressione, revisione). training-quality su ff42dfb: GO al push (quality/reports/2026-11-15-quality.md). a747e09 aggiunge solo documenti.

## FAT
- verify: 35 file, 774 test passati, nessun URL di video. 9 s.
- Nucleo (quality/scripts/safety-core.mts, v6): 2 PASS, 4 FALLITI, 2 NON COPERTI, identico al 2026-11-12b nel conteggio.
  1 NON COPERTO (nessuna regola sul dolore; B1 solo rilascio pubblico) | 2 FALLITO (2c, 4 blocchi Z1 dead hang 30" con test 8": B9) | 3 FALLITO (37/52 blocchi con attrezzo senza alternativa; manca il campo attrezzatura) | 4 FALLITO (solo 4h, S9: circuito-4 sett.1 F4 -> F1 con 0"; B10; 4a-4g, 4i corretti) | 5 PASS | 6 FALLITO (265 file, 0 approvati: B8; 6a ok) | 7 PASS | 8 NON COPERTO (regola presente, nessun accesso incrociato eseguito).
- smoke: superato, 2m55. Build compresa.
- offline: superato, 35 s (lanciato dopo smoke, mai insieme).
- B11/A15 verifica indipendente: ho letto scripts/smoke.mjs 1707-1890. Il test gira nel browser: 9 serie in Seduta 2, tempo «Sì», «Accetto, dalla prossima volta», controllo che il titolo resti quello della leva accettata (A15), page.reload prima di «Salva e chiudi» e verifica che la scelta risulti già fatta senza nuova proposta (B11), poi lettura dell'emulatore: una sola suggestion per A1 con decision=accepted e exerciseStates uguale a stateAfter. Ogni passo è un check() non condizionale: se non ci arriva fallisce. Smoke verde => B11 e A15 CHIUSI e provati in browser. Limite: copre una sola coppia (trazioni/A1 S2), non tutte le leve.
- Revisione: lo smoke la esercita con coppie di sedute (R8), verifica «Settimana 1 chiusa», numeri citati («su un range di»), ricarica con verdetto già deciso. Non esercita i tre stati con tutti gli elenchi né «Ho capito» sui verdetti nuovi (solo UAT manuale).

## Rollback §10 (letto, non eseguito): cosa manca
1. Il passo «annota il deploy Current» va fatto PRIMA del push; con auto-assign acceso (decisione di Alessio) ogni push è già produzione: la procedura non dice chi/quando lo annota. Per questo rilascio il punto di ritorno è il deploy di 79d2cb0 o di un commit successivo: da annotare ora.
2. Sul piano Hobby Instant Rollback torna solo al deploy immediatamente precedente. Dopo 79d2cb0 ci sono più push (3c1d032, a406d1f, 2c9d822, ff42dfb...): quel deploy può non essere raggiungibile. §10 rimanda a git revert, ma non dice se il piano è Hobby o Pro: da controllare su Vercel.
3. Il caso «Esercizio sconosciuto» è coperto bene: git diff 79d2cb0..HEAD su src/data, src/types, src/db, firestore.rules è vuoto, quindi tornare a 79d2cb0 non tocca catalogo né dati. Verificato.
4. Versione: Impostazioni > Programma > Versione esiste (SettingsScreen.tsx:539, __APP_COMMIT__ = VERCEL_GIT_COMMIT_SHA a 7 caratteri). Il service worker usa skipWaiting + clients.claim e platform.ts ricarica su controllerchange: coerente col testo. Non provato su telefono.
5. «Scarica il backup» in App e dati esiste (SettingsScreen.tsx:400). Ok.
6. Mai eseguita (lo dice §10): resta NON VERIFICATA in produzione.

## UAT (persone fittizie)
NON ESEGUITA: debito dell'L, non ho potuto leggere /quality/PERSONAS.md in modo da condurre una prova credibile entro il gate leggero. Nessun giudizio su «allenatore o app generica», velocità di registrazione, chiarezza immagini.

## Regressioni rispetto a 79d2cb0
Nessuna trovata: nucleo stesso conteggio e caso 4 migliorato; test 774 verdi; smoke e offline verdi; schema dati/regole invariati; testi non toccano il caso 5. Residui noti (in produzione già prima, non peggiorati): A17 (due aumenti dalle stesse due sedute nella revisione, forma più stretta con R8), M17 («Rimandati» perpetuo), A10, A16. Da correggere nel prossimo giro per decisione di Alessio.

## Checklist UAT per Alessio (revisione settimanale, max 10 min, telefono)
1. Home dopo aver chiuso una settimana: compare «Settimana N chiusa» con invito a rivederla? [ ] sì [ ] no
2. Apri la revisione: il sottotitolo dice quante sedute e quante serie lette, con le date? [ ] sì [ ] no
3. Stato A, c'è almeno un verdetto: titolo, riga di numeri («su un range di»), cosa cambia, pulsante accettare e rifiutare. Accetta uno: sparisce dall'elenco? [ ] sì [ ] no
4. Ricarica la pagina: il verdetto deciso non ritorna? [ ] sì [ ] no
5. Stato B, solo elenchi (nessun verdetto): compare «Nessun cambio da decidere» e gli elenchi («Un gradino ogni due settimane», «Fermi per ora», «Massimo chiuso», «Già rifatti»)? Ogni voce si capisce senza spiegazioni? [ ] sì [ ] no
6. Stato C, troppo pochi numeri: compare «Troppo pochi numeri per giudicare» con la ragione per esercizio? [ ] sì [ ] no
7. Su un verdetto nuovo (R5-R7: niente aumenti in scarico, prima la variante, un gradino ogni 14 giorni) c'è il pulsante «Ho capito» e, premuto, il verdetto non si ripresenta? [ ] sì [ ] no
8. Fine seduta: dopo l'ultima serie il riepilogo propone una sola leva; «Accetto» -> «Scelta registrata»; ricarica; «Salva e chiudi». Il titolo resta lo stesso? [ ] sì [ ] no
9. Impostazioni > Programma: la Versione mostra 7 caratteri uguali al commit in produzione? [ ] sì [ ] no
10. Registrare una serie a mani sudate resta rapido come prima? [ ] sì [ ] no

## Non testato e da confermare
- NON TESTATO: prova con 2 persone fittizie; UAT di Alessio (la checklist 2026-11-08 e 2026-11-09 mai eseguite); rollback; Versione su telefono; i tre stati della revisione con tutti gli elenchi e «Ho capito» (solo test unitari).
- NON COPERTO: nucleo casi 1 e 8. Caso 8: nessun accesso incrociato su emulatore; clearAll sul server non provato.
- Da confermare (sicurezza dati): firestore.rules invariato dal 79d2cb0, ma non eseguito.
- Piano Vercel (Hobby o Pro) e punto di ritorno annotato.

## Domande aperte
1. Alessio: il GO per regressioni basta, o con 5 Bloccanti (B6, B8, B9, B10, M4) e 4 casi FALLITI vale ancora la decisione del 2026-11-15 di non fermare il push?
2. Alessio: su Vercel il piano è Hobby o Pro, e quale deploy è «Current» adesso (punto di ritorno)?
3. Alessio: vuoi eseguire a freddo la prova del rollback (5 minuti) prima del rilascio pubblico?
4. Sessione principale: serve un passo in §10 che dica chi annota il deploy Current quando i push vanno in produzione da soli?
