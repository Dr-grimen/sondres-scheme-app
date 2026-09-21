import { useEffect, useState } from 'preact/hooks';
import { html, Flis, Tom, fmt, dato, alderTekst } from '../ui.js';
import { lastAlle } from '../data.js';
import { motorTilstand } from './arbitrase.js';

/* Oversikt: berre arbitrasje mellom Kalshi og Polymarket (Sondre 21. sep 2026). Pengane fyrst. */
export function Oversikt({ tilstand }) {
  const [d, setD] = useState(null);
  useEffect(() => { lastAlle(['meklarar', 'arbitrase']).then(setD); }, []);
  if (!tilstand) return html`<${Tom} tekst="ingen tilstand enno – skya har ikkje køyrt" />`;
  const a = tilstand.arb;
  const t = motorTilstand(a);
  const arb = (d && d.arbitrase) || {};
  const ko = (d && d.meklarar && d.meklarar.kontoar) || {};
  const rader = Object.entries(ko).filter(([, v]) => v && v.cash_balance != null)
    .map(([namn, v]) => ({ namn: namn === 'kalshi' ? 'Kalshi' : (namn === 'polymarket' ? 'Polymarket' : namn), sum: v.cash_balance, valuta: v.currency, ts: v.checked_at, akt: v.aktivitet }));
  const usd = rader.reduce((s, r) => s + Number(r.sum || 0), 0);
  const handlar = [...(arb.handlar || [])].reverse().slice(0, 5);
  const beste = (arb.tilbod || []).slice(0, 5);

  return html`
    <div class="fase">>>> ARBITRASJE // JA PÅ ÉI SIDE + NEI PÅ DEN ANDRE = LÅST GEVINST</div>

    <section class="kort" style="border-color:rgba(52,211,153,.45)"><h2>Pengane dine <small>ekte saldo, lesen direkte frå kontoane</small></h2>
      ${rader.length ? html`
        <div class="tal">
          <${Flis} tekst=${`${fmt(usd, 2)} USD`} l="til saman på kontoane" kl="cyan" />
          ${rader.map((r) => html`<${Flis} tekst=${`${fmt(r.sum, 2)} ${r.valuta}`} l=${`${r.namn}${r.ts ? ` · lese ${alderTekst(r.ts)}` : ''}`} />`)}
        </div>
        ${rader.filter((r) => r.akt && r.akt.kan_hentast_usd > 0).map((r) => html`<p style="color:#fbbf24">${fmt(r.akt.kan_hentast_usd, 2)} USD er vunne og ventar: trykk «Claim» i Polymarket-appen.</p>`)}
        <p class="stille">pUSD er Polymarket sin dollar (1:1). Ingen pengar blir flytta herifrå; uttak gjer du sjølv under «Uttak».</p>`
        : html`<${Tom} tekst="ingen kontosaldo lesen enno – kjem ved neste skykøyring" />`}
    </section>

    <section class="kort"><h2>Arbitrasjemotoren <small>${a ? `serveren i Zurich · status ${alderTekst(a.ts)}` : 'ingen status enno'}</small></h2>
      ${a ? html`
        <div class="tal">
          <${Flis} tekst=${t.tekst} kl=${t.kl} l="ekte handel" />
          <${Flis} v=${a.par} l=${a.straum ? 'like par · prisane blir pusha straks' : 'like par skanna kvart 2. sek'} />
          <${Flis} v=${a.låst_gevinst} des=${2} l=${`låst gevinst (${fmt(a.opne || 0)} opne)`} kl="cyan" />
          <${Flis} v=${a.tent} des=${2} l="tent, gjort opp (USD)" kl=${(a.tent || 0) >= 0 ? 'gron' : 'raud'} />
        </div>
        ${a.pause ? html`<p class="feil">PAUSE: ${a.pause.grunn}. Slå på att med brytaren når det er sjekka.</p>` : null}
        <p class="stille">${a.handlar_i_dag || 0} arbitrasjar kjøpte i dag · ${a.godkjende_ligaer || 0} godkjende ligaer · ${fmt(a.botar && a.botar.aktive)} av 480 botar har arbeidd sidan start.</p>`
        : html`<${Tom} tekst="Motoren har ikkje rapportert enno." />`}
    </section>

    <section class="kort"><h2>Beste skilnader akkurat no <small>netto etter gebyr per par · <a href="#/arbitrase">alle</a></small></h2>
      ${beste.length ? html`<ul class="stille" style="margin:0 0 0 1em">${beste.map((x) => html`<li><b>${fmt(x.netto_per * 100, 1)} c</b> · ${x.kamp} (${x.utfall}) · sum ${fmt(x.k_ask + x.p_ask, 3)}</li>`)}</ul>`
        : html`<${Tom} tekst="Ingen par gir meir enn 1 cent netto akkurat no. Ekte skilnader er sjeldne og varer ofte berre sekund." />`}
    </section>

    <section class="kort"><h2>Siste handlar <small><a href="#/arbitrase">heile boka</a></small></h2>
      ${handlar.length ? html`<ul style="margin:0 0 0 1em">${handlar.map((h) => html`<li>${dato(h.ts)} · ${h.kamp} · ${h.tal != null ? `${fmt(h.tal)} par · ` : ''}${h.gevinst != null ? `gevinst ${fmt(h.gevinst, 2)} USD` : (h.forventa_gevinst != null ? `låst ${fmt(h.forventa_gevinst, 2)} USD` : h.status)}</li>`)}</ul>`
        : html`<${Tom} tekst="Ingen arbitrasjar kjøpte enno." />`}
    </section>

    <section class="kort"><h2>Strategien</h2>
      <p>Kjøp JA på den eine plattforma og NEI på den andre på <b>nøyaktig same kamp</b>. Eitt av dei betaler alltid 1 dollar. Er summen med gebyr under 1 dollar, er gevinsten låst same kva som skjer.</p>
      <p class="stille">0,40 + 0,55 = 0,95 → gevinst. 0,51 + 0,51 = 1,02 → tap. Det er summen som tel, ikkje kvar pris for seg.</p>
    </section>`;
}
