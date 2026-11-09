# Rapporto release-gate 2026-11-09 — eb6bb89 (dimensione L)

## Riepilogo e verdetto
**NO-GO.** Motivi, tutti dalla procedura: (1) nucleo di sicurezza con 2 casi FALLITI (3 e 4) e 4 NON COPERTI (1, 2, 6, 8); (2) 6 Bloccanti aperti di training-quality, tutti preesistenti alla baseline; (3) rilascio L senza esito positivo di training-quality (il suo esito è NO-GO). Nessuna regressione su un numero prescritto da questo lotto.
Il lotto in sé è sano: verify 662/662, build, smoke e offline passano. NO-GO non dice che il lotto sia peggiore della baseline: dice che il sistema ha difetti noti che nessun rilascio chiude.

## Oggetto
- Branch claude/calisthenics-pwa-offline-kor52w, commit eb6bb89 contro e32da50: 41 file, +1486/-144.
- Dimensione: **L confermata sul diff** (non alzabile oltre). Motivi: engine/progression.ts, review.ts, metrics.ts (progressione, consigli, analisi), tests.ts/repository.ts (stato di partenza dai massimali), SettingsScreen (cancellazione totale dei dati utente, anche sul server). Serve conferma di Alessio sulla classificazione L.
- Processo: il lotto è stato scritto e spinto saltando release-gate e training-quality, contro il flusso di CLAUDE.md per una L. Recupero a posteriori. Conseguenza già emersa: una modifica dichiarata in un commit che nel codice non esisteva, trovata da training-quality e non dall'autore. Va tenuto presente: la descrizione dei commit di questo lotto non è prova di ciò che il codice fa.
- Uno stato di ambiente: nessun difetto rilevato nell'albero di lavoro (git status pulito all'avvio).

## FAT
- `npm run verify`: typecheck ok, 34 file / 662 test passati, nessun URL di video. 6,6 s.
- Build: ok (solo avviso dimensione chunk 1,46 MB, non nuovo).
- Nucleo di sicurezza (eseguito davvero, quality/scripts/safety-core.mts): 2 PASS · 2 FALLITI · 4 NON COPERTI.
  - 1 dolore: NON COPERTO (nessuna funzione).
  - 2 principiante: NON COPERTO (2a zero→gradino 1 verificato; 2b non decidibile, manca la mappatura valore→gradino). Non è più FALLITO: era un difetto dello script.
  - 3 corpo libero: **FALLITO** (32 blocchi su 48 senza alternativa a corpo libero; nessun campo attrezzatura).
  - 4 progressione: **FALLITO** (4 soglie proposte superate su 6: 4a, 4b, 4c, 4d; 4e e 4f corretti). Le soglie attendono l'approvazione di Alessio.
  - 5 nessuna diagnosi/farmaci: PASS (ricerca testuale, testi dell'azzeramento inclusi).
  - 6 immagini: NON COPERTO (6a verificato, 6b senza registro delle approvazioni).
  - 7 testo dell'atleta: PASS (6 stringhe ostili x 2 campi).
  - 8 accesso incrociato: NON COPERTO (regola presente in firestore.rules, nessun test la esercita).
- `npm run smoke`: superata (onboarding, range, flussi A di SMOKE_FLOWS). 2 m 15 s. Due asserzioni di smoke.mjs sono state modificate dal lotto (formato m:ss, «in pari» al posto di percentuale): rilassano la prova, non la irrigidiscono; segnalato.
- `npm run offline` (lanciato dopo smoke, mai insieme): superata, modalità aereo e server spento. 33 s.
- Rollback in produzione: NON VERIFICATO (hosting Vercel, nessuna procedura scritta).

## UAT (prove con persone fittizie)
- Misure al computer con Chromium sul build (script in scratchpad, non nel repo), schermata scheda `#/scheda/circuito-1`:
  - Miniature: 12 riquadri (80x56 px) a 360, 390 e 430 px di larghezza. Per ciascuno: due figure da 36x36 px dentro il riquadro, scrollWidth = clientWidth, scrollHeight = clientHeight, nessun bordo di immagine fuori dal riquadro. **0 ritagliate su 12 a tutte e tre le larghezze. Zero didascalie nella scheda.** Verificata a occhio sullo screenshot a 360 px: figure intere, nessuna sovrapposizione al nome. Quindi l'affermazione di training-quality «ritagliate, non scalate» NON si conferma sullo stato eb6bb89: l'overflow-hidden c'è ma non taglia niente. Resta aperto un dato diverso: le figure sono 36 px, piccole. Se si leggano bene dal vivo lo decide Alessio sul telefono.
  - Azzeramento totale, a 390 px, senza premerlo: la conferma si legge (testo, parola CANCELLA, campo, «Sì, cancella tutto», «Annulla»). Pulsante `disabled` a campo vuoto e con testo sbagliato («parola sbagliata»). Non provato con la parola giusta (premerlo cancellerebbe i dati di prova; non necessario per questa verifica).
- Prova dei flussi con due persone fittizie di /quality/PERSONAS.md: **NON ESEGUITA**. Smoke e offline usano un utente generico. Richiesta dalla procedura L: resta debito.
- Giudizio «allenatore che conosce l'atleta o app generica» e rapidità della registrazione in palestra: **NON VALUTATI**.

## Checklist UAT per Alessio
Nota: la checklist del 2026-11-08 non è mai stata eseguita. Questa la sostituisce e la include. Durata stimata 10 minuti, sul telefono, dopo l'aggiornamento dell'app.
1. Apri Allena, poi Seduta 1, scheda. Le miniature delle figure: sono intere, senza testo che esce dal riquadro né sovrapposto al nome? Si capisce la posizione a 36 px? [ ] sì [ ] no
2. Nella scheda, le durate («almeno 0:40», «1:00») sono scritte come nel player? Il bulgaro dice 1:00, non «100»? [ ] sì [ ] no
3. I titoli dei gruppi (Tri-set A/B, Coppia, Finitura) sono sensati? [ ] sì [ ] no
4. Avvia la seduta: riscaldamento, un blocco di lavoro, «Fatto» su una serie, il recupero parte. Il pollice arriva ai pulsanti? [ ] sì [ ] no
5. La pausa tra blocchi nomina i blocchi giusti (commit eb6bb89)? [ ] sì [ ] no
6. Apri Esercizi, un esercizio con figura: la figura si vede con le due posizioni? [ ] sì [ ] no
7. Progressi: aderenza come percentuale oppure «in pari», mai un trattino? [ ] sì [ ] no
8. Revisione di fine settimana: i verdetti hanno senso sulle tue serie reali? Nessuna salita di gradino che ti sembra troppo presto? [ ] sì [ ] no
9. Se hai fatto la Settimana 0 con zero trazioni o dip: la scheda parte dal gradino 1, non dalle complete? [ ] sì [ ] no
10. Impostazioni, in fondo, «Cancella tutti i dati»: NON confermare. Il testo di conferma si legge? «Sì, cancella tutto» è spento finché non scrivi CANCELLA? Premi Annulla. [ ] sì [ ] no
11. Modalità aereo, riapri l'app: scheda e seduta si aprono, le figure si vedono? [ ] sì [ ] no

## Non testato e da confermare
- NON COPERTI del nucleo (1, 2, 6, 8): restano buchi noti in evidenza.
- NON TESTATO: due persone fittizie; giudizio sul metodo; qualità delle figure sul telefono reale; modalità aereo sul telefono reale; azzeramento eseguito fino in fondo.
- DA CONFERMARE alla sessione principale (dati personali, non chiudo io): `clearAll` esiste in firestore-store.ts ma nessuno script (né smoke né offline) lo esegue contro l'emulatore; i test unitari lo coprono su store in memoria/Dexie. Che l'azzeramento cancelli davvero anche /users/{uid} sul server, come promette il testo («Vale anche sul server»), non è verificato. Resta anche da confermare cosa succede se la cancellazione sul server fallisce a metà o senza rete (il codice mostra un errore e non ricarica: da guardare).
- Rollback produzione non verificato.

## Domande aperte
1. Alessio conferma la classificazione L per questo lotto?
2. Alessio approva, modifica o respinge le soglie proposte di GRID.md (S1-S7)? Senza la sua decisione i casi 4 e 2 non si chiudono.
3. Come si chiudono i 6 Bloccanti, e chi li prende (training-designer per metodo e attrezzatura, sessione principale per il resto)? Accetta Alessio un rilascio in produzione con Bloccanti aperti, come decisione sua esplicita e registrata, o li vuole chiusi prima?
4. Per il caso 8: va scritto il test di accesso incrociato prima che si registri una seconda persona?
5. Rollback: chi scrive e prova la procedura su Vercel?
6. Le figure da 36 px nella scheda sono abbastanza leggibili sul telefono, o si vuole un riquadro più grande?
