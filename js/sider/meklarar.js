import { useEffect, useState } from 'preact/hooks';
import { html, Fase, fmt, dato } from '../ui.js';
import { last } from '../data.js';

const INFO = {
  'trading.com': { namn: 'Trading.com', konto: 'https://www.trading.com', marknad: 'Instrument på Trading.com-kontoen', broker: 'metaapi' },
  polymarket: { namn: 'Polymarket', konto: 'https://polymarket.com', marknad: 'Prediksjonsmarknader og offentlege marknadsdata' },
  kalshi: { namn: 'Kalshi', konto: 'https://kalshi.com', marknad: 'Prediksjonsmarknader og samanlikning av kontraktar' },
};

const KONTOTEKST = {
  missing_credentials: 'Kontokoplinga manglar nødvendige innstillingar.',
  auth_failed: 'Plattforma godkjende ikkje kontokoplinga ved siste kontroll.',
  wallet_unverified: 'Innlogginga er godkjend, men koplinga til rett lommebok er ikkje stadfesta.',
  invalid_response: 'Svaret gav ingen gyldig, stadfesta kontantsaldo.',
  network_error: 'Kontrollen fekk ikkje svar frå plattforma.',
  disabled: 'Kontokoplinga er slått av.',
};

export function Meklarar({ tilstand }) {
  const [m, setM] = useState(undefined);
  useEffect(() => { last('meklarar').then(setM); }, []);
  if (m === undefined) return html`<div class="lastar mono">>>> LASTAR …</div>`;
  const handel = (m && m.handel) || (tilstand && tilstand.handel) || {};
  const plattformar = (handel.plattformar || []).filter((id) => INFO[id]);
  const status = Object.fromEntries(((m && m.meklarar) || []).map((r) => [r.namn, r]));
  const kontoar = (m && m.kontoar) || {};
  const modus = (m && m.modus) || 'PAPIR';
  return html`
    <${Fase} nr=8 namn="Plattformer og kontostatus" />
    <section class="kort"><h2>Handelsområde <small>${plattformar.map((id) => INFO[id].namn).join(' · ') || 'oppsett manglar'}</small></h2>
      <p class="stille">Papirboka brukar simulerte pengar. Marknadsskann er analyse. Berre ei stadfesta kontomåling nedanfor viser saldo hos ein meklar.</p>
      <p class="stille">Handelsinnstilling: ${modus}. Denne innstillinga er ikkje dokumentasjon på at ei kopling fungerer eller at ein ordre er utført.</p>
    </section>
    <section class="kort"><h2>Plattformene</h2>
      <div class="agentar">${plattformar.map((id) => {
        const i = INFO[id]; const r = status[i.broker]; const konto = kontoar[id];
        const kontoOk = konto && konto.status === 'connected' && Number.isFinite(konto.cash_balance);
        const ok = kontoOk || (r && r.ok);
        const kontoFeil = konto && !kontoOk && !['missing_credentials', 'disabled'].includes(konto.status);
        return html`<div class="agent ${ok ? 'aktiv' : ''}">
          <div class="n"><span><a href=${i.konto} target="_blank" rel="noopener">${i.namn}</a></span><small>${ok ? 'SIST LESEN' : (kontoFeil || (r && r.har_nokkel) ? 'KOPLINGSFEIL' : 'KONTO IKKJE STADFESTA')}</small></div>
          <div class="j">${i.marknad}</div>
          ${kontoOk ? html`<div class="s">Lesen kontantsaldo: ${fmt(konto.cash_balance, 2)} ${konto.currency || ''}</div><div class="s">Dette er kontantar. Verdien av opne posisjonar er ikkje med.</div>`
            : r && r.saldo && ok ? html`<div class="s">Lesen eigenkapital: ${fmt(r.saldo.eigenkapital, 2)} ${r.saldo.valuta || ''} · ${(r.posisjonar || []).length} posisjonar</div>` : html`<div class="s">Ingen stadfesta kontosaldo i dette uttrekket.</div>`}
          ${r ? html`<div class="s">Kopling konfigurert som ${r.demo === true ? 'demo' : (r.demo === false ? 'ekte' : 'ukjend kontotype')}; kontotypen må stadfestast hos plattforma.</div>` : null}
          ${r && r.feil ? html`<div class="s">${r.feil}</div>` : null}
          ${r && r.ts ? html`<div class="s">Sist kontrollert ${dato(r.ts)}</div>` : null}
          ${konto ? html`<div class="s">${kontoOk ? 'Kontokoplinga les berre saldo. Ho legg ikkje inn ordre eller uttak.' : (KONTOTEKST[konto.status] || 'Kontostatus er ikkje stadfesta.')}</div>
            <div class="s">${konto.checked_at ? `Sist kontrollert ${dato(konto.checked_at)}` : 'Tidspunkt for kontokontroll er ukjent.'}</div>` : null}
          ${!i.broker ? html`<div class="s">Offentleg skann gir ikkje tilgang til kontoen. Sjå <a href="#/skann">Skann</a> for faktisk dekning og <a href="#/arbitrase">Arbitrase</a> for samanlikningar.</div>` : null}
        </div>`;
      })}</div>
    </section>
    <section class="kort"><h2>Frå analyse til handel</h2>
      <p class="stille">Strategiar må gjennom prøving, papirhandel og godkjend demokopling. Ekte handel krev begge handelslåsane. Appen viser resultat og kan ikkje opne kontoar, leggje inn ordre eller ta ut pengar.</p>
    </section>`;
}
