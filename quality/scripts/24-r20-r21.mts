/*
 * 24 — R20 (B10, transizione fra i giri della finitura) e R21 (B9, Z1 con il tempo vero).
 * training-quality, 2026-11-21. Attesi dalla specifica training/reports/2026-11-21-training-b9-b10-m4.md
 * §1-§2, non dal codice.
 *
 * Uso (dalla scratchpad, su copie `git archive` con node_modules collegato):
 *   node --experimental-strip-types quality/scripts/24-r20-r21.mts <radice-nuova> <radice-di-prima> [<radice-intermedia>]
 * Le radici sono importate per percorso assoluto: due grafi di moduli separati nello stesso processo.
 * Senza intermedia confronta solo nuova e prima.
 *
 * Parti:
 *   A  R20: 20.1 durate, struttura (piano nuovo = piano di prima + soli passi inseriti), 20.2/20.3 testi,
 *      20.4 scarico, 20.5 su ogni piano (settimane 1-18, stati casuali), 20.7 σ casuali e massimi, 20.9.
 *   B  R21: 21.1 su ogni piano, 21.4-21.6 contro un riferimento scritto dal testo, 21.8, 21.9 (revisione
 *      e volume con Z1 a 8, 12, 30 contro Z1 assente), 21.11 (testOutcomes), 21.13 sui dati di tutti i
 *      programmi. Positivo: sulla radice di prima Z1 è automatica e i 4 salti della finitura ci sono.
 */
type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

const [NUOVA, PRIMA, MEDIA] = process.argv.slice(2) as [string, string, string | undefined];
if (NUOVA === undefined || PRIMA === undefined) throw new Error('uso: <radice-nuova> <radice-di-prima> [<intermedia>]');

async function carica(radice: string) {
  return {
    C: (await import(`${radice}/src/engine/circuit.ts`)) as Any,
    D: (await import(`${radice}/src/data/circuit.ts`)) as Any,
    E: (await import(`${radice}/src/data/exercises.ts`)) as Any,
    P: (await import(`${radice}/src/data/progressions.ts`)) as Any,
    R: (await import(`${radice}/src/engine/review.ts`)) as Any,
    M: (await import(`${radice}/src/engine/metrics.ts`)) as Any,
    G: (await import(`${radice}/src/engine/progression.ts`)) as Any,
    DV: (await import(`${radice}/src/data/deviations.ts`)) as Any,
    PR: (await import(`${radice}/src/data/program.ts`)) as Any,
  };
}
const N = await carica(NUOVA);
const V = await carica(PRIMA);
const I = MEDIA === undefined ? null : await carica(MEDIA);

let ok = 0;
let ko = 0;
const riga = (passa: boolean, id: string, testo: string): void => {
  if (passa) ok += 1; else ko += 1;
  console.log(`${passa ? 'OK    ' : 'DIVERSO'} ${id} · ${testo}`);
};
const mmss = (s: number): string => `${String(Math.floor(s / 60))}:${String(s % 60).padStart(2, '0')}`;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ID4 = ['circuito-1', 'circuito-2', 'circuito-3', 'circuito-4'];
const sess = (X: Any, id: string): Any => X.D.findCircuitSession(id);

/* Stati casuali, stessi per le due radici (stesso seme, stesso catalogo: R20 e R21 non lo toccano). */
function statiCasuali(X: Any, session: Any, rnd: () => number): Map<string, Any> {
  const m = new Map<string, Any>();
  for (const b of session.blocks) {
    const ex = X.E.getExercise(b.exercise);
    const level = ex.pattern === null ? null : 1 + Math.floor(rnd() * 6);
    m.set(ex.slug, {
      exercise: ex.slug,
      level,
      eccentricBonusSeconds: Math.floor(rnd() * 3),
      bottomPauseBonusSeconds: Math.floor(rnd() * 3),
      loadKg: ex.loadPolicy === 'inherent' ? [8, 10, 12, 14.5][Math.floor(rnd() * 4)]! : 0,
    });
  }
  return m;
}

/* Un passo senza i campi che dipendono dalla posizione (`id`, `order`) e, se chiesto, senza i campi di R21. */
function forma(p: Any, senzaR21: boolean): string {
  const { id: _i, order: _o, ...resto } = p;
  if (p.kind === 'work' && senzaR21) {
    const { autoComplete: _a, recordActual: _r, ...r2 } = resto;
    return JSON.stringify(r2);
  }
  return JSON.stringify(resto);
}

/* Allinea il piano nuovo a quello di prima: i passi in più del nuovo devono essere solo `rest`. */
function allinea(nuovo: Any[], prima: Any[], senzaR21: boolean): { inseriti: { i: number; p: Any }[]; errore: string | null } {
  const inseriti: { i: number; p: Any }[] = [];
  let j = 0;
  for (let i = 0; i < nuovo.length; i += 1) {
    if (j < prima.length && forma(nuovo[i], senzaR21) === forma(prima[j], senzaR21)) { j += 1; continue; }
    if (nuovo[i].kind === 'rest') { inseriti.push({ i, p: nuovo[i] }); continue; }
    return { inseriti, errore: `passo ${String(i)} diverso: ${forma(nuovo[i], senzaR21).slice(0, 160)} contro ${j < prima.length ? forma(prima[j], senzaR21).slice(0, 160) : 'fine'}` };
  }
  if (j !== prima.length) return { inseriti, errore: `piano di prima più lungo: ${String(prima.length - j)} passi non ritrovati` };
  return { inseriti, errore: null };
}

const giriFinitura = (piano: Any[]): number => Math.max(0, ...piano.filter((p) => p.kind === 'work' && p.group === 'F').map((p) => p.step.round as number));

/* Riferimento di R20 dal testo: il passo inserito sta fra l'ultima stazione F del giro n e la F1 del giro n+1. */
function controllaInseriti(piano: Any[], inseriti: { i: number; p: Any }[]): string | null {
  const giri = giriFinitura(piano);
  if (inseriti.length !== Math.max(0, giri - 1)) return `${String(inseriti.length)} passi inseriti, attesi ${String(Math.max(0, giri - 1))} (giri ${String(giri)})`;
  for (const { i, p } of inseriti) {
    const prima = piano[i - 1];
    const dopo = piano[i + 1];
    if (prima?.kind !== 'work' || dopo?.kind !== 'work' || prima.group !== 'F' || dopo.group !== 'F') return `passo ${String(i)} non fra due stazioni F`;
    const n = prima.step.round as number;
    if (dopo.step.round !== n + 1) return `passo ${String(i)}: giro ${String(n)} → ${String(dopo.step.round)}`;
    if (dopo.blockCode !== 'F1') return `passo ${String(i)}: dopo c'è ${String(dopo.blockCode)}, attesa F1`;
    if (p.tier !== 'transizione' || p.seconds !== 15 || p.maxSeconds !== 15 || p.label !== 'Transizione') return `passo ${String(i)}: ${String(p.tier)} ${String(p.seconds)}/${String(p.maxSeconds)} «${String(p.label)}»`;
    const atteso = `Giro ${String(n)} finito. Posa l’attrezzo e prepara la prima stazione.`;
    if (p.hint !== atteso) return `passo ${String(i)}: consiglio «${String(p.hint)}»`;
    if (!String(p.nextLabel).endsWith(`· giro ${String(n + 1)} di ${String(giri)}`)) return `passo ${String(i)}: nextLabel «${String(p.nextLabel)}»`;
    if (p.task !== null) return `passo ${String(i)}: compito nella transizione`;
  }
  return null;
}

/* 20.5 dal testo: fra due work consecutivi di blocchi diversi, rest ≥ 15″, salvo quando il secondo è del gruppo Z. */
function eccezioni205(piano: Any[]): string[] {
  const out: string[] = [];
  let ultimo: Any = null;
  let pausa = 0;
  for (const p of piano) {
    if (p.kind === 'rest') { pausa += p.seconds; continue; }
    if (p.kind !== 'work') { ultimo = null; pausa = 0; continue; }
    if (ultimo !== null && ultimo.blockCode !== p.blockCode && p.group !== 'Z' && pausa < 15) out.push(`${String(ultimo.blockCode)}→${String(p.blockCode)} (giro ${String(p.step.round)}) ${String(pausa)}″`);
    ultimo = p;
    pausa = 0;
  }
  return out;
}

/* ============================== A · R20 ============================== */
console.log('--- A · R20 ---');
{
  /* 20.1 */
  const attesiN = [2320, 2215, 2178, 2383];
  const attesiV = [2305, 2200, 2163, 2368];
  const dn = ID4.map((id) => N.C.estimatedSeconds(N.C.buildGuidedPlan(sess(N, id), 1)) as number);
  const dv = ID4.map((id) => V.C.estimatedSeconds(V.C.buildGuidedPlan(sess(V, id), 1)) as number);
  riga(JSON.stringify(dn) === JSON.stringify(attesiN), '20.1', `nuova ${dn.map(String).join(' · ')} s (${dn.map(mmss).join(' · ')}); attese ${attesiN.join(' · ')}`);
  riga(JSON.stringify(dv) === JSON.stringify(attesiV), '20.1p', `positivo, radice di prima ${dv.map(String).join(' · ')} s; attese ${attesiV.join(' · ')}`);

  /* Struttura su settimane 1-13, stati vuoti e 60 stati casuali per circuito */
  const rnd = mulberry32(2026_11_21);
  let piani = 0; let erroriStruttura: string[] = []; let inseritiTot = 0; let fuoriPosto: string[] = [];
  let ecc205N = 0; let ecc205V = 0; const esempi205: string[] = []; let deltaErr: string[] = [];
  const perSettimana = new Map<number, { giri: Set<number>; ecc: number }>();
  for (const id of ID4) {
    const sN = sess(N, id); const sV = sess(V, id);
    const statiN: Map<string, Any>[] = [new Map()];
    for (let k = 0; k < 60; k += 1) statiN.push(statiCasuali(N, sN, rnd));
    for (let w = 1; w <= 18; w += 1) {
      for (const st of statiN) {
        let pn: Any[]; let pv: Any[];
        try { pn = N.C.buildGuidedPlan(sN, w, st); pv = V.C.buildGuidedPlan(sV, w, st); } catch (e) { erroriStruttura.push(`${id} w${String(w)}: ${String(e)}`); continue; }
        piani += 1;
        const a = allinea(pn, pv, true);
        if (a.errore !== null) { if (erroriStruttura.length < 5) erroriStruttura.push(`${id} w${String(w)}: ${a.errore}`); continue; }
        inseritiTot += a.inseriti.length;
        const c = controllaInseriti(pn, a.inseriti);
        if (c !== null && fuoriPosto.length < 5) fuoriPosto.push(`${id} w${String(w)}: ${c}`);
        const giri = giriFinitura(pn);
        const d = (N.C.estimatedSeconds(pn) as number) - (V.C.estimatedSeconds(pv) as number);
        if (d !== 15 * Math.max(0, giri - 1) && deltaErr.length < 5) deltaErr.push(`${id} w${String(w)}: Δ ${String(d)} con ${String(giri)} giri`);
        const en = eccezioni205(pn); const ev = eccezioni205(pv);
        ecc205N += en.length; ecc205V += ev.length;
        if (en.length > 0 && esempi205.length < 5) esempi205.push(`${id} w${String(w)}: ${en.join(', ')}`);
        const ps = perSettimana.get(w) ?? { giri: new Set<number>(), ecc: 0 };
        ps.giri.add(giri); if (st.size === 0) ps.ecc += ev.length; perSettimana.set(w, ps);
      }
    }
  }
  riga(erroriStruttura.length === 0, 'R20.S', `${String(piani)} piani (4 circuiti × settimane 1-18 × 61 stati): il nuovo è il piano di prima più soli passi rest${erroriStruttura.length ? ` — ${erroriStruttura.join(' | ')}` : ''}`);
  riga(fuoriPosto.length === 0 && inseritiTot > 0, '20.2/20.3', `${String(inseritiTot)} passi inseriti, tutti fra F-ultima del giro n e F1 del giro n+1, «Transizione» 15/15″, «Giro n finito. Posa l’attrezzo e prepara la prima stazione.», nextLabel «… · giro n+1 di N», nessun compito${fuoriPosto.length ? ` — ${fuoriPosto.join(' | ')}` : ''}`);
  riga(deltaErr.length === 0, '20.7a', `durata nuova − di prima = 15″ × (giri della finitura − 1) su ogni piano${deltaErr.length ? ` — ${deltaErr.join(' | ')}` : ''}`);
  riga(ecc205N === 0, '20.5', `eccezioni (rest < 15″ fra blocchi diversi, secondo non Z) nella nuova: ${String(ecc205N)}${esempi205.length ? ` — ${esempi205.join(' | ')}` : ''}`);
  riga(ecc205V > 0, '20.5p', `positivo, radice di prima: ${String(ecc205V)} eccezioni; a stati vuoti per settimana ${[...perSettimana].map(([w, x]) => `w${String(w)} ${String(x.ecc)} (giri ${[...x.giri].join('/')})`).join(', ')}`);

  /* 20.4: scarico (settimana 6), a stati vuoti, durate uguali */
  const d6n = ID4.map((id) => N.C.estimatedSeconds(N.C.buildGuidedPlan(sess(N, id), 6)) as number);
  const d6v = ID4.map((id) => V.C.estimatedSeconds(V.C.buildGuidedPlan(sess(V, id), 6)) as number);
  riga(JSON.stringify(d6n) === JSON.stringify(d6v), '20.4', `settimana 6 nuova ${d6n.map(mmss).join(' · ')} = prima ${d6v.map(mmss).join(' · ')}; rientro NON COPERTO (R9 non esiste)`);

  /* 20.6: «dentro i quaranta minuti», la più corta resta la 3 */
  const max = Math.max(...dn); const corta = ID4[dn.indexOf(Math.min(...dn))];
  riga(max < 2400 && corta === 'circuito-3', '20.6', `massimo a settimana piena ${mmss(max)} < 40:00; la più corta ${String(corta)}`);

  /* 20.7b: massimi raggiungibili, come M22.7b (ogni esercizio al gradino più lungo non solo eccentrico,
     eccentrica a 5″ e pausa a 2″ dove il tut le ha), su tutte e due le radici; circuito 4 senza tetto. */
  const fasi = (tut: string): { e: number | 'X'; p: number | 'X' } | null => {
    const parti = String(tut).split('-'); if (parti.length !== 4) return null;
    const f = (x: string): number | 'X' => (x === 'X' ? 'X' : Number(x)); return { e: f(parti[0]!), p: f(parti[1]!) };
  };
  const massimo = (X: Any, id: string): { s: number; gainHip: number | null } => {
    const s = sess(X, id);
    const base = new Map<string, Any>();
    for (const b of s.blocks) { const ex = X.E.getExercise(b.exercise); base.set(ex.slug, { exercise: ex.slug, level: ex.defaultLevel, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0, loadKg: ex.loadPolicy === 'inherent' ? 10 : 0 }); }
    const dur = (st: Map<string, Any>): number => X.C.estimatedSeconds(X.C.buildGuidedPlan(s, 1, st));
    const peggio = new Map(base);
    for (const b of s.blocks.filter((x: Any) => x.excludeFromReview !== true)) {
      const ex = X.E.getExercise(b.exercise); const t = fasi(b.tut);
      const e = t === null || t.e === 'X' ? 0 : Math.max(0, 5 - t.e); const p = t === null || t.p === 'X' ? 0 : Math.max(0, 2 - t.p);
      const livelli = ex.pattern === null ? [ex.defaultLevel] : [1, 2, 3, 4, 5, 6].filter((l) => !X.P.getProgressionStep(ex.pattern, l).eccentricOnly);
      let best = -Infinity; let bestS: Any = null;
      for (const l of livelli) { const cand = { ...peggio.get(ex.slug), level: l, eccentricBonusSeconds: e, bottomPauseBonusSeconds: p }; const d = dur(new Map(peggio).set(ex.slug, cand)); if (d > best) { best = d; bestS = cand; } }
      peggio.set(ex.slug, bestS);
    }
    let gainHip: number | null = null;
    if (id === 'circuito-4') {
      const hip = [...base.keys()].find((k) => k.startsWith('hip-thrust'));
      if (hip !== undefined) { const a = new Map(base).set(hip, { ...base.get(hip), level: 2 }); const b2 = new Map(base).set(hip, { ...base.get(hip), level: 3 }); gainHip = dur(b2) - dur(a); }
    }
    return { s: dur(peggio), gainHip };
  };
  const mN = ID4.map((id) => massimo(N, id)); const mV = ID4.map((id) => massimo(V, id));
  const attesiMax = ['46:40', '51:58', '49:30'];
  const tre = mN.slice(0, 3).map((x) => mmss(x.s));
  riga(JSON.stringify(tre) === JSON.stringify(attesiMax) && mN.slice(0, 3).every((x) => x.s < 3300), '20.7b', `massimi raggiungibili circuiti 1-3 nuova ${tre.join(' · ')} (attesi ${attesiMax.join(' · ')}, sotto 55:00); prima ${mV.slice(0, 3).map((x) => mmss(x.s)).join(' · ')}`);
  riga(mN.every((x, i) => x.s - mV[i]!.s === 15), '20.7c', `massimi nuova − prima: ${mN.map((x, i) => String(x.s - mV[i]!.s)).join(' · ')} s; circuito 4 senza tetto ${mmss(mN[3]!.s)} (prima ${mmss(mV[3]!.s)})`);
  riga(mN[3]!.gainHip === 255 && mV[3]!.gainHip === 255, '20.7d', `circuito 4, hip thrust 2 → 3 a bonus 0 (gli altri alla scheda): +${String(mN[3]!.gainHip)} s nuova, +${String(mV[3]!.gainHip)} s prima ⇒ estremo 55:00 + 4:15 = 59:15 invariato (il tetto comprende già i 15″)`);

  /* durataDellaSedutaDi (R19) su stati casuali: +15 */
  const rnd2 = mulberry32(55);
  let d19 = 0; let d19err = 0;
  for (let k = 0; k < 400; k += 1) {
    const id = ID4[k % 4]!; const st = statiCasuali(N, sess(N, id), rnd2);
    const slug = sess(N, id).blocks[0].exercise;
    const a = N.C.durataDellaSedutaDi(slug, st); const b = V.C.durataDellaSedutaDi(slug, st);
    d19 += 1; if (a - b !== 15) d19err += 1;
  }
  riga(d19err === 0, '20.7e', `durataDellaSedutaDi (R19) nuova − prima = 15 s su ${String(d19)} stati casuali (differenze ${String(d19err)})`);

  /* 20.9 */
  const motivo = String(N.DV.DEVIAZIONI_NOTA.find((d: Any) => d.sessione === 'circuito-2')?.motivo ?? '');
  riga(motivo.includes('36:18 contro 36:55') && !motivo.includes('36:03'), '20.9', `motivo circuito-2: «${motivo}»`);
}

/* ============================== B · R21 ============================== */
console.log('--- B · R21 ---');
{
  /* 21.1 su ogni piano */
  let piani = 0; const err: string[] = []; let z1 = 0; let posV = 0;
  for (const id of ID4) {
    for (let w = 1; w <= 18; w += 1) {
      const pn: Any[] = N.C.buildGuidedPlan(sess(N, id), w); const pv: Any[] = V.C.buildGuidedPlan(sess(V, id), w);
      piani += 1;
      for (const p of pn.filter((x) => x.kind === 'work' && x.group === 'Z')) {
        const e1 = p.blockCode === 'Z1';
        if (e1) z1 += 1;
        if (p.autoComplete !== !e1 || p.recordActual !== e1 || (e1 && p.workSeconds !== 30)) err.push(`${id} w${String(w)} ${String(p.blockCode)}: auto ${String(p.autoComplete)} rec ${String(p.recordActual)} ${String(p.workSeconds)}`);
      }
      for (const p of pn.filter((x) => x.kind === 'work' && x.group !== 'Z')) if (p.recordActual !== false) err.push(`${id} w${String(w)} ${String(p.blockCode)}: recordActual ${String(p.recordActual)}`);
      for (const p of pv.filter((x) => x.kind === 'work' && x.blockCode === 'Z1')) if (p.autoComplete === true) posV += 1;
    }
  }
  riga(err.length === 0 && z1 === piani, '21.1', `${String(piani)} piani: Z1 autoComplete false, recordActual true, workSeconds 30 (${String(z1)} Z1); Z2, Z3 automatiche; nessun altro recordActual${err.length ? ` — ${err.slice(0, 3).join(' | ')}` : ''}`);
  riga(posV === piani, '21.1p', `positivo, radice di prima: Z1 automatica in ${String(posV)} su ${String(piani)}`);

  /* Piani identici fra intermedia (solo R20) e nuova, salvo i campi di R21 */
  if (I !== null) {
    let diversi = 0;
    for (const id of ID4) for (let w = 1; w <= 18; w += 1) {
      const a = allinea(N.C.buildGuidedPlan(sess(N, id), w), I.C.buildGuidedPlan(sess(I, id), w), true);
      if (a.errore !== null || a.inseriti.length > 0) diversi += 1;
    }
    riga(diversi === 0, '21.S', `R21 non cambia nessun passo dei piani rispetto a R20 da solo (campi di R21 a parte): ${String(diversi)} piani diversi su 72`);
  }

  /* 21.4-21.5 contro il riferimento dal testo: floor(s), sotto 1 niente */
  let dm = 0; let nm = 0;
  for (let c = 0; c <= 3500; c += 1) { const s = c / 100; const atteso = Math.floor(s) >= 1 ? Math.floor(s) : null; nm += 1; if (N.C.tenutaMollata(s) !== atteso) dm += 1; }
  riga(dm === 0 && N.C.tenutaMollata(12.4) === 12 && N.C.tenutaMollata(0.6) === null, '21.4/21.5', `tenutaMollata su ${String(nm)} valori 0,00-35,00 s: ${String(dm)} diversi dal riferimento; 12,4 → ${String(N.C.tenutaMollata(12.4))}, 0,6 → ${String(N.C.tenutaMollata(0.6))}`);

  /* 21.6: campo numerico, «Registra» solo fra 1 e 29 (interi). Più stretto del testo è accettato (nessun numero in più). */
  const prove = ['', ' ', '0', '00', '1', '01', '18', ' 18 ', '29', '30', '31', '300', '-1', '+5', '5.0', '12.5', '1e1', '0x1A', '١٨', '18abc', 'Infinity', 'NaN', '9'.repeat(30)];
  const troppo: string[] = []; const strette: string[] = [];
  for (const t of prove) {
    const v = N.C.tenutaDichiarata(t, 30);
    const num = Number(t.trim());
    const ammessoDalTesto = t.trim() !== '' && Number.isInteger(num) && num >= 1 && num <= 29;
    if (v !== null && (!ammessoDalTesto || v !== num)) troppo.push(`«${t}» → ${String(v)}`);
    if (v === null && ammessoDalTesto) strette.push(`«${t}»`);
  }
  riga(troppo.length === 0 && N.C.tenutaDichiarata('18', 30) === 18, '21.6', `tenutaDichiarata su ${String(prove.length)} ingressi: nessun valore fuori da 1-29 o diverso da quello scritto${troppo.length ? ` — ${troppo.join(', ')}` : ''}; rifiutati pur interi nel testo: ${strette.length ? strette.join(', ') : 'nessuno'}`);

  /* 21.8 */
  const e12 = N.C.etichettaTenuta(12, 30); const e30 = N.C.etichettaTenuta(30, 30); const e29 = N.C.etichettaTenuta(29, 30);
  riga(e12 === '12″ su 30″' && e30 === '30″' && e29 === '29″ su 30″', '21.8', `«${String(e12)}» · «${String(e30)}» · «${String(e29)}»`);

  /* 21.9: revisione e volume con Z1 a 8, 12 e 30, contro Z1 assente (uscita intera, non solo i verdetti) */
  {
    const INIZIO = '2026-03-02';
    const piu = (x: string, n: number): string => new Date(Date.UTC(+x.slice(0, 4), +x.slice(5, 7) - 1, +x.slice(8, 10)) + n * 86_400_000).toISOString().slice(0, 10);
    const fineSett = (w: number): string => piu(INIZIO, 7 * w - 1);
    const serie = (vals: number[]): Any[] => vals.map((v, i) => ({ setIndex: i + 1, side: null, value: v, rir: null, loadKg: 0, heartRate: null, note: null }));
    const voce = (blockCode: string, exercise: string, vals: number[], level: number | null, tempo: boolean | null): Any => ({ blockCode, exercise, variantLabel: 'fixture', level, tempoRespected: tempo, sets: serie(vals), note: null });
    const c3 = sess(N, 'circuito-3');
    const a2 = c3.blocks.find((b: Any) => b.code === 'A2');
    const PU = a2.exercise;
    const conZ = (z: number | null) => [[8, '2026-03-09'], [12, '2026-03-11'], [30, '2026-03-13']].map(([v, d], i) => ({
      id: `z${String(i)}`, date: d, week: 2, sessionId: 'circuito-3', status: 'completed', note: null,
      exercises: [voce('A2', PU, [19, 19, 19], 2, true), ...(z === null ? [] : [voce('Z1', 'dead-hang', [z === -1 ? (v as number) : z], 2, true)])],
    }));
    const stati = new Map([[PU, { exercise: PU, level: 2, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0, loadKg: 0 }]]);
    const rv = (sessions: Any[]) => N.R.reviewWeek({ week: 2, sessions, states: stati, tests: new Map(), weekEnd: fineSett(2), today: piu(fineSett(2), 1), decisioni: [] });
    const senza = JSON.stringify(rv(conZ(null)));
    const varie = [-1, 8, 12, 30].map((z) => JSON.stringify(rv(conZ(z))));
    const nomina = varie.some((x) => x.includes('dead-hang'));
    riga(varie.every((x) => x === senza) && !nomina, '21.9a', `reviewWeek, uscita intera: Z1 a 8/12/30 (miste) e Z1 a 8, 12, 30 identiche a Z1 assente (${String(varie.filter((x) => x === senza).length)}/4); dead-hang nominato ${String(nomina)}`);
    const vs = JSON.stringify(N.M.volumeByGroup(conZ(null)));
    const vv = [-1, 8, 12, 30].map((z) => JSON.stringify(N.M.volumeByGroup(conZ(z))));
    riga(vv.every((x) => x === vs), '21.9b', `volumeByGroup con Z1 a 8, 12, 30 identico a Z1 assente (${String(vv.filter((x) => x === vs).length)}/4)`);
  }

  /* 21.10 e 21.11: R1 con 8″ → gradino 2; esito del test con il bersaglio */
  {
    const tr = { testId: 'dead-hang', date: '2026-11-09', week: 0, value: 8, left: null, right: null };
    let esiti: Any = null; let errore = '';
    try { esiti = N.G.testOutcomes('dead-hang', tr); } catch (e) { errore = String(e); }
    const s = JSON.stringify(esiti);
    riga(esiti !== null && esiti.length > 0 && esiti.every((x: Any) => x.level === 2 && x.notJudged === true && x.bersaglio === 30), '21.10/21.11', `testOutcomes dead-hang 8″: ${errore || s}`);
  }

  /* 21.13 sui dati di tutti i programmi (circuito e archiviati) */
  {
    const tutte: Any[] = [...N.D.CIRCUIT_SESSIONS, ...N.PR.PROGRAM_SESSIONS];
    const fuori: string[] = []; let conCampo = 0;
    for (const s of tutte) for (const b of s.blocks) {
      if (b.recordActual === undefined) continue;
      conCampo += 1;
      const ammesso = b.recordActual === true && b.prescription.kind === 'seconds' && b.prescription.min === b.prescription.max && b.excludeFromReview === true && b.perSide === false;
      if (!ammesso) fuori.push(`${String(s.id)}/${String(b.code)}`);
    }
    riga(fuori.length === 0 && conCampo === 4, '21.13', `${String(tutte.length)} sedute lette: recordActual su ${String(conCampo)} blocchi, tutti ammessi${fuori.length ? ` — fuori: ${fuori.join(', ')}` : ''}`);
  }
}

console.log(`\nTotale: ${String(ok)} OK · ${String(ko)} DIVERSO`);
process.exit(ko === 0 ? 0 : 1);
