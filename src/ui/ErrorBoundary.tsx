import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * Rete di sicurezza per l'intera app.
 *
 * Senza, un errore in un componente lascia una schermata nera e basta: in
 * palestra, offline, senza console aperta, non c'è modo di capire cosa sia
 * successo né di uscirne. Qui almeno resta un messaggio e una via d'uscita.
 */
interface State {
  readonly error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Errore non gestito', error, info.componentStack);
  }

  override render(): ReactNode {
    const { error } = this.state;
    if (error === null) return this.props.children;

    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-4">
        <h1 className="text-2xl font-semibold">Qualcosa si è rotto</h1>
        <p className="text-sm leading-relaxed text-dim">
          I dati salvati non sono stati toccati. Torna alla Home e riprova: se succede di nuovo,
          fai un backup dalla sezione Dati prima di qualsiasi altra cosa.
        </p>
        <pre className="overflow-x-auto rounded-2xl border border-line bg-surface p-4 text-xs text-warn">
          {error.message}
        </pre>
        <button
          type="button"
          onClick={() => {
            window.location.hash = '#/';
            window.location.reload();
          }}
          className="min-h-14 rounded-2xl bg-accent px-6 font-semibold text-accent-ink"
        >
          Torna alla Home
        </button>
      </div>
    );
  }
}
