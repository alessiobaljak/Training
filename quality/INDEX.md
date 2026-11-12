# /quality/ — indice
2026-11-12b · atleti **v1** · scenari v1 + §9 · griglia **v3 approvata** · nucleo **v5**

## Ultima misura — 2026-11-12b, commit `90b8b81` (incrementale su `47c7f6d`)
**NO-GO contro soglie approvate** · Bloccanti **10 attivi + 4 al rilascio
pubblico** (B1-B4) · Alti 3 · Medi 11 · Bassi 13. C1 0 · C2 0ᵖ · C3 33 ·
C4 29 (v3) · C5 67 · C6 75* · C7 86 (v3) · C8 100 (%). Nucleo **2 PASS ·
4 FALLITI · 2 NON COPERTI** (caso 6 eseguibile su `media/LIBRARY.md`).
Chiusi A11-A14. Saliti a Bloccanti per soglia approvata: A2 A3 A4 M1 M4.
Nuovi B10 (S9 fra i giri della finitura, `circuito-4`), B11 (ricarica fra
«Accetto» e «Salva e chiudi»), A15, A16, L11-L13. Nessuna immagine nuova.
Rapporto: `quality/reports/2026-11-12-quality-90b8b81.md`.

## Soglie
**Approvate da Alessio il 2026-11-12** (`docs/SESSION_STATE.md`, `8c8253d`):
C1-C8, regola di esito, S1-S10, voci v3. B1-B4 bloccano solo il rilascio
pubblico. In attesa: convenzioni di GRID.md (R3, D-13), domande 1-4 del
rapporto. Non decisi: B6, B8, B9, D-12…D-15, R4.

## Da ricordare
**Un controllo che non esisteva non è un PASS che si è rotto**, e un PASS
dato su metà controllo non è un PASS: V-GIUNZIONE guardava solo B → F (B10),
il caso 7 dichiarava la nota della seduta senza iniettarla, il caso 6 diceva
«nessun registro» con LIBRARY.md lì dal 2026-11-08. Rileggere i propri
controlli contro quello che dichiarano. Una fixture si puntella sull'esercizio
e sul rapporto con il range, mai sul codice di blocco. Una correzione nel
player si verifica anche dalla revisione settimanale (A2 con `null`) e dalla
ricarica dell'app (B11).

## Cosa contiene ogni file
- `PERSONAS.md` P1-P11 · `SCENARIOS.md` 30 scenari + §9 · `UNTRUSTED_INPUT.md` U1-U8, proprietà tiene su 4 campi.
- `GRID.md` gravità, criteri, S1-S10 approvate, composizione v3 · `RESULTS.md` misure, aperte, ultime 10 chiuse, immagini, ricalcoli · `SAFETY_CORE.md` 8 casi v5 · `IMAGES.md` verifiche dal 2026-11-12 · `ARCHIVE.md` (296 righe: al prossimo spostamento aprire `ARCHIVE-2.md`).
- `scripts/` (`node --experimental-strip-types quality/scripts/X.mts` dalla radice): `safety-core` (esce 1 se non tutti PASS), `01`-`05`, `06` (durate), `07` (prudenza del «no» del cronometro), `08` v2 (leva accettata: A, R, V, Q, D), `09` (R1), `10` (volume R3), `11` v2 (etichetta).

## Prossimo giro
Rimisurare B11/A15 con `08` (Q1 TENUTA, Q2 nessuna proposta, V coerente)
e A2 con 4a (`null`). B10 dopo la decisione su ordine o pausa fra i giri.
Ripuntare `02`, rimisurare C6. Immagini: 3 scartate e step-rapidi dopo il
rifacimento; hip thrust solo dopo M7; mai guardate `burpee`, `hip-thrust-l4/l5`, `posterior-chain-l1`, `vertical-pull-l1`.
