import { useEffect, useState } from 'preact/hooks';
import { html, Fase, Tom, fmt, pstRaa, dato } from '../ui.js';
import { last } from '../data.js';

const STATUS = (r) => r.fremja ? ['fremja', 'FREMJA'] : (r.observasjon ? ['obs', 'OBSERVASJON · PAPIR'] : (r.strategi === 'kjop_hald' ? ['ref', 'REFERANSE'] : ['dod', 'FELL']));

export function Turnering() {
  const [t, setT] = useState(undefined);
  const [open, setOpen] = useState(null);
  useEffect(() => { last('turnering').then(setT); }, []);
  if (t === undefined) return html`<div class="lastar mono">>>> LASTAR …</div>`;
  if (!t || !t.finst) return html`<${Fase} nr=4 namn="Eksamen" /><${Tom} tekst="ingen turnering køyrd enno" />`;
  const grupper = {};
  for (const r of t.rader || []) (grupper[r.eigedel] = grupper[r.eigedel] || []).push(r);
  const hist = t.historikk || [];
  return html`
    <${Fase} nr=4 namn="Eksamen · walk-forward" />
    <section class="kort"><h2>Turnering <small>${dato(t.ts)} · ${t.n_testa} kombinasjonar · ${t.n_fremja} fremja · ${t.n_observasjon} under observasjon</small></h2>
      <p class="stille">Kvar strategi vel parametrar på 2 år og blir målt på det neste halvåret, rullande. Tala er berre frå periodane strategien ikkje har sett (OOS), etter kostnad. Fremjing krev OOS Sharpe ≥ 1, ≥ 60 % positive foldar, p ≤ 0,05, drawdown ≤ 30 % og betre enn kjøp-og-hald. ${t.n_fremja === 0 ? 'Ingen har klart det enno. Det er eit resultat, ikkje ein feil.' : ''}</p>
    </section>
    ${Object.entries(grupper).map(([eigedel, rader]) => html`
      <section class="kort"><h2>${eigedel}</h2>
        <div class="scroll"><table><thead><tr><th>Strategi</th><th class="r">Sharpe</th><th class="r">CAGR</th><th class="r">Drawdown</th><th class="r">Foldar +</th><th class="r">p</th><th>Status</th></tr></thead><tbody>
          ${rader.map((r) => { const [kl, tekst] = STATUS(r); const id = `${eigedel}|${r.strategi}`; return html`
            <tr class="klikk ${kl}" onClick=${() => setOpen(open === id ? null : id)}>
              <td>${r.strategi}</td><td class="r">${fmt(r.sharpe, 2)}</td><td class="r">${pstRaa(r.cagr, 1)}</td>
              <td class="r">${pstRaa(r.maks_drawdown == null ? null : Math.abs(r.maks_drawdown), 0)}</td>
              <td class="r">${pstRaa(r.andel_positive, 0)}</td><td class="r">${r.p == null ? '–' : fmt(r.p, 3)}</td>
              <td class="status"><span class="merk ${kl === 'fremja' ? 'gron' : (kl === 'obs' ? 'gul' : (kl === 'dod' ? 'fare' : ''))}">${tekst}</span></td></tr>
            ${open === id ? html`<tr><td colspan="7" class="status">
              <b>Parametrar:</b> ${Object.keys(r.params || {}).length ? JSON.stringify(r.params) : 'ingen'}<br/>
              <b>Dom:</b> ${r.grunn || '–'}<br/>
              <span class="stille">kjelde: results/tournament.json</span></td></tr>` : null}`; })}
        </tbody></table></div>
      </section>`)}
    <section class="kort"><h2>Historikk <small>éi rad per turnering</small></h2>
      ${hist.length ? html`<div class="scroll"><table><thead><tr><th>Dato</th><th class="r">Testa</th><th class="r">Fremja</th><th class="r">Obs.</th><th>Beste</th></tr></thead><tbody>
        ${[...hist].reverse().map((h) => html`<tr><td>${h.dato}</td><td class="r">${h.n_testa}</td><td class="r">${h.n_fremja}</td><td class="r">${h.n_observasjon}</td><td class="status">${(h.topp || []).map((x) => `${x.eigedel}/${x.strategi} ${fmt(x.sharpe, 2)}`).join(' · ')}</td></tr>`)}
      </tbody></table></div>` : html`<${Tom} />`}
    </section>
    ${t.md ? html`<section class="kort"><details><summary>Heile turneringsrapporten (tournament.md)</summary><pre class="rapport">${t.md}</pre></details></section>` : null}`;
}
