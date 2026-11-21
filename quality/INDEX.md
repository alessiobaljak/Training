# /quality/ — indice
2026-11-21c · atleti **v1** · scenari v1 + §9 (+ P-MAN proposto) · griglia **v3 approvata**, composizione v2 · nucleo **v13**

## Ultima misura — 2026-11-21c, commit `704dbfa` (R9c, incrementale su `c8964ff`)
**NO-GO per la regola** (B17 esteso dal commit); push = decisione **D-Q2** di Alessio. 4l v13
superato (chiusure del player e migrazione; `23` nel browser), ma **B16 ridotto, non chiuso**:
«Archivia» dalla Home (4n). **B17** nuovo: test peggiore, nessuna discesa, R9b assente (2d).
**B18** nuovo, preesistente: `scendi-di-livello` tiene la zavorra (domanda 4, S5). L38, L39.
Bloccanti **8 attivi** (B6 B8 B9 B10 M4 B16 B17 B18) + 4ᵖ · Alti 2 · Medi 12 · Bassi 28.
Nucleo v13: 2 PASS · 4 FALLITI · 2 NC (4 = 4h + 4n; 2 = 2c + 2d). verify (936) da me.
**Mio `23` sovrapposto a uno smoke di `t30` (07:10): segnalato, quello smoke va rifatto.**
Rapporto: `quality/reports/2026-11-21-quality-704dbfa.md`.

## Soglie
**Approvate da Alessio il 2026-11-12**: C1-C8, regola di esito, S1-S10, voci v3. B1-B4
bloccano solo il rilascio pubblico. D-16: S4 sulle ultime 2 sedute nei 14 giorni.
2026-11-16: eccezione «non peggiorati» anche per gli Alti; composizione v2. S2 su 7 giorni
mobili; D-20 (a, b). 2026-11-20: D-21 (a), D-22 (a) tetto 55′, D-23 (a), D-19 (b), D5.
In attesa: V-LEVE, D5 in C8 (v4), convenzioni GRID, **D-Q1**, **D-Q2** (push di `704dbfa`). Non decisi: B6, B8, B9, B10, D-12…D-15, D-17, D-18, R4.

## Da ricordare
**Un controllo che non esisteva non è un PASS che si è rotto**. **Positivo obbligatorio**:
`git archive <commit>` nella scratchpad (completo per `20`), `node_modules` collegato, script
eseguiti da quella radice. `20` usa le porte 8080/9099: mai in parallelo con smoke/offline.
`innerText` applica il maiuscolo dei titoli: confronti senza maiuscole. **Porte
fisse (`app.ts:49-50`)**: prima di `20`/`23` niente smoke, offline o emulatori altrui (`ps`). Foto RepDB mai
guardate (termine 5). Figure: duplicati per hash. Fine seduta mai in W5, 11, 17 (D-21).

## Cosa contiene ogni file
- `PERSONAS.md` P1-P11 · `SCENARIOS.md` 30 scenari + §9 · `UNTRUSTED_INPUT.md` U1-U14, proprietà tiene.
- `GRID.md` gravità, criteri, S1-S10, v3 + proposta v4, D5 · `RESULTS.md` misure, aperte, ultime 10 chiuse, immagini, ricalcoli · `SAFETY_CORE.md` 8 casi v13 · `IMAGES.md` · `ARCHIVE.md`, `ARCHIVE-2.md` (pieni) · `ARCHIVE-3.md` (in uso, 140 righe).
- `scripts/` (`node --experimental-strip-types quality/scripts/X.mts` dalla radice): `safety-core` v13, `01`, `03`-`11`, `13` v2, `15`-`18`, `19-figure`, `20-ritest-r16.mjs` e **`23-r9c-browser.mjs`** (browser, `node`), `21-r17`, **`22-r9c`**. `02`, `12`, `14` obsoleti.

## Prossimo giro
D-Q2. R9b (B17: 2d va esteso alla proposta), «Archivia» (B16: 4n), B18. Migrazione nel ramo
Firestore e la scrittura tarda del bulgaro (`23` fase D, porte libere): NON COPERTE. Domanda 3
del designer (R21 e S7). L30-L32, M3, L27-L29. 14.14 su Firestore e L26.2s: NON COPERTI.
Immagini: mai guardate `burpee`, `hip-thrust-l4/l5`, `posterior-chain-l1`.
