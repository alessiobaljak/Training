import { BottomNav } from './components/BottomNav.tsx';
import { WriteErrorBanner } from './components/WriteErrorBanner.tsx';
import { HomeScreen } from './screens/HomeScreen.tsx';
import { OnboardingScreen } from './screens/OnboardingScreen.tsx';
import { ExerciseScreen } from './screens/ExerciseScreen.tsx';
import { LibraryScreen } from './screens/LibraryScreen.tsx';
import { LogScreen } from './screens/LogScreen.tsx';
import { MeasuresScreen } from './screens/MeasuresScreen.tsx';
import { ProgressScreen } from './screens/ProgressScreen.tsx';
import { ReviewScreen } from './screens/ReviewScreen.tsx';
import { SessionScreen } from './session/SessionScreen.tsx';
import { GuidedSession } from './session/GuidedSession.tsx';
import { CircuitOverview } from './screens/CircuitOverview.tsx';
import { getAnySession } from '../data/sessions.ts';
import type { SessionId } from '../types/index.ts';
import { SettingsScreen } from './screens/SettingsScreen.tsx';
import {
  ConfigMissingScreen,
  LoadingGate,
  LockScreen,
  LoginScreen,
} from './screens/AuthScreens.tsx';
import { useRoute } from './router.ts';
import { useAuthStatus } from './hooks/useAuth.ts';

export function App() {
  const route = useRoute();
  const auth = useAuthStatus();

  /*
   * Il cancello sta prima di tutto: senza un account non esiste nessun dato da
   * mostrare, perché i dati vivono nello spazio dell'utente su Firestore.
   */
  if (auth.state === 'config-missing') return <ConfigMissingScreen missingKeys={auth.missingKeys} />;
  if (auth.state === 'loading') return <LoadingGate />;
  if (auth.state === 'signed-out') return <LoginScreen auth={auth} />;
  if (auth.state === 'locked') return <LockScreen auth={auth} />;

  /*
   * La barra in basso sparisce dove c'è già un'azione principale in fondo:
   * nella seduta, nei test, e nella scheda che ha il suo «Inizia».
   */
  const showNav =
    route.name !== 'onboarding' && route.name !== 'session' && route.name !== 'scheda';

  /*
   * Due player, scelti dal tipo di seduta.
   *
   * Il circuito usa quello guidato: una sequenza sola, un passo alla volta,
   * niente da scegliere mentre ci si allena. Le sedute archiviate dello Shadow
   * tengono il loro, che mostra tutto insieme e lascia navigare — lì serve,
   * perché una seduta di forza si interrompe e si riprende.
   */
  const eCircuito = (sessionId: SessionId): boolean =>
    getAnySession(sessionId).kind === 'circuit';

  /*
   * Una sola colonna alta quanto lo schermo: il contenuto scorre nel mezzo e
   * la barra in basso resta un elemento di flusso. Se fosse anch'essa sticky
   * si sovrapporrebbe al pulsante principale della schermata.
   */
  return (
    <div className="flex h-dvh flex-col">
      <WriteErrorBanner />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {route.name === 'home' ? <HomeScreen /> : null}
        {route.name === 'onboarding' ? <OnboardingScreen /> : null}
        {route.name === 'settings' ? <SettingsScreen /> : null}
        {/*
          `key` sulla seduta: passando da una seduta all'altra il player deve
          ripartire da zero. Senza, React riusa lo stesso componente cambiando
          solo la proprietà, e la serie corrente resta quella di prima: da una
          seduta lunga a una più corta si finiva sul messaggio «Piano della
          seduta vuoto», perché quell'indice nell'altro piano non esiste.
        */}
        {route.name === 'session' ? (
          eCircuito(route.sessionId) ? (
            <GuidedSession key={route.sessionId} sessionId={route.sessionId} />
          ) : (
            <SessionScreen key={route.sessionId} sessionId={route.sessionId} />
          )
        ) : null}
        {route.name === 'scheda' ? (
          <CircuitOverview key={route.sessionId} sessionId={route.sessionId} />
        ) : null}
        {route.name === 'log' ? <LogScreen /> : null}
        {route.name === 'progress' ? <ProgressScreen /> : null}
        {route.name === 'measures' ? <MeasuresScreen /> : null}
        {route.name === 'library' ? <LibraryScreen /> : null}
        {route.name === 'exercise' ? <ExerciseScreen slug={route.slug} /> : null}
        {route.name === 'review' ? <ReviewScreen week={route.week} /> : null}
      </div>
      {showNav ? <BottomNav current={route} /> : null}
    </div>
  );
}
