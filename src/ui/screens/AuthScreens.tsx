import { Button, Card, Notice } from '../components/primitives.tsx';
import type { ReactNode } from 'react';
import type { AuthStatus } from '../hooks/useAuth.ts';

/**
 * Le schermate che stanno prima dell'app: configurazione mancante, accesso,
 * lucchetto biometrico.
 *
 * Non hanno la barra di navigazione né il resto della struttura: finché non
 * sei entrato non c'è niente in cui navigare.
 */

function Gate({ title, subtitle, children }: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col justify-center px-5 py-10">
      <div className="mx-auto w-full max-w-sm space-y-5">
        <div>
          <p className="text-3xl font-semibold">{title}</p>
          {subtitle === undefined ? null : (
            <p className="mt-2 text-sm leading-relaxed text-dim">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

export function LoadingGate() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <p className="text-dim">Carico…</p>
    </div>
  );
}

export function ConfigMissingScreen({ missingKeys }: { missingKeys: readonly string[] }) {
  return (
    <Gate
      title="Configurazione incompleta"
      subtitle="L’app non sa a quale progetto Firebase collegarsi. Mancano queste variabili d’ambiente."
    >
      <Card>
        <ul className="space-y-1 font-mono text-xs text-warn">
          {missingKeys.map((key) => (
            <li key={key}>{key}</li>
          ))}
        </ul>
      </Card>
      <Notice tone="warn">
        Su Vercel si aggiungono in Settings, Environment Variables, e poi serve un nuovo deploy:
        i valori vengono letti al momento del build, non a ogni avvio.
      </Notice>
    </Gate>
  );
}

export function LoginScreen({ auth }: { auth: AuthStatus }) {
  return (
    <Gate
      title="Shadow"
      subtitle="Entra una volta sola. Da qui in poi il telefono ti riconosce e vai dritto all’allenamento."
    >
      <div className="space-y-3">
        <Button full size="lg" onClick={() => { auth.signIn('google'); }}>
          Continua con Google
        </Button>
        <Button full size="lg" variant="secondary" onClick={() => { auth.signIn('apple'); }}>
          Continua con Apple
        </Button>
      </div>

      {auth.error === null ? null : <Notice tone="danger">{auth.error}</Notice>}

      <Card tone="muted">
        <p className="text-xs leading-relaxed text-dim">
          Sedute, test e misure finiscono nel tuo spazio su Firebase, leggibile solo dal tuo
          account. L’accesso serve una volta: dopo, l’app funziona anche senza rete e si
          risincronizza da sola quando torna.
        </p>
      </Card>
    </Gate>
  );
}

export function LockScreen({ auth }: { auth: AuthStatus }) {
  return (
    <Gate
      title="Bloccata"
      subtitle={
        auth.account?.email === null || auth.account === null
          ? 'Sblocca per continuare.'
          : `Sblocca per continuare come ${auth.account.email ?? auth.account.displayName ?? 'te'}.`
      }
    >
      <Button full size="xl" onClick={auth.unlock}>
        Sblocca
      </Button>

      {auth.error === null ? null : <Notice tone="danger">{auth.error}</Notice>}

      <Button full variant="ghost" onClick={auth.signOut}>
        Esci e usa un altro account
      </Button>
    </Gate>
  );
}
