# 2026-11-21 — Fonte 3: foto generate da testo

Richiesta della sessione principale dopo la decisione di Alessio (2026-11-21):
figure mancanti generate a design time **da solo testo** con un modello AI,
ognuna approvata da lui; «non voglio gli omini». Genera la sessione
principale; il media lead definisce licenza, stile, prompt, checklist e
registro. Nessuna immagine RepDB è stata guardata in questa invocazione
(vincolo della richiesta e condizione C2, vedi Licenze).

### Riepilogo
- **Ammesso un modello solo: `Qwen/Qwen-Image` @ `75e0b4b`** (Apache-2.0, file
  LICENSE nel repo). Riserva `Z-Image-Turbo` @ `f332072`; `FLUX.1-schnell`
  ha la licenza giusta ma non è ammesso (niente negativo, 256 token, gate che
  cede i contatti). Esclusi FLUX.1 dev, Krea dev e Kontext dev (non
  commerciali, verificati anche qui). Otto condizioni C1–C8 (LICENSING §3.3).
- **Fotogramma 1 come ingresso per il 2: sì per la licenza**, con
  `Qwen-Image-Edit-2511` @ `6f3ccc0` (Apache-2.0) e quattro condizioni (E1–E4);
  la scelta resta di Alessio. Strada proposta per prima: il **dittico** (un
  prompt, due pannelli), che resta solo testo.
- **Stile nuovo, da zero** (STYLE_GUIDE §8): foto realistica, un uomo sui
  35 anni sempre uguale, maglietta blu scuro e pantaloncini grigio medio
  aderenti, fondale grigio chiaro con ombre di contatto, corpo intero, 768×768
  webp ≤ 60 KB in `src/assets/exercises-ai/<chiave>-1.webp` / `-2.webp`.
  Modello di prompt inglese con segnaposto e dizionario degli attrezzi.
- **Checklist G0–G11** per le foto generate (REVIEW_CHECKLIST §5).
- **Registro**: righe 19 e 182-183 allineate a `3b548e4`, e con loro altre 39
  righe rimaste indietro rispetto al codice (R12, nuovo). Formato delle righe
  «generata AI» scritto in testa a LIBRARY.md.
- **Anelli per S2 A3: non così.** Le foto si recuperano da `3b548e4^` (non
  da `22f3d31^`, che non le contiene), ma la voce è dell'esercizio, non del
  blocco: serve prima la scheda del designer.
- **Catalogo RepDB per i 32: NON COPERTO.** Un candidato fra i file che
  abbiamo già: `hammer-curl` per `curl-martello-manubri`.
- **Pilota pronto in bozza**: `media/prompts/{kb-swing, corda-battaglia-slam,
  apertura-anche, respirazione-360}.md`, blocchi di stile già espansi;
  mancano solo posa e «cosa si legge» dalle schede del designer.

### Stato della libreria (fonti, copertura, verificate, da rifare)
Contato sul repo a `88da16a`.

| | oggi |
|---|---|
| esercizi | 72: 26 con foto RepDB, 38 con la sola figura SVG, 8 senza immagine |
| gradini | 102: 35 con foto, 55 con la sola figura, 12 senza immagine |
| file RepDB | 85 (erano 91), tutti usati |
| SVG | 174, invariati; Alessio non li vuole |
| foto generate | 0 (pilota di 4 esercizi in bozza) |
| LIBRARY.md | 309 righe: 25 verificate, 36 da rifare, 206 da verificare, 42 ritirate, **0 approvate** |
| sedute attive | 39 esercizi distinti, 7 con foto, **32 senza** (elenco in COVERAGE §6) |

### Immagini verificate (esito della checklist, motivo degli scarti)
**Nessuna immagine guardata oggi.** Le foto generate non esistono ancora; le
foto RepDB non si guardano nella stessa invocazione in cui si scrivono stile
e prompt (C2). Lavoro sul registro, senza aprire immagini:
- **Allineamento a `3b548e4`** (richiesto): ex riga 19, oggi 34 (SVG di
  `rematore-inverso-trx-piedi-rialzati`) → `ritirata`, l'app non mostra
  nessuna immagine per quell'esercizio; ex righe 182-183, oggi 199-200
  (`rings-inverted-row`) → `ritirata`, file tolti dal repo e recuperabili da
  `3b548e4^`. Le righe si sono spostate per l'intestazione nuova e per le due
  righe `trx-row` (oggi 197-198).
- **Allineamento completo** (R12): il registro era rimasto indietro anche su
  `50793fd` e `c8964ff`. 22 righe RepDB → `ritirata` con il commit; 20 SVG
  nascoste da `FIGURE_SENZA_IMMAGINE` → `ritirata`; aggiunte le 2 righe
  `trx-row` di `rematore-inverso-trx` (`da verificare`: attrezzo e
  inclinazione misurati stamattina, coerenti con scheda e test, non con la
  nota di A3). `media/scripts/library-drift.mts` ora lo controlla: oggi non
  stampa niente.
- **Regola di scarto**: il punto 1 (corrispondenza) non aveva una regola
  scritta, pur essendo applicato così; aggiunta (REVIEW_CHECKLIST §2).

### Da sviluppare (per la sessione principale): correzioni al generatore con criteri di accettazione
Il generatore SVG non si tocca: Alessio non vuole le figure. Il lavoro passa
alla fonte 3.

**S1 — Pilota (4 esercizi).**
1. Riempire i segnaposto di `media/prompts/<chiave>.md` **dalla scheda del
   designer** (`frames`, `equipment`); non toccare i blocchi fissi.
2. Generare con `Qwen/Qwen-Image` @ `75e0b4b`, 50 passi, `true_cfg_scale`
   4,0, semi 11, 22, 33, 44; T2 a 1664×928, T1 a 1328×1328. In locale
   `max_sequence_length=1024`. Sulla Space ufficiale: «Prompt Enhance»
   spento, «Randomize seed» spento, rapporto 16:9 o 1:1 (il negativo lì è
   fisso).
3. Grezzi fuori dal repo (scratchpad); file finiti (taglio, 768×768, webp q80,
   ≤ 60 KB) in `media/pilot/` — **non in `src/assets/`**.
Accettazione: per ogni seme una riga in «Esecuzioni» del file del prompt
(data, servizio@sha, seme, file); prompt eseguito identico a quello
registrato; nessun file in `src/assets/`; nessun altro modello nella catena.
Poi il media lead applica G0–G11.

**S2 — Pubblicazione, solo dopo l'approvazione di Alessio.**
- `src/assets/exercises-ai/`, tabella delle voci accanto a `REPDB_ART` con
  modello e seme; una scheda, una fonte (`ExerciseArt`).
- `art.test.ts`: ogni file usato, nome `<chiave>-1|2.webp`, 768×768, ≤ 60 KB.
- Credito visibile: «immagini generate con AI e approvate»; correggere la
  frase «illustrazioni vere, fatte da illustratori» (`ExerciseArt.tsx`),
  falsa già per RepDB (LICENSING §1, punto 2).
Accettazione: verify, smoke, offline verdi; file nella cache offline;
`release-gate` M.

**S3 — Anelli per S2 A3**, solo dopo la decisione del designer (punto 5): il
file si recupera **insieme** alla voce che lo usa, altrimenti fallisce il test
«mai usate» (termine 3):
`git show 3b548e4^:src/assets/exercises-repdb/rings-inverted-row-start.webp`
(e `-peak`).

**S4 — facoltativo**: XMP con IPTC `DigitalSourceType =
trainedAlgorithmicMedia` (`webpmux -set xmp`), circa 1 KB per file.

### Licenze
**1. Fonte nuova (LICENSING §3).** Verificata qui il 2026-11-21 su API
dell'Hub, model card e file del repo, oltre alla verifica della sessione
principale:

| modello | licenza | revisione | esito |
|---|---|---|---|
| Qwen/Qwen-Image | apache-2.0 + file LICENSE integrale | `75e0b4b` | **ammesso, modello della libreria** |
| Tongyi-MAI/Z-Image-Turbo | apache-2.0 solo nel model card | `f332072` | riserva (chiudere il LICENSE) |
| black-forest-labs/FLUX.1-schnell | apache-2.0 | `169573f` | licenza buona, non ammesso |
| Qwen/Qwen-Image-Edit-2511 | apache-2.0 | `6f3ccc0` | solo per E, se Alessio lo ammette |
| FLUX.1-dev / Krea-dev / Kontext-dev | flux-1-dev-non-commercial-license | — | esclusi |

Condizioni C1–C8, in breve: solo testo; prompt dalla scheda, mai da una foto;
tutto registrato (modello, sha, seme, prompt); niente riscrittura del prompt
(la Space ufficiale di Qwen-Image la accende di default e manda il prompt a
DashScope); servizio registrato con i suoi termini; nessun altro modello
nella catena (niente upscaler o «face restore»); trasparenza in app;
approvazione di Alessio immagine per immagine.

**Termine 5 RepDB.** Il prompt non nomina e non descrive RepDB né lo stile
della libreria. Lo stile §8 è scritto da zero a partire da criteri funzionali
(contrasto, articolazioni visibili, contatti con il pavimento, contenitore
dell'app). La riga «aspetto» di RepDB in STYLE_GUIDE §1 resta per la
convivenza ed è marcata «non entra mai in un prompt».

**2. Fotogramma 1 come ingresso per il 2.** Sì per la licenza: il termine 5
vincola i file RepDB, non le nostre immagini. Condizioni: E1 il fotogramma 1
è registrato e verificato; E2 non ha mai toccato RepDB; E3 il modello di
modifica è ammesso (Edit-2511 sì, Kontext dev no); E4 la riga del fotogramma
2 cita l'ingresso. Nota tecnica: l'image-to-image del modello di testo non
basta (o non cambia la posa o cambia la persona); serve il modello di
modifica. Prima il dittico.

**3. Diritti sugli output.** Apache-2.0 non pone condizioni sugli output.
Probabilmente non sono protetti da diritto d'autore: li usiamo, ma non
possiamo impedire che altri li copino.

**4. Ancora aperto da prima**: licenziatario e numero d'ordine RepDB
(LICENSING §1, punto 3).

### Rischi (tecnica, licenze, coerenza)
- **Tecnica — alto.** Una foto realistica sbagliata è più credibile di un
  omino sbagliato. I difetti tipici dei modelli cadono dove la tecnica si
  decide: mani e presa, gomiti e ginocchia, lombare nello swing, attrezzi
  impossibili (kettlebell a due maniglie, corda con tre capi). G2–G5 e la
  verifica di training-quality sono il filtro; il pilota guarda anche i semi
  scartati per capire se il prompt regge.
- **Licenze — medio.** La catena di provenienza è la parte fragile: un
  prompt riscritto, una Space che esegue un altro modello, un upscaler, un
  confronto con una foto RepDB. G0 scarta senza appello. Gli obblighi
  dell'AI Act (art. 50) sono **NON VERIFICATI**: vanno a `compliance/` prima
  del rilascio pubblico.
- **Coerenza — medio.** Per un periodo la libreria avrà due aspetti (RepDB e
  foto generate). La stessa persona fra esercizi diversi è garantita solo
  dalla descrizione, non dal modello: il pilota dice quanto varia.
- **Peso.** 32 esercizi × 2 × ≤ 60 KB ≤ 3,8 MB nella cache offline, contro
  1,5 MB di RepDB. Da misurare sul pilota (obiettivo 35–50 KB).
- **Registro.** Restava indietro rispetto al codice (R12): ora c'è uno script.

### Decisioni per Alessio
1. **Modello**: Qwen-Image per tutta la libreria, Z-Image-Turbo solo come
   riserva e mai mescolati. Va bene?
2. **Fotogramma 1 come ingresso per il 2** (Qwen-Image-Edit-2511): lo
   ammetti? Raccomandato sì, solo se il dittico non tiene la stessa persona.
3. **Soggetto**: per il pilota un uomo sui 35 anni, sempre lo stesso. Per il
   pubblico: lo stesso, una donna, o tutti e due (uno per esercizio, mai
   mescolati nello stesso esercizio)?
4. **Foto realistica** invece che illustrazione: l'anatomia dei modelli è
   migliore in foto, e un'illustrazione rischierebbe di avvicinarsi allo
   stile RepDB. Confermi?
5. **Le 26 foto RepDB**: si tengono (due aspetti nella libreria) o, dopo il
   pilota, si rigenerano anche quelle per uniformità? Raccomandato: prima i
   32 senza foto, poi decidere guardando il pilota accanto.
6. **Dove si genera**: in locale (tutto controllabile), Space ufficiale (con
   «Prompt Enhance» spento, negativo fisso) o un provider (termini da
   leggere prima)?

### Domande aperte
1. **Designer — `kb-swing`**: due fotogrammi (fondo del backswing e picco)
   invece dei tre dello schema? Tre affiancati sul telefono sono larghi
   110 px.
2. **Designer — `apertura-anche`**: il cue descrive l'affondo con il
   ginocchio dietro a terra, la `videoQuery` dice «couch stretch» (piede
   dietro alzato contro un muro). Quale delle due? Il prompt segue il cue
   finché non risponde.
3. **Designer — S2 A3 agli anelli**: la nota cambia attrezzo (anelli),
   presa (larga) e traiettoria dei gomiti («verso l'esterno», contro il cue
   «lungo il busto»). Per la regola dell'archetipo è un altro esercizio.
   Scheda nuova con il suo slug (lo storico di A3 si divide), oppure si
   cambia la scheda `rematore-inverso-trx` (ma il test `inverted-row-trx`
   resta al TRX e mostrerebbe gli anelli)? Le foto `rings-inverted-row`
   vanno bene per attrezzo e piedi a terra; **larghezza della presa, gomiti e
   inclinazione non sono nel registro**. Si guardano, contro la scheda nuova,
   in un'invocazione che non scrive prompt. Se la presa non è larga, la
   foto si genera.
4. **Sessione principale**: con quale servizio si genera? Se è uno
   strumento MCP (per esempio «Flux1»), quale Space o modello esegue, a quale
   revisione? Se esegue FLUX.1-dev o Krea-dev è fuori licenza.
5. **Sessione principale / designer**: per il pilota il designer scrive
   `frames` ed `equipment` solo per i quattro, o per tutti i 32? Senza
   `frames` le bozze del prompt restano proposte del media lead.
6. **Designer**: `curl-martello-manubri` può prendere `hammer-curl`, che è
   già sulla voce `curl-elastico-presa-neutra` con lo stesso gesto? È
   l'unico dei 32 che ha già una foto possibile fra i nostri 85 file.

### Aggiornamento, stessa sera: domanda 4 chiusa
La sessione principale ha indicato la Space `mcp-tools/Qwen-Image` @
`bce5b19`; riverificata qui (LICENSING §3.5): carica `Qwen/Qwen-Image` main =
`75e0b4b`, non chiama il prompt polisher, seme e negativo sono parametri.
**C5 chiusa per il pilota**, con S1–S4: parametri sempre espliciti (50 passi,
non il default 30), sha di Space e modello ricontrollati a ogni lotto, file
in `media/pilot/`. Restano **NON VERIFICATI** Supplemental Terms e Privacy
Policy di Hugging Face: da leggere prima che un file entri in `src/assets/`.
Esclusi anche gli strumenti MCP «Qwen-Image-2.1-Turbo» (licenza di ricerca)
e «Flux1» gr1/gr4 (non commerciali).
