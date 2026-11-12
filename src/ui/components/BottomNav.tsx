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
    <nav className="safe-bottom shrink-0 border-t border-line bg-canvas">
      <ul className="mx-auto flex w-full max-w-lg">
        {TABS.map((tab) => (
          <li key={tab.label} className="flex-1">
            <button
              type="button"
              onClick={() => {
                navigate(tab.route);
              }}
              aria-current={isActive(tab) ? 'page' : undefined}
              className={`flex min-h-16 w-full flex-col items-center justify-center gap-1 pt-2 pb-1 text-[11px] font-medium ${
                isActive(tab) ? 'text-accent' : 'text-dim'
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
