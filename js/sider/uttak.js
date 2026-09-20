import { html } from '../ui.js';

const INFO = {
  'trading.com': { namn: 'Trading.com', url: 'https://www.trading.com' },
  polymarket: { namn: 'Polymarket', url: 'https://polymarket.com' },
  kalshi: { namn: 'Kalshi', url: 'https://kalshi.com' },
};

export function Uttak({ tilstand }) {
  const plattformar = (((tilstand || {}).handel || {}).plattformar || []).filter((id) => INFO[id]);
  return html`
    <div class="fase">>>> UTTAK // HOS PLATTFORMA</div>
    <section class="kort"><h2>Saldo og uttak</h2>
      <p>Uttak blir gjort i den innlogga kontoen hos plattforma. Papirpengar i denne appen kan ikkje takast ut.</p>
      <div class="agentar">${plattformar.map((id) => html`<div class="agent"><div class="n"><a href=${INFO[id].url} target="_blank" rel="noopener">Opne ${INFO[id].namn}</a></div><div class="j">Sjå tilgjengeleg saldo og dei uttaksmetodane kontoen din støttar der.</div></div>`)}</div>
      <p class="stille">Ta vare på kontoutskrifter og handelshistorikk frå plattforma. Den interne papirboka er ikkje dokumentasjon på faktiske transaksjonar.</p>
    </section>`;
}
