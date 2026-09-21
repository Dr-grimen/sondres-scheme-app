/* Felles byggjeklossar. Alt på nynorsk. Ingen tal utan kjelde: komponentane viser det dei får,
   og «ingen data enno» når dei får null. */
import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import htm from 'htm';

export const html = htm.bind(h);

export const SIDER = [
  { id: 'oversikt', namn: 'Oversikt', ik: '◎' },
  { id: 'arbitrase', namn: 'Arbitrasje', ik: '⇌' },
  { id: 'selskapet', namn: 'Botane', ik: '▣' },
  { id: 'meklarar', namn: 'Kontoar', ik: '⇄' },
  { id: 'uttak', namn: 'Uttak', ik: '⇣' },
  { id: 'sanning', namn: 'Sanning', ik: '◇' },
];

export const FASAR = ['Skanning', 'Prøvebane', 'Avl', 'Eksamen', 'Stresslab', 'Portefølje', 'Papir', 'Demo', 'Live'];

const nb = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 });
export function fmt(x, des = 0) {
  if (x === null || x === undefined || Number.isNaN(Number(x))) return '–';
  return new Intl.NumberFormat('nb-NO', { minimumFractionDigits: des, maximumFractionDigits: des }).format(Number(x));
}
export function pst(x, des = 1) {
  if (x === null || x === undefined || Number.isNaN(Number(x))) return '–';
  const v = Number(x) * 100;
  return (v > 0 ? '+' : '') + fmt(v, des) + ' %';
}
export function pstRaa(x, des = 0) {
  if (x === null || x === undefined || Number.isNaN(Number(x))) return '–';
  return fmt(Number(x) * 100, des) + ' %';
}
export function dato(ts, med_tid = true) {
  if (!ts) return '–';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return String(ts);
  return d.toLocaleString('nb-NO', med_tid ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' });
}
export function klokke(ts) {
  if (!ts) return '–';
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? '–' : d.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
}
export function alderTekst(ts) {
  if (!ts) return 'ukjend alder';
  const m = Math.round((Date.now() - new Date(ts).getTime()) / 60000);
  if (m < 2) return 'nett no';
  if (m < 90) return `${m} min sidan`;
  const t = Math.round(m / 60);
  if (t < 36) return `${t} t sidan`;
  return `${Math.round(t / 24)} d sidan`;
}

/* Tal som tel opp frå 0 (referanse A). Berre pynt: sluttverdien er alltid den ekte. */
export function TalOpp({ v, des = 0, suffix = '', kl = '' }) {
  const [vis, setVis] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (v === null || v === undefined || Number.isNaN(Number(v))) { setVis(null); return; }
    const mål = Number(v); const start = performance.now(); const varig = 900;
    cancelAnimationFrame(ref.current);
    if (document.hidden) { setVis(mål); return; }   // usynleg fane: ingen animasjon, rett tal med ein gong
    const steg = (t) => { const p = Math.min(1, (t - start) / varig); const e = 1 - Math.pow(1 - p, 3); setVis(mål * e); if (p < 1) ref.current = requestAnimationFrame(steg); };
    ref.current = requestAnimationFrame(steg);
    const vakt = setTimeout(() => { cancelAnimationFrame(ref.current); setVis(mål); }, varig + 300);   // rAF kan stoppe i bakgrunnen; talet skal alltid ende rett
    return () => { cancelAnimationFrame(ref.current); clearTimeout(vakt); };
  }, [v]);
  if (vis === null) return html`<span class="v ${kl}">–</span>`;
  return html`<span class="v ${kl}">${fmt(vis, des)}${suffix}</span>`;
}

export function Flis({ v, l, des = 0, suffix = '', kl = '', tekst = null }) {
  return html`<div class="flis">${tekst !== null ? html`<div class="v ${kl}">${tekst}</div>` : html`<${TalOpp} v=${v} des=${des} suffix=${suffix} kl=${kl} />`}<div class="l">${l}</div></div>`;
}

export function Tom({ tekst = 'ingen data enno' }) { return html`<p class="tom">${tekst}</p>`; }

export function Fase({ nr, namn, raud = false }) {
  const n = String(nr).padStart(2, '0');
  return html`<div class="fase ${raud ? 'raud' : ''}">>>> FASE ${n} // ${namn.toUpperCase()}</div>`;
}

export function Fasestripe({ aktiv }) {
  return html`<div class="fasestripe">${FASAR.map((f, i) => {
    const kl = i < aktiv ? 'ferdig' : (i === aktiv ? 'aktiv' : (i >= 7 ? 'laast' : ''));
    return html`<span class="f ${kl}">${String(i + 1).padStart(2, '0')} ${f.toUpperCase()}</span>`;
  })}</div>`;
}

/* Tynn glødande kurve. punkt = [[x|ts, y], ...] i rekkjefølgje. */
export function Kurve({ punkt, farge = 'var(--cyan)', h = 120, basis = null, tittel = '' }) {
  if (!punkt || punkt.length < 2) return html`<${Tom} tekst=${punkt && punkt.length === 1 ? 'berre eitt punkt enno, kurva kjem når det er to' : 'ingen data enno'} />`;
  const w = 600; const ys = punkt.map((p) => Number(p[1]));
  let lo = Math.min(...ys), hi = Math.max(...ys);
  if (basis !== null) { lo = Math.min(lo, basis); hi = Math.max(hi, basis); }
  if (hi - lo < 1e-9) { hi = lo + 1; lo -= 1; }
  const x = (i) => 8 + (i / (punkt.length - 1)) * (w - 16);
  const y = (v) => 8 + (1 - (v - lo) / (hi - lo)) * (h - 16);
  const d = ys.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const sist = ys[ys.length - 1];
  return html`<div class="kurve" title=${tittel}><svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    ${basis !== null ? html`<line x1="8" x2=${w - 8} y1=${y(basis)} y2=${y(basis)} stroke="rgba(255,255,255,.12)" stroke-dasharray="4 4" />` : null}
    <path d=${d} fill="none" stroke=${farge} stroke-width="1.6" class="glod" />
    <circle cx=${x(ys.length - 1)} cy=${y(sist)} r="3" fill=${farge} />
  </svg></div>`;
}

export function aktivitetslogg(tilstand, tankar, no = Date.now()) {
  const harRegister = Array.isArray(tilstand && tilstand.agentar);
  const register = new Set(((tilstand && tilstand.agentar) || []).map((a) => a.namn));
  const fullLogg = Array.isArray(tankar && tankar.per_agent);
  const rader = (tankar && (fullLogg ? tankar.per_agent : tankar.tankar)) || [];
  const logga = new Set(rader.map((r) => r.agent).filter(Boolean));
  const registrerte = [...logga].filter((namn) => register.has(namn)).length;
  const tidspunkt = rader.map((r) => fullLogg ? r.siste : r.ts).filter((ts) => Number.isFinite(Date.parse(ts)));
  tidspunkt.sort((a, b) => Date.parse(b) - Date.parse(a));
  const siste = tidspunkt[0] || null;
  const dag = (tankar && tankar.dag) || (siste ? new Date(siste).toISOString().slice(0, 10) : null);
  const alder = siste ? no - Date.parse(siste) : null;
  return { dag, siste, fullLogg, harRegister, registrerte, historiske: harRegister ? logga.size - registrerte : 0,
    logga: logga.size, totalt: harRegister ? register.size : ((tilstand && tilstand.n_agentar) || 0),
    fersk: dag === new Date(no).toISOString().slice(0, 10) && alder !== null && alder >= -300000 && alder <= 3 * 3600000 };
}

export function Topp({ tilstand, tittel }) {
  // Sida handlar berre om arbitrasje (Sondre 21. sep 2026): toppen viser motoren i Zurich, ikkje dei gamle agentane.
  const a = tilstand && tilstand.arb;
  const botar = a && a.botar && a.botar.tal ? Object.values(a.botar.tal).reduce((x, y) => x + y, 0) : 480;
  const fersk = a && a.ts && Date.now() - new Date(a.ts).getTime() < 3 * 3600 * 1000;
  const modus = !a ? 'INGEN STATUS' : (a.pause ? 'PAUSE' : (a.live ? 'EKTE' : 'AV'));
  const tekst = a ? `${a.pause ? 'PAUSE' : (a.live ? 'ARBITRASJE PÅ' : 'ARBITRASJE AV')} · ${botar} botar skannar ${fmt(a.par)} like par · status ${alderTekst(a.ts)}`
    : 'INGEN STATUS FRÅ MOTOREN ENNO';
  return html`<header class="topp">
    <h1>Sondres scheme <small>${tittel}</small></h1>
    <span class="modus modus-${modus === 'EKTE' ? 'EKTE' : 'PAPIR'}" title="Ekte handel er på når brytaren er slått på og motoren ikkje står på pause">${modus}</span>
    <span class="live ${fersk ? '' : 'stille'}" title="Status frå arbitrasjemotoren på serveren i Zurich, henta av skya">
      <span class="prikk"></span> ${tekst}</span>
  </header>`;
}

export function Nav({ side }) {
  return html`<nav class="nav">
    <div class="logo">SONDRES SCHEME<small>ARBITRASJE · KALSHI ↔ POLYMARKET</small></div>
    ${SIDER.map((s) => html`<a href=${'#/' + s.id} class=${side === s.id ? 'aktiv' : ''}><span class="ik">${s.ik}</span><span>${s.namn.toUpperCase()}</span></a>`)}
  </nav>`;
}

export function Varsel({ children }) { return html`<div class="varsel">${children}</div>`; }
