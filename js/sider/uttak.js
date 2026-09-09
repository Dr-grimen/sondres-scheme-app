import { html, dato } from '../ui.js';

/* Uttak til Firi: alltid for hand. Appen guidar, flyttar aldri pengar. */
const STEG = {
  alpaca: ['Sel posisjonane du vil ta ut (Alpaca-appen eller nettsida). Vent til handelen er «filled».', 'Withdraw → bankkonto i ditt namn (USD; banken vekslar til NOK). Fyrste uttak kan ta 3–5 bankdagar.', 'Når pengane er i banken: opne Firi-appen → Innskot → Vipps eller bankoverføring.', 'Skriv ned dato, sum og kurs til skattemeldinga.'],
  oanda: ['Lukk posisjonane i OANDA (fxTrade). Sjekk at margin er frigjord.', 'Manage Funds → Withdraw → same bankkonto du sette inn frå (OANDA krev det).', 'Frå banken til Firi: Firi-appen → Innskot → Vipps eller bankoverføring.', 'Ta vare på kontoutskrifta frå OANDA.'],
  binance: ['Sel til USDT eller behald mynten du vil flytte.', 'I Firi: Innskot → vel same mynt → kopier innskotsadressa OG nettverket (t.d. Bitcoin-nettet for BTC, ERC-20 for ETH). Feil nettverk = pengane er borte.', 'I Binance: Withdraw → lim inn adressa → vel nøyaktig same nettverk → send fyrst eit lite testbeløp (t.d. 100 kr). Vent til det er kome fram.', 'Send resten. Skriv ned transaksjons-ID (txid).'],
  metaapi: ['Lukk posisjonane i MetaTrader 4. Uttak skjer hos meklaren bak MT4-kontoen, ikkje hos MetaApi.', 'Meklar → Withdraw → bankkonto i ditt namn.', 'Frå banken til Firi som over.'],
  polymarket: ['Sel/avslutt posisjonar på polymarket.com. Vent til marknaden er avgjort om du held til slutt.', 'Withdraw → USDC på Polygon → til ei lommebok du styrer, eller direkte til Firi si USDC-adresse om Firi støttar Polygon-nettet (sjekk i Firi-appen fyrst!).', 'Test med eit lite beløp fyrst.'],
};

export function Uttak() {
  return html`
    <div class="fase raud">>>> UTTAK // ALLTID FOR HAND</div>
    <section class="kort"><h2>Regelen</h2>
      <p style="color:var(--tekst2)">Systemet flyttar aldri pengar. Ingen API-nøkkel skal ha uttaksrett. Uttak til Firi gjer du sjølv, steg for steg, med denne sjekklista. Bruk alltid eit lite testbeløp fyrst når det gjeld krypto.</p>
    </section>
    ${Object.entries(STEG).map(([id, steg]) => html`
      <section class="kort"><h2>${{ alpaca: 'Alpaca → bank → Firi', oanda: 'OANDA → bank → Firi', binance: 'Binance → Firi (krypto direkte)', metaapi: 'MetaTrader-meklar → bank → Firi', polymarket: 'Polymarket → Firi' }[id]}</h2>
        <ol class="sloyfer">${steg.map((s) => html`<li>${s}</li>`)}</ol>
      </section>`)}
    <section class="kort"><h2>Skatt og historikk</h2>
      <ul class="sloyfer">
        <li>Gevinst på aksjar, valuta, CFD og krypto er skattepliktig i Noreg. Krypto skal førast opp som formue og gevinst/tap i skattemeldinga.</li>
        <li>Ta vare på all handelshistorikk: last ned CSV frå kvar meklar minst kvart kvartal. Papirboka og results/ i repoet er ikkje skattedokumentasjon.</li>
        <li>Firi rapporterer til Skatteetaten for det som skjer hos dei; resten er ditt ansvar.</li>
      </ul>
    </section>`;
}
