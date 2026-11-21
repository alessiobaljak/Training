# LICENSING.md — fonti delle immagini e loro termini

L'app diventerà pubblica. Una fonte senza uso commerciale chiaro non si usa.

## 1. RepDB — 81 file `.webp` in `src/assets/exercises-repdb/` (erano 91; 6 tolti il 2026-11-21 perché senza usi, poi `trx-row` e `inverted-row` in `db2544e`, T-37)

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

## 2. Figure schematiche — 174 file `.svg` (72 esercizi + 102 gradini)

Prodotte da `scripts/generate-exercise-svg.mjs`, codice di questo repo. Nessun
modello generativo, nessuna immagine di terzi in ingresso, nessun costo,
nessun vincolo. Deterministiche: stesso codice, stesso file. Licenza: quella
del repo. Si rigenerano con `npm run svg`.
**Prove di stile del 2026-11-18** (`STYLE_TRIALS.md`): stesso generatore,
stesse pose, colori da gettoni CSS scritti qui. Nessuna fonte nuova, nessuna
foto RepDB come riferimento (termine 5), nessun file in `src/assets/`.

## 3. Figure generate da testo con un modello AI (fonte 3)

**Decisione di Alessio, 2026-11-21** (`docs/SESSION_STATE.md`): le figure
mancanti si generano **a design time**, **partendo solo dal testo**, e ognuna
entra nell'app solo dopo la sua approvazione. In produzione nessuna
generazione (CLAUDE.md, regola 2). Genera la sessione principale; il media
lead non genera, scrive stile, prompt, checklist e registro.

### 3.1 Modelli verificati — 2026-11-21
Verifica della sessione principale sui metadati dell'Hub, **rifatta qui lo
stesso giorno** su API dell'Hub (`/api/models/<id>`), model card e file del
repo. Vale la revisione indicata: una revisione nuova si riverifica.

| modello | URL | testo della licenza | revisione | accesso |
|---|---|---|---|---|
| `Qwen/Qwen-Image` | https://hf.co/Qwen/Qwen-Image | `license: apache-2.0` nel model card; file `LICENSE` nel repo con il testo integrale «Apache License Version 2.0, January 2004»; README: «Qwen-Image is licensed under Apache 2.0.» | `75e0b4b` (modificato 2025-08-18) | libero |
| `Tongyi-MAI/Z-Image-Turbo` | https://hf.co/Tongyi-MAI/Z-Image-Turbo | `license: apache-2.0` nel model card. **Nessun file LICENSE nel repo del modello** e nessuna sezione licenza nel README | `f332072` (2026-01-30) | libero |
| `black-forest-labs/FLUX.1-schnell` | https://hf.co/black-forest-labs/FLUX.1-schnell | `license: apache-2.0`; README: «Released under the `apache-2.0` licence, the model can be used for personal, scientific, and commercial purposes.» | `169573f` (2026-11-19) | gate automatico: «If you are affiliated with a company, we may email you about our models, products and commercial licensing» |
| `Qwen/Qwen-Image-Edit-2511` | https://hf.co/Qwen/Qwen-Image-Edit-2511 | `license: apache-2.0`, `pipeline_tag: image-to-image`; README: «Qwen-Image is licensed under Apache 2.0.» | `6f3ccc0` (2025-12-23) | libero; solo per §3.4 |

**Esclusi** (verificati qui, stessa data e stesso metodo): `FLUX.1-dev`
(`45d95c4`), `FLUX.1-Krea-dev` (`7ecf4c6`), `FLUX.1-Kontext-dev` (`5b73edc`):
`license: other`, `license_name: flux-1-dev-non-commercial-license`. Non
commerciale ⇒ non si usa, nemmeno per prova.

### 3.2 Cosa dice Apache-2.0, per noi
- §2: licenza perpetua, mondiale, gratuita, irrevocabile di uso, riproduzione
  e modifica del *Work* (pesi e codice), commerciale compreso.
- **Nessuna condizione sugli output.** Gli obblighi di §4 (copia della
  licenza, NOTICE) scattano solo se ridistribuiamo il modello: non lo facciamo.
- §6: nessun diritto sui marchi, salvo «reasonable and customary use in
  describing the origin of the Work». Una riga di credito descrittiva va bene.
- §7–§8: nessuna garanzia, nessuna manleva. Se un'immagine somiglia a una
  persona reale o a un'opera altrui, il rischio è nostro: checklist §5, G8.
- Le immagini generate senza apporto creativo umano probabilmente **non sono
  protette da diritto d'autore** (UE e USA). Le usiamo liberamente; non
  possiamo impedire che altri le copino. Non si scrive «©» sulle immagini.

### 3.3 Quale si ammette, e a quali condizioni
**Modello della libreria: `Qwen/Qwen-Image` @ `75e0b4b`. Uno solo.** Lo stile
lo fanno modello e prompt insieme: due modelli fanno due librerie. Perché lui:
1. licenza documentata meglio dei tre (file LICENSE nel repo, non solo un'etichetta);
2. accetta il prompt negativo (true CFG): Z-Image-Turbo e FLUX.1-schnell
   lavorano a guidance 0 e lo ignorano, e il negativo è dove si chiede
   «niente testo, niente loghi, niente dita in più»;
3. ha un modello di modifica della stessa famiglia, Apache-2.0 (§3.4);
4. nessun gate che cede i contatti di chi lo scarica.

**Riserva: `Tongyi-MAI/Z-Image-Turbo` @ `f332072`**, solo se il pilota su
Qwen-Image non passa la checklist; allora passa a lui **tutta** la libreria.
Prima va chiuso il residuo: la licenza è solo un'etichetta nel model card,
manca il file nel repo del modello (cercarlo nel repo del codice).
**`FLUX.1-schnell`: licenza buona, non ammesso** alla libreria: guidance 0
(niente negativo), prompt tagliato a 256 token, il più vecchio dei tre, gate
che cede i contatti.

Condizioni, tutte e per ogni immagine:
- **C1 Solo testo in ingresso.** Nessun file RepDB: né come immagine, né come
  riferimento, né **descritto nel prompt** («like the existing images»,
  «same style as the library», «blue background», nomi di file o di esercizi
  RepDB, la parola RepDB). Nessuna foto di terzi, nessuna foto di una persona
  reale (Alessio compreso), nessun nome di persona o di marchio nel prompt
  (TRX → «suspension trainer»).
- **C2 Il prompt nasce dalla scheda del designer**, non dall'immagine che
  sostituisce. Chi scrive o riempie un prompt non ha davanti una foto RepDB:
  il media lead non guarda foto RepDB nell'invocazione in cui scrive stile o
  prompt (separazione voluta dal 2026-11-21).
- **C3 Tutto registrato**: modello e sha, passi, guidance, misure, seme,
  prompt e negativo **esatti** in `media/prompts/<chiave>.md`; la riga di
  LIBRARY.md li cita. Stesso modello, stessi parametri, stesso seme.
- **C4 Niente riscrittura del prompt.** La Space ufficiale di Qwen-Image ha
  «Prompt Enhance» **acceso per default**: manda il prompt a un LLM esterno
  (DashScope, `qwen-plus`) che lo riscrive e aggiunge «Ultra HD, 4K,
  cinematic composition». Va spento, e il seme va fissato («Randomize seed»
  è acceso per default). Il prompt registrato è quello eseguito.
- **C5 Dove gira si registra**: in locale con `diffusers`, oppure Space o
  provider con id e sha. Un servizio ospitato aggiunge i suoi termini agli
  output: si leggono e si scrivono qui **prima** del primo file. Uno strumento
  che non dichiara quale modello esegue (per esempio un MCP «Flux1») non si
  usa: se esegue FLUX.1-dev o Krea-dev è fuori licenza. **Per il pilota: chiusa, §3.5.**
- **C6 Nessun altro modello nella catena** senza passare da qui: niente
  upscaler, «face restore» (CodeFormer ha licenza non commerciale),
  rimozione dello sfondo, inpainting. Ritaglio, ridimensionamento e
  compressione con strumenti deterministici (`cwebp`, `sharp`) sì.
- **C7 Trasparenza.** L'app dice che queste immagini sono generate con AI e
  approvate da Alessio, accanto al credito RepDB (che va corretto per lo
  stesso motivo, §1 punto 2). Nel file, consigliato, XMP con IPTC
  `DigitalSourceType = trainedAlgorithmicMedia`. Gli obblighi dell'AI Act
  (art. 50) per chi pubblica contenuti generati: **NON VERIFICATI** qui, vanno
  a `compliance/` prima del rilascio pubblico.
- **C8 Approva Alessio, immagine per immagine**, dopo la checklist
  (REVIEW_CHECKLIST §5) e training-quality.

### 3.4 Il fotogramma di partenza come ingresso per quello di arrivo
**Per la licenza sì**, a quattro condizioni. Il termine 5 vincola i file
RepDB, non le nostre immagini: un fotogramma 1 generato da solo testo con le
condizioni qui sopra è nostro e può fare da ingresso. **La scelta resta di
Alessio**, perché è lui che ha detto «partendo solo dal testo».
- **E1** L'ingresso è un fotogramma 1 registrato in LIBRARY.md e già passato
  dalla checklist: un difetto del primo si copia nel secondo.
- **E2** Mai un'immagine che ha toccato RepDB: nessun collage, ritaglio,
  ritocco, nessun «falla come questa».
- **E3** Il modello di modifica è ammesso: `Qwen-Image-Edit-2511` @ `6f3ccc0`
  sì; `FLUX.1-Kontext-dev` no (non commerciale).
- **E4** La riga del fotogramma 2 dice `E` e il file d'ingresso.
Nota tecnica: l'image-to-image dello stesso modello di testo non serve — a
forza bassa la posa non cambia, a forza alta cambia la persona. Ordine: prima
il dittico (T2, un prompt, due pannelli: la persona è una per costruzione e
resta solo testo); E solo se il dittico fallisce.

### 3.5 Servizio del pilota — C5 chiusa il 2026-11-21
Fatti della sessione principale, **riverificati qui** lo stesso giorno (API
dell'Hub e `app.py` alla revisione indicata):
- **Space `mcp-tools/Qwen-Image` @ `bce5b194bdfde8c1541ab9cc74c070ec3b076d57`**
  (RUNNING, modificata 2026-10-05), invocata con lo strumento MCP
  `dynamic_space`. Non è la Space ufficiale di Qwen.
- `app.py`: `QwenImagePipeline.from_pretrained("Qwen/Qwen-Image")` **senza
  revisione**, cioè il ramo main, oggi `75e0b4be04f60ec59a75f475837eced720f823b6`
  = quella ammessa (§3.3).
- C4: `generate_image` non chiama il «prompt polisher» (`rewrite` è definita
  ma mai chiamata; README: «This version does not include the 'prompt
  polisher'»). Seme, `randomize_seed` (default False nella funzione) e
  negativo sono parametri. `true_cfg_scale = guidance_scale` (default 4,0),
  guidance distillata 1,0. Passi: default 30, massimo 50; la docstring dice
  allo strumento di usarne 16 «solo se richiesto». Misure: 1:1 → 1328×1328,
  16:9 → 1664×928, 3:4 → 1104×1472, 4:3 → 1472×1104.
  `max_sequence_length` non passato: 512 token (STYLE_GUIDE §8.7, ≤ 360 parole).
- **Termini di Hugging Face** (https://huggingface.co/terms-of-service,
  Effective Date 15 settembre 2022), «Your Content»: «You own the Content you
  create!»; licenza a HF «worldwide, royalty-free and non-exclusive … to
  provide Services». Nessun limite all'uso commerciale degli output; i
  termini non nominano Space né output generati. **Content Policy**
  (https://huggingface.co/content-policy, Effective Date 10 aprile 2025),
  letta qui: vieta contenuti illeciti, d'odio, sessuali senza consenso,
  violazioni di privacy e proprietà intellettuale; niente che tocchi foto di
  esercizi di una persona inventata. **Supplemental Terms e Privacy Policy:
  NON VERIFICATI** — da leggere prima che il primo file entri in `src/assets/`.

**Condizioni d'uso di questa Space** (oltre a C1–C8):
- **S1** Ogni chiamata passa **esplicitamente**: `seed`, `randomize_seed=False`,
  `negative_prompt` (il nostro, STYLE_GUIDE §8.7), `guidance_scale=4.0`,
  `num_inference_steps=50`, `aspect_ratio` (`16:9` per T2, `1:1` per T1).
  Un parametro lasciato al default (30 o 16 passi) è un'esecuzione diversa.
- **S2** Prima di ogni lotto si ricontrollano lo sha della Space e lo sha di
  `Qwen/Qwen-Image` main. Se uno dei due cambia: ci si ferma e si riverifica
  `app.py` e la licenza. La Space non fissa la revisione del modello.
- **S3** Si registra in «Esecuzioni» del prompt: Space@sha, modello@sha,
  parametri effettivi stampati dalla Space (`Seed: … Steps: … Guidance: …`).
- **S4** Il file si scarica subito dall'URL restituito; i grezzi restano
  fuori dal repo, i finiti in `media/pilot/` (non in `src/assets/`).

## 4. Fonti escluse
Nessun'altra fonte è in uso. Escluse per licenza: FLUX.1-dev, FLUX.1-Krea-dev,
FLUX.1-Kontext-dev (§3.1). Strumenti MCP esclusi (sessione principale,
2026-11-21): «Qwen-Image-2.1-Turbo» (Space `hugging-apps/qwen-qwen-image-2-1-turbo`,
modello `Qwen/Qwen-Image-2.1-Turbo`, «Qwen RESEARCH LICENSE», «Research and
evaluation use only»); «Flux1» gr1 (Krea dev) e gr4 (Kontext dev), non
commerciali. Qualunque proposta nuova entra qui con testo, URL e
data di verifica **prima** che un file entri in `src/assets/`.
