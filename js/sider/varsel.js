import { useEffect, useState } from 'preact/hooks';
import { html, Flis, Tom, fmt, dato } from '../ui.js';
import { last } from '../data.js';

/* Varsel: siste morgonmelding, siste straks-køyring og loggen over kva som vart sendt (og kva som vart halde att).
   Alt kjem frå results/varsel/siste.json (eksportert til app/data/varsel.json). Ingen tal utan fil. */

const MARKORAR = { OPPSETT: 'ok', NIVÅ: 'gul', UTLIGGJAR: 'ok', STREKT: 'gul', 'HARD': 'fare', DAGLEG: 'fare', 'KILL-SWITCH': 'fare' };

function markor(tekst) {
  const ord = String(tekst || '').split(/[\s:]/)[0];
  return { ord, kl: MARKORAR[ord] || '' };
}

export function Varslar() {
  const [v, setV] = useState(undefined);
  useEffect(() => { last('varsel').then(setV); }, []);
  if (v === undefined) return html`<div class="lastar mono">>>> LASTAR …</div>`;
  if (!v || (!v.morgon && !v.straks)) return html`<div class="fase">>>> VAKT // VARSEL</div><${Tom} tekst="varselløypa har ikkje køyrt enno (05:00 UTC og kvar time 14:35-20:35 UTC)" />`;
  const m = v.morgon || null;
  const s = v.straks || null;
  const logg = v.logg || [];
  const sendte = logg.filter((r) => r.sendt);
  return html`
    <div class="fase">>>> VAKT // VARSEL · ${fmt(v.n_sendt_7d)} SENDT SISTE 7 DAGAR</div>
    <section class="kort"><h2>Rytme <small>ærleg: skya køyrer per time, ikkje per sekund</small></h2>
      <p style="margin:0;color:var(--tekst2)">${v.kadens || 'ingen data enno'}</p>
      <p class="stille" style="margin:8px 0 0">Kvart varsel ber tidspunktet for baren eller tanken det byggjer på. Same varsel blir ikkje sendt to gonger innanfor 24 timar. Over 6 varsel på éi køyring blir samla i éi melding.</p>
    </section>
    <section class="kort"><h2>Morgonmelding <small>${m ? `${dato(m.ts)} · ${m.sendt ? 'sendt på Telegram' : 'ikkje sendt (Telegram manglar eller alt sendt i dag)'}` : 'ingen data enno'}</small></h2>
      ${m ? html`<pre class="mono" style="margin:0;white-space:pre-wrap;font-size:12px;line-height:1.5;color:var(--tekst2)">${m.tekst}</pre>` : html`<${Tom} tekst="morgonmeldinga har ikkje køyrt enno (dagleg 05:00 UTC)" />`}
    </section>
    <section class="kort"><h2>Siste straks-køyring <small>${s ? dato(s.ts) : 'ingen data enno'}</small></h2>
      ${s ? html`<div class="tal">
        <${Flis} v=${s.n_bygde} l="varsel bygde" />
        <${Flis} v=${s.n_sendt} l="sendt" kl=${s.n_sendt > 0 ? 'cyan' : ''} />
        <${Flis} tekst=${s.bunta ? 'JA' : 'NEI'} l="samla i éi melding" />
        <${Flis} tekst=${s.feil ? 'FEIL' : 'OK'} l="køyring" kl=${s.feil ? 'raud' : 'gron'} />
      </div>${s.feil ? html`<p class="stille" style="margin:8px 0 0">${s.feil}</p>` : null}` : html`<${Tom} />`}
    </section>
    <section class="kort"><h2>Logg <small>${logg.length} rader · ${sendte.length} sendt · nyaste fyrst</small></h2>
      ${logg.length ? html`<div class="scroll"><table><thead><tr><th>Tid</th><th>Type</th><th>Varsel</th><th>Status</th></tr></thead><tbody>
        ${logg.map((r) => { const { ord, kl } = markor(r.tekst); return html`<tr class=${r.sendt ? '' : 'stille'}>
          <td class="mono">${dato(r.ts)}</td>
          <td><span class="merk ${kl}">${ord}</span></td>
          <td class="status">${r.tekst}</td>
          <td class="status">${r.sendt ? html`<span class="opp">sendt</span>` : html`<span class="stille">${r.grunn || 'halde att'}</span>`}</td>
        </tr>`; })}
      </tbody></table></div>` : html`<${Tom} tekst="ingen varsel bygde enno" />`}
    </section>`;
}
