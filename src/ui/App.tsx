import { BottomNav } from './components/BottomNav.tsx';
import { HomeScreen } from './screens/HomeScreen.tsx';
import { OnboardingScreen } from './screens/OnboardingScreen.tsx';
import { PlaceholderScreen } from './screens/PlaceholderScreen.tsx';
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
        {route.name === 'log' ? (
          <PlaceholderScreen
            title="Log"
            phase={6}
            what="Storico con le stesse colonne del foglio Excel, filtri per esercizio e periodo."
          />
        ) : null}
        {route.name === 'progress' ? (
          <PlaceholderScreen
            title="Progressi"
            phase={6}
            what="Grafici per esercizio con i marker sui cambi di livello e di zavorra, volume settimanale, aderenza."
          />
        ) : null}
        {route.name === 'measures' ? (
          <PlaceholderScreen
            title="Misure"
            phase={7}
            what="Peso a digiuno, media mobile a 7 giorni in evidenza, girovita e delta."
          />
        ) : null}
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
