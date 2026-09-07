import { useEffect, useState } from 'preact/hooks';
import { html, Fase, Flis, Tom, fmt, dato, alderTekst } from '../ui.js';
import { last } from '../data.js';

const NAMN = { QQQ: 'Nasdaq', SPY: 'S&P 500', NVDA: 'Nvidia', 'GC=F': 'Gull', 'BZ=F': 'Brent', 'EURUSD=X': 'EUR/USD', BTCUSDT: 'Bitcoin', ETHUSDT: 'Ethereum' };

/* Kunnskap: kva systemet las i dag, kva det trur marknaden er i (regime), og kva forsking og bøker gav av idear. */
export function Kunnskap() {
  const [k, setK] = useState(undefined);
  useEffect(() => { last('kunnskap').then(setK); }, []);
  if (k === undefined) return html`<div class="lastar mono">>>> LASTAR …</div>`;
  if (!k || (!k.nyheiter && !k.forsking && !k.boker)) return html`<div class="fase">>>> MINNE // KUNNSKAP</div><${Tom} tekst="kunnskapsløypa har ikkje køyrt enno (dagleg 05:00 UTC, eller python -m scheme.main kunnskap)" />`;
  const ny = k.nyheiter || {}; const fo = k.forsking || {}; const bo = k.boker || {}; const reg = ny.regime || {}; const llm = k.llm || {};
  const per = Object.entries(ny.per_instrument || {}).sort((a, b) => b[1].n - a[1].n);
  return html`
    <div class="fase">>>> MINNE // KUNNSKAP · ${fmt(ny.n_saker)} SAKER · ${fmt(fo.n_artiklar)} ARTIKLAR · ${fmt(bo.n_filer)} BØKER</div>
    <section class="kort"><h2>Regime no <small>skjult Markov-modell på avkastning og volatilitet · ${ny.dato || ''}</small></h2>
      ${Object.keys(reg).length ? html`<div class="agentar">${Object.entries(reg).map(([sym, r]) => html`<div class="agent ${r.tilstand === 'uroleg' ? '' : 'aktiv'}" style=${r.tilstand === 'uroleg' ? 'border-left-color:var(--raud)' : ''}>
        <div class="n"><span>${r.namn || NAMN[sym] || sym}</span><small style=${`color:${r.tilstand === 'uroleg' ? 'var(--raud2)' : 'var(--cyan)'}`}>${r.tilstand.toUpperCase()}</small></div>
        <div class="j">sannsyn ${fmt(100 * r.sannsyn)} % · ${r.dagar} dagar · årsvol roleg ${fmt(100 * r.vol_roleg)} % / uroleg ${fmt(100 * r.vol_uroleg)} %</div></div>`)}</div>` : html`<${Tom} />`}
    </section>
    <section class="kort"><h2>Nyheiter i dag <small>${fmt(ny.n_kjelder)} kjelder · sentiment er ordteljing, ikkje sanning</small></h2>
      ${per.length ? html`<div class="scroll"><table><thead><tr><th>Instrument</th><th class="r">Saker</th><th class="r">Stemning</th><th>Døme</th></tr></thead><tbody>
        ${per.map(([sym, v]) => html`<tr><td>${NAMN[sym] || sym}</td><td class="r">${v.n}</td><td class="r ${v.sentiment > 0.15 ? 'opp' : (v.sentiment < -0.15 ? 'ned' : '')}">${v.sentiment > 0 ? '+' : ''}${fmt(v.sentiment, 2)}</td><td class="status">${(v.topp || []).slice(0, 2).join(' · ')}</td></tr>`)}
      </tbody></table></div>` : html`<${Tom} />`}
      ${ny.oppsummering ? html`<p style="margin:12px 0 0;color:var(--tekst2)">${ny.oppsummering}</p><p class="stille">skrive av ${ny.oppsummering_kjelde}</p>` : html`<p class="stille" style="margin:10px 0 0">Inga modell-oppsummering: ${ny.oppsummering_kjelde || 'ikkje køyrt'}.</p>`}
      ${(ny.makro || []).length ? html`<details style="margin-top:10px"><summary>Makro-saker (${ny.makro.length})</summary><ul class="sloyfer">${ny.makro.slice(0, 15).map((m) => html`<li>${m.tittel} <span class="stille">· ${m.kjelde}</span></li>`)}</ul></details>` : null}
    </section>
    <section class="kort"><h2>Forsking <small>arXiv q-fin · ${fmt(fo.totalt_lesne)} artiklar lesne totalt · ${fmt(fo.n_med_idear)} med idear i dag</small></h2>
      ${(fo.artiklar || []).length ? html`<div class="scroll"><table><thead><tr><th>Artikkel</th><th>Dato</th><th>Idear (primitivar til genom)</th></tr></thead><tbody>
        ${fo.artiklar.slice(0, 20).map((a) => html`<tr><td class="status"><a href=${a.lenkje} target="_blank" rel="noopener">${a.tittel}</a></td><td class="mono stille">${a.dato}</td><td class="status">${Object.keys(a.idear || {}).length ? Object.keys(a.idear).map((p) => html`<span class="merk ok" style="margin:1px">${p}</span>`) : html`<span class="stille">ingen direkte</span>`}</td></tr>`)}
      </tbody></table></div>` : html`<${Tom} tekst="ingen nye artiklar i dag" />`}
      ${fo.oppsummering ? html`<p style="margin:12px 0 0;color:var(--tekst2);white-space:pre-wrap">${fo.oppsummering}</p>` : null}
    </section>
    <section class="kort"><h2>Bøker <small>legg eigne, lovlege PDF-ar i ~/sondres-scheme/kunnskap/</small></h2>
      ${(bo.lesne || []).length ? bo.lesne.map((b) => html`<div class="agent"><div class="n"><span>${b.fil}</span><small>${fmt(b.ord)} ORD</small></div><div class="j">${b.samandrag || 'ingen modell-samandrag (' + (b.samandrag_kjelde || '') + ')'}</div><div class="s">idear: ${Object.keys(b.idear || {}).join(', ') || 'ingen'} · ${(b.reglar || []).length} regelsetningar</div></div>`) : html`<${Tom} tekst=${bo.merknad || 'ingen bøker enno'} />`}
    </section>
    <section class="kort"><h2>Språkmodell <small>${k.llm_modell} · hardt tak ${fmt(k.llm_tak_kr)} kr/mnd</small></h2>
      <div class="tal"><${Flis} tekst=${`${fmt(llm.kr_denne_maanaden || 0, 2)} / ${fmt(k.llm_tak_kr)} kr`} l=${`brukt i ${llm.maanad || 'denne månaden'}`} /><${Flis} v=${llm.kall || 0} l="kall" /><${Flis} v=${llm.tokens_inn || 0} l="tokens inn" /><${Flis} v=${llm.tokens_ut || 0} l="tokens ut" /></div>
      <div class="stolpe ${(llm.kr_denne_maanaden || 0) > 0.9 * k.llm_tak_kr ? 'raud' : ''}"><i style=${`width:${Math.min(100, 100 * (llm.kr_denne_maanaden || 0) / (k.llm_tak_kr || 1))}%`}></i></div>
      <p class="stille" style="margin:8px 0 0">Når taket er nådd, køyrer alt regelbasert og seier det. Modellen får aldri avgjere ein handel.</p>
    </section>`;
}
