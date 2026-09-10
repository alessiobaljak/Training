import { navigate, type Route } from '../router.ts';

interface Tab {
  readonly route: Route;
  readonly label: string;
  readonly glyph: string;
}

const TABS: readonly Tab[] = [
  { route: { name: 'home' }, label: 'Oggi', glyph: '◆' },
  { route: { name: 'log' }, label: 'Log', glyph: '≡' },
  { route: { name: 'progress' }, label: 'Progressi', glyph: '◱' },
  { route: { name: 'measures' }, label: 'Misure', glyph: '◐' },
  { route: { name: 'library' }, label: 'Esercizi', glyph: '☰' },
];

export function BottomNav({ current }: { current: Route }) {
  const isActive = (tab: Tab): boolean =>
    tab.route.name === current.name ||
    (tab.route.name === 'library' && current.name === 'exercise');

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
              className={`flex min-h-14 w-full flex-col items-center justify-center gap-0.5 pt-2 text-[11px] font-medium ${
                isActive(tab) ? 'text-accent' : 'text-dim'
              }`}
            >
              <span aria-hidden="true" className="text-lg leading-none">
                {tab.glyph}
              </span>
              {tab.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
