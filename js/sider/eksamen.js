import { useEffect, useState } from 'preact/hooks';
import { html, Fase, Flis, Tom, fmt, dato } from '../ui.js';
import { last } from '../data.js';

export const PROVE_NAMN = {
  usett_periode: 'Usett periode', foldar: 'Halvårsfoldar', permutasjon: 'Permutasjon', nabolag: 'Parameter-nabolag',
  kostnad_x2: 'Kostnad ×2', monte_carlo: 'Monte Carlo', deflatert_sharpe: 'Deflatert Sharpe', plataa: 'Platå',
  regime: 'Regime', korrelasjon: 'Korrelasjon',
};

/* Eksamen: kvart genom sit ti prøver på data det aldri har sett, og stress på det det har sett.
   Kvar prikk er ein dom; trykk på rada for å lese alle ti. */
export function Eksamen() {
  const [e, setE] = useState(undefined);
  const [open, setOpen] = useState(null);
  useEffect(() => { last('eksamen').then(setE); }, []);
  if (e === undefined) return html`<div class="lastar mono">>>> LASTAR …</div>`;
  if (!e || !e.n_provde) return html`<${Fase} nr=4 namn="Eksamen" /><${Tom} tekst="ingen eksamen køyrd enno – kjem etter fyrste vekekampanje, eller køyr python -m scheme.main eksamen" />`;
  const prover = e.prover || [];
  const genom = e.genom || [];
  return html`
    <${Fase} nr=4 namn=${`Eksamen · ${fmt(e.n_provde)} genom · ${prover.length} prøver · ${fmt(e.n_bestaatt)} bestått`} raud=${e.n_bestaatt === 0} />
    ${(e.portefolje && (e.portefolje.medlemmer || []).length) ? html`<section class="kort"><h2>Porteføljeeksamen <small>fleire ukorrelerte kantar prøvde som éin</small></h2>
      <div class="flis-rad">
        <${Flis} v=${e.portefolje.medlemmer.length} l="medlemmer" />
        <${Flis} tekst=${fmt(e.portefolje.sharpe, 2)} l="samla Sharpe" kl="cyan" />
        <${Flis} tekst=${`${fmt(Math.min(...e.portefolje.einskilde_sharpe), 2)}–${fmt(Math.max(...e.portefolje.einskilde_sharpe), 2)}`} l="kvar for seg" />
        <${Flis} tekst=${e.portefolje.bestaatt ? 'BESTOD' : 'FELT'} l=${e.portefolje.bestaatt ? 'alle prøvene' : (e.portefolje.felt || []).join(', ')} kl=${e.portefolje.bestaatt ? 'gron' : 'raud'} />
      </div>
      <p class="stille" style="margin-top:8px">${e.portefolje.merknad}</p>
      <div class="scroll"><table><thead><tr><th>Eigedel</th><th>Genom</th><th class="r">Sharpe</th><th class="r">Vekt</th><th>Regel</th></tr></thead><tbody>
        ${e.portefolje.medlemmer.map((m) => html`<tr><td>${m.eigedel}</td><td class="mono">${m.id}</td><td class="r">${fmt(m.sharpe, 2)}</td><td class="r">${fmt(100 * m.vekt, 0)} %</td><td class="status">${(m.skildring || '').slice(0, 90)}</td></tr>`)}
      </tbody></table></div>
      ${(e.portefolje.walk_forward || {}).n_vindauge ? html`<div class="agent" style="margin-top:8px">
        <div class="n"><span>Walk-forward over ${e.portefolje.walk_forward.n_vindauge} vindauge</span><small>${fmt(e.portefolje.walk_forward.dagar)} dagar</small></div>
        <div class="j">Sharpe ${fmt(e.portefolje.walk_forward.sharpe, 2)} · ${fmt(100 * e.portefolje.walk_forward.andel_positive_vindauge, 0)} % av vindauga i pluss · største fall ${fmt(100 * e.portefolje.walk_forward.maks_drawdown, 1)} %</div>
        <div class="s">${e.portefolje.walk_forward.merknad}</div>
      </div>` : null}
      <table style="margin-top:8px"><tbody>${(e.portefolje.dommar || []).map((d) => html`<tr><td style=${`color:${d.bestaatt ? 'var(--gron)' : 'var(--raud2)'}`}>${d.bestaatt ? '●' : '○'} ${d.namn}</td><td class="r mono">${d.verdi == null ? '–' : fmt(d.verdi, 3)}</td><td class="r mono stille">krav ${fmt(d.terskel, 2)}</td><td class="status">${d.forklaring}</td></tr>`)}</tbody></table>
    </section>` : null}
    <section class="kort"><h2>Resultat <small>${dato(e.ts)} · kampanje ${e.kampanje}</small></h2>
      <div class="tal">
        <${Flis} v=${e.n_provde} l="genom som tok eksamen (dei beste frå kvar eigedel)" />
        <${Flis} v=${prover.length} l="prøver kvar måtte bestå" />
        <${Flis} v=${e.n_bestaatt} l="bestod alle prøvene → papir" kl=${e.n_bestaatt ? 'gron' : 'raud'} />
        <${Flis} v=${e.n_provde - e.n_bestaatt} l="felt (dommane er lagra)" kl="raud" />
      </div>
      <p class="stille" style="margin:10px 0 0">${e.n_bestaatt === 0 ? 'Ingenting bestått. Det er eit rett resultat, ikkje ein feil: den beste av 130 000 tilfeldige strategiar ser alltid god ut in-sample, og eksamen finst for å avsløre nettopp det.' : `${e.n_bestaatt} genom bestod alle prøvene og handlar no på papir (nivå 1). Papir i minst 30 dagar før demo.`} Eksamen tok ${fmt(e.varigheit_s)} s.</p>
    </section>
    <section class="kort"><h2>Alle genom <small>● bestått · ○ felt · trykk for dommane</small></h2>
      <p class="stille">Tre kjerneprøver må haldast: usett periode, permutasjon og dobbel kostnad. Éin bom på ei mjuk prøve er lov. Deflatert Sharpe avgjer storleiken: over 0,95 gir full, over 0,85 gir halv. Ein «middels» kjem aldri til ekte handel før han er eksaminert på nytt som «sterk».</p>
      <div class="scroll"><table><thead><tr><th>Eigedel</th><th>Genom</th><th class="r">Fitness</th><th class="r">PSR</th>${prover.map((p) => html`<th title=${PROVE_NAMN[p] || p} style="text-align:center">${(PROVE_NAMN[p] || p).slice(0, 4)}</th>`)}<th>Status</th></tr></thead><tbody>
        ${genom.map((g) => html`
          <tr class="klikk ${g.bestaatt ? 'fremja' : 'dod'}" onClick=${() => setOpen(open === g.id ? null : g.id)}>
            <td>${g.eigedel}</td><td class="mono">${g.id}</td><td class="r">${fmt(g.fitness, 2)}</td><td class="r ${g.psr >= 0.85 ? 'opp' : ''}">${g.psr == null ? '–' : fmt(g.psr, 3)}</td>
            ${g.dommar.map((d) => html`<td style="text-align:center" title=${`${PROVE_NAMN[d.namn] || d.namn}: ${d.forklaring}`}><span style=${`color:${d.bestaatt ? 'var(--gron)' : 'var(--raud2)'};font-size:15px`}>${d.bestaatt ? '●' : '○'}</span></td>`)}
            <td class="status"><span class="merk ${g.bestaatt ? (g.klasse === 'sterk' ? 'gron' : 'gul') : 'fare'}" title=${g.psr != null ? `deflatert Sharpe (PSR) ${fmt(g.psr, 3)}` : ''}>${g.bestaatt ? `${(g.klasse || '').toUpperCase()} · ${g.storleik_faktor === 1 ? 'full' : 'halv'} storleik` : `FELT PÅ ${g.felt.length}`}</span></td>
          </tr>
          ${open === g.id ? html`<tr><td colspan=${5 + prover.length} class="status">
            <b>Regel:</b> ${g.skildring}<br/>
            <table style="margin-top:8px"><tbody>${g.dommar.map((d) => html`<tr><td style=${`color:${d.bestaatt ? 'var(--gron)' : 'var(--raud2)'}`}>${d.bestaatt ? '●' : '○'} ${PROVE_NAMN[d.namn] || d.namn}</td><td class="r mono">${d.verdi == null ? '–' : fmt(d.verdi, 3)}</td><td class="r mono stille">${d.terskel == null ? '' : 'krav ' + fmt(d.terskel, 2)}</td><td class="status">${d.forklaring}</td></tr>`)}</tbody></table>
            <span class="stille">kjelde: results/eksamen/siste.json</span></td></tr>` : null}`)}
      </tbody></table></div>
    </section>`;
}
