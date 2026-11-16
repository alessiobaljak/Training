# ARCHIVE.md — voci chiuse o assorbite

Riepilogo: al 2026-11-14 quattro voci del BACKLOG escono dal file principale
(una chiusa in codice, tre assorbite da R5 e R7). Al 2026-11-16 escono W-19…W-22
(R5-R8 in produzione, `a747e09`) e le tabelle di prova di R5-R7.

| id | cosa era | esito | data |
|---|---|---|---|
| D-01 | `excludeFromReview` non letto: +2,5 kg sullo swing, `range-da-rifare` falso sulle stazioni a tempo | **chiuso in codice**: `review.ts` salta i blocchi esclusi (verificato leggendo il motore) | 2026-11-14 |
| D-02 | Nessun tetto agli aumenti: tre salite in 7 giorni | assorbito da **R7** (W-22) | 2026-11-14 |
| D-03 | Revisione sale col tempo non rispettato | assorbito da **R5** (W-20) | 2026-11-14 |
| W-18 | Ping-pong trazioni 1↔3 dopo il salto dell'eccentrico | assorbito da **R7**: dopo una discesa si risale solo dopo 14 giorni al gradino più basso | 2026-11-14 |
| W-19 | R8 coppia di sedute, finestra di 14 giorni, `rimandati`, stati della revisione (M1) | **chiuso in codice** (`ff42dfb`, in produzione `a747e09`); quality 2026-11-15: M1 CHIUSO | 2026-11-16 |
| W-20 | R5 cancello unico (A2) | **chiuso in codice** (`2c9d822`, `ff42dfb`); A2 CHIUSO | 2026-11-16 |
| W-21 | R6 variante prima del carico (A3) | **chiuso in codice**; A3 CHIUSO. Ordine tempo/pausa in revisione: R10 (W-26) | 2026-11-16 |
| W-22 | R7 un gradino ogni 14 giorni (A4) | **chiuso in codice**; A4 CHIUSO | 2026-11-16 |

## Tabelle di prova di R5, R6, R7 (spostate da PROGRESSION_RULES §9 il 2026-11-16)

In codice da `a747e09`; test in `progression-r5r6r7.test.ts` e `review.test.ts`.
**Con R10 (2026-11-16) cambiano atteso:** 6.4-6.7 e 6.10 valgono solo con
eccentrica 5" e pausa 2" (bonus a 0 ⇒ `alMassimo` `tempo`); 6.11 ⇒ `alMassimo`
(R10c-0). Rapporto `reports/2026-11-16-training.md`.

R5 — base: rematore TRX `circuito-2/A3`, gradino 2, 8-10, W=2; chiuse 03-10 e
03-13 da 11-11-11; prima al 2 il 03-02; `weekEnd` 03-15, oggi 03-16.

| # | ingresso | atteso |
|---|---|---|
| 5.1 | tempo [sì, sì] | `sali-di-livello` 2→3 |
| 5.2 | [sì, no] | `rifai-al-tempo-giusto`, `stateAfter = stateBefore` |
| 5.3 | [sì, null] | `rispondi-sul-tempo` |
| 5.4 | [no, null] | `rifai-al-tempo-giusto` (il no vince) |
| 5.5 | caso 4a com'è: 1 seduta 19-19-19, no o null | nessun verdetto (lo chiude R8) |
| 5.6 | 7-7-7 e 7-7-7, [no, no] | `scendi-di-livello` 2→1 |
| 5.7 | W=5 o W=6, [sì, sì] | nessun aumento, `fermi` scarico |
| 5.8 | curl a martello `circuito-1/B1`, 2 sedute al massimo, [sì, null] | `rispondi-sul-tempo`, nessun +2,5 kg |
| 5.9 | fine seduta 11-11-11, null | nessuna leva |
| 5.10 | fine seduta 11-11, sì | nessuna leva, «oggi ne hai chiuse 2» |
| 5.11 | fine seduta in settimana 6, 11-11-11, sì | nessuna leva, testo scarico |
| 5.12 | fine seduta ridotta (R9), 11-11-11, sì | nessuna leva, testo rientro |
| 5.13 | W=7: coppia 04-08 (W6, 2 giri al massimo) e 04-15, [sì, sì] | `fermi` scarico «una delle due sedute è di scarico» |
| 5.14 | W=7: coppia 04-13 e 04-16 (entrambe W7), [sì, sì] | `sali-di-livello` |
| 5.15 | una seduta a settimana: 03-05 sì, 03-12 no, 03-19 sì, 03-26 sì, sempre 11-11-11 | W2 e W3 `rifai-al-tempo-giusto` · W4 `sali-di-livello` |

R6 — base: trazioni `circuito-1/A1`, 6-8, coppia di R8, tempo [sì, sì], R7 ok.

| # | ingresso | atteso |
|---|---|---|
| 6.1 | caso 4b: W=3, gradino 1, 8-8-8 ×2 | nessuna zavorra; `alMassimo` `tempo` |
| 6.2 | W=3, gradino 1, 9-9-9 ×2 | `sali-di-livello` 1→3 |
| 6.3 | 6.2 con R7 non soddisfatta | `inAttesa`, nessuna zavorra |
| 6.4 | W=4, gradino 6, 8-8-8 ×2, M=12 | `aggiungi-peso` 0→2,5 kg |
| 6.5 | 6.4 con M=6 | `alMassimo` `soglia`, cita 6 e 8 |
| 6.6 | 6.4 senza test | `alMassimo` `nessun-test` |
| 6.7 | W=1, gradino 6, M=12 | `alMassimo` `settimana` |
| 6.8 | fine seduta W=4, gradino 1, 8-8-8, sì | leva ≠ `load`; `load`: «prima la variante» |
| 6.9 | fine seduta W=4, gradino 6, 8-8-8, M=6 | `load.available = false`, motivo soglia |
| 6.10 | dip `circuito-1/A3`, gradino 6, 2 sedute al massimo, M=9 | nessuna zavorra (soglia 10) |
| 6.11 | curl a martello, 2 sedute al massimo, sì | `aggiungi-peso` (manubrio successivo) — **superata da R10c** |

R7 — base: push-up `circuito-3/A2`, 12-18, gradino 2, 19-19-19 e tempo sì;
chiuse W1 03-02 e 03-05, W2 03-09 e 03-12, W3 03-16 e 03-19.

| # | ingresso | atteso |
|---|---|---|
| 7.1 | revisione W1, oggi 03-09 | 7 giorni: `inAttesa`, dal 03-16 |
| 7.2 | revisione W2, oggi 03-16 | `sali-di-livello` 2→3, accettata |
| 7.3 | fine seduta 03-16 al 3 (in corso) | `variant` non disponibile, dal 03-30 |
| 7.4 | revisione W3, oggi 03-23 | 7 giorni al 3: `inAttesa`, dal 03-30 |
| 7.5 | caso 4c: le tre settimane | 1 salita |
| 7.6 | trazioni 1→3, prima seduta al 3 il 03-17, poi 9-9-9 | nessuna salita al 4 prima del 03-31 |
| 7.7 | salita accettata, seduta ricaricata (B11) | stessa proposta + «Scelta registrata» |
| 7.8 | discesa 3→2 il 03-20, prima seduta al 2 il 03-23 | nessuna salita prima del 04-06 |
| 7.9 | stato 3 da 2 giorni, 2 sedute sotto il minimo | `scendi-di-livello` |
| 7.10 | solo stati di R1, nessuna seduta | nessuna salita |
| 7.11 | voci 2, 2, 3, 2 (03-02, 03-05, 03-09, 03-12), stato 2, oggi 03-20 | inizio 03-12, dal 03-26; revisione W2: `pocheProve` |
| 7.12 | ultima al 2 il 03-02, rientro il 03-20 | R7 vera, R9 blocca le ridotte; in revisione `pocheProve` |
