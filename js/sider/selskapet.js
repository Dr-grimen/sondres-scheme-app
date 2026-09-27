import { useEffect, useState } from 'preact/hooks';
import { html, Tom, Flis, fmt, alderTekst, motorStatusFersk, useStatusKlokke } from '../ui.js';
import { last } from '../data.js';

/* Botane (Sondre 21. sep 2026): 200 speidarar på Kalshi, 200 på Polymarket og 80 koplarar deler éi tavle
   i arbitrasjemotoren i Zurich. Tala kjem frå motoren sjølv. */
const ROLLE = { kalshi: 'Kalshi-prisar', polymarket: 'Polymarket-prisar', koplar: 'Kopling og kontroll' };
const OPPGÅVE = {
  kalshi: 'Les JA- og NEI-prisar frå Kalshi gjennom felles datatilkoplingar.',
  polymarket: 'Les ordrebøker frå Polymarket gjennom felles datatilkoplingar.',
  koplar: 'Samanliknar like par og kontrollerer pris, gebyr og handelsreglar før eit kjøp kan vurderast.',
};

export function Selskapet({ tilstand }) {
  const [d, setD] = useState(undefined);
  useStatusKlokke();
  useEffect(() => { last('arbitrase').then(setD).catch(() => setD(null)); }, []);
  if (d === undefined) return html`<div class="lastar mono">>>> LASTAR …</div>`;
  const liste = (d && d.botar && d.botar.liste) || [];
  const tal = (d && d.botar && d.botar.tal) || {};
  const roller = ['kalshi', 'polymarket', 'koplar'].map((r) => {
    const b = liste.filter((x) => x.rolle === r);
    return { r, n: tal[r] || b.length, aktive: b.filter((x) => x.prisar || x.funn).length,
             prisar: b.reduce((s, x) => s + (x.prisar || 0), 0), funn: b.reduce((s, x) => s + (x.funn || 0), 0),
             eig: b.reduce((s, x) => s + (x.eig || 0), 0) };
  });
  const topp = [...liste].filter((x) => x.funn).sort((x, y) => (y.funn - x.funn) || ((y.beste || 0) - (x.beste || 0))).slice(0, 15);
  const ordre = (tilstand && tilstand.ordre) || {};
  return html`
    <div class="fase">>>> MOTOREN // ÉIN SERVER · TRE ARBEIDSOMRÅDE</div>
    <section class="kort"><h2>Éin motor <small>${d && d.ts ? `tal frå motoren ${alderTekst(d.ts)}` : 'ingen status enno'}</small></h2>
      <div class="tal">
        <${Flis} tekst="1" l="handelsmotor" />
        <${Flis} tekst="1" l="server i Zurich" />
        <${Flis} tekst="3" l="arbeidsområde" />
        <${Flis} v=${d && d.par} l="like par i siste måling" />
      </div>
      ${roller.map((x) => html`<p><b>${ROLLE[x.r]}:</b> ${OPPGÅVE[x.r]} <span class="stille">Følgjer ${fmt(x.eig)} ${x.r === 'koplar' ? 'par' : (x.r === 'kalshi' ? 'marknader' : 'token')} · ${fmt(x.prisar)} prisoppdateringar · ${fmt(x.funn)} funn sidan start.</span></p>`)}
      <p class="stille">Motoren brukar ei felles pristavle. Namna K, P og A under er interne oppgåvegrupper med teljarar. Talet på slike namn seier ikkje kor mange program som køyrer eller kor god handelen er.</p>
    </section>

    ${d && !motorStatusFersk(d.ts) ? html`<p class="feil">GAMMAL STATUS: tala under stadfestar ikkje kva motoren gjer no.</p>` : null}
    <section class="kort"><h2>Oppgåvegrupper med flest funn <small>historiske teljarar sidan siste motorstart</small></h2>
      ${topp.length ? html`<div class="scroll"><table class="tabell">
        <tr><th>Gruppe</th><th>Arbeidsområde</th><th>Funn</th><th>Beste netto</th><th>Eig</th></tr>
        ${topp.map((x) => html`<tr><td class="mono">${x.id}</td><td><small>${ROLLE[x.rolle] || x.rolle}</small></td><td class="mono">${fmt(x.funn)}</td>
          <td class="mono">${x.beste != null ? `${fmt(x.beste * 100, 1)} c` : '–'}</td><td class="mono">${fmt(x.eig)}</td></tr>`)}
      </table></div>` : html`<${Tom} tekst="Ingen funn over minstemarginen sidan motoren starta." />`}
    </section>

    ${ordre.tittel ? html`<section class="kort"><h2>Ordren frå Sondre <small>${ordre.tittel}</small></h2>
      <p style="white-space:pre-line;margin:0">${ordre.fraa_sondre}</p>
      ${ordre.slik_gjeld_det ? html`<p class="stille" style="white-space:pre-line">${ordre.slik_gjeld_det}</p>` : null}
    </section>` : null}`;
}
