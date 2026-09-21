import { html } from '../ui.js';

const INFO = {
  'trading.com': { namn: 'Trading.com', url: 'https://www.trading.com' },
  polymarket: { namn: 'Polymarket', url: 'https://polymarket.com' },
  kalshi: { namn: 'Kalshi', url: 'https://kalshi.com' },
};

export function Uttak({ tilstand }) {
  const plattformar = (((tilstand || {}).handel || {}).plattformar || []).filter((id) => INFO[id]);
  const policy = (tilstand && tilstand.cashflow) || {};
  const firi = (policy.optional_destination || {}).platform === 'firi';
  return html`
    <div class="fase">>>> UTTAK // INGEN AUTOMATISKE OVERFØRINGAR</div>
    <section class="kort"><h2>Ta ut frå Firi</h2>
      <p>Knappen opnar Firi. Der loggar du inn som vanleg og tek ut sjølv, med BankID eller kode. Appen og boten kan ikkje flytte pengar: Firi-nøkkelen har berre lesetilgang, med vilje.</p>
      <p><a class="knapp aktiv" href="https://platform.firi.com" target="_blank" rel="noopener" style="display:inline-block;padding:12px 22px;font-size:16px">Ta ut frå Firi →</a></p>
    </section>
    <section class="kort"><h2>${policy.retain_funds === true ? 'Pengane skal bli ståande' : 'Saldo og uttak'}</h2>
      ${policy.retain_funds === true ? html`<p>Planen er å behalde pengane på handelskontoane. Eventuell avkastning skal bli ståande der. Det er ikkje sett opp automatiske uttak.</p>` : html`<p>Det er ikkje sett opp automatiske uttak.</p>`}
      <p>Papirpengar i denne appen kan ikkje takast ut. Eit eventuelt manuelt uttak blir gjort i den innlogga kontoen hos plattforma.</p>
      <div class="agentar">${plattformar.map((id) => html`<div class="agent"><div class="n"><a href=${INFO[id].url} target="_blank" rel="noopener">Opne ${INFO[id].namn}</a></div><div class="j">Sjå tilgjengeleg saldo og dei uttaksmetodane kontoen din støttar der.</div></div>`)}</div>
      <p class="stille">Ta vare på kontoutskrifter og handelshistorikk frå plattforma. Den interne papirboka er ikkje dokumentasjon på faktiske transaksjonar.</p>
    </section>
    ${firi ? html`<section class="kort"><h2>Firi som mogleg framtidig mottakar <small>IKKJE SETT OPP</small></h2>
      <p>Firi er lagra som eit ønske for seinare uttak. Mottaksvaluta, nettverk og kontoadresse er ikkje stadfesta, og ingen overføring er aktivert.</p>
      <p class="stille">Firi er ikkje ein del av handelsoppsettet.</p>
    </section>` : null}`;
}
