# BOUNDARIES.md — limiti di sicurezza

Versione **limiti 1.0 — PROPOSTA del 2026-11-08, non approvata.**

**Stato di partenza, verificato: l'app non ha nessuno di questi limiti.**
Ricerca su tutto `src/` delle parole *dolore, infortunio, medico,
fisioterapista, sintomo, gravidanza, minorenne, PAR-Q, disturbo, alimentazione,
deficit calorico*: zero occorrenze, tranne la parola «infortunio» dentro un cue
dello swing. Non c'è un campo per dire che qualcosa fa male, non c'è un rimando,
non c'è un'età, non c'è un questionario.

E la prima cosa che l'app chiede a una persona nuova è **nove serie a cedimento
tecnico** (`src/ui/screens/OnboardingScreen.tsx`, `src/data/tests.ts`:
trazioni, dip, push-up, rematore, pike push-up, bulgarian split squat, negative
di nordic curl, hollow hold, dead hang), perché il programma non si sblocca
finché il giro dei nove non è completo. Oggi va bene: l'utente è uno e lo sa.
Al secondo utente questo è il rischio principale dell'intero prodotto.
Proposta del 2026-11-12 (PROGRAM_RULES R4): si chiedono solo i **7** che il
circuito usa; fuori il nordic e il dead hang.

Ogni limite qui ha sei righe: **Regola · Dove · Innesco · L'app fa · L'atleta
legge · Verifica.** I testi in corsivo sono testi d'app proposti, da rivedere
con Alessio ma scritti per essere usati, non per essere riassunti.

---

## L1 — Questionario di idoneità, prima di tutto

**Regola.** Nessun test di massimale e nessuna prima seduta prima di un
questionario di idoneità compilato (modello PAR-Q+ o equivalente). Vale solo
dalla seconda persona registrata: per Alessio resta saltabile con una scelta
esplicita e registrata.
**Dove.** Nuovo primo passo di `src/ui/screens/OnboardingScreen.tsx`, prima
dello step `intro`. Esito salvato nelle impostazioni (`src/db/db.ts`,
`AppSettings`): `fitnessScreening: { date, version, answers, outcome }`.
**Innesco.** Primo avvio con nessun `programStartDate` e nessuno screening.
**L'app fa.** Sette domande chiuse, sì/no. Una sola risposta «sì» ⇒ esito
`da-verificare`: i test non si sbloccano, il programma non parte, l'app resta
consultabile (catalogo, immagini, cue) in sola lettura. Nessun esito è una
diagnosi e nessun esito viene interpretato: tre stati, `libero`,
`da-verificare`, `non-idoneo-per-ora`, e nient'altro.
**L'atleta legge.** *«Prima di cominciare ho bisogno di sapere sette cose. Non
sono un test e non c'è una risposta giusta: servono a capire se l'allenamento
che propongo è adatto a te adesso.»* In caso di «sì»: *«Una delle tue risposte
dice che prima di allenarti con carichi vicini al massimo è giusto parlarne con
un medico. Non posso valutarlo io e non voglio provarci. Il catalogo degli
esercizi resta a tua disposizione; il programma lo sblocchiamo quando hai un ok.»*
**Verifica.** Test: con screening assente, `OnboardingScreen` non espone nessuno
step `test`; con esito diverso da `libero`, `programStartDate` resta `null`.

## L2 — Dolore o sintomi durante la seduta

**Regola.** L'app non propone l'esercizio coinvolto, non dà nessuna indicazione
di riabilitazione, non cerca una causa, e rimanda a un medico o a un
fisioterapista.
**Dove.** Player della seduta: `src/ui/session/SessionScreen.tsx` e
`src/ui/session/GuidedSession.tsx`, un bottone sempre visibile accanto al
cronometro — vicino al pollice, leggibile con le mani sudate.
**Innesco.** Tocco sul bottone **«Mi fa male»**. Un gesto, non un campo di
testo: deve funzionare mentre si è sotto la sbarra.
**L'app fa.** 1) Ferma la serie e il cronometro. 2) Chiede una cosa sola, a
scelta chiusa: *dove* (spalla, gomito, polso, schiena, anca, ginocchio,
caviglia, altro) e *quando* (solo sotto sforzo / anche a riposo). 3) Registra un
evento `painEvent { date, exercise, site, atRest }`. 4) **Esclude l'esercizio**
dal programma: nessuna proposta, nessun verdetto, nessuna progressione su quello
slug finché l'atleta non lo riattiva a mano. 5) Non propone un sostituto se il
sostituto ha gli stessi `primaryMuscles` o tocca lo stesso sito; se non c'è un
candidato, il blocco si salta. 6) Se `atRest` è vero ⇒ L13.
**L'atleta legge.** *«Fermati qui. Non posso dirti cosa è, e nessuna app può:
non sono un medico e non ho visto niente. Quello che posso fare è togliere
questo esercizio dal programma, e l'ho fatto. Se il dolore torna, dura più di
qualche giorno o c'è anche a riposo, parlane con un medico o un fisioterapista
prima di rimetterci carico.»* Nessun esercizio «di scarico», nessuno
stretching, nessun ghiaccio, nessun «di solito è il tendine».
**Verifica.** Test: dopo un `painEvent`, quello slug non compare in nessun piano
di seduta, non riceve verdetti da `reviewWeek` e non riceve suggerimenti da
`evaluateProgression`. Nel nucleo di sicurezza di `release-gate`.

## L3 — Infortunio o zona dichiarata fuori uso

**Regola.** Un sito corporeo dichiarato dolente o infortunato esclude **tutti**
gli esercizi che lo coinvolgono, non solo quello in corso.
**Dove.** Dato: `contraindications` e `equipment` sulla scheda esercizio
(EXERCISE_SCHEMA §2) più un nuovo campo `sites: readonly BodySite[]`. Filtro: un
unico punto nel motore che costruisce il piano di seduta.
**Innesco.** `painEvent` attivo, oppure zona dichiarata fuori uso dalle
impostazioni.
**L'app fa.** Filtra il catalogo. Mostra quanti blocchi sono stati tolti e cosa
resta. Se la seduta scende sotto due blocchi di lavoro, propone di non farla.
Non propone esercizi «per riabilitare» la zona: non è il mestiere dell'app.
**L'atleta legge.** *«Ginocchio fuori uso: ho tolto 4 blocchi su 12. Quello che
resta si può fare. Non ti propongo esercizi per il ginocchio: quelli li decide
chi te lo ha guardato.»*
**Verifica.** Test sui dati: per ogni sito, l'insieme degli esercizi filtrati è
non vuoto e stabile; nessun esercizio con quel sito nei `sites` sopravvive al
filtro.

## L4 — Condizioni mediche

**Regola.** Nessun consiglio specifico per nessuna condizione. Rimando a un
professionista. Nessun adattamento del programma «per» una condizione.
**Dove.** Esito del questionario L1; schermata delle impostazioni per
aggiornarlo.
**Innesco.** Dichiarazione di condizione cardiaca, pressione, gravidanza,
post-operatorio, patologia cronica, oppure uso di farmaci che cambiano la
risposta allo sforzo.
**L'app fa.** Esito `non-idoneo-per-ora`: il programma non si genera. L'app
**non** riduce il carico, non allunga i recuperi, non propone una versione
«leggera»: un programma adattato a una condizione medica è un atto clinico.
**L'atleta legge.** *«Quello che mi hai detto cambia come il tuo corpo risponde
all'allenamento, in modi che io non so valutare. Non ti propongo un programma
più leggero, perché non saprei quanto più leggero. Parlane con il tuo medico o
con un fisioterapista: se ti dà un'indicazione, torna e vediamo cosa di questo
metodo ci sta dentro.»*
**Verifica.** Test: con esito `non-idoneo-per-ora` nessuna seduta è generabile e
nessun verdetto è prodotto.

## L5 — Mai diagnosi, mai farmaci, integratori senza dosi

**Regola.** L'app non nomina una causa, una patologia o un farmaco. Sugli
integratori dice solo che non se ne occupa. Mai una dose, mai un nome
commerciale, mai un timing.
**Dove.** Tutti i testi: catalogo, cue, consigli, banner, schermate di aiuto.
**Verifica.** Ricerca testuale a ogni rilascio su `src/` per una lista di
termini vietati (tendinite, infiammazione, ernia, contrattura, cortisone,
antinfiammatorio, creatina, proteine in polvere, mg, grammi al giorno…). Nel
nucleo di sicurezza di `release-gate`.

## L6 — Niente alimentazione, niente deficit calorico

**Regola.** L'app si occupa di allenamento. Nessun piano alimentare, nessun
conteggio, nessun fabbisogno, nessun deficit, nessun «peso obiettivo», nessun BMI.
**Dove.** `src/ui/screens/MeasuresScreen.tsx` — che oggi è già scritta così e va
protetta: «qui non c'è nessun obiettivo di peso e nessuna azione suggerita».
**L'app fa.** Peso e vita restano misure, mostrate con media mobile e delta,
senza colori di merito, senza frecce di giudizio, senza soglie.
**L'atleta legge**, se chiede di cibo: *«L'alimentazione non è il mio mestiere e
non voglio darti numeri che non sono in grado di calcolare. Un dietista o un
medico nutrizionista può farlo guardando te, non una media.»*
**Verifica.** Nessuna stringa con «calorie», «kcal», «dieta», «deficit»,
«peso ideale», «BMI» in `src/`. Nessun campo obiettivo di peso nel database.

## L7 — Segnali di rapporto problematico con cibo, peso o corpo

**Regola.** Quando ci sono segnali, l'app **smette** di dare consigli su quel
tema, risponde con rispetto e indica risorse di supporto adeguate. Non diagnostica
nulla, non nomina nessun disturbo, non chiede spiegazioni.
**Dove.** `MeasuresScreen` e `ProgressScreen`.
**Innesco** — tutti deterministici, su numeri già registrati:
1. perdita di peso ≥ **5%** della media mobile a 7 giorni in **28 giorni**;
2. ≥ **14** pesate in 14 giorni (più di una al giorno in media);
3. ≥ **3** misure di vita in 7 giorni;
4. richiesta di cancellare e reinserire il peso più di 3 volte in una settimana.
**L'app fa.** Nasconde delta e grafici di tendenza su peso e vita (i dati
restano, visibili a richiesta). Smette di mostrare qualunque confronto. Mostra
una scheda di supporto, una volta, non ripetuta, non richiudibile con un
«ho capito» che la cancella per sempre: resta raggiungibile dalle impostazioni.
**L'atleta legge.** *«Ho notato che stai pesandoti molto spesso. Non so perché e
non te lo chiedo. So solo che questa app non è il posto giusto per rispondere a
quella domanda, e che misurarsi più volte al giorno non dà informazioni in più:
dà rumore. Se il pensiero del peso o del corpo occupa più spazio di quanto
vorresti, parlarne con qualcuno che se ne intende è la cosa più utile che puoi
fare. Qui intanto continuiamo con l'allenamento, che è quello che so fare.»*
**Risorse.** La lista va **verificata e datata da Alessio prima dell'uso
pubblico**, con numeri e indirizzi reali del paese dell'utente. Non ne scrivo
nessuno qui: un numero inventato o scaduto in una schermata come questa fa più
danno del silenzio. È la decisione D-6 di DECISIONS.md.
**Verifica.** Test: con ognuno dei quattro inneschi, i delta sono nascosti e la
scheda compare una volta sola.

## L8 — Mai fuori livello, mai fuori attrezzatura

**Regola.** Nessun esercizio sopra il livello dell'atleta, nessun esercizio che
richieda un attrezzo non dichiarato, nessun gradino i cui prerequisiti non siano
soddisfatti. Nessuna progressione oltre le soglie di PROGRESSION_RULES.
**Dove.** Un solo punto di filtro, nel motore che costruisce il piano, e un solo
punto che applica una leva (`applyLever`, `WeeklyVerdict.stateAfter`).
**Innesco.** Ogni costruzione di seduta e ogni accettazione di consiglio.
**Stato oggi.** Non esprimibile: mancano `equipment`, `minLevel`,
`prerequisites` e il livello dell'atleta. È il motivo per cui EXERCISE_SCHEMA §2
è un prerequisito di sicurezza e non un abbellimento del catalogo.
**L'atleta legge**, quando un esercizio è fuori portata: *«Questo gradino chiede
<prerequisito>. Non te lo propongo ancora — non per prudenza generica: salta un
passaggio che serve a farlo senza farsi male. Intanto lavoriamo su <gradino
attuale>.»*
**Verifica.** Test: per ogni combinazione di livello e attrezzatura, nessun piano
contiene esercizi fuori perimetro. Nel nucleo di sicurezza.

## L9 — Tetti di progressione (= S1-S6, approvate il 2026-11-12) — limiti 1.4 (proposta)

**Regola.** (S1) Un gradino **eseguibile** per esercizio ogni **2 settimane**:
14 giorni dalla prima seduta chiusa al gradino attuale, uno alla volta (R7).
(S2) Mai più di +2,5 kg per esercizio a settimana. (S3) Nessun aumento senza
`tempoRespected === true` su tutte le sedute considerate (R5). (S4) Verdetto
solo su ≥ 2 sedute e ≥ 3 serie vere: le ultime 2, stesso stato, nei 14 giorni
(R8, D-16). (S5) Zavorra solo a variante esaurita e mai sotto 8 trazioni o 10
dip misurati (R6). (S6) Dopo **≥ 14 giorni** senza sedute chiuse: 4 sedute (≥ 7
giorni) a giri dimezzati, nessun aumento, ritest proposto (R9). Si scende sempre.
Dettaglio: PROGRESSION_RULES §9, PROGRESS_REVIEW §6, PROGRAM_RULES §8.
S2 su 7 giorni mobili (R13); D-4 (a) decisa: un aumento di qualunque leva ogni 7
giorni. Proposta 1.4 (2026-11-18): l'aumento conta dal giorno in cui si esegue (R15).
**Stato oggi** (`fe85203`): S1-S5 in codice, S2 su 7 giorni; S6 no (R9).
**Verifica.** Nucleo, caso 4: 4a-4c con **due sedute nei 14 giorni** e le altre
barriere aperte (rapporto 2026-11-15), 4d con controlli positivi, più un
caso di rientro (tabella 9.x). Test di proprietà: nessuna sequenza di decisioni
accettate produce due prime sedute a gradini successivi a meno di 14 giorni.

## L10 — Mai promettere risultati

**Regola.** Nessun chilo, nessun centimetro, nessun tempo, nessuna proiezione,
nessun «in sei settimane». L'app dice cosa fare e cosa è stato fatto.
**Dove.** Tutti i testi, i consigli e i grafici. Nessuna estrapolazione nei
grafici (PROGRESS_REVIEW §5.2).
**Verifica.** Ricerca testuale a ogni rilascio: «perderai», «in X settimane»,
«garantito», «risultati», «trasformazione». Già nella lista di
`compliance/PENDING.md`.

## L11 — Minorenni

**Regola.** Finché Alessio non decide altrimenti, l'app **non è destinata a chi
ha meno di 18 anni**. Va detto e va impedito, non solo scritto nei termini.
**Dove.** Questionario L1, prima domanda; termini di servizio.
**L'app fa.** Dichiarazione di età sotto i 18 ⇒ il programma non si genera.
Nessun programma «per adolescenti» improvvisato: cambierebbe il metodo
(carichi, scale, zavorra, test a cedimento) e servirebbe il consenso di chi
esercita l'autorità parentale.
**L'atleta legge.** *«Questa app è pensata per adulti e il suo metodo è tarato
su un corpo che ha finito di crescere. Non è un giudizio sulle tue capacità: è
che non l'ho costruita per te, e improvvisare su questo non mi sembra giusto.»*
**Verifica.** Test: età < 18 ⇒ nessuna seduta generabile.

## L12 — Testo scritto dall'atleta

**Regola.** Note, etichette di variante e messaggi sono **input non affidabili**.
Nessun testo scritto dall'atleta può cambiare un numero prescritto, oggi né dopo.
Il testo si mostra in modo sicuro e non si interpreta mai.
**Stato oggi: la proprietà è rispettata.** Verificato: `note` (serie, esercizio,
seduta) e `variantLabel` non sono letti da `progression.ts`, `review.ts`,
`loading.ts`, `metrics.ts`. I numeri vengono solo da campi numerici.
`variantLabel` è generato da `variantLabelFor` a partire dal gradino.
**Da mantenere, con tre controlli.**
1. Test di non-regressione: nessun import o lettura di `note` / `variantLabel`
   nei file del motore. Un test che fallisce se qualcuno lo aggiunge.
2. Il link al video personale (`ExerciseMedia.videoUrl`) è l'unico testo
   dell'atleta che finisce in un `href`: è già filtrato a `http`/`https` in
   `repository.setExerciseVideo` e in `backup.ts`. Il filtro resta e si testa:
   `javascript:` in un `href` è codice, non un link.
3. Il testo si rende come testo. Nessun `dangerouslySetInnerHTML`, nessun markdown
   interpretato, nessuna nota riletta come istruzione.
**Verifica.** Nel nucleo di sicurezza di `release-gate`, a ogni rilascio.

## L13 — Sintomi da fermarsi subito

**Regola.** Davanti a dolore al petto, fiato corto a riposo, svenimento o
pre-svenimento, vertigini intense, formicolio o perdita di forza a un lato,
dolore articolare acuto con gonfiore o impossibilità di caricare, l'app **non
propone niente**: ferma la seduta e indica di cercare assistenza subito.
**Dove.** Esito `atRest` di L2, e una voce sempre raggiungibile dal player.
**L'app fa.** Chiude la seduta, non chiede altro, non registra sintomi oltre
l'evento, non propone verdetti su quella seduta.
**L'atleta legge.** *«Smetti adesso e chiedi aiuto: questi sintomi non si
aspettano. Se sei solo, chiama il numero di emergenza del posto dove sei.»*
Il numero mostrato dipende dal paese dichiarato: nessun numero cablato per una
lingua sola (decisione D-7).
**Verifica.** Test: con l'innesco attivo, nessun piano e nessun verdetto.

## L14 — Sequenza dentro la seduta (= S9 di training-quality)

**Regola.** Nessuna stazione balistica carica (swing, slam, clean) parte
immediatamente dopo una stazione di stabilizzazione del tronco prescritta a
RIR 0-1, `—` o portata a cedimento: in mezzo c'è almeno una transizione
dichiarata di **15"**. Stato: **PROPOSTA 2026-11-12**, da approvare.
**Dove.** `src/data/circuit.ts` (dato), `buildGuidedPlan` (passo `rest`).
**Oggi.** Violata in tutte e quattro le sedute alla giunzione B → F (A8). R2
la soddisfa senza cambiare esercizi né ordine.
**Verifica.** Test sui dati: in ogni piano guidato, tra l'ultimo passo `work`
del gruppo B e il primo del gruppo F c'è un passo di 15". Nel nucleo di
sicurezza se Alessio approva (9 casi).

---

## Cosa l'app non fa, in nessun caso

Non diagnostica. Non nomina patologie né farmaci. Non dà dosi. Non prescrive
alimentazione. Non fa riabilitazione. Non promette risultati. Non confronta
l'atleta con altre persone. Non propone esercizi fuori catalogo. Non genera
immagini. Non cambia un numero perché l'atleta l'ha chiesto a parole.

## Priorità per l'uso pubblico

Bloccanti prima del secondo utente: **L1, L2, L13, L11, L12**.
Subito dopo: **L8** (richiede EXERCISE_SCHEMA §2), **L7**, **L14**.
**L9 blocca già oggi**, con un solo utente (decisione di Alessio, 2026-11-12).
Già in parte rispettati e da proteggere con un test: **L6, L10, L12**.
Il contorno legale — informativa, consenso sui dati sanitari, termini,
cancellazione — è in `compliance/PENDING.md` e non è mio.
