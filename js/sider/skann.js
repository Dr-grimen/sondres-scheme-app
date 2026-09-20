import { useEffect, useState } from 'preact/hooks';
import { html, Flis, Tom, fmt, pst, dato } from '../ui.js';
import { lastAlle } from '../data.js';
import { PolymarketKort } from '../polymarket.js';

/* Offentleg marknadsskann og historiske prisreferansar. Dei fem største utliggjarane på volum, volatilitet og
   avstand frå snittet. Alle tal kjem frå results/skann/siste.json; ingenting blir rekna i nettlesaren. */

const MAAL = {
  volum: { tittel: 'Volum', felt: 'rvol', eining: '× normalt', hjelp: 'volumet i siste bar delt på snittet av dei 20 føregåande' },
  volatilitet: { tittel: 'Volatilitet', felt: 'vol_kvot', eining: '× ATR20', hjelp: 'dagens sanne rekkjevidde delt på ATR20' },
  avstand_sma: { tittel: 'Avstand frå SMA20', felt: 'avstand_sma20_atr', eining: ' ATR', hjelp: '(close − SMA20) delt på ATR20, med forteikn' },
};

function Tabell({ rader, kva }) {
  const m = MAAL[kva];
  if (!rader || !rader.length) return html`<${Tom} tekst="ingen data" />`;
  return html`<div class="scroll"><table><thead><tr><th>Symbol</th><th>Namn</th><th class="r">${m.tittel}</th><th class="r">Pris</th><th class="r">I dag</th></tr></thead><tbody>
    ${rader.map((r) => html`<tr><td class="mono">${r.symbol}${r.ufullstendig ? html` <span class="merk gul" title="dagens bar var uferdig; tala er frå siste heile dag">*</span>` : null}</td>
      <td>${(r.namn || '').slice(0, 22)} <span class="merk ${r.gruppe === 'krypto' ? 'gul' : ''}">${(r.gruppe || '').toUpperCase()}</span></td>
      <td class="r ${Math.abs(r[m.felt] || 0) > 2 ? 'opp' : ''}">${r[m.felt] == null ? '–' : (r[m.felt] > 0 && kva === 'avstand_sma' ? '+' : '') + fmt(r[m.felt], 2)}${m.eining}</td>
      <td class="r">${fmt(r.pris, r.pris > 100 ? 2 : 4)}</td>
      <td class="r ${r.avk_dag > 0 ? 'opp' : (r.avk_dag < 0 ? 'ned' : '')}">${r.avk_dag == null ? '–' : pst(r.avk_dag, 1)}</td></tr>`)}
  </tbody></table></div>`;
}

export function Skann() {
  const [data, setD] = useState(undefined);
  useEffect(() => { lastAlle(['skann', 'polymarket']).then(setD); }, []);
  if (data === undefined) return html`<div class="lastar mono">>>> LASTAR …</div>`;
  const poly = data && data.polymarket;
  const skann = (data && data.skann) || {};
  const rader = (skann.rader || []).filter((r) => r.gruppe !== 'krypto');
  const topp = skann.topp_aksjar || skann.topp || {};
  const d = skann;
  return html`
    <div class="fase">>>> SANSAR // MARKNADSSKANN</div>
    <${PolymarketKort} snapshot=${poly && poly.snapshot} />
    <section class="kort"><h2>Trading.com · marknadsreferansar <small>${d.dato || 'ingen måledato'}</small></h2>
      <p class="stille">Prisreferansar til analyse. Dette er ikkje ei stadfesting av tilgjengelege Trading.com-kontraktar.</p>
      <div class="flis-rad">
        <${Flis} v=${d.n_aksjar} l="aksjar (Nasdaq-100)" />
        <${Flis} v=${d.n_hoppa_over} l="utan nok data" />
        <${Flis} v=${(d.ufullstendig || []).length} l="rekna på siste heile dag" />
      </div>
    </section>
    ${Object.keys(MAAL).map((kva) => html`<section class="kort"><h2>${MAAL[kva].tittel} <small>${MAAL[kva].hjelp}</small></h2>
      <${Tabell} rader=${(topp[kva] || []).filter((r) => r.gruppe !== 'krypto')} kva=${kva} /></section>`)}
    <section class="kort"><h2>Heile universet <small>${rader.length} symbol</small></h2>
      <details><summary>Vis alle</summary>
        <div class="scroll"><table><thead><tr><th>Symbol</th><th class="r">rvol</th><th class="r">vol/ATR</th><th class="r">ATR frå SMA20</th><th class="r">SMA50</th><th class="r">SMA200</th><th class="r">I dag</th></tr></thead><tbody>
          ${[...rader].sort((a, b) => (b.rvol || 0) - (a.rvol || 0)).map((r) => html`<tr><td class="mono">${r.symbol}</td>
            <td class="r">${fmt(r.rvol, 2)}</td><td class="r">${fmt(r.vol_kvot, 2)}</td>
            <td class="r">${r.avstand_sma20_atr == null ? '–' : fmt(r.avstand_sma20_atr, 2)}</td>
            <td class="r ${r.avstand_sma50_pct > 0 ? 'opp' : 'ned'}">${r.avstand_sma50_pct == null ? '–' : pst(r.avstand_sma50_pct, 1)}</td>
            <td class="r ${r.avstand_sma200_pct > 0 ? 'opp' : 'ned'}">${r.avstand_sma200_pct == null ? '–' : pst(r.avstand_sma200_pct, 1)}</td>
            <td class="r ${r.avk_dag > 0 ? 'opp' : 'ned'}">${r.avk_dag == null ? '–' : pst(r.avk_dag, 1)}</td></tr>`)}
        </tbody></table></div>
      </details>
      <p class="stille" style="margin-top:8px">* dagens bar var uferdig då skannen køyrde, så tala er rekna på den siste heile dagen. Sist henta ${dato(d.ts)}.</p>
    </section>`;
}
