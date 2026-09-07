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
      <div class="scroll"><table><thead><tr><th>Eigedel</th><th>Genom</th><th class="r">Fitness</th>${prover.map((p) => html`<th title=${PROVE_NAMN[p] || p} style="text-align:center">${(PROVE_NAMN[p] || p).slice(0, 4)}</th>`)}<th>Status</th></tr></thead><tbody>
        ${genom.map((g) => html`
          <tr class="klikk ${g.bestaatt ? 'fremja' : 'dod'}" onClick=${() => setOpen(open === g.id ? null : g.id)}>
            <td>${g.eigedel}</td><td class="mono">${g.id}</td><td class="r">${fmt(g.fitness, 2)}</td>
            ${g.dommar.map((d) => html`<td style="text-align:center" title=${`${PROVE_NAMN[d.namn] || d.namn}: ${d.forklaring}`}><span style=${`color:${d.bestaatt ? 'var(--gron)' : 'var(--raud2)'};font-size:15px`}>${d.bestaatt ? '●' : '○'}</span></td>`)}
            <td class="status"><span class="merk ${g.bestaatt ? 'gron' : 'fare'}">${g.bestaatt ? 'BESTÅTT · NIVÅ 1' : `FELT PÅ ${g.felt.length}`}</span></td>
          </tr>
          ${open === g.id ? html`<tr><td colspan=${4 + prover.length} class="status">
            <b>Regel:</b> ${g.skildring}<br/>
            <table style="margin-top:8px"><tbody>${g.dommar.map((d) => html`<tr><td style=${`color:${d.bestaatt ? 'var(--gron)' : 'var(--raud2)'}`}>${d.bestaatt ? '●' : '○'} ${PROVE_NAMN[d.namn] || d.namn}</td><td class="r mono">${d.verdi == null ? '–' : fmt(d.verdi, 3)}</td><td class="r mono stille">${d.terskel == null ? '' : 'krav ' + fmt(d.terskel, 2)}</td><td class="status">${d.forklaring}</td></tr>`)}</tbody></table>
            <span class="stille">kjelde: results/eksamen/siste.json</span></td></tr>` : null}`)}
      </tbody></table></div>
    </section>`;
}
