# Rapporto release-gate 2026-11-21 — 85d1dd8 (L)

### Riepilogo e verdetto
**GO per regressioni rispetto alla produzione 96a90c2** (pronto per la decisione di Alessio, non rilasciato). Criteri pieni: il nucleo ha 4 FALLITI e 2 NON COPERTI, tutti presenti uguali o peggiori in produzione; nessun caso peggiora. Come nei rilasci precedenti, il GO è "per regressioni" e non cancella i difetti noti (B6, B8, B9, B10, B16, B17, B1, B14-8).

### Oggetto
Branch claude/calisthenics-pwa-offline-kor52w, commit 85d1dd8 (worktree pulito, HEAD staccato), produzione 96a90c2. Dimensione L (confermata: dati/progressione toccati da T-28 in schedule.ts, onboarding). Diff src: 10 file (figure e art.ts, ExerciseArt, schedule.ts + test, OnboardingScreen). Diff types/db/firestore.rules: vuoto, rollback dati compatibile. Training-quality: GO su 50793fd e c8964ff (letti come riferimento, non rieseguiti).

### FAT
- verify: 41 file, 929 test passati, nessun URL video. Build: ok (avviso chunk >500 kB, noto).
- smoke: verde (R14d, R14, A19, onboarding e gradini di partenza). 3m13.
- offline (dopo smoke, mai insieme): verde. 38 s.
- Nucleo v13 (6193880), eseguito su 85d1dd8 e su 96a90c2 con copia dello script e symlink a src/media/firestore.rules dei rispettivi tree: 2 PASS, 4 FALLITI, 2 NON COPERTI in entrambi.

| caso | 85d1dd8 | 96a90c2 | vs produzione |
|---|---|---|---|
| 1 | NON COPERTO | NON COPERTO | uguale |
| 2 | FALLITO (2c 4 blocchi B9; 2d 7 su 7 "stato salvato", positivo 7/7) | identico | uguale |
| 3 | FALLITO 37/52 (B6) | identico | uguale |
| 4 | FALLITO 4 soglie: 4h (B10), 4l, 4l/fissaStatiMancanti, 4n (B16) | 5 soglie: le stesse 4 + 4m | **migliora** (4m chiuso da T-28) |
| 5 | PASS | PASS | uguale |
| 6 | FALLITO: 261 file, 0 approvati (B8), 0 non registrati | 265 file, 0 approvati | uguale (4 file in meno) |
| 7 | PASS | PASS | uguale |
| 8 | NON COPERTO | NON COPERTO | uguale; né smoke né offline fanno accesso incrociato |

Preesistenti e noti, non introdotti: B16 (4l, 4n), B9 (2c), B10 (4h), B17 (2d: qui 7 perché esiste solo la via "stato salvato", come in produzione). Nessuno peggiora.
Flussi principali (SMOKE_FLOWS): accesso, scheda, seduta guidata fino alla serie, progressi, revisione, uso senza rete: coperti da smoke e offline verdi. Immagini di un esercizio: coperte solo in quanto smoke apre le schermate; la correttezza dell'immagine del rematore TRX NON è verificata da smoke (vedi UAT). Ritest che non sposta la data (T-28, 4m): provato dal nucleo (funzione chiusuraDelGiro) e dai test unitari, NON da smoke (smoke.mjs non lo asserisce).

### UAT (persone fittizie)
NON ESEGUITA (debito aperto per ogni L: due persone di /quality/PERSONAS.md). Giudizio "allenatore o app generica", rapidità serie, chiarezza immagini su telefono: NON TESTATI.

### Checklist UAT per Alessio (circa 4 minuti, telefono)
1. Apri Scheda, esercizio "Rematore inverso al TRX" (e la variante a piedi rialzati). Atteso: immagine con due maniglie TRX, non la sbarra. [ ] sì [ ] no
2. Cerca le figure di M23 e M24: non devono più mostrare un'immagine sbagliata (se senza figura, mostrano il segnaposto, non un errore). [ ] sì [ ] no
3. Controlla 3 esercizi a caso fra quelli dei 19 collegamenti tolti: nessuna immagine di un altro esercizio. [ ] sì [ ] no
4. Con un'installazione che ha già un giro iniziato (data di inizio, es. 5 ottobre): fai un ritest e chiudi il riepilogo. Atteso: la data di inizio resta quella, nessun "Quando parte", il programma resta attivo. [ ] sì [ ] no
5. Primo avvio/onboarding con data scelta: la data scelta viene salvata. [ ] sì [ ] no
6. Modalità aereo: apri una figura già vista, appare. [ ] sì [ ] no

### Non testato e da confermare
- NON COPERTO: caso 1 (dolore, B1), caso 8 (accesso incrociato su emulatore), caso 6 (0 approvate: B8, FALLITO).
- NON TESTATO: persone fittizie, UAT di Alessio, rollback Vercel (piano e deploy Current da annotare; Hobby torna solo al precedente; diff dati vuoto quindi compatibile), ritest/data e immagine TRX nel browser da parte mia.
- Da confermare: smoke ha scritto dist/ nel worktree rel (artefatto di build, non codice); ho creato anche un worktree prod 96a90c2 nello scratchpad per il confronto.

### Domande aperte
- Alessio vuole che smoke asserisca in browser il ritest senza spostamento data (oggi solo nucleo e test unitari) e l'immagine del rematore TRX?
- B16/B17/B9/B10/B8/B6 restano aperti: si accetta di rilasciare con i FALLITI noti finché l'ambiente è privato (decisione 2026-11-15)?
