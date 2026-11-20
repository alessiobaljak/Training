# /quality/ — indice
2026-11-20 · atleti **v1** · scenari v1 + §9 · griglia **v3 approvata**, composizione v2 confermata (Alessio 2026-11-16) · nucleo **v8**

## Ultima misura — 2026-11-20, commit `4edf751` (head locale, incrementale su `001de30` in produzione)
**GO per il push del rilascio A di R14-R18** (R18, R16, R17, R15, R14b): nessun
Bloccante o Alto introdotto o peggiorato; il push chiude **B13** (S2 sul carico
sollevato, D-20 a: in produzione 2,5 → 5 kg nella prima seduta a 2,5). Regola
di esito: app ancora NO-GO. Bloccanti **5 attivi** (B6 B8 B9 B10 M4) + 4ᵖ ·
Alti 3 (A10 A16 **A19**) · Medi 15 · Bassi 19. C1 29 · C2 0ᵖ · C3 33 · C4 71 ·
C5 67 · C6 75 · C7 86 · C8 100 (con D5 proposta 80). Nucleo 2 PASS · 4 FALLITI
· 2 NC, caso 4 solo 4h. Chiusi B13 A18 L18-L21. Nuovi A19 (Home senza stati,
preesistente), M19 (durata 46-59′ ai bonus massimi), M20 (E4 all'esecuzione),
M21 (testo R14b alla prima seduta), L23 (R15: seduta con data futura), L24.
verify (857), smoke eseguiti da me: verdi; offline no. Rapporto: `quality/reports/2026-11-20-quality.md`.

## Soglie
**Approvate da Alessio il 2026-11-12**: C1-C8, regola di esito, S1-S10, voci
v3. B1-B4 bloccano solo il rilascio pubblico. D-16: S4 sulle ultime 2 sedute
nei 14 giorni, con R12 date diverse. 2026-11-16: eccezione «non peggiorati»
anche per gli Alti; composizione v2, S1 sui gradini eseguibili, RIR «—» in S9.
S2 su 7 giorni mobili; **D-20 (a, b), 2026-11-20: l'aumento conta da quando si
esegue** (accettata come lettura di S2). In attesa: V-LEVE in C4 (v4), **D5 in
C8 (v4)**, convenzioni di GRID.md. Non decisi: B6, B8, B9, B10, D-12…D-15,
D-17, D-18, R4, D-19 (b), M19 (tetto di durata), M20 (E4 all'esecuzione).

## Da ricordare
**Un controllo che non esisteva non è un PASS che si è rotto**; un PASS su metà
controllo non è un PASS. Ogni controllo ha un **positivo obbligatorio**: le
fixture nuove si provano sul codice di produzione (`git archive <commit> src
media firestore.rules` nella scratchpad, script copiato in `quality/scripts/`
lì dentro, eseguito da quella radice). Due motori **e il player**. Le simulazioni
seguono il prodotto (dal `de3956f` lo stato accettato si scrive all'«Accetto»).

## Cosa contiene ogni file
- `PERSONAS.md` P1-P11 · `SCENARIOS.md` 30 scenari + §9 · `UNTRUSTED_INPUT.md` U1-U11, proprietà tiene.
- `GRID.md` gravità, criteri, S1-S10 (S2 con D-20), v3 + proposta v4 (V-LEVE, D5) · `RESULTS.md` misure, aperte, ultime 10 chiuse, immagini, ricalcoli · `SAFETY_CORE.md` 8 casi v8 · `IMAGES.md` · `ARCHIVE.md` (chiuso) · `ARCHIVE-2.md`.
- `scripts/` (`node --experimental-strip-types quality/scripts/X.mts` dalla radice): `safety-core` v8, `01`, `03`-`11`, `13` v2, **`15`** (R14b-R18 + R10-R13: righe della specifica, differenziale, proprietà, C/C2 800 atleti, E7, R14b contro produzione con `PROD=<cartella>`; Q5 = M18 rivelatore aperto). `14` sostituito da `15` (il suo C perde lo stato accettato dopo `de3956f`); `02`, `12` obsoleti.

## Prossimo giro
Rilascio B (R14a/c/e, R14d, `lapsed`): 14.1-14.17, 15.12, b.8 in `15`; chiude M18, L2. Prima L23 nella specifica. A19, L24 dopo le risposte. R9 (M4), B10 dopo le decisioni. Immagini: 3 scartate e step-rapidi dopo il rifacimento; hip thrust solo dopo M7; mai guardate `burpee`, `hip-thrust-l4/l5`, `posterior-chain-l1`, `vertical-pull-l1`.
