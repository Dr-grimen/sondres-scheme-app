import { useEffect, useState } from 'preact/hooks';
import { html, Fase, Tom, dato, alderTekst, klokke } from '../ui.js';
import { last, lastAlle } from '../data.js';

/* Sanning: kvart tal på skjermen kjem frå ei fil. Her står fila, når ho vart endra, og kommandoen som laga henne. */
export function Sanning() {
  const [d, setD] = useState(undefined);
  useEffect(() => { lastAlle(['sanning', 'tankar']).then(setD); }, []);
  if (d === undefined) return html`<div class="lastar mono">>>> LASTAR …</div>`;
  const s = d && d.sanning;
  if (!s) return html`<${Tom} tekst="sanning.json manglar – eksporten har ikkje køyrt" />`;
  const revisor = ((d.tankar && d.tankar.tankar) || []).filter((t) => t.agent === 'revisor');
  const funn = revisor.filter((t) => t.hending === 'revisor_funn' || t.hending === 'avvik_papir_backtest');
  const grupper = {};
  for (const r of s.rader || []) (grupper[r.appfil] = grupper[r.appfil] || []).push(r);
  return html`
    <div class="fase">>>> SANNING // KVAR KJEM TALA FRÅ</div>
    <section class="kort"><h2>Prinsippet</h2><p class="stille">${s.prinsipp}</p>
      <p class="stille">Generert ${dato(s.generert)}. Revisor-agenten sjekkar dagleg at filene finst og er ferske, og flaggar alt som ikkje kan sporast.</p></section>
    <section class="kort"><h2>Revisoren i dag <small>${revisor.length} sjekkar · ${funn.length} funn</small></h2>
      ${revisor.length ? html`<div class="logg">${[...revisor].reverse().map((t) => html`<div class="rad"><span class="ts">${klokke(t.ts)}</span><span style=${t.hending ? 'color:var(--gul)' : ''}>${t.inn}: ${t.resonnement} — <i>${t.avgjerd}</i></span></div>`)}</div>` : html`<${Tom} tekst="revisoren har ikkje køyrt i dag enno" />`}
    </section>
    ${Object.entries(grupper).map(([appfil, rader]) => html`
      <section class="kort"><h2>${appfil} <small>det appen les</small></h2>
        <div class="scroll"><table><thead><tr><th>Kjeldefil i repoet</th><th>Sist endra</th><th>Kommando som lagar ho</th></tr></thead><tbody>
          ${rader.map((r) => html`<tr><td class="mono">${r.kjelde}</td><td>${r.endra ? html`${dato(r.endra)} <span class="stille">(${alderTekst(r.endra)})</span>` : html`<span class="merk fare">MANGLAR – ingen data enno</span>`}</td><td class="mono stille">${r.kommando}</td></tr>`)}
        </tbody></table></div>
      </section>`)}`;
}
