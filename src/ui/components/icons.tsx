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
      {/* Un ingranaggio, non un sole: il sole si scambiava per l'interruttore chiaro/scuro (Alessio, 2026-11-22). */}
      <path d="M19.19 12.34 L21.14 13.01 L20.83 14.57 L18.77 14.44 L16.85 17.33 L17.75 19.18 L16.43 20.06 L15.07 18.51 L11.66 19.19 L10.99 21.14 L9.43 20.83 L9.56 18.77 L6.67 16.85 L4.82 17.75 L3.94 16.43 L5.49 15.07 L4.81 11.66 L2.86 10.99 L3.17 9.43 L5.23 9.56 L7.15 6.67 L6.25 4.82 L7.57 3.94 L8.93 5.49 L12.34 4.81 L13.01 2.86 L14.57 3.17 L14.44 5.23 L17.33 7.15 L19.18 6.25 L20.06 7.57 L18.51 8.93 Z" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </Icona>
  );
}
