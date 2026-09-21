/* Sondres scheme – appen. Hash-ruting, éin tilstand (data/tilstand.json), sider under js/sider/. */
import { render } from 'preact';
import { useEffect, useState, useRef } from 'preact/hooks';
import { html, Topp, Nav, SIDER } from './ui.js';
import { last, TrengPassfrase, FeilPassfrase, harPassfrase, setPassfrase, tøm } from './data.js';
import { Oversikt } from './sider/oversikt.js';
import { Hjernen } from './sider/hjernen.js';
import { Selskapet } from './sider/selskapet.js';
import { Provebane } from './sider/provebane.js';
import { Avl } from './sider/avl.js';
import { Eksamen } from './sider/eksamen.js';
import { Stresslab } from './sider/stresslab.js';
import { Skann } from './sider/skann.js';
import { Arbitrase } from './sider/arbitrase.js';
import { Nivaa } from './sider/nivaa.js';
import { Varslar as Varsel } from './sider/varsel.js';
import { Kunnskap } from './sider/kunnskap.js';
import { Meklarar } from './sider/meklarar.js';
import { Uttak } from './sider/uttak.js';
import { Rapportar } from './sider/rapportar.js';
import { Turnering } from './sider/turnering.js';
import { Papir } from './sider/papir.js';
import { Sanning } from './sider/sanning.js';
import { Innlogging } from './sider/innlogging.js';

const SIDEKOMP = { oversikt: Oversikt, skann: Skann, arbitrase: Arbitrase, nivaa: Nivaa, varsel: Varsel, hjernen: Hjernen, provebane: Provebane, avl: Avl, eksamen: Eksamen, stresslab: Stresslab, kunnskap: Kunnskap, meklarar: Meklarar, uttak: Uttak, rapportar: Rapportar, selskapet: Selskapet, turnering: Turnering, papir: Papir, sanning: Sanning };

function rute() {
  const h = (location.hash || '#/oversikt').replace(/^#\/?/, '');
  const [side, ...rest] = h.split('/');
  return { side: SIDEKOMP[side] ? side : 'oversikt', arg: rest.join('/') };
}

function App() {
  const [r, setR] = useState(rute());
  const [tilstand, setTilstand] = useState(undefined);
  const [laas, setLaas] = useState(null);   // 'treng' | 'feil' | null
  const [feil, setFeil] = useState(null);
  const sistGenerert = useRef(null);

  useEffect(() => { const f = () => setR(rute()); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);

  const hent = async () => {
    try {
      const t = await last('tilstand', { fersk: true });
      if (t && t.generert !== sistGenerert.current) {
        tøm();
        sistGenerert.current = t.generert;
      }
      setFeil(null);
      setTilstand(t);
      setLaas(null);
    } catch (e) {
      if (e instanceof TrengPassfrase) setLaas('treng');
      else if (e instanceof FeilPassfrase) { setLaas('feil'); }
      else setFeil(String(e));
      setTilstand(null);
    }
  };
  useEffect(() => { hent(); const id = setInterval(hent, 5 * 60 * 1000); return () => clearInterval(id); }, []);

  if (laas) {
    return html`<${Innlogging} feil=${laas === 'feil'} onOk=${(p) => { setPassfrase(p); setLaas(null); hent(); }} />`;
  }
  const Side = SIDEKOMP[r.side];
  const tittel = SIDER.find((s) => s.id === r.side)?.namn || '';
  return html`
    <${Nav} side=${r.side} />
    <main class="ramme">
      <${Topp} tilstand=${tilstand} tittel=${tittel} />
      ${tilstand && tilstand.arb && tilstand.arb.pause ? html`<div class="varsel">ARBITRASJEN STÅR PÅ PAUSE: ${tilstand.arb.pause.grunn}. Slå på att med brytaren når det er sjekka.</div>` : null}
      ${feil ? html`<div class="varsel">Kunne ikkje lese data: ${feil}</div>` : null}
      ${tilstand === undefined ? html`<div class="lastar mono">>>> LASTAR TILSTAND …</div>` : html`<${Side} key=${`${r.side}:${(tilstand || {}).generert || "tom"}`} tilstand=${tilstand} arg=${r.arg} />`}
      <footer>${tilstand ? `tilstand generert ${new Date(tilstand.generert).toLocaleString('nb-NO')} · alle tal frå motoren og kontoane · ingen lovnad om avkastning` : 'ingen tilstand enno'}
        ${harPassfrase() ? html` · <a href="#" onClick=${(e) => { e.preventDefault(); setPassfrase(null); location.reload(); }}>lås</a>` : null}</footer>
    </main>`;
}

const rot = document.getElementById('app');
rot.replaceChildren();   // fjern lastelinja frå index.html før appen tek over
render(html`<${App} />`, rot);
