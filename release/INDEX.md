# release-gate INDEX
Ultimo rilascio: 2026-11-21, claude/calisthenics-pwa-offline-kor52w, 85d1dd8, L.
Esito: GO per regressioni vs 96a90c2; nucleo v13 2 PASS, 4 FALLITI (B6,B8,B9/B17,B10/B16), 2 NON COPERTI (1, 8), uguale a prod salvo 4m chiuso; verify (929 test), build, smoke, offline verdi. Rapporto reports/2026-11-21-claude-calisthenics-pwa-offline-kor52w.md.
- 2026-11-21: persone fittizie, UAT, rollback Vercel, ritest-data e immagine TRX in browser NON eseguiti da me.
- 2026-11-20d: persone fittizie, UAT, rollback Vercel, percorso browser R14 NON eseguiti. B14 chiuso nei circuiti.
Problemi aperti:
- 2026-11-20b: A19 CHIUSO (smoke asserisce badge = panoramica). Persone fittizie, UAT, rollback Vercel ancora NON eseguiti.
- 2026-11-16b: kg dallo stato nel player (A18) senza asserzione di smoke; persone fittizie, UAT, rollback ancora NON eseguiti. Chiusi A17, M17, L15, B12.
- 2026-11-16: B11/A15 CHIUSI (provati da smoke in browser). Aperti A10, A16, A17, M17. Rollback §10 NON eseguito: piano Vercel e deploy Current da annotare; Hobby torna solo al precedente. 2 persone fittizie NON eseguite; UAT di Alessio mai eseguite.
- Quality/08 obsoleto (sezione Q): verificare.
- Nucleo di sicurezza: 2 PASS (5, 7), 2 FALLITI (3, 4), 4 NON COPERTI (1, 2, 6, 8).
- 6 Bloccanti aperti di training-quality (quality/reports/2026-11-09-quality.md).
- Rollback in produzione NON VERIFICATO (Vercel, nessuna procedura scritta).
- Caso 8 non esercitato da smoke/offline; clearAll sul server (azzeramento) non provato su emulatore: da confermare.
- Checklist UAT del 2026-11-08 mai eseguita; quella del 2026-11-09 la sostituisce. Prova con 2 persone fittizie NON eseguita (debito per ogni L).
- Lotto eb6bb89 pubblicato saltando i gate: la descrizione dei commit non è prova.
Misura: miniature scheda non ritagliate (0/12 a 360/390/430 px), figure da 36 px.
File:
- RELEASE_LOG.md: una riga per rilascio (ultime 10 + aperti; resto in ARCHIVE.md).
- SMOKE_FLOWS.md: flussi principali e copertura.
- reports/AAAA-MM-GG-<branch>.md: rapporti completi.
Comando nucleo: node --experimental-strip-types quality/scripts/safety-core.mts
Ordine: verify, nucleo, build, smoke, POI offline (mai insieme).

Tempi (L, 2026-11-21): verify 14 s, build 9 s, nucleo 2x <2 s, smoke 3m13, offline 38 s. Nucleo: copia script v13 con symlink src/media/firestore.rules per tree.