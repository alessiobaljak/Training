# LICENSING.md — fonti delle immagini e loro termini

L'app diventerà pubblica. Una fonte senza uso commerciale chiaro non si usa.

## 1. RepDB — 91 file `.webp` in `src/assets/exercises-repdb/`

- **Testo verificato alla fonte**: https://repdb.co/license/ — «RepDB License
  (v1.2)», scaricata e letta il **2026-11-08**. Esistono due livelli
  (*Standard* e *Stills*) con testi quasi identici sui punti che ci riguardano,
  più la **Media Use Addendum (m1.0)**, inclusa in ogni ordine Standard e
  Stills. È pubblicata anche una v1.1: **vale la versione citata dal checkout
  del nostro ordine**, non l'ultima pubblicata.
- Licenziante: Sergei Argutin (RepDB), Berlino. Legge tedesca.

### Quello che possiamo fare (citazione)
> Use the dataset and images inside your own commercial products (web, mobile,
> desktop), at any revenue. [...] Resize, crop, compress, or colour-adjust the
> images for use in your products (AI-based restyling remains prohibited).
> Ship images as part of your app bundles / web pages [...]

Copre il nostro uso: bundle a build time, cache del service worker, nessun
tetto di fatturato. Copre anche l'ottimizzazione (ridimensiona, ritaglia,
comprimi). La Media Use Addendum aggiunge video, corsi, presentazioni e social.

### Termine 3 — niente ridistribuzione come dataset (citazione)
> Resell, redistribute, or sublicense the raw dataset or raw images as a
> dataset / asset pack.
> Make the raw dataset or the image catalog available in bulk — for example a
> publicly accessible archive of the bundle, an open storage bucket containing
> the catalog, a bulk-download endpoint, or a product that in effect acts as a
> proxy for downloading the dataset. (Serving individual images or records to
> your product's users is expressly fine.)

Rispettato per costruzione: nel repo stanno solo i file che l'app mostra, e un
test lo verifica (`non ci sono immagini copiate e mai usate`).

### Termine 5 — niente modelli generativi, PER ESTESO (citazione integrale)
> Use the images as input, reference, or conditioning material for generative
> models — image-to-image restyling, style transfer, or fine-tuning — the
> artwork ships in its two styles; custom styles are an Enterprise service.

E, separatamente:
> Train machine-learning models that reproduce the dataset or substitute for
> it, whether offered commercially or for free. (Using the data to power
> features of your own product — search, recommendations, embeddings — is
> fine.)

**Conseguenza operativa.** L'unica libreria fotografica che l'app possiede non
può legalmente alimentarne una generata: né image-to-image, né trasferimento di
stile, né messa a punto. Un modello generativo è ammissibile **solo** se non
vede mai un file RepDB — né come input, né come riferimento, né dentro un
prompt che descrive quello stile. «Stile coerente con la libreria esistente»
scritto in un prompt è già un riferimento.

### Tre cose che il repo dice e la licenza non conferma
1. **L'attribuzione non è obbligatoria.** La v1.2 dice: *«Attribution (request,
   not a condition) — a credit line [...] is appreciated and helps the project,
   but is not required.»* `CLAUDE.md`, `src/data/exercise-art.ts` e il test
   «l'attribuzione richiesta dalla licenza» la chiamano richiesta. Tenerla è
   giusto e gratuito, ma la frase va corretta: la teniamo per scelta, non per
   obbligo. (Verificare prima il testo della versione del nostro ordine.)
2. **Le illustrazioni RepDB sono generate con strumenti AI.** Testo della
   licenza: *«All images are original works generated with AI tooling
   commissioned by RepDB — not copied or derived from any third-party exercise
   dataset or image library.»* Il repo le chiama «disegni fatti da
   illustratori» (`exercise-art.ts`, `ExerciseArt.tsx`): è falso e, su un'app
   pubblica che si vanta di non avere AI dentro, è la frase che fa più danno.
   Non cambia nulla sui diritti — sono opere originali, regolarmente licenziate.
3. **Non sappiamo chi è il licenziatario.** La licenza è nominale, non
   trasferibile, legata a un ordine Lemon Squeezy, e prevede l'obbligo di
   indicare il numero d'ordine su richiesta. Nel repo non c'è traccia di
   livello acquistato, numero d'ordine, versione accettata né intestatario.
   **Domanda per Alessio, prima del pubblico.**

## 2. Figure schematiche — 158 file `.svg` (56 esercizi + 102 gradini)

Prodotte da `scripts/generate-exercise-svg.mjs`, codice di questo repo. Nessun
modello generativo, nessuna immagine di terzi in ingresso, nessun costo,
nessun vincolo. Deterministiche: stesso codice, stesso file. Licenza: quella
del repo. Si rigenerano con `npm run svg`.

## 3. Fonti escluse
Nessun'altra fonte è in uso. Qualunque proposta nuova entra qui con testo,
URL e data di verifica **prima** che un file entri in `src/assets/`.
