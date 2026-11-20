### Riepilogo e verdetto
GO per regressioni vs 59daf79 (criteri pieni: NO-GO per 4 FALLITI del nucleo e Bloccanti noti di training-quality, invariati). Nessun Bloccante o Alto nuovo trovato da me. "GO" = pronto per la decisione, non rilasciato.

### Oggetto
Ramo claude/calisthenics-pwa-offline-kor52w, f5455d8 (221b2e8 B1 + smoke A19, nucleo v9). Dimensione L (modifica al metodo; training-quality GO: quality/reports/2026-11-20-quality-221b2e8.md). Punto di ritorno 59daf79.
Diff 59daf79..f5455d8: src/types, src/db, firestore.rules vuoti (verificato). src/data: solo circuit.ts (+8/-1, nota circuito 4). Codice: draft.ts, progression.ts, SessionSummary.tsx + test; scripts/smoke.mjs (A19).

### FAT
- verify: 38 file, 880 test verdi, nessun URL video. Smoke verde (3m10), riga A19: 37' -> 41' con +2"/+2", panoramica 41'. Offline verde (36 s). Eseguiti in sequenza. Albero pulito dopo.
- Nucleo v9 (node --experimental-strip-types quality/scripts/safety-core.mts): 2 PASS, 4 FALLITI, 2 NON COPERTI, identico al conteggio di training-quality.
  1 NON COPERTO (nessuna regola sul dolore); 2 FALLITO (B9, 4 blocchi Z1 dead hang); 3 FALLITO (37/52 blocchi senza alternativa, B6); 4 FALLITO solo per S9 (4h, B10; 4e v9 superato); 5 PASS; 6 FALLITO (6b: 0 approvati su 265, B8; 6a ok); 7 PASS; 8 NON COPERTO (regola presente, nessun accesso incrociato eseguito).
- Confronto con 0f3f191: stessi casi, stessi esiti, nessuna regressione.
- Flussi: tutti e 8 coperti da smoke/offline verdi.

### UAT (persone fittizie)
NON eseguite (debito L aperto da più rilasci).

### Checklist UAT per Alessio (telefono, ~5 min)
1. Home: badge durata di una seduta. Atteso: uguale alla durata nella panoramica della seduta. [si/no]
2. Cambia a mano tempo/pausa di un esercizio. Atteso: il badge in Home cresce di conseguenza. [si/no]
3. Fine di una seduta in settimana 5, 11 o 17. Atteso: nessuna proposta di leve/aumento nel riepilogo (scarico in arrivo). [si/no]
4. Seduta lunga. Atteso: durata mai oltre 55'. [si/no]
5. Circuito 4: legge la nuova nota, testo chiaro. [si/no]
6. Primo peso di un esercizio nuovo: proposta sensata e registrazione serie rapida a mani sudate. [si/no]
7. Modalità aereo: apri scheda e un esercizio con figura. Atteso: tutto visibile. [si/no]

### Non testato e da confermare
- Rollback in produzione (Vercel, ritorno a 59daf79): NON VERIFICATO.
- 2 persone fittizie e UAT: NON eseguite.
- Caso 8 (accesso incrociato su emulatore): NON COPERTO. Caso 1: NON COPERTO.
- Qualità visiva su telefono reale: NON TESTATO.
- Bloccanti/Alti aperti di training-quality non ricontrollati da me (non nuovi).

### Domande aperte
1. Alessio accetta il rilascio con i 4 FALLITI (B6, B8, B9, B10) e i 2 NON COPERTI noti, come per 0f3f191?
2. Il rollback Vercel (piano, deploy Current, ritorno a 59daf79) va verificato prima del push?
