# Rapporto rilascio F, 2026-11-21c

### Riepilogo e verdetto
GO per regressioni su 22f3d31 rispetto alla produzione 4d06a4b (criteri pieni: i FALLITI del nucleo sono quelli già in produzione, nessuno nuovo; il caso 4 passa da FALLITO a PASS). GO = pronto per la decisione di Alessio, non rilasciato.
Nessun difetto Bloccante o Alto nuovo trovato da me.

### Oggetto
Branch claude/calisthenics-pwa-offline-kor52w, HEAD staccato 22f3d31 (worktree relF, pulito). Produzione 4d06a4b. Dimensione L (metodo, dati personali: migrazione di stati, nuova decisione ritest). Esito training-quality positivo su 644bd8c (stesso codice). Diff 4d06a4b..22f3d31: 24 file in src; types e firestore.rules INVARIATI; src/db +388 righe (allFromServer, fissaStatiMancanti, archiviaSeduta, proposteRitest, decidiRitest, migrazione una tantum in session.ts); 2 foto RepDB tolte.

### FAT
- verify: 42 file, 965 test verdi, nessun URL di video (12 s). Build: ok (7 s).
- smoke (5m57, nel worktree): exit 0, 0 errori in pagina; R14d, R14, A19, R21, blocco R9b (trazioni 3 -> 1 con Applica, scheda in Home sparita) verdi.
- offline (37 s, dopo lo smoke): exit 0.
- Nucleo v14 su git archive (script di 22f3d31): 22f3d31 = 3 PASS (4, 5, 7), 3 FALLITI (2 per 2c, 3, 6: 259 file, 0 approvati), 2 NON COPERTI (1, 8). Uguale a quality. 4d06a4b con lo stesso script: 4 FALLITO (4l, 4n, 4o), resto uguale: nessun caso peggiora, il 4 migliora. NON COPERTI restano 1 e 8 (nessun PASS).
- Rollback a 4d06a4b: firestore.rules e src/types identici; gli stati scritti dalla migrazione hanno la forma di sempre (exerciseStates). Prova eseguita sul codice vecchio (aumenti, sceltaInAttesa) con record ritest-<data>:<esercizio>, blockCode 'ritest', lever 'variant', accepted, per 3->1, 6->1 con 5 kg, 6->5: zero aumenti, nessuna scelta in attesa (R13 e R10b non li leggono come salite). backup.ts vecchio: 'variant' e blockCode stringa validi. Limite: lo stato dopo il rollback non ripropone la discesa e il flag localStorage resta inerte.
- Rollback Vercel in produzione: NON VERIFICATO (nessuna procedura scritta).

### UAT (persone fittizie)
NON ESEGUITE da me (debito di ogni L). Ricetta browser 23 di quality: eseguita dal chiamante su 22f3d31, fasi A-D come attese; non rifatta da me.

### Checklist UAT per Alessio (5 min, telefono)
1. Hai un esercizio con ritest migliore dell'ultimo giro e sedute già fatte: apri la scheda. Il gradino NON è salito da solo? [si/no]
2. Chiudi una seduta dal player (Esci e salva). Dopo, fai un ritest migliore: il gradino di quell'esercizio resta com'era? [si/no]
3. Home: «Archivia» una seduta rimasta aperta. Poi un ritest migliore: gradino invariato? [si/no]
4. Registra un ritest peggiore (es. trazioni 3 con gradino 6): in Home compare «Dai test …»? [si/no] Il testo dice a che gradino si scende e non nomina numeri strani? [si/no]
5. Apri #/ritest da quella scheda, premi «Applica»: gradino più basso, scheda sparita? [si/no]
6. Con un altro ritest peggiore, «Lascia com'è»: gradino invariato e la proposta non ritorna? [si/no]
7. Aereo: apri l'app senza rete, la scheda si apre e non scrive nulla di strano? [si/no]

### Non testato e da confermare
- NON COPERTI nel browser: riepilogo del giro di test con le proposte; «Lascia com'è»; «Applica» dalla revisione su scendi-di-livello con zavorra (coperti solo dai test unitari e dal nucleo 4o).
- Migrazione R9c con dati reali di Alessio (copia locale + server) e senza rete: provata solo da test/ricetta, non da me su produzione.
- Persone fittizie, UAT, rollback Vercel: non eseguiti.
- Nucleo: FALLITI 2c (D-Q3), 3 (B6), 6 (B8, 0 approvati su 259); NON COPERTI 1, 8: buchi noti, in evidenza a ogni rilascio.
- Sicurezza dati/regole: invariate, caso 8 non esercitato.

### Domande aperte
- Alessio: ok ai criteri «GO per regressioni» con i 3 FALLITI e 2 NON COPERTI noti, finché l'ambiente è privato?
- D-Q3 (2c, dead hang 30" al gradino 2): ancora da decidere.
- Procedura di rollback Vercel: scriverla e verificarla.
