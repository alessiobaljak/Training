# /quality/ — indice
2026-11-08 · atleti **v1** · griglia **v1** · nucleo **v1**

## Ultima misura (baseline) — 2026-11-08
Regole: `circuit.ts` 4 circuiti + engine al 2026-11-08. **NO-GO contro soglie proposte** · Bloccanti 6 · Alti 7 · Medi 7 · Bassi 2.
C1 sicurezza 14 · C2 rimandi 0 · C3 fedeltà 67 · C4 coerenza 43 · C5 personalizz. 50 · C6 concretezza 50 · C7 progressi 67 · **C8 durata 100** (%).
Nucleo di sicurezza: **2 PASS · 3 FALLITI · 3 NON COPERTI** su 8.
Rapporto: `quality/reports/2026-11-08-quality.md`
Immagini: 3 giudicate (2°+3° giro), **3 SCARTATE**, 0 idonee → `IMAGES.md`. La
`figura-b` del giro cieco ha il gesto corretto: cade su §2 per 2 difetti di
forma (manubri che leggono come bilanciere, spessori disomogenei).

## Soglie
**Nessuna approvata da Alessio**: quelle di GRID.md sono proposte, ogni esito si
legge «misurato contro soglie proposte». Nessuno dei 30 scenari è validato
(campione: SCENARIOS.md §7). Aperta: il manubrio «due barre sovrapposte» è
convenzione approvata? Se sì il punto 5 cade e `figura-b` è idonea con riserva.

## Da ricordare
Nessuna AI nel prodotto: stessa fixture, stesso numero, sempre — una misura che
si muove è una regola che si è mossa, mai rumore. I 4 Bloccanti su dolore,
condizioni mediche, cibo/corpo e minorenni aspettano `/training/BOUNDARIES.md`.
I 2 non ovvi: gradino di partenza cieco ai 9 test (trazioni complete a chi ne fa
zero); nessun modello dell'attrezzatura (32 blocchi su 48 senza alternativa).

## Cosa contiene ogni file
- `PERSONAS.md` — 7 atleti (P1-P7) + 4 persone di limite (P8-P11), con massimali.
- `SCENARIOS.md` — 30 scenari: atteso, esito, mappa verso i criteri, campione da validare.
- `UNTRUSTED_INPUT.md` — i 4 campi di testo libero + il backup; verifica U1-U5 che nessuno entri in un calcolo.
- `GRID.md` — 8 criteri con soglie proposte, 4 gravità, 8 soglie sulla progressione (S1-S8).
- `RESULTS.md` — una riga per misura; 22 voci aperte (B1-B6, A1-A7, M1-M7, L1-L2); ricalcoli; tabella immagini (4 figure).
- `IMAGES.md` — verifiche indipendenti delle figure, punto per punto sulla checklist di `media/REVIEW_CHECKLIST.md`.
- `SAFETY_CORE.md` — gli 8 casi che `release-gate` esegue a ogni rilascio. **NON COPERTO non è PASS.**
- `scripts/` — misure, nessuna legge il codice che produce la metrica che verifica. Dalla radice: `node --experimental-strip-types quality/scripts/X.mts` → `safety-core` (esce 1 se non tutti PASS), `01-durata-volume`, `02-revisione`, `03-metriche`, `04-input-non-fidato`, `05-rotazione-attrezzi`.
- `reports/` — un rapporto per invocazione; render immagini in `reports/immagini/`. `ARCHIVE.md` non esiste ancora.

## Prossimo giro
Rimisurare dopo `BOUNDARIES.md`. Immagini: checklist a 4 col/230 px, poi 2/460
sui dubbi (`media/scripts/contact-sheet.mjs`, percorsi assoluti); la geometria
si misura sui comandi SVG, non a occhio.
