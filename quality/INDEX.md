# /quality/ — indice
2026-11-16 · atleti **v1** · scenari v1 + §9 · griglia **v3 approvata**, composizione v2 confermata (Alessio 2026-11-16) · nucleo **v7**

## Ultima misura — 2026-11-16, commit `cf7588a` (head locale, incrementale su `a747e09` in produzione)
**GO per il push di R10-R13** (nessun Bloccante o Alto introdotto o peggiorato;
il push chiude **B12**, S2 violata in produzione: +5 kg in 3 giorni). Regola di
esito approvata: app ancora NO-GO. Bloccanti **5 attivi** (B6 B8 B9 B10 M4) + 4ᵖ ·
Alti 3 (A10 A16 **A18**) · Medi 12 · Bassi 21. C1 29 · C2 0ᵖ · C3 **33** (rimisurato,
A18) · C4 71 · C5 67 · C6 75 · C7 86 · C8 100. Nucleo 2 PASS · 4 FALLITI · 2 NC,
caso 4 solo 4h. Chiusi A17 M17 L15 B12. Nuovi A18 (player guidato senza stato
accettato, preesistente), M18, L18-L22. verify (811), smoke, offline eseguiti
in sequenza: verdi. Rapporto: `quality/reports/2026-11-16-quality.md`.

## Soglie
**Approvate da Alessio il 2026-11-12**: C1-C8, regola di esito, S1-S10, voci
v3. B1-B4 bloccano solo il rilascio pubblico. D-16: S4 sulle ultime 2 sedute
nei 14 giorni, con R12 date diverse. 2026-11-16: eccezione «non peggiorati»
anche per gli Alti; composizione v2, S1 sui gradini eseguibili, RIR «—» in S9,
`media/LIBRARY.md` registro delle immagini. S2 letta su 7 giorni mobili (mio
parere, R13a). In attesa: **V-LEVE in C4 (v4)** = 10.P + R10b + 13.P, convenzioni
di GRID.md (R3, D-13). Non decisi: B6, B8, B9, B10, D-12…D-15, D-17, D-18, R4, D-19 (b).

## Da ricordare
**Un controllo che non esisteva non è un PASS che si è rotto**, e un PASS dato
su metà controllo non è un PASS (S2 «rispettata» per proposta era falso: B12).
Ogni controllo ha un **positivo obbligatorio**: le fixture nuove si provano sul
codice di produzione (`git archive <commit> src` nella scratchpad, script copiato
in `quality/scripts/` lì dentro), dove devono fallire. Si verifica dai due
motori (fine seduta ↔ revisione) **e dal player**: A18 viveva nell'interfaccia.

## Cosa contiene ogni file
- `PERSONAS.md` P1-P11 · `SCENARIOS.md` 30 scenari + §9 · `UNTRUSTED_INPUT.md` U1-U10, proprietà tiene (4 campi + registro).
- `GRID.md` gravità, criteri, S1-S10, v3 + proposta v4 · `RESULTS.md` misure, aperte, ultime 10 chiuse, immagini, ricalcoli · `SAFETY_CORE.md` 8 casi v7 · `IMAGES.md` verifiche dal 2026-11-12 · `ARCHIVE.md` (chiuso) · `ARCHIVE-2.md`.
- `scripts/` (`node --experimental-strip-types quality/scripts/X.mts` dalla radice): `safety-core` v7 (esce 1 se non tutti PASS), `01`, `03`, `04`, `05`, `06` (durate), `07`, `08` v4, `09`, `10`, `11` v2, `13` v2 (fine seduta, X, M17), **`14`** (R10-R13: righe della specifica, differenziale dal testo, proprietà, 400 atleti; Q1-Q5 e A18 sono rivelatori di difetti aperti). `02` e `12` obsoleti (API e regole superate da `14`).

## Prossimo giro
A18 (player: tempo effettivo e peso dello stato) e M18, poi rieseguire `14` (P, Q5) e smoke. L18-L21 dopo le risposte di training-designer.
R9 (M4): E5 in `13` 5.12 provato solo passando `rientro` a mano. B10 dopo la decisione su ordine o pausa fra i giri.
Immagini: 3 scartate e step-rapidi dopo il rifacimento; hip thrust solo dopo M7; mai guardate `burpee`, `hip-thrust-l4/l5`, `posterior-chain-l1`, `vertical-pull-l1`.
