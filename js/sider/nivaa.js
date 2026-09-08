import { useEffect, useRef, useState } from 'preact/hooks';
import { html, Tom, fmt, pst, dato } from '../ui.js';
import { last } from '../data.js';

/* Nivå: støtte- og motstandssoner per eigedel, teikna på eit lysdiagram. Kva sone prisen er nærmast,
   og kva nivå som stadfestar brot opp eller ned. Alt frå results/nivaa/siste.json. */

function teikn(kanvas, e) {
  if (!kanvas || !e || !(e.kurs || []).length) return;
  const dpr = window.devicePixelRatio || 1;
  const b = kanvas.parentElement.clientWidth, h = 320;
  kanvas.width = b * dpr; kanvas.height = h * dpr;
  kanvas.style.width = b + 'px'; kanvas.style.height = h + 'px';
  const c = kanvas.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, b, h);
  const kurs = e.kurs.slice(-120);
  const soner = e.soner || [];
  let lo = Math.min(...kurs.map((k) => k.l)), hi = Math.max(...kurs.map((k) => k.h));
  for (const s of soner) { lo = Math.min(lo, s.laag); hi = Math.max(hi, s.hoeg); }
  const pad = (hi - lo) * 0.06 || 1; lo -= pad; hi += pad;
  const y = (v) => h - 24 - ((v - lo) / (hi - lo)) * (h - 44);
  const bredd = Math.max(2, (b - 60) / kurs.length);
  // soner
  for (const s of soner) {
    const y1 = y(s.hoeg), y2 = y(s.laag);
    const gron = s.type === 'stotte';
    c.fillStyle = gron ? `rgba(52,211,153,${0.06 + 0.03 * Math.min(4, s.styrke || 1)})` : `rgba(239,68,68,${0.06 + 0.03 * Math.min(4, s.styrke || 1)})`;
    c.fillRect(0, Math.min(y1, y2), b - 52, Math.max(2, Math.abs(y2 - y1)));
    c.fillStyle = gron ? 'rgba(52,211,153,.75)' : 'rgba(239,68,68,.75)';
    c.font = '10px ui-monospace, monospace';
    c.fillText(fmt(s.midt, s.midt > 100 ? 1 : 4), b - 50, Math.min(y1, y2) + 10);
  }
  // lys
  kurs.forEach((k, i) => {
    const x = 4 + i * bredd;
    const opp = k.c >= k.o;
    c.strokeStyle = opp ? '#34d399' : '#ef4444'; c.fillStyle = c.strokeStyle; c.lineWidth = 1;
    c.beginPath(); c.moveTo(x + bredd / 2, y(k.h)); c.lineTo(x + bredd / 2, y(k.l)); c.stroke();
    const y1 = y(k.o), y2 = y(k.c);
    c.fillRect(x + 0.5, Math.min(y1, y2), Math.max(1, bredd - 1.5), Math.max(1, Math.abs(y2 - y1)));
  });
  const a = e.analyse || {};
  // brotnivå
  c.setLineDash([4, 4]); c.lineWidth = 1;
  for (const [v, farge, tekst] of [[a.utbrot_over, '#34d399', 'brot opp'], [a.brot_under, '#ef4444', 'brot ned']]) {
    if (v == null) continue;
    c.strokeStyle = farge; c.beginPath(); c.moveTo(0, y(v)); c.lineTo(b - 52, y(v)); c.stroke();
    c.fillStyle = farge; c.font = '10px ui-monospace, monospace'; c.fillText(tekst + ' ' + fmt(v, v > 100 ? 1 : 4), 6, y(v) - 3);
  }
  c.setLineDash([]);
  if (a.pris != null) {
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.moveTo(0, y(a.pris)); c.lineTo(b - 52, y(a.pris)); c.stroke();
    c.fillStyle = '#fff'; c.fillText(fmt(a.pris, a.pris > 100 ? 2 : 4), b - 50, y(a.pris) + 3);
  }
}

export function Nivaa() {
  const [d, setD] = useState(undefined);
  const [vald, setVald] = useState(null);
  const kanvas = useRef(null);
  useEffect(() => { last('nivaa').then(setD); }, []);
  const eigedelar = (d && d.eigedelar) || {};
  const noklar = Object.keys(eigedelar);
  const n = vald && eigedelar[vald] ? vald : noklar[0];
  useEffect(() => {
    if (!n) return;
    const f = () => teikn(kanvas.current, eigedelar[n]);
    f(); addEventListener('resize', f); return () => removeEventListener('resize', f);
  }, [n, d]);
  if (d === undefined) return html`<div class="lastar mono">>>> LASTAR …</div>`;
  if (!noklar.length) return html`<${Tom} tekst="Nivåvakta har ikkje køyrt enno" />`;
  const e = eigedelar[n]; const a = e.analyse || {};
  return html`
    <div class="fase">>>> SANSAR // STØTTE OG MOTSTAND</div>
    <section class="kort"><h2>${e.namn || e.symbol} <small>${e.intervall} · sist ${dato(d.ts)}</small></h2>
      <div style="margin-bottom:10px">${noklar.map((k) => html`<button class=${'knapp' + (k === n ? ' aktiv' : '')} onClick=${() => setVald(k)}>${(eigedelar[k].namn || k).slice(0, 16)}</button> `)}</div>
      <canvas ref=${kanvas} style="width:100%;height:320px"></canvas>
      <p style="margin:10px 0 0"><b>${a.tekst_nn || 'ingen analyse'}</b></p>
      <p class="stille">Pris ${fmt(a.pris, 4)} · ATR ${fmt(a.atr, 4)} · trend mot SMA50: ${a.trend_sma50 || '–'}${a.siste_bar_ufullstendig ? ' · siste bar er ikkje ferdig' : ''}</p>
    </section>
    <section class="kort"><h2>Sonene <small>${(e.soner || []).length} · styrke = tal treff</small></h2>
      <div class="scroll"><table><thead><tr><th>Type</th><th class="r">Frå</th><th class="r">Til</th><th class="r">Styrke</th><th class="r">Treff</th><th>Kjelder</th><th>Sist</th></tr></thead><tbody>
        ${(e.soner || []).map((s) => html`<tr><td><span class="merk ${s.type === 'stotte' ? 'gron' : (s.type === 'motstand' ? 'raud' : 'gul')}">${s.type.toUpperCase()}</span></td>
          <td class="r">${fmt(s.laag, 4)}</td><td class="r">${fmt(s.hoeg, 4)}</td><td class="r">${s.styrke}</td><td class="r">${s.n_treff}</td>
          <td class="status">${(s.kjelder || []).join(', ')}</td><td>${s.sist ? dato(s.sist, false) : '–'}</td></tr>`)}
      </tbody></table></div>
    </section>`;
}
