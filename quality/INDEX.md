# /quality/ — indice
2026-11-21g · atleti **v1** · scenari v1 + §9 (+ P-MAN proposto) · griglia **v3 approvata**, composizione v2 · nucleo **v16**

## Ultima misura — 2026-11-21g, commit `3c4a8d7` (L42, selettore, un commit sopra `9c62f84` in produzione)
**GO per il push**; app NO-GO. **L42 chiuso** (`27` 27.1-27.9). **B20 nuovo, preesistente in produzione**: dopo ogni cambio
di gradino a 0 kg il campo Peso riparte dalla volta scorsa (altro gradino) e la chiusura scrive `{5, 5 kg}` (S5, R23).
Nucleo **v15** 4 · 2 · 2 su tutte e due (identico); **v16** (4o vii, viii) 3 · 3 · 2 su tutte e due. Nuovo **L46**.
Bloccanti **4** + 4ᵖ (B6 B8 M4 B20) · Alti 2 · Medi 12 · Bassi 31. verify (985) da me; smoke, offline, browser NON COPERTI.
v16 **non committata** (domanda 4). Rapporto: `quality/reports/2026-11-21-quality-3c4a8d7.md`. Precedente: `…-9d7b20f.md`.

## Soglie
**Approvate da Alessio il 2026-11-12**: C1-C8, regola di esito, S1-S10, voci v3. B1-B4
bloccano solo il rilascio pubblico. D-16: S4 sulle ultime 2 sedute nei 14 giorni.
2026-11-16: eccezione «non peggiorati» anche per gli Alti; composizione v2. S2 su 7 giorni
mobili; D-20 (a, b). 2026-11-20: D-21 (a), D-22 (a) tetto 55′, D-23 (a), D-19 (b), D5. 2026-11-21: **D-Q3 (a)**.
In attesa: V-LEVE, D5 in C8 (v4), convenzioni GRID, **D-Q1**; **D-Q2 superata** (da chiudere). Non decisi: B6, B8, D-12…D-15, D-17, D-18, R4.

## Da ricordare
**Un controllo che non esisteva non è un PASS che si è rotto**. **Positivo obbligatorio**:
`git archive <commit>` nella scratchpad (completo per `20`/`23`), `node_modules` collegato, script
eseguiti da quella radice, **mai dal tree principale** (ci lavora la sessione principale: `../../src` misurerebbe quello). `20`/`23` usano le porte 8080/9099: mai in parallelo con smoke/offline.
`innerText` applica il maiuscolo dei titoli: confronti senza maiuscole. **Porte
fisse (`app.ts:49-50`)**: prima di `20`/`23` niente smoke, offline o emulatori altrui (`ps`). Foto RepDB mai
guardate (termine 5); SVG nostre lette nella geometria (`svgrow.py`, nessun rasterizzatore installato). Figure: duplicati per hash. Fine seduta mai in W5, 11, 17 (D-21).
Un fixture che dice «modello da aggiornare» è una v nuova, non un FALLITO da contare. Template literal: niente backtick nei testi.
Uno stato giusto non basta: guardare anche **cosa precompila il player la seduta dopo** (B20 l'ha mostrato).

## Cosa contiene ogni file
- `PERSONAS.md` P1-P11 · `SCENARIOS.md` 30 scenari + §9 · `UNTRUSTED_INPUT.md` U1-U16, proprietà tiene.
- `GRID.md` gravità, criteri, S1-S10, v3 + proposta v4, D5 · `RESULTS.md` misure, aperte, ultime 10 chiuse, immagini, ricalcoli · `SAFETY_CORE.md` 8 casi v16 · `IMAGES.md` · `ARCHIVE.md`, `ARCHIVE-2.md`, `ARCHIVE-3.md` (pieni) · `ARCHIVE-4.md` (in uso, ~180 righe).
- `scripts/` (`node --experimental-strip-types quality/scripts/X.mts` dalla radice di una copia): `safety-core` **v16**, `01`, `03`-`11`, `13` v2, `15`-`17`, `18` (riferimento B18 + R23), `19-figure`, `20-ritest-r16.mjs` e `23-r9c-browser.mjs` (browser, `node`), `21-r17`, `22-r9c`, `24-r20-r21` (radici come argomenti), `25-r9b-r9c-b18`, `26-t37-t38-t39`, **`27-l42-selettore`**. `02`, `12`, `14` obsoleti.

## Prossimo giro
Risposte su B20 e L46 (designer), B20 (sessione principale), v16 (gate), L44 (designer), L45/L35 (media lead), positivo
di 21.14. Browser su `644bd8c`/`9d7b20f` (`23`, R9b, «Lascia com'è», L41). M16 (testi T-33). Migrazione Firestore,
`23` fase D, 14.14 Firestore, L26.2s, 20.8, 21.2-21.7, 21.12: NON COPERTI. L30-L32, L40, L41, M3, L27-L29.
Immagini: mai guardate `burpee`, `hip-thrust-l4/l5`, `posterior-chain-l1`; schede di `horizontal-pull-l1`, `l3`-`l6` in arrivo.
