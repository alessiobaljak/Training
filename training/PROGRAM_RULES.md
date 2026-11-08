# PROGRAM_RULES.md — regole deterministiche del programma

Versione **programmi 1.0 — PROPOSTA del 2026-11-08, non approvata.**
Programma attivo: `src/data/circuit.ts` (4 circuiti). Archiviato: `src/data/program.ts`.

## 1. Il programma non si genera: si sceglie

`[IN CODICE]` Oggi l'app **non genera** nessun programma. I quattro circuiti
sono dati scritti a mano, blocco per blocco, e l'unica cosa che l'app decide è
quale dei quattro proporre adesso: il successivo all'ultimo chiuso, in ordine
circolare (`src/engine/rotation.ts`, `CIRCUIT_ORDER`). Niente giorni assegnati.

Questa è la proprietà più forte dell'app e va difesa: nessuna combinazione di
esercizi nasce a runtime. Qualunque regola di generazione futura sceglie dentro
un catalogo di blocchi approvati, non compone esercizi liberamente.

## 2. Struttura della settimana

`[IN CODICE]` Quattro sedute da 40 minuti stimati, ognuna così:

| blocco | tipo | serie | prescrizione | recupero (trans./giro/blocco) |
|---|---|---|---|---|
| A1-A3 | tri-set di forza | 3 | 6-10 rip (8-12 dove unilaterale) | 30" / 45" / 90" |
| B1-B3 | tri-set di volume | 3 | 12-18 rip, 40-60" sulle isometrie | 20" / 30" / 60" |
| C1-C2 | braccia | 3 | 10-14 rip | 20" / 25" / 60" |
| D | core / anti-rotazione | 2 | 30-45" oppure 8-14 rip | 30" tra le serie |
| F1-F3 | finitura metabolica | 2 | 30" fissi, o 15-20 swing | 15" / 0" / 0" |

Regole di ordinamento, già applicate nei dati e da mantenere:
- **Tri-set non competitivi**: tre stazioni di fila i cui muscoli non si
  contendono niente. È ciò che fa stare il volume in 40 minuti.
- **Due stazioni che dipendono dalla presa non sono mai consecutive.**
- I picchi sistemici (frequenza cardiaca) sono separati da stazioni locali.
- I gesti balistici (swing) stanno nel riscaldamento e nella finitura, mai nei
  tri-set, e **mai in una seduta che ha già due cerniere d'anca** (vedi il
  commento su `circuito-4` F2, che è una regola di sicurezza travestita da nota).

`[PROPOSTA]` Le ultime due righe sono oggi commenti in `circuit.ts`: vanno
trasformate in due test sui dati (BACKLOG D-07), altrimenti il prossimo blocco
aggiunto le viola senza che nessuno se ne accorga.

## 3. Scelta dell'esercizio e del gradino

`[IN CODICE]` L'esercizio di un blocco è fissato nel dato. Quello che si muove è
il **gradino**: si sceglie quello su cui il massimo tecnico cade dentro il range
prescritto. Oggi questa regola vive come prosa italiana nel campo `variantNote`
del blocco A1 di `circuito-1` e non è calcolata da nessuna funzione.

`[PROPOSTA]` Regola deterministica, da applicare alla prima seduta su un blocco
e dopo ogni ritest:

1. Se esiste un massimale misurato sullo schema motorio, il gradino di partenza
   è il più alto `L` tale che `round(massimale_al_gradino_di_test × 0,75) ≥ max`
   del range **non** sia superato — in pratica resta il tetto già implementato in
   `startingLevel`: mai sopra il gradino a cui il test è stato eseguito.
2. Se non esiste massimale su quello schema: gradino 1.
3. Alla prima seduta l'app chiede una conferma e non più di una: «fai una serie
   di prova. Se ne chiudi più di `max` fermati e sali di un gradino; se non
   arrivi a `min` scendi di un gradino.» Un solo aggiustamento per seduta.
4. Mai proporre un gradino con `minLevel` sopra il livello dell'atleta, né un
   gradino i cui `prerequisites` non sono soddisfatti (EXERCISE_SCHEMA §2).

## 4. Serie, ripetizioni, recupero

`[IN CODICE]`
- Serie: dal dato del blocco; nelle settimane di deload (6, 12, 18) si
  dimezzano con minimo 1 (`effectiveSets`).
- Ripetizioni: range fisso nei circuiti; `round(max × 0,55)`-`round(max × 0,75)`
  dove la prescrizione è `reps-from-test` (solo nel programma archiviato).
- Durata minima di serie: `workSeconds`, oppure calcolata da TUT × minimo del
  range. Non è un tetto: è il monito che 8 ripetizioni a 3-0-1-0 durano 32
  secondi e chiuderle in 18 vuol dire che il tempo non c'era.
- Recupero: quattro livelli, §2.

## 5. Durata massima della seduta

`[IN CODICE]` `estimatedMinutes = 40` su tutti e quattro i circuiti; la durata
vera è calcolata dal piano guidato (`estimatedSeconds`, `src/engine/circuit.ts`).

`[PROPOSTA]` Tetto duro **55 minuti** di piano guidato, riscaldamento compreso.
Se un blocco nuovo porta il piano sopra il tetto, il tempo si recupera in questo
ordine e in nessun altro: transizioni → pausa di blocco → serie della finitura.
**Il recupero di giro e le serie dei tri-set di forza non si toccano:** tagliarli
cambia l'allenamento, non la fretta. Da verificare con un test sui dati.

## 6. Sostituzioni quando manca un attrezzo

`[IN CODICE]` Esistono solo le alternative scritte a mano in
`ProgramBlock.alternatives`: **5 blocchi su 48**, tutti e cinque nella finitura
metabolica (corda → jumping jack, swing → mountain climber o jumping jack).
Nei 43 blocchi di lavoro non c'è nessuna alternativa: il resto del programma
**non ha alternative**: chi non ha sbarra, TRX, anelli, manubri, kettlebell,
box o panca non ha nessuna via.

`[PROPOSTA]` Regola di sostituzione deterministica, possibile solo dopo il campo
`equipment` (EXERCISE_SCHEMA §2):

1. L'atleta dichiara la sua attrezzatura all'onboarding. Il dato è una lista di
   `Equipment`, modificabile dalle impostazioni.
2. Un blocco il cui esercizio richiede un attrezzo mancante viene sostituito con
   il **primo** candidato di una lista ordinata, scritta e approvata per quel
   blocco. La lista è un dato, non un calcolo: ogni candidato dichiara attrezzo,
   schema motorio e gradino equivalente.
3. Un candidato è ammesso solo se: stesso schema motorio **o** stessi
   `primaryMuscles`; `minLevel` ≤ livello dell'atleta; prerequisiti soddisfatti;
   attrezzatura disponibile.
4. Se nessun candidato è ammesso, il blocco **si salta** e la schermata lo dice:
   «Questo blocco chiede <attrezzo>. Senza, oggi non ho un sostituto che valga
   lo stesso: salta il blocco, non improvvisare.» L'app non inventa un
   esercizio e non sceglie un attrezzo che l'atleta non ha dichiarato.
5. Una sostituzione non cambia mai serie, range, RIR o recupero del blocco: se il
   candidato non regge quella prescrizione, non è un candidato.
6. Il volume settimanale si ricalcola dopo le sostituzioni e il risultato si
   mostra: se un gruppo muscolare scende sotto 16 serie, va detto, non nascosto.

## 7. Cosa non cambia mai

- Nessun esercizio fuori dal catalogo approvato.
- Nessuna immagine generata a runtime: solo `src/assets/`.
- Nessun numero di questo file nasce da un testo scritto dall'atleta.
