import { useEffect, useRef, useState } from 'preact/hooks';
import { html, Tom, Flis, fmt, pst, klokke, dato, alderTekst } from '../ui.js';
import { lastAlle } from '../data.js';

const VENTAR = {unknown_costs: 'handelskostnad er ukjend', new_bar: 'neste heile prisbar har ikkje kome', fresh_closed_data: 'treng ferske, avslutta prisdata'};
const LAERING_STATUS = {ventar_paa_framtidig_bar: 'ventar på neste prisbar', malt_framover: 'målt på seinare prisdata', ventar_paa_ferske_data: 'ventar på ferske data', 'ventar_paa_ny_bar/strategimote': 'ventar på ny prisbar / strategimøte'};

/* Hjernen: 3D-klasa av alt systemet består av, med ekte tankar bak kvar node. */
export function Hjernen({ tilstand }) {
  const [d, setD] = useState(undefined);
  const [vald, setVald] = useState(null);
  const [filter, setFilter] = useState(null);
  const [dag, setDag] = useState(null);          // null = i dag
  const [spel, setSpel] = useState(null);        // indeks i avspelinga, null = av
  const ref = useRef(null); const motor = useRef(null);

  useEffect(() => { lastAlle(['hjerne', 'tankar', 'hendingar', 'genom', 'learning', 'dialogue']).then(setD); }, []);

  useEffect(() => {
    if (!d || !d.hjerne || !ref.current) return;
    let avbrote = false;
    import('../brain3d.js').then(({ Hjerne3D }) => {
      if (avbrote) return;
      if (!motor.current) motor.current = new Hjerne3D(ref.current, { onVel: (n) => setVald(n) });
      const hend = hendingarFor(d, dag);
      const pulse = new Set();
      const liste = spel === null ? hend : hend.slice(0, spel + 1).slice(-1);
      for (const e of liste) { pulse.add(`agent:${e.agent}`); const dd = e.data || {}; if (dd.eigedel && dd.strategi) for (const n of d.hjerne.nodar) if (n.type === 'kandidat' && n.namn === `${dd.eigedel} · ${dd.strategi}`) pulse.add(n.id); if (dd.symbol) pulse.add(`instrument:${dd.symbol}`); }
      motor.current.sett(d.hjerne, { filter: filter ? new Set([filter]) : null, pulse, genom: (d.genom && d.genom.genom) || null });
      if (spel !== null && liste.length) motor.current.fokus(`agent:${liste[0].agent}`);
    }).catch((e) => console.error('3D feila', e));
    return () => { avbrote = true; };
  }, [d, filter, dag, spel]);
  useEffect(() => {
    if (spel === null || !d) return;
    const hend = hendingarFor(d, dag);
    if (spel >= hend.length - 1) return;
    const id = setTimeout(() => setSpel(spel + 1), 900);
    return () => clearTimeout(id);
  }, [spel, d, dag]);
  useEffect(() => () => { if (motor.current) { motor.current.destroy(); motor.current = null; } }, []);

  if (d === undefined) return html`<div class="lastar mono">>>> LASTAR HJERNEN …</div>`;
  if (!d || !d.hjerne) return html`<${Tom} tekst="hjerne.json manglar – køyr python -m scheme.main hjerne" />`;
  const h = d.hjerne; const tel = h.teljarar || {}; const tankar = (d.tankar && d.tankar.tankar) || [];
  const dagar = (d.hendingar && d.hendingar.dagar) || [];
  const hend = hendingarFor(d, dag);
  const noHend = spel !== null ? hend[Math.min(spel, hend.length - 1)] : null;
  const grense = Date.now() - 2 * 3600 * 1000;
  const aktive = new Set(tankar.filter((t) => new Date(t.ts).getTime() > grense).map((t) => t.agent)).size;
  const learning = (d.learning && d.learning.snapshot) || {};
  const dialogue = (d.dialogue && d.dialogue.snapshot) || {};
  const learnerRows = learning.rows || [];
  const decisions = learning.decisions || [];
  const threads = dialogue.threads || [];
  const plattformNamn = {'trading.com': 'Trading.com', polymarket: 'Polymarket', kalshi: 'Kalshi'};
  const plattformar = ((((tilstand || {}).handel || {}).plattformar) || []).map((k) => plattformNamn[k] || k);
  const nodeTankar = vald ? (vald.type === 'agent' ? tankar.filter((t) => `agent:${t.agent}` === vald.id) : []) : [];
  return html`
    <div class="fase">>>> HJERNEN // ${h.nodar.length} NODAR · ${h.kantar.length} KANTAR · ${h.regionar.length} REGIONAR${d.genom && d.genom.n_vist ? ` · ${fmt(d.genom.n_vist)} GENOM-PUNKT (AV ${fmt(d.genom.n_totalt)})` : ''}</div>
    <section class="kort"><h2>${plattformar.join(' · ') || 'Arbeidsområdet'} <small>${fmt((tilstand || {}).n_botter)} regelstyrte forskingsagentar</small></h2>
      <p class="stille">Agentane køyrer i periodiske skyvakter. Mellom vaktene er dei ikkje kontinuerleg aktive. Språkmodell er valfri; grafen viser lagra data og meldingar, ikkje eit målt nevralt nettverk.</p>
      <div class="tal"><${Flis} v=${tel.marknadsobservasjonar} l="marknader i siste uttrekk" /><${Flis} v=${learning.observations_total} l="signal målte mot seinare prisdata" /><${Flis} v=${learning.decisions_changed} l="dokumenterte parameterendringar" /><${Flis} v=${dialogue.n_messages} l="meldingar i siste samtalerunde" /></div>
      <p class="stille">Sist bygd ${dato(h.generert)}. ${((tilstand || {}).arbeidsrytme) || 'Neste køyring følgjer skyplanen.'}</p>
    </section>
    <div class="hjerne-ramme">
      <div ref=${ref} style="position:absolute;inset:0"></div>
      <div class="hjerne-hud">
        <div class="t"><b>${fmt(aktive)}</b>køyrt siste 2 t</div>
        <div class="t"><b>${fmt(tel.strategiar_genererte)}</b>strategiar</div>
        <div class="t"><b>${fmt(tel.overlevande)}</b>overlevande</div>
        <div class="t"><b>${fmt(tel.gravplass)}</b>gravplass</div>
        <div class="t"><b>${fmt(tel.generasjonar)}</b>generasjonar</div>
        <div class="t"><b>${fmt(tel.tankar_i_dag)}</b>innlegg i siste dagslogg</div>
        <div class="t"><b>${fmt(tel.forskingssaker)}</b>forsking/bøker</div>
      </div>
      <div class="hjerne-filter">
        <button class=${filter ? '' : 'aktiv'} style=${filter ? '' : 'background:var(--cyan)'} onClick=${() => setFilter(null)}>ALLE</button>
        ${h.regionar.map((r) => html`<button class=${filter === r.id ? 'aktiv' : ''} style=${filter === r.id ? `background:${r.farge}` : `border-color:${r.farge}55`} onClick=${() => setFilter(filter === r.id ? null : r.id)}>${r.namn.toUpperCase()}</button>`)}
      </div>
      ${vald ? html`<div class="panel">
        <button class="lukk" onClick=${() => setVald(null)}>×</button>
        <div class="type">${vald.type} · ${(h.regionar.find((r) => r.id === vald.region) || {}).namn || vald.region}</div>
        <h3>${vald.namn}</h3>
        <dl>${Object.entries(vald.data || {}).filter(([k, v]) => v !== null && v !== undefined && typeof v !== 'object').map(([k, v]) => html`<dt>${k}</dt><dd>${typeof v === 'number' ? fmt(v, Math.abs(v) < 10 ? 3 : 0) : String(v)}</dd>`)}</dl>
        ${vald.data && Array.isArray(vald.data.grunnar) && vald.data.grunnar.length ? html`<div class="type">dom</div><ul class="stille" style="margin:4px 0 8px;padding-left:16px">${vald.data.grunnar.map((g) => html`<li>${g}</li>`)}</ul>` : null}
        ${vald.data && vald.data.params && Object.keys(vald.data.params).length ? html`<div class="type">parametrar</div><div class="mono stille" style="margin:4px 0 8px">${JSON.stringify(vald.data.params)}</div>` : null}
        <div class="type">kjelder</div><div class="mono stille" style="margin:4px 0 8px;font-size:11px">${(vald.kjelder || []).join(' · ')}</div>
        ${vald.type === 'laerdom' ? html`<div class="type">lærdom · sett ${(vald.data || {}).n || 1} gonger</div>
          <div class="verdi">${String((vald.data || {}).verdi ?? '')}</div>
          <div class="stille">${(vald.data || {}).person || (vald.data || {}).agent} lærte dette${(vald.data || {}).kjelde ? ` frå ${(vald.data || {}).kjelde}` : ''}. Teljaren aukar når opplysninga blir lagra på nytt; det er ikkje bevis på betre resultat.</div>` : null}
        ${vald.type === 'agent' ? html`<div class="type">innlegg i siste dagslogg (${nodeTankar.length})</div>
          ${nodeTankar.length ? [...nodeTankar].reverse().slice(0, 30).map((t) => html`<div class="tanke"><div class="ts">${klokke(t.ts)}${t.hending ? html` · <span class="a">${t.hending}</span>` : null}</div><div><b>${t.inn}</b> — ${t.resonnement}</div><div class="stille">${t.avgjerd}</div></div>`) : html`<p class="stille">ingen innlegg i denne dagsloggen</p>`}` : null}
      </div>` : null}
    </div>
    <section class="kort" style="margin-top:10px"><h2>Læring frå nye prisdata <small>${dato(learning.generert)}</small></h2>
      <p class="stille">Eit signal blir låst før neste prisbar kjem. Modellen brukar neste opningspris som inngang og sluttprisen i same bar som utgang, med kostnader. Fleire observasjonar er grunnlag for samanlikning, ikkje ei lovnad om framtidig avkastning.</p>
      ${learnerRows.length ? html`<div class="scroll"><table><thead><tr><th>Agent / strategi</th><th>Før: sist målte innstilling</th><th class="r">Målingar</th><th class="r">Samla papiravkastning</th><th class="r">Snitt / nedre estimat</th><th>Neste innstilling / status</th></tr></thead><tbody>
        ${learnerRows.map((r) => html`<tr><td>${r.agent}<br /><small>${r.strategy} · ${typeof r.eigedel === 'object' ? (r.eigedel.namn || r.eigedel.symbol) : (r.eigedel || '')}</small></td><td class="mono">${JSON.stringify(r.params || {})}</td><td class="r">${fmt(r.n)}</td><td class="r">${r.net_return == null ? 'ikkje målt' : pst(r.net_return, 2)}</td><td class="r">${r.mean_return == null ? '–' : pst(r.mean_return, 3)} / ${r.lower_bound == null ? '–' : pst(r.lower_bound, 3)}</td><td class="status"><span class="mono">${JSON.stringify(r.next_params || {})}</span><br />${LAERING_STATUS[r.status] || r.status}${r.waiting_reason ? html`<br />${VENTAR[r.waiting_reason] || r.waiting_reason}` : null}</td></tr>`)}
      </tbody></table></div>` : html`<${Tom} tekst="Ingen framovertest er lagra enno. Ingen parameterforbetring er dokumentert." />`}
      <p class="stille">Det nedre estimatet er ei skildring av variasjonen i dei målte papirresultata; det er ingen garanti eller stadfesta statistisk fordel. Verkeleg kontoforteneste er ikkje målt her.</p>
      ${decisions.length ? html`<details style="margin-top:10px"><summary>Før → bevis → endring (${decisions.length})</summary><div class="logg">${decisions.slice(-40).reverse().map((r) => html`<div class="rad"><span class="ts">${dato(r.ts)}</span><span><b>${r.agent}</b> · før <span class="mono">${JSON.stringify(r.before_params || {})}</span> → ${fmt(r.evidence_n)} målingar: ${r.reason} → etter <span class="mono">${JSON.stringify(r.after_params || {})}</span></span></div>`)}</div></details>` : null}
    </section>
    <section class="kort"><h2>Faktiske meldingstrådar <small>${dato(dialogue.generert)}</small></h2>
      <p class="stille">Dette er meldingar som programrollene faktisk har skrive og svart på, med kjeldegrunnlag. Felles tema åleine er merkte «same_tema» i grafen og tel ikkje som samtalar.</p>
      ${threads.length ? threads.map((t) => html`<details style="margin-top:10px"><summary>${t.market_id || t.id} · ${typeof t.decision === 'string' ? t.decision : JSON.stringify(t.decision || {})}</summary><div class="logg">${(t.messages || []).map((m) => html`<div class="rad"><span class="ts">${klokke(m.ts)}</span><span><b>${m.fraa} → ${m.til}</b> · ${m.type || 'melding'}${m.reply_to ? ' · svar på ' + m.reply_to : ''}<br />${m.tekst}${m.evidence ? html`<details><summary>Kjeldegrunnlag</summary><pre style="white-space:pre-wrap">${JSON.stringify(m.evidence, null, 2)}</pre></details>` : null}</span></div>`)}</div></details>`) : html`<${Tom} tekst="Ingen dokumentert meldingstråd i siste køyring." />`}
    </section>
    <section class="kort" style="margin-top:10px"><h2>Tidslinje <small>${hend.length} læringshendingar ${dag || (d.hendingar && d.hendingar.dag) || 'utan kjend dato'} · spel av dagen</small></h2>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <select onChange=${(e) => { setDag(e.target.value || null); setSpel(null); }} style="background:var(--flate2);color:var(--tekst);border:1px solid var(--kant);border-radius:8px;padding:8px;font:12px var(--mono)">
          <option value="">siste lagra dag ${(d.hendingar && d.hendingar.dag) || ''}</option>${[...dagar].reverse().map((x) => html`<option value=${x} selected=${x === dag}>${x}</option>`)}
        </select>
        <button class="knapp" onClick=${() => setSpel(spel === null ? 0 : null)}>${spel === null ? '▶ SPEL AV' : '■ STOPP'}</button>
        ${spel !== null ? html`<input type="range" min="0" max=${Math.max(0, hend.length - 1)} value=${spel} onInput=${(e) => setSpel(Number(e.target.value))} style="flex:1;min-width:120px" />` : null}
      </div>
      ${noHend ? html`<div class="logg" style="margin-top:8px;max-height:none"><div class="rad"><span class="ts">${klokke(noHend.ts)}</span><span><span class="agent">${noHend.agent}</span> · <span class="hend">${noHend.hending}</span> · ${noHend.kva} — ${noHend.kvifor} · <i>${noHend.avgjerd}</i></span></div></div>` : null}
      ${hend.length && spel === null ? html`<div class="logg" style="margin-top:8px">${[...hend].reverse().slice(0, 10).map((e) => html`<div class="rad"><span class="ts">${klokke(e.ts)}</span><span><span class="agent">${e.agent}</span> · <span class="hend">${e.hending}</span> · ${e.kva}</span></div>`)}</div>` : (!hend.length ? html`<p class="stille" style="margin:8px 0 0">ingen læringshendingar denne dagen</p>` : null)}
    </section>
    <p class="stille" style="margin:10px 0 0">Dra for å snu, klyp for å zoome, trykk på eit punkt for å lese kva som ligg bak. Regionane: ${h.regionar.map((r) => `${r.namn} (${r.skildring})`).join(' · ')}. Bygd ${dato(h.generert)} (${alderTekst(h.generert)}).</p>
    <style>
      .hjerne-merkelappar{position:absolute;inset:0;pointer-events:none;overflow:hidden}
      .hjerne-lapp{position:absolute;left:0;top:0;transform:translate(-9999px,-9999px);border-left:2px solid;padding:2px 8px;font:600 10px/1.3 var(--mono);letter-spacing:.1em;text-shadow:0 0 8px #000;white-space:nowrap}
      .hjerne-lapp span{display:block;color:var(--tekst2);font-weight:400;letter-spacing:0;font-size:10px}
    </style>`;
}


function hendingarFor(d, dag) {
  const h = d.hendingar || {};
  if (!dag || dag === h.dag) return h.hendingar || [];
  return (h.per_dag && h.per_dag[dag]) || [];
}
