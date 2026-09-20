import { useEffect, useState } from 'preact/hooks';
import { html, Tom, Flis, fmt, dato, klokke, alderTekst, aktivitetslogg } from '../ui.js';
import { last } from '../data.js';

/* Selskapet: rolleagentane (leiarane) og tankane deira i dag. Tusenvis av genom er arbeidarane;
   dei kjem i fase 3 og blir talde her når dei finst. */
export function Selskapet({ tilstand }) {
  const [t, setT] = useState(undefined);
  const [sel, setSel] = useState(undefined);
  const [vald, setVald] = useState(null);
  useEffect(() => { last('tankar').then(setT); last('selskap').then(setSel); }, []);
  const agentar = (tilstand && tilstand.agentar) || [];
  const faste = agentar.filter((a) => !a.bot && !String(a.namn || '').startsWith('bot_'));
  const botter = agentar.filter((a) => a.bot || String(a.namn || '').startsWith('bot_'));
  const pn = (sel && sel.personnamn) || {}; const P = (a) => pn[a] || a;
  const kategoriNamn = {metatrader: 'Trading.com', polymarket: 'Polymarket', kalshi: 'Kalshi'};
  const fordeling = botter.reduce((tal, a) => { const k = a.kategori || 'ukjend'; tal[k] = (tal[k] || 0) + 1; return tal; }, {});
  const fordelingTekst = Object.entries(fordeling).map(([k, n]) => `${n} ${kategoriNamn[k] || k}`).join(' · ');
  const totalt = (tilstand && (tilstand.n_agentar ?? agentar.length)) || agentar.length;
  const botTabell = botter.length ? html`<div class="scroll"><table><thead><tr><th>Bot</th><th>Kategori</th><th>Eigedel</th><th>Strategi</th><th>Parametrar</th><th>Vakt</th></tr></thead><tbody>
    ${botter.map((a) => html`<tr><td class="mono">${P(a.namn)}</td><td>${kategoriNamn[a.kategori] || a.kategori || "-"}</td><td>${(a.eigedel || {}).namn || (a.eigedel || {}).symbol || '–'}</td><td>${a.strategy || '–'}</td><td class="mono">${a.params ? JSON.stringify(a.params) : '–'}</td><td>${a.tidsplan || '–'}</td></tr>`)}
  </tbody></table></div>` : html`<${Tom} tekst="ingen botter registrerte enno" />`;
  const tankar = (t && t.tankar) || [];
  const aktivitet = aktivitetslogg(tilstand, t);
  const loggdag = aktivitet.dag || 'ingen dagslogg';
  const per = {};
  for (const x of tankar) (per[x.agent] = per[x.agent] || []).push(x);
  const grense = Date.now() - 2 * 3600 * 1000;
  const vis = vald ? tankar.filter((x) => x.agent === vald) : tankar;
  const leiar = (sel && sel.leiar) || {}; const valg = (sel && sel.val) || {}; const sting = (sel && sel.storting) || {};
  const moete = (sel && sel.moete) || {}; const natt = (sel && sel.nattforslag) || {}; const minne = (sel && sel.minne) || {}; const post = (sel && sel.post) || [];
  const oppdrag = leiar.oppdrag || {}; const mandat = leiar.mandat || {};
  const ordre = (tilstand && tilstand.ordre) || leiar.ordre || {};
  // Heile dagen, ikkje berre dei 500 siste tankane (som alle kjem frå dei nyaste vaktene).
  const perAgent = (t && t.per_agent) || [];
  const samandrag = Object.fromEntries(perAgent.map((a) => [a.agent, a]));
  const register = new Set(agentar.map((a) => a.namn));
  const nPaaJobb = aktivitet.registrerte;
  const nTankar = (t && t.n_tankar_i_dag != null) ? t.n_tankar_i_dag : tankar.length;
  const vakt = t && t.siste_vakt;
  const vakttal = (felt) => vakt && Array.isArray(vakt[felt]) ? new Set(vakt[felt]).size : 0;
  const vaktNamn = { time: 'Skanning og strategi', natt: 'Nattforsking', kunnskap: 'Nyheiter og kunnskap', koeyr: 'Dagleg gjennomgang', kampanje: 'Strategiforsking' };
  const hinder = { no_assigned_market_data: 'Ingen marknadsdata tildelte', actions_budget: 'Gratisbudsjettet for skykøyring er nådd',
    missing_price_data: 'Manglar prisdata', strategy_error: 'Strategien kunne ikkje køyrast', no_closed_price_bars: 'Ingen ferdige prisperiodar å undersøkje',
    no_work_recorded: 'Ingen utført oppgåve registrert', agent_error: 'Agenten møtte ein feil', log_write_failed: 'Kunne ikkje lagre loggen' };
  return html`
    <div class="fase">>>> SELSKAPET // ${faste.length} FASTE + ${botter.length} BOTTER = ${totalt} · ${aktivitet.fullLogg ? '' : 'MINST '}${nPaaJobb} REGISTRERTE I LOGGEN ${loggdag}${aktivitet.dag ? ' UTC' : ''}${aktivitet.historiske ? ` + ${aktivitet.historiske} HISTORISKE` : ''} · ${nTankar} INNLEGG</div>
    <p class="stille" style="margin:-6px 0 10px">Oppdraga over er gjeldande oppsett. Aktiviteten nedanfor kjem frå den daterte dagsloggen; nye oppdrag betyr ikkje at agentane alt har køyrt dei. ${aktivitet.siste ? `Siste loggføring: ${dato(aktivitet.siste)} (${alderTekst(aktivitet.siste)}).` : 'Ingen loggføring er tilgjengeleg.'} Loggføring kan òg gjelde feil og venting.</p>
    <section class="kort"><h2>Siste dokumenterte vakt</h2>
      ${vakt ? html`
        <p>${vaktNamn[vakt.kommando] || vakt.kommando} · start ${dato(vakt.started_at)} · ${vakt.finished_at ? `slutt ${dato(vakt.finished_at)} (${alderTekst(vakt.finished_at)})` : 'køyringa er ikkje registrert ferdig'}</p>
        <div class="flis-rad">
          <${Flis} v=${vakttal('vellukka')} l="fullførte oppgåva" />
          <${Flis} v=${vakttal('blokkert')} l="hindra av manglande grunnlag" />
          <${Flis} v=${vakttal('feila')} l="feila" />
          <${Flis} v=${vakttal('ikkje_koeyrt')} l="planlagde, men ikkje køyrde" />
        </div>
        <p class="stille">${vakttal('forventa')} agentar var planlagde i denne vakta. ${vakttal('ikkje_planlagde')} registrerte agentar var utanfor planen for denne vakta. Fullført betyr at oppgåva køyrde utan registrert feil; det seier ikkje at strategien er lønsam.</p>
        ${(vakt.agentar || []).filter((a) => a.status === 'blocked' || a.status === 'failed').length ? html`<details><summary>Vis agentar som møtte hinder eller feil</summary><div class="logg">${(vakt.agentar || []).filter((a) => a.status === 'blocked' || a.status === 'failed').map((a) => html`<div class="rad"><span class="agent">${P(a.agent)}</span><span>${a.status === 'failed' ? 'Feil' : 'Hindra'}: ${hinder[a.reason] || 'Sjå loggen for årsaka'}</span></div>`)}</div></details>` : null}
        ${(vakt.stegfeil || []).length ? html`<p class="stille">${vakt.stegfeil.length} delar av køyringa møtte ein feil. Sjå driftsloggen for detaljar.</p>` : null}
      ` : html`<p class="stille">Ventar på første vakt med den nye aktivitetsrapporten. Dagsloggen nedanfor viser berre tidlegare loggføring.</p>`}
    </section>
    ${ordre.tittel ? html`<section class="kort" style="border-color:rgba(52,211,153,.45)">
      <h2>Ordren frå Sondre <small>kvar agent les denne fyrst, i kvar vakt · config.yaml</small></h2>
      <p style="font-size:17px;font-weight:600;color:var(--gron);margin:0 0 8px">${ordre.tittel}</p>
      <p style="white-space:pre-line;margin:0">${ordre.fraa_sondre}</p>
      ${ordre.slik_gjeld_det ? html`<details style="margin-top:10px"><summary>Slik gjeld det i praksis</summary>
        <p class="stille" style="white-space:pre-line">${ordre.slik_gjeld_det}</p></details>` : null}
      ${ordre.grensa_som_står ? html`<p class="stille" style="white-space:pre-line;margin-top:8px">${ordre['grensa_som_står']}</p>` : null}
    </section>` : null}
    ${perAgent.length ? html`<section class="kort"><h2>Kven skreiv i siste dagslogg <small>${loggdag} · heile den lagra dagen</small></h2>
      <div class="scroll"><table><thead><tr><th>Agent</th><th class="r">Tankar</th><th>Fyrst</th><th>Sist</th><th>Siste avgjerd</th></tr></thead><tbody>
        ${perAgent.map((r) => html`<tr><td>${P(r.agent)} <small class="stille">${r.agent}${register.has(r.agent) ? '' : ' · historisk, ikkje i dagens oppsett'}</small></td><td class="r">${fmt(r.n)}</td><td>${klokke(r.fyrste)}</td><td>${klokke(r.siste)}</td><td class="stille">${(r.sist_avgjerd || '').slice(0, 70)}</td></tr>`)}
      </tbody></table></div>
    </section>` : null}
    ${valg.ceo ? html`<section class="kort"><h2>Styringa <small>CEO + storting på ${(valg.storting || []).length} · ${valg.grunnlag}</small></h2>
      <div class="flis-rad">
        <${Flis} tekst=${P(valg.ceo)} l="CEO · ${(valg.stemmevekt || {})[valg.ceo] || 8} stemmer" kl="gron" />
        <${Flis} v=${(valg.storting || []).length} l="i stortinget · 1 stemme kvar" />
        <${Flis} v=${(valg.arbeidarar || []).length} l="arbeidarar" />
        <${Flis} v=${valg.fleirtal} l="stemmer trengst for fleirtal" />
      </div>
      <p class="stille">${(valg.nye || []).length ? `${(valg.nye || []).length} nye er arbeidarar til dei har bevist seg: ${(valg.nye || []).slice(0, 6).join(', ')}` : 'alle har bevist seg'}</p>
      <div class="scroll"><table><thead><tr><th>Plass</th><th>Agent</th><th>Rolle</th><th class="r">Avkastning</th><th class="r">Poeng</th><th class="r">Funn</th><th class="r">Løn</th></tr></thead><tbody>
        ${(valg.rangering || []).map((r) => html`<tr class=${r.agent === valg.ceo ? 'fremja' : ''}><td class="r">${r.plass}</td><td>${P(r.agent)} <small class="stille">${r.agent}</small></td><td><span class="merk ${(valg.roller || {})[r.agent] === 'ceo' ? 'gron' : ((valg.roller || {})[r.agent] === 'storting' ? 'ok' : '')}">${((valg.roller || {})[r.agent] || '').toUpperCase()}</span></td><td class="r ${r.pnl > 0 ? 'opp' : (r.pnl < 0 ? 'ned' : '')}">${r.pnl == null ? 'ikkje måleleg' : fmt(r.pnl, 2)}</td><td class="r">${fmt(r.poeng, 1)}</td><td class="r">${fmt(r.hendingar)}</td><td class="r">${fmt((valg.loen || {})[r.agent])}</td></tr>`)}
      </tbody></table></div>
    </section>` : null}
    ${(moete.innlegg || []).length ? html`<section class="kort"><h2>Nattmøtet <small>${dato(moete.ts)} · ${moete.n} innlegg · ${moete.eigedel || ''}</small></h2>
      <p class="stille">${moete.maal}</p>
      <div class="logg">${moete.innlegg.map((i) => html`<div class="rad"><span class="agent">${i.namn}</span><span>${i.seier}${i.kjelde ? html` <span class="stille">[${i.kjelde}]</span>` : null}</span></div>`)}</div>
      ${(natt.genom || []).length ? html`<p class="stille" style="margin-top:8px">Av dette bygde dei ${natt.n} nye strategiar på ${natt.eigedel}:</p>
        <div class="scroll"><table><thead><tr><th>Genom</th><th>Inngang</th><th>Utgang</th><th>Bygd på</th></tr></thead><tbody>
          ${natt.genom.slice(0, 8).map((g) => html`<tr><td class="mono">${g.id}</td><td>${g.inn[0].p}</td><td>${g.ut.type}${g.ut.dagsslutt ? ' + flat før natta' : ''}</td><td class="status">${g.kjelde.monster} t=${g.kjelde.t}, n=${fmt(g.kjelde.n)} · ${g.kjelde.maalt_av}</td></tr>`)}
        </tbody></table></div>` : null}
    </section>` : null}
    ${(sting.saker || []).length ? html`<section class="kort"><h2>Voteringar <small>CEO har ${(valg.stemmevekt || {})[valg.ceo] || 8} stemmer · fleirtal ${sting.fleirtal} av ${sting.stemmer_totalt}</small></h2>
      ${sting.saker.map((sak) => html`<div class="agent"><div class="n"><span>${sak.tekst}</span><small class="${sak.vedteke ? 'gron' : 'raud'}">${sak.vedteke ? 'VEDTEKE' : 'FALT'} ${sak.ja}–${sak.nei}</small></div><div class="j">${sak.grunn}</div>
        <div class="s">${(sak.stemmer || []).map((st) => `${P(st.agent)}${st.vekt > 1 ? ' ×' + st.vekt : ''}: ${st.ja ? 'ja' : 'nei'}`).join(' · ')}</div></div>`)}
    </section>` : null}
    <section class="kort"><h2>Sjefen <small>mandat: høgast mogleg dagleg avkastning · ${leiar.dag || 'ingen oppdrag enno'}</small></h2>
      ${mandat.ok === true ? html`<p class="stille">Systemet køyrer så aggressivt som ordren tillèt: gearing 20× på nivå 3, full Kelly, dagsstopp 15 %, kill-switch 50 %.</p>` : null}
      ${(mandat.avvik || []).length ? html`<div class="logg">${mandat.avvik.map((a) => html`<div class="rad"><span class="hend">TAMMARE ENN ORDREN</span><span>${a.innstilling}: står på ${a.no}, ordren seier ${a.venta}</span></div>`)}</div>` : null}
      ${Object.keys(oppdrag).length ? html`<div class="scroll"><table><thead><tr><th>Agent</th><th>Oppdrag i dag</th><th>Grunn</th><th class="r">Prioritet</th></tr></thead><tbody>
        ${Object.entries(oppdrag).sort((a, b) => (a[1].prioritet === 'høg' ? -1 : 1) - (b[1].prioritet === 'høg' ? -1 : 1)).map(([n, o]) => html`<tr><td>${P(n)} <small class="stille">${n}</small></td><td>${o.kva}</td><td class="status">${o.kvifor}</td><td class="r"><span class="merk ${o.prioritet === 'høg' ? 'gul' : ''}">${(o.prioritet || '').toUpperCase()}</span></td></tr>`)}
      </tbody></table></div>` : html`<${Tom} tekst="sjefen har ikkje fordelt oppdrag enno" />`}
    </section>
    ${post.length ? html`<section class="kort"><h2>Posten mellom agentane <small>${post.length} brev</small></h2>
      <div class="logg">${[...post].reverse().map((b) => html`<div class="rad"><span class="ts">${klokke(b.ts)}</span><span><span class="agent">${P(b.fraa)}</span> → <b>${P(b.til)}</b>: ${b.tekst}</span></div>`)}</div></section>` : null}
    ${botter.filter((a) => a.sektor_sjef).length ? html`<section class="kort"><h2>Sektorjefer</h2>
      <div class="scroll"><table><thead><tr><th>Sektor</th><th>Sjef</th><th>Bot</th></tr></thead><tbody>
        ${botter.filter((a) => a.sektor_sjef).map((a) => html`<tr><td>${kategoriNamn[a.kategori] || a.kategori || "-"}</td><td>${P(a.namn)}</td><td class="mono">${a.namn}</td></tr>`)}
      </tbody></table></div>
    </section>` : null}
    <section class="kort"><h2>Botflåten <small>${botter.length} botter · ${fordelingTekst}</small></h2>
      <p class="stille">Fordelinga kjem frå dei registrerte oppdraga. Tal agentar seier ikkje kor mange marknader som faktisk er undersøkte; sjå dekninga under Skann.</p>
      ${botTabell}
    </section>
    <section class="kort"><h2>Rolleagentane <small>trykk for å sjå tankane</small></h2>
      ${faste.length ? html`<div class="agentar">${faste.map((a) => { const mine = per[a.namn] || []; const s = samandrag[a.namn]; const sist = s ? s.siste : (mine.length ? mine[mine.length - 1].ts : null); const n = s ? s.n : mine.length; const aktiv = sist && new Date(sist).getTime() > grense && new Date(sist).getTime() <= Date.now(); return html`
        <div class="agent ${aktiv ? 'aktiv' : ''} ${vald === a.namn ? 'aktiv' : ''}" onClick=${() => setVald(vald === a.namn ? null : a.namn)} style="cursor:pointer">
          <div class="n"><span>${P(a.namn)} · ${a.tittel}</span><small>${a.region.toUpperCase()}</small></div>
          <div class="j">${a.jobb}</div>
          <div class="s">${a.tidsplan}${n ? '' : ' · ingen loggføring på denne datoen'}</div>
          <div class="s">${sist ? `${n} innlegg i loggen · sist ${alderTekst(sist)}` : 'ingen innlegg i denne dagsloggen'}</div>
          ${minne[a.namn] ? html`<div class="s">${fmt(minne[a.namn].koeyringar)} køyringar · ${Object.keys(minne[a.namn].laerdom || {}).length} lærdomar${minne[a.namn].oppdrag ? ` · oppdrag: ${minne[a.namn].oppdrag.kva}` : ''}</div>` : null}
          ${vald === a.namn && minne[a.namn] && Object.keys(minne[a.namn].laerdom || {}).length ? html`<div class="logg" style="margin-top:6px">${Object.entries(minne[a.namn].laerdom).map(([k, v]) => html`<div class="rad"><span class="ts">${v.n}×</span><span><b>${k}</b>: ${typeof v.verdi === 'object' ? JSON.stringify(v.verdi) : String(v.verdi)}</span></div>`)}</div>` : null}
          ${sist ? html`<div class="stolpe"><i style=${`width:${Math.min(100, n * 10)}%`}></i></div>` : null}
        </div>`; })}</div>` : html`<${Tom} tekst="ingen agentar registrerte" />`}
    </section>
    <section class="kort"><h2>Tankelogg ${vald ? html`<small>berre ${vald} · <a href="#" onClick=${(e) => { e.preventDefault(); setVald(null); }}>vis alle</a></small>` : html`<small>alle agentar, nyaste fyrst</small>`}</h2>
      ${vis.length ? html`<div class="logg" style="max-height:60vh">${[...vis].reverse().map((x) => html`
        <div class="rad"><span class="ts">${klokke(x.ts)}</span><span><span class="agent">${x.agent}</span> såg på <b>${x.inn}</b> · tenkte: ${x.resonnement} · <i>${x.avgjerd}</i>${x.hending ? html` · <span class="hend">${x.hending}</span>` : null}${x.filer && x.filer.length ? html` <span class="stille">[${x.filer.join(', ')}]</span>` : null}</span></div>`)}</div>`
        : html`<${Tom} tekst=${vald && samandrag[vald] ? 'Denne agenten har innlegg i dagsloggen, men dei er eldre enn dei 500 siste som er viste her.' : 'ingen innlegg i denne dagsloggen'} />`}
    </section>`;
}
