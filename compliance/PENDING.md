# Da chiudere prima di aprire al pubblico

Oggi l'app ha un solo utente e nessuna di queste voci è urgente. Diventano tutte bloccanti nel momento in cui si registra la seconda persona.

## Dati personali

I dati che l'app raccoglie — peso, circonferenza vita, carichi, frequenza cardiaca, note libere, e in prospettiva infortuni e condizioni di salute — sono **dati sensibili** ai sensi della legge svizzera sulla protezione dei dati (nLPD) e del GDPR. Sono trattati con più cura di un indirizzo email, non con la stessa.

- [ ] **Informativa sulla privacy**: quali dati, perché, dove stanno, per quanto, chi li vede.
- [ ] **Consenso esplicito e separato per i dati sanitari**, distinto dall'accettazione dei termini.
- [ ] **Cancellazione su richiesta**: un modo per l'utente di cancellare tutto, verificabile. Oggi esiste `repository.clearAll()`, che è locale: va esteso al ramo Firestore e reso raggiungibile dall'interfaccia.
- [ ] **Esportazione dei dati** in un formato leggibile. Il backup esiste già: va dichiarato come diritto, non solo come funzione.
- [ ] **Minimizzazione verso l'esterno**: oggi nessun dato dell'atleta lascia il dispositivo e Firestore. L'unica uscita è una stringa di ricerca YouTube, che non contiene dati personali. **Se un giorno si aggiunge un servizio AI esterno, questa riga va riscritta prima**, dichiarando esattamente cosa gli viene inviato.
- [ ] **Base giuridica e luogo di conservazione**: Firestore sta in una regione da dichiarare nell'informativa.

## Idoneità e sicurezza dell'utente

- [ ] **Questionario di idoneità** prima del primo programma (modello PAR-Q+ o equivalente), con l'esito che condiziona cosa l'app propone.
- [ ] **Avvertenze d'uso**: l'app non è un dispositivo medico, non sostituisce un professionista, chi ha una condizione medica consulta un medico prima di cominciare.
- [ ] **Gestione del dolore e dell'infortunio**: oggi **non esiste**. È il buco più grande, e sta in `/training/BOUNDARIES.md` come primo compito di `training-designer`.
- [ ] **Decisione sui minorenni**: destinata o non destinata a chi ha meno di 18 anni. Se non destinata, va detto e va impedito; se destinata, cambia il metodo e serve il consenso di chi esercita l'autorità parentale.
- [ ] **Segnali di rapporto problematico con cibo, peso o corpo**: cosa fa l'app, quali risorse indica.

## Contenuti e licenze

- [ ] **Licenza RepDB verificata e datata** per le 91 illustrazioni: uso commerciale in-app con attribuzione, termine 3 (no ridistribuzione come dataset), termine 5 (no uso come riferimento per modelli generativi). Da riportare in `/media/LICENSING.md` con fonte e data della verifica.
- [ ] **Attribuzione visibile** nell'app: c'è, nella schermata «App e dati». Va mantenuta e verificata a ogni rilascio.
- [ ] **Figure generate** da `scripts/generate-exercise-svg.mjs`: sono opera propria, nessun vincolo di terzi. Da dichiarare per distinguerle dalle RepDB.

## Responsabilità

- [ ] **Termini di servizio** con limitazione di responsabilità per un'app di allenamento.
- [ ] **Nessuna promessa di risultato** in nessun testo dell'app. Da verificare con una ricerca testuale a ogni rilascio.
