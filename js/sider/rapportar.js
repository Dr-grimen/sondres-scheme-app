import { useEffect, useState } from 'preact/hooks';
import { html, Tom, fmt, dato } from '../ui.js';
import { last } from '../data.js';

const VEKEDAGAR = ['M', 'T', 'O', 'T', 'F', 'L', 'S'];

/* Handelskalender: éin rute per dag med dagens P&L frå papirboka (referanse C). */
function Kalender({ dagar }) {
  if (!dagar || !Object.keys(dagar).length) return html`<${Tom} tekst="ingen dagar i papirboka enno" />`;
  const datoar = Object.keys(dagar).sort();
  const start = new Date(datoar[0] + 'T00:00:00Z'); const slutt = new Date(datoar[datoar.length - 1] + 'T00:00:00Z');
  const fyrste = new Date(start); fyrste.setUTCDate(fyrste.getUTCDate() - ((fyrste.getUTCDay() + 6) % 7));   // måndag
  const celler = [];
  const maks = Math.max(1, ...Object.values(dagar).map((v) => Math.abs(v.pnl || 0)));
  for (let d = new Date(fyrste); d <= slutt || celler.length % 7 !== 0; d.setUTCDate(d.getUTCDate() + 1)) {
    const key = d.toISOString().slice(0, 10); const v = dagar[key];
    const a = v ? Math.min(1, Math.abs(v.pnl) / maks) : 0;
    const bg = v ? (v.pnl > 0 ? `rgba(52,211,153,${0.15 + 0.7 * a})` : (v.pnl < 0 ? `rgba(239,68,68,${0.15 + 0.7 * a})` : 'rgba(255,255,255,.08)')) : 'transparent';
    celler.push(html`<div title=${v ? `${key}: ${fmt(v.pnl, 0)} USD · eigenkapital ${fmt(v.eigenkapital, 0)}` : key} style=${`background:${bg};border:1px solid ${v ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.03)'};border-radius:4px;aspect-ratio:1;display:flex;align-items:center;justify-content:center;font:600 10px var(--mono);color:${v ? 'var(--tekst)' : 'var(--dempa)'}`}>${d.getUTCDate()}</div>`);
    if (celler.length > 7 * 26) break;
  }
  return html`<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;max-width:520px">${VEKEDAGAR.map((v) => html`<div class="stille" style="text-align:center;font:600 10px var(--mono)">${v}</div>`)}${celler}</div>`;
}

export function Rapportar() {
  const [r, setR] = useState(undefined);
  const [open, setOpen] = useState(null);
  useEffect(() => { last('rapportar').then(setR); }, []);
  if (r === undefined) return html`<div class="lastar mono">>>> LASTAR …</div>`;
  if (!r) return html`<${Tom} tekst="ingen rapportar enno" />`;
  const liste = r.rapportar || [];
  const dagar = r.kalender || {};
  const sum = Object.values(dagar).reduce((a, v) => a + (v.pnl || 0), 0);
  const gronne = Object.values(dagar).filter((v) => v.pnl > 0).length;
  return html`
    <div class="fase">>>> STEMME // RAPPORTAR · ${liste.length} I ARKIVET</div>
    <section class="kort"><h2>Handelskalender <small>papirboka · dagleg P&L · ${Object.keys(dagar).length} dagar · ${gronne} grøne · sum ${fmt(sum, 0)} USD</small></h2>
      <${Kalender} dagar=${dagar} />
    </section>
    <section class="kort"><h2>Telegram-rapportane <small>21:15 UTC kvar dag · trykk for å lese</small></h2>
      ${liste.length ? liste.map((x) => html`<div class="agent" style="cursor:pointer;margin-bottom:6px" onClick=${() => setOpen(open === x.dato ? null : x.dato)}>
        <div class="n"><span>${x.dato}</span><small>${x.linjer} LINJER</small></div>
        ${open === x.dato ? html`<pre class="rapport" style="margin-top:8px">${x.tekst}</pre>` : html`<div class="j">${(x.tekst || '').split('\\n')[1] || ''}</div>`}
      </div>`) : html`<${Tom} tekst="ingen rapportar arkiverte enno – fyrste kjem etter neste 21:15-køyring" />`}
    </section>`;
}
