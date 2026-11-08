# release-gate INDEX
Ultimo rilascio: 2026-11-08, branch claude/calisthenics-pwa-offline-kor52w, e32da50, M (prova a vuoto).
Esito: NO-GO (nessun rilascio in corso; è una misura del costo del controllo).
Problemi aperti:
- Nucleo di sicurezza: 2 PASS, 3 FALLITI (casi 2, 3, 4), 3 NON COPERTI (1, 6, 8).
- 6 difetti Bloccanti aperti di training-quality (quality/reports/2026-11-08-quality.md).
- Rollback in produzione NON VERIFICATO (il sito è servito da Vercel, nessuna procedura scritta).
- smoke e offline non coprono il caso 8 (accesso incrociato tra utenti).
File:
- RELEASE_LOG.md: una riga per rilascio (ultime 10 + aperti; il resto in ARCHIVE.md).
- SMOKE_FLOWS.md: flussi principali e quale script li copre.
- reports/AAAA-MM-GG-<branch>.md: rapporti completi.
Comando nucleo: node --experimental-strip-types quality/scripts/safety-core.mts
Ordine: verify, nucleo, build, smoke, POI offline (mai insieme).
Tempi misurati (prova a vuoto M): vedi rapporto 2026-11-08.
