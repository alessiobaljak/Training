# /quality/ — indice
2026-11-21d · atleti **v1** · scenari v1 + §9 (+ P-MAN proposto) · griglia **v3 approvata**, composizione v2 · nucleo **v13**

## Ultima misura — 2026-11-21d, commit `4d06a4b` (R20 + R21 su `85d1dd8`, **senza R9c**)
**GO per il push** (nessun Bloccante/Alto nuovo o peggiorato); app NO-GO. **B10 chiuso** (4h superato;
`24` 20.5 0 su 4.392 piani). **B9 ridotto**: Z1 scrive il tempo vero, ma gradino 2 a chi regge 8″ ⇒
**D-Q3** (domanda 3 del designer: no, non per intero). Deviazione «Z1 parte al via» accettata.
Bloccanti **7** + 4ᵖ (B6 B8 B9 M4 B16 B17 B18) · Alti 2 · Medi 12 · Bassi 27 (+L40). Nucleo v13:
2 · 4 · 2 (caso 4 = 4l ×2 + 4n; caso 2 = 2c + 2d 7). Browser NON COPERTO. verify (939) da me.
**`7863e31` = R9c ricollocato sopra `4d06a4b`: non misurato** (la misura di `704dbfa` non vale lì).
Rapporto: `quality/reports/2026-11-21-quality-4d06a4b.md`. Precedente: `…-704dbfa.md` (NO-GO, B17).

## Soglie
**Approvate da Alessio il 2026-11-12**: C1-C8, regola di esito, S1-S10, voci v3. B1-B4
bloccano solo il rilascio pubblico. D-16: S4 sulle ultime 2 sedute nei 14 giorni.
2026-11-16: eccezione «non peggiorati» anche per gli Alti; composizione v2. S2 su 7 giorni
mobili; D-20 (a, b). 2026-11-20: D-21 (a), D-22 (a) tetto 55′, D-23 (a), D-19 (b), D5.
In attesa: V-LEVE, D5 in C8 (v4), convenzioni GRID, **D-Q1**, **D-Q2** (push di `704dbfa`), **D-Q3** (S7 su Z1). Non decisi: B6, B8, B9, D-12…D-15, D-17, D-18, R4.

## Da ricordare
**Un controllo che non esisteva non è un PASS che si è rotto**. **Positivo obbligatorio**:
`git archive <commit>` nella scratchpad (completo per `20`), `node_modules` collegato, script
eseguiti da quella radice, **mai dal tree principale** (ci lavora la sessione principale: `../../src` misurerebbe quello). `20` usa le porte 8080/9099: mai in parallelo con smoke/offline.
`innerText` applica il maiuscolo dei titoli: confronti senza maiuscole. **Porte
fisse (`app.ts:49-50`)**: prima di `20`/`23` niente smoke, offline o emulatori altrui (`ps`). Foto RepDB mai
guardate (termine 5). Figure: duplicati per hash. Fine seduta mai in W5, 11, 17 (D-21).

## Cosa contiene ogni file
- `PERSONAS.md` P1-P11 · `SCENARIOS.md` 30 scenari + §9 · `UNTRUSTED_INPUT.md` U1-U15, proprietà tiene.
- `GRID.md` gravità, criteri, S1-S10, v3 + proposta v4, D5 · `RESULTS.md` misure, aperte, ultime 10 chiuse, immagini, ricalcoli · `SAFETY_CORE.md` 8 casi v13 · `IMAGES.md` · `ARCHIVE.md`, `ARCHIVE-2.md` (pieni) · `ARCHIVE-3.md` (in uso, 155 righe).
- `scripts/` (`node --experimental-strip-types quality/scripts/X.mts` dalla radice): `safety-core` v13, `01`, `03`-`11`, `13` v2, `15`-`18`, `19-figure`, `20-ritest-r16.mjs` e `23-r9c-browser.mjs` (browser, `node`), `21-r17`, `22-r9c`, **`24-r20-r21`** (radici come argomenti: `24 <nuova> <prima> [<media>]`). `02`, `12`, `14` obsoleti.

## Prossimo giro
Rimisurare `7863e31` (R9c sopra R20/R21: atteso 4h e 4l superati, 4n e 2d 14 da rifare). D-Q3 ⇒ 2c v14.
D-Q2. R9b (B17: 2d va esteso alla proposta), «Archivia» (B16: 4n), B18. Migrazione Firestore, `23` fase D,
14.14 Firestore, L26.2s, 20.8, 21.2-21.7, 21.12: NON COPERTI. L30-L32, L40, M3, L27-L29.
Immagini: mai guardate `burpee`, `hip-thrust-l4/l5`, `posterior-chain-l1`; con D-Q3 (b) serve `hang-l1`.
