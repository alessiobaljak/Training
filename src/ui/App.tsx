import { BottomNav } from './components/BottomNav.tsx';
import { HomeScreen } from './screens/HomeScreen.tsx';
import { OnboardingScreen } from './screens/OnboardingScreen.tsx';
import { LogScreen } from './screens/LogScreen.tsx';
import { MeasuresScreen } from './screens/MeasuresScreen.tsx';
import { PlaceholderScreen } from './screens/PlaceholderScreen.tsx';
import { ProgressScreen } from './screens/ProgressScreen.tsx';
import { SessionScreen } from './session/SessionScreen.tsx';
import { SettingsScreen } from './screens/SettingsScreen.tsx';
import { useRoute } from './router.ts';

export function App() {
  const route = useRoute();

  const showNav = route.name !== 'onboarding' && route.name !== 'session';

  /*
   * Una sola colonna alta quanto lo schermo: il contenuto scorre nel mezzo e
   * la barra in basso resta un elemento di flusso. Se fosse anch'essa sticky
   * si sovrapporrebbe al pulsante principale della schermata.
   */
  return (
    <div className="flex h-dvh flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {route.name === 'home' ? <HomeScreen /> : null}
        {route.name === 'onboarding' ? <OnboardingScreen /> : null}
        {route.name === 'settings' ? <SettingsScreen /> : null}
        {route.name === 'session' ? <SessionScreen sessionId={route.sessionId} /> : null}
        {route.name === 'log' ? <LogScreen /> : null}
        {route.name === 'progress' ? <ProgressScreen /> : null}
        {route.name === 'measures' ? <MeasuresScreen /> : null}
        {route.name === 'library' || route.name === 'exercise' ? (
          <PlaceholderScreen
            title="Esercizi"
            phase={8}
            what="Anagrafica con cue, illustrazione SVG, ricerca video e il campo per il tuo link."
          />
        ) : null}
      </div>
      {showNav ? <BottomNav current={route} /> : null}
    </div>
  );
}
