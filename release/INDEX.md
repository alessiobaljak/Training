# release-gate INDEX
Ultimo rilascio: 2026-11-09, claude/calisthenics-pwa-offline-kor52w, eb6bb89, L.
Esito: NO-GO (nucleo: 2 FALLITI, 4 NON COPERTI; 6 Bloccanti aperti di training-quality; L senza esito positivo di training-quality). verify, build, smoke, offline passati.
Problemi aperti:
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
Tempi (L, 2026-11-09): verify 7 s, smoke 2m15, offline 33 s.
