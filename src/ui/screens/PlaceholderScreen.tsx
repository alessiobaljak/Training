import { Card, Screen } from '../components/primitives.tsx';

/** Sezione non ancora costruita. Dice quale fase la porterà, invece di una pagina vuota. */
export function PlaceholderScreen({ title, phase, what }: { title: string; phase: number; what: string }) {
  return (
    <Screen title={title}>
      <Card tone="muted">
        <p className="text-sm font-semibold">Arriva nella Fase {phase}</p>
        <p className="mt-2 text-sm leading-relaxed text-dim">{what}</p>
      </Card>
    </Screen>
  );
}
