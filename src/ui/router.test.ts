import { describe, expect, it } from 'vitest';
import { HOME, parseRoute, routeToHash, type Route } from './router.ts';
import { PROGRAM_SESSIONS } from '../data/program.ts';

const ROUTES: readonly Route[] = [
  { name: 'home' },
  { name: 'onboarding' },
  { name: 'session', sessionId: 'upper-a' },
  { name: 'log' },
  { name: 'progress' },
  { name: 'measures' },
  { name: 'library' },
  { name: 'exercise', slug: 'dip-parallele-anelli' },
  { name: 'settings' },
];

describe('rotte', () => {
  it('fa il giro completo su ogni rotta', () => {
    for (const route of ROUTES) {
      expect(parseRoute(routeToHash(route)), route.name).toEqual(route);
    }
  });

  it('usa indirizzi in italiano', () => {
    expect(routeToHash({ name: 'onboarding' })).toBe('#/test');
    expect(routeToHash({ name: 'progress' })).toBe('#/progressi');
    expect(routeToHash({ name: 'session', sessionId: 'shadow' })).toBe('#/seduta/shadow');
  });

  it('accetta ogni seduta del programma', () => {
    for (const session of PROGRAM_SESSIONS) {
      expect(parseRoute(`#/seduta/${session.id}`)).toEqual({
        name: 'session',
        sessionId: session.id,
      });
    }
  });

  it('una seduta inventata riporta alla Home invece di mostrare il vuoto', () => {
    expect(parseRoute('#/seduta/upper-z')).toEqual(HOME);
    expect(parseRoute('#/seduta')).toEqual(HOME);
  });

  it('una rotta sconosciuta riporta alla Home', () => {
    expect(parseRoute('#/qualcosa')).toEqual(HOME);
    expect(parseRoute('#/qualcosa/di/profondo')).toEqual(HOME);
  });

  it('tollera hash vuoti e barre in più', () => {
    expect(parseRoute('')).toEqual(HOME);
    expect(parseRoute('#')).toEqual(HOME);
    expect(parseRoute('#/')).toEqual(HOME);
    expect(parseRoute('#///')).toEqual(HOME);
    expect(parseRoute('#/log/')).toEqual({ name: 'log' });
  });

  it('la libreria senza slug è l’elenco, con slug è la scheda', () => {
    expect(parseRoute('#/esercizi')).toEqual({ name: 'library' });
    expect(parseRoute('#/esercizi/')).toEqual({ name: 'library' });
    expect(parseRoute('#/esercizi/nordic-curl')).toEqual({
      name: 'exercise',
      slug: 'nordic-curl',
    });
  });
});
