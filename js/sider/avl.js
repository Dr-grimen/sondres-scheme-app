import { useEffect, useRef, useState } from 'preact/hooks';
import { html, Fase, Flis, Tom, fmt, pstRaa, dato } from '../ui.js';
import { lastAlle } from '../data.js';

const FARGAR = ['#22d3ee', '#a78bfa', '#f59e0b', '#34d399', '#e879f9', '#60a5fa', '#fb923c', '#f43f5e', '#67e8f9', '#c4b5fd'];

/* Avl: kurvane til dei overlevande feiar inn frå venstre mot skannelinja (referanse A).
   Kvar kurve er ekte in-sample-eigenkapital (200 punkt) frå siste kampanje. */
function Kurvefelt({ overlevande }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv || !overlevande || !overlevande.length) return;
    const ctx = cv.getContext('2d'); const dpr = Math.min(devicePixelRatio || 1, 2); let raf, kjør = true; const t0 = performance.now();
    const resize = () => { const r = cv.getBoundingClientRect(); cv.width = r.width * dpr; cv.height = r.height * dpr; };
    resize(); addEventListener('resize', resize);
    const kurver = overlevande.filter((o) => o.kurve && o.kurve.length > 2).slice(0, 60);
    let lo = Infinity, hi = -Infinity;
    for (const o of kurver) for (const v of o.kurve) { const l = Math.log(Math.max(v, 1e-6)); lo = Math.min(lo, l); hi = Math.max(hi, l); }
    if (!isFinite(lo)) { lo = -0.5; hi = 0.5; }
    const teikn = (t) => {
      if (!kjør) return;
      const w = cv.width, h = cv.height; ctx.clearRect(0, 0, w, h);
      const fram = Math.min(1, ((t - t0) / 5000));           // kurvane veks fram over 5 s
      ctx.lineWidth = 1.1 * dpr;
      kurver.forEach((o, i) => {
        const k = o.kurve; const n = Math.max(2, Math.floor(k.length * fram)); const farge = FARGAR[i % FARGAR.length];
        ctx.strokeStyle = farge; ctx.globalAlpha = 0.85; ctx.shadowColor = farge; ctx.shadowBlur = 4 * dpr; ctx.beginPath();
        for (let j = 0; j < n; j++) { const x = (j / (k.length - 1)) * w * 0.94 + 8 * dpr; const y = h - 10 * dpr - ((Math.log(Math.max(k[j], 1e-6)) - lo) / (hi - lo || 1)) * (h - 24 * dpr); j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke();
      });
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      const sx = (fram * 0.94 * w) + 8 * dpr; ctx.fillStyle = 'rgba(239,68,68,0.9)'; ctx.fillRect(sx, 0, 1.5 * dpr, h);
      // 1.0-linja
      const y1 = h - 10 * dpr - ((0 - lo) / (hi - lo || 1)) * (h - 24 * dpr); ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.setLineDash([4 * dpr, 4 * dpr]); ctx.beginPath(); ctx.moveTo(0, y1); ctx.lineTo(w, y1); ctx.stroke(); ctx.setLineDash([]);
      if (fram < 1) raf = requestAnimationFrame(teikn);
    };
    raf = requestAnimationFrame(teikn);
    return () => { kjør = false; cancelAnimationFrame(raf); removeEventListener('resize', resize); };
  }, [overlevande]);
  return html`<canvas ref=${ref} style="width:100%;height:300px;display:block;background:#000;border-radius:10px"></canvas>`;
}

export function Avl() {
  const [d, setD] = useState(undefined);
  const [vald, setVald] = useState(null);
  useEffect(() => { lastAlle(['kampanje', 'genom']).then(setD); }, []);
  if (d === undefined) return html`<div class="lastar mono">>>> LASTAR …</div>`;
  const k = d && d.kampanje; const gen = (d && d.genom && d.genom.genom) || [];
  if (!k || !k.n_genom) return html`<${Fase} nr=3 namn="Avl" /><${Tom} tekst="ingen kampanje køyrd enno" />`;
  const ov = k.overlevande || [];
  // fitness per generasjon (beste og median) – ekte tal frå genom.json
  const perGen = {};
  for (const g of gen) { if (g[2] == null || g[2] <= -800) continue; (perGen[g[1]] = perGen[g[1]] || []).push(g[2] / 100); }
  const rader = Object.keys(perGen).map(Number).sort((a, b) => a - b).map((g) => { const v = perGen[g].sort((a, b) => a - b); return { g, n: v.length, beste: v[v.length - 1], median: v[Math.floor(v.length / 2)] }; });
  const maksBeste = Math.max(...rader.map((r) => r.beste), 0.01);
  return html`
    <${Fase} nr=3 namn=${`Avl · ${fmt(k.generasjonar)} generasjonar · ${fmt(k.n_overlevande)} overlevande`} />
    <section class="kort"><h2>Overlevande, in-sample-eigenkapital <small>${ov.length} kurver frå ${k.dato} · logaritmisk · start 1,0</small></h2>
      <${Kurvefelt} overlevande=${ov} />
      <p class="stille" style="margin:10px 0 0">Kurvane er in-sample: modellen har sett desse dagane. Difor er dei alle fine. Eksamen skjer på dagane etter ${(k.eigedelar || [])[0]?.in_sample_slutt || '…'}, som ingen genom har sett.</p>
    </section>
    <section class="kort"><h2>Fitness per generasjon <small>beste og median · ekte tal</small></h2>
      ${rader.length ? html`<div class="scroll"><table><thead><tr><th class="r">Gen.</th><th class="r">Genom</th><th class="r">Beste</th><th class="r">Median</th><th style="width:40%">–</th></tr></thead><tbody>
        ${rader.map((r) => html`<tr><td class="r">${r.g}</td><td class="r">${fmt(r.n)}</td><td class="r opp">${fmt(r.beste, 2)}</td><td class="r">${fmt(r.median, 2)}</td><td><div class="stolpe"><i style=${`width:${Math.max(0, 100 * r.beste / maksBeste)}%`}></i></div></td></tr>`)}
      </tbody></table></div>` : html`<${Tom} />`}
    </section>
    <section class="kort"><h2>Slekta til dei overlevande <small>trykk for detaljar</small></h2>
      <div class="scroll"><table><thead><tr><th>Eigedel</th><th>Genom</th><th class="r">Gen.</th><th class="r">Foreldre</th><th class="r">Fitness</th><th class="r">Sharpe</th><th class="r">Handlar</th><th class="r">MDD</th></tr></thead><tbody>
        ${ov.map((o) => html`<tr class="klikk fremja" onClick=${() => setVald(vald === o.id ? null : o.id)}><td>${o.eigedel}</td><td class="mono">${o.id}</td><td class="r">${o.generasjon}</td><td class="r">${(o.foreldre || []).length}</td><td class="r">${fmt(o.fitness, 2)}</td><td class="r">${fmt(o.metrikkar?.sharpe, 2)}</td><td class="r">${fmt(o.metrikkar?.n_handlar)}</td><td class="r">${pstRaa(o.metrikkar?.maks_drawdown, 0)}</td></tr>
          ${vald === o.id ? html`<tr><td colspan="8" class="status"><b>Regel:</b> ${o.skildring}<br/><b>Foreldre:</b> ${(o.foreldre || []).join(', ') || 'ingen (tilfeldig genom)'}<br/><span class="stille">kjelde: results/kampanje/siste.json</span></td></tr>` : null}`)}
      </tbody></table></div>
    </section>`;
}
