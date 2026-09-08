import { useEffect, useState } from 'preact/hooks';
import { html, Tom, fmt, klokke, alderTekst } from '../ui.js';
import { last } from '../data.js';

/* Selskapet: rolleagentane (leiarane) og tankane deira i dag. Tusenvis av genom er arbeidarane;
   dei kjem i fase 3 og blir talde her når dei finst. */
export function Selskapet({ tilstand }) {
  const [t, setT] = useState(undefined);
  const [sel, setSel] = useState(undefined);
  const [vald, setVald] = useState(null);
  useEffect(() => { last('tankar').then(setT); last('selskap').then(setSel); }, []);
  const agentar = (tilstand && tilstand.agentar) || [];
  const tankar = (t && t.tankar) || [];
  const per = {};
  for (const x of tankar) (per[x.agent] = per[x.agent] || []).push(x);
  const grense = Date.now() - 2 * 3600 * 1000;
  const vis = vald ? tankar.filter((x) => x.agent === vald) : tankar;
  const leiar = (sel && sel.leiar) || {}; const valg = (sel && sel.val) || {}; const sting = (sel && sel.storting) || {}; const minne = (sel && sel.minne) || {}; const post = (sel && sel.post) || [];
  const oppdrag = leiar.oppdrag || {}; const mandat = leiar.mandat || {};
  return html`
    <div class="fase">>>> SELSKAPET // ${agentar.length} ROLLEAGENTAR · ${tankar.length} TANKAR I DAG</div>
    ${valg.ceo ? html`<section class="kort"><h2>Styringa <small>CEO + storting på ${(valg.storting || []).length} · ${valg.grunnlag}</small></h2>
      <div class="flis-rad">
        <${Flis} tekst=${valg.ceo} l="CEO · ${(valg.stemmevekt || {})[valg.ceo] || 8} stemmer" kl="gron" />
        <${Flis} v=${(valg.storting || []).length} l="i stortinget · 1 stemme kvar" />
        <${Flis} v=${(valg.arbeidarar || []).length} l="arbeidarar" />
        <${Flis} v=${valg.fleirtal} l="stemmer trengst for fleirtal" />
      </div>
      <p class="stille">${(valg.nye || []).length ? `${(valg.nye || []).length} nye er arbeidarar til dei har bevist seg: ${(valg.nye || []).slice(0, 6).join(', ')}` : 'alle har bevist seg'}</p>
      <div class="scroll"><table><thead><tr><th>Plass</th><th>Agent</th><th>Rolle</th><th class="r">Avkastning</th><th class="r">Poeng</th><th class="r">Funn</th><th class="r">Løn</th></tr></thead><tbody>
        ${(valg.rangering || []).map((r) => html`<tr class=${r.agent === valg.ceo ? 'fremja' : ''}><td class="r">${r.plass}</td><td>${r.agent}</td><td><span class="merk ${(valg.roller || {})[r.agent] === 'ceo' ? 'gron' : ((valg.roller || {})[r.agent] === 'storting' ? 'ok' : '')}">${((valg.roller || {})[r.agent] || '').toUpperCase()}</span></td><td class="r ${r.pnl > 0 ? 'opp' : (r.pnl < 0 ? 'ned' : '')}">${r.pnl == null ? 'ikkje måleleg' : fmt(r.pnl, 2)}</td><td class="r">${fmt(r.poeng, 1)}</td><td class="r">${fmt(r.hendingar)}</td><td class="r">${fmt((valg.loen || {})[r.agent])}</td></tr>`)}
      </tbody></table></div>
    </section>` : null}
    ${(sting.saker || []).length ? html`<section class="kort"><h2>Voteringar <small>CEO har ${(valg.stemmevekt || {})[valg.ceo] || 8} stemmer · fleirtal ${sting.fleirtal} av ${sting.stemmer_totalt}</small></h2>
      ${sting.saker.map((sak) => html`<div class="agent"><div class="n"><span>${sak.tekst}</span><small class="${sak.vedteke ? 'gron' : 'raud'}">${sak.vedteke ? 'VEDTEKE' : 'FALT'} ${sak.ja}–${sak.nei}</small></div><div class="j">${sak.grunn}</div>
        <div class="s">${(sak.stemmer || []).map((st) => `${st.agent}${st.vekt > 1 ? ' ×' + st.vekt : ''}: ${st.ja ? 'ja' : 'nei'}`).join(' · ')}</div></div>`)}
    </section>` : null}
    <section class="kort"><h2>Sjefen <small>mandat: høgast mogleg dagleg avkastning · ${leiar.dag || 'ingen oppdrag enno'}</small></h2>
      ${mandat.ok === true ? html`<p class="stille">Systemet køyrer så aggressivt som ordren tillèt: gearing 20× på nivå 3, full Kelly, dagsstopp 15 %, kill-switch 50 %.</p>` : null}
      ${(mandat.avvik || []).length ? html`<div class="logg">${mandat.avvik.map((a) => html`<div class="rad"><span class="hend">TAMMARE ENN ORDREN</span><span>${a.innstilling}: står på ${a.no}, ordren seier ${a.venta}</span></div>`)}</div>` : null}
      ${Object.keys(oppdrag).length ? html`<div class="scroll"><table><thead><tr><th>Agent</th><th>Oppdrag i dag</th><th>Grunn</th><th class="r">Prioritet</th></tr></thead><tbody>
        ${Object.entries(oppdrag).sort((a, b) => (a[1].prioritet === 'høg' ? -1 : 1) - (b[1].prioritet === 'høg' ? -1 : 1)).map(([n, o]) => html`<tr><td>${n}</td><td>${o.kva}</td><td class="status">${o.kvifor}</td><td class="r"><span class="merk ${o.prioritet === 'høg' ? 'gul' : ''}">${(o.prioritet || '').toUpperCase()}</span></td></tr>`)}
      </tbody></table></div>` : html`<${Tom} tekst="sjefen har ikkje fordelt oppdrag enno" />`}
    </section>
    ${post.length ? html`<section class="kort"><h2>Posten mellom agentane <small>${post.length} brev</small></h2>
      <div class="logg">${[...post].reverse().map((b) => html`<div class="rad"><span class="ts">${klokke(b.ts)}</span><span><span class="agent">${b.fraa}</span> → <b>${b.til}</b>: ${b.tekst}</span></div>`)}</div></section>` : null}
    <section class="kort"><h2>Rolleagentane <small>trykk for å sjå tankane</small></h2>
      ${agentar.length ? html`<div class="agentar">${agentar.map((a) => { const mine = per[a.namn] || []; const sist = mine.length ? mine[mine.length - 1] : null; const aktiv = sist && new Date(sist.ts).getTime() > grense; return html`
        <div class="agent ${aktiv ? 'aktiv' : ''} ${vald === a.namn ? 'aktiv' : ''}" onClick=${() => setVald(vald === a.namn ? null : a.namn)} style="cursor:pointer">
          <div class="n"><span>${a.tittel}</span><small>${a.region.toUpperCase()}</small></div>
          <div class="j">${a.jobb}</div>
          <div class="s">${a.tidsplan}</div>
          <div class="s">${sist ? `${mine.length} tankar i dag · sist ${alderTekst(sist.ts)}` : 'ingen tankar i dag enno'}</div>
          ${minne[a.namn] ? html`<div class="s">${fmt(minne[a.namn].koeyringar)} køyringar · ${Object.keys(minne[a.namn].laerdom || {}).length} lærdomar${minne[a.namn].oppdrag ? ` · oppdrag: ${minne[a.namn].oppdrag.kva}` : ''}</div>` : null}
          ${vald === a.namn && minne[a.namn] && Object.keys(minne[a.namn].laerdom || {}).length ? html`<div class="logg" style="margin-top:6px">${Object.entries(minne[a.namn].laerdom).map(([k, v]) => html`<div class="rad"><span class="ts">${v.n}×</span><span><b>${k}</b>: ${typeof v.verdi === 'object' ? JSON.stringify(v.verdi) : String(v.verdi)}</span></div>`)}</div>` : null}
          ${sist ? html`<div class="stolpe"><i style=${`width:${Math.min(100, mine.length * 10)}%`}></i></div>` : null}
        </div>`; })}</div>` : html`<${Tom} tekst="ingen agentar registrerte" />`}
    </section>
    <section class="kort"><h2>Tankelogg ${vald ? html`<small>berre ${vald} · <a href="#" onClick=${(e) => { e.preventDefault(); setVald(null); }}>vis alle</a></small>` : html`<small>alle agentar, nyaste fyrst</small>`}</h2>
      ${vis.length ? html`<div class="logg" style="max-height:60vh">${[...vis].reverse().map((x) => html`
        <div class="rad"><span class="ts">${klokke(x.ts)}</span><span><span class="agent">${x.agent}</span> såg på <b>${x.inn}</b> · tenkte: ${x.resonnement} · <i>${x.avgjerd}</i>${x.hending ? html` · <span class="hend">${x.hending}</span>` : null}${x.filer && x.filer.length ? html` <span class="stille">[${x.filer.join(', ')}]</span>` : null}</span></div>`)}</div>`
        : html`<${Tom} tekst="ingen tankar logga i dag enno" />`}
    </section>`;
}
