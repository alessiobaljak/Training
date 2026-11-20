# Rapporto release-gate 2026-11-20d (rilascio C), dimensione L

### Riepilogo e verdetto
**GO per regressioni** vs fb560e7 (criteri pieni: NO-GO per i 4 FALLITI del nucleo e per i Bloccanti noti di training-quality, invariati). Nessun Bloccante o Alto nuovo. GO = pronto per la decisione, non rilasciato.

### Oggetto
Ramo claude/calisthenics-pwa-offline-kor52w, HEAD c15814a (codice f7f945d), diff contro produzione fb560e7: L26 (d8c18ce), L25 (4142059), M22 (17ea244), B14 (f7f945d); c15814a solo file di quality. Dimensione L (metodo), confermata. training-quality: GO (quality/reports/2026-11-20-quality-f7f945d.md).
Rollback a fb560e7: diff su src/types, src/db, firestore.rules VUOTO (verificato). In src/data cambiano solo circuit.ts, circuit.test.ts, deviations.ts (come previsto). Il vecchio codice legge quindi i dati scritti dal nuovo.

### FAT
- verify: 41 file, 924 test verdi, controllo URL video ok (10 s).
- build: ok (avviso chunk > 500 kB, non nuovo).
- Nucleo v11 intero: 2 PASS (5, 7), 4 FALLITI (2, 3, 4, 6), 2 NON COPERTI (1, 8). Identico al conteggio atteso. Caso 4: 1 violazione su 11, solo 4h (S9, B10); 4j e 4k superati (4k misura su f7f945d).
- smoke: exit 0 (eseguito due volte, la seconda con log completo). Righe: R14d "stacco, peso di partenza 8"; R14 "stacco [null,1,1,8], record lapsed presente"; A19 "Seduta 2 in Home 38' -> 41' con +2''/+2''; panoramica 41'".
- offline (dopo smoke, mai insieme): exit 0, "Prova offline superata".
- Tempi: verify 10 s, build 1 s, smoke 3m12, offline circa 40 s.

### UAT (persone fittizie)
NON eseguite (debito L aperto da sempre). Nessuna valutazione "allenatore vs app generica".

### Checklist UAT per Alessio (5 minuti, telefono)
1. Home: apri il circuito 4. Atteso: durata 55 min (non oltre) / circa 59 se la nota lo dice. [si/no]
2. Chiudi una seduta di circuito: nel riepilogo non compare "aggiungi 2,5 kg". [si/no]
3. Revisione di fine settimana: la durata mostrata coincide con quella in Home. [si/no]
4. Apri la nota/deviazione di una seduta: testo leggibile, nessuna diagnosi o farmaco. [si/no]
5. Registra una serie nel player: veloce, kg corretti. [si/no]

### Non testato e da confermare
- Casi nucleo 1 e 8 NON COPERTI (caso 8: nessun accesso incrociato eseguito; rules invariate).
- FALLITI noti: caso 2 (B9), 3 (B6), 4h (B10/S9), 6 (B8, 0/265 immagini approvate).
- Persone fittizie, UAT, percorso browser R14 (revisione accettata -> seduta) e kg nel player (A18) senza asserzione: NON TESTATI.
- Rollback Vercel in produzione NON verificato (nessuna procedura scritta); solo la compatibilita dei dati e verificata via diff vuoto.
- Residuo B14 sulle sedute archiviate (L31): fuori dal nucleo, decisione di training-designer.

### Domande aperte
Nessuna nuova che tocchi la sicurezza. Restano: il piano Vercel e il deploy "Current" da annotare per il rollback.
