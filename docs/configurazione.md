# Collegare GitHub, Firebase e Vercel

Tutto quello che serve per far girare l'app sul tuo telefono, dall'account
Firebase alle variabili su Vercel. Segui l'ordine: ogni passo produce un
valore che serve al successivo.

Tempo realistico: venti minuti senza Apple, un'ora abbondante con Apple.

---

## Prima di tutto: cosa è segreto e cosa no

È la cosa che confonde di più, quindi sta in cima.

| Valore | Segreto? | Dove vive |
|---|---|---|
| `VITE_FIREBASE_API_KEY` e le altre cinque | **No** | Nel bundle, leggibili da chiunque |
| Regole di Firestore | No | `firestore.rules`, nel repository |
| Chiave `.p8` di Sign in with Apple | **Sì** | Solo nella console Firebase |
| Token di deploy Vercel | **Sì** | Non serve: Vercel si collega da solo a GitHub |

Le sei variabili `VITE_FIREBASE_*` **non sono password**. Finiscono nel
JavaScript che il browser scarica, e chiunque apra l'app può leggerle. È il
funzionamento previsto di Firebase sul web: servono a dire *a quale progetto*
parlare, non *chi sei*.

A proteggere i dati sono le regole in `firestore.rules`, che girano sui server
di Google e dicono che ogni utente vede solo il proprio ramo. Senza un accesso
valido, quelle chiavi non aprono niente.

---

## 1. Creare il progetto Firebase

1. Vai su [console.firebase.google.com](https://console.firebase.google.com),
   accedi con il tuo Google.
2. **Aggiungi progetto**. Nome: `shadow-calisthenics` (o quello che vuoi).
3. Google Analytics: **disattivalo**. Non serve a niente qui e aggiunge
   tracciamento a un'app personale.
4. Aspetta la creazione, poi entra nel progetto.

Annota l'**ID progetto**: lo trovi in Impostazioni progetto ed è tipo
`shadow-calisthenics-a1b2c`. Non è il nome che hai scritto tu.

## 2. Attivare l'accesso con Google

1. Menu a sinistra, **Build > Authentication**, poi **Inizia**.
2. Scheda **Sign-in method**, scegli **Google**, attiva.
3. Ti chiede una email di assistenza: metti la tua.
4. Salva.

Questo basta per entrare. Apple si può aggiungere dopo, e l'app funziona lo
stesso: il pulsante c'è ma dà errore finché il provider non è attivo.

## 3. Attivare l'accesso con Apple (opzionale, a pagamento)

**Richiede l'Apple Developer Program: 99 dollari l'anno.** Se non ce l'hai,
salta questo passo e usa Google. Non stai perdendo niente di funzionale.

Se ce l'hai, su [developer.apple.com](https://developer.apple.com):

1. **Certificates, Identifiers & Profiles > Identifiers**, crea un **App ID**
   con Sign in with Apple abilitato.
2. Crea un **Services ID** (è quello che userai come Client ID). Configuralo:
   - Domini: `<ID-PROGETTO>.firebaseapp.com`
   - Return URL: `https://<ID-PROGETTO>.firebaseapp.com/__/auth/handler`
3. **Keys**, crea una chiave con Sign in with Apple. Scarica il file `.p8`.
   **Si scarica una volta sola.**
4. Annota **Team ID** (in alto a destra sul portale) e **Key ID** (della
   chiave appena creata).

Poi in Firebase, Authentication > Sign-in method > **Apple**:
- Services ID → il Client ID del punto 2
- Team ID, Key ID, e il contenuto del file `.p8`

## 4. Creare il database

1. **Build > Firestore Database**, poi **Crea database**.
2. Modalità: **produzione**. Le regole giuste le carichi tu al passo 5, e
   partire in modalità di prova significa avere un database aperto a chiunque
   per trenta giorni.
3. Posizione: `eur3 (europe-west)` se sei in Italia. **Non si cambia più.**

## 5. Caricare le regole di sicurezza

Dal computer, dentro il repository:

```bash
npx firebase login
npx firebase use --add        # scegli il progetto, alias: default
npx firebase deploy --only firestore:rules
```

Il primo comando apre il browser. Il secondo crea `.firebaserc`, che va
committato: contiene solo l'id del progetto, che non è un segreto.

**Senza riga di comando**, che è più veloce: console Firebase, Firestore
Database, scheda **Regole**, cancella quello che c'è, incolla il contenuto di
`firestore.rules` e premi **Pubblica**.

Verifica in console, Firestore > Regole: devi vedere la regola su
`users/{uid}`. Se vedi ancora `allow read, write: if false;` o una data di
scadenza, le regole non sono pubblicate.

**Sintomo se salti questo passo:** l'app funziona, ti fa registrare tutto, ma
in alto compare «Una modifica non è stata salvata» e niente arriva davvero sul
server. Un database creato in modalità produzione nasce chiuso a tutti,
compreso te.

## 6. Prendere le sei variabili

1. **Impostazioni progetto** (ingranaggio in alto a sinistra).
2. In fondo, **Le tue app**, icona `</>` per registrare un'app web.
3. Nome: `Shadow`. **Non** attivare Firebase Hosting: il sito lo serve Vercel.
4. Ti mostra un blocco `firebaseConfig`. Da lì:

| Nel blocco | Variabile |
|---|---|
| `apiKey` | `VITE_FIREBASE_API_KEY` |
| `authDomain` | `VITE_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `VITE_FIREBASE_PROJECT_ID` |
| `storageBucket` | `VITE_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | `VITE_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `VITE_FIREBASE_APP_ID` |

Se ne dimentichi una, l'app non esplode: mostra una schermata che ti dice
esattamente quale manca.

## 7. Autorizzare il dominio di Vercel

**È il passo che si dimentica sempre, e l'errore che produce non lo dice.**

Firebase rifiuta l'accesso da domini che non conosce. Dopo il primo deploy su
Vercel avrai un indirizzo tipo `training-xyz.vercel.app`:

1. Firebase, **Authentication > Settings > Domini autorizzati**.
2. **Aggiungi dominio**, incolla il dominio Vercel (senza `https://`).

Se salti questo passo, l'accesso fallisce con
`auth/unauthorized-domain`. L'app te lo traduce in italiano nella schermata di
accesso.

I deploy di anteprima di Vercel hanno domini diversi a ogni push. Se ti serve
l'accesso anche lì, aggiungi anche quelli, oppure prova solo in produzione.

## 7b. La deviazione di `/__/auth` (serve su iPhone)

**Sintomo se salti questo passo:** premi «Continua con Google», il giro parte,
e torni indietro con

> Unable to process request due to missing initial state.

Non è un errore di configurazione: è Safari che isola la memoria dei siti di
terze parti. L'accesso passa da una pagina ospitata su
`<ID-PROGETTO>.firebaseapp.com`, che per il tuo browser è un altro sito, e la
memoria che quella pagina usa per ricordarsi dove tornare viene buttata via.

La cura è far vivere quella pagina sul tuo stesso dominio. Due modifiche:

**1. La deviazione è già in `vercel.json`**, verso il progetto `training-b5ca8`:

```json
"rewrites": [
  {
    "source": "/__/auth/:path*",
    "destination": "https://training-b5ca8.firebaseapp.com/__/auth/:path*"
  }
]
```

Se un giorno cambi progetto Firebase, quella riga va cambiata a mano: Vercel
non legge le variabili d'ambiente dentro `vercel.json`.

**2. Su Vercel**, cambia una sola variabile, e va fatto **dopo** che la
deviazione è online, non prima:

```
VITE_FIREBASE_AUTH_DOMAIN = il-tuo-dominio.vercel.app
```

Non più `training-b5ca8.firebaseapp.com`. Poi rifai il deploy.

Se cambi la variabile prima che la deviazione sia pubblicata, l'accesso smette
di funzionare del tutto: la pagina di accesso verrebbe cercata sul tuo dominio,
dove ancora non c'è.

Da quel momento la pagina di accesso è servita dal tuo dominio, il browser non
ha più niente da isolare, e funzionano sia il popup sia il redirect.

## 7c. Registrare il nuovo indirizzo di ritorno su Google

**Va fatto insieme al 7b, non dopo.** Cambiare `VITE_FIREBASE_AUTH_DOMAIN`
sposta l'indirizzo a cui Google deve riportarti, e Google riporta solo agli
indirizzi che gli hai dichiarato.

**Sintomo se salti questo passo:** arrivi fino alla schermata di Google, che
poi risponde

> Access blocked: This app's request is invalid — Error 400: redirect_uri_mismatch

1. Vai su [console.cloud.google.com](https://console.cloud.google.com) e in
   alto scegli il progetto `training-b5ca8`. È lo stesso progetto di Firebase:
   la console di Google Cloud ne mostra la parte sotto il cofano.
2. **API e servizi > Credenziali**.
3. Sotto **ID client OAuth 2.0** apri quello chiamato
   «Web client (auto created by Google Service)». Se ce n'è più di uno,
   quello giusto ha l'id che vedi in Firebase, Authentication, Sign-in method,
   Google, sezione «Configurazione dell'SDK web».
4. In **Origini JavaScript autorizzate** aggiungi:
   `https://IL-TUO-DOMINIO.vercel.app`
5. In **URI di reindirizzamento autorizzati** aggiungi:
   `https://IL-TUO-DOMINIO.vercel.app/__/auth/handler`
6. Salva. Google può metterci qualche minuto a propagare la modifica: se
   l'errore resta, aspetta e riprova prima di cercare altrove.

Il vecchio indirizzo `<ID-PROGETTO>.firebaseapp.com` **non va tolto**: serve
ancora, ed è quello verso cui punta la deviazione.

## 8. Mettere le variabili su Vercel

1. Progetto su Vercel, **Settings > Environment Variables**.
2. Aggiungi le sei variabili, tutte spuntate per **Production**, **Preview** e
   **Development**.
3. **Fai un nuovo deploy.** Le variabili vengono lette quando l'app viene
   compilata, non a ogni avvio: senza un deploy nuovo, quelle vecchie restano.

Il modo più veloce per il deploy: Deployments, ultimo deploy, menu a tre
punti, **Redeploy**.

## 9. GitHub: non serve nessuna chiave

Il workflow in `.github/workflows/test.yml` esegue solo le prove, non pubblica
niente, e usa gli emulatori Firebase invece del progetto vero. Non ha bisogno
di segreti e non ne va aggiunto nessuno.

A pubblicare è Vercel, che si collega da solo al repository con la sua
autorizzazione GitHub.

## 10. Pubblicare solo quando dici tu, e tornare indietro

### Prima di tutto: un push potrebbe già essere una pubblicazione

Vercel sceglie da solo il ramo di produzione: `main`; se non c'è, `master`;
se non c'è nemmeno quello, il ramo predefinito del repository. Questo
repository non ha né `main` né `master`, e il ramo predefinito è
`claude/calisthenics-pwa-offline-kor52w`, quello su cui lavora Claude. Se il
progetto Vercel è stato creato così, ogni push su quel ramo va in produzione
appena `npm run verify` passa: anche con un NO-GO di `release-gate`, anche
senza il tuo ok.

Controlla su Vercel: **Settings > Environments > Production > Branch
Tracking**. Al 2026-11-14 c'è proprio quel ramo, con l'assegnazione automatica
accesa: ogni push è un rilascio. Il 2026-11-15 Alessio ha deciso di tenerlo
così per ora; prima di ogni push si eseguono verify, smoke e offline, perché
Vercel esegue solo verify.

Qualunque ramo ci sia scritto, la protezione è la stessa: nella stessa
sezione spegni **Auto-assign Custom Production Domains**. Da quel momento ogni
push produce un deploy di produzione in stato **Staged**: compilato e
raggiungibile al suo indirizzo, ma non servito a chi apre l'app. Va in linea
solo quando lo promuovi tu: **Deployments**, i tre puntini accanto al deploy,
**Promote**. È così che «il deploy richiede l'ok di Alessio» diventa un fatto
e non una promessa.

### Prima di ogni rilascio (un minuto)

1. In **Deployments** annota il deploy segnato **Current** e i sette caratteri
   del suo commit. È il punto a cui torni. Finché ogni push va in produzione
   da solo, lo annota la sessione principale: a ogni push scrive in
   `docs/SESSION_STATE.md` il commit che era in produzione prima.
2. Scarica il backup da «App e dati». Il rollback non tocca i dati, ma se il
   guasto è nei dati quel file è l'unica copia che controlli tu.

### Quando tornare indietro, e quando no

Si torna indietro se l'app non si apre, se non si riesce a registrare una
serie, se i dati spariscono o si corrompono. Un testo sbagliato, una figura
storta, un numero discutibile si correggono in avanti: tornare indietro costa
di più di quello che risolve.

### Come

1. Su Vercel, nel riquadro del deploy di produzione, **Instant Rollback**
   (oppure **Deployments**, i tre puntini, **Instant Rollback**).
2. Scegli il deploy annotato prima, **Continue**, poi **Confirm Rollback**. Il
   cambio è immediato: nessuna compilazione nuova.
3. Sul telefono, con la rete, apri l'app. Il service worker scarica la
   versione vecchia e ricarica la pagina da solo, una volta. In **Impostazioni
   > Programma > Versione** deve comparire il commit a cui sei tornato.

Due limiti di Vercel da sapere prima di averne bisogno:

- **Sul piano gratuito (Hobby) si torna solo al deploy immediatamente
  precedente.** Se dopo quello buono sono andati in produzione altri push,
  Instant Rollback non lo raggiunge. Allora si torna indietro in git: Claude
  annulla i commit con `git revert` e si pubblica di nuovo, con il tuo ok. Con
  l'assegnazione automatica spenta il caso quasi non si presenta, perché in
  produzione va solo quello che promuovi tu.
- **Dopo un rollback i push non vanno più in linea da soli**, finché non lo
  annulli: riquadro del deploy di produzione, **Manage**, scegli il deploy,
  **Confirm**. Annullarlo riaccende l'assegnazione automatica: se la tenevi
  spenta, rispegnila.

### Cosa il rollback non riporta indietro

Vercel cambia solo il codice servito. Il resto rimane come l'ha lasciato la
versione da annullare.

1. **I telefoni senza rete.** La versione vecchia arriva a un telefono solo
   alla prima apertura con la rete; in modalità aereo resta quella nuova
   finché non si collega.
2. **I dati su Firebase.** Restano, e la versione vecchia deve saperli
   leggere. C'è un caso in cui non sa farlo: quando trova un esercizio che il
   suo catalogo non conosce, si ferma con «Esercizio sconosciuto». Se il
   rilascio da annullare ha aggiunto esercizi o sedute e li hai già usati,
   la versione vecchia può non aprirsi più. Prima del rollback fai guardare a
   Claude `git diff <buono>..<cattivo> --stat -- src/data src/types src/db`:
   se tocca catalogo, tipi o database, non si torna indietro, si corregge in
   avanti tenendo il catalogo nuovo.
3. **Le regole di Firestore.** Non le pubblica Vercel. Se il rilascio le ha
   cambiate e le hai caricate (passo 5), quelle vecchie si rimettono a parte:
   `git show <buono>:firestore.rules > firestore.rules`, poi
   `npx firebase deploy --only firestore:rules`, poi
   `git checkout firestore.rules`.
4. **Le variabili.** Il deploy vecchio usa quelle con cui era stato compilato.
   Se nel frattempo hai sostituito le chiavi Firebase e cancellato le vecchie,
   la versione vecchia non si collega più: lì il rollback non è possibile e si
   corregge in avanti.

### Mai provata

Questa procedura non è mai stata eseguita. La prima volta conviene farla a
freddo, in un momento tranquillo: rollback al deploy precedente, controllo
della versione sul telefono, **Manage** per tornare a quello attuale. Cinque
minuti; e siccome cambia la produzione, la fai tu.

---

## Sviluppo in locale, senza toccare i dati veri

```bash
npm run emulators     # in un terminale
npm run dev           # in un altro
```

Con `VITE_FIREBASE_EMULATOR_HOST=127.0.0.1` in un file `.env.local`, l'app
parla con gli emulatori e non contatta mai Google. È anche il modo in cui
girano `npm run smoke` e `npm run offline`, che avviano gli emulatori da soli.

Copia `.env.example` in `.env.local` e riempilo per lavorare sul progetto vero.
`.env.local` è ignorato da git.

---

## Se qualcosa non va

| Sintomo | Causa quasi certa |
|---|---|
| «Configurazione incompleta» con l'elenco delle variabili | Variabili non su Vercel, o deploy non rifatto dopo averle aggiunte |
| `auth/unauthorized-domain` | Passo 7 saltato |
| «missing initial state» dopo l'accesso | Passo 7b saltato: manca la deviazione di `/__/auth` |
| `Error 400: redirect_uri_mismatch` | Passo 7c saltato: il nuovo dominio non è tra gli URI di ritorno su Google Cloud |
| «Una modifica non è stata salvata» in cima all'app | Regole non pubblicate: passo 5 |
| «Missing or insufficient permissions» | Regole non caricate: passo 5 |
| Accesso fatto ma storico vuoto | Account diverso da quello di prima. L'app chiede sempre quale Google usare proprio per questo |

---

## Cosa resta tuo

I dati stanno su Firebase, ma il backup JSON in «App e dati» continua a
esistere ed è l'unica copia che controlli tu. Un progetto Firebase si può
sospendere, un account si può perdere. Scaricalo ogni tanto.
