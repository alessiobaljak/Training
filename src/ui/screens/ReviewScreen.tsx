import { useState } from 'react';
import { repository } from '../../db/repository.ts';
import { addDays, formatDayLong, plural, todayIso } from '../../engine/dates.ts';
import { pendingVerdicts, reviewDecisionId, reviewWeek } from '../../engine/review.ts';
import { programWeek, weekEndDate } from '../../engine/schedule.ts';
import { navigate } from '../router.ts';
import {
  useExerciseStates,
  useLatestTests,
  useSessions,
  useSettings,
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
  const settings = useSettings();

  const [appenaDeciso, setAppenaDeciso] = useState<ReadonlySet<string>>(new Set());

  if (
    sessions === undefined ||
    states === undefined ||
    tests === undefined ||
    suggestions === undefined ||
    settings === undefined
  ) {
    return (
      <Screen title={`Settimana ${String(week)}`}>
        <p className="text-dim">Carico…</p>
      </Screen>
    );
  }

  const inizio = settings.programStartDate;
  if (inizio === null) {
    return (
      <Screen title={`Settimana ${String(week)}`} onBack={() => { navigate({ name: 'home' }); }}>
        <Notice tone="warn">
          Il programma non è ancora cominciato: senza una data di inizio non ci sono settimane da
          rivedere.
        </Notice>
      </Screen>
    );
  }

  const oggi = todayIso();
  const fine = weekEndDate(inizio, week);
  const stateMap = new Map<ExerciseSlug, ExerciseState>(
    states.map((state) => [state.exercise, state]),
  );
  const calcolata = reviewWeek({ week, sessions, states: stateMap, tests, weekEnd: fine, today: oggi });

  const giaDeciso = new Set([
    ...suggestions.map((record) => record.id),
    ...appenaDeciso,
  ]);
  const aperti = pendingVerdicts(calcolata, giaDeciso);

  /*
   * Un esercizio deciso in questa revisione non ricompare in un altro elenco.
   * Dopo «Applica» lo stato è un altro e le due sedute lette non sono a quel
   * gradino: il calcolo lo metterebbe fra «troppo pochi numeri», che è vero
   * ma, un secondo dopo averlo deciso, si legge come un errore.
   */
  const nonDeciso = (voce: { readonly exercise: ExerciseSlug }): boolean =>
    !giaDeciso.has(reviewDecisionId(week, voce.exercise));
  const review = {
    ...calcolata,
    pocheProve: calcolata.pocheProve.filter(nonDeciso),
    rimandati: calcolata.rimandati.filter(nonDeciso),
    fermi: calcolata.fermi.filter(nonDeciso),
    inAttesa: calcolata.inAttesa.filter(nonDeciso),
    alMassimo: calcolata.alMassimo.filter(nonDeciso),
  };

  const decidi = (verdict: WeeklyVerdict, accettato: boolean): void => {
    const id = reviewDecisionId(week, verdict.exercise);
    if (accettato) void repository.saveExerciseState(verdict.stateAfter);
    void repository.recordSuggestion({
      id,
      date: oggi,
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

  const dal = formatDayLong(review.finestra.dal);
  const al = formatDayLong(review.finestra.al);
  const indietro = () => { navigate({ name: 'home' }); };

  if (review.stato === 'in-corso') {
    return (
      <Screen title={`Settimana ${String(week)}`} onBack={indietro}>
        <Notice>
          La settimana {week} chiude {formatDayLong(fine)}: la revisione si apre il giorno dopo.
        </Notice>
      </Screen>
    );
  }

  if (review.stato === 'scaduta') {
    const ultimaChiusa = programWeek(inizio, oggi) - 1;
    return (
      <Screen title={`Settimana ${String(week)} chiusa`} onBack={indietro}>
        <div className="space-y-4">
          <Notice tone="warn">
            Questa revisione si poteva decidere fino a {formatDayLong(addDays(fine, 7))}. I numeri
            nuovi sono nella revisione dell’ultima settimana chiusa.
          </Notice>
          {ultimaChiusa >= 1 && ultimaChiusa !== week ? (
            <Button
              full
              variant="secondary"
              onClick={() => { navigate({ name: 'review', week: ultimaChiusa }); }}
            >
              Vai alla settimana {ultimaChiusa}
            </Button>
          ) : null}
        </div>
      </Screen>
    );
  }

  /*
   * «Niente da cambiare» solo se davvero non c'è niente: con un esercizio in
   * attesa, fermo o senza abbastanza numeri la frase sarebbe falsa. In
   * settimana 1 tutti finiscono fra quelli con pochi numeri.
   */
  const elenchiVuoti =
    review.pocheProve.length === 0 &&
    review.rimandati.length === 0 &&
    review.fermi.length === 0 &&
    review.inAttesa.length === 0 &&
    review.alMassimo.length === 0;

  return (
    <Screen
      title={`Settimana ${String(week)} chiusa`}
      subtitle={`${plural(review.sessionsCounted, 'seduta', 'sedute')} in settimana · ${plural(review.setsCounted, 'serie letta', 'serie lette')} dal ${dal} al ${al}`}
      onBack={indietro}
    >
      <div className="space-y-4">
        {review.sessionsCounted === 0 ? (
          <Notice tone="warn">
            Nessuna seduta chiusa in questa settimana. Senza serie registrate non c’è niente da
            rivedere: la revisione legge quello che hai scritto, non quello che era in programma.
          </Notice>
        ) : null}

        {aperti.length === 0 && review.sessionsCounted > 0 ? (
          elenchiVuoti ? (
            <Notice tone="good">
              Niente da cambiare per la settimana prossima. I numeri di questa settimana stanno dove
              devono stare: si continua con lo stesso carico e gli stessi gradini.
            </Notice>
          ) : (
            <Notice>Nessun cambio da decidere.</Notice>
          )
        ) : null}

        {aperti.map((verdict) => {
          const soloLettura =
            verdict.kind === 'range-da-rifare' ||
            verdict.kind === 'rifai-al-tempo-giusto' ||
            verdict.kind === 'rispondi-sul-tempo';
          return (
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
                {soloLettura ? (
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
          );
        })}

        {review.inAttesa.length === 0 ? null : (
          <>
            <SectionTitle>Un gradino ogni due settimane</SectionTitle>
            <Card tone="muted">
              <ul className="space-y-2 text-sm leading-relaxed text-dim">
                {review.inAttesa.map((voce) => (
                  <li key={voce.exercise}>{voce.testo}</li>
                ))}
              </ul>
            </Card>
          </>
        )}

        {review.fermi.length === 0 ? null : (
          <>
            <SectionTitle>Fermi per ora</SectionTitle>
            <Card tone="muted">
              <ul className="space-y-2 text-sm leading-relaxed text-dim">
                {review.fermi.map((voce) => (
                  <li key={voce.exercise}>
                    <span className="font-semibold text-ink">{voce.exerciseName}</span>: {voce.testo}
                  </li>
                ))}
              </ul>
            </Card>
          </>
        )}

        {review.alMassimo.length === 0 ? null : (
          <>
            <SectionTitle>Massimo chiuso</SectionTitle>
            <Card tone="muted">
              <ul className="space-y-2 text-sm leading-relaxed text-dim">
                {review.alMassimo.map((voce) => (
                  <li key={voce.exercise}>
                    <span className="font-semibold text-ink">{voce.exerciseName}</span>: {voce.testo}
                  </li>
                ))}
              </ul>
            </Card>
          </>
        )}

        {review.rimandati.length === 0 ? null : (
          <>
            <SectionTitle>Già rifatti</SectionTitle>
            <Card tone="muted">
              <ul className="space-y-2 text-sm leading-relaxed text-dim">
                {review.rimandati.map((voce) => (
                  <li key={voce.exercise}>
                    {voce.exerciseName}: l’hai già rifatto {formatDayLong(voce.date)}. Lo giudica
                    la revisione della settimana prossima, con le ultime due sedute.
                  </li>
                ))}
              </ul>
            </Card>
          </>
        )}

        {review.pocheProve.length === 0 ? null : (
          <>
            <SectionTitle>Troppo pochi numeri per giudicare</SectionTitle>
            <Card tone="muted">
              <p className="text-sm leading-relaxed text-dim">
                {review.pocheProve
                  .map(
                    (voce) =>
                      `${voce.exerciseName} (${plural(voce.sedute, 'seduta', 'sedute')}, ${plural(voce.serie, 'serie', 'serie')}${voce.level === null ? '' : ` al livello ${String(voce.level)}`}${voce.loadKg === null || voce.loadKg === 0 ? '' : ` con ${String(voce.loadKg)} kg`})`,
                  )
                  .join(', ')}
                . La revisione giudica le ultime due sedute di un esercizio se sono allo stesso
                livello e carico, cadono entrambe fra {dal} e {al} e hanno almeno 3 serie complete
                in tutto. Il riepilogo di fine seduta continua a proporre le sue leve.
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
            sul tempo. Ogni esercizio si giudica sulle sue ultime due sedute chiuse, se sono allo
            stesso livello e carico, cadono fra {dal} e {al} e hanno almeno 3 serie complete in
            tutto. Una serie storta in mezzo a due buone non fa scendere di livello.
          </p>
        </Card>
      </div>
    </Screen>
  );
}
