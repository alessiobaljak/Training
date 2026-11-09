# /quality/ — indice
2026-11-09 · atleti **v1** · griglia **v2** · nucleo **v2**

## Ultima misura — 2026-11-09, commit `1802631`
Engine al `1802631`, catalogo invariato. **NO-GO contro soglie proposte** ·
Bloccanti 6 · Alti 4 · Medi 8 · Bassi 4.
C1 sicurezza 14 · C2 rimandi 0 · C3 fedeltà 67 · C4 coerenza 33 · C5 personalizz.
67 · C6 concretezza 75 · C7 progressi 83 · **C8 durata 100** (%).
Nucleo di sicurezza: **2 PASS · 2 FALLITI · 4 NON COPERTI** su 8.
Rapporto: `quality/reports/2026-11-09-quality.md` (baseline: `...-11-08-...`).
Chiusi A1, A5, A6, M2. Ridotto B5 (zero → gradino 1; sopra lo zero niente).
Nuovi M8, M9, L3, L4. Immagini: nessuna nuova, `src/assets` intatto; restano i
3 SCARTI e M7 → `IMAGES.md`.

## Soglie
**Nessuna approvata.** Dal 2026-11-09 va approvata anche la **composizione dei
criteri** (GRID.md): quella della baseline non si riproduceva su C3, C4, C5.
Aperte: arrotondamento dell'aderenza (troncamento) e manubrio «due barre
sovrapposte». Nessuno dei 30 scenari è validato (SCENARIOS.md §7).

## Da ricordare
Stessa fixture, stesso numero, sempre: se un numero si muove è una regola che
si è mossa — e se non si riproduce, il difetto è nella mia misura. Il caso 2 del
nucleo risultava FALLITO dopo la correzione perché il **mio** script chiamava
`startingLevel(e)` senza massimali: chiamare le funzioni del motore come le
chiama l'app. I 4 Bloccanti su dolore, condizioni mediche, cibo/corpo e
minorenni aspettano `/training/BOUNDARIES.md`.

## Cosa contiene ogni file
- `PERSONAS.md` 7 atleti (P1-P7) + 4 di limite (P8-P11), con massimali · `SCENARIOS.md` 30 scenari (per i conteggi fa fede la composizione in GRID.md) · `UNTRUSTED_INPUT.md` i 4 campi di testo libero + backup, verifiche U1-U5.
- `GRID.md` 8 criteri, soglie proposte, composizione, convenzioni da approvare, gravità, soglie S1-S8 · `RESULTS.md` una riga per misura, aperte (B1-B6, A2-A4, A7, M1, M3-M9, L1-L4) e 4 chiuse, ricalcoli, immagini · `IMAGES.md` verifiche delle figure · `SAFETY_CORE.md` gli 8 casi di `release-gate`, **NON COPERTO non è PASS**.
- `scripts/` misure, nessuna legge il codice che produce la metrica che verifica: `node --experimental-strip-types quality/scripts/X.mts` dalla radice → `safety-core` (esce 1 se non tutti PASS), `01-durata-volume`, `02-revisione`, `03-metriche`, `04-input-non-fidato`, `05-rotazione-attrezzi` · `reports/` un rapporto per invocazione, render in `reports/immagini/`.

## Prossimo giro
Rimisurare dopo `BOUNDARIES.md` e dopo la mappatura valore → gradino (chiude B5
e il caso 2); A7 quando `metrics.ts` filtra la finitura. Immagini: 4 col/230 px,
poi 2/460 sui dubbi (`media/scripts/contact-sheet.mjs`, percorsi assoluti); la
geometria si misura sui comandi SVG. Su telefono: la miniatura della scheda ora
è ritagliata da `overflow-hidden`, non scalata.
