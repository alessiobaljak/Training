import { useState } from 'react';
import { repository } from '../../db/repository.ts';
import { pendingVerdicts, reviewDecisionId, reviewWeek } from '../../engine/review.ts';
import { navigate } from '../router.ts';
import {
  useExerciseStates,
  useLatestTests,
  useSessions,
  useSuggestions,
} from '../hooks/useData.ts';
import { Badge, Button, Card, Notice, Screen, SectionTitle } from '../components/primitives.tsx';
import type { ExerciseSlug, ExerciseState } from '../../types/index.ts';
import type { WeeklyVerdict } from '../../engine/review.ts';

/**
 * Revisione di fine settimana.
 *
 * Il motore propone, qui si decide. Come a fine seduta niente si applica da
 * solo: la differenza è che questa schermata guarda la settimana intera e
 * torna finché non è stata guardata, invece di passare una volta sola alla
 * fine di una seduta e non tornare più.
 */

export function ReviewScreen({ week }: { readonly week: number }) {
  const sessions = useSessions();
  const states = useExerciseStates();
  const tests = useLatestTests();
  const suggestions = useSuggestions();

  const [appenaDeciso, setAppenaDeciso] = useState<ReadonlySet<string>>(new Set());

  if (sessions === undefined || states === undefined || tests === undefined || suggestions === undefined) {
    return (
      <Screen title={`Settimana ${String(week)}`}>
        <p className="text-dim">Carico…</p>
      </Screen>
    );
  }

  const stateMap = new Map<ExerciseSlug, ExerciseState>(
    states.map((state) => [state.exercise, state]),
  );
  const review = reviewWeek({ week, sessions, states: stateMap, tests });

  const giaDeciso = new Set([
    ...suggestions.map((record) => record.id),
    ...appenaDeciso,
  ]);
  const aperti = pendingVerdicts(review, giaDeciso);

  const decidi = (verdict: WeeklyVerdict, accettato: boolean): void => {
    const id = reviewDecisionId(week, verdict.exercise);
    if (accettato) void repository.saveExerciseState(verdict.stateAfter);
    void repository.recordSuggestion({
      id,
      date: new Date().toISOString().slice(0, 10),
      sessionLogId: id,
      exercise: verdict.exercise,
      blockCode: 'revisione',
      lever: verdict.lever,
      decision: accettato ? 'accepted' : 'postponed',
      stateBefore: verdict.stateBefore,
      stateAfter: accettato ? verdict.stateAfter : verdict.stateBefore,
    });
    setAppenaDeciso((current) => new Set(current).add(id));
  };

  return (
    <Screen
      title={`Settimana ${String(week)} chiusa`}
      subtitle={`${String(review.sessionsCounted)} sedute · ${String(review.setsCounted)} serie lette`}
      onBack={() => { navigate({ name: 'home' }); }}
    >
      <div className="space-y-4">
        {review.sessionsCounted === 0 ? (
          <Notice tone="warn">
            Nessuna seduta chiusa in questa settimana. Senza serie registrate non c’è niente da
            rivedere: la revisione legge quello che hai scritto, non quello che era in programma.
          </Notice>
        ) : null}

        {aperti.length === 0 && review.sessionsCounted > 0 ? (
          <Notice tone="good">
            Niente da cambiare per la settimana prossima. I numeri di questa settimana stanno dove
            devono stare: si continua con lo stesso carico e gli stessi gradini.
          </Notice>
        ) : null}

        {aperti.map((verdict) => (
          <Card key={verdict.exercise} tone={verdict.kind === 'scendi-di-livello' ? 'warn' : 'default'}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-lg font-semibold">{verdict.title}</p>
              <Badge
                tone={
                  verdict.kind === 'sali-di-livello'
                    ? 'good'
                    : verdict.kind === 'scendi-di-livello'
                      ? 'warn'
                      : 'accent'
                }
              >
                {verdict.exerciseName}
              </Badge>
            </div>

            <p className="tabular mt-3 text-sm leading-relaxed text-dim">{verdict.evidence}</p>
            <p className="mt-3 text-sm leading-relaxed">{verdict.change}</p>
            {verdict.caution === null ? null : (
              <p className="mt-3 text-sm leading-relaxed text-dim">{verdict.caution}</p>
            )}

            <div className="mt-4 flex gap-2">
              {verdict.kind === 'range-da-rifare' ? (
                <Button full variant="secondary" onClick={() => { decidi(verdict, false); }}>
                  Ho capito
                </Button>
              ) : (
                <>
                  <Button full onClick={() => { decidi(verdict, true); }}>
                    Applica
                  </Button>
                  <Button variant="ghost" onClick={() => { decidi(verdict, false); }}>
                    Lascia com’è
                  </Button>
                </>
              )}
            </div>
          </Card>
        ))}

        {review.alMassimo.length === 0 ? null : (
          <>
            <SectionTitle>Massimo chiuso, leva del tempo</SectionTitle>
            <Card tone="muted">
              <p className="text-sm leading-relaxed text-dim">
                Su {review.alMassimo.join(', ')} hai chiuso il massimo del range su tutte le serie,
                ma qui la revisione non ha una leva da tirare: la variante non c’è o è finita, e il
                peso è ancora bloccato. La leva giusta è il tempo, e si decide a fine seduta con il
                blocco sotto gli occhi, perché lo stesso esercizio ha tempi diversi in giorni
                diversi.
              </p>
            </Card>
          </>
        )}

        {review.inRange.length === 0 ? null : (
          <>
            <SectionTitle>Confermati così</SectionTitle>
            <Card tone="muted">
              <p className="text-sm leading-relaxed text-dim">{review.inRange.join(', ')}</p>
            </Card>
          </>
        )}

        <Card tone="muted">
          <p className="text-xs leading-relaxed text-dim">
            Questa pagina legge solo quello che hai scritto nel player: le serie, i kg e le risposte
            sul tempo. Un esercizio con meno di tre serie nella settimana non viene giudicato, e una
            serie storta in mezzo a due buone non fa scendere di livello.
          </p>
        </Card>
      </div>
    </Screen>
  );
}
