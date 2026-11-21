# /quality/ — indice
2026-11-21b · atleti **v1** · scenari v1 + §9 (+ P-MAN proposto) · griglia **v3 approvata**, composizione v2 · nucleo **v12**

## Ultima misura — 2026-11-21b, commit `c8964ff` (incrementale su `96a90c2` = `6cbb759` per `src/`)
**GO per il push** di T-28 (R-16) e M23/M24: nessun Bloccante o Alto introdotto o peggiorato,
**B15 (R-16) chiuso**, verificato nel browser (`20`). App ancora NO-GO. **B16 nuovo
(R-17, preesistente)**: un test alza il gradino di uno stato mai salvato (9.26: 1 → 2), 7
esercizi su 39 esposti; R9c (T-33) **prima della settimana 6 di Alessio**. L37 nuovo.
Bloccanti **6 attivi** (B6 B8 B9 B10 M4 B16) + 4ᵖ · Alti 2 (A10 A16) · Medi 12 · Bassi 26.
Nucleo v12 (4l R-17, 4m R-16): 2 PASS · 4 FALLITI · 2 NC, caso 4 = 4h + 4l (`6cbb759`: + 4m).
C1-C8 come il 2026-11-20d (C1 29 · C3 67 · C4 71 · C5 67 · C6 75 · C7 86 · C8 100).
verify (929) da me. Rapporti: `quality/reports/2026-11-21-quality-c8964ff.md`, `…-50793fd.md`.

## Soglie
**Approvate da Alessio il 2026-11-12**: C1-C8, regola di esito, S1-S10, voci v3. B1-B4
bloccano solo il rilascio pubblico. D-16: S4 sulle ultime 2 sedute nei 14 giorni.
2026-11-16: eccezione «non peggiorati» anche per gli Alti; composizione v2. S2 su 7 giorni
mobili; D-20 (a, b). 2026-11-20: D-21 (a), D-22 (a) tetto 55′, D-23 (a), D-19 (b), D5.
In attesa: V-LEVE, D5 in C8 (v4), convenzioni GRID, **D-Q1**. Non decisi: B6, B8, B9, B10, D-12…D-15, D-17, D-18, R4.

## Da ricordare
**Un controllo che non esisteva non è un PASS che si è rotto**. **Positivo obbligatorio**:
`git archive <commit>` nella scratchpad (completo per `20`), `node_modules` collegato, script
eseguiti da quella radice. `20` usa le porte 8080/9099: mai in parallelo con smoke/offline.
`innerText` applica il maiuscolo dei titoli: confronti senza maiuscole. Foto RepDB mai
guardate (termine 5). Figure: duplicati per hash. Fine seduta mai in W5, 11, 17 (D-21).

## Cosa contiene ogni file
- `PERSONAS.md` P1-P11 · `SCENARIOS.md` 30 scenari + §9 · `UNTRUSTED_INPUT.md` U1-U13, proprietà tiene.
- `GRID.md` gravità, criteri, S1-S10, v3 + proposta v4, D5 · `RESULTS.md` misure, aperte, ultime 10 chiuse, immagini, ricalcoli · `SAFETY_CORE.md` 8 casi v12 · `IMAGES.md` · `ARCHIVE.md`, `ARCHIVE-2.md` (pieni) · `ARCHIVE-3.md` (in uso).
- `scripts/` (`node --experimental-strip-types quality/scripts/X.mts` dalla radice): `safety-core` v12, `01`, `03`-`11`, `13` v2, `15`-`18`, `19-figure`, **`20-ritest-r16.mjs`** (browser, `node`), **`21-r17`**. `02`, `12`, `14` obsoleti.

## Prossimo giro
Domanda 4 del designer (`scendi-di-livello` tiene la zavorra: S5?) e domanda 3 (R21 e S7).
B16 con R9c (4l deve passare). L30-L32, M3, L27-L29. 14.14 su Firestore e L26.2s: NON COPERTI.
Immagini: mai guardate `burpee`, `hip-thrust-l4/l5`, `posterior-chain-l1`.
