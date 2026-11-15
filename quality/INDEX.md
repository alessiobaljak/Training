# /quality/ — indice
2026-11-15 · atleti **v1** · scenari v1 + §9 · griglia **v3 approvata** (S4 nella lettura D-16, mio ok con riserva L15) · nucleo **v6**

## Ultima misura — 2026-11-15, commit `ff42dfb` (head locale, incrementale su `90b8b81`)
**GO per il push di R5-R8** (nessun Bloccante o Alto introdotto o peggiorato);
regola di esito approvata: app ancora NO-GO. Bloccanti **5 attivi** (B6 B8 B9
B10 M4) + 4 al rilascio pubblico · Alti 3 (A10 A16 **A17**) · Medi 12 · Bassi 17.
C1 29 · C2 0ᵖ · C3 67 · C4 71 · C5 67 · C6 75 · C7 86 · C8 100 (%). Nucleo
2 PASS · 4 FALLITI · 2 NON COPERTI, caso 4 solo per 4h (B10). Chiusi A2 A3 A4
M1 B11 A15. Nuovi A17 (zavorra sopra una leva di tempo appena accettata, due
aumenti dalle stesse sedute, preesistente), M17 (rimandati perpetuo), L14-L17.
Eseguiti verify (774) e smoke; offline no. Rapporto: `quality/reports/2026-11-15-quality.md`.

## Soglie
**Approvate da Alessio il 2026-11-12**: C1-C8, regola di esito, S1-S10, voci
v3. B1-B4 bloccano solo il rilascio pubblico. D-16 (2026-11-15): S4 sulle
ultime 2 sedute nei 14 giorni. In attesa: eccezione per gli Alti preesistenti
(decisione 1 del rapporto), V-LEVE in C4 (v4), convenzioni di GRID.md (R3,
D-13), domande 5-7 del rapporto. Non decisi: B6, B8, B9, B10, D-4, D-12…D-15, R4.

## Da ricordare
**Un controllo che non esisteva non è un PASS che si è rotto**, e un PASS dato
su metà controllo non è un PASS. Una regola nuova a monte (R8) può svuotare in
silenzio i controlli a valle: ogni controllo ha un **positivo obbligatorio**, e
le fixture nuove si provano sul codice vecchio (`git worktree`), dove devono
fallire. Le fixture si puntellano sull'esercizio e sul rapporto col range, mai
sul codice di blocco. Una correzione si verifica anche dall'altro motore
(fine seduta ↔ revisione: A17 viveva nell'incrocio).

## Cosa contiene ogni file
- `PERSONAS.md` P1-P11 · `SCENARIOS.md` 30 scenari + §9 · `UNTRUSTED_INPUT.md` U1-U9, proprietà tiene su 4 campi.
- `GRID.md` gravità, criteri, S1-S10, composizione v3 · `RESULTS.md` misure, aperte, ultime 10 chiuse, immagini, ricalcoli · `SAFETY_CORE.md` 8 casi v6 · `IMAGES.md` verifiche dal 2026-11-12 · `ARCHIVE.md` (296 righe, chiuso) · `ARCHIVE-2.md` (dal 2026-11-15).
- `scripts/` (`node --experimental-strip-types quality/scripts/X.mts` dalla radice): `safety-core` v6 (esce 1 se non tutti PASS), `01`-`03`, `04` v2, `05`, `06` (durate), `07`, `08` v3 (leva accettata su `sessionDecisions`), `09` v3, `10`, `11` v2, **`12`** (R8+R5-R7 della revisione dal testo: differenziale, proprietà, 300 atleti, righe della specifica), **`13`** (fine seduta R5-R7, A17, M17). `02` obsoleto (revisione a seduta singola).

## Prossimo giro
A17 e M17 dopo le regole di training-designer: rieseguire `13` (X e M17) e `12`.
R9 (M4): E5 in `13` 5.12 è provato solo passando `rientro` a mano. B10 dopo la
decisione su ordine o pausa fra i giri. Ripuntare `02` (gli altri girano). Immagini: 3 scartate e step-rapidi dopo il rifacimento;
hip thrust solo dopo M7; mai guardate `burpee`, `hip-thrust-l4/l5`, `posterior-chain-l1`, `vertical-pull-l1`.
