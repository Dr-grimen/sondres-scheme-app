import { useEffect, useState } from 'preact/hooks';
import { html, Tom, Flis, fmt, alderTekst } from '../ui.js';
import { last } from '../data.js';

/* Botane (Sondre 21. sep 2026): 200 speidarar på Kalshi, 200 på Polymarket og 80 koplarar deler éi tavle
   i arbitrasjemotoren i Zurich. Tala kjem frå motoren sjølv. */
const ROLLE = { kalshi: 'Kalshi-speidar', polymarket: 'Polymarket-speidar', koplar: 'Koplar' };
const OPPGÅVE = {
  kalshi: 'Får JA- og NEI-prisane på sin del av Kalshi-marknadene pusha same augneblink dei endrar seg.',
  polymarket: 'Får ordrebøkene på sin del av Polymarket-tokena pusha same augneblink dei endrar seg.',
  koplar: 'Eig ein del av dei like para og reknar JA + NEI + gebyr. Under 1 dollar = moglegheit.',
};

export function Selskapet({ tilstand }) {
  const [d, setD] = useState(undefined);
  useEffect(() => { last('arbitrase').then(setD).catch(() => setD(null)); }, []);
  if (d === undefined) return html`<div class="lastar mono">>>> LASTAR …</div>`;
  const liste = (d && d.botar && d.botar.liste) || [];
  const tal = (d && d.botar && d.botar.tal) || { kalshi: 200, polymarket: 200, koplar: 80 };
  const roller = ['kalshi', 'polymarket', 'koplar'].map((r) => {
    const b = liste.filter((x) => x.rolle === r);
    return { r, n: tal[r] || b.length, aktive: b.filter((x) => x.prisar || x.funn).length,
             prisar: b.reduce((s, x) => s + (x.prisar || 0), 0), funn: b.reduce((s, x) => s + (x.funn || 0), 0),
             eig: b.reduce((s, x) => s + (x.eig || 0), 0) };
  });
  const topp = [...liste].filter((x) => x.funn).sort((x, y) => (y.funn - x.funn) || ((y.beste || 0) - (x.beste || 0))).slice(0, 15);
  const ordre = (tilstand && tilstand.ordre) || {};
  return html`
    <div class="fase">>>> BOTANE // 480 PÅ ÉI FELLES TAVLE</div>
    <section class="kort"><h2>Tre lag <small>${d && d.ts ? `tal frå motoren ${alderTekst(d.ts)}` : 'ingen status enno'}</small></h2>
      <div class="tal">
        ${roller.map((x) => html`<${Flis} v=${x.n} l=${`${ROLLE[x.r]}ar · ${fmt(x.aktive)} aktive`} />`)}
        <${Flis} v=${d && d.par} l="like par dei deler" />
      </div>
      ${roller.map((x) => html`<p><b>${ROLLE[x.r]}ar (${x.n}):</b> ${OPPGÅVE[x.r]} <span class="stille">Eig ${fmt(x.eig)} ${x.r === 'koplar' ? 'par' : (x.r === 'kalshi' ? 'marknader' : 'token')} · ${fmt(x.prisar)} prisoppdateringar · ${fmt(x.funn)} funn sidan start.</span></p>`)}
      <p class="stille">Alle ser alt som står på tavla, så ein speidar på Kalshi og ein på Polymarket «snakkar saman» gjennom koplaren som eig paret. Botane er arbeidsdelar i éin motor, ikkje sjølvstendige KI-ar.</p>
    </section>

    <section class="kort"><h2>Flest funn <small>botar som har funne skilnader over minstemarginen</small></h2>
      ${topp.length ? html`<div class="scroll"><table class="tabell">
        <tr><th>Bot</th><th>Rolle</th><th>Funn</th><th>Beste netto</th><th>Eig</th></tr>
        ${topp.map((x) => html`<tr><td class="mono">${x.id}</td><td><small>${ROLLE[x.rolle] || x.rolle}</small></td><td class="mono">${fmt(x.funn)}</td>
          <td class="mono">${x.beste != null ? `${fmt(x.beste * 100, 1)} c` : '–'}</td><td class="mono">${fmt(x.eig)}</td></tr>`)}
      </table></div>` : html`<${Tom} tekst="Ingen funn over minstemarginen sidan motoren starta." />`}
    </section>

    ${ordre.tittel ? html`<section class="kort"><h2>Ordren frå Sondre <small>${ordre.tittel}</small></h2>
      <p style="white-space:pre-line;margin:0">${ordre.fraa_sondre}</p>
      ${ordre.slik_gjeld_det ? html`<p class="stille" style="white-space:pre-line">${ordre.slik_gjeld_det}</p>` : null}
    </section>` : null}`;
}
