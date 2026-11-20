# /quality/ — indice
2026-11-20d · atleti **v1** · scenari v1 + §9 (+ P-MAN proposto) · griglia **v3 approvata**, composizione v2 · nucleo **v11**

## Ultima misura — 2026-11-20d, commit `f7f945d` (head locale, incrementale su `fb560e7` in produzione)
**GO per il push del rilascio C** (T-27 L26, T-26 L25, T-25 M22, B14): nessun Bloccante o
Alto introdotto o peggiorato, **B14 chiuso**. Regola di esito: app ancora NO-GO.
Bloccanti **5 attivi** (B6 B8 B9 B10 M4) + 4ᵖ · Alti 2 (A10 A16) · Medi 12 · Bassi 21.
C1 29 · C2 0ᵖ · C3 **67** · C4 71 (v4 75) · C5 67 · C6 75 · C7 86 · C8 100 (D5 100 con la nota
nuova). Nucleo v11: 2 PASS · 4 FALLITI · 2 NC, caso 4 solo 4h. Chiusi B14, M22, L25, L26.
Nuovi L30 (revisione «tetto» contro R17c 3 sul peso fuori elenco), L31 (calibrazione nelle
archiviate), L32 (niente «troppo pesante» nei circuiti). verify (924), smoke, offline da me.
Rapporto: `quality/reports/2026-11-20-quality-f7f945d.md`.

## Soglie
**Approvate da Alessio il 2026-11-12**: C1-C8, regola di esito, S1-S10, voci v3. B1-B4
bloccano solo il rilascio pubblico. D-16: S4 sulle ultime 2 sedute nei 14 giorni.
2026-11-16: eccezione «non peggiorati» anche per gli Alti (un preesistente trovato ora
non ferma il push: A18, B14); composizione v2. S2 su 7 giorni mobili; D-20 (a, b).
2026-11-20: D-21 (a), D-22 (a) tetto 55′, D-23 (a), D-19 (b) elenco dei manubri, D5
accettata. In attesa: V-LEVE in C4 e D5 in C8 (v4), convenzioni di GRID.md, **D-Q1
(P-MAN in C1: oggi passerebbe, C1 38%)**. Non decisi: B6, B8, B9, B10, D-12…D-15, D-17, D-18, R4.

## Da ricordare
**Un controllo che non esisteva non è un PASS che si è rotto**; un PASS su metà
controllo non è un PASS. **Positivo obbligatorio**: fixture nuove provate sul codice di
produzione (`git archive <commit> src media firestore.rules package.json` nella scratchpad,
script in `quality/scripts/` lì dentro, `node_modules` collegato, eseguito da quella radice).
Fine seduta mai nelle settimane 5, 11, 17 (D-21) salvo misurarla. **Revisione e riepilogo
come l'app**: durata (`durataDellaSedutaDi`) in revisione, σ′ da `tetto.ts` nel riepilogo.

## Cosa contiene ogni file
- `PERSONAS.md` P1-P11 · `SCENARIOS.md` 30 scenari + §9 (P-MAN proposto) · `UNTRUSTED_INPUT.md` U1-U13, proprietà tiene.
- `GRID.md` gravità, criteri, S1-S10, v3 + proposta v4, D5 · `RESULTS.md` misure, aperte, ultime 10 chiuse, immagini, ricalcoli · `SAFETY_CORE.md` 8 casi v11 · `IMAGES.md` · `ARCHIVE.md` · `ARCHIVE-2.md` (260 righe: il prossimo archivio è `ARCHIVE-3.md`).
- `scripts/` (`node --experimental-strip-types quality/scripts/X.mts` dalla radice): `safety-core` v11, `01`, `03`-`11`, `13` v2, `15`, `16`, `17` (B2), **`18`** (C: riferimento §2-§4, A2 revisione con durata, C3/C3R come l'app, M22.P, L25.P1, R-14, L26 con `git show f63c9f1`). `02`, `12`, `14` obsoleti.

## Prossimo giro
L30 con la risposta del designer (M22.6r e M22.P iii a 0). L31, L32, M3. L27-L29 aperti.
14.14 su Firestore: NON COPERTO. L26.2s (scheda originale delle note): NON COPERTO.
Immagini: 3 scartate e step-rapidi dopo il rifacimento; hip thrust dopo M7; mai guardate
`burpee`, `hip-thrust-l4/l5`, `posterior-chain-l1`, `vertical-pull-l1`.
