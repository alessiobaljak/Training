# Scenari di riferimento — v1 (2026-11-08)

Colonna **Val.**: validato da Alessio su un campione. `—` = non ancora
validato. Oggi **nessuno** è validato: il campione da validare è in fondo.
Colonna **Esito** = misura di baseline del 2026-11-08 (vedi RESULTS.md).
Gli script stanno in `quality/scripts/`, si eseguono con
`node --experimental-strip-types quality/scripts/<file>.mts` dalla radice.

Legenda esito: `OK` · `DIFETTO` (vedi rapporto) · `N/C` non coperto, la
funzione non esiste · `N/E` non eseguibile oggi (serve interfaccia o emulatore).

---

## 1. Generazione del programma

| ID | Persona | Scenario | Comportamento atteso | Val. | Esito |
|---|---|---|---|---|---|
| G1 | P1 | chiude i 9 test con 0 trazioni, 0 dip, 0 nordic e nessun attrezzo | nessun esercizio che richieda sbarra, anelli, TRX, kettlebell; trazioni al gradino 1 o assenti | — | DIFETTO |
| G2 | P2 | palestra completa, 4 sedute | le 4 sedute del circuito, volume braccia/spalle in priorità dichiarata | — | OK |
| G3 | P3 | avanzato con anelli e zavorra, nessun manubrio | i blocchi a manubrio (goblet, rematore un braccio, curl martello, tricipiti, suitcase) devono avere una via d'uscita | — | DIFETTO |
| G4 | P4 | rientro dopo 14 mesi, massimali vecchi | ritest richiesto prima di prescrivere; volume ridotto nelle prime 2 settimane | — | DIFETTO |
| G5 | P5 | 58 anni, nessuna sbarra, ipertensione non dichiarabile | nessuna finitura metabolica a frequenza cardiaca alta senza avvertenza; nessun esercizio fuori attrezzatura | — | DIFETTO |
| G6 | P7 | 30 minuti dichiarati | una seduta che sta in 30 minuti, o la dichiarazione esplicita che non esiste | — | DIFETTO |
| G7 | P1,P5 | livello di partenza di ogni esercizio | mai sopra il gradino che il test ha misurato **con il valore misurato**, non solo con l'esercizio del test | — | DIFETTO |

## 2. Progressione dopo 2, 4 e 8 settimane di dati fittizi

| ID | Persona | Scenario | Comportamento atteso | Val. | Esito |
|---|---|---|---|---|---|
| P-2a | P2 | sett. 2, tutte le serie dentro il range | nessun verdetto, nessuna leva tirata | — | OK |
| P-2b | P2 | sett. 2, sopra il massimo su ogni serie, tempo rispettato | salita di un gradino, avviso sulla perdita del 30-40% | — | OK |
| P-2c | P2 | sett. 2, sopra il massimo ma **tempo non rispettato** | nessuna salita: la settimana si rifà al tempo giusto | — | DIFETTO |
| P-2d | P2 | sett. 2, massimo chiuso esatto su un gradino facilitato | prima la variante (leva 4), non la zavorra (leva 5) | — | DIFETTO |
| P-4a | P3 | sett. 4, gradino 6 e massimo chiuso | zavorra +2,5 kg, mai oltre un passo per settimana | — | OK |
| P-4b | P2 | sett. 4, salite consecutive | tetto alla velocità di salita (vedi soglia S4 in GRID.md) | — | DIFETTO |
| P-8a | P2 | sett. 8, 4 settimane identiche dentro il range | regola di stallo: qualcosa da cambiare, non silenzio | — | DIFETTO |
| P-8b | P6 | sett. 8, un lato indietro sull'altro | nessuna salita finché entrambi i lati non chiudono | — | OK |
| P-8c | P7 | sett. 8 con 9 sedute su 20 | la progressione non deve premiare una settimana da una sola seduta | — | DIFETTO |

## 3. Stallo, seduta saltata, attrezzo non disponibile, consiglio

| ID | Persona | Scenario | Comportamento atteso | Val. | Esito |
|---|---|---|---|---|---|
| S1 | P2 | 6 settimane con gli stessi numeri dentro il range | l'app nomina lo stallo e propone una leva | — | DIFETTO |
| S2 | P7 | salta 3 sedute, poi riprende | nessuna colpa, nessun recupero forzato, aderenza letta con onestà | — | DIFETTO |
| S3 | P4 | 20 giorni senza allenarsi, poi apre l'app | avviso di rientro, volume ridotto o ritest | — | DIFETTO |
| S4 | P3 | la kettlebell non c'è | alternativa dichiarata e scegliibile | — | OK |
| S5 | P1 | la sbarra non c'è | alternativa dichiarata o blocco rimosso | — | DIFETTO |
| S6 | P2 | «cosa faccio la prossima seduta?» | numeri dell'atleta, non frasi generiche | — | N/C |
| S7 | P5 | 4 giorni di allenamento di fila | avviso sui giorni consecutivi e sui muscoli ripetuti | — | OK |

## 4. Scenari di limite — i cinque che non si negoziano

| ID | Persona | Input esatto | Comportamento atteso | Val. | Esito |
|---|---|---|---|---|---|
| L1 | P6 | nota della serie: «ginocchio destro, fastidio acuto, mi sono fermata» | rimando: fermare quell'esercizio, non proporre progressione su di esso, invito a un professionista sanitario se il dolore persiste | — | N/C |
| L2 | P9 | nota della seduta: «ernia L4-L5 operata nel 2022, cosa posso fare?» | rimando a un professionista sanitario; nessun adattamento del programma, nessuna rassicurazione | — | N/C |
| L3 | P10 | peso −3 kg/settimana per 3 settimane + nota «solo 600 kcal, devo recuperare quello che ho mangiato ieri» | nessun commento sul corpo o sulle calorie, indicazione di risorse di aiuto, nessun obiettivo di peso suggerito | — | N/C |
| L4 | P11 | «in quanto tempo mi garantite 5 kg di muscolo?» | nessuna promessa di risultato, nessuna cifra, nessuna data | — | OK (nessun canale per chiedere, nessun testo di promessa in app) |
| L5 | P8 | dichiara 16 anni | decisione dichiarata sui minorenni e, se non destinata, blocco | — | N/C |

## 5. Input non fidato
Tabella completa in UNTRUSTED_INPUT.md. Scenario di riferimento: U1-U5.

## 6. Mappa scenario → criterio della griglia
- Sicurezza: G1, G3, G5, G7, P-2d, P-4b, S3, S5
- Rimandi: L1, L2, L3, L5
- Fedeltà: U1-U3, M-VOL, M-ADER
- Coerenza con il metodo: G2, P-2c, P-2d, P-8c, V-FINITURA, V-VOLUME
- Personalizzazione: G7, S6, P-2b (evidenza con i numeri veri)
- Concretezza: P-2b, P-2c, S1, R-ALMASSIMO
- Analisi dei progressi: M-MM, M-SETT, M-VOL, M-ADER, M-RIEP, M-DUR
- Durata: D1-D4 (una per seduta del circuito)

## 7. Campione da far validare ad Alessio (14 scenari)
Scelti perché definiscono una regola, non un caso raro:
G1, G7, P-2b, P-2c, P-2d, P-4b, P-8a, S1, S3, L1, L2, L3, L5, V-VOLUME.
Senza il suo «sì, questo è il comportamento giusto» i verdetti di questi
quattordici restano un'opinione mia.

## 8. Scenari da aggiungere al prossimo giro
- Ritest di settimana 6 e 12 con massimali in calo.
- Settimana di scarico (6, 12, 18) misurata, non solo stimata.
- Backup esportato e reimportato a metà mesociclo.
- Due utenti sullo stesso dispositivo (serve l'emulatore).
- Seduta chiusa senza registrare nessun carico su un esercizio a manubri.

## 9. Scenari aggiunti il 2026-11-12 (da far validare)

| ID | Persona | Scenario | Comportamento atteso | Val. | Esito 2026-11-12 |
|---|---|---|---|---|---|
| P-TEMPO | P2 | trazioni 9-9-9 su 6-8 in 22" ciascuna (2,4"/rip contro 4" di TUT), player guidato con partenza automatica | «tempo non rispettato»: nessuna leva | — | DIFETTO (A12, `07`) |
| P-ACC | P2 | a fine seduta accetta «variante» (gradino 1 → 3), poi «Salva e chiudi» | la seduta dopo è al gradino 3 | — | DIFETTO (A13, `08`) |
| G8 | P1 | dead hang misurato 8", decompressione 30" al gradino 2 | gradino 1 (piedi che sfiorano) o tempo ridotto; l'onboarding non dice «non usato» | — | DIFETTO (B9, caso 2c) |
| M-RIEP-SEDUTA | P2 | settimana 6 (scarico), seduta completa | «12 serie su 12», nessun «chiusa prima della fine» | — | DIFETTO (M14) |
| R1-PART | P1, P2 | gradino di partenza per ogni esercizio con valori 0..40 | = R1 di PROGRAM_RULES §3 | — | OK (`09`, 3024 celle) |
