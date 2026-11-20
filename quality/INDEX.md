# /quality/ — indice
2026-11-20c · atleti **v1** · scenari v1 + §9 (+ P-MAN proposto) · griglia **v3 approvata**, composizione v2 · nucleo **v10**

## Ultima misura — 2026-11-20c, commit `0d85597` (head locale, incrementale su `e30cdc6` in produzione)
**GO per il push del rilascio B2** (T-15 R14a/c/e + `lapsed`, T-16 rev. R14d, T-24 D-19 b; `d5f72e2` solo CSS):
nessun Bloccante o Alto introdotto o peggiorato. Regola di esito: app ancora NO-GO.
Bloccanti **6 attivi** (B6 B8 B9 B10 M4 **B14**) + 4ᵖ · Alti 2 (A10 A16) · Medi 13 · Bassi 20.
C1 29 · C2 0ᵖ · C3 33 · C4 71 (v4 63) · C5 67 · C6 75 · C7 86 · C8 100 (D5 80). Nucleo v10:
2 PASS · 4 FALLITI · 2 NC, caso 4 solo 4h. Chiusi M18, L2, L22, A19 (smoke eseguito da me).
Nuovi **B14** (riquadro di calibrazione «Aggiungi 2,5 kg» senza cancelli; preesistente,
identico su `e30cdc6`), L27, L28, L29. verify (908), smoke, offline eseguiti da me.
Rapporto: `quality/reports/2026-11-20-quality-0d85597.md`.

## Soglie
**Approvate da Alessio il 2026-11-12**: C1-C8, regola di esito, S1-S10, voci v3. B1-B4
bloccano solo il rilascio pubblico. D-16: S4 sulle ultime 2 sedute nei 14 giorni.
2026-11-16: eccezione «non peggiorati» anche per gli Alti (un preesistente trovato ora
non ferma il push: A18, B14); composizione v2. S2 su 7 giorni mobili; D-20 (a, b).
2026-11-20: D-21 (a), D-22 (a) tetto 55′, D-23 (a), D-19 (b) elenco dei manubri, D5
accettata. In attesa: V-LEVE in C4 e D5 in C8 (v4), convenzioni di GRID.md, **D-Q1
(P-MAN in C1)**. Non decisi: B6, B8, B9, B10, D-12…D-15, D-17, D-18, R4.

## Da ricordare
**Un controllo che non esisteva non è un PASS che si è rotto**; un PASS su metà
controllo non è un PASS. **Positivo obbligatorio**: fixture nuove provate sul codice di
produzione (`git archive <commit> src media firestore.rules` nella scratchpad, script
in `quality/scripts/` lì dentro, `node_modules` collegato, eseguito da quella radice).
Fine seduta mai nelle settimane 5, 11, 17 (D-21) salvo misurarla. Due motori, **il
player e la chiusura come l'app** (`decadenze` prima del riepilogo, `lapsed` alla chiusura).

## Cosa contiene ogni file
- `PERSONAS.md` P1-P11 · `SCENARIOS.md` 30 scenari + §9 (P-MAN proposto) · `UNTRUSTED_INPUT.md` U1-U13, proprietà tiene.
- `GRID.md` gravità, criteri, S1-S10, v3 + proposta v4 · `RESULTS.md` misure, aperte, ultime 10 chiuse, immagini, ricalcoli · `SAFETY_CORE.md` 8 casi v10 · `IMAGES.md` · `ARCHIVE.md` · `ARCHIVE-2.md`.
- `scripts/` (`node --experimental-strip-types quality/scripts/X.mts` dalla radice): `safety-core` v10, `01`, `03`-`11`, `13` v2, `15`, `16` (B1), **`17`** (B2: riferimento D-19 b + R14c, F 14.x/15.12/b.8/D19.x, P14, chiusura come l'app, B14, `ROLLBACK=<cartella>`). `02`, `12`, `14` obsoleti.

## Prossimo giro
B14 prima di tutto (regola di training-designer; correzione prudente subito). Poi M22
(T-25), L25 (T-26), L26 (T-27) con M22.P, L25.P1, S2 e S5 su C3; L27-L29 con la risposta
del designer. 14.14 su Firestore: NON COPERTO. Immagini: 3 scartate e step-rapidi dopo il
rifacimento; hip thrust dopo M7; mai guardate `burpee`, `hip-thrust-l4/l5`, `posterior-chain-l1`, `vertical-pull-l1`.
