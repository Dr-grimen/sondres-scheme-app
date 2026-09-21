import { useEffect, useState } from 'preact/hooks';
import { html, Flis, Fasestripe, Fase, Kurve, Tom, fmt, pst, klokke, alderTekst, FASAR } from '../ui.js';
import { lastAlle } from '../data.js';
import { PolymarketKort } from '../polymarket.js';

export function Oversikt({ tilstand }) {
  const [d, setD] = useState(null);
  useEffect(() => { lastAlle(['papir', 'hendingar', 'tankar', 'skann', 'nivaa', 'selskap', 'penger', 'polymarket', 'meklarar', 'verda']).then(setD); }, []);
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
  const toppVolum = ((sk.topp || {}).volum || []).filter((r) => r.gruppe !== 'krypto').slice(0, 3);
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

    <section class="kort" style="border-color:rgba(52,211,153,.45)"><h2>Pengane dine <small>ekte saldo, lesen direkte frå kontoane</small></h2>
      ${(() => {
        const ko = (d && d.meklarar && d.meklarar.kontoar) || {};
        const rader = Object.entries(ko).filter(([, v]) => v && v.cash_balance != null)
          .map(([namn, v]) => ({ namn: namn === 'kalshi' ? 'Kalshi' : (namn === 'polymarket' ? 'Polymarket' : namn), sum: v.cash_balance, valuta: v.currency, ts: v.checked_at }));
        const usd = rader.filter((r) => /usd/i.test(r.valuta || '')).reduce((a, r) => a + Number(r.sum || 0), 0);
        return rader.length ? html`
          <div class="tal">
            <${Flis} tekst=${`${fmt(usd, 2)} USD`} l="til saman på kontoane" kl="cyan" />
            ${rader.map((r) => html`<${Flis} tekst=${`${fmt(r.sum, 2)} ${r.valuta}`} l=${`${r.namn}${r.ts ? ` · lese ${alderTekst(r.ts)}` : ''}`} />`)}
          </div>
          <p class="stille">pUSD er Polymarket sin dollar (1:1). Ingen pengar blir flytta herifrå; uttak gjer du sjølv under «Uttak».</p>`
          : html`<${Tom} tekst="ingen kontosaldo lesen enno – kjem ved neste skykøyring" />`;
      })()}
      ${(d && d.verda && d.verda.n_kontoar) ? html`<p class="stille">Botane øver i «Verda» med leikepengar (${fmt(d.verda.n_kontoar)} kontoar). Det er ikkje pengane dine; sjå Selskapet.</p>` : null}
    </section>
    <section class="kort"><h2>Dette skjedde sist <small>skann, nivå og nattskift · alt frå filer i repoet</small></h2>
      <div class="flis-rad">
        <${Flis} v=${sk.rader ? sk.rader.filter((r) => r.gruppe !== 'krypto').length : null} l="marknadsreferansar skanna" />
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
        <${Flis} v=${tilstand.n_botter ?? (tilstand.agentar || []).filter((a) => a.bot || a.namn?.startsWith('bot_')).length} l="botter i flåten" kl="gron" />
        <${Flis} v=${tilstand.n_agentar ?? (tilstand.agentar || []).length} l="agentar og botter totalt" />
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
