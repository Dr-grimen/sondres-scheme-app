import { useEffect, useState } from 'preact/hooks';
import { html, Fase, Tom, fmt, dato } from '../ui.js';
import { last } from '../data.js';
import { PROVE_NAMN } from './eksamen.js';

const FORKLARING = {
  usett_periode: 'Dagane etter in-sample-slutt. Ingen genom har sett dei. Den eine ekte framovertesten før papir.',
  foldar: 'Historia delt i halvår. Ein strategi som berre tener i éin periode er ikkje ein strategi.',
  permutasjon: 'Prisbanen blir stokka 100 gonger og regelen køyrd på nytt. Slår stokka data like ofte, er kanten støy.',
  nabolag: 'Kvar talparameter eitt steg opp og ned. Ein einsam topp i parameterrommet er tilpassing, ikkje kant.',
  kostnad_x2: 'Dobbel spread, kommisjon og glidning. Må framleis tene.',
  monte_carlo: '300 omstokkingar av avkastningane i blokkar, med tilfeldig forskuving av inngang. 95-persentil drawdown må vere innanfor grensa.',
  deflatert_sharpe: 'Bailey & López de Prado: kor sannsynleg er Sharpe ekte, når vi valde den beste av N prøvde? N er heile kampanjen for eigedelen.',
  plataa: 'Sharpe i kvar fjerdedel av historia skal ikkje sprike vilt, og ingen del skal vere klart negativ.',
  regime: 'Bull/bear (over/under 200-dagars snitt) og høg/låg vol. Ingen regime får vere katastrofe.',
  korrelasjon: 'Mot alt som alt er fremja. Ein kopi tilfører ingenting til porteføljen.',
};

/* Stresslab: kva prøvene gjer, kva som feller flest, og fordelinga av verdiar per prøve. */
export function Stresslab() {
  const [e, setE] = useState(undefined);
  useEffect(() => { last('eksamen').then(setE); }, []);
  if (e === undefined) return html`<div class="lastar mono">>>> LASTAR …</div>`;
  const prover = (e && e.prover) || Object.keys(PROVE_NAMN);
  const genom = (e && e.genom) || [];
  const k = (e && e.innstillingar) || {};
  const stat = prover.map((p) => {
    const dommar = genom.map((g) => g.dommar.find((d) => d.namn === p)).filter(Boolean);
    const bestaatt = dommar.filter((d) => d.bestaatt).length;
    const verdiar = dommar.map((d) => d.verdi).filter((v) => v != null).sort((a, b) => a - b);
    return { p, n: dommar.length, bestaatt, felt: dommar.length - bestaatt, median: verdiar.length ? verdiar[Math.floor(verdiar.length / 2)] : null,
             min: verdiar[0], maks: verdiar[verdiar.length - 1], terskel: dommar.length ? dommar[0].terskel : null };
  });
  return html`
    <${Fase} nr=5 namn=${`Stresslab · ${prover.length} prøver`} />
    <section class="kort"><h2>Kva som feller flest <small>${e && e.n_provde ? `${fmt(e.n_provde)} genom, ${dato(e.ts)}` : 'ingen eksamen enno'}</small></h2>
      ${genom.length ? html`<div class="scroll"><table><thead><tr><th>Prøve</th><th class="r">Bestått</th><th class="r">Felt</th><th style="width:30%">–</th><th class="r">Median</th><th class="r">Min–maks</th><th class="r">Krav</th></tr></thead><tbody>
        ${[...stat].sort((a, b) => b.felt - a.felt).map((s) => html`<tr><td>${PROVE_NAMN[s.p] || s.p}</td><td class="r opp">${s.bestaatt}</td><td class="r ned">${s.felt}</td><td><div class="stolpe raud"><i style=${`width:${s.n ? 100 * s.felt / s.n : 0}%`}></i></div></td><td class="r mono">${s.median == null ? '–' : fmt(s.median, 3)}</td><td class="r mono stille">${s.min == null ? '–' : `${fmt(s.min, 2)} – ${fmt(s.maks, 2)}`}</td><td class="r mono stille">${s.terskel == null ? '–' : fmt(s.terskel, 2)}</td></tr>`)}
      </tbody></table></div>` : html`<${Tom} tekst="ingen dommar enno – prøvene står klare under" />`}
    </section>
    <section class="kort"><h2>Dei ti prøvene <small>alle må bli bestått · tersklar frå config.yaml</small></h2>
      <div class="agentar">${prover.map((p, i) => html`<div class="agent"><div class="n"><span>${String(i + 1).padStart(2, '0')} ${PROVE_NAMN[p] || p}</span><small>${p.toUpperCase()}</small></div><div class="j">${FORKLARING[p] || ''}</div></div>`)}</div>
      <p class="stille" style="margin:10px 0 0">Krav no: usett Sharpe ≥ ${k.min_sharpe_usett ?? 0.5} · positive halvår ≥ ${fmt(100 * (k.min_andel_foldar ?? 0.6))} % · p ≤ ${k.maks_p ?? 0.05} · naboar ≥ ${fmt(100 * (k.min_andel_nabolag ?? 0.6))} % · Monte Carlo-drawdown ≤ ${fmt(100 * (k.maks_mc_drawdown ?? 0.35))} % · sannsyn for ekte kant ≥ ${fmt(100 * (k.min_psr ?? 0.95))} % · platå-spreiing ≤ ${k.maks_plataa_spreiing ?? 1.5} · verste regime > ${fmt(100 * (k.maks_regime_tap ?? -0.25))} % · korrelasjon ≤ ${k.maks_korrelasjon ?? 0.6}. Tersklane blir berre endra i config.yaml, aldri frå ein knapp.</p>
    </section>`;
}
