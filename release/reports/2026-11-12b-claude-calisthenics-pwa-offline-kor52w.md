# Rapporto release-gate 2026-11-12b, head 79d2cb0 (L)

### Riepilogo e verdetto
**NO-GO.** verify, smoke, offline passano. Nucleo: 2 PASS, 4 FALLITI, 2 NON COPERTI (invariato rispetto a v5). training-quality su 90b8b81: NO-GO con 10 Bloccanti attivi (A2, A3, A4, M1, M4, B6, B8, B9, B10, B11). Rilascio L senza esito positivo di training-quality.

### Oggetto
Branch claude/calisthenics-pwa-offline-kor52w, 79d2cb0. Dimensione L (metodo/progressione, dati personali: bozze e stati salvati). Novita dal 2d84d87: A11 alla radice (90b8b81), B11 e A15 (79d2cb0: sessionDecisions in src/engine/draft.ts, usata da GuidedSession.tsx e SessionScreen.tsx). Le modifiche di codice sono limitate a draft.ts, GuidedSession.tsx, SessionScreen.tsx e test.

### FAT
- verify: PASS (34 file, 715 test, nessun URL di video), 11 s.
- smoke: PASS ("onboarding completo e gradini di partenza corretti"), 2m25.
- offline: PASS (modalita aereo e server spento), 39 s. Eseguito dopo smoke, mai insieme.
- Nucleo (quality/scripts/safety-core.mts, v5, soglie approvate):
  1 NON COPERTO (nessuna regola sul dolore; B1 blocca solo il rilascio pubblico, resta NON COPERTO, non PASS)
  2 FALLITO (2c: 4 blocchi Z1 dead hang 30" al gradino 2 con 8" misurati; B9)
  3 FALLITO (37 blocchi su 52 senza alternativa a corpo libero; nessun campo attrezzatura)
  4 FALLITO (6 soglie: S3 con false e con null, S5, S1, S4, S9)
  5 PASS
  6 FALLITO (265 file nel bundle, 0 approvati; 6a nessuna generazione a runtime verificato; B8)
  7 PASS (6 stringhe x 4 campi)
  8 NON COPERTO (regola presente in firestore.rules, nessun accesso incrociato eseguito)
- Flussi principali: 1-8 coperti da smoke/offline, passati. Accetta/ricarica non coperto da nessuno script.
- B11/A15: test unitari di sessionDecisions in src/engine/draft.test.ts passano (ricarica: blocco gia deciso, leva resta accettata; riepilogo valutato sullo stato di prima; scelte di altra seduta ignorate; rimando non salva nulla). NON riprodotti in browser: smoke non tocca "Accetto" e non ho potuto scrivere uno script (perimetro). Lo script quality/08 (sezione Q) stampa ancora "ANNULLATA" e "Difetti 2", ma non usa sessionDecisions (0 occorrenze): modella il vecchio comportamento, quindi quel risultato NON e una prova ne a favore ne contro la correzione.
- Rollback in produzione: NON VERIFICATO (nessuna procedura scritta).

### UAT (due persone fittizie)
NON eseguita (debito per ogni L). Non do giudizio su "allenatore vs app generica", rapidita di registrazione, chiarezza immagini sul telefono.

### Checklist UAT per Alessio (max 10 min, solo se si decide di procedere)
1. Apri una seduta, registra le serie di un esercizio con ripetizioni sopra il range, arrivando al riepilogo. Atteso: la proposta di leva e una sola. [ ] si [ ] no
2. Tocca "Accetto". Atteso: sopra "Scelta registrata" compare la leva accettata (non quella successiva, es. non "Sali al livello 4" dopo aver accettato il 3). [ ] si [ ] no
3. Prima di "Salva e chiudi", chiudi la PWA dal sistema e riaprila (o blocca il telefono e ricarica). Atteso: la seduta mostra la scelta gia registrata, nessuna seconda proposta con pulsanti attivi. [ ] si [ ] no
4. Tocca "Salva e chiudi". Atteso: in Progressi/scheda il gradino e quello accettato (es. 3), non 1 e non 4. [ ] si [ ] no
5. Ripeti con "Rimando" su un altro esercizio. Atteso: lo stato resta invariato. [ ] si [ ] no
6. Modalita aereo: apri la scheda e registra una serie. Atteso: funziona. [ ] si [ ] no
7. Apri un esercizio. Atteso: figura visibile e nitida sul telefono. [ ] si [ ] no
8. Fine seduta nel giro 2 della finitura di circuito-4: dopo il plank tocco spalla compare una pausa prima della corda slam? Atteso (B10): si. Oggi probabilmente no. [ ] si [ ] no

### Non testato e da confermare
- B11 dal vivo (ricarica fra Accetto e Salva e chiudi) e A15 in browser: NON TESTATO.
- Caso 8 (accesso incrociato) e clearAll sul server: NON COPERTO / da confermare.
- Due persone fittizie, UAT dell'11-08 e 11-09 mai eseguite, rollback, qualita visiva su telefono: NON TESTATO.
- Lotto eb6bb89 pubblicato saltando i gate.

### Domande aperte
1. Alessio decide B6, B8, B9 (S7 vale per i blocchi esclusi dalla revisione? approvare o ritirare le 265 immagini)?
2. Chi scrive la procedura di rollback Vercel?
3. La sessione principale aggiorna quality/scripts/08 per usare sessionDecisions, oppure autorizza uno smoke che copra Accetto+ricarica?
