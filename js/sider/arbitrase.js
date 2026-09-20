import { useEffect, useState } from 'preact/hooks';
import { html, Flis, Tom, fmt, dato } from '../ui.js';
import { last } from '../data.js';

const STATUS = {treng_regelkontroll: 'Treng regelkontroll', avvist: 'Avvist', papirkandidat: 'Papirkandidat'};
const PARSTATUS = {conditional_paper_candidate: 'Vilkårsbunden papirkandidat', open_paper_position: 'Alt open på papir', simulated_pair_opened: 'Simulert par opna', rejected: 'Avvist'};

export function Arbitrase() {
  const [data, setData] = useState(undefined);
  useEffect(() => { last('arbitrase').then(setData); }, []);
  if (data === undefined) return html`<div class="lastar mono">>>> LASTAR …</div>`;
  const a = data && data.snapshot;
  if (!a) return html`<div class="fase">>>> ARBITRASE // POLYMARKET + KALSHI</div><${Tom} tekst="Ingen lagra samanlikning enno." />`;
  const gammal = a.fresh === false || !a.generert || Date.now() - new Date(a.generert).getTime() > 6 * 3600 * 1000;
  const rader = a.kandidatar || [];
  const dekning = a.dekning || {};
  const complete = a.complete_set || {};
  const papir = complete.paper || {};
  return html`
    <div class="fase">>>> ARBITRASE // PAPIR OG UNDERSØKING</div>
    <section class="kort"><h2>Polymarket + Kalshi <small>${dato(a.generert)} · ${a.status || 'ukjend status'}</small></h2>
      ${gammal ? html`<p class="feil">Dette er eit eldre uttrekk. Prisane er ikkje stadfesta no.</p>` : null}
      <div class="tal">
        <${Flis} v=${a.marknader_polymarket} l="Polymarket-marknader lesne" />
        <${Flis} v=${a.marknader_kalshi} l="Kalshi-marknader lesne" />
        <${Flis} v=${a.observerte_par} l="par samanlikna" />
        <${Flis} v=${(a.papir || {}).simulerte} l="par simulerte på papir" />
      </div>
      <p class="stille">${Object.entries(dekning).map(([k, v]) => `${k}: ${v.status || 'ukjend status'}, ${v.complete ? 'til siste API-side' : 'avgrensa dekning'}`).join(' · ') || 'Dekning ikkje oppgitt.'}</p>
      <p>Like overskrifter er berre eit søkjetreff. Oppgjersreglar, fristar og kva som tel som eit ja må vere like før to kontraktar kan behandlast som same utfall.</p>
      <p class="stille">Netto er etter dei kostnadene som faktisk er kjende. «Ukjent» betyr at gebyr eller kjøpsprisar ikkje er stadfesta. Prisindikasjonar og papirpar er ikkje ordre, parvise fyllingar eller dokumentert forteneste.</p>
    </section>
    <section class="kort"><h2>Par til vurdering <small>${rader.length} i uttrekket</small></h2>
      ${rader.length ? html`<div class="scroll"><table><thead><tr><th>Polymarket / Kalshi</th><th>Retning</th><th class="r">Brutto / kontrakt</th><th class="r">Netto / kontrakt</th><th>Status og grunn</th></tr></thead><tbody>
        ${rader.map((r) => html`<tr><td class="status"><b>${r.polymarket_question}</b><br />${r.kalshi_question}<br /><small>${r.kalshi_ticker}</small></td><td>${r.retning || '–'}</td><td class="r">${r.brutto_per_kontrakt == null ? 'ukjent' : fmt(r.brutto_per_kontrakt, 4)}</td><td class="r">${r.netto_per_kontrakt == null ? 'ukjent' : fmt(r.netto_per_kontrakt, 4)}</td><td class="status"><b>${STATUS[r.status] || r.status}</b><br />${(r.grunn || []).join(' · ')}</td></tr>`)}
      </tbody></table></div>` : html`<${Tom} tekst="Ingen par til vurdering i denne køyringa." />`}
      ${Object.keys(a.forkasta || {}).length ? html`<details style="margin-top:10px"><summary>Kva som vart forkasta</summary><ul>${Object.entries(a.forkasta).map(([k, n]) => html`<li>${k}: ${fmt(n)}</li>`)}</ul></details>` : null}
    </section>
    <section class="kort"><h2>Polymarket · ja og nei i same marknad <small>${dato(complete.ts)}</small></h2>
      <p class="stille">Begge utfall blir vurderte frå ordrebokdjupn. Rekninga inkluderer dei oppgitte gebyra og avsetjing for prisrørsle, kapitalbinding og oppgjer. Ein kandidat er vilkårsbunden; kjøp av begge sider er berre simulert.</p>
      <div class="tal"><${Flis} v=${complete.evaluated_markets} l="marknader faktisk vurderte" /><${Flis} v=${complete.eligible_markets} l="marknader i utvalet" /><${Flis} v=${papir.simulated_fills_this_run} l="nye simulerte par" /><${Flis} v=${papir.open_positions} l="opne papirpar" /></div>
      ${(complete.errors || []).length ? html`<p class="feil">${complete.errors.join(' · ')}</p>` : null}
      ${(complete.candidates || []).length ? html`<div class="scroll" style="margin-top:12px"><table><thead><tr><th>Marknad</th><th>Status</th><th class="r">Mengd</th><th class="r">Nettoestimat / par</th><th class="r">Samla modellestimat</th><th class="r">Kapital</th><th>Grunn</th></tr></thead><tbody>
        ${complete.candidates.map((r) => html`<tr><td class="status">${r.question || r.market_id}</td><td>${PARSTATUS[r.status] || r.status}</td><td class="r">${fmt(r.quantity)}</td><td class="r">${r.net_per_pair == null ? 'ukjent' : fmt(r.net_per_pair, 4)}</td><td class="r">${r.modeled_net_total == null ? 'ukjent' : fmt(r.modeled_net_total, 2)}</td><td class="r">${fmt(r.capital_required, 2)}</td><td class="status">${(r.reasons || []).join(' · ') || 'Vilkår og samtidige kjøp må halde.'}</td></tr>`)}
      </tbody></table></div>` : html`<${Tom} tekst="Ingen par er vurderte i dette uttrekket." />`}
      <h3>Papirrekneskap · ${papir.currency || 'eining ikkje oppgitt'}</h3>
      <div class="tal"><${Flis} v=${papir.reserved_capital} des=2 l="bunden papirkapital" /><${Flis} v=${papir.equity_indicative} des=2 l="indikativ papirverdi" /><${Flis} v=${papir.unrealized_pnl} des=2 l="urealisert papirresultat" /><${Flis} v=${papir.simulated_realized_pnl} des=2 l="bokført simulert resultat" /></div>
      <p class="stille">${fmt(papir.awaiting_verified_resolution)} par ventar på kontrollert oppgjer. ${fmt(papir.stale_positions)} har forelda verdsetjing. Verkeleg forteneste er ikkje målt. Modellert sluttverdi blir ikkje ført som realisert gevinst.</p>
      ${complete.stop_reason ? html`<p class="stille">Grunn til avslutta skann: ${complete.stop_reason}</p>` : null}
    </section>
    <section class="kort"><h2>Trading.com · eigne retningsstrategiar</h2><p class="stille">CFD-ar følgjer ein pris og er ikkje det same som ja/nei-kontraktar. Dei blir vurderte separat og tel ikkje som risikofri arbitrasje mellom desse plattformene.</p></section>`;
}
