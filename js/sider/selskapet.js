import { useEffect, useState } from 'preact/hooks';
import { html, Tom, klokke, alderTekst } from '../ui.js';
import { last } from '../data.js';

/* Selskapet: rolleagentane (leiarane) og tankane deira i dag. Tusenvis av genom er arbeidarane;
   dei kjem i fase 3 og blir talde her når dei finst. */
export function Selskapet({ tilstand }) {
  const [t, setT] = useState(undefined);
  const [vald, setVald] = useState(null);
  useEffect(() => { last('tankar').then(setT); }, []);
  const agentar = (tilstand && tilstand.agentar) || [];
  const tankar = (t && t.tankar) || [];
  const per = {};
  for (const x of tankar) (per[x.agent] = per[x.agent] || []).push(x);
  const grense = Date.now() - 2 * 3600 * 1000;
  const vis = vald ? tankar.filter((x) => x.agent === vald) : tankar;
  return html`
    <div class="fase">>>> SELSKAPET // ${agentar.length} ROLLEAGENTAR · ${tankar.length} TANKAR I DAG</div>
    <section class="kort"><h2>Rolleagentane <small>trykk for å sjå tankane</small></h2>
      ${agentar.length ? html`<div class="agentar">${agentar.map((a) => { const mine = per[a.namn] || []; const sist = mine.length ? mine[mine.length - 1] : null; const aktiv = sist && new Date(sist.ts).getTime() > grense; return html`
        <div class="agent ${aktiv ? 'aktiv' : ''} ${vald === a.namn ? 'aktiv' : ''}" onClick=${() => setVald(vald === a.namn ? null : a.namn)} style="cursor:pointer">
          <div class="n"><span>${a.tittel}</span><small>${a.region.toUpperCase()}</small></div>
          <div class="j">${a.jobb}</div>
          <div class="s">${a.tidsplan}</div>
          <div class="s">${sist ? `${mine.length} tankar i dag · sist ${alderTekst(sist.ts)}` : 'ingen tankar i dag enno'}</div>
          ${sist ? html`<div class="stolpe"><i style=${`width:${Math.min(100, mine.length * 10)}%`}></i></div>` : null}
        </div>`; })}</div>` : html`<${Tom} tekst="ingen agentar registrerte" />`}
    </section>
    <section class="kort"><h2>Tankelogg ${vald ? html`<small>berre ${vald} · <a href="#" onClick=${(e) => { e.preventDefault(); setVald(null); }}>vis alle</a></small>` : html`<small>alle agentar, nyaste fyrst</small>`}</h2>
      ${vis.length ? html`<div class="logg" style="max-height:60vh">${[...vis].reverse().map((x) => html`
        <div class="rad"><span class="ts">${klokke(x.ts)}</span><span><span class="agent">${x.agent}</span> såg på <b>${x.inn}</b> · tenkte: ${x.resonnement} · <i>${x.avgjerd}</i>${x.hending ? html` · <span class="hend">${x.hending}</span>` : null}${x.filer && x.filer.length ? html` <span class="stille">[${x.filer.join(', ')}]</span>` : null}</span></div>`)}</div>`
        : html`<${Tom} tekst="ingen tankar logga i dag enno" />`}
    </section>`;
}
