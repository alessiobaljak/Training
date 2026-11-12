# release-gate INDEX
Ultimo rilascio: 2026-11-12b, claude/calisthenics-pwa-offline-kor52w, 79d2cb0, L.
Esito: NO-GO (nucleo 2 PASS, 4 FALLITI, 2 NON COPERTI; 10 Bloccanti attivi di training-quality). verify, smoke, offline passati. Rapporto reports/2026-11-12b-claude-calisthenics-pwa-offline-kor52w.md.
Problemi aperti:
- 2026-11-12b: B11/A15 corretti nel codice, test unitari passano, NON riprodotti in browser; script quality/08 non usa sessionDecisions (obsoleto, sezione Q non decide).
- 2026-11-12: A11 (etichetta diario) aperto; A12, A13, A14 chiusi nel codice, non provati end-to-end; script quality/08 obsoleto; rapporto reports/2026-11-12-claude-calisthenics-pwa-offline-kor52w.md.
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
Tempi (L, 2026-11-12): verify 11 s, smoke 2m25, offline 39 s.
