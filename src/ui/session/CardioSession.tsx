import { useState } from 'react';
import { getExercise } from '../../data/exercises.ts';
import { findLoggedExercise, upsertLoggedSet } from '../../engine/draft.ts';
import { Badge, Button, Card, CueList, Notice, Screen, SectionTitle } from '../components/primitives.tsx';
import { NumberStepper } from '../components/NumberStepper.tsx';
import { formatClock, useStopwatch } from '../hooks/useTimers.ts';
import { primeAudio } from '../feedback.ts';
import type { LoggedSession, ProgramBlock, ProgramSession } from '../../types/index.ts';

/**
 * Seduta di zona 2.
 *
 * Niente serie e niente ripetizioni: qui contano solo la durata effettiva e la
 * frequenza cardiaca media. Il ritmo lo decide il talk test, non il cronometro.
 */
export interface CardioSessionProps {
  readonly program: ProgramSession;
  readonly draft: LoggedSession;
  readonly onUpdate: (change: (session: LoggedSession) => LoggedSession) => void;
  readonly onClose: () => void;
  readonly onBack: () => void;
}

function wantsHeartRate(block: ProgramBlock): boolean {
  return block.reference.includes('FC');
}

function CardioBlock({
  block,
  logged,
  onCommit,
}: {
  readonly block: ProgramBlock;
  readonly logged: { readonly minutes: number; readonly heartRate: number | null } | null;
  readonly onCommit: (minutes: number, heartRate: number | null) => void;
}) {
  const exercise = getExercise(block.exercise);
  const stopwatch = useStopwatch();
  const [minutes, setMinutes] = useState(logged?.minutes ?? 0);
  const [heartRate, setHeartRate] = useState(logged?.heartRate ?? 0);

  const target =
    block.prescription.kind === 'duration'
      ? block.prescription.minMinutes === block.prescription.maxMinutes
        ? `${String(block.prescription.minMinutes)}′`
        : `${String(block.prescription.minMinutes)}-${String(block.prescription.maxMinutes)}′`
      : '—';

  const fromStopwatch = Math.round(stopwatch.seconds / 60);

  return (
    <Card tone={logged === null ? 'default' : 'accent'}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs text-accent">{block.code}</p>
          <p className="truncate text-lg font-semibold">{exercise.name}</p>
          <p className="mt-1 text-xs text-dim">{block.reference}</p>
        </div>
        <Badge tone={logged === null ? 'neutral' : 'good'}>{target}</Badge>
      </div>

      <div className="mt-4 rounded-2xl glass-soft p-4 text-center">
        <p className="tabular text-5xl font-semibold">{formatClock(stopwatch.seconds)}</p>
        <div className="mt-3 flex gap-2">
          <Button
            full
            variant={stopwatch.running ? 'danger' : 'primary'}
            onClick={() => {
              primeAudio();
              stopwatch.toggle();
              if (stopwatch.running && fromStopwatch > 0) setMinutes(fromStopwatch);
            }}
          >
            {stopwatch.running ? 'Ferma' : stopwatch.seconds > 0 ? 'Riprendi' : 'Avvia'}
          </Button>
          <Button
            variant="secondary"
            disabled={stopwatch.seconds === 0}
            onClick={() => { setMinutes(fromStopwatch); }}
          >
            Usa
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <NumberStepper label="Durata effettiva" value={minutes} onChange={setMinutes} unit="min" max={180} />
        {wantsHeartRate(block) ? (
          <NumberStepper
            label="FC media"
            value={heartRate}
            onChange={setHeartRate}
            unit="bpm"
            max={220}
            step={1}
            hint={block.reference}
          />
        ) : null}
      </div>

      <div className="mt-4">
        <Button
          full
          size="lg"
          disabled={minutes <= 0}
          onClick={() => { onCommit(minutes, heartRate > 0 ? heartRate : null); }}
        >
          {logged === null ? 'Registra' : 'Aggiorna'}
        </Button>
      </div>

      <SectionTitle>Esecuzione</SectionTitle>
      <CueList cues={exercise.cues} />
    </Card>
  );
}

export function CardioSession({ program, draft, onUpdate, onClose, onBack }: CardioSessionProps) {
  const done = program.blocks.filter(
    (block) => (findLoggedExercise(draft, block.code)?.sets.length ?? 0) > 0,
  ).length;

  return (
    <Screen
      title={program.name}
      subtitle={`${program.focus} · ${String(done)} di ${String(program.blocks.length)}`}
      onBack={onBack}
      footer={
        <div className="pb-1">
          <Button full size="lg" variant={done === program.blocks.length ? 'primary' : 'secondary'} onClick={onClose}>
            Chiudi la seduta
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {program.note !== undefined ? <Notice>{program.note}</Notice> : null}

        {program.blocks.map((block) => {
          const entry = findLoggedExercise(draft, block.code);
          const first = entry?.sets[0];
          return (
            <CardioBlock
              key={block.code}
              block={block}
              logged={first === undefined ? null : { minutes: first.value, heartRate: first.heartRate }}
              onCommit={(minutes, heartRate) => {
                onUpdate((session) =>
                  upsertLoggedSet(session, block.code, {
                    setIndex: 1,
                    side: null,
                    value: minutes,
                    rir: null,
                    loadKg: 0,
                    heartRate,
                    note: null,
                  }),
                );
              }}
            />
          );
        })}
      </div>
    </Screen>
  );
}
