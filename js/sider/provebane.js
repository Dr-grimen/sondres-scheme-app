import { useEffect, useRef, useState } from 'preact/hooks';
import { html, Fase, Flis, Tom, fmt, dato } from '../ui.js';
import { lastAlle } from '../data.js';

/* Prøvebane: partikkelfeltet. Kvar prikk er eit ekte genom frå siste kampanje
   (results/kampanje/<dato>/<symbol>.json.gz). Døde er mørke, overlevande gløder. */
function Partikkelfelt({ genom, eigedelar }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv || !genom) return;
    const ctx = cv.getContext('2d'); let raf; let t0 = performance.now(); let kjør = true;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const resize = () => { const r = cv.getBoundingClientRect(); cv.width = r.width * dpr; cv.height = r.height * dpr; };
    resize(); addEventListener('resize', resize);
    // deterministisk plassering: kolonne per eigedel, y etter fitness, litt støy frå indeks
    const n = genom.length;
    const P = new Float32Array(n * 2); const S = new Uint8Array(n);
    let fmin = Infinity, fmax = -Infinity;
    for (const g of genom) { const f = g[2] == null ? null : g[2] / 100; if (f != null && f > -8) { fmin = Math.min(fmin, f); fmax = Math.max(fmax, f); } }
    if (!isFinite(fmin)) { fmin = -1; fmax = 1; }
    genom.forEach((g, i) => {
      const k = g[0] ?? 0; const ncol = Math.max(1, eigedelar.length);
      const h1 = ((i * 2654435761) >>> 0) / 4294967296, h2 = (((i * 40503 + 12345) >>> 0) % 65536) / 65536;
      const fr = g[2] == null ? null : g[2] / 100;
      const f = fr == null || fr <= -8 ? fmin - 0.15 * (fmax - fmin) : fr;
      P[i * 2] = (k + 0.08 + 0.84 * h1) / ncol;
      P[i * 2 + 1] = 1 - Math.max(0, Math.min(1, (f - (fmin - 0.15 * (fmax - fmin))) / ((fmax - fmin) * 1.15 || 1))) * 0.9 - 0.05 + (h2 - 0.5) * 0.02;
      S[i] = g[3] === 1 ? 2 : (g[1] > 0 ? 1 : 0);
    });
    const teikn = (t) => {
      if (!kjør) return;
      const w = cv.width, h = cv.height; ctx.clearRect(0, 0, w, h);
      const sveip = ((t - t0) / 6000) % 1.1;                     // skannelinje frå venstre til høgre
      for (let i = 0; i < n; i++) {
        const x = P[i * 2] * w, y = P[i * 2 + 1] * h; const s = S[i];
        const synleg = P[i * 2] < sveip;                          // prikkane «blir til» når linja passerer
        if (!synleg) continue;
        if (s === 2) { ctx.fillStyle = 'rgba(34,211,238,0.95)'; ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 10 * dpr; ctx.beginPath(); ctx.arc(x, y, 2.4 * dpr, 0, 7); ctx.fill(); ctx.shadowBlur = 0; }
        else if (s === 1) { ctx.fillStyle = 'rgba(160,110,60,0.55)'; ctx.fillRect(x, y, 1.2 * dpr, 1.2 * dpr); }
        else { ctx.fillStyle = 'rgba(90,60,70,0.45)'; ctx.fillRect(x, y, 1 * dpr, 1 * dpr); }
      }
      if (sveip <= 1) { const sx = sveip * w; const g = ctx.createLinearGradient(sx - 40 * dpr, 0, sx, 0); g.addColorStop(0, 'rgba(239,68,68,0)'); g.addColorStop(1, 'rgba(239,68,68,0.7)'); ctx.fillStyle = g; ctx.fillRect(sx - 40 * dpr, 0, 40 * dpr, h); ctx.fillStyle = '#ef4444'; ctx.fillRect(sx, 0, 1.5 * dpr, h); }
      // kolonneetikettar
      ctx.fillStyle = 'rgba(159,179,189,0.9)'; ctx.font = `${10 * dpr}px ui-monospace, Menlo, monospace`;
      eigedelar.forEach((e, i) => { ctx.fillText(e.toUpperCase().slice(0, 14), ((i + 0.05) / eigedelar.length) * w, h - 6 * dpr); });
      raf = requestAnimationFrame(teikn);
    };
    raf = requestAnimationFrame(teikn);
    return () => { kjør = false; cancelAnimationFrame(raf); removeEventListener('resize', resize); };
  }, [genom, eigedelar]);
  return html`<canvas ref=${ref} style="width:100%;height:340px;display:block;background:#000;border-radius:10px"></canvas>`;
}

export function Provebane() {
  const [d, setD] = useState(undefined);
  useEffect(() => { lastAlle(['kampanje', 'genom']).then(setD); }, []);
  if (d === undefined) return html`<div class="lastar mono">>>> LASTAR …</div>`;
  const k = d && d.kampanje; const gd = d && d.genom; const gen = (gd && gd.genom) || [];
  if (!k || !k.n_genom) return html`<${Fase} nr=2 namn="Prøvebane" /><${Tom} tekst="ingen kampanje køyrd enno – kjem sundag 03:00 UTC, eller køyr python -m scheme.main avl" />`;
  const eigedelar = (gd && gd.eigedelar && gd.eigedelar.length) ? gd.eigedelar : (k.eigedelar || []).map((e) => e.eigedel);
  const doede = Object.entries(k.dodsaarsaker || {}).sort((a, b) => b[1] - a[1]);
  const gen0 = gen.filter((g) => g[1] === 0).length;
  return html`
    <${Fase} nr=2 namn=${`Prøvebane · ${fmt(k.n_genom)} genom · ${eigedelar.length} eigedelar`} />
    <section class="kort"><h2>Genom-feltet <small>kvar prikk er ein ekte strategi frå ${dato(k.ts)} · høgt = betre in-sample-fitness · cyan = overlevande · viser ${fmt(gd?.n_vist)} av ${fmt(gd?.n_totalt)} (${gd?.utval || ''})</small></h2>
      <${Partikkelfelt} genom=${gen} eigedelar=${eigedelar} />
      <div class="tal" style="margin-top:12px">
        <${Flis} v=${gen0} l="tilfeldige genom (generasjon 0)" />
        <${Flis} v=${k.n_genom} l="genom totalt etter avl" kl="cyan" />
        <${Flis} v=${k.n_overlevande} l="overlevande til eksamen" kl="gron" />
        <${Flis} v=${k.n_dode} l="gravplass" kl="raud" />
      </div>
      <p class="stille" style="margin:10px 0 0">In-sample. Dette er ikkje bevis: prøvebana finn kandidatar. Beviset kjem i eksamen (usett data) og stresslab. Kampanjen tok ${fmt(k.varigheit_s)} s.</p>
    </section>
    <section class="kort"><h2>Gravplassen <small>dødsårsaker, ${fmt(k.n_dode)} genom</small></h2>
      ${doede.length ? html`<div class="scroll"><table><thead><tr><th>Årsak</th><th class="r">Tal</th><th class="r">Del</th></tr></thead><tbody>
        ${doede.map(([a, n]) => html`<tr class="dod"><td>${a}</td><td class="r">${fmt(n)}</td><td class="r">${fmt(100 * n / k.n_dode, 1)} %</td></tr>`)}
      </tbody></table></div>` : html`<${Tom} />`}
    </section>
    <section class="kort"><h2>Per eigedel</h2>
      <div class="scroll"><table><thead><tr><th>Eigedel</th><th class="r">Barar</th><th>In-sample</th><th class="r">Genom</th><th class="r">Gen.</th><th class="r">Overlevande</th><th class="r">Døde</th><th class="r">Sek.</th></tr></thead><tbody>
        ${(k.eigedelar || []).map((e) => html`<tr><td>${e.eigedel}</td><td class="r">${fmt(e.n_barar)}</td><td class="mono stille">${e.in_sample_start} → ${e.in_sample_slutt}</td><td class="r">${fmt(e.n_genom)}</td><td class="r">${e.generasjonar}</td><td class="r opp">${e.n_overlevande}</td><td class="r ned">${fmt(e.n_dode)}</td><td class="r">${fmt(e.varigheit_s, 1)}</td></tr>`)}
      </tbody></table></div>
    </section>`;
}
