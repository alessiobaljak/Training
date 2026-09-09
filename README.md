# Shadow — Calisthenics

PWA locale per eseguire il protocollo di allenamento Calisthenics Shadow.
Nessun backend, nessun account, nessuna analytics. Funziona in palestra con lo
smartphone in modalità aereo.

Non è un visualizzatore di tabelle: è un motore di progressione. La scheda è il
dato, il valore è la logica che decide quando salire di livello.

## Stato

| Fase | Contenuto | Stato |
|---|---|---|
| 1 | Scaffolding, tipi, trascrizione dei dati, test del seed | fatta |
| 2 | Motore: range, leve, avanzamento, zavorra, deload, medie | da fare |
| 3 | Persistenza Dexie, export/import JSON, export CSV | da fare |
| 4 | Onboarding Settimana 0 e Home | da fare |
| 5 | Player della sessione con timer di recupero | da fare |
| 6 | Log e Progressi | da fare |
| 7 | Misure | da fare |
| 8 | Libreria esercizi, cue, SVG, gestione video | da fare |
| 9 | PWA, service worker, installabilità, test offline | da fare |

## Stack

Vite, React, TypeScript, Tailwind. Dexie per IndexedDB. Vitest per i test del
motore. Nessun framework mobile nativo.

## Sviluppo

```bash
npm install
npm run dev        # server di sviluppo
npm run verify     # typecheck + test + controllo URL video
npm run build      # build di produzione
```

`npm run verify` è il cancello: deve passare prima di ogni commit.

## Installazione sul telefono

Da completare nella Fase 9, quando ci saranno service worker, manifest e icone.

## Dove stanno i dati

Due livelli, tenuti separati apposta.

**Seed statico** — `src/data/`. È la scheda trascritta in TypeScript e non
cambia mai da solo.

| File | Contenuto |
|---|---|
| `program.ts` | Le 6 sedute: blocchi, serie, ripetizioni, TUT, RIR, recuperi |
| `progressions.ts` | Le 8 scale di progressione a 6 livelli |
| `tests.ts` | I 9 test della Settimana 0 |
| `exercises.ts` | Anagrafica: slug, nome, cue, schema motorio, query video |

**Dati dell'utente** — IndexedDB, sul telefono, in `src/db/` (Fase 3). Log
degli allenamenti, misure, risultati dei test, video personali, stato di
avanzamento. Non escono mai dal dispositivo.

## Backup

Da completare nella Fase 3: export e import completi in un unico file JSON, più
export CSV del log con lo stesso schema del foglio Excel di partenza.

Finché non c'è, i dati vivono solo nello storage del browser: disinstallare la
PWA o cancellare i dati del sito li elimina.

## Video degli esercizi

Nel codebase non esiste alcun URL di video. Un ID YouTube scritto a memoria è
quasi sempre morto o punta al video sbagliato.

Ogni esercizio ha invece:

1. da 3 a 5 cue testuali di esecuzione;
2. un'illustrazione SVG schematica (Fase 8);
3. un pulsante che apre una ricerca YouTube precompilata, costruita a runtime
   dal campo `videoQuery` dell'esercizio;
4. un campo "Il mio video", dove l'utente incolla il link che preferisce: da
   quel momento il pulsante apre il suo.

`npm run check:no-video-urls` fallisce se qualcuno introduce un URL di video.
Gira dentro `npm run verify`.

## Come si modifica il programma quando la scheda cambia

I test in `src/data/*.test.ts` sono una **seconda trascrizione indipendente**
delle tabelle della specifica. Cambiare il seed senza aggiornarli fa fallire la
suite: è voluto, serve a impedire modifiche accidentali.

Per cambiare un blocco:

1. modifica la riga in `src/data/program.ts`;
2. aggiorna la riga corrispondente nella tabella attesa in
   `src/data/program.test.ts`;
3. `npm run verify`.

Per aggiungere un esercizio:

1. aggiungi la voce in `src/data/exercises.ts` con slug in kebab-case, da 3 a 5
   cue e una `videoQuery` in inglese;
2. usalo in un blocco del programma o in un test, altrimenti il controllo sugli
   esercizi orfani fallisce;
3. `npm run verify`.

Lo **slug non va mai cambiato**: è la chiave con cui lo storico degli
allenamenti è collegato all'esercizio. Rinominare uno slug scollega i dati già
registrati. Il campo `name` invece si può cambiare liberamente.

## Scelte di trascrizione

Punti in cui la specifica lasciava spazio a più letture. Sono documentati anche
nei commenti dei file interessati.

- **"X o Y"**: quando un blocco elenca due varianti, l'esercizio è mappato al
  livello della prima citata, che è la prescrizione principale.
- **`plannedSets` nei test**: la colonna "Serie previste" della tabella dei test
  indica quante serie quello schema riceve nel programma, non le serie del test.
  Il test è sempre una serie sola a cedimento tecnico.
- **"range test −2"**: l'offset sposta entrambi gli estremi del range calcolato,
  non il massimale prima del calcolo.
- **Volume settimanale**: una serie conta per intero sui gruppi primari e a metà
  sui secondari. Senza questa distinzione una trazione conterebbe come una serie
  piena di bicipiti e il totale settimanale diventerebbe inservibile.
- **Zavorra**: consentita solo sulla whitelist esplicita del metodo (trazioni,
  chin-up, dip, push-up, split squat, step-up). Su tutto il resto il campo non
  esiste.
