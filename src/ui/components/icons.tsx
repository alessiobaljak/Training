import type { ReactNode } from 'react';

/**
 * Le icone dell'app, disegnate qui.
 *
 * Prima la barra in basso usava caratteri di testo — ◆ ≡ ◱ ◐ ☰ — scelti
 * perché somigliavano vagamente a qualcosa. Due erano tre righe orizzontali
 * quasi identiche («Log» ed «Esercizi»), uno era una mezzaluna da dieci pixel,
 * e nessuno diceva cosa c'era dietro. Un carattere di testo dipende anche dal
 * font del telefono: lo stesso simbolo cambia forma e peso da un sistema
 * all'altro.
 *
 * Sono tracciati a mano su una griglia da 24, stesso spessore e stessi
 * terminali, e prendono il colore dal testo che le contiene.
 */
function Icona({ children }: { readonly children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** Un manubrio: allenarsi. */
export function IconaAllena() {
  return (
    <Icona>
      <path d="M6.5 7v10M3.5 9.5v5M17.5 7v10M20.5 9.5v5M6.5 12h11" />
    </Icona>
  );
}

/** Una pagina con le righe: il diario delle sedute. */
export function IconaDiario() {
  return (
    <Icona>
      <rect x="5" y="3.5" width="14" height="17" rx="2.5" />
      <path d="M9 8.5h6M9 12h6M9 15.5h3.5" />
    </Icona>
  );
}

/** Una linea che sale: i progressi. */
export function IconaProgressi() {
  return (
    <Icona>
      <path d="M4 19.5h16" />
      <path d="M5.5 15.5l4-4.5 3.5 3 5.5-7" />
      <path d="M15 7h3.5v3.5" />
    </Icona>
  );
}

/** Un metro da sarta: le misure. */
export function IconaMisure() {
  return (
    <Icona>
      <rect x="3" y="8" width="18" height="8" rx="2" />
      <path d="M7 8v3M11 8v4M15 8v3M19 8v0" />
    </Icona>
  );
}

/** Quattro riquadri: il catalogo degli esercizi. */
export function IconaEsercizi() {
  return (
    <Icona>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
    </Icona>
  );
}

/** Un ingranaggio: app e dati. */
export function IconaImpostazioni() {
  return (
    <Icona>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4L18 18M18 6l-1.6 1.6M7.6 16.4L6 18" />
    </Icona>
  );
}
