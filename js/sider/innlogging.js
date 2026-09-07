import { useState } from 'preact/hooks';
import { html } from '../ui.js';

/* Passfrase-porten for den offentlege hostinga. Passfrasen blir berre brukt i nettlesaren
   (WebCrypto) og lagra lokalt på eininga. Ho går aldri til nokon tenar. */
export function Innlogging({ feil, onOk }) {
  const [p, setP] = useState('');
  return html`<div class="innlogg kort">
    <div class="fase">>>> SONDRES SCHEME // LÅST</div>
    <h2>Passfrase</h2>
    <p class="stille">Datafilene er krypterte. Skriv passfrasen du fekk på Telegram. Ho blir lagra på denne eininga og aldri send nokon stad.</p>
    <form onSubmit=${(e) => { e.preventDefault(); if (p.trim()) onOk(p.trim()); }}>
      <input type="password" autocomplete="current-password" placeholder="passfrase" value=${p} onInput=${(e) => setP(e.target.value)} onKeyDown=${(e) => { if (e.key === 'Enter' && p.trim()) { e.preventDefault(); onOk(p.trim()); } }} autofocus />
      ${feil ? html`<p class="feil">Feil passfrase. Prøv att.</p>` : null}
      <button class="knapp" type="submit">LÅS OPP</button>
    </form>
  </div>`;
}
