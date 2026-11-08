import type { Exercise, ExerciseSlug } from '../types/index.ts';

/**
 * Anagrafica degli esercizi citati dal programma e dai test.
 *
 * Regole di trascrizione usate qui, valide per tutto il file:
 *
 * 1. Quando la scheda scrive "X o Y" (es. "Dip tra due panche o diamond
 *    push-up"), l'esercizio è mappato al livello della PRIMA variante citata,
 *    che è la prescrizione principale. La seconda è l'alternativa d'emergenza.
 * 2. `loadPolicy: 'allowed'` è concessa solo sulla whitelist esplicita del
 *    metodo: trazioni, chin-up, dip, push-up, split squat, step-up. Su tutto il
 *    resto il campo zavorra non esiste.
 * 3. `videoQuery` è una stringa di ricerca in inglese. Non esistono URL di
 *    video nel codebase: l'app compone la ricerca a runtime.
 */
const EXERCISE_LIST = [
  /* ---------------------------------------------------------------------- */
  /* Trazione verticale                                                      */
  /* ---------------------------------------------------------------------- */
  {
    slug: 'trazioni-prona-presa-media',
    name: 'Trazioni prona presa media',
    pattern: 'vertical-pull',
    defaultLevel: 3,
    primaryMuscles: ['dorsali'],
    secondaryMuscles: ['braccia'],
    measurement: 'reps',
    loadPolicy: 'allowed',
    cues: [
      'Presa prona poco più larga delle spalle, pollice che avvolge la sbarra.',
      'Parti a braccia distese ma con le scapole già attive: deprimi e retrai prima di piegare i gomiti.',
      'Tira portando i gomiti verso le tasche, petto verso la sbarra, gambe ferme davanti a te.',
      'Errore tipico: strappo di bacino in partenza e collo teso in avanti in chiusura.',
      'Ripetizione valida: mento sopra la sbarra senza estendere il collo, ritorno a gomiti completamente distesi.',
    ],
    videoQuery: 'pull up proper form tutorial',
  },
  {
    slug: 'trazioni-presa-larga',
    name: 'Trazioni presa larga',
    pattern: 'vertical-pull',
    defaultLevel: 3,
    primaryMuscles: ['dorsali'],
    secondaryMuscles: ['braccia'],
    measurement: 'reps',
    loadPolicy: 'allowed',
    cues: [
      'Presa prona nettamente più larga delle spalle, circa una mano e mezza in più per lato.',
      'I gomiti scendono lungo il piano frontale, non indietro: il movimento è più laterale della presa media.',
      'Petto alto e sguardo neutro, porta lo sterno verso la sbarra.',
      'Errore tipico: accorciare il range fermandosi a metà perché la presa larga è più dura.',
      'Ripetizione valida: mento sopra la sbarra, discesa controllata fino a braccia distese.',
    ],
    videoQuery: 'wide grip pull up proper form tutorial',
  },
  {
    slug: 'chin-up-presa-supina-stretta',
    name: 'Chin-up presa supina stretta',
    pattern: 'vertical-pull',
    defaultLevel: 3,
    primaryMuscles: ['braccia'],
    secondaryMuscles: ['dorsali'],
    measurement: 'reps',
    loadPolicy: 'allowed',
    cues: [
      'Presa supina, mani a larghezza spalle o poco meno.',
      'Gomiti stretti al busto: li porti verso il basso restando sotto le mani.',
      'Il bicipite lavora solo se non ondeggi: gambe leggermente avanti e core contratto.',
      'Errore tipico: aprire i gomiti verso l’esterno, che riduce il chin-up a una trazione qualsiasi.',
      'Ripetizione valida: mento sopra la sbarra, discesa fino a distensione completa senza rimbalzo.',
    ],
    videoQuery: 'close grip chin up proper form tutorial',
  },
  {
    slug: 'chin-up-presa-supina',
    name: 'Chin-up presa supina',
    pattern: 'vertical-pull',
    defaultLevel: 3,
    primaryMuscles: ['braccia'],
    secondaryMuscles: ['dorsali'],
    measurement: 'reps',
    loadPolicy: 'allowed',
    cues: [
      'Presa supina a larghezza spalle, polsi neutri e non iperestesi.',
      'Scapole depresse prima di tirare: la spalla non deve salire verso l’orecchio.',
      'Porta i gomiti verso il basso e leggermente indietro, petto verso la sbarra.',
      'Errore tipico: usare lo slancio delle gambe quando la serie si fa dura.',
      'Ripetizione valida: mento sopra la sbarra, ritorno a gomiti distesi con controllo.',
    ],
    videoQuery: 'chin up proper form tutorial',
  },
  {
    slug: 'dead-hang',
    name: 'Dead hang',
    pattern: 'hang',
    defaultLevel: 2,
    primaryMuscles: [],
    secondaryMuscles: ['braccia', 'dorsali'],
    measurement: 'seconds',
    loadPolicy: 'forbidden',
    cues: [
      'Presa prona a larghezza spalle, pollice chiuso attorno alla sbarra.',
      'Spalle non completamente passive: mantieni una minima attivazione scapolare, senza tirare.',
      'Respira lentamente dal naso; la presa cede prima se trattieni il fiato.',
      'Errore tipico: dondolare per guadagnare secondi, che falsa la misura.',
      'Misura valida: il tempo si ferma quando le dita si aprono, non quando fa male.',
    ],
    videoQuery: 'dead hang grip endurance tutorial',
  },

  /* ---------------------------------------------------------------------- */
  /* Trazione orizzontale                                                    */
  /* ---------------------------------------------------------------------- */
  {
    slug: 'rematore-inverso-trx',
    name: 'Rematore inverso TRX',
    pattern: 'horizontal-pull',
    defaultLevel: 2,
    primaryMuscles: ['dorsali'],
    secondaryMuscles: ['braccia'],
    measurement: 'reps',
    loadPolicy: 'forbidden',
    cues: [
      'Maniglie a larghezza spalle, corpo teso in linea dalle caviglie alla testa.',
      'L’inclinazione decide la difficoltà: più orizzontale sei, più è dura.',
      'Tira portando i gomiti indietro lungo il busto e avvicinando le scapole.',
      'Errore tipico: bacino che cede verso il basso, che scarica il lavoro sulle braccia.',
      'Ripetizione valida: maniglie all’altezza delle costole basse, ritorno a braccia distese senza perdere la linea.',
    ],
    videoQuery: 'trx inverted row proper form tutorial',
  },
  {
    slug: 'rematore-inverso-trx-piedi-rialzati',
    name: 'Rematore inverso TRX piedi rialzati',
    pattern: 'horizontal-pull',
    defaultLevel: 4,
    primaryMuscles: ['dorsali'],
    secondaryMuscles: ['braccia'],
    measurement: 'reps',
    loadPolicy: 'forbidden',
    cues: [
      'Piedi su un rialzo all’altezza delle anche o più: il corpo resta orizzontale.',
      'Glutei contratti e costole basse per tutta la serie, niente bacino che affonda.',
      'Pausa di 1" con le maniglie alle costole, scapole strette.',
      'Errore tipico: scrollare le spalle verso le orecchie invece di retrarre le scapole.',
      'Ripetizione valida: pausa in chiusura rispettata, discesa controllata fino a braccia distese.',
    ],
    videoQuery: 'feet elevated inverted row proper form tutorial',
  },
  {
    slug: 'rematore-trx-monobraccio',
    name: 'Rematore TRX monobraccio',
    pattern: 'horizontal-pull',
    defaultLevel: 5,
    primaryMuscles: ['dorsali'],
    secondaryMuscles: ['braccia', 'core'],
    measurement: 'reps',
    loadPolicy: 'forbidden',
    cues: [
      'Una maniglia sola, piedi leggermente più larghi per stabilizzare.',
      'Il busto non deve ruotare: la spalla libera resta alla stessa altezza dell’altra.',
      'Tira il gomito indietro lungo il fianco, non verso l’esterno.',
      'Errore tipico: aprire il busto verso il lato che tira, trasformando l’esercizio in una torsione.',
      'Ripetizione valida: spalle parallele al pavimento dall’inizio alla fine, braccio disteso a ogni ritorno.',
    ],
    videoQuery: 'single arm trx row proper form tutorial',
  },

  /* ---------------------------------------------------------------------- */
  /* Spinta orizzontale                                                      */
  /* ---------------------------------------------------------------------- */
  {
    slug: 'push-up',
    name: 'Piegamenti (push-up)',
    pattern: 'horizontal-push',
    defaultLevel: 2,
    primaryMuscles: ['petto'],
    secondaryMuscles: ['braccia', 'spalle'],
    measurement: 'reps',
    loadPolicy: 'allowed',
    cues: [
      'Mani sotto le spalle o poco più larghe, dita aperte, avambracci verticali visti di lato.',
      'Corpo in linea da caviglie a testa: glutei contratti e costole basse.',
      'Gomiti a circa 45° dal busto, non aperti a 90°.',
      'Errore tipico: la testa arriva a terra prima del petto, segno che il bacino è rimasto indietro.',
      'Ripetizione valida: petto a un pugno da terra, distensione completa in alto senza perdere la linea.',
    ],
    videoQuery: 'push up proper form tutorial',
  },
  {
    slug: 'pushup-archer-o-pseudo-planche',
    name: 'Push-up archer',
    pattern: 'horizontal-push',
    defaultLevel: 5,
    primaryMuscles: ['petto'],
    secondaryMuscles: ['braccia', 'spalle'],
    measurement: 'reps',
    loadPolicy: 'allowed',
    cues: [
      'Mani molto larghe: scendi su un braccio mentre l’altro si distende lateralmente.',
      'La linea del corpo non cambia mai: bacino chiuso, glutei contratti.',
      'Il braccio disteso accompagna, non spinge: il lavoro sta tutto sul lato che si piega.',
      'Errore tipico: ruotare il busto per rubare centimetri al braccio che lavora.',
      'Ripetizione valida: petto vicino a terra sul lato che lavora, risalita senza torsione.',
    ],
    videoQuery: 'archer push up pseudo planche push up tutorial',
  },
  /*
   * Croci e push-up a presa larga sono due esercizi, non due nomi.
   *
   * La scheda li scrive su una riga sola. Le croci si fanno con un peso in
   * mano — l'utente è passato dall'elastico ai manubri perché l'elastico era
   * troppo leggero — e il peso va scritto; il push-up è a corpo libero. Tenerli
   * uniti costringeva a una sola politica di carico per entrambi, e vinceva
   * «niente carico»: chi usava i manubri non aveva dove scriverli.
   */
  {
    slug: 'croci-elastico-o-pushup-presa-larga',
    name: 'Croci con manubri',
    pattern: null,
    defaultLevel: null,
    primaryMuscles: ['petto'],
    secondaryMuscles: [],
    measurement: 'reps',
    loadPolicy: 'inherent',
    cues: [
      'Manubri leggeri, gomiti semiflessi con angolo fisso per tutta la ripetizione.',
      'Da in piedi o su panca inclinata: chiudi portando le mani davanti allo sterno, non sopra la testa.',
      'Errore tipico: piegare ed estendere i gomiti, che trasforma le croci in una distensione.',
      'Ripetizione valida: angolo del gomito costante, allungamento percepito sul petto e non sulla spalla.',
    ],
    videoQuery: 'dumbbell chest fly proper form tutorial',
  },
  {
    slug: 'pike-pushup-piedi-rialzati',
    name: 'Pike push-up piedi rialzati',
    pattern: 'vertical-push',
    defaultLevel: 2,
    primaryMuscles: ['spalle'],
    secondaryMuscles: ['braccia'],
    measurement: 'reps',
    loadPolicy: 'forbidden',
    cues: [
      'Piedi su un rialzo, bacino alto, corpo a V rovesciata, sguardo verso i piedi.',
      'Più il bacino è sopra le spalle, più il carico va sui deltoidi anziché sul petto.',
      'Scendi portando la testa davanti alle mani, non tra le mani.',
      'Errore tipico: perdere l’angolo di anca durante la serie, che riporta il lavoro sul petto.',
      'Ripetizione valida: testa che sfiora il pavimento davanti alle mani, distensione completa in alto.',
    ],
    videoQuery: 'feet elevated pike push up proper form tutorial',
  },
  {
    slug: 'negative-hspu-muro-o-pike-pushup',
    name: 'Negative di HSPU al muro (5")',
    pattern: 'vertical-push',
    defaultLevel: 3,
    primaryMuscles: ['spalle'],
    secondaryMuscles: ['braccia'],
    measurement: 'reps',
    loadPolicy: 'forbidden',
    cues: [
      'Verticale al muro, mani a poco più di larghezza spalle, pancia verso il muro se riesci.',
      'Scendi contando 5" pieni, gomiti a 45° e non aperti a croce.',
      'Testa che arriva a terra leggermente davanti alle mani, formando un triangolo.',
      'Errore tipico: crollare gli ultimi 10 cm — se non controlli la discesa, riduci il range o passa al pike push-up.',
      'Ripetizione valida: 5" di eccentrica cronometrati, uscita senza spinta di schiena.',
    ],
    videoQuery: 'wall handstand push up negative tutorial',
  },

  /* ---------------------------------------------------------------------- */
  /* Dip                                                                     */
  /* ---------------------------------------------------------------------- */
  {
    slug: 'dip-parallele-anelli',
    name: 'Dip alle parallele',
    pattern: 'dip',
    defaultLevel: 3,
    primaryMuscles: ['petto'],
    secondaryMuscles: ['braccia', 'spalle'],
    measurement: 'reps',
    loadPolicy: 'allowed',
    cues: [
      'Parallele a larghezza spalle, presa salda, braccia distese in partenza.',
      'Spalle basse e lontane dalle orecchie per tutta la serie, sterno leggermente inclinato in avanti.',
      'Scendi finché la spalla è appena sotto il gomito, senza cercare profondità extra.',
      'Errore tipico: spalle che salgono verso le orecchie nel punto basso.',
      'Ripetizione valida: circa 90° al gomito in basso, distensione completa in alto senza scrollata.',
    ],
    videoQuery: 'parallel bar dip proper form tutorial',
  },
  {
    /*
     * La scheda scrive «Dip tra due panche o diamond push-up». Qui l'ordine è
     * invertito, e non è un refuso: è una scelta dell'utente, dichiarata in
     * DEVIAZIONI.
     *
     * Il motivo. Questo blocco arriva terzo, a RIR 0-1, dopo quattro serie di
     * dip alle parallele e tre di pike push-up. Il dip su panca porta la
     * spalla in estensione e rotazione interna profonda, che è la posizione
     * con meno spazio nell'articolazione, e ce la porta stanca. Il diamond
     * push-up allena gli stessi tricipiti nelle stesse ripetizioni senza
     * mettere la spalla lì. Il dip su panca resta scegliibile nel blocco,
     * come esercizio suo con i suoi cue e il suo storico.
     */
    slug: 'dip-panche-o-diamond-pushup',
    name: 'Diamond push-up',
    /*
     * Fuori dalla scala dei dip, dove stava prima.
     *
     * La scala dei dip ha «Dip tra due panche» al gradino 1: è il dip su
     * panca, non il diamond push-up, che è un push-up a presa stretta e non
     * un dip. Tenerlo lì voleva dire che salendo di livello gli si proponeva
     * di passare ai dip negativi alle parallele, cioè di cambiare esercizio.
     * Qui la progressione è la stessa del push-up: tempo, pause e zavorra.
     */
    pattern: null,
    defaultLevel: null,
    primaryMuscles: ['braccia'],
    secondaryMuscles: ['petto'],
    measurement: 'reps',
    loadPolicy: 'allowed',
    cues: [
      'Mani sotto lo sterno, indici e pollici che si toccano a formare un rombo.',
      'Gomiti stretti che scorrono lungo il busto, mai aperti di lato.',
      'Scendi fino a sfiorare le mani con lo sterno, corpo in linea dai talloni alla testa.',
      'Errore tipico: bacino che cede o che si alza per accorciare il movimento.',
      'Ripetizione valida: sterno sulle mani in basso, braccia distese in alto, nessun cedimento della lombare.',
    ],
    videoQuery: 'diamond push up proper form tutorial',
  },
  {
    /*
     * Diviso dal diamond push-up, con cui la scheda condivideva una riga.
     *
     * Questo è il dip vero: gradino 1 della scala dei dip, mentre il diamond
     * push-up non sta in nessuna scala. Uniti, salire di livello dal «dip tra
     * due panche o diamond push-up» voleva dire passare ai dip negativi alle
     * parallele anche a chi stava facendo push-up.
     */
    slug: 'dip-panche',
    name: 'Dip tra due panche',
    pattern: 'dip',
    defaultLevel: 1,
    primaryMuscles: ['braccia'],
    secondaryMuscles: ['petto', 'spalle'],
    measurement: 'reps',
    loadPolicy: 'allowed',
    cues: [
      'Mani sul bordo della panca dietro di te, dita in avanti, bacino vicino alla panca.',
      'I gomiti scorrono indietro paralleli, mai verso l’esterno.',
      'Scendi fino a gomiti a 90° e non oltre: più giù la spalla non ha spazio.',
      'Errore tipico: allontanare il bacino dalla panca, che sposta il carico sulla capsula della spalla.',
      'Ripetizione valida: 90° al gomito in basso, braccia distese in alto, busto verticale.',
    ],
    videoQuery: 'bench dips proper form tutorial',
  },
  {
    slug: 'dip-panche-piedi-rialzati',
    name: 'Dip tra panche piedi rialzati',
    pattern: 'dip',
    defaultLevel: 1,
    primaryMuscles: ['braccia'],
    secondaryMuscles: ['petto'],
    measurement: 'reps',
    loadPolicy: 'allowed',
    cues: [
      'Mani sulla panca dietro, talloni su una seconda panca alla stessa altezza.',
      'Più i piedi sono lontani e alti, più carico ricevono le braccia.',
      'Gomiti indietro e paralleli, discesa fino a 90°.',
      'Errore tipico: spingere con i talloni sulla panca per aiutarsi nella risalita.',
      'Ripetizione valida: 90° al gomito in basso, gambe passive, distensione completa in alto.',
    ],
    videoQuery: 'feet elevated bench dip proper form tutorial',
  },

  /* ---------------------------------------------------------------------- */
  /* Squat monopodalico e quadricipiti                                       */
  /* ---------------------------------------------------------------------- */
  {
    slug: 'bulgarian-split-squat',
    name: 'Bulgarian split squat',
    pattern: 'single-leg-squat',
    defaultLevel: 2,
    primaryMuscles: ['quadricipiti'],
    secondaryMuscles: ['femorali-glutei'],
    measurement: 'reps',
    loadPolicy: 'allowed',
    cues: [
      'Piede posteriore sulla panca, distanza tale che il ginocchio davanti resti sopra la caviglia in basso.',
      'Busto leggermente inclinato in avanti se cerchi il gluteo, verticale se cerchi il quadricipite.',
      'Scendi finché la coscia davanti è parallela a terra, ginocchio dietro vicino al pavimento.',
      'Errore tipico: spingere con il piede posteriore invece che con quello davanti.',
      'Ripetizione valida: coscia anteriore parallela, risalita senza appoggiare il ginocchio posteriore a terra.',
    ],
    videoQuery: 'bulgarian split squat proper form tutorial',
  },
  {
    slug: 'step-up-box-alto',
    name: 'Step-up su box alto (altezza ginocchio+)',
    pattern: 'step-up',
    defaultLevel: 3,
    primaryMuscles: ['quadricipiti'],
    secondaryMuscles: ['femorali-glutei'],
    measurement: 'reps',
    loadPolicy: 'allowed',
    cues: [
      'Box all’altezza del ginocchio o poco più, piede interamente appoggiato.',
      'Sali spingendo solo con la gamba sopra: la gamba a terra non dà slancio.',
      'Scendi controllando, sfiorando il pavimento senza scaricarci il peso.',
      'Errore tipico: rimbalzare con il piede a terra tra una ripetizione e l’altra.',
      'Ripetizione valida: anca completamente estesa in alto, discesa di almeno 2" senza rimbalzo.',
    ],
    videoQuery: 'high box step up proper form tutorial',
  },
  /*
   * Sissy squat e wall sit sono due esercizi, non due nomi dello stesso.
   *
   * La scheda li scrive su una riga sola, «Sissy squat o wall sit isometrico
   * 45"», e finché sono stati un esercizio solo l'app ha dovuto sceglierne
   * una misura per entrambi: ripetizioni. Il wall sit però si misura in
   * secondi, quindi chi lo faceva non aveva dove scriverlo. Separati hanno
   * ognuno la propria misura, il proprio range e il proprio storico; la
   * scelta tra i due resta, ma la fa il blocco C2 del Lower A.
   */
  {
    slug: 'sissy-squat',
    name: 'Sissy squat',
    pattern: 'sissy-squat',
    defaultLevel: 3,
    primaryMuscles: ['quadricipiti'],
    secondaryMuscles: [],
    measurement: 'reps',
    loadPolicy: 'forbidden',
    cues: [
      'Ginocchia che avanzano, bacino e spalle su una sola linea inclinata all’indietro.',
      'Appoggiati con una mano a un supporto finché il controllo non è completo.',
      'Scendi finché senti i quadricipiti sotto tensione piena, senza cedere di schiena.',
      'Errore tipico: piegare l’anca, che lo trasforma in uno squat normale.',
      'Ripetizione valida: linea ginocchia-anca-spalla mantenuta, nessuna flessione d’anca.',
    ],
    videoQuery: 'sissy squat proper form tutorial',
  },
  {
    slug: 'wall-sit',
    name: 'Wall sit isometrico',
    pattern: 'wall-sit',
    defaultLevel: 2,
    primaryMuscles: ['quadricipiti'],
    secondaryMuscles: [],
    measurement: 'seconds',
    loadPolicy: 'forbidden',
    cues: [
      'Schiena piatta contro il muro, ginocchia e anche a 90°, piedi a larghezza bacino.',
      'Peso sui talloni, ginocchia sopra le caviglie e non oltre le punte.',
      'Respira normalmente: trattenere il fiato alza la pressione senza aggiungere niente.',
      'Errore tipico: scivolare in basso lungo il muro per alleggerire le cosce.',
      'Serie valida: il tempo pieno senza scivolare e senza appoggiare le mani sulle cosce.',
    ],
    videoQuery: 'wall sit proper form tutorial',
  },
  {
    slug: 'shrimp-squat-o-skater-squat',
    name: 'Shrimp squat',
    pattern: 'single-leg-squat',
    defaultLevel: 5,
    primaryMuscles: ['quadricipiti'],
    secondaryMuscles: ['femorali-glutei'],
    measurement: 'reps',
    loadPolicy: 'forbidden',
    cues: [
      'Gamba libera piegata dietro, ginocchio che scende verso il tallone del piede d’appoggio.',
      'Busto il più verticale possibile, braccia avanti come contrappeso.',
      'Scendi finché il ginocchio dietro sfiora il pavimento, senza appoggiarci il peso.',
      'Errore tipico: inclinare troppo il busto in avanti, che è uno stacco monopodalico mascherato.',
      'Ripetizione valida: ginocchio posteriore che tocca il pavimento in controllo, risalita senza caduta laterale.',
    ],
    videoQuery: 'shrimp squat skater squat progression tutorial',
  },

  /* ---------------------------------------------------------------------- */
  /* Catena posteriore                                                       */
  /* ---------------------------------------------------------------------- */
  {
    slug: 'nordic-curl',
    name: 'Nordic curl',
    pattern: 'posterior-chain',
    defaultLevel: 3,
    primaryMuscles: ['femorali-glutei'],
    secondaryMuscles: [],
    measurement: 'reps',
    loadPolicy: 'forbidden',
    cues: [
      'Caviglie bloccate saldamente, ginocchia su un supporto morbido, anche estese.',
      'Il corpo scende in blocco: linea ginocchia-anca-spalla rigida, niente flessione d’anca.',
      'Frena il più a lungo possibile, poi ammortizza con le mani a terra.',
      'Errore tipico: piegarsi in avanti dall’anca per accorciare il braccio di leva.',
      'Ripetizione valida: eccentrica cronometrata al tempo prescritto con anche estese fino all’ultimo grado controllato.',
    ],
    videoQuery: 'nordic hamstring curl eccentric proper form tutorial',
  },
  {
    slug: 'hip-thrust-monopodalico',
    name: 'Hip thrust monopodalico, spalle su panca',
    pattern: 'hip-thrust',
    defaultLevel: 4,
    primaryMuscles: ['femorali-glutei'],
    secondaryMuscles: [],
    measurement: 'reps',
    loadPolicy: 'allowed',
    cues: [
      'Scapole appoggiate sul bordo della panca, un piede a terra sotto il ginocchio, l’altra gamba sollevata.',
      'Mento leggermente retratto e costole basse: l’estensione arriva dall’anca, non dalla schiena.',
      'Chiudi in alto con 2" di contrazione del gluteo, bacino parallelo al pavimento.',
      'Errore tipico: inarcare la zona lombare per guadagnare altezza.',
      'Ripetizione valida: anca completamente estesa senza iperestensione lombare, pausa in alto rispettata.',
    ],
    videoQuery: 'single leg hip thrust proper form tutorial',
  },
  {
    slug: 'single-leg-rdl',
    name: 'Single-leg RDL a corpo libero, pausa 2"',
    pattern: 'hip-hinge',
    defaultLevel: 5,
    primaryMuscles: ['femorali-glutei'],
    secondaryMuscles: [],
    measurement: 'reps',
    loadPolicy: 'allowed',
    cues: [
      'Ginocchio d’appoggio morbido, non bloccato; la gamba libera si estende dietro sulla stessa linea del busto.',
      'Scendi mandando l’anca indietro, non piegando la schiena.',
      'Pausa di 2" nel punto di massimo allungamento del femorale.',
      'Errore tipico: aprire il bacino verso il lato della gamba libera.',
      'Ripetizione valida: bacino chiuso e parallelo a terra, pausa rispettata, risalita per estensione d’anca.',
    ],
    videoQuery: 'single leg romanian deadlift bodyweight tutorial',
  },

  /* ---------------------------------------------------------------------- */
  /* Polpacci                                                                */
  /* ---------------------------------------------------------------------- */
  {
    slug: 'calf-monopodalico-rialzo',
    name: 'Calf monopodalico su rialzo',
    pattern: 'calf',
    defaultLevel: 4,
    primaryMuscles: ['polpacci'],
    secondaryMuscles: [],
    measurement: 'reps',
    loadPolicy: 'allowed',
    cues: [
      'Avampiede sul rialzo, tallone libero di scendere sotto il livello del gradino.',
      'Una mano al muro solo per l’equilibrio, non per scaricare peso.',
      'Scendi in 2", pausa di 2" in allungamento, sali e stringi 2" in alto.',
      'Errore tipico: rimbalzare sul tendine d’Achille senza mai fermarsi in basso.',
      'Ripetizione valida: pause in basso e in alto rispettate, ginocchio esteso per tutta la serie.',
    ],
    videoQuery: 'single leg standing calf raise proper form tutorial',
  },
  {
    slug: 'calf-monopodalico-seduto',
    name: 'Calf monopodalico seduto',
    pattern: 'calf',
    defaultLevel: 4,
    primaryMuscles: ['polpacci'],
    secondaryMuscles: [],
    measurement: 'reps',
    loadPolicy: 'allowed',
    cues: [
      'Seduto, ginocchio a circa 90°, avampiede su un rialzo basso.',
      'Il ginocchio piegato sposta il lavoro sul soleo: serve un tempo lento, non carico.',
      'Scendi in 2", 2" di pausa in basso, 2" di contrazione in alto.',
      'Errore tipico: spingere con le mani sulla coscia trasformandolo in un esercizio zavorrato improvvisato.',
      'Ripetizione valida: pause rispettate e tallone che scende sotto il livello dell’avampiede.',
    ],
    videoQuery: 'seated calf raise proper form tutorial',
  },

  /* ---------------------------------------------------------------------- */
  /* Core                                                                    */
  /* ---------------------------------------------------------------------- */
  {
    slug: 'hollow-hold',
    name: 'Hollow hold',
    pattern: 'core',
    defaultLevel: 3,
    primaryMuscles: ['core'],
    secondaryMuscles: [],
    measurement: 'seconds',
    loadPolicy: 'forbidden',
    cues: [
      'Zona lombare schiacciata a terra: è il requisito, tutto il resto viene dopo.',
      'Braccia oltre la testa e gambe distese solo se la lombare resta a contatto; altrimenti accorcia la leva.',
      'Respira in modo corto e continuo, senza rilasciare l’addome.',
      'Errore tipico: la lombare che si stacca da terra mentre il cronometro va avanti.',
      'Misura valida: il tempo si ferma nel momento in cui la lombare si stacca.',
    ],
    videoQuery: 'hollow body hold proper form tutorial',
  },
  {
    slug: 'hanging-leg-raise',
    name: 'Hanging leg raise',
    pattern: 'core',
    defaultLevel: 5,
    primaryMuscles: ['core'],
    secondaryMuscles: [],
    measurement: 'reps',
    loadPolicy: 'forbidden',
    cues: [
      'Appeso a braccia distese, spalle attive e non completamente passive.',
      'Inizia retroversione del bacino, poi salgono le gambe: prima il bacino, poi i piedi.',
      'Sali fino ad avere le anche a 90° o più, gambe distese.',
      'Errore tipico: dondolare e usare l’oscillazione per lanciare le gambe.',
      'Ripetizione valida: nessuna oscillazione, discesa controllata fino a corpo completamente disteso.',
    ],
    videoQuery: 'hanging leg raise proper form tutorial',
  },
  {
    slug: 'ab-wheel-o-rollout-trx',
    name: 'Ab wheel',
    pattern: 'core',
    defaultLevel: 6,
    primaryMuscles: ['core'],
    secondaryMuscles: [],
    measurement: 'reps',
    loadPolicy: 'forbidden',
    cues: [
      'Parti in ginocchio, bacino in retroversione e costole basse prima di muoverti.',
      'Estendi solo fin dove riesci a tenere la lombare neutra: il range utile è quello, non di più.',
      'La schiena non deve mai inarcarsi: se succede, hai superato il tuo range.',
      'Errore tipico: usare l’anca come cerniera e tornare indietro con la schiena invece che con l’addome.',
      'Ripetizione valida: lombare neutra per tutta l’escursione, ritorno senza flessione d’anca.',
    ],
    videoQuery: 'ab wheel rollout proper form tutorial',
  },
  {
    /*
     * Diviso dall'ab wheel, con cui la scheda condivideva una riga. Stesso
     * gesto, attrezzo diverso: la ruota parte da terra e il TRX da sospeso, e
     * chi ha il TRX ma non la ruota non aveva dove registrare le sue serie.
     */
    slug: 'rollout-trx',
    name: 'Rollout al TRX',
    pattern: 'core',
    defaultLevel: 5,
    primaryMuscles: ['core'],
    secondaryMuscles: [],
    measurement: 'reps',
    loadPolicy: 'forbidden',
    cues: [
      'Maniglie in mano, braccia tese davanti, corpo inclinato in avanti sulle punte.',
      'Porta le braccia oltre la testa tenendo costole basse e bacino in retroversione.',
      'Più i piedi sono lontani dall’ancoraggio, più il movimento è facile: è così che si regola.',
      'Errore tipico: lasciare che la lombare si inarchi, che sposta il lavoro dall’addome alla schiena.',
      'Ripetizione valida: allungo massimo senza che il bacino ceda, ritorno tirando con l’addome.',
    ],
    videoQuery: 'trx rollout proper form tutorial',
  },
  /*
   * La riga della scheda dice «Skill: hollow hold / L-sit / verticale al
   * muro»: tre esercizi diversi in un titolo solo, che non dice quale stai
   * facendo. Sono tre skill separate, ognuna con la propria scala e il proprio
   * storico; il blocco A dello Shadow le offre tutte e tre e tu ne scegli una.
   * L'hollow hold è quello già misurato dal test della settimana 0, quindi è
   * lo stesso esercizio: il progresso non si sdoppia.
   */
  {
    slug: 'l-sit',
    name: 'L-sit',
    /*
     * Scala sua, non quella del core.
     *
     * Stava sul gradino 6 del core, che è l'ab wheel: il gradino più facile
     * che l'app sapesse offrire a chi non tiene ancora un L-sit era il plank.
     * L'L-sit si progredisce aprendo le gambe — tuck, advanced tuck, una gamba
     * — e quella progressione non somiglia a nessun gradino del core.
     */
    pattern: 'l-sit',
    defaultLevel: 5,
    primaryMuscles: ['core'],
    secondaryMuscles: ['spalle', 'braccia'],
    measurement: 'seconds',
    loadPolicy: 'forbidden',
    cues: [
      'Mani a terra o su due rialzi, spalle depresse: non scrollare verso le orecchie.',
      'Parti in tuck, ginocchia al petto, e apri le gambe solo quando la posizione regge.',
      'Bacino leggermente retroverso e lombare chiusa, altrimenti le gambe scendono da sole.',
      'Errore tipico: braccia piegate e spalle alte, che trasformano il L-sit in una sospensione.',
      'Misura valida: il tempo si ferma quando i talloni toccano o le spalle salgono.',
    ],
    videoQuery: 'l sit progression tuck to full tutorial',
  },
  {
    slug: 'verticale-al-muro',
    name: 'Verticale al muro',
    pattern: 'handstand',
    defaultLevel: 2,
    primaryMuscles: ['spalle'],
    secondaryMuscles: ['core'],
    measurement: 'seconds',
    loadPolicy: 'forbidden',
    cues: [
      'Mani a larghezza spalle, dita aperte: si corregge spingendo sui polpastrelli.',
      'Costole chiuse e bacino sotto le spalle: la schiena inarcata scarica sulle lombari.',
      'Spingi attivamente il pavimento, spalle lontane dalle orecchie.',
      'Errore tipico: appoggiarsi al muro e restarci, che allena l’attesa e non la posizione.',
      'Misura valida: il tempo si ferma alla prima perdita di allineamento, non alla caduta.',
    ],
    videoQuery: 'wall handstand hold progression tutorial',
  },

  /* ---------------------------------------------------------------------- */
  /* Spalle e braccia accessori                                              */
  /* ---------------------------------------------------------------------- */
  {
    /*
     * La scheda scrive «con elastico». L'utente ha scelto il manubrio, che a
     * parità di ripetizioni dà un carico costante invece di crescere verso la
     * fine del movimento, ed è più facile da dosare.
     *
     * Lo slug resta quello di prima: cambiarlo scollegherebbe lo storico già
     * registrato e i video salvati.
     */
    slug: 'alzate-laterali-elastico',
    name: 'Alzate laterali con manubri',
    pattern: null,
    defaultLevel: null,
    primaryMuscles: ['spalle'],
    secondaryMuscles: [],
    measurement: 'reps',
    loadPolicy: 'inherent',
    cues: [
      'Manubri leggeri lungo i fianchi, gomiti leggermente flessi e angolo fisso.',
      'Sali fino all’altezza delle spalle, non oltre: sopra interviene il trapezio.',
      'Il polso resta sulla linea del gomito, non più alto: niente versare l’acqua.',
      'Errore tipico: slanciare con la schiena per far partire il peso.',
      'Ripetizione valida: nessun movimento del busto, discesa controllata in almeno 2".',
    ],
    videoQuery: 'dumbbell lateral raise proper form tutorial',
  },
  {
    slug: 'face-pull-elastico',
    name: 'Face pull con elastico',
    pattern: null,
    defaultLevel: null,
    primaryMuscles: ['spalle'],
    secondaryMuscles: ['dorsali'],
    measurement: 'reps',
    loadPolicy: 'forbidden',
    cues: [
      'Elastico fissato all’altezza del viso, presa neutra, braccia distese in partenza.',
      'Tira verso la fronte aprendo le mani verso l’esterno: gomiti alti, sopra la linea dei polsi.',
      'Chiudi con 1" di extrarotazione, scapole avvicinate ma spalle basse.',
      'Errore tipico: gomiti che cadono sotto la linea delle spalle, che trasforma il face pull in un rematore.',
      'Ripetizione valida: gomiti sopra le spalle in chiusura, pausa di 1" rispettata.',
    ],
    videoQuery: 'band face pull proper form tutorial',
  },
  {
    slug: 'curl-elastico-presa-neutra',
    /*
     * Manubri e non elastico, su richiesta dell'utente: l'elastico era troppo
     * leggero per stare dentro 12-15 a RIR 0-1. Il peso qui è l'esercizio,
     * quindi si registra sempre ma non è zavorra: nessun passo da 2,5 kg e
     * nessun posto nell'ordine delle leve. Lo slug resta quello per non
     * staccare lo storico già registrato.
     */
    name: 'Curl con manubri presa neutra',
    pattern: null,
    defaultLevel: null,
    primaryMuscles: ['braccia'],
    secondaryMuscles: [],
    measurement: 'reps',
    loadPolicy: 'inherent',
    cues: [
      'Manubri con presa neutra, palmi che si guardano, gomiti al fianco.',
      'Il gomito resta fermo: si muove solo l’avambraccio.',
      'Chiudi senza portare il gomito in avanti, altrimenti scarichi la tensione.',
      'Errore tipico: oscillare il busto indietro nelle ultime ripetizioni.',
      'Ripetizione valida: gomito immobile, discesa controllata in almeno 3".',
    ],
    videoQuery: 'dumbbell hammer curl proper form tutorial',
  },

  /* ---------------------------------------------------------------------- */
  /* Cardio e mobilità                                                       */
  /* ---------------------------------------------------------------------- */
  {
    slug: 'camminata-mobilita-dinamica',
    name: 'Camminata + mobilità dinamica',
    pattern: null,
    defaultLevel: null,
    primaryMuscles: [],
    secondaryMuscles: [],
    measurement: 'duration',
    loadPolicy: 'forbidden',
    cues: [
      'Cammina a passo svelto per i primi minuti, senza cercare subito il ritmo di corsa.',
      'Inserisci slanci di gamba, aperture d’anca e circonduzioni di spalla mentre cammini.',
      'Serve ad alzare la temperatura, non a stancare: se ti manca il fiato stai andando troppo forte.',
    ],
    videoQuery: 'dynamic warm up walking routine before running',
  },
  {
    slug: 'corsa-continua-piano',
    name: 'Corsa continua in piano',
    pattern: null,
    defaultLevel: null,
    primaryMuscles: [],
    secondaryMuscles: [],
    measurement: 'duration',
    loadPolicy: 'forbidden',
    cues: [
      'Il ritmo lo decide il talk test: devi poter parlare a frasi intere, non a parole singole.',
      'FC 125-140 bpm: se sale sopra, rallenta anche se ti sembra troppo lento.',
      'Con DOMS alle gambe dal martedì, sostituisci con bici o tapis in pendenza.',
      'Errore tipico: trasformare la zona 2 in un medio, che rovina il recupero delle sedute di forza.',
    ],
    videoQuery: 'zone 2 training pace talk test explained',
  },
  {
    slug: 'mobilita-anche-torace-spalle',
    name: 'Mobilità anche, torace, spalle',
    pattern: null,
    defaultLevel: null,
    primaryMuscles: [],
    secondaryMuscles: [],
    measurement: 'duration',
    loadPolicy: 'forbidden',
    cues: [
      'Lavora in respirazione lenta: 4" dentro, 6" fuori, restando nella posizione.',
      'Anche 90/90, aperture toraciche da fianco, circonduzioni di spalla a braccio disteso.',
      'Non cercare il massimo allungamento: qui l’obiettivo è defaticare, non guadagnare range.',
    ],
    videoQuery: 'hip thoracic shoulder mobility cool down routine',
  },
  {
    slug: 'zona-2-conclusiva',
    name: 'Zona 2 conclusiva',
    pattern: null,
    defaultLevel: null,
    primaryMuscles: [],
    secondaryMuscles: [],
    measurement: 'duration',
    loadPolicy: 'forbidden',
    cues: [
      '30 minuti a FC 125-135 bpm, subito dopo la parte di forza.',
      'Corsa, bici o camminata in pendenza: quello che ti lascia respirare a frasi intere.',
      'Se la FC non scende sotto i 135 bpm dopo due minuti, riduci il ritmo.',
    ],
    videoQuery: 'low intensity steady state cardio after strength training',
  },

  /* ====================================================================== */
  /* Programma a circuito — esercizi aggiunti                                */
  /* ====================================================================== */

  /*
   * Attrezzi che potrebbero non esserci.
   *
   * Kettlebell e corda da battaglia non sono confermati. Ogni blocco che li
   * usa dichiara un'alternativa con manubri o a corpo libero in
   * `ProgramBlock.alternatives`, quindi la scheda resta eseguibile senza
   * comprare niente. Lo stesso vale per lo swing, che e' un gesto balistico e
   * non si impara dentro una finitura a tempo: il suo posto in scheda e' come
   * seconda scelta, non come prescrizione di partenza.
   */
  {
    slug: 'corda-battaglia-onde-alternate',
    name: 'Corda da battaglia, onde alternate',
    pattern: null,
    defaultLevel: null,
    primaryMuscles: ['spalle'],
    secondaryMuscles: ['braccia', 'core'],
    measurement: 'seconds',
    loadPolicy: 'forbidden',
    cues: [
      'Piedi a larghezza spalle, ginocchia morbide, anche leggermente indietro: la posizione è quella di un mezzo squat, non di un inchino.',
      'Le onde partono dalle spalle con i gomiti quasi fermi: non sono colpi di braccio, sono spinte brevi e continue.',
      'Un braccio sale mentre l’altro scende, senza pausa: la corda deve restare carica fino alla fine.',
      'Errore tipico: raddrizzarsi e tirare con la schiena quando il fiato finisce, perdendo la posizione dell’anca.',
      'Se l’onda non arriva più all’ancoraggio, il tempo è finito anche se il timer no: fermati.',
    ],
    videoQuery: 'battle rope alternating waves proper form tutorial',
  },
  {
    slug: 'scapular-pull-up',
    name: 'Scapular pull-up',
    pattern: null,
    defaultLevel: null,
    primaryMuscles: ['dorsali'],
    secondaryMuscles: [],
    measurement: 'reps',
    loadPolicy: 'forbidden',
    cues: [
      'Appeso alla sbarra a braccia completamente distese, corpo fermo.',
      'Deprimi le scapole senza piegare i gomiti: il corpo sale di due o tre centimetri, non di più.',
      'Le braccia restano dritte per tutta la ripetizione: se il gomito si piega è diventata una trazione.',
      'Errore tipico: scrollare le spalle verso le orecchie invece di abbassarle.',
      'Serve a svegliare il controllo scapolare prima di tirare: è riscaldamento, non lavoro.',
    ],
    videoQuery: 'scapular pull up activation proper form tutorial',
  },
  {
    slug: 'circonduzioni-spalle',
    name: 'Circonduzioni di spalla',
    pattern: null,
    defaultLevel: null,
    /*
     * Nessun volume diretto: è mobilità, non lavoro. La spalla però la tocca,
     * ed è l'unico modo onesto di dirlo — `secondaryMuscles` conta mezza serie
     * e in riscaldamento non si registra nessuna serie, quindi non sporca il
     * conto settimanale.
     */
    primaryMuscles: [],
    secondaryMuscles: ['spalle'],
    measurement: 'seconds',
    loadPolicy: 'forbidden',
    cues: [
      'Braccia distese lungo i fianchi, poi cerchi ampi e lenti in avanti e indietro.',
      'Il movimento parte dalla spalla: il busto resta fermo e le costole non si aprono.',
      'Cerchi grandi e senza fretta: serve a portare sangue alla cuffia, non a stancarla.',
    ],
    videoQuery: 'shoulder circles warm up mobility drill',
  },
  {
    slug: 'affondo-con-rotazione',
    name: 'Affondo con rotazione',
    pattern: null,
    defaultLevel: null,
    primaryMuscles: ['quadricipiti'],
    secondaryMuscles: ['core'],
    measurement: 'reps',
    loadPolicy: 'forbidden',
    cues: [
      'Passo avanti lungo, ginocchio posteriore che scende verso terra senza toccarla.',
      'Da fondo affondo ruota il busto verso il lato della gamba avanti, braccia distese davanti al petto.',
      'La rotazione viene dal torace, non dal bacino: le anche restano quadrate verso avanti.',
      'Errore tipico: ruotare prima di essere scesi, trasformandolo in una torsione in piedi.',
      'Riscaldamento: cerca il range, non il carico.',
    ],
    videoQuery: 'world greatest stretch lunge with rotation warm up',
  },
  {
    slug: 'stacco-rumeno-manubri',
    name: 'Stacco rumeno con manubri',
    pattern: null,
    defaultLevel: null,
    primaryMuscles: ['femorali-glutei'],
    secondaryMuscles: ['dorsali'],
    measurement: 'reps',
    loadPolicy: 'inherent',
    cues: [
      'Manubri davanti alle cosce, piedi a larghezza anche, ginocchia morbide ma ferme.',
      'Spingi le anche indietro e lascia scendere i manubri lungo le gambe: le tibie restano verticali.',
      'Scendi finché senti i femorali tirare, non più in basso: il punto di arrivo lo decide la schiena neutra.',
      'Errore tipico: piegare le ginocchia e trasformarlo in uno squat, oppure arrotondare la lombare per scendere di più.',
      'Ripetizione valida: risalita per estensione d’anca, glutei contratti in cima senza inarcare la schiena.',
    ],
    videoQuery: 'dumbbell romanian deadlift proper form tutorial',
  },
  {
    slug: 'goblet-squat',
    name: 'Goblet squat',
    pattern: null,
    defaultLevel: null,
    primaryMuscles: ['quadricipiti'],
    secondaryMuscles: ['femorali-glutei', 'core'],
    measurement: 'reps',
    loadPolicy: 'inherent',
    cues: [
      'Peso tenuto al petto con due mani, gomiti bassi e vicini al corpo.',
      'Scendi tra i piedi tenendo il petto alto: il peso davanti fa da contrappeso e ti permette di restare verticale.',
      'Ginocchia che seguono la punta dei piedi, talloni a terra per tutta la discesa.',
      'Errore tipico: lasciare che il peso ti tiri avanti, con i gomiti che si allontanano dal busto.',
      'Ripetizione valida: piega dell’anca sotto il ginocchio, risalita senza che il bacino si inclini.',
    ],
    videoQuery: 'goblet squat proper form tutorial',
  },
  {
    slug: 'pull-over-trx',
    name: 'Pull-over al TRX',
    pattern: null,
    defaultLevel: null,
    primaryMuscles: ['dorsali'],
    secondaryMuscles: ['core'],
    measurement: 'reps',
    loadPolicy: 'forbidden',
    cues: [
      'In piedi inclinato indietro, braccia distese sopra la testa che tengono le maniglie.',
      'Tira portando le braccia verso i fianchi restando con i gomiti quasi dritti: il gomito non si piega, la spalla si estende.',
      'Il corpo resta una linea sola dalle caviglie alla testa: il bacino non si piega.',
      'Errore tipico: piegare i gomiti e ritrovarsi a fare un rematore, che è un altro esercizio.',
      'È il lavoro di ampiezza dorsale che non passa dai bicipiti: qui la presa non è il limite.',
    ],
    videoQuery: 'trx straight arm pullover lat exercise tutorial',
  },
  {
    slug: 'rematore-manubrio-un-braccio',
    name: 'Rematore con manubrio a un braccio',
    pattern: null,
    defaultLevel: null,
    primaryMuscles: ['dorsali'],
    secondaryMuscles: ['braccia'],
    measurement: 'reps',
    loadPolicy: 'inherent',
    cues: [
      'Una mano e un ginocchio appoggiati alla panca, schiena parallela a terra e neutra.',
      'Manubrio che parte a braccio disteso e sale verso l’anca, gomito che sfiora il fianco.',
      'Le spalle restano parallele a terra: se una si alza stai ruotando invece di tirare.',
      'Errore tipico: strappare con il bicipite e la rotazione del busto, invece di portare la scapola indietro.',
      'Ripetizione valida: manubrio all’altezza del fianco con la scapola retratta, discesa controllata a braccio disteso.',
    ],
    videoQuery: 'one arm dumbbell row proper form tutorial',
  },
  {
    slug: 'curl-martello-manubri',
    name: 'Curl a martello con manubri',
    pattern: null,
    defaultLevel: null,
    primaryMuscles: ['braccia'],
    secondaryMuscles: [],
    measurement: 'reps',
    loadPolicy: 'inherent',
    cues: [
      'In piedi, manubri lungo i fianchi con i pollici in avanti: la presa resta neutra per tutta la serie.',
      'Fletti il gomito tenendolo fermo al fianco: il manubrio sale, il gomito non va avanti.',
      'La presa neutra carica il brachiale, che sta sotto il bicipite e allarga il braccio visto di fronte.',
      'Errore tipico: oscillare il busto per far partire il peso, o ruotare il polso verso l’alto durante la salita.',
      'Ripetizione valida: salita senza slancio, discesa controllata fino a braccio completamente disteso.',
    ],
    videoQuery: 'dumbbell hammer curl proper form tutorial',
  },
  {
    slug: 'estensione-tricipiti-sopra-testa',
    name: 'Estensione dei tricipiti sopra la testa',
    pattern: null,
    defaultLevel: null,
    primaryMuscles: ['braccia'],
    secondaryMuscles: [],
    measurement: 'reps',
    loadPolicy: 'inherent',
    cues: [
      'Peso tenuto con due mani sopra la testa, gomiti vicini alle orecchie e puntati in alto.',
      'Scendi dietro la testa piegando solo i gomiti: le braccia dalla spalla al gomito restano ferme e verticali.',
      'La posizione sopra la testa è l’unica che allunga il capo lungo del tricipite, che è la parte più grossa.',
      'Errore tipico: aprire i gomiti verso l’esterno e inarcare la lombare per spingere.',
      'Ripetizione valida: massima flessione del gomito senza che le braccia si inclinino, estensione completa in cima.',
    ],
    videoQuery: 'overhead dumbbell triceps extension proper form tutorial',
  },
  {
    slug: 'suitcase-carry',
    name: 'Suitcase carry',
    pattern: null,
    defaultLevel: null,
    primaryMuscles: ['core'],
    secondaryMuscles: ['spalle'],
    measurement: 'seconds',
    loadPolicy: 'inherent',
    cues: [
      'Un peso solo, in una mano, lungo il fianco: come una valigia pesante.',
      'Cammina restando perfettamente verticale: le spalle alla stessa altezza, il busto che non si inclina da nessun lato.',
      'Il lavoro è tutto nel non piegarsi: gli obliqui del lato libero tengono, non accorciano.',
      'Errore tipico: contrastare inclinandosi dalla parte opposta, che scarica il lavoro sulla lombare.',
      'Il tempo finisce quando il busto comincia a cedere di lato, anche se il timer non ha finito.',
    ],
    videoQuery: 'suitcase carry anti lateral flexion core exercise tutorial',
  },
  {
    slug: 'pallof-press-elastico',
    name: 'Pallof press con elastico',
    pattern: null,
    defaultLevel: null,
    primaryMuscles: ['core'],
    secondaryMuscles: ['spalle'],
    measurement: 'seconds',
    loadPolicy: 'forbidden',
    cues: [
      'Elastico ancorato di lato all’altezza del petto, tu in piedi di fianco con le mani sullo sterno.',
      'Spingi le mani in avanti fino a braccia distese e resta lì: l’elastico cerca di ruotarti, tu non ruoti.',
      'Piedi piantati, glutei e addome contratti: il bacino non si muove di un grado.',
      'Errore tipico: lasciare che le spalle seguano la trazione, ruotando di qualche grado a ogni respiro.',
      'Si misura in secondi di tenuta a braccia distese, non in ripetizioni.',
    ],
    videoQuery: 'pallof press anti rotation band exercise tutorial',
  },
  {
    slug: 'step-rapidi-box',
    name: 'Step rapidi al box',
    pattern: null,
    defaultLevel: null,
    primaryMuscles: ['quadricipiti'],
    secondaryMuscles: ['polpacci'],
    measurement: 'seconds',
    loadPolicy: 'forbidden',
    cues: [
      'Box o gradino basso, un piede sopra e uno a terra, cambio rapido e continuo.',
      'Appoggio di pianta piena sul box, non di punta: il piede ci sta tutto.',
      'Busto eretto e sguardo avanti: non guardare i piedi, li trovi comunque.',
      'Errore tipico: salire di punta e sbilanciarsi avanti quando il fiato aumenta.',
      'È lavoro metabolico: conta la continuità, non l’altezza del box.',
    ],
    videoQuery: 'fast step ups box conditioning drill',
  },
  {
    slug: 'mountain-climber',
    name: 'Mountain climber',
    pattern: null,
    defaultLevel: null,
    primaryMuscles: ['core'],
    secondaryMuscles: ['spalle'],
    measurement: 'seconds',
    loadPolicy: 'forbidden',
    cues: [
      'Posizione di plank alto sulle mani, spalle sopra i polsi, corpo in linea.',
      'Porta un ginocchio verso il petto e cambia, mantenendo il bacino alla stessa altezza.',
      'Il bacino non deve salire né oscillare: se rimbalza, rallenta.',
      'Errore tipico: alzare il sedere per andare più veloce, che toglie il lavoro al core.',
      'Il tempo finisce quando la linea del corpo si rompe, non quando suona il timer.',
    ],
    videoQuery: 'mountain climbers proper form tutorial',
  },
  {
    slug: 'jumping-jack',
    name: 'Jumping jack',
    pattern: null,
    defaultLevel: null,
    primaryMuscles: ['polpacci'],
    secondaryMuscles: ['spalle'],
    measurement: 'seconds',
    loadPolicy: 'forbidden',
    cues: [
      'Da piedi uniti e braccia lungo i fianchi, salta aprendo le gambe e portando le braccia sopra la testa.',
      'Atterra morbido sull’avampiede con le ginocchia che cedono un poco: non arrivare a gambe rigide.',
      'Braccia distese che arrivano davvero sopra la testa, non a mezz’aria.',
      'Errore tipico: ridurre il range quando il fiato finisce, trasformandoli in un saltello sul posto.',
      'È la stazione metabolica più semplice: serve a tenere alta la frequenza, non a costruire niente.',
    ],
    videoQuery: 'jumping jacks proper form tutorial',
  },
  {
    slug: 'kb-swing',
    name: 'Swing con kettlebell',
    pattern: null,
    defaultLevel: null,
    primaryMuscles: ['femorali-glutei'],
    secondaryMuscles: ['dorsali', 'core'],
    measurement: 'reps',
    loadPolicy: 'inherent',
    cues: [
      'È una cerniera d’anca balistica, non uno squat e non un’alzata di braccia: le braccia sono due corde.',
      'Kettlebell una trentina di centimetri davanti ai piedi: inclinalo verso di te e lancialo indietro tra le gambe, alto e vicino all’inguine.',
      'Estendi le anche di colpo: glutei e addome si contraggono e il peso parte da solo fino all’altezza del petto, dove il corpo è un plank in piedi.',
      'Errore tipico: aprire le costole e inarcare la lombare in alto. È la via principale all’infortunio e basta a interrompere la serie.',
      'Sotto fatica il gesto si sfalda in un modo preciso: il peso smette di andare indietro e comincia a scendere verso il pavimento. Quando succede la serie è finita, non rallentata.',
    ],
    videoQuery: 'hardstyle kettlebell swing proper form tutorial',
  },
] as const satisfies readonly Exercise[];

export const EXERCISES: readonly Exercise[] = EXERCISE_LIST;

const BY_SLUG: ReadonlyMap<ExerciseSlug, Exercise> = new Map(
  EXERCISE_LIST.map((exercise) => [exercise.slug, exercise as Exercise]),
);

export function findExercise(slug: ExerciseSlug): Exercise | undefined {
  return BY_SLUG.get(slug);
}

/** Come `findExercise`, ma solleva: uno slug sconosciuto è un bug del seed. */
export function getExercise(slug: ExerciseSlug): Exercise {
  const exercise = BY_SLUG.get(slug);
  if (exercise === undefined) {
    throw new Error(`Esercizio sconosciuto: ${slug}`);
  }
  return exercise;
}

/** Slug tipizzati, per evitare stringhe libere nel resto del seed. */
export type KnownExerciseSlug = (typeof EXERCISE_LIST)[number]['slug'];
