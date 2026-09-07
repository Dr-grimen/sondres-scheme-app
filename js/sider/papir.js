import { useEffect, useState } from 'preact/hooks';
import { html, Fase, Flis, Kurve, Tom, fmt, pst, dato } from '../ui.js';
import { last } from '../data.js';

export function Papir({ tilstand }) {
  const [p, setP] = useState(undefined);
  useEffect(() => { last('papir').then(setP); }, []);
  if (p === undefined) return html`<div class="lastar mono">>>> LASTAR …</div>`;
  if (!p || p.eigenkapital == null) return html`<${Fase} nr=7 namn="Papir" /><${Tom} tekst="papirboka har ikkje starta enno" />`;
  const modus = p.modus || 'PAPIR';
  const hist = p.historikk || [];
  const sidan = p.kapital_start ? p.eigenkapital / p.kapital_start - 1 : null;
  const dagens = hist.length ? hist[hist.length - 1].dagens_pnl : null;
  const posisjonar = p.posisjonar || [];
  return html`
    <${Fase} nr=7 namn=${`Papir · ${modus}`} raud=${modus === 'EKTE'} />
    <section class="kort"><h2>${modus === 'PAPIR' ? 'Papirboka' : 'Boka'} <small>${p.valuta || 'USD'} · sist ${dato(p.siste_ts)}</small></h2>
      <div class="tal">
        <${Flis} v=${p.eigenkapital} l="eigenkapital" kl="cyan" />
        <${Flis} tekst=${dagens == null ? '–' : fmt(dagens, 0)} l="i dag" kl=${dagens > 0 ? 'gron' : (dagens < 0 ? 'raud' : '')} />
        <${Flis} tekst=${sidan == null ? '–' : pst(sidan, 2)} l="sidan start" kl=${sidan > 0 ? 'gron' : (sidan < 0 ? 'raud' : '')} />
        <${Flis} v=${p.n_handlar} l="handlar totalt" />
      </div>
      <div style="margin-top:12px"><${Kurve} punkt=${hist.map((h) => [h.ts, h.eigenkapital])} basis=${p.kapital_start} h=${160} /></div>
    </section>
    <section class="kort"><h2>Opne posisjonar <small>${posisjonar.length} · nivå = kva strategien har bevist</small></h2>
      ${posisjonar.length ? html`<div class="scroll"><table><thead><tr><th>Eigedel</th><th>Strategi</th><th>Nivå</th><th class="r">Eksponering</th><th class="r">Inngang</th><th>Opna</th><th>Manglar for å klatre</th></tr></thead><tbody>
        ${posisjonar.map((x) => { const nv = (p.nivaa || {})[x.nokkel] || {}; return html`<tr><td>${x.eigedel}</td><td>${x.strategi}</td><td><span class="merk ${nv.nivaa >= 2 ? 'gron' : (nv.nivaa === 1 ? 'ok' : 'gul')}">${nv.nivaa == null ? '–' : `NIVÅ ${nv.nivaa}`}</span></td><td class="r ${x.eksponering >= 0 ? 'opp' : 'ned'}">${fmt(x.eksponering, 0)} ${p.valuta || 'USD'}</td><td class="r">${fmt(x.inngangspris, 2)}</td><td>${dato(x.opna, false)}</td><td class="status">${(nv.manglar || []).join(' · ') || (nv.nivaa == null ? '' : 'ingenting – neste steg er ' + nv.kan)}</td></tr>`; })}
      </tbody></table></div>` : html`<${Tom} tekst="ingen opne posisjonar" />`}
      <p class="stille" style="margin:10px 0 0">Nivå 0: observasjon, halv storleik. 1: bestått eksamen, gearing 1,0×. 2: ≥ 30 papirdagar med pluss → demo lov (lås 1). 3: ≥ 30 demodagar → ekte lov (lås 2). Aldri martingale.</p>
      ${(p.demo_ordre || []).length ? html`<details style="margin-top:10px"><summary>Demo/ekte-ordre spegla frå papirboka (${p.demo_ordre.length})</summary><div class="logg">${[...p.demo_ordre].reverse().map((o) => html`<div class="rad"><span class="ts">${dato(o.ts)}</span><span>${o.demo ? 'DEMO' : 'EKTE'} ${o.meklar} · ${o.side} ${o.mengd} ${o.symbol} · ${o.avvist ? 'AVVIST: ' + o.grunn : o.status}</span></div>`)}</div></details>` : null}
      <p class="stille" style="margin:10px 0 0">Kostnad per handel: spread + kommisjon + glidning frå config.yaml. Gearingstak, dagleg tapsgrense og kill-switch er kode, ikkje knappar.</p>
    </section>
    <section class="kort"><h2>Dag for dag</h2>
      ${hist.length ? html`<div class="scroll"><table><thead><tr><th>Tidspunkt</th><th class="r">Eigenkapital</th><th class="r">Dagens P&L</th></tr></thead><tbody>
        ${[...hist].reverse().slice(0, 60).map((h) => html`<tr><td>${dato(h.ts)}</td><td class="r">${fmt(h.eigenkapital, 2)}</td><td class="r ${h.dagens_pnl > 0 ? 'opp' : (h.dagens_pnl < 0 ? 'ned' : '')}">${fmt(h.dagens_pnl, 2)}</td></tr>`)}
      </tbody></table></div>` : html`<${Tom} />`}
    </section>`;
}
