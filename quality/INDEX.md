# /quality/ — indice
2026-11-21e · atleti **v1** · scenari v1 + §9 (+ P-MAN proposto) · griglia **v3 approvata**, composizione v2 · nucleo **v14**

## Ultima misura — 2026-11-21e, commit `644bd8c` (R9c completato, R9b, B18, figura, sopra `4d06a4b`)
**GO per il push**; app NO-GO. **B16, B17, B18 chiusi** (non rilasciati). Nucleo **v14** 3 · 3 · 2 (caso 4
PASS; caso 2 = 2c, B9/D-Q3); v13 sullo stesso commit 2 · 4 · 2 per costruzione. `25` (9.29): 0 su 4.792
ritest. `7863e31` da solo NO-GO (4l c, 4n, 2d 28). Figura `rings-inverted-row` SCARTATA, rimozione ok.
Bloccanti **4** + 4ᵖ (B6 B8 B9 M4) · Alti 2 · Medi 12 · Bassi 31 (+L41 L42 L43). verify (965) da me.
Browser NON COPERTO (ricetta nel rapporto, domanda 1). v14 **non committata** (domanda 2).
Rapporto: `quality/reports/2026-11-21-quality-644bd8c.md`. Precedente: `…-4d06a4b.md` (GO, B10 chiuso).

## Soglie
**Approvate da Alessio il 2026-11-12**: C1-C8, regola di esito, S1-S10, voci v3. B1-B4
bloccano solo il rilascio pubblico. D-16: S4 sulle ultime 2 sedute nei 14 giorni.
2026-11-16: eccezione «non peggiorati» anche per gli Alti; composizione v2. S2 su 7 giorni
mobili; D-20 (a, b). 2026-11-20: D-21 (a), D-22 (a) tetto 55′, D-23 (a), D-19 (b), D5.
In attesa: V-LEVE, D5 in C8 (v4), convenzioni GRID, **D-Q1**, **D-Q3** (S7 su Z1); **D-Q2 superata** (da chiudere). Non decisi: B6, B8, B9, D-12…D-15, D-17, D-18, R4.

## Da ricordare
**Un controllo che non esisteva non è un PASS che si è rotto**. **Positivo obbligatorio**:
`git archive <commit>` nella scratchpad (completo per `20`/`23`), `node_modules` collegato, script
eseguiti da quella radice, **mai dal tree principale** (ci lavora la sessione principale: `../../src` misurerebbe quello). `20`/`23` usano le porte 8080/9099: mai in parallelo con smoke/offline.
`innerText` applica il maiuscolo dei titoli: confronti senza maiuscole. **Porte
fisse (`app.ts:49-50`)**: prima di `20`/`23` niente smoke, offline o emulatori altrui (`ps`). Foto RepDB mai
guardate (termine 5). Figure: duplicati per hash. Fine seduta mai in W5, 11, 17 (D-21).
Un fixture che dice «modello da aggiornare» è una v nuova, non un FALLITO da contare.

## Cosa contiene ogni file
- `PERSONAS.md` P1-P11 · `SCENARIOS.md` 30 scenari + §9 · `UNTRUSTED_INPUT.md` U1-U16, proprietà tiene.
- `GRID.md` gravità, criteri, S1-S10, v3 + proposta v4, D5 · `RESULTS.md` misure, aperte, ultime 10 chiuse, immagini, ricalcoli · `SAFETY_CORE.md` 8 casi v14 · `IMAGES.md` · `ARCHIVE.md`, `ARCHIVE-2.md` (pieni) · `ARCHIVE-3.md` (in uso, ~215 righe).
- `scripts/` (`node --experimental-strip-types quality/scripts/X.mts` dalla radice di una copia): `safety-core` **v14**, `01`, `03`-`11`, `13` v2, `15`-`17`, `18` (riferimento B18), `19-figure`, `20-ritest-r16.mjs` e `23-r9c-browser.mjs` (browser, `node`), `21-r17`, `22-r9c`, `24-r20-r21` (radici come argomenti), **`25-r9b-r9c-b18`**. `02`, `12`, `14` obsoleti.

## Prossimo giro
Browser su `644bd8c` (`23` con gli attesi nuovi, R9b nel riepilogo, «Lascia com'è», L41, B18 in revisione).
D-Q3 ⇒ 2c v15. L43 col designer (B18 a/b, L14). M16 (testi T-33). Migrazione Firestore, `23` fase D,
14.14 Firestore, L26.2s, 20.8, 21.2-21.7, 21.12: NON COPERTI. L30-L32, L40-L42, M3, L27-L29.
Immagini: mai guardate `burpee`, `hip-thrust-l4/l5`, `posterior-chain-l1`; con D-Q3 (b) serve `hang-l1`.
