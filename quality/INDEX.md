# /quality/ — indice
2026-11-12 · atleti **v1** · scenari v1 + §9 · griglia **v2** (+ proposte v3) · nucleo **v4**

## Ultima misura — 2026-11-12, commit `47c7f6d` (revisione totale, L)
**NO-GO contro soglie proposte** · Bloccanti 7 · Alti 8 · Medi 13 · Bassi 10.
C1 **0** (correzione: S4 fallita dal `f63c9f1`) · C2 0 · C3 33 · C4 33 (v3 43) ·
C5 67 · C6 75* · **C7 100** · C8 100 (%). Nucleo **2 PASS · 3 FALLITI · 3 NON
COPERTI**: il caso 2 è decidibile (R1) e fallisce su B9.
Chiusi B5 B7 A7 A8 A9 M9 M10. Nuovi B9, A12-A14, M14-M16, L7-L10; A11 ristretto.
Immagini: 10 guardate, **3 SCARTATE**, 7 senza problemi ma non inoltrabili
(manca `exercise-media-lead`, M7). Rapporto: `quality/reports/2026-11-12-quality.md`.

## Soglie
**Nessuna approvata.** In attesa: composizione v2, S1-S9, nuove S10 (tempo da
misura mai più permissivo della regola) e lettura di S1 sui gradini
eseguibili; voci v3 V-GIUNZIONE, M-RIEP-SEDUTA. Decisione su S7 nei blocchi
esclusi (B9). Tutto in GRID.md.

## Da ricordare
**Un controllo che non esisteva non è un PASS che si è rotto.** Il caso 2 è
passato a FALLITO perché la regola R1 l'ha reso misurabile, e il difetto (B9)
c'era già. C1 è sceso perché nel giro prima non avevo ricontato S4 quando le
alternative sono andate a 0. Una fixture si puntella sull'esercizio e sul
rapporto con il range, mai sul codice di blocco (SAFETY_CORE §Fixture).
Il tempo «misurato» va ricalcolato contro TUT × ripetizioni **fatte**, non
contro la colonna «lavoro»: è lì che si nasconde la permissività (A12).

## Cosa contiene ogni file
- `PERSONAS.md` P1-P11 · `SCENARIOS.md` 30 scenari + 5 nuovi (§9) · `UNTRUSTED_INPUT.md` U1-U7, proprietà rispettata.
- `GRID.md` criteri, composizione, S1-S10, convenzioni · `RESULTS.md` misure, aperte, ultime 10 chiuse, ultime 10 immagini e ricalcoli · `SAFETY_CORE.md` 8 casi v4, **NON COPERTO non è PASS** · `IMAGES.md` verifiche del 2026-11-12 · `ARCHIVE.md` voci e verifiche più vecchie.
- `scripts/` (`node --experimental-strip-types quality/scripts/X.mts` dalla radice): `safety-core` (esce 1 se non tutti PASS), `01`-`05`, `06` (durata con R2, volume, giunzioni), `07-player-tempo` (A12), `08-leva-accettata` (A13), `09-gradino-partenza` (R1, 3024 celle), `10-volume-r3`, `11-etichetta-diario` (A11).

## Prossimo giro
Ripuntare le fixture di `02-revisione` (ancora ferme al vecchio circuito; R1 e
T2 sono coperti da `09` e dal caso 4g). Rimisurare A12 e A13 appena c'è la
regola del tempo (I1) e il riordino di `chiudi` (I7). Immagini: le 3 scartate
dopo il rifacimento, le 7 dopo `exercise-media-lead`; non guardate `burpee`,
`hip-thrust-l4/l5`, `posterior-chain-l1`, `vertical-pull-l1`.
