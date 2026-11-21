# Rapporto 2026-11-21d, e8c0556 (codice 9d7b20f), L, prod 22f3d31

### Riepilogo e verdetto
GO per regressioni vs 22f3d31 (criteri pieni: NO-GO per i casi 3 e 6, FALLITI noti, B6/B8, che bloccano solo il rilascio pubblico, decisione 2026-11-12). Nessuna regressione, B19 chiuso. Nucleo v15: 4 PASS, 2 FALLITI, 2 NON COPERTI (prod: 3, 3, 2). GO = pronto per la decisione, non rilasciato.

### Oggetto
Worktree relG, HEAD e8c0556 pulito. Dimensione L confermata (regole di progressione R23, stati T-39, catalogo, figure). Esito training-quality GO su 9d7b20f. Diff 22f3d31..e8c0556 in src: 28 file; types.ts, firestore.rules e slug del catalogo invariati.

### FAT
- verify: typecheck, 984 test (43 file), no-video-urls: verdi. Build: ok (solo avviso chunk > 500 kB, noto).
- Nucleo (script v15, eseguito nel worktree): 1 NON COPERTO; 2 PASS; 3 FALLITO (B6); 4 PASS; 5 PASS; 6 FALLITO (255 file, 0 approvati, B8); 7 PASS; 8 NON COPERTO (nessun accesso incrociato su emulatore).
- smoke (6m01, exit 0): R14d, R14, A19 38' -> 42', R21 (Z1 2 -> 18 -> 30), R9b (trazioni 3 -> 1, Applica), onboarding con gradini di partenza. offline (38 s): verde. Lanciati in sequenza, mai insieme.
- 21.14 (T-40), positivo: eseguito su copia git archive (relG-pos), riga 1043 di GuidedSession.tsx senza `&& !step.recordActual` (parte da sola). Lo smoke fallisce: exit 1, TimeoutError su smoke.mjs:2302 (il bottone «Via» non c'e' piu'). Cade quindi nel blocco R21 dopo A19, ma per timeout e non con il messaggio del check 21.14: positivo reale, diagnosi rozza. Worktree non toccato.
- Rollback a 22f3d31: per LETTURA del diff, non eseguito. Tipi, regole e slug invariati; R23 scrive solo loadKg = 0, valore gia' valido nello stato. Il codice vecchio legge 0 come nessuna zavorra. Rollback Vercel in produzione: NON VERIFICATO.

### UAT (persone fittizie)
NON ESEGUITE da me (debito aperto per ogni L). Non provati in browser da me: zavorra a 0 al cambio di gradino (R23) nella UI, seduta con rematore agli anelli.

### Checklist UAT per Alessio (5 minuti, telefono)
1. Scheda, Seduta 2: il rematore agli anelli ha nome, cue e gradini nuovi, nessuna figura rotta. Si / No
2. Apri il test del rematore: la nota del test e' quella nuova e comprensibile. Si / No
3. Registra un ritest migliore nello stesso giorno di una seduta: il gradino della Home non sale. Si / No
4. Trazioni a gradino 6 con zavorra: scendi di gradino (revisione o variante): la zavorra torna a 0 e il testo lo dice. Si / No
5. Una serie di rematore o trazioni: registrazione rapida, figura (o assenza di figura) chiara. Si / No

### Non testato e da confermare
- Persone fittizie, UAT, rollback in produzione: NON TESTATI.
- Caso 8 e caso 1: NON COPERTI. Casi 3 e 6: FALLITI noti.
- L42 (VariantPicker di SessionScreen tiene la zavorra, Basso), L44, L45 aperti.
- Da confermare: se 21.14 vada rinforzato (il positivo fallisce per timeout, non col messaggio).

### Domande aperte
- Vale ancora la convenzione «GO per regressioni» con 3 e 6 FALLITI, o serve decisione esplicita di Alessio?
