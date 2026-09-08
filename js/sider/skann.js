import { useEffect, useState } from 'preact/hooks';
import { html, Flis, Tom, fmt, pst, dato } from '../ui.js';
import { last } from '../data.js';

/* Skann: topp-100 aksjar og krypto kvar morgon. Dei fem største utliggjarane på volum, volatilitet og
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
    ${rader.map((r) => html`<tr><td class="mono">${r.symbol}${r.ufullstendig ? html` <span class="merk gul" title="dagsbaren er ikkje ferdig">*</span>` : null}</td>
      <td>${(r.namn || '').slice(0, 22)} <span class="merk ${r.gruppe === 'krypto' ? 'gul' : ''}">${(r.gruppe || '').toUpperCase()}</span></td>
      <td class="r ${Math.abs(r[m.felt] || 0) > 2 ? 'opp' : ''}">${r[m.felt] == null ? '–' : (r[m.felt] > 0 && kva === 'avstand_sma' ? '+' : '') + fmt(r[m.felt], 2)}${m.eining}</td>
      <td class="r">${fmt(r.pris, r.pris > 100 ? 2 : 4)}</td>
      <td class="r ${r.avk_dag > 0 ? 'opp' : (r.avk_dag < 0 ? 'ned' : '')}">${r.avk_dag == null ? '–' : pst(r.avk_dag, 1)}</td></tr>`)}
  </tbody></table></div>`;
}

export function Skann() {
  const [d, setD] = useState(undefined);
  const [gruppe, setGruppe] = useState('alle');
  useEffect(() => { last('skann').then(setD); }, []);
  if (d === undefined) return html`<div class="lastar mono">>>> LASTAR …</div>`;
  if (!d || !d.rader) return html`<${Tom} tekst="Skannaren har ikkje køyrt enno (05:00 UTC kvar morgon)" />`;
  const topp = gruppe === 'aksjar' ? (d.topp_aksjar || {}) : (gruppe === 'krypto' ? (d.topp_krypto || {}) : (d.topp || {}));
  const rader = (d.rader || []).filter((r) => gruppe === 'alle' || (gruppe === 'aksjar' ? r.gruppe === 'aksje' : r.gruppe === 'krypto'));
  return html`
    <div class="fase">>>> SANSAR // SKANN · ${d.dato}</div>
    <section class="kort"><h2>Universet <small>${d.merknad}</small></h2>
      <div class="flis-rad">
        <${Flis} v=${d.n_aksjar} l="aksjar (Nasdaq-100)" />
        <${Flis} v=${d.n_krypto} l="kryptopar" />
        <${Flis} v=${d.n_hoppa_over} l="utan nok data" />
        <${Flis} v=${(d.ufullstendig || []).length} l="uferdig dagsbar" />
      </div>
      <div style="margin-top:10px">${['alle', 'aksjar', 'krypto'].map((g) => html`<button class=${'knapp' + (gruppe === g ? ' aktiv' : '')} onClick=${() => setGruppe(g)}>${g.toUpperCase()}</button> `)}</div>
    </section>
    ${Object.keys(MAAL).map((kva) => html`<section class="kort"><h2>${MAAL[kva].tittel} <small>${MAAL[kva].hjelp}</small></h2>
      <${Tabell} rader=${topp[kva]} kva=${kva} /></section>`)}
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
      <p class="stille" style="margin-top:8px">* dagsbaren er ikkje ferdig; tala er rekna på det som finst så langt i dag. Sist henta ${dato(d.ts)}.</p>
    </section>`;
}
