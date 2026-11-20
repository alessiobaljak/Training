# Rapporto release-gate, 2026-11-20c, B2 (ebd3a34), dimensione L

### Riepilogo e verdetto
**GO per regressioni** (pronto per la decisione; ogni push è produzione). Criterio di accettazione soddisfatto: nucleo v10 eseguito per intero con esito identico a quello atteso (2 PASS, 4 FALLITI, 2 NON COPERTI), verify, build, smoke, offline verdi, nessun Bloccante/Alto nuovo introdotto da B2. Per criteri pieni sarebbe NO-GO (4 FALLITI e Bloccanti di quality già noti e preesistenti in produzione, invariati).

### Oggetto
Ramo claude/calisthenics-pwa-offline-kor52w, ebd3a34 vs produzione e30cdc6. Dimensione L confermata (regole di progressione, dati personali: tipo lapsed). Codice: 3b4db08 (R14), d5f72e2 (vetro, solo UI), 0d85597 (D-19 b, R14d). ebd3a34 solo file di quality. Esito positivo di training-quality: quality/reports/2026-11-20-quality-0d85597.md (GO).
Diff src/db + src/types: non vuoto (3 file, +15/-3): SuggestionDecision 'lapsed', campo opzionale ref, DecisioneRegistrata. firestore.rules: diff vuoto (verificato). DATA_VERSION invariato.

### FAT
- verify: 40 file, 908 test passati; check URL video ok. Build ok (solo avviso chunk > 500 kB, preesistente).
- Nucleo v10 (node --experimental-strip-types quality/scripts/safety-core.mts):
  1 NON COPERTO (nessuna regola sul dolore; B1 solo rilascio pubblico);
  2 FALLITO (2c, 4 blocchi Z1 dead-hang, B9, invariato);
  3 FALLITO (37/52 blocchi senza alternativa corpo libero, B6, invariato);
  4 FALLITO solo per 4h (S9, 0" fra plank tocco spalla e corda slam, B10, invariato); 4a-4g, 4i e 4j (R-7) superati;
  5 PASS; 6 FALLITO (265 file, 0 approvati, B8, invariato); 7 PASS; 8 NON COPERTO (nessun accesso incrociato eseguito).
  Totale 2 PASS, 4 FALLITI, 2 NON COPERTI = v10 di quality. Nessun caso peggiorato.
- smoke verde (3m14): righe attese presenti: "R14d: stacco, peso di partenza 8.", "R14: stacco [null,1,1,8], record lapsed presente.", "A19: Seduta 2 in Home 38' -> 41' ... panoramica 41'.". Limite noto (quality): R14 usa una scelta scritta a mano sullo stacco; il percorso "revisione accettata -> seduta allo stesso peso" non e coperto da un browser (coperto solo da test unitari e 4j).
- offline verde (38 s), eseguito dopo smoke, mai in parallelo.
- Flussi principali (SMOKE_FLOWS): accesso, scheda, seduta guidata, progressi, revisione, immagini, offline: coperti da smoke/offline verdi.
- Rollback a e30cdc6: LIMITE VERIFICATO sul codice. Il vecchio backup.ts usa expectOneOf su decision con soli 'accepted'|'postponed': un backup esportato da B2 che contenga almeno un record lapsed viene rifiutato per intero (BackupError, nessun import parziale). Un backup senza record lapsed resta importabile (DATA_VERSION invariato, ref e opzionale). Dati gia in Firestore/IndexedDB con decision 'lapsed' tornando a e30cdc6: lettura da parte del vecchio codice NON provata (da confermare). La procedura di rollback Vercel resta NON VERIFICATA (nessun redeploy eseguito).

### Giudizio su B14
Riquadro di calibrazione "Aggiungi 2,5 kg" senza controlli delle leve: preesistente, identico su e30cdc6, non introdotto da B2, fuori dal nucleo. Non blocca questo push: fermarlo non lo toglierebbe dalla produzione e lascerebbe aperti R-7 e M18 (R-7 provato corretto da 4j su 0d85597, in produzione fallisce). Da correggere subito nel rilascio successivo.

### UAT (persone fittizie)
NON ESEGUITO (debito per ogni L, invariato). Non ho provato i flussi con le persone di quality/PERSONAS.md.

### Checklist UAT per Alessio (5-8 minuti, telefono)
1. Apri una seduta con un esercizio a manubri dopo che la revisione ha accettato un manubrio piu pesante, ma senza averlo ancora preso. Atteso: il peso del player parte dal manubrio di prima e il passo e 1 kg. [ si / no ]
2. Scrivi il manubrio nuovo e chiudi la serie. Atteso: viene registrato quello che hai scritto. [ si / no ]
3. Chiudi una seduta senza eseguire una salita accettata (es. stacco). Atteso: alla seduta dopo il peso e quello di prima, nessuna salita in silenzio. [ si / no ]
4. Fine seduta: il riepilogo propone il manubrio successivo esatto (non +2,5 kg generico per i manubri). [ si / no ]
5. Guarda Home, scheda e riepilogo nei due temi: contenitori leggibili con il vetro, testo non coperto dallo sfondo. [ si / no ]
6. Esporta un backup e reimportalo. Atteso: importazione riuscita. [ si / no ]

### Non testato e da confermare
- NON COPERTI del nucleo: caso 1, caso 8 (accesso incrociato, e clearAll sul server, mai eseguiti su emulatore).
- NON TESTATO: persone fittizie; UAT di Alessio; rollback Vercel; percorso browser "revisione accettata -> seduta allo stesso peso"; lettura di record lapsed da parte del codice e30cdc6 dopo un rollback.
- Da confermare: i 4 FALLITI e i Bloccanti di quality restano aperti e preesistenti.

### Domande aperte
Nessuna che tocchi la sicurezza dei dati. Una per la sessione principale: quando si chiude il percorso browser di R14 senza scelta scritta a mano, e B14 nel rilascio successivo.
