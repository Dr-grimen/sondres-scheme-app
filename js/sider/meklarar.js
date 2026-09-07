import { useEffect, useState } from 'preact/hooks';
import { html, Fase, Tom, fmt, dato, alderTekst } from '../ui.js';
import { last } from '../data.js';

const INFO = {
  alpaca: { namn: 'Alpaca', marknad: 'Aksjar, ETF, krypto (USA)', konto: 'https://app.alpaca.markets', noklar: 'ALPACA_KEY, ALPACA_SECRET', demo: 'papirkonto (ALPACA_PAPER=JA)', uttak: 'Nøkkelen har aldri uttaksrett hos Alpaca; uttak skjer i nettbanken deira.' },
  oanda: { namn: 'OANDA', marknad: 'Valuta, gull, olje, indeks-CFD', konto: 'https://www.oanda.com', noklar: 'OANDA_TOKEN, OANDA_ACCOUNT', demo: 'fxTrade Practice (OANDA_PRACTICE=JA)', uttak: 'Token gir handel og lesing, ikkje uttak.' },
  binance: { namn: 'Binance', marknad: 'Krypto', konto: 'https://testnet.binance.vision', noklar: 'BINANCE_KEY, BINANCE_SECRET', demo: 'testnett (BINANCE_TESTNET=JA)', uttak: 'Lag nøkkelen UTAN «Enable Withdrawals».' },
  firi: { namn: 'Firi', marknad: 'Krypto i norske kroner', konto: 'https://platform.firi.com', noklar: 'FIRI_KEY (og FIRI_CLIENT/FIRI_SECRET om Firi krev signering)', demo: 'ingen demo hos Firi – berre lesing til låsane er opne', uttak: 'Lag nøkkelen berre med lese- og handelsrett, aldri uttak.' },
  metaapi: { namn: 'MetaTrader 4/5 (MetaApi)', marknad: 'Alt MT4-kontoen din har', konto: 'https://app.metaapi.cloud', noklar: 'METAAPI_TOKEN, METAAPI_ACCOUNT', demo: 'MT4-demokonto (METAAPI_DEMO=JA)', uttak: 'Kostar ca. 8,64 USD/mnd – berre etter «JA» i dialogen.' },
  polymarket: { namn: 'Polymarket (polybot)', marknad: 'Prediksjonsmarknader', konto: 'https://polymarket.com', noklar: 'ligg i ~/polybot/.env', demo: 'papir til Brier slår marknaden', uttak: 'Pengane står i Polymarket-lommeboka; uttak gjer du sjølv der.' },
};

/* Adapterflåten: eitt kort per meklar med ekte status frå results/meklar.json (test-meklar les berre saldo og posisjonar). */
export function Meklarar({ tilstand }) {
  const [m, setM] = useState(undefined);
  useEffect(() => { last('meklarar').then(setM); }, []);
  if (m === undefined) return html`<div class="lastar mono">>>> LASTAR …</div>`;
  const rader = (m && m.meklarar) || [];
  const modus = (tilstand && tilstand.modus) || 'PAPIR';
  const status = {};
  for (const r of rader) status[r.namn] = r;
  const alle = Object.keys(INFO);
  const medNokkel = rader.filter((r) => r.har_nokkel).length;
  return html`
    <${Fase} nr=8 namn=${`Meklarar · ${medNokkel} av ${alle.length} har nøkkel · modus ${modus}`} raud=${modus === 'EKTE'} />
    <section class="kort"><h2>Låsane <small>kode, ikkje knappar</small></h2>
      <div class="agentar">
        <div class="agent ${modus !== 'PAPIR' ? 'aktiv' : ''}"><div class="n"><span>Lås 1 · DEMO</span><small>${modus === 'DEMO' || modus === 'EKTE' ? 'OPEN' : 'LÅST'}</small></div><div class="j">DEMO_TRADING=JA i .env på Macen. Ordre går til meklaren sine leikepengar (papirkonto, practice, testnett).</div></div>
        <div class="agent" style=${modus === 'EKTE' ? 'border-left-color:var(--raud)' : ''}><div class="n"><span>Lås 2 · EKTE</span><small style=${modus === 'EKTE' ? 'color:var(--raud2)' : ''}>${modus === 'EKTE' ? 'OPEN' : 'LÅST'}</small></div><div class="j">LIVE_TRADING=JA i .env OG live.aktiv: true i config.yaml, berre frå Macen. Skya kan aldri handle ekte: låsane finst ikkje der.</div></div>
      </div>
      <p class="stille" style="margin:10px 0 0">Kvar ordre går gjennom laas_ok() fyrst. Manglar låsane, blir ordren avvist utan eit einaste nettverkskall. Testa i tests/test_brokers.py for alle meklarane.</p>
    </section>
    <section class="kort"><h2>Adapterflåten <small>${m && m.generert ? `status ${alderTekst(rader[0]?.ts || m.generert)}` : ''}</small></h2>
      <div class="agentar">${alle.map((id) => { const i = INFO[id]; const r = status[id]; const ok = r && r.ok; const nokkel = r && r.har_nokkel; return html`
        <div class="agent ${ok ? 'aktiv' : ''}" style=${!nokkel ? 'opacity:.75' : ''}>
          <div class="n"><span>${i.namn}</span><small style=${`color:${ok ? 'var(--cyan)' : (nokkel ? 'var(--raud2)' : 'var(--dempa)')}`}>${ok ? 'KOPLA' : (nokkel ? 'FEIL' : 'INGEN NØKKEL')}</small></div>
          <div class="j">${i.marknad}</div>
          <div class="s">${r ? (r.demo === false ? 'EKTE KONTO' : 'demo') : i.demo}${r && r.saldo ? ` · saldo ${fmt(r.saldo.eigenkapital, 0)} ${r.saldo.valuta || ''} · ${(r.posisjonar || []).length} posisjonar` : ''}${r && r.feil && nokkel ? ` · ${r.feil}` : ''}</div>
          <div class="s">nøklar: ${i.noklar}</div>
          <div class="s">${i.uttak}</div>
          ${r && r.ts ? html`<div class="s">hjarteslag ${dato(r.ts)}</div>` : null}
        </div>`; })}</div>
      <p class="stille" style="margin:10px 0 0">«Test kopling» = <span class="mono">python -m scheme.main test-meklar</span>: les berre saldo og posisjonar, aldri ordre. Køyrer dagleg i skya med dei nøklane som finst der.</p>
    </section>
    <section class="kort"><h2>Slik legg du til ein meklar</h2>
      <ol class="sloyfer">
        <li>Lag konto (lenkje over) og ein API-nøkkel med lesing og handel – <b>aldri uttak</b>.</li>
        <li>Sei frå i chatten; eg opnar boksen (<span class="mono">./nokkel.sh FELT</span>) og du limer inn. Nøkkelen går til .env og GitHub Secret, aldri til chatten.</li>
        <li>Eg køyrer test-meklar. Kortet over blir grønt når kopling og saldo er lesne.</li>
        <li>Demo-ordre krev lås 1. Ekte krev lås 2 – og at strategiane har bevist seg (nivå 3).</li>
      </ol>
    </section>`;
}
