import { useState } from 'react';
import { findExercise } from '../../data/exercises.ts';
import { getProgressionScale } from '../../data/progressions.ts';
import { MOTOR_PATTERN_LABELS } from '../../types/index.ts';
import { repository } from '../../db/repository.ts';
import { exerciseHistory } from '../../engine/history.ts';
import { initialExerciseState } from '../../engine/progression.ts';
import { resolveVideoLink } from '../../engine/media.ts';
import { getLoadThreshold } from '../../data/method.ts';
import { navigate } from '../router.ts';
import { useExerciseState, useExerciseVideo, useSessions } from '../hooks/useData.ts';
import { Badge, Button, Card, CueList, Notice, Screen, SectionTitle } from '../components/primitives.tsx';
import { ExerciseArt } from '../components/ExerciseArt.tsx';
import type { LevelIndex } from '../../types/index.ts';

/**
 * Scheda di un esercizio.
 *
 * Raggiungibile dal player e dall'elenco. Qui stanno le quattro cose che
 * servono davvero prima di una serie: dove sei nella scala, come si esegue,
 * come si vede fatto bene, e cosa hai fatto l'ultima volta.
 */
export function ExerciseScreen({ slug }: { readonly slug: string }) {
  const exercise = findExercise(slug);
  const state = useExerciseState(slug);
  const customVideo = useExerciseVideo(slug);
  const sessions = useSessions();

  const [draftUrl, setDraftUrl] = useState('');
  /* Quale gradino della scala è aperto, per vedere cosa cambia rispetto a dove sei. */
  const [espanso, setEspanso] = useState<LevelIndex | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (exercise === undefined) {
    return (
      <Screen title="Esercizio" onBack={() => { navigate({ name: 'library' }); }}>
        <Notice tone="warn">Questo esercizio non esiste più nell’anagrafica.</Notice>
      </Screen>
    );
  }

  const level: LevelIndex | null = state?.level ?? exercise.defaultLevel;
  const scale = exercise.pattern === null ? null : getProgressionScale(exercise.pattern);
  const history = exerciseHistory(sessions ?? [], slug).slice(-5).reverse();
  const link = resolveVideoLink(exercise, customVideo ?? null);
  const threshold = getLoadThreshold(exercise.pattern);

  const saveVideo = (): void => {
    setError(null);
    repository
      .setExerciseVideo(slug, draftUrl)
      .then(() => { setDraftUrl(''); })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : 'Link non salvato.');
      });
  };

  return (
    <Screen
      title={exercise.name}
      subtitle={exercise.pattern === null ? 'Accessorio' : MOTOR_PATTERN_LABELS[exercise.pattern]}
      onBack={() => { navigate({ name: 'library' }); }}
    >
      <div className="space-y-4">
        <Card>
          <ExerciseArt slug={slug} />
        </Card>

        {/*
          I gradini sono pulsanti, non righe morte.
          Erano una lista sola da guardare: si vedeva a che livello si è e non
          si poteva toccare nient'altro, mentre la cosa che si vuole fare
          guardando una scala è capire cosa c'è prima e cosa c'è dopo, e
          spostarsi senza dover aprire una seduta.
        */}
        {scale !== null && level !== null ? (
          <>
            <SectionTitle>Dove sei nella scala</SectionTitle>
            <Card>
              <ul className="space-y-1">
                {scale.steps.map((step) => {
                  const current = step.level === level;
                  const aperto = step.level === espanso;
                  const distanza = step.level - level;
                  return (
                    <li key={step.slug}>
                      <button
                        type="button"
                        aria-pressed={aperto}
                        onClick={() => { setEspanso(aperto ? null : step.level); }}
                        className={`flex min-h-12 w-full items-center gap-3 rounded-xl border px-3 text-left text-sm ${
                          current
                            ? 'border-accent bg-accent/15 font-semibold'
                            : aperto
                              ? 'border-line bg-panel text-ink'
                              : 'border-line/40 bg-panel/40 text-dim'
                        }`}
                      >
                        <span className={`w-5 shrink-0 font-mono ${current ? 'text-accent' : ''}`}>
                          {step.level}
                        </span>
                        <span className="flex-1">{step.name}</span>
                        {current ? <Badge tone="accent">Ora</Badge> : null}
                      </button>

                      {aperto ? (
                        <div className="mt-1 rounded-xl border border-line bg-surface p-3">
                          <p className="text-sm leading-relaxed text-dim">
                            {current
                              ? 'È il gradino su cui stai lavorando adesso.'
                              : distanza < 0
                                ? `${distanza === -1 ? 'Un gradino' : `${String(-distanza)} gradini`} più facile di dove sei.`
                                : `${distanza === 1 ? 'Un gradino' : `${String(distanza)} gradini`} più difficile di dove sei.`}
                            {step.perSide ? ' Si esegue un lato per volta.' : ''}
                          </p>
                          {current ? null : (
                            <div className="mt-3">
                              <Button
                                variant="secondary"
                                onClick={() => {
                                  setEspanso(null);
                                  void repository.saveExerciseState({
                                    ...(state ?? initialExerciseState(exercise)),
                                    level: step.level,
                                  });
                                }}
                              >
                                Passa a questo livello
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-xs leading-relaxed text-dim">
                Il livello cambia anche dal player, alla riga Variante/Livello, o accettando un
                suggerimento a fine seduta.
              </p>
            </Card>
          </>
        ) : null}

        <SectionTitle>Esecuzione</SectionTitle>
        <Card>
          <CueList cues={exercise.cues} />
        </Card>

        <SectionTitle>Video</SectionTitle>
        <Card>
          <p className="text-sm leading-relaxed text-dim">{link.hint}</p>
          <div className="mt-3">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-accent px-6 font-semibold text-accent-ink"
            >
              {link.label}
            </a>
          </div>

          <label className="mt-4 block">
            <span className="text-xs text-dim">Il mio video</span>
            <input
              type="url"
              inputMode="url"
              value={draftUrl}
              onChange={(event) => { setDraftUrl(event.target.value); }}
              placeholder="incolla qui un link"
              className="mt-1 min-h-14 w-full rounded-2xl border border-line bg-panel px-4 text-sm text-ink placeholder:text-dim/60"
            />
          </label>

          <div className="mt-3 flex gap-2">
            <Button full disabled={draftUrl.trim() === ''} onClick={saveVideo}>
              Salva il link
            </Button>
            {customVideo != null ? (
              <Button
                variant="ghost"
                onClick={() => {
                  void repository.clearExerciseVideo(slug);
                }}
              >
                Togli
              </Button>
            ) : null}
          </div>

          {error !== null ? (
            <p className="mt-3 text-sm text-danger">{error}</p>
          ) : (
            <p className="mt-3 text-xs leading-relaxed text-dim">
              Nell’app non c’è nessun link a un video specifico: un indirizzo scritto a memoria
              punta quasi sempre a un video morto. Il pulsante apre una ricerca, e quando trovi un
              video che ti convince lo salvi qui.
            </p>
          )}
        </Card>

        {exercise.loadPolicy === 'forbidden' ? (
          <Notice tone="warn">
            Su questo esercizio la zavorra non si usa mai. Il sovraccarico passa dal tempo, dalle
            pause e dalla variante.
          </Notice>
        ) : threshold !== null ? (
          <Notice>
            Sopra {threshold.mandatoryAbove} ripetizioni la zavorra diventa necessaria; sotto{' '}
            {threshold.discouragedBelow} è meglio salire di livello nella scala.
          </Notice>
        ) : null}

        <SectionTitle>Ultime volte</SectionTitle>
        {history.length === 0 ? (
          <Card tone="muted">
            <p className="text-sm text-dim">Nessuna serie ancora registrata su questo esercizio.</p>
          </Card>
        ) : (
          <Card>
            <ul className="space-y-2">
              {history.map((point) => (
                <li key={`${point.sessionLogId}-${point.blockCode}`} className="flex items-baseline gap-3 text-sm">
                  <span className="tabular w-14 shrink-0 text-dim">{point.date.slice(5)}</span>
                  <span className="tabular flex-1 font-semibold">{point.setLabels.join(' · ')}</span>
                  {point.loadKg > 0 ? <Badge>{point.loadKg} kg</Badge> : null}
                  {point.levelChanged ? <Badge tone="good">nuovo liv.</Badge> : null}
                </li>
              ))}
            </ul>
            <div className="mt-3">
              <Button full variant="secondary" onClick={() => { navigate({ name: 'progress' }); }}>
                Vedi il grafico
              </Button>
            </div>
          </Card>
        )}
      </div>
    </Screen>
  );
}
