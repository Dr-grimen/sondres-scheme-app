import { useEffect, useState } from 'preact/hooks';
import { html, Flis, Fasestripe, Fase, Kurve, Tom, fmt, pst, klokke, alderTekst, FASAR } from '../ui.js';
import { lastAlle } from '../data.js';

export function Oversikt({ tilstand }) {
  const [d, setD] = useState(null);
  useEffect(() => { lastAlle(['papir', 'hendingar', 'tankar']).then(setD); }, []);
  if (!tilstand) return html`<${Tom} tekst="ingen tilstand enno – pipelinen har ikkje køyrt" />`;
  const p = tilstand.papir || {};
  const t = tilstand.turnering || {};
  const hj = tilstand.hjerne || {};
  const b = tilstand.budsjett || {};
  const fase = tilstand.fase || { aktiv: 0, namn: FASAR[0] };
  const kurve = d && d.papir && d.papir.historikk ? d.papir.historikk.map((h) => [h.ts, h.eigenkapital]) : null;
  const pnl = p.dagens_pnl;
  const sidan = (p.eigenkapital != null && p.kapital_start) ? (p.eigenkapital / p.kapital_start - 1) : null;
  const hend = d && d.hendingar ? d.hendingar.hendingar : [];
  const tankar = d && d.tankar ? d.tankar.tankar : [];

  return html`
    <${Fasestripe} aktiv=${fase.aktiv} />
    <${Fase} nr=${fase.aktiv + 1} namn=${fase.namn} />

    <section class="kort"><h2>Papirboka <small>leikepengar, aldri ekte utan låsane</small></h2>
      <div class="tal">
        <${Flis} v=${p.eigenkapital} l="eigenkapital, USD" kl="cyan" />
        <${Flis} tekst=${pnl == null ? '–' : fmt(pnl, 0)} l="i dag, USD" kl=${pnl > 0 ? 'gron' : (pnl < 0 ? 'raud' : '')} />
        <${Flis} tekst=${sidan == null ? '–' : pst(sidan, 2)} l=${`sidan start (${fmt(p.kapital_start)} USD)`} kl=${sidan > 0 ? 'gron' : (sidan < 0 ? 'raud' : '')} />
        <${Flis} v=${p.n_posisjonar} l=${`opne posisjonar · ${p.dagar ?? 0} dagar i boka`} />
      </div>
      <div style="margin-top:12px">${kurve ? html`<${Kurve} punkt=${kurve} basis=${p.kapital_start} tittel="eigenkapital" />` : html`<${Tom} />`}</div>
    </section>

    <section class="kort"><h2>Verkstaden <small>strategiar prøvde, overlevde, døde</small></h2>
      <div class="tal">
        <${Flis} v=${hj.strategiar_genererte} l="strategiar generert" />
        <${Flis} v=${hj.overlevande} l="overlevande (papir)" kl="gron" />
        <${Flis} v=${hj.gravplass} l="gravplass" kl="raud" />
        <${Flis} v=${hj.generasjonar} l="generasjonar avla" />
      </div>
      <p class="stille" style="margin:10px 0 0">Siste turnering ${t.ts ? alderTekst(t.ts) : '–'}: ${t.n_testa ?? 0} kombinasjonar, ${t.n_fremja ?? 0} fremja, ${t.n_observasjon ?? 0} under observasjon. Tusenvis av avla genom: sjå <a href="#/provebane">Prøvebane</a>, <a href="#/avl">Avl</a> og <a href="#/eksamen">Eksamen</a>.</p>
    </section>

    <section class="kort"><h2>Hjernen i dag</h2>
      <div class="tal">
        <${Flis} v=${hj.tankar_i_dag} l="tankar logga i dag" kl="cyan" />
        <${Flis} v=${hj.nyheitssaker} l="nyheitssaker lesne (polybot)" />
        <${Flis} v=${hj.forskingssaker} l="forskingssaker og bøker" />
        <${Flis} v=${(tilstand.agentar || []).length} l="rolleagentar i selskapet" />
      </div>
      ${hend.length ? html`<div class="logg" style="margin-top:12px">${hend.slice(-12).reverse().map((e) => html`<div class="rad"><span class="ts">${klokke(e.ts)}</span><span><span class="agent">${e.agent}</span> · <span class="hend">${e.hending}</span> · ${e.kva} — ${e.avgjerd}</span></div>`)}</div>`
        : html`<p class="stille" style="margin:10px 0 0">Ingen læringshendingar i dag enno. ${tankar.length} tankar er logga; sjå Selskapet.</p>`}
    </section>

    <section class="kort"><h2>Budsjett <small>gratis som standard</small></h2>
      <div class="tal">
        <${Flis} tekst=${b.actions_min == null ? '–' : `${fmt(b.actions_min)} / ${fmt(b.actions_tak)}`} l="GitHub Actions-minutt denne månaden" />
        <${Flis} tekst=${`${fmt(b.llm_kr, 2)} / ${fmt(b.llm_tak_kr)} kr`} l="språkmodell (Claude) denne månaden" />
      </div>
      <div class="stolpe ${b.actions_min > b.actions_tak * 0.9 ? 'raud' : ''}"><i style=${`width:${Math.min(100, 100 * (b.actions_min || 0) / (b.actions_tak || 1))}%`}></i></div>
    </section>`;
}
