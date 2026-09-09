/* Sondres scheme – appen. Hash-ruting, éin tilstand (data/tilstand.json), sider under js/sider/. */
import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { html, Topp, Nav, SIDER } from './ui.js';
import { last, TrengPassfrase, FeilPassfrase, harPassfrase, setPassfrase } from './data.js';
import { Oversikt } from './sider/oversikt.js';
import { Hjernen } from './sider/hjernen.js';
import { Selskapet } from './sider/selskapet.js';
import { Provebane } from './sider/provebane.js';
import { Avl } from './sider/avl.js';
import { Eksamen } from './sider/eksamen.js';
import { Stresslab } from './sider/stresslab.js';
import { Skann } from './sider/skann.js';
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

const SIDEKOMP = { oversikt: Oversikt, skann: Skann, nivaa: Nivaa, varsel: Varsel, hjernen: Hjernen, provebane: Provebane, avl: Avl, eksamen: Eksamen, stresslab: Stresslab, kunnskap: Kunnskap, meklarar: Meklarar, uttak: Uttak, rapportar: Rapportar, selskapet: Selskapet, turnering: Turnering, papir: Papir, sanning: Sanning };

function rute() {
  const h = (location.hash || '#/oversikt').replace(/^#\/?/, '');
  const [side, ...rest] = h.split('/');
  return { side: SIDEKOMP[side] ? side : 'oversikt', arg: rest.join('/') };
}

function aktiveAgentar(tankar) {
  // Kor mange av agentane som har jobba i DAG. Bruk per_agent, som tel heile dagen. Fell tilbake på
  // tankelista berre om eksporten er gammal - den er avkorta til dei 500 siste og undertel difor grovt
  // (viste 11 av 36 medan 35 hadde jobba; funnen 9. sep 2026).
  if (!tankar) return 0;
  if (tankar.n_agentar_i_dag != null) return tankar.n_agentar_i_dag;
  if (!tankar.tankar) return 0;
  return new Set(tankar.tankar.map((t) => t.agent)).size;
}

function App() {
  const [r, setR] = useState(rute());
  const [tilstand, setTilstand] = useState(undefined);
  const [tankar, setTankar] = useState(null);
  const [laas, setLaas] = useState(null);   // 'treng' | 'feil' | null
  const [feil, setFeil] = useState(null);

  useEffect(() => { const f = () => setR(rute()); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);

  const hent = async () => {
    try {
      const t = await last('tilstand', { fersk: true });
      setTilstand(t);
      setLaas(null);
      setTankar(await last('tankar', { fersk: true }));
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
      <${Topp} tilstand=${tilstand} tittel=${tittel} aktive=${aktiveAgentar(tankar)} totalt=${((tilstand || {}).agentar || []).length} />
      ${tilstand && tilstand.kill_switch ? html`<div class="varsel">KILL-SWITCH UTLØYST: alt er flata. Må nullstillast manuelt i state.json.</div>` : null}
      ${tilstand && tilstand.modus === 'EKTE' ? html`<div class="varsel">EKTE PENGAR. Begge låsane er opne.</div>` : null}
      ${feil ? html`<div class="varsel">Kunne ikkje lese data: ${feil}</div>` : null}
      ${tilstand === undefined ? html`<div class="lastar mono">>>> LASTAR TILSTAND …</div>` : html`<${Side} tilstand=${tilstand} arg=${r.arg} />`}
      <footer>${tilstand ? `tilstand generert ${new Date(tilstand.generert).toLocaleString('nb-NO')} · alle tal frå filer i repoet · ingen lovnad om avkastning` : 'ingen tilstand enno'}
        ${harPassfrase() ? html` · <a href="#" onClick=${(e) => { e.preventDefault(); setPassfrase(null); location.reload(); }}>lås</a>` : null}</footer>
    </main>`;
}

const rot = document.getElementById('app');
rot.replaceChildren();   // fjern lastelinja frå index.html før appen tek over
render(html`<${App} />`, rot);
