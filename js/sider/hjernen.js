import { useEffect, useRef, useState } from 'preact/hooks';
import { html, Tom, fmt, klokke, dato, alderTekst } from '../ui.js';
import { lastAlle } from '../data.js';

/* Hjernen: 3D-klasa av alt systemet består av, med ekte tankar bak kvar node. */
export function Hjernen() {
  const [d, setD] = useState(undefined);
  const [vald, setVald] = useState(null);
  const [filter, setFilter] = useState(null);
  const [dag, setDag] = useState(null);          // null = i dag
  const [spel, setSpel] = useState(null);        // indeks i avspelinga, null = av
  const ref = useRef(null); const motor = useRef(null);

  useEffect(() => { lastAlle(['hjerne', 'tankar', 'hendingar', 'genom']).then(setD); }, []);

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
  const nodeTankar = vald ? (vald.type === 'agent' ? tankar.filter((t) => `agent:${t.agent}` === vald.id) : []) : [];
  return html`
    <div class="fase">>>> HJERNEN // ${h.nodar.length} NODAR · ${h.kantar.length} KANTAR · ${h.regionar.length} REGIONAR${d.genom && d.genom.n_vist ? ` · ${fmt(d.genom.n_vist)} GENOM-PUNKT (AV ${fmt(d.genom.n_totalt)})` : ''}</div>
    <div class="hjerne-ramme">
      <div ref=${ref} style="position:absolute;inset:0"></div>
      <div class="hjerne-hud">
        <div class="t"><b>${aktive ? `● LIVE ${aktive}` : '○ STILLE'}</b>agentar aktive no</div>
        <div class="t"><b>${fmt(tel.strategiar_genererte)}</b>strategiar</div>
        <div class="t"><b>${fmt(tel.overlevande)}</b>overlevande</div>
        <div class="t"><b>${fmt(tel.gravplass)}</b>gravplass</div>
        <div class="t"><b>${fmt(tel.generasjonar)}</b>generasjonar</div>
        <div class="t"><b>${fmt(tel.tankar_i_dag)}</b>tankar i dag</div>
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
          <div class="stille">${(vald.data || {}).person || (vald.data || {}).agent} lærte dette${(vald.data || {}).kjelde ? ` frå ${(vald.data || {}).kjelde}` : ''}. Nevronet veks kvar gong det same blir målt på nytt.</div>` : null}
        ${vald.type === 'agent' ? html`<div class="type">tankar i dag (${nodeTankar.length})</div>
          ${nodeTankar.length ? [...nodeTankar].reverse().slice(0, 30).map((t) => html`<div class="tanke"><div class="ts">${klokke(t.ts)}${t.hending ? html` · <span class="a">${t.hending}</span>` : null}</div><div><b>${t.inn}</b> — ${t.resonnement}</div><div class="stille">${t.avgjerd}</div></div>`) : html`<p class="stille">ingen tankar i dag enno</p>`}` : null}
      </div>` : null}
    </div>
    <section class="kort" style="margin-top:10px"><h2>Tidslinje <small>${hend.length} læringshendingar ${dag || 'i dag'} · spel av dagen</small></h2>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <select onChange=${(e) => { setDag(e.target.value || null); setSpel(null); }} style="background:var(--flate2);color:var(--tekst);border:1px solid var(--kant);border-radius:8px;padding:8px;font:12px var(--mono)">
          <option value="">i dag</option>${[...dagar].reverse().map((x) => html`<option value=${x} selected=${x === dag}>${x}</option>`)}
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
