# /quality/ — indice
2026-11-20b · atleti **v1** · scenari v1 + §9 · griglia **v3 approvata**, composizione v2 confermata (Alessio 2026-11-16) · nucleo **v9**

## Ultima misura — 2026-11-20b, commit `221b2e8` (head locale, incrementale su `59daf79` = `0f3f191` in produzione)
**GO per il push del rilascio B1** (L23, L24, M21, 17.2, D-21 a, D-22 a / R19, D-23 a):
nessun Bloccante o Alto nuovo o peggiorato. Regola di esito: app ancora NO-GO.
Bloccanti **5 attivi** (B6 B8 B9 B10 M4) + 4ᵖ · Alti 3 (A10 A16 A19; A19 corretto
nel codice, mai eseguito nell'interfaccia) · Medi 14 · Bassi 19. C1 29 · C2 0ᵖ ·
C3 33 · C4 71 · C5 67 · C6 75 · C7 86 · C8 100 (D5 80). Nucleo v9: 2 PASS · 4
FALLITI · 2 NC, caso 4 solo 4h. Chiusi L23 L24 M21 M19. Nuovi **M22** (revisione
promette tempo/pausa che R19 ferma; R17c «leve finite» con R19), L25 (σ′ senza la
variante, fino a 56:07), L26 (nota circuito 4, deviazione solo in un commento).
M20 ristretto (1.349 → 119). verify (880) eseguito da me; smoke, offline no.
Rapporto: `quality/reports/2026-11-20-quality-221b2e8.md`.

## Soglie
**Approvate da Alessio il 2026-11-12**: C1-C8, regola di esito, S1-S10, voci
v3. B1-B4 bloccano solo il rilascio pubblico. D-16: S4 sulle ultime 2 sedute
nei 14 giorni, con R12 date diverse. 2026-11-16: eccezione «non peggiorati»
anche per gli Alti; composizione v2, S1 sui gradini eseguibili, RIR «—» in S9.
S2 su 7 giorni mobili; D-20 (a, b): l'aumento conta da quando si esegue (anche
per S1). **2026-11-20: D-21 (a), D-22 (a) tetto 55′, D-23 (a).** In attesa: V-LEVE
in C4 (v4), D5 in C8 (v4, con la variante), convenzioni di GRID.md. Non decisi:
B6, B8, B9, B10, D-12…D-15, D-17, D-18, R4, D-19 (b), M20 residuo.

## Da ricordare
**Un controllo che non esisteva non è un PASS che si è rotto**; un PASS su metà
controllo non è un PASS (4e v8 taceva per D-21: v9). Ogni controllo ha un
**positivo obbligatorio**: le fixture nuove si provano sul codice di produzione
(`git archive <commit> src media firestore.rules` nella scratchpad, script copiato
in `quality/scripts/` lì dentro, eseguito da quella radice). Fixture di fine
seduta mai nelle settimane 5, 11, 17 (D-21) salvo che misurino D-21. Due motori **e il player**.

## Cosa contiene ogni file
- `PERSONAS.md` P1-P11 · `SCENARIOS.md` 30 scenari + §9 · `UNTRUSTED_INPUT.md` U1-U12, proprietà tiene.
- `GRID.md` gravità, criteri, S1-S10, v3 + proposta v4 (V-LEVE, D5) · `RESULTS.md` misure, aperte, ultime 10 chiuse, immagini, ricalcoli · `SAFETY_CORE.md` 8 casi v9 · `IMAGES.md` · `ARCHIVE.md` (chiuso) · `ARCHIVE-2.md`.
- `scripts/` (`node --experimental-strip-types quality/scripts/X.mts` dalla radice): `safety-core` v9, `01`, `03`-`11`, `13` v2, `15` (rilascio A), **`16`** (B1: righe dell'appendice, A/B, 15.19, 16.P, C/C2/C2R 18 settimane con 24.6 e D-21 contro `PROD=<cartella>`, C3 = R19 sul circuito intero). `14` sostituito; `02`, `12` obsoleti.

## Prossimo giro
Rilascio B (R14a/c/e, R14d, `lapsed`): 14.1-14.17, 15.12, b.8 in `16`; chiude M18, L2. Poi le risposte su M22, L25, L26, M20. A19: serve uno smoke eseguito. Immagini: 3 scartate e step-rapidi dopo il rifacimento; hip thrust solo dopo M7; mai guardate `burpee`, `hip-thrust-l4/l5`, `posterior-chain-l1`, `vertical-pull-l1`.
