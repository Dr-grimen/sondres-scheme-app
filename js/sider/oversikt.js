import { useEffect, useState } from 'preact/hooks';
import { html, Flis, Fasestripe, Fase, Kurve, Tom, fmt, pst, klokke, alderTekst, FASAR } from '../ui.js';
import { lastAlle } from '../data.js';

export function Oversikt({ tilstand }) {
  const [d, setD] = useState(null);
  useEffect(() => { lastAlle(['papir', 'hendingar', 'tankar', 'skann', 'nivaa', 'selskap', 'penger']).then(setD); }, []);
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

  const sk = (d && d.skann) || {};
  const niv = (d && d.nivaa) || {};
  const sel = (d && d.selskap) || {};
  const natt = sel.nattforslag || {};
  const moete = sel.moete || {};
  const valg = sel.val || {};
  const pn = sel.personnamn || {};
  const toppVolum = ((sk.topp || {}).volum || []).slice(0, 3);
  const naer = Object.values(niv.eigedelar || {})
    .map((e) => ({ namn: e.namn || e.symbol, a: e.analyse || {} }))
    .filter((x) => x.a.naermaste && x.a.naermaste.avstand_pct != null)
    .sort((x, y) => Math.abs(x.a.naermaste.avstand_pct) - Math.abs(y.a.naermaste.avstand_pct))
    .slice(0, 3);

  // Pengane fyrst (Sondre 9. sep 2026). Nøyaktig same tal som pengemeldinga på Telegram.
  const pg = (d && d.penger) || null;
  const usdKr = (x, des) => (x == null ? '–' : fmt(x, des == null ? 2 : des));
  const gronRaud = (x) => (x > 0 ? 'gron' : (x < 0 ? 'raud' : ''));

  return html`
    <${Fasestripe} aktiv=${fase.aktiv} />
    <${Fase} nr=${fase.aktiv + 1} namn=${fase.namn} />

    <section class="kort"><h2>Pengar i dag <small>${pg && pg.dag ? `måledag ${pg.dag}` : 'papirhandel · ingen ekte pengar er flytta'}</small></h2>
      ${!pg || pg.i_dag == null ? html`<${Tom} tekst="ingen måling enno – papirboka har ikkje køyrt" />` : html`
      <div class="tal">
        <${Flis} tekst=${`${pg.i_dag > 0 ? '+' : ''}${usdKr(pg.i_dag)} USD`} l="i dag" kl=${gronRaud(pg.i_dag)} />
        <${Flis} tekst=${pg.i_dag_pst == null ? '–' : pst(pg.i_dag_pst, 2)} l="i dag, prosent" kl=${gronRaud(pg.i_dag_pst)} />
        <${Flis} tekst=${`${usdKr(pg.eigenkapital)} USD`} l=${`konto · start ${usdKr(pg.kapital_start, 0)}`} kl="cyan" />
        <${Flis} tekst=${pg.sidan_start_pst == null ? '–' : pst(pg.sidan_start_pst, 2)} l="sidan start" kl=${gronRaud(pg.sidan_start_pst)} />
      </div>
      <div class="tal" style="margin-top:10px">
        <${Flis} tekst=${`${pg.n_vinn || 0} / ${(pg.n_vinn || 0) + (pg.n_tap || 0)}`} l=${`lukka handlar i pluss i dag (av ${pg.n_handlar_i_dag || 0} handlar)`} />
        <${Flis} tekst=${`${usdKr(pg.eksponering, 0)} USD`} l=${`eksponering${pg.giring ? ` · ${fmt(pg.giring, 2)}× av konto` : ''}`} />
        <${Flis} tekst=${pg.fraa_topp == null ? '–' : pst(pg.fraa_topp, 1)} l="frå toppen · kill-switch ved −50 %" kl=${pg.fraa_topp < -0.2 ? 'raud' : ''} />
        <${Flis} tekst=${pg.veke_pnl == null ? '–' : `${pg.veke_pnl > 0 ? '+' : ''}${usdKr(pg.veke_pnl, 0)} USD`} l=${`siste ${pg.veke_dagar || 0} måledagar · ${pg.veke_positive || 0} i pluss`} kl=${gronRaud(pg.veke_pnl)} />
      </div>
      ${pg.beste || pg.verste ? html`<p class="stille" style="margin-top:10px">
        ${pg.beste ? html`<b>Beste i dag:</b> ${pg.beste.eigedel || pg.beste.symbol} ${usdKr(pg.beste.realisert)} USD` : null}
        ${pg.beste && pg.verste && pg.verste !== pg.beste ? ' · ' : ''}
        ${pg.verste && pg.verste !== pg.beste ? html`<b>Verste:</b> ${pg.verste.eigedel || pg.verste.symbol} ${usdKr(pg.verste.realisert)} USD` : null}
      </p>` : null}
      ${(pg.meklarar || []).filter((m) => !m.demo).length ? html`<p class="stille">Ekte pengar: ${pg.meklarar.filter((m) => !m.demo).map((m) => `${m.vising} ${fmt(m.sum, 0)} ${m.valuta}`).join(' · ')}</p>` : null}
      ${pg.dagleg_stopp ? html`<p class="feil">DAGLEG STOPP er på: ingen nye handlar i dag.</p>` : null}
      ${pg.kill_switch ? html`<p class="feil">KILL-SWITCH er på: alt er flata. Må nullstillast for hand.</p>` : null}
      ${(pg.manglar || []).length ? html`<p class="stille">${pg.manglar.join(' · ')}</p>` : null}
      <p class="stille">Dette er dei same tala som pengemeldinga på Telegram kl. 23:15.</p>`}
    </section>

    <section class="kort"><h2>Dette skjedde sist <small>skann, nivå og nattskift · alt frå filer i repoet</small></h2>
      <div class="flis-rad">
        <${Flis} v=${(sk.n_aksjar || 0) + (sk.n_krypto || 0)} l="symbol skanna" />
        <${Flis} v=${Object.keys(niv.eigedelar || {}).length} l="eigedelar med soner" />
        <${Flis} v=${natt.n || 0} l="nye strategiar i natt" />
        <${Flis} tekst=${pn[valg.ceo] || valg.ceo || '–'} l="CEO" kl="gron" />
      </div>
      ${toppVolum.length ? html`<p class="stille" style="margin-top:10px"><b>Utliggjarar på volum:</b> ${toppVolum.map((r) => `${r.symbol} ${fmt(r.rvol, 1)}×`).join(' · ')}</p>` : null}
      ${naer.length ? html`<div class="logg" style="margin-top:6px">${naer.map((x) => html`<div class="rad"><span class="agent">${x.namn}</span><span>${x.a.tekst_nn}</span></div>`)}</div>` : null}
      ${(moete.innlegg || []).length ? html`<details style="margin-top:8px"><summary>Siste møte: ${moete.n} innlegg</summary>
        <div class="logg">${moete.innlegg.slice(0, 8).map((i) => html`<div class="rad"><span class="agent">${i.namn}</span><span>${i.seier}</span></div>`)}</div></details>` : null}
      ${(natt.genom || []).length ? html`<p class="stille">Nattskiftet bygde ${natt.n} genom på ${natt.eigedel} av det agentane har målt. Dei går gjennom eksamen som alt anna.</p>` : null}
    </section>

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
