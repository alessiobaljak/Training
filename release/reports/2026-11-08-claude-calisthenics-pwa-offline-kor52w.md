# Rapporto release-gate, 2026-11-08

### Riepilogo e verdetto
**NO-GO.** Prova a vuoto come M: nessun rilascio in corso. Motivi: 3 casi del nucleo di sicurezza FALLITI (2, 3, 4); 6 difetti Bloccanti aperti di training-quality (NO-GO di baseline). Build, test e flussi sono verdi. Tre casi NON COPERTI (1, 6, 8) restano in evidenza e non contano come PASS.
Per Alessio: non c'è nulla da approvare. Il NO-GO è lo stato noto della baseline, non una regressione di questo commit.

### Oggetto
Branch claude/calisthenics-pwa-offline-kor52w, commit e32da50. Dimensione M per richiesta (prova a vuoto). Non ho esaminato un diff: nessun rilascio da classificare.

### FAT
Tempi misurati (orologio):
- npm run verify: 7,9 s. Typecheck, 33 file e 653 test passati, nessun URL video. PASS.
- npm run build: 5,4 s, senza errori. Solo avviso: chunk JS 1,46 MB (361 kB gzip).
- Nucleo di sicurezza: 0,14 s.
- npm run smoke: 2 min 18 s (include build). PASS: "onboarding completo e range corretti" e i percorsi successivi dello script.
- npm run offline: 35 s, eseguito dopo lo smoke, mai insieme. PASS.
- Totale macchina: circa 3 min 20 s. Non ho eseguito npm run shots (non richiesto per M).

Nucleo di sicurezza (eseguito per intero):
1. Dolore con rimando: NON COPERTO (nessuna funzione).
2. Principiante oltre il suo gradino: FALLITO (3 esercizi: trazioni, dip, nordic a gradino 3 con misura 0, atteso 1).
3. Solo corpo libero: FALLITO (32 blocchi su 48 senza alternativa; manca il campo attrezzatura).
4. Progressione entro le soglie: FALLITO (5 soglie superate su 6: S3, S5, S1, S4, excludeFromReview ignorato; 4e corretto).
5. Nessuna diagnosi/farmaci: PASS.
6. Immagini: NON COPERTO (6a verificato, 6b senza registro approvazioni).
7. Testi dell'atleta non cambiano numeri: PASS.
8. Dati tra utenti: NON COPERTO (la regola in firestore.rules c'è, nessun test la esercita; smoke e offline non fanno accessi incrociati).
Totale: 2 PASS, 3 FALLITI, 3 NON COPERTI, coerente con la baseline di training-quality.

Flussi principali: vedi release/SMOKE_FLOWS.md. 1-7 coperti da smoke, 8 da offline, tutti passati.
Rollback in produzione: NON VERIFICATO. Il sito è servito da Vercel (docs/configurazione.md), non ho trovato una procedura scritta di ritorno alla versione precedente.

### UAT
Non prevista per M. Nessuna prova con persone fittizie.

### Checklist UAT per Alessio (5 min, telefono, sì/no)
1. Apri l'app da icona, accedi con Google. Atteso: arrivi alla Home con le 4 sedute. [ ] sì [ ] no
2. Tocca la seduta proposta e poi "Inizia". Atteso: parte il riscaldamento, un solo pulsante chiaro. [ ] sì [ ] no
3. Vai avanti fino a una serie e tocca "Fatto" con la mano sudata. Atteso: un solo tocco, parte il recupero. [ ] sì [ ] no
4. Apri un esercizio. Atteso: la figura si vede nitida e leggibile a distanza. [ ] sì [ ] no
5. Apri Progressi. Atteso: la serie appena fatta compare. [ ] sì [ ] no
6. Modalità aereo, chiudi e riapri l'app. Atteso: Home, scheda e figure funzionano. [ ] sì [ ] no

### Non testato e da confermare
- NON COPERTI: casi 1, 6, 8 del nucleo.
- NON TESTATO: npm run shots (temi chiaro/scuro), prova su telefono vero, ritorno alla versione precedente in produzione, deploy.
- Da confermare alla sessione principale: caso 8 resta aperto, serve un test con emulatore prima di una seconda persona.
- Il numero di test unitari e lo script smoke non coprono la qualità del metodo: i 3 FALLITI sono nel metodo, non nel codice.

### Domande aperte
1. Alessio conferma i 8 flussi di SMOKE_FLOWS.md come principali?
2. Durata massima della checklist UAT: 5 minuti per M e 10 per L va bene?
3. Come si torna alla versione precedente su Vercel, e chi lo verifica?
4. Il nucleo di sicurezza oggi ha 3 FALLITI per definizione: va fissata una soglia con training-designer perché un rilascio possa mai essere GO (per esempio rilascio solo dopo correzione, o eccezione scritta di Alessio)?
Costo token: non misurabile dall'interno di questa sessione, non ho un contatore. NON MISURATO.
