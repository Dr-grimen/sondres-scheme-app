import { useEffect, useState } from 'preact/hooks';
import { html, Flis, Tom, fmt, dato, alderTekst } from '../ui.js';
import { last } from '../data.js';

/* Arbitrasje (Sondre 21. sep 2026): kjøp JA på éi plattform og NEI på den andre på same hending når summen
   med gebyr er under 1 USD. Alt her kjem frå motoren på serveren i Zurich (results/arb/status.json). */

const RETNING = { A: 'JA på Kalshi + NEI på Polymarket', B: 'JA på Polymarket + NEI på Kalshi' };
const STATUS = {
  open: 'Kjøpt – gevinsten er låst', gjort_opp: 'Ferdig – gjort opp', einsleg_bein_avvikla: 'Berre éi side – selt att',
  einsleg_bein_OPE: 'Berre éi side – STÅR OPEN', ukjend_kalshi: 'Uvisst svar frå Kalshi', ukjend_poly: 'Uvisst svar frå Polymarket',
  avbroten_midt_i_handel: 'Avbroten midt i', ikkje_fylt: 'Ikkje fylt', avbrote: 'Avbrote',
};

export function motorTilstand(a) {
  if (!a) return { tekst: 'INGEN STATUS', kl: 'raud' };
  if (a.pause) return { tekst: 'PAUSE', kl: 'raud' };
  return a.live ? { tekst: 'PÅ', kl: 'gron' } : { tekst: 'AV', kl: '' };
}

export function Arbitrase() {
  const [d, setD] = useState(undefined);
  useEffect(() => { last('arbitrase').then(setD).catch(() => setD(null)); }, []);
  if (d === undefined) return html`<div class="lastar mono">>>> LASTAR …</div>`;
  if (!d || !d.finst) return html`<div class="fase">>>> ARBITRASJE // KALSHI ↔ POLYMARKET</div><${Tom} tekst="Ingen status frå motoren enno – kjem ved neste skykøyring." />`;
  const t = motorTilstand(d);
  const sal = d.saldo || {};
  const hyller = sal.kalshi_hyller || {};
  const opp = d.oppdaging || {};
  const bot = d.botar || {};
  const tal = bot.tal || {};
  const avviste = Object.entries(d.avviste_grunnar || {}).sort((x, y) => y[1] - x[1]);
  const godkjende = (d.ligaer || []).filter((l) => l.godkjent);
  const avviste_ligaer = (d.ligaer || []).filter((l) => !l.godkjent);
  return html`
    <div class="fase">>>> ARBITRASJE // KALSHI ↔ POLYMARKET · MOTOREN I ZURICH</div>

    <section class="kort"><h2>Motoren <small>status ${alderTekst(d.ts)} · henta ${dato(d.henta)}</small></h2>
      <div class="tal">
        <${Flis} tekst=${t.tekst} kl=${t.kl} l="ekte handel" />
        <${Flis} v=${d.par} l="like par skanna" />
        <${Flis} v=${(tal.kalshi || 0) + (tal.polymarket || 0) + (tal.koplar || 0)} l=${`botar (${fmt(bot.aktive)} aktive)`} />
        <${Flis} v=${opp.kalshi_marknader} l="Kalshi-marknader lesne" />
      </div>
      ${d.pause ? html`<p class="feil">PAUSE: ${d.pause.grunn} (${dato(d.pause.ts)}). Motoren handlar ikkje før brytaren blir slått på att.</p>` : null}
      <p class="stille">Nye kampar blir henta kvart 5. minutt (sist ${fmt(opp.sek, 1)} s), prisane blir pusha straks dei endrar seg (full kontroll kvart 30. sekund). ${fmt(opp.poly_marknader)} Polymarket-marknader og ${fmt(opp.kalshi_kampar)} Kalshi-kampar i siste oppdaging.</p>
    </section>

    <section class="kort"><h2>Pengane <small>lesne av motoren ${alderTekst(sal.ts)}</small></h2>
      <div class="tal">
        <${Flis} v=${sal.kalshi} des=${2} l="Kalshi (USD)" />
        <${Flis} v=${sal.polymarket} des=${2} l="Polymarket (pUSD)" />
        <${Flis} v=${d.låst_gevinst} des=${2} l=${`låst gevinst i ${fmt(d.opne || 0)} opne`} kl="cyan" />
        <${Flis} v=${d.tent} des=${2} l="tent (gjort opp)" kl=${(d.tent || 0) >= 0 ? 'gron' : 'raud'} />
      </div>
      ${Object.keys(hyller).length ? html`<p class="stille">Kalshi-hyller: ${Object.entries(hyller).map(([k, v]) => `hylle ${k}: ${fmt(v, 2)} USD`).join(' · ')}. Tennis, MLB og WNBA ligg på hylle 3; NFL, NHL og fotball på hylle 0. Motoren handlar berre der pengane ligg.</p>` : null}
    </section>

    <section class="kort"><h2>Beste skilnader akkurat no <small>netto etter gebyr, per par</small></h2>
      ${(d.tilbod || []).length ? html`<div class="scroll"><table class="tabell">
        <tr><th>Kamp</th><th>Kjøp</th><th>Sum</th><th>Netto</th><th>Avkastning</th><th>Djupn</th><th>Start</th></tr>
        ${d.tilbod.slice(0, 15).map((x) => html`<tr>
          <td>${x.kamp}<br /><small class="stille">${x.utfall} · ${x.serie || x.sport}</small></td>
          <td><small>${RETNING[x.retning] || x.retning}</small></td>
          <td class="mono">${fmt(x.k_ask + x.p_ask, 3)}</td>
          <td class="mono ${x.netto_per > 0 ? 'opp' : 'ned'}">${fmt(x.netto_per * 100, 1)} c</td>
          <td class="mono">${fmt((x.avkastning || 0) * 100, 1)} %</td>
          <td class="mono">${fmt(x.tal_topp)}</td>
          <td><small>${dato(x.start)}</small></td></tr>`)}
      </table></div>` : html`<${Tom} tekst="Ingen par gir meir enn 1 cent netto akkurat no. Slik er det mesteparten av tida." />`}
      ${(d.ville_handla || []).length ? html`<p><b>Oppfyller alle vilkåra no:</b> ${d.ville_handla.map((v) => `${v.kamp} (${fmt(v.netto_per * 100, 1)} c)`).join(' · ')}</p>` : null}
      ${avviste.length ? html`<p class="stille">Avviste no: ${avviste.map(([g, n]) => `${g} (${n})`).join(' · ')}</p>` : null}
    </section>

    <section class="kort"><h2>Handlar <small>siste 30 frå motoren si bok</small></h2>
      ${(d.handlar || []).length ? html`<div class="scroll"><table class="tabell">
        <tr><th>Tid</th><th>Kamp</th><th>Status</th><th>Par</th><th>Kost</th><th>Gevinst</th></tr>
        ${[...d.handlar].reverse().map((h) => html`<tr>
          <td><small>${dato(h.ts)}</small></td>
          <td>${h.kamp}<br /><small class="stille">${RETNING[h.retning] || ''}</small></td>
          <td><small>${STATUS[h.status] || h.status}${h.må_hentast ? ' · trykk «Claim» i Polymarket' : ''}</small></td>
          <td class="mono">${fmt(h.tal)}</td>
          <td class="mono">${fmt(h.kost, 2)}</td>
          <td class="mono ${((h.gevinst ?? h.forventa_gevinst) || 0) >= 0 ? 'opp' : 'ned'}">${h.gevinst != null ? fmt(h.gevinst, 2) : (h.forventa_gevinst != null ? `${fmt(h.forventa_gevinst, 2)} (låst)` : '–')}</td></tr>`)}
      </table></div>` : html`<${Tom} tekst="Ingen handlar enno." />`}
    </section>

    <section class="kort"><h2>Slik fungerer det</h2>
      <p>${d.ordre || ''}</p>
      <p class="stille">Døme: JA til 0,40 på Kalshi og motsett side til 0,55 på Polymarket kostar 0,95 + gebyr. Eitt av dei betaler alltid 1,00 – same kva lag som vinn. 0,51 + 0,51 = 1,02 er tap, uansett utfall.</p>
      <p class="stille">Risiko: avlyste eller utsette kampar kan gjerast opp ulikt (Kalshi «fair price», Polymarket 50-50). Difor må Kalshi-sida vere favoritten, og berre ligaer der reglane er lesne side om side blir handla. Blir berre éi side kjøpt, sel motoren henne att og set seg på pause.</p>
    </section>

    <section class="kort"><h2>Ligaer <small>${godkjende.length} godkjende · ${avviste_ligaer.length} avviste</small></h2>
      <div class="scroll"><table class="tabell">
        <tr><th>Liga (Kalshi-serie)</th><th>Status</th><th>Min. netto</th><th>Kvifor</th></tr>
        ${[...godkjende, ...avviste_ligaer].map((l) => html`<tr>
          <td class="mono"><small>${l.serie}</small></td>
          <td><small class=${l.godkjent ? 'opp' : 'ned'}>${l.godkjent ? 'godkjend' : 'avvist'}</small></td>
          <td class="mono">${l.min_netto != null ? `${fmt(l.min_netto * 100, 1)} c` : '–'}</td>
          <td><small class="stille">${l.grunn || ''}</small></td></tr>`)}
      </table></div>
    </section>`;
}
