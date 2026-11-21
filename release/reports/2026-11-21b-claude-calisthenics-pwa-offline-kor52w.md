# Rapporto release-gate 2026-11-21b, 4d06a4b (L)

### Riepilogo e verdetto
**GO per regressioni rispetto alla produzione 85d1dd8** (pronto per la decisione di Alessio, non rilasciato). Criteri pieni: il nucleo ha 4 FALLITI e 2 NON COPERTI, tutti uguali alla produzione salvo 4h, che migliora (superato). Nessun caso peggiora. Nessun difetto Bloccante nuovo. Il GO non cancella i difetti noti (B6, B8, B9 ridotto, B16, B17, B1, caso 8).

### Oggetto
Ramo calisthenics-pwa-offline-kor52w, 85d1dd8..4d06a4b: 64180fa (T-29 R20, B10: 15″ fra i giri della finitura) e 4d06a4b (T-30 R21, B9: dead hang Z1 scrive il tempo vero). Dimensione L (regole dei programmi, tempi del circuito; esito training-quality GO: quality/reports/2026-11-21-quality-4d06a4b.md). 14 file, +610/-37. Diff su firestore.rules, src/db, src/firebase: vuoto. src/types/program.ts: +11 righe (campo opzionale recordActual), nessun dato persistito nuovo da migrare. Il worktree non è stato modificato (solo dist/ prodotto dalla build).

### FAT
- verify: 41 file, 939 test passati, nessun URL video. 11 s. Build ok (avviso chunk >500 kB, noto). 7 s.
- smoke: verde, 5m46. Contiene 20.8 («tra le stazioni e fra i giri 15″»: asserito) e il blocco R21 (Z1 [2] → [18] → [30]; domanda allo scadere, ricarica, tocco corto senza serie, «Ho mollato», campo 1-29, «Sì, 30″», 21.12: asserito). A19 sul numero nuovo: «Seduta 2 in Home 38′ → 41′ con +2″/+2″; panoramica 41′» (badge = panoramica). R14d, R14, onboarding verdi.
- offline (dopo smoke, mai insieme): verde, 37 s.
- Nucleo v13 (69d8c32), eseguito su due copie git archive mie (4d06a4b e 85d1dd8): 2 PASS, 4 FALLITI, 2 NON COPERTI in entrambe.

| caso | 85d1dd8 (prod) | 4d06a4b | vs prod |
|---|---|---|---|
| 1 dolore | NON COPERTO | NON COPERTO | = |
| 2 principiante | FALLITO (2c 4 blocchi; 2d) | FALLITO (identico, diff vuoto) | = |
| 3 corpo libero | FALLITO 37/52 | FALLITO 37/52 | = |
| 4 progressione | FALLITO 4h + 4l x2 + 4n | FALLITO 4l x2 + 4n; **4h superato** (S9: 0″ → 15″) | migliora |
| 5 diagnosi/farmaci | PASS | PASS | = |
| 6 immagini | FALLITO (261, 0 approvate) | FALLITO (uguale) | = |
| 7 testo atleta | PASS | PASS | = |
| 8 dati utenti | NON COPERTO | NON COPERTO | = |

Unico diff fra i due output: la riga di 4h. Caso 2c resta FALLITO: il player non chiede più 30″ a chi ne regge 8, ma il dato prescritto resta 30-30 al gradino 2 (D-Q3 di quality, decisione non mia). Casi 1 e 8 restano NON COPERTI (non PASS).
Flussi principali (SMOKE_FLOWS 1-8): coperti da smoke e offline verdi, più i nuovi 20.8 e R21. Rollback in produzione: NON VERIFICATO.

### UAT (persone fittizie)
NON eseguita (debito per ogni L, aperto dal 2026-11-08). Nessun giudizio su «allenatore o app generica» né su velocità/chiarezza immagini a telefono.

### Checklist UAT per Alessio (circa 5 minuti, telefono)
1. Apri una seduta del circuito e tocca la panoramica della finitura. Atteso: dice «tra le stazioni e fra i giri 15″». [ ] sì [ ] no
2. Nella finitura, passa da un giro al successivo (fine della prima passata, es. plank tocco spalla → corda slam). Atteso: 15″ di passo prima di ripartire, non 0. [ ] sì [ ] no
3. Panoramica: durata stimata coerente con quella in Home (stesso numero). [ ] sì [ ] no
4. A fine seduta, decompressione: Z1 dead hang mostra «bersaglio 30″, o finché la presa regge» e aspetta «Via». [ ] sì [ ] no
5. Premi Via, tieni meno di 30″ (es. 15″), poi chiudi con «Ho mollato» e il campo 1-29: il numero scritto è quello vero. [ ] sì [ ] no
6. Ripeti arrivando a 30″: «Sì, 30″». Nel riepilogo/diario il dead hang compare col tempo tenuto. [ ] sì [ ] no
7. Durante Z1 chiudi e riapri l'app: la seduta riprende senza perdere il punto e senza una serie fantasma. [ ] sì [ ] no

### Non testato e da confermare
- NON TESTATO: persone fittizie (2 di quality/PERSONAS.md); UAT di Alessio; qualità visiva/rapidità su telefono reale; rollback Vercel (piano, deploy Current da annotare; Hobby torna solo al precedente).
- NON COPERTI nel nucleo: caso 1 (nessuna regola sul dolore), caso 8 (nessuna prova di accesso incrociato su emulatore; regola presente in firestore.rules).
- 7863e31 (R9c ricollocato sopra) non misurato da nessuno: non è in questo rilascio.
- Da confermare: nessun dato persistito nuovo da recordActual (letto dal diff dei tipi, non provato con dati reali precedenti in produzione).

### Domande aperte
- D-Q3 (di quality): 2c va riscritto per recordActual o il dato 30-30 al gradino 2 va corretto? Decisione di Alessio.
- Le persone fittizie restano un debito da sempre: si eseguono per questo L, o Alessio accetta il debito fino al rilascio pubblico?
