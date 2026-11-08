# Dove siamo

Aggiornato: 2026-11-08 · branch `claude/calisthenics-pwa-offline-kor52w`

## Compito in corso
Architettura agentica: creati i quattro subagent, `CLAUDE.md` e `compliance/PENDING.md`. Le cartelle di memoria `/training/`, `/media/`, `/quality/`, `/release/` sono volutamente **vuote**: le riempie ciascun agente al suo primo avvio, con il proprio audit.

## Decisioni prese
- Programma attivo: quattro circuiti senza giorni assegnati (`src/data/circuit.ts`). Lo Shadow (`src/data/program.ts`) è archiviato e si legge solo nel diario.
- Nessuna AI nel prodotto: i consigli sono verdetti deterministici di `engine/review.ts`. I file degli agenti sono scritti per questo, non per un'app con un modello.
- `exercise-media-lead` è un curatore, non un generatore: la licenza RepDB (termine 5) vieta di usare quelle immagini come riferimento per modelli generativi.
- Si resta su questo branch.

## Prossimi passi
1. Primo avvio dei quattro agenti (richiede che Claude Code abbia caricato `.claude/agents/`).
2. `BOUNDARIES.md` di `training-designer`: è il buco più grande e il motivo per cui questo setup esiste.
3. Compromessi sui token: proposti, non applicati. Aspettano l'ok di Alessio.
