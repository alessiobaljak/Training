import type { ReactNode } from 'react';
import { navigate, type Route } from '../router.ts';
import {
  IconaAllena,
  IconaDiario,
  IconaEsercizi,
  IconaMisure,
  IconaProgressi,
} from './icons.tsx';

interface Tab {
  readonly route: Route;
  readonly label: string;
  readonly icon: ReactNode;
}

const TABS: readonly Tab[] = [
  { route: { name: 'home' }, label: 'Allena', icon: <IconaAllena /> },
  { route: { name: 'log' }, label: 'Diario', icon: <IconaDiario /> },
  { route: { name: 'progress' }, label: 'Progressi', icon: <IconaProgressi /> },
  { route: { name: 'measures' }, label: 'Misure', icon: <IconaMisure /> },
  { route: { name: 'library' }, label: 'Esercizi', icon: <IconaEsercizi /> },
];

export function BottomNav({ current }: { current: Route }) {
  const isActive = (tab: Tab): boolean =>
    tab.route.name === current.name ||
    (tab.route.name === 'library' && current.name === 'exercise') ||
    (tab.route.name === 'home' && current.name === 'scheda');

  return (
    /*
      Una capsula di vetro che galleggia sopra il fondo (liquid glass). La
      scheda attiva ha la sua lente dentro la capsula.
    */
    <nav className="safe-bottom shrink-0 px-3 pt-2">
      <ul className="glass mx-auto flex w-full max-w-lg rounded-full p-1.5">
        {TABS.map((tab) => (
          <li key={tab.label} className="flex-1">
            <button
              type="button"
              onClick={() => {
                navigate(tab.route);
              }}
              aria-current={isActive(tab) ? 'page' : undefined}
              className={`flex min-h-14 w-full flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-medium transition-colors ${
                isActive(tab) ? 'bg-accent/12 text-accent' : 'text-dim active:bg-panel/60'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
