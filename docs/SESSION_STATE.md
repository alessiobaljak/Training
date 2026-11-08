# Dove siamo

Aggiornato: 2026-11-08 · branch `claude/calisthenics-pwa-offline-kor52w`

## Compito in corso
Passo 8 — primo avvio dei subagent. `training-designer`, `exercise-media-lead` e
`training-quality` stanno girando: ognuno crea la propria cartella di memoria e
il proprio rapporto. `release-gate` parte dopo, perché legge
`/quality/SAFETY_CORE.md`, che `training-quality` deve ancora scrivere.

Poi Passo 7, i cinque test che verificano che gli agenti trovino davvero i
difetti. Le fixture vanno costruite **dopo** aver letto il formato di
`SAFETY_CORE.md`, per non doverle rifare.

## Decisioni prese
- Programma attivo: quattro circuiti senza giorni (`src/data/circuit.ts`). Lo
  Shadow (`src/data/program.ts`) è archiviato e si legge solo nel diario.
- Nessuna AI nel prodotto: i consigli sono verdetti deterministici di
  `engine/review.ts`. I file degli agenti sono scritti per questo.
- `exercise-media-lead` è curatore, non generatore: il termine 5 della licenza
  RepDB vieta di usare quelle immagini come riferimento per modelli generativi.
- Si resta su questo branch.
- Le cartelle di memoria le riempiono gli agenti, non la sessione principale:
  riempirle qui toglierebbe l'indipendenza che è il motivo per cui esistono.

## Fatto in questa tappa
- `.claude/agents/` con i quattro subagent, `CLAUDE.md`, `compliance/PENDING.md`.
- `test-fixtures/passo-7/stacco-schiena-curva.svg`: figura tecnicamente
  sbagliata costruita a mano, per il test 3 del Passo 7. Sta fuori da `src/`,
  quindi non entra nel bundle e non rompe i test della libreria.

## Prossimi passi
1. Leggere i tre rapporti, poi lanciare `release-gate`.
2. Costruire le fixture del Passo 7 sul formato di `SAFETY_CORE.md`.
3. `BOUNDARIES.md`: è il buco più grande e il motivo per cui questo setup esiste.
4. Compromessi sui token: proposti, non applicati. Aspettano l'ok di Alessio.
