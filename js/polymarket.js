import { html, Flis, Tom, fmt, dato } from './ui.js';

const STATUS = {complete: 'Henta til siste API-side', truncated: 'Avgrensa uttrekk', partial_error: 'Delvis henting', error: 'Henting feila', budget_paused: 'Pause ved budsjettgrensa'};
const GRUNN = {
  valid_outcome_prices: 'gyldige utfallsprisar manglar', liquidity: 'likviditet ukjend', volume24h: 'døgnvolum ukjent',
  spread: 'prisskilnad ukjend', executable_bid_ask: 'tilgjengelege kjøps- og salsprisar manglar',
  accepting_orders: 'ordrestatus ukjend', deadline: 'frist ukjend', independent_probability: 'uavhengig sannsyn manglar',
  verified_total_execution_costs: 'samla handelskostnad ukjend', no_reported_liquidity: 'ingen rapportert likviditet',
  no_reported_24h_volume: 'ingen rapportert døgnhandel', orders_not_accepted: 'tek ikkje imot ordre',
  not_confirmed_active_and_open: 'ikkje stadfesta open marknad', deadline_passed: 'fristen er passert',
};

export function PolymarketKort({ snapshot: p, compact = false }) {
  if (!p) return html`<section class="kort"><h2>Polymarket · dekning</h2><${Tom} tekst="Ingen lagra marknadsskann enno. Agenttal er ikkje eit mål på marknadsdekning." /></section>`;
  const gammal = p.fresh === false || !p.ts || Date.now() - new Date(p.ts).getTime() > 6 * 3600 * 1000;
  const topp = p.top_observations || [];
  return html`<section class="kort"><h2>Polymarket · dekning <small>${STATUS[p.status] || p.status || 'ukjend status'} · ${dato(p.ts)}</small></h2>
    ${gammal ? html`<p class="feil">Dette er eit eldre uttrekk. Det viser ikkje marknaden akkurat no.</p>` : null}
    <div class="tal">
      <${Flis} v=${p.market_count} l="marknader faktisk lesne" />
      <${Flis} v=${Object.keys(p.scanned_categories || {}).length} l="kategoriar i uttrekket" />
      <${Flis} v=${p.agents_evaluated} l="agentar med vurderingar" />
      <${Flis} v=${(p.assessment_counts || {}).needs_research} l="treng vidare undersøking" />
    </div>
    <p class="stille">Aktive, opne marknader utan kategorifilter. Tilbodet kan endre seg under henting. Totalt tilgjengeleg: ${(p.scope || {}).total_available == null ? 'ukjent' : fmt(p.scope.total_available)}. ${p.complete ? 'Hentinga nådde slutten av dette API-uttrekket.' : 'Uttrekket er ikkje komplett.'}</p>
    ${(p.errors || []).length ? html`<p class="feil">${p.errors.join(' · ')}</p>` : null}
    <p class="stille">Pris, likviditet og spreiing mellom kjøp og sal peikar ut kva som bør undersøkast. Dei dokumenterer ikkje positiv venta avkastning. Ingen ordre er utførte av denne skannen.</p>
    ${!compact ? html`
      <details><summary>Kategoriar (${Object.keys(p.scanned_categories || {}).length})</summary><p class="stille">${Object.entries(p.scanned_categories || {}).map(([k, n]) => `${k}: ${fmt(n)}`).join(' · ') || 'Ingen kategoriar lesne.'}</p></details>
      ${topp.length ? html`<div class="scroll" style="margin-top:12px"><table><thead><tr><th>Til undersøking</th><th>Kategori</th><th class="r">Likviditet</th><th class="r">Volum 24 t</th><th>Status / manglar</th></tr></thead><tbody>
        ${topp.map((r) => html`<tr><td class="status">${r.slug ? html`<a href=${'https://polymarket.com/market/' + encodeURIComponent(r.slug)} target="_blank" rel="noopener">${r.question}</a>` : r.question}</td><td>${r.category || 'ukjend'}</td><td class="r">${fmt(r.liquidity, 0)}</td><td class="r">${fmt(r.volume24h, 0)}</td><td class="status">${[...(r.reasons || []), ...(r.missing || [])].map((k) => GRUNN[k] || k).join(' · ') || 'Treng undersøking'}</td></tr>`)}
      </tbody></table></div>` : html`<${Tom} tekst="Ingen forskingskandidatar i dette uttrekket." />`}
    ` : html`<p><a href="#/skann">Sjå kategoriar og observasjonar</a></p>`}
  </section>`;
}
