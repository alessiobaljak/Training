# /quality/ — indice
2026-11-21 · atleti **v1** · scenari v1 + §9 (+ P-MAN proposto) · griglia **v3 approvata**, composizione v2 · nucleo **v11**

## Ultima verifica — 2026-11-21, figure, commit `50793fd` (incrementale su `96a90c2` in produzione)
**GO per il push** (nessun Bloccante o Alto nuovo o peggiorato), app ancora NO-GO. Le 19+2
figure sbagliate dell'audit del media lead non si vedono più: `19-figure` dà 35 posizioni
cambiate (27 → nessuna, 6 → proposta, 2 sbagliata → sbagliata). Foto `trx-row` **NON
COPERTA**: non guardata per il termine 5 (le foto RepDB non le guardo mai). Nuovi M23
(monobraccio = disegno del gradino 6, introdotto), M24 (shrimp = skater, preesistente),
L33-L36. Nucleo invariato; caso 6: 261 file, 0 approvati. verify (927) da me.
Rapporto: `quality/reports/2026-11-21-quality-50793fd.md`.

## Ultima misura del metodo — 2026-11-20d, `f7f945d` (regole invariate da allora)
Bloccanti **5 attivi** (B6 B8 B9 B10 M4) + 4ᵖ · Alti 2 (A10 A16) · Medi 14 · Bassi 25.
C1 29 · C2 0ᵖ · C3 67 · C4 71 (v4 75) · C5 67 · C6 75 · C7 86 · C8 100. Nucleo v11: 2 PASS ·
4 FALLITI · 2 NC. Rapporto: `quality/reports/2026-11-20-quality-f7f945d.md`.

## Soglie
**Approvate da Alessio il 2026-11-12**: C1-C8, regola di esito, S1-S10, voci v3. B1-B4
bloccano solo il rilascio pubblico. D-16: S4 sulle ultime 2 sedute nei 14 giorni.
2026-11-16: eccezione «non peggiorati» anche per gli Alti; composizione v2. S2 su 7 giorni
mobili; D-20 (a, b). 2026-11-20: D-21 (a), D-22 (a) tetto 55′, D-23 (a), D-19 (b), D5.
In attesa: V-LEVE, D5 in C8 (v4), convenzioni GRID, **D-Q1**. Non decisi: B6, B8, B9, B10, D-12…D-15, D-17, D-18, R4.

## Da ricordare
**Un controllo che non esisteva non è un PASS che si è rotto**; un PASS su metà
controllo non è un PASS. **Positivo obbligatorio**: `git archive <commit> src media
firestore.rules package.json quality` nella scratchpad, `node_modules` collegato, script
eseguiti da quella radice. Fine seduta mai nelle settimane 5, 11, 17 (D-21) salvo misurarla.
**Figure: cercare i duplicati per hash** (stesso disegno sotto un'altra chiave, M24).

## Cosa contiene ogni file
- `PERSONAS.md` P1-P11 · `SCENARIOS.md` 30 scenari + §9 · `UNTRUSTED_INPUT.md` U1-U13, proprietà tiene.
- `GRID.md` gravità, criteri, S1-S10, v3 + proposta v4, D5 · `RESULTS.md` misure, aperte, ultime 10 chiuse, immagini, ricalcoli · `SAFETY_CORE.md` 8 casi v11 · `IMAGES.md` · `ARCHIVE.md`, `ARCHIVE-2.md` (pieni) · `ARCHIVE-3.md` (in uso).
- `scripts/` (`node --experimental-strip-types quality/scripts/X.mts` dalla radice): `safety-core` v11, `01`, `03`-`11`, `13` v2, `15`-`18`, **`19-figure`** (figura visibile per esercizio × gradino, come `ExerciseArt`). `02`, `12`, `14` obsoleti.

## Prossimo giro
M23/M24 dopo la riga in `FIGURE_SENZA_IMMAGINE` (rieseguire `19`). L30 con la risposta del
designer. L31, L32, M3, L27-L29. 14.14 su Firestore e L26.2s: NON COPERTI. Immagini: mai
guardate `burpee`, `hip-thrust-l4/l5`, `posterior-chain-l1`; le foto RepDB restano NON COPERTE.
