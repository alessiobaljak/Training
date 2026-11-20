# Rapporto 2026-11-20 — 0f3f191 (L)
### Riepilogo e verdetto
GO per regressioni vs 001de30 (criteri pieni, come i rilasci precedenti: NO-GO per 4 FALLITI del nucleo e Bloccanti B6/B8/B9/B10/M4 aperti per decisione). Nessun Bloccante o Alto nuovo trovato. GO = pronto per decisione, non rilasciato.
### Oggetto
Ramo claude/calisthenics-pwa-offline-kor52w, 0f3f191 (4edf751 rilascio A R14-R18, training-quality GO 2026-11-20; 0f3f191 A19 badge durata in Home). Dimensione L confermata (progressione/revisione toccate). Diff 001de30..0f3f191 su src/data, src/types, src/db, firestore.rules: VUOTO (verificato) -> ritorno a 001de30 senza danni ai dati.
### FAT
- verify: verde. 37 file, 857 test passati, nessun URL video. ~9 s.
- Nucleo (v8, eseguito): 2 PASS (5, 7); 4 FALLITI (2 B9, 3 B6, 4 solo 4h/S9 B10, 6 B8: 265 file, 0 approvati); 2 NON COPERTI (1 B1, 8). Invariato rispetto a v8 di training-quality. 4e v8 (S2 sul carico sollevato) superato.
- smoke: verde (3m00), include il controllo R18 «Deve durare almeno N″» sul pike push-up.
- offline: verde (35 s), lanciato dopo lo smoke.
- Rollback: NON VERIFICATO in produzione (Vercel; nessuna procedura scritta). Condizione sui dati soddisfatta (diff vuoto).
### UAT (persone fittizie)
NON ESEGUITE (debito di ogni L, aperto). Copertura indiretta: script 15-r14-r18.mts di training-quality (300 atleti simulati), non mia.
### Checklist UAT per Alessio (5 min, telefono)
1. Home: badge durata della prossima seduta = durata nella panoramica della stessa seduta (A19). [sì/no]
2. Apri la seduta con un esercizio a tempo lento: la stazione dice «Deve durare almeno N″» coerente con l'eccentrica accettata (R18). [sì/no]
3. Registra una serie in modo rapido, mani sudate. [sì/no]
4. Fine seduta: la proposta di aumento (R15) non compare se hai appena alzato il carico. [sì/no]
5. Modalità aereo: apri scheda e seduta. [sì/no]
### Non testato e da confermare
- A19 (Home) senza asserzione dedicata nello smoke: coperto solo da typecheck e non provato al contrario.
- Persone fittizie, UAT, rollback Vercel: NON eseguiti.
- Caso 8 (isolamento utenti) e caso 1: NON COPERTI. clearAll server su emulatore: da confermare.
- Misure 2026-11-16b su miniature: non rimisurate.
### Domande aperte
1. Vuoi che A19 abbia una asserzione di smoke (badge Home = panoramica) prima del prossimo rilascio?
2. Procedura di rollback Vercel (piano, deploy Current) da scrivere e provare: chi la fa?
