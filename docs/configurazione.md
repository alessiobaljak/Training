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

Verifica in console, Firestore > Regole: devi vedere la regola su
`users/{uid}`. Se vedi ancora `allow read, write: if false;` o una data di
scadenza, il deploy non è passato.

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
| Accesso che gira a vuoto su iPhone | Il popup non torna: l'app ripiega sul redirect da sola, riprova una volta |
| «Missing or insufficient permissions» | Regole non caricate: passo 5 |
| Accesso fatto ma storico vuoto | Account diverso da quello di prima. L'app chiede sempre quale Google usare proprio per questo |

---

## Cosa resta tuo

I dati stanno su Firebase, ma il backup JSON in «App e dati» continua a
esistere ed è l'unica copia che controlli tu. Un progetto Firebase si può
sospendere, un account si può perdere. Scaricalo ogni tanto.
