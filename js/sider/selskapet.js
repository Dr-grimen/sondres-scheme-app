import { useEffect, useState } from 'preact/hooks';
import { html, Tom, Flis, fmt, alderTekst, motorStatusFersk, useStatusKlokke } from '../ui.js';
import { last } from '../data.js';

/* Botgruppene deler éi tavle i arbitrasjemotoren i Zurich. Statusen frå motoren er kjelda
   til tala og heile lista, også når ein eldre motor enno rapporterer meir enn maksgrensa. */
const MAKS_BOTAR = 50;
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
  const botar = d && d.botar;
  const harListe = Array.isArray(botar && botar.liste);
  const liste = harListe ? botar.liste : [];
  const tal = (botar && botar.tal) || {};
  const tala = Object.values(tal);
  const rapportertTal = tala.length && tala.every((n) => Number.isInteger(n) && n >= 0)
    ? tala.reduce((sum, n) => sum + n, 0) : null;
  const botTal = rapportertTal !== null ? rapportertTal : (harListe ? liste.length : null);
  const overMaks = botTal > MAKS_BOTAR || liste.length > MAKS_BOTAR;
  const ulikListe = harListe && rapportertTal !== null && rapportertTal !== liste.length;
  const roller = ['kalshi', 'polymarket', 'koplar'].map((r) => {
    const b = liste.filter((x) => x.rolle === r);
    return { r, n: Number.isInteger(tal[r]) ? tal[r] : (harListe ? b.length : null),
             prisar: b.reduce((s, x) => s + (x.prisar || 0), 0), funn: b.reduce((s, x) => s + (x.funn || 0), 0),
             eig: b.reduce((s, x) => s + (x.eig || 0), 0) };
  });
  const ordre = (tilstand && tilstand.ordre) || {};
  return html`
    <div class="fase">>>> MOTOREN // ÉIN SERVER · TRE ARBEIDSOMRÅDE</div>
    ${d && !motorStatusFersk(d.ts) ? html`<p class="feil">GAMMAL STATUS: tala under stadfestar ikkje kva motoren gjer no.</p>` : null}
    ${overMaks ? html`<p class="feil">Statusen viser meir enn maks ${MAKS_BOTAR} botgrupper. Oppsettet med 50 er ikkje stadfesta i denne målinga. Alle rapporterte grupper er viste under.</p>` : null}
    ${ulikListe ? html`<p class="feil">Statusen oppgir ${fmt(rapportertTal)} botgrupper, men lista inneheld ${fmt(liste.length)}. Tala stemmer ikkje overeins.</p>` : null}
    <section class="kort"><h2>Éin motor <small>${d && d.ts ? `tal frå motoren ${alderTekst(d.ts)}` : 'ingen status enno'}</small></h2>
      <div class="tal">
        <${Flis} tekst="1" l="handelsmotor" />
        <${Flis} tekst="1" l="server i Zurich" />
        <${Flis} tekst=${fmt(botTal)} l="botgrupper i siste måling" />
        <${Flis} tekst=${String(MAKS_BOTAR)} l="maks botgrupper" />
        <${Flis} v=${d && d.par} l="like par i siste måling" />
      </div>
      <p>Fordeling ved maks 50: 20 Kalshi · 20 Polymarket · 10 kopling og kontroll.</p>
      ${roller.map((x) => html`<p><b>${ROLLE[x.r]}: ${fmt(x.n)} botgrupper.</b> ${OPPGÅVE[x.r]} <span class="stille">Følgjer ${fmt(x.eig)} ${x.r === 'koplar' ? 'par' : (x.r === 'kalshi' ? 'marknader' : 'token')} · ${fmt(x.prisar)} prisoppdateringar · ${fmt(x.funn)} funn sidan start.</span></p>`)}
      <p class="stille">Alle botgruppene køyrer i éin handelsmotor på éin server og brukar ei felles pristavle. Namna K, P og A under er interne oppgåvegrupper med teljarar. Fleire grupper gir ikkje automatisk fleire handlar eller betre forteneste.</p>
    </section>

    <section class="kort"><h2>Alle botgruppene frå siste måling <small>${fmt(harListe ? liste.length : null)} grupper · teljarar sidan siste motorstart</small></h2>
      ${liste.length ? html`<div class="scroll"><table class="tabell">
        <tr><th>Gruppe</th><th>Arbeidsområde</th><th>Prisoppdateringar</th><th>Funn</th><th>Beste netto</th><th>Eig</th></tr>
        ${liste.map((x) => html`<tr key=${x.id}><td class="mono">${x.id}</td><td><small>${ROLLE[x.rolle] || x.rolle}</small></td><td class="mono">${fmt(x.prisar)}</td><td class="mono">${fmt(x.funn)}</td>
          <td class="mono">${x.beste != null ? `${fmt(x.beste * 100, 1)} c` : '–'}</td><td class="mono">${fmt(x.eig)}</td></tr>`)}
      </table></div>` : html`<${Tom} tekst="Ingen botgrupper er rapporterte i denne målinga." />`}
    </section>

    ${ordre.tittel ? html`<section class="kort"><h2>Ordren frå Sondre <small>${ordre.tittel}</small></h2>
      <p style="white-space:pre-line;margin:0">${ordre.fraa_sondre}</p>
      ${ordre.slik_gjeld_det ? html`<p class="stille" style="white-space:pre-line">${ordre.slik_gjeld_det}</p>` : null}
    </section>` : null}`;
}
