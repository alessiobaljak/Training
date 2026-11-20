# RULES_CHANGELOG.md — versioni delle regole

Formato: versione · data · cosa è cambiato · perché · esito `training-quality`.
Voci chiuse più vecchie delle ultime 10 ⇒ `ARCHIVE.md`.

## In produzione oggi

**`e30cdc6` (2026-11-20)**: rilascio A di progressione 4.0, progressi 3.1, consigli
4.0, programmi 2.2-2.3, limiti 1.4 (R18, R16, R17, R15, R14b; A19) **+ rev. 2026-11-20**
(L23, L24, M21, 17.2) **+ D-21 a, D-22 a (R19 a fine seduta), D-23 a**. Prima: `0f3f191`
(rilascio A), `fe85203` (3.0), `a747e09` (R5-R8). Non ancora: R9, rilascio B (R14a/c/d/e,
in corso). Il resto è il codice trascritto con `[IN CODICE]` nei file di metodo.

## Voci aperte

### progressione 4.1 · consigli 4.1 · programmi 2.3 rev. · limiti 1.4 rev. (2026-11-21)
- **Stato.** PROPOSTA, specifica pronta (`reports/2026-11-21-training.md`, T-24…T-27).
- **Cosa.** D-19 b: manubrio successivo esatto da `MANUBRI_KG` (minor: soglia), niente leva con
  peso mai scritto, fuori elenco o in cima; R14d resta `B`. M22: R19 anche in revisione, R10a
  (2)-(3), motivi `tetto` e `manubrio`; R17c punti 3-5. L25: σ′ = stati della chiusura + proposte
  sopra che allungano. L26: nota del circuito 4 (≈ 59′, D5), PROGRAM_RULES §5, `DEVIAZIONI_NOTA`.
- **Perché.** Decisioni di Alessio del 2026-11-20 (D-19 b, D5, M20 residuo); quality 2026-11-20
  `221b2e8` (M22 Medio, L25 e L26 Bassi).
- **Limiti.** Nessuno allentato: passo massimo 2 kg (era un tetto di 2,5), σ′ più stretto.
- **Esito training-quality.** Non ancora valutato.

### progressione 4.0 · progressi 3.1 · consigli 4.0 · programmi 2.2 · limiti 1.4
- **Data.** 2026-11-18, rev. 2026-11-20. **Stato.** Rilascio A e rev. 2026-11-20 in
  produzione (`e30cdc6`); rilascio B in corso.
- **Rev. 2026-11-20** (domande di quality, rapporto 2026-11-20): L23 una data dopo
  oggi ferma R13 (togliere `giorni >= 0`); L24 gradino della seduta = il più alto,
  R14b con voce e seduta allo stato; M21 testo «primo peso scritto»; 16.4 →
  16.4′ + 16.P; 17.2 dal 2 aprile (D-20 b). Nessuna soglia cambiata; tutte
  stringono o correggono testi. D-21 a, D-22 a, D-23 a decise il 2026-11-20, in produzione.
- **Cosa.** R14 (M18): scelta in salita non eseguita ⇒ stato a `stateBefore`,
  record `lapsed`, non conta per R13; R14b leve a fine seduta solo allo stato;
  R14c R10b legge i `lapsed`; R14d peso proposto per il manubrio; R14e peso non
  scritto (L2). R15 (L18, L19): solo una scelta sulla stessa grandezza spiega il
  diario, valore in `(B, T]`; data dell'esecuzione. R16 (L20): famiglia
  `scarico` in R11. R17 (L21): R13 solo con una leva, data più lontana fra R7 e
  R13. R18: minimo della stazione + Δrip × n × lati.
- **Perché.** Quality 2026-11-16 (M18 Medio, L18-L21 Bassi); sessione principale
  (minimo). Giro approvato da Alessio il 2026-11-18.
- **Major.** Record e motivo nuovi (`lapsed`, `decaduta`); R15 sposta date (13.3,
  13.4, B12). Nessuna soglia approvata allentata: R14b, R15 stringono.
- **Esito training-quality (2026-11-20).** GO al push del rilascio A (`4edf751`):
  L18-L21 chiusi, B13 aperto e chiuso; nuovi L23, L24, M19, M20, M21. Rilascio B
  e rev. 2026-11-20: non ancora valutati.

### progressione 3.0 · progressi 3.0 · consigli 3.0 · limiti 1.3
- **Data.** 2026-11-16. **Stato.** In produzione `fe85203`.
- **Cosa.** R10 (A17): revisione nell'ordine delle leve della fine seduta,
  stato completo dal registro (bonus di tempo e pausa), manubri: R10c-0 subito,
  R10c-1 se D-19. R11 (M17): `rimandati` solo con stato cambiato o seduta nuova
  che smentisce. R12 (L15): due date diverse. R13: R13a S2 su 7 giorni, R13b
  (D-4) da decidere. `alMassimo` + `pausa`, `variante`; `rimandati` con motivo;
  `fermi` + `sette-giorni`.
- **Perché.** A17 Alto, M17 Medio, L15 Basso (quality 2026-11-15), D-4; R-1 (S2
  per proposta) trovato leggendo il codice.
- **Major.** Ingresso nuovo (registro), elenchi e motivi nuovi. Nessuna soglia
  approvata allentata. Cambiano atteso 6.4-6.7, 6.10, 6.11, 8.19, 8.27.
- **Esito training-quality (2026-11-16).** GO al push di `cf7588a`: A17, M17,
  L15 chiusi, B12 (S2 per proposta) aperto e chiuso; nuovi M18, L18-L22.

### progressione 2.0 · progressi 2.0 · consigli 2.0 · programmi 2.1 · limiti 1.2
- **Data.** 2026-11-14
- **Stato.** PROPOSTA, specifica pronta da implementare. Nessun file di `src/`
  toccato. Soglie di riferimento **approvate** (S1, S3-S6, 2026-11-12).
- **Cosa.** R5 una regola di avanzamento per revisione e fine seduta (tempo `===
  true` su tutte le sedute, 3 serie vere, niente aumenti in scarico e in
  rientro; verdetti `rifai-al-tempo-giusto`, `rispondi-sul-tempo`). R6 zavorra
  solo a variante esaurita e con test ≥ 8 trazioni / 10 dip, anche a fine seduta.
  R7 un gradino eseguibile ogni 14 giorni dalla prima seduta al gradino attuale.
  R8 2 sedute e 3 serie vere per un verdetto, voci solo allo stato attuale
  (gradino e carico). R9 rientro dopo ≥ 14 giorni: 4 sedute e ≥ 7 giorni a giri
  dimezzati, tutte le stazioni, ritest proposto; R9b ritest che può solo far
  scendere. L9 allineato: 7 → 14 giorni sui gradini, 21 → 14 sul rientro.
  Sostituiti T1 (sui gradini), T2, T3, T4. La parte di T1 sulle altre leve resta
  proposta: **nessun limite allentato** senza decisione.
- **Perché.** A2, A3, A4, M1, M4 Bloccanti per decisione di Alessio (2026-11-12).
- **Strutturali (major).** Verdetti ed elenchi nuovi; ingressi nuovi (`today`,
  storico delle sedute, stato di rientro); conteggio delle serie cambiato.
- **Revisione 2026-11-15 (D-16 decisa da Alessio).** R8 riscritta: le ultime 2
  sedute chiuse allo stesso gradino e carico, entrambe nei 14 giorni che
  chiudono la settimana rivista (`weekEnd`); stati `in-corso`/`aperta`/`scaduta`;
  elenco `rimandati`; stesso range nella coppia. Allineati R5 E1-E5 (E4 sulla
  coppia: nessun aumento da una seduta di scarico della settimana prima), base
  di 5.x/6.x, 7.11-7.12, nuovi 5.13-5.15 e 8.13-8.28; testi ADVICE §7; L9.
  S4 invariata nei numeri. **Fine seduta invariata.** Resta 2.0: la versione non
  è mai stata rilasciata.
- **Esito training-quality (2026-11-15).** GO al push: A2, A3, A4, M1 chiusi;
  lettura di S4 OK con la riserva L15; nuovi A17 (Alto) e M17 (Medio). R5-R8 in
  produzione da `a747e09`; R9 no.

### programmi 2.0 · progressione 1.1 · metodo 1.1 · progressi 1.1 · schema 1.1 · limiti 1.1
- **Data.** 2026-11-12
- **Stato.** PROPOSTA. Nessun file di `src/` toccato.
- **Cosa.** R1 gradino di partenza dal test (PROGRAM_RULES §3, chiude B5:
  trazioni M=4 ⇒ gradino 1, hip thrust ⇒ 2). Salto dei gradini solo eccentrici
  nei range fissi (PROGRESSION §5, T2). R2 transizione 15" alla giunzione B→F
  (PROGRAM_RULES §2) e limite L14 (= S9). R3 volume: finitura e decompressione
  fuori; fascia per gruppo prioritario/mantenimento, braccia 32-40; Progressi
  mostra fatte/previste/fascia (METHOD §3, PROGRESS_REVIEW §5). R4 test
  richiesti calcolati dal programma: 7 su 9; «non eseguito» al posto di 0.
- **Perché.** Richiesta della sessione principale dopo la revisione totale;
  A8, M10, I3 del rapporto quality del 2026-11-09.
- **Vincolo rispettato.** Nessun esercizio e nessun ordine di stazione cambiato:
  gli scambi sono domande per Alessio.
- **Esito training-quality.** Non ancora valutato.

### metodo 1.0 · programmi 1.0 · progressione 1.0 · progressi 1.0 · consigli 1.0 · schema 1.0 · limiti 1.0
- **Data.** 2026-11-08
- **Stato.** PROPOSTA, in attesa di approvazione. Nessuna riga di codice toccata.
- **Cosa.** Primo avvio: audit del metodo in produzione e prima specifica
  scritta. Trascrizione delle regole esistenti più le proposte marcate
  `[PROPOSTA]`, tenute separate riga per riga.
- **Perché.** L'app è stata costruita prima della sua specifica. Prima di
  aprirla al pubblico serve un testo che dica quali soglie valgono, dove
  stanno, e cosa l'app non fa — soprattutto l'ultima cosa: limiti di sicurezza
  non ne aveva nessuno.
- **Novità con peso.** `limiti 1.0` (BOUNDARIES.md, 13 limiti operativi);
  definizione dello stallo; 5 tetti di progressione mancanti (T1-T4 + zavorra);
  7 campi obbligatori mancanti nella scheda esercizio; regola deterministica di
  sostituzione per attrezzo mancante.
- **Esito training-quality.** Non ancora valutato.
- **Esito release-gate.** Non applicabile: nessuna modifica al prodotto.

## Regola di versionamento

1. Quattro famiglie indipendenti: metodo, programmi, progressione, consigli.
   Più tre di supporto: schema, progressi, limiti. Ognuna ha il suo numero.
2. Cambio di **soglia numerica** ⇒ minor (1.0 → 1.1). Cambio di **struttura**
   di una regola o di un verdetto ⇒ major (1.1 → 2.0). Riformulazione di un
   testo senza effetti su un numero ⇒ patch (1.0 → 1.0.1).
3. Nessuna versione entra in produzione senza: esito di `training-quality`,
   verdetto di `release-gate` con la dimensione corretta, ok esplicito di Alessio.
4. Ogni consiglio prodotto registra la versione delle regole che lo ha generato
   (ADVICE §4.7): uno storico generato da soglie diverse va riletto sapendo quali.
5. Un limite di BOUNDARIES.md non si allenta mai senza una voce qui che dica chi
   lo ha deciso e sulla base di cosa.
