# Flussi principali (ricavati da scripts/smoke.mjs e scripts/offline.mjs)
Da confermare con Alessio. Copertura: A = npm run smoke, O = npm run offline, M = a mano sul telefono.
1. Accesso con Google (pulsante "Continua con Google", onboarding "Vai ai test", 9 test, range corretti): A
2. Home con rotazione delle 4 sedute ("Apri Seduta 1-4"): A
3. Apertura della scheda (un solo pulsante per iniziare): A
4. Seduta guidata dal riscaldamento alla registrazione di una serie (avanti, "Fatto", recuperi, ripresa): A, M
5. Progressi (tabella, 13 colonne): A
6. Revisione di fine settimana (verdetti, scala a 6 gradini, cambio gradino): A
7. Schermata di un esercizio con la figura (immagini dal bundle): A, M
8. Uso senza rete (modalità aereo, server spento, service worker e cache): O, M
Non coperto da nessuno script: accesso incrociato tra utenti (caso 8), qualità visiva sul telefono reale.
