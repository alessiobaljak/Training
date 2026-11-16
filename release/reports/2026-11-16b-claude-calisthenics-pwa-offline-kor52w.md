# Gate L su 274d12f (codice = fe85203), 2026-11-16b

### Riepilogo e verdetto
GO per regressioni rispetto a a747e09 (stessa decisione "non peggiorati" del gate precedente). Criteri pieni: NO-GO, perché il nucleo ha 4 FALLITI e 5 Bloccanti di training-quality restano aperti (B6, B8, B9, B10, M4). Nessuna regressione: nucleo identico a prima, verify/smoke/offline verdi. GO = pronto per la decisione di Alessio. Il ramo è già in produzione (push = rilascio).

### Oggetto
Branch claude/calisthenics-pwa-offline-kor52w, head 274d12f (solo docs sopra fe85203). Da a747e09: cf7588a (R10-R13), fe85203 (A18). Dimensione L (engine della progressione, consigli): conferma di classificazione; training-quality su cf7588a GO (quality/reports/2026-11-16-quality.md, B12/A17/M17/L15 chiusi).

### FAT
- verify: verde. 36 file, 811 test, 0 URL video. 9,7 s.
- smoke: verde, 2m51. offline: verde, 35 s. Eseguiti in sequenza.
- Nucleo (v7, script eseguito): 2 PASS, 4 FALLITI, 2 NON COPERTI. Identico a a747e09 nel conteggio.
  1 NON COPERTO (nessuna regola sul dolore). 2 FALLITO (B9, dead hang 30" al gradino 2 con 8" misurati, 4 blocchi Z1). 3 FALLITO (37/52 blocchi senza alternativa corpo libero, nessun campo attrezzatura). 4 FALLITO solo per 4h/S9 (B10: circuito-4 sett.1 F4->F1 con 0"); 4a-4g e 4i superati. 5 PASS. 6 FALLITO (6a ok; 6b 265 file, 0 approvati). 7 PASS (6 stringhe x 4 campi). 8 NON COPERTO (regola presente, nessun accesso incrociato eseguito).
- Verifica indipendente di A18: scripts/smoke.mjs:1893-1921 controlla che dopo "eccentrica da 3" a 4"" il player annunci 4" discesa. Prova al contrario: ho rimesso GuidedSession.tsx di fe85203~1 in un worktree temporaneo (nello scratchpad, poi rimosso, repo pulito) e lo smoke ha FALLITO ("A18: accettata l'eccentrica a 4", ... Legge 3″ discesa"). Sul codice attuale passa. Il controllo è quindi reale e il ramo "if eccentricaAccettata !== null" è stato percorso.
- Limite: la metà "parte dal peso dello stato" (kg da stato dopo zavorra/manubrio accettati) NON è coperta dallo smoke: nessuna asserzione. Vedi non testato.
- Rollback in produzione: NON VERIFICATO (invariato: Vercel, procedura non scritta; Hobby torna solo al precedente).

### UAT
Due persone fittizie di /quality/PERSONAS.md: NON eseguite (debito L aperto). Giudizio "allenatore o app generica" non espresso.

### Checklist UAT per Alessio (max 10 min, telefono)
1. Fine seduta con una leva di manubrio accettata: alla seduta successiva il manubrio proposto è quello successivo (non il vecchio). Si [ ] No [ ]
2. Fine seduta: accetta un aumento su un esercizio; chiudi; entro 7 giorni un secondo aumento sullo stesso esercizio non viene proposto. Si [ ] No [ ]
3. Revisione di fine settimana: stesso esercizio con aumento accettato meno di 7 giorni prima: la revisione non lo propone di nuovo. Si [ ] No [ ]
4. Dopo la seduta del lunedì, apri la revisione: è aperta e coerente (leve nell'ordine della fine seduta, niente aumenti doppi con date diverse). Si [ ] No [ ]
5. Accetta una leva sul tempo (es. eccentrica da 3" a 4"); riapri la seduta dopo e vai alla stazione: il player mostra 4″ discesa. Si [ ] No [ ]
6. Dopo zavorra o manubrio accettati, nel player il peso precompilato è quello nuovo (non quello della volta scorsa). Si [ ] No [ ]

### Non testato e da confermare
- NON TESTATO: kg dallo stato nel player (A18 seconda metà) senza asserzione di smoke; due persone fittizie; rollback; UAT di Alessio mai eseguite.
- NON COPERTO: caso 1 (dolore), caso 8 (accesso incrociato; clearAll su emulatore da confermare).
- Da confermare alla sessione principale: nulla di nuovo su autenticazione o regole del DB (non toccate dal diff).

### Domande aperte
1. Alessio conferma la dimensione L e l'estensione di "non peggiorati" a questo giro, con 4 FALLITI e 5 Bloccanti aperti?
2. Si aggiunge allo smoke un'asserzione sul peso precompilato dopo zavorra/manubrio accettati (sessione principale)?
3. Chi scrive e prova la procedura di rollback su Vercel?
