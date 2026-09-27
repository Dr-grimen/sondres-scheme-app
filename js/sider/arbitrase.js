import { useEffect, useState } from 'preact/hooks';
import { html, Flis, Tom, fmt, dato, alderTekst, motorStatusFersk, useStatusKlokke } from '../ui.js';
import { last } from '../data.js';

/* Arbitrasje (Sondre 21. sep 2026): kjøp JA på éi plattform og NEI på den andre på same hending når summen
   med gebyr er under 1 USD. Alt her kjem frå motoren på serveren i Zurich (results/arb/status.json). */

const RETNING = { A: 'JA på Kalshi + NEI på Polymarket', B: 'JA på Polymarket + NEI på Kalshi' };
const STATUS = {
  open: 'Begge sider kjøpte – ventar på oppgjer', gjort_opp: 'Ferdig – gjort opp', einsleg_bein_avvikla: 'Berre éi side – selt att',
  einsleg_bein_OPE: 'Berre éi side – STÅR OPEN', ukjend_kalshi: 'Uvisst svar frå Kalshi', ukjend_poly: 'Uvisst svar frå Polymarket',
  avbroten_midt_i_handel: 'Avbroten midt i', ikkje_fylt: 'Ikkje fylt', avbrote: 'Avbrote',
};

export function motorTilstand(a) {
  if (!a) return { tekst: 'INGEN STATUS', kl: 'raud' };
  if (!motorStatusFersk(a.ts)) return { tekst: 'GAMMAL STATUS', kl: 'raud' };
  if (a.pause) return { tekst: 'PAUSE', kl: 'raud' };
  return a.live ? { tekst: 'PÅ', kl: 'gron' } : { tekst: 'AV', kl: '' };
}

const PRISGRUNN = {
  manglar_kalshi: 'Manglar ferske Kalshi-prisar', kalshi_stengd: 'Kalshi-marknaden er stengd',
  polymarket_stengd: 'Polymarket-marknaden er stengd', manglar_pris: 'Manglar kjøpspris på ei side',
  ikkje_prisfordel: 'Samla kjøpspris er for høg', uvanleg_stor_skilnad: 'Prisskilnaden er større enn den tillatne grensa',
  for_lite_djupn: 'For få kontraktar tilgjengelege til prisen', margin_etter_gebyr: 'For liten margin etter gebyr',
};

export function prisForklaring(d) {
  const p = d && d.prisstatus;
  const gyldig = d && motorStatusFersk(d.ts) && p && motorStatusFersk(p.ts)
    && Number.isInteger(p.par_vurderte) && p.par_vurderte >= 0
    && Number.isInteger(p.kandidatar) && p.kandidatar >= 0;
  if (!gyldig) return { tekst: 'Ventar på fersk prisvurdering frå motoren.', grunnar: [] };
  const grunnar = Object.entries(p.utelat || {}).filter(([k, n]) => PRISGRUNN[k] && Number.isInteger(n) && n > 0)
    .sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, n]) => `${PRISGRUNN[k]} (${fmt(n)})`);
  return { tekst: p.par_vurderte === 0 ? 'Ingen par vart vurderte i siste prisrunde.'
    : (p.kandidatar === 0 ? 'Ingen kjøp oppfyller priskrava no.'
      : `${fmt(p.kandidatar)} prisforslag frå siste runde må òg oppfylle handelsreglane.`), grunnar };
}

export function Arbitrase() {
  const [d, setD] = useState(undefined);
  useStatusKlokke();
  useEffect(() => { last('arbitrase').then(setD).catch(() => setD(null)); }, []);
  if (d === undefined) return html`<div class="lastar mono">>>> LASTAR …</div>`;
  if (!d || !d.finst) return html`<div class="fase">>>> ARBITRASJE // KALSHI ↔ POLYMARKET</div><${Tom} tekst="Ingen status frå motoren enno – kjem ved neste skykøyring." />`;
  const t = motorTilstand(d);
  const sal = d.saldo || {};
  const hyller = sal.kalshi_hyller || {};
  const opp = d.oppdaging || {};
  const forklaring = prisForklaring(d);
  const avviste = Object.entries(d.avviste_grunnar || {}).sort((x, y) => y[1] - x[1]);
  const godkjende = (d.ligaer || []).filter((l) => l.godkjent);
  const avviste_ligaer = (d.ligaer || []).filter((l) => !l.godkjent);
  return html`
    <div class="fase">>>> ARBITRASJE // KALSHI ↔ POLYMARKET · MOTOREN I ZURICH</div>

    <section class="kort"><h2>Motoren <small>status ${alderTekst(d.ts)} · henta ${dato(d.henta)}</small></h2>
      <div class="tal">
        <${Flis} tekst=${t.tekst} kl=${t.kl} l="ekte handel" />
        <${Flis} v=${d.par} l="like par skanna" />
        <${Flis} tekst="1" l="motor på éin server" />
        <${Flis} v=${opp.kalshi_marknader} l="Kalshi-marknader lesne" />
      </div>
      ${d.pause ? html`<p class="feil">PAUSE: ${d.pause.grunn} (${dato(d.pause.ts)}). Årsaka må kontrollerast før nye kjøp kan tillatast.</p>` : null}
      <p class="stille">Tre arbeidsområde: Kalshi-prisar, Polymarket-prisar og kopling/kontroll av par.</p>
      <p class="stille">Nye kampar blir henta kvart 5. minutt (sist ${fmt(opp.sek, 1)} s), prisane blir henta gjennom direkte prisstraumar (full kontroll kvart 30. sekund). ${fmt(opp.poly_marknader)} Polymarket-marknader og ${fmt(opp.kalshi_kampar)} Kalshi-kampar i siste oppdaging.</p>
    </section>

    <section class="kort"><h2>Pengane <small>lesne av motoren ${alderTekst(sal.ts)}</small></h2>
      <div class="tal">
        <${Flis} v=${sal.kalshi} des=${2} l="Kalshi (USD)" />
        <${Flis} v=${sal.polymarket} des=${2} l="Polymarket (pUSD)" />
        <${Flis} v=${d.låst_gevinst} des=${2} l=${`venta gevinst i ${fmt(d.opne || 0)} opne`} kl="cyan" />
        <${Flis} v=${d.tent} des=${2} l="tent (gjort opp)" kl=${(d.tent || 0) >= 0 ? 'gron' : 'raud'} />
      </div>
      ${Object.keys(hyller).length ? html`<p class="stille">Kalshi-hyller: ${Object.entries(hyller).map(([k, v]) => `hylle ${k}: ${fmt(v, 2)} USD`).join(' · ')}. Tennis, MLB og WNBA ligg på hylle 3; NFL, NHL og fotball på hylle 0. Motoren handlar berre der pengane ligg.</p>` : null}
    </section>

    <section class="kort"><h2>Beste skilnader i siste måling <small>berekna netto etter gebyr, per par</small></h2>
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
      </table></div>` : html`<${Tom} tekst=${forklaring.tekst} />`}
      ${(d.ville_handla || []).length ? html`<p><b>Godkjende ved siste kontroll:</b> ${d.ville_handla.map((v) => `${v.kamp} (${fmt(v.netto_per * 100, 1)} c)`).join(' · ')}. Pris og tilgjengeleg mengd blir kontrollerte på nytt før kjøp.</p>` : null}
    </section>

    <section class="kort"><h2>Kvifor ventar motoren?</h2>
      <p>${forklaring.tekst}</p>
      ${forklaring.grunnar.length ? html`<ul>${forklaring.grunnar.map((g) => html`<li>${g}</li>`)}</ul>` : null}
      ${avviste.length ? html`<p class="stille">Handelsreglar ved siste kontroll: ${avviste.slice(0, 3).map(([g, n]) => `${g} (${n})`).join(' · ')}</p>` : null}
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
          <td class="mono ${((h.gevinst ?? h.forventa_gevinst) || 0) >= 0 ? 'opp' : 'ned'}">${h.gevinst != null ? fmt(h.gevinst, 2) : (h.forventa_gevinst != null ? `${fmt(h.forventa_gevinst, 2)} (venta)` : '–')}</td></tr>`)}
      </table></div>` : html`<${Tom} tekst="Ingen handlar enno." />`}
    </section>

    <section class="kort"><h2>Slik fungerer det</h2>
      <p>${d.ordre || ''}</p>
      <p class="stille">Døme: JA til 0,40 og motsett utfall til 0,55 kostar 0,95 før gebyr. Ved utfyllande utfall og likt oppgjer er venta utbetaling 1,00. Gebyr og faktisk utføring avgjer resultatet.</p>
      <p class="stille">Berre éi side kan bli kjøpt, og avlyste eller utsette kampar kan gjerast opp ulikt. Motoren prøver å selje att ei usikra side. Sal kan feile eller gi tap; ein pause fjernar ikkje ein posisjon som alt er open.</p>
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
