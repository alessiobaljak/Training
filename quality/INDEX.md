# /quality/ — indice
2026-11-09b · atleti **v1** · griglia **v2** (+ proposte v3) · nucleo **v3**

## Ultima misura — 2026-11-09b, commit `f63c9f1`
Trascrizione della scheda: catalogo a 72 esercizi, circuito a 52 blocchi.
**NO-GO contro soglie proposte** · Bloccanti 8 · Alti 8 · Medi 13 · Bassi 6.
C1 14 · C2 0 · **C3 33** (era 67) · C4 33 · C5 67* · C6 75* · C7 83 ·
**C8 100** (%). `*` non rimisurati. Nucleo: **2 PASS · 2 FALLITI · 4 NON
COPERTI** su 8, identico — dopo aver ripuntato 5 fixture (SAFETY_CORE §Fixture).
Rapporto: `quality/reports/2026-11-09-quality-circuito.md`.
Nuovi: B7, B8, A8-A11, M10-M13, L5, L6. Immagini: 1 giudicata, **1 SCARTATA**
(`hip-thrust-panca-bilaterale`), 0 idonee; 15 nuove non guardate → B8.

## Soglie
**Nessuna approvata.** In attesa: composizione dei criteri (v2) + voce
**V-GIUNZIONE** su C4 + limite **S9** (balistico dopo stabilizzazione del
tronco) + due convenzioni nuove: la finitura conta nel volume? la fascia 16-20
vale su otto gruppi o sui bersaglio? Tutto in GRID.md.

## Da ricordare
**Una fixture si puntella sull'esercizio e sul rapporto con il range, mai sul
codice di blocco.** `f63c9f1` ha cambiato esercizio a 33 codici su 36: il mio
nucleo è andato in crash e poi ha dichiarato 2 soglie superate invece di 4,
perché `review.ts:131` scarta in silenzio l'entrata il cui esercizio non
coincide con il blocco. Due difetti aperti sarebbero spariti senza correzione.
Un numero che si muove è una regola che si è mossa — oppure una mia fixture che
ha perso il morso: entrambe vanno spiegate. Il volume fuori fascia non è
discutibile: 103,5 crediti contro 128 di pavimento è aritmetica (§I3).

## Cosa contiene ogni file
- `PERSONAS.md` 7 atleti (P1-P7) + 4 di limite (P8-P11) · `SCENARIOS.md` 30 scenari · `UNTRUSTED_INPUT.md` i 4 campi liberi, verifiche U1-U6 (U6: `variantNote` e il titolo del player, proprietà rispettata).
- `GRID.md` 8 criteri, composizione, soglie S1-**S9**, convenzioni da approvare · `RESULTS.md` una riga per misura, aperte (B1-B8, A2-A4, A7-A11, M1, M3-M13, L1-L6) e 4 chiuse · `SAFETY_CORE.md` gli 8 casi + la tabella delle fixture ripuntate, **NON COPERTO non è PASS** · `IMAGES.md` verifiche delle figure.
- `scripts/`: `node --experimental-strip-types quality/scripts/X.mts` dalla radice → `safety-core` (esce 1 se non tutti PASS), `01-durata-volume`, `02-revisione` (**fixture da ripuntare, non eseguito il 2026-11-09b**), `03-metriche`, `04-input-non-fidato`, `05-rotazione-attrezzi`, **`06-circuito-trascrizione`** (durata, volume, workSeconds vs TUT, perSide del gradino, giunzioni, alternative, campi di sicurezza).

## Prossimo giro
Ripuntare le fixture di `02-revisione` (R2 → `circuito-2/A3`; R3 → 8-8-8 e
9-9-9; R5 → `circuito-3/A2` push-up; R6 → `circuito-1/A2`) prima di rimisurare
C5 e C6. Poi: B7 e A10 dopo la decisione sull'indice dello storico; A8 dopo S9;
V-VOLUME dopo la decisione sulla fascia. Immagini: 15 figure nuove in coda,
4 col/230 px poi 2/460 sui dubbi; la geometria si misura sui comandi SVG.
