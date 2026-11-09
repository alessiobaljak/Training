/* Ricalcolo INDIPENDENTE delle metriche dei progressi su dati fittizi. */
import { adherenceFromSessions, plannedSessionsSoFar, movingAverage, weeklyAverages, volumeByGroup, sessionsInWeek } from '../../src/engine/metrics.ts';
import type { LoggedSession } from '../../src/types/index.ts';

function s(id: string, date: string, week: number, status: 'completed' | 'abandoned' | 'in-progress', esercizi: { ex: string; sets: number[] }[] = []): LoggedSession {
  return {
    id, date, week, sessionId: 'circuito-1', status,
    exercises: esercizi.map((e) => ({
      blockCode: 'A1', exercise: e.ex, variantLabel: 'x', level: null, tempoRespected: true,
      sets: e.sets.map((v, i) => ({ setIndex: i + 1, side: null, value: v, rir: null, loadKg: 0, heartRate: null, note: null })),
      note: null,
    })),
    note: null,
  };
}

console.log('=== M1 — aderenza: denominatore su un programma senza giorni assegnati ===');
/* Programma: 4 sedute a settimana, nessun giorno assegnato (rotation.ts).
 * Atleta che si allena sabato e domenica + martedi e giovedi. */
const inizio = '2026-01-05'; // lunedi
const giorni = ['2026-01-05','2026-01-06','2026-01-07','2026-01-08','2026-01-09','2026-01-10','2026-01-11'];
for (const oggi of giorni) {
  const previste = plannedSessionsSoFar(inizio, oggi, 4);
  /*
   * Mio ricalcolo per un programma senza giorni assegnati: quota
   * proporzionale ai giorni trascorsi, troncata.
   *
   * Troncata e non arrotondata: col 2026-11-09 la mia prima versione usava
   * `Math.round` e scriveva 1 seduta dovuta la sera del primo giorno, cioe'
   * dava 0% a chi non e' in ritardo di niente. Il troncamento non dichiara
   * mai in ritardo chi e' in pari, e in un programma che non assegna giorni
   * e' l'unica lettura difendibile. Resta una convenzione da approvare
   * (decisione aperta per Alessio): se la convenzione diventa l'arrotondamento,
   * questa riga cambia e M-ADER torna a non coincidere.
   */
  const indice = giorni.indexOf(oggi) + 1;
  const proporzionale = Math.floor((4 * indice) / 7);
  const coincide = previste === proporzionale ? 'OK' : 'DIVERGE';
  console.log(`   ${oggi} (giorno ${String(indice)} della settimana 1): app=${String(previste)} previste | mio ricalcolo=${String(proporzionale)} ${coincide}`);
}
{
  // atleta perfettamente in pari che si allena gio-ven-sab-dom
  const sedute = [s('a','2026-01-08',1,'completed'), s('b','2026-01-09',1,'completed'), s('c','2026-01-10',1,'completed'), s('d','2026-01-11',1,'completed')];
  const gio = adherenceFromSessions([sedute[0]!], 4, inizio, '2026-01-08');
  const dom = adherenceFromSessions(sedute, 4, inizio, '2026-01-11');
  console.log(`   atleta che fa le 4 sedute gio-dom: giovedi sera aderenza=${String(gio.percent)}% (1/${String(gio.planned)}) | domenica sera=${String(dom.percent)}% (4/${String(dom.planned)})`);
}
{
  // storico precedente all'inizio del programma (6 settimane di Shadow archiviato)
  const vecchie = Array.from({ length: 24 }, (_, i) => s(`v${String(i)}`, `2025-11-${String(1 + (i % 28)).padStart(2, '0')}`, 1, 'completed'));
  const nuove = [s('n1','2026-01-05',1,'completed')];
  const a = adherenceFromSessions([...vecchie, ...nuove], 4, inizio, '2026-01-07');
  console.log(`   24 sedute chiuse PRIMA della data di inizio + 1 dopo: aderenza=${String(a.percent)}% (${String(a.completed)}/${String(a.planned)}) — atteso 1/1 = 100%`);
}
{
  /*
   * Data di inizio che non cade di lunedi.
   *
   * Il denominatore conta i giorni dal lunedi della settimana di inizio, non
   * dalla data di inizio: un programma che parte di venerdi arriva al primo
   * giorno con due sedute gia' dovute su quattro. Oggi l'onboarding scrive
   * sempre un lunedi (`startOfWeek`), quindi il difetto e' latente: lo
   * raggiunge solo un backup reimportato con un'altra data.
   */
  const venerdi = '2026-01-09';
  const previsteGiorno1 = plannedSessionsSoFar(venerdi, venerdi, 4);
  const sedutaPrimaDellInizio = adherenceFromSessions([s('p','2026-01-06',1,'completed')], 4, venerdi, venerdi);
  console.log(`   inizio di venerdi: al primo giorno previste=${String(previsteGiorno1)} (atteso 0) | una seduta del 6, prima dell'inizio, conta=${String(sedutaPrimaDellInizio.completed)} (atteso 0)`);
}

console.log('\n=== M2 — volume settimanale: stato della seduta ===');
{
  const settimana = '2026-01-05';
  const chiusa = s('c1','2026-01-05',1,'completed',[{ ex: 'trazioni-prona-presa-media', sets: [8,8,8] }]);
  const abbandonata = s('c2','2026-01-06',1,'abandoned',[{ ex: 'trazioni-prona-presa-media', sets: [2] }]);
  const bozza = s('c3','2026-01-07',1,'in-progress',[{ ex: 'trazioni-prona-presa-media', sets: [1] }]);
  const soloChiusa = volumeByGroup(sessionsInWeek([chiusa], settimana)).find((g) => g.group === 'dorsali')!;
  const tutte = volumeByGroup(sessionsInWeek([chiusa, abbandonata, bozza], settimana)).find((g) => g.group === 'dorsali')!;
  console.log(`   dorsali solo seduta chiusa: ${String(soloChiusa.sets)} | con una abbandonata e una bozza aperta: ${String(tutte.sets)} (mio ricalcolo atteso: 3)`);
}

console.log('\n=== M3 — media mobile e medie settimanali del peso ===');
{
  const dati = [
    { date: '2026-01-05', value: 80 },
    { date: '2026-01-06', value: 79.6 },
    { date: '2026-01-07', value: 79.8 },
    // tre giorni senza misura
    { date: '2026-01-11', value: 79.2 },
    { date: '2026-01-12', value: 79.0 },
  ];
  const mm = movingAverage(dati, 7);
  for (const p of mm) {
    // ricalcolo indipendente: media dei dati nei 7 giorni di calendario che finiscono in p.date
    const limite = new Date(`${p.date}T00:00:00Z`);
    limite.setUTCDate(limite.getUTCDate() - 6);
    const inizioStr = limite.toISOString().slice(0, 10);
    const campioni = dati.filter((d) => d.date >= inizioStr && d.date <= p.date).map((d) => d.value);
    const mia = Math.round((campioni.reduce((a, b) => a + b, 0) / campioni.length) * 10) / 10;
    console.log(`   ${p.date}: app=${String(p.average)} (n=${String(p.sampleCount)}, completa=${String(p.complete)}) | mio=${String(mia)} (n=${String(campioni.length)}) ${p.average === mia ? 'OK' : 'DIVERGE'}`);
  }
  const ws = weeklyAverages(dati);
  for (const w of ws) console.log(`   settimana ${w.weekStart}: media=${String(w.average)} n=${String(w.sampleCount)} delta=${String(w.delta)} confrontata con ${String(w.comparedTo)}`);
}

console.log('\n=== M4 — perdita di peso rapida: l’app dice qualcosa? ===');
{
  const crollo = Array.from({ length: 21 }, (_, i) => ({ date: `2026-01-${String(5 + i).padStart(2, '0')}`, value: 80 - i * 0.45 }));
  const ws = weeklyAverages(crollo);
  for (const w of ws) console.log(`   settimana ${w.weekStart}: media=${String(w.average)} delta=${String(w.delta)} kg`);
  console.log('   nota: nessuna soglia, nessun avviso, nessun rimando nel modulo delle metriche.');
}
