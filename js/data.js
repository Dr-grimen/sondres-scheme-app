/* Datalag. Appen les berre JSON som pipelinen skreiv til data/.
   To variantar: rein JSON (privat hosting) eller AES-GCM-kryptert (.json.enc) på offentleg
   GitHub Pages, låst opp med ein passfrase som ligg i nettlesaren etter fyrste gong. */

const cache = new Map();
const NØKKEL_LAGER = 'scheme_passfrase';
let passfrase = null;
try { passfrase = localStorage.getItem(NØKKEL_LAGER); } catch (e) { passfrase = null; }

export class TrengPassfrase extends Error { constructor(m) { super(m || 'treng passfrase'); this.name = 'TrengPassfrase'; } }
export class FeilPassfrase extends Error { constructor() { super('feil passfrase'); this.name = 'FeilPassfrase'; } }

export function harPassfrase() { return !!passfrase; }
export function setPassfrase(p) { passfrase = p || null; try { if (p) localStorage.setItem(NØKKEL_LAGER, p); else localStorage.removeItem(NØKKEL_LAGER); } catch (e) { /* privat modus */ } cache.clear(); }

const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function nøkkel(pass, salt, iter) {
  const enc = new TextEncoder();
  const km = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, km,
    { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
}

const nøkkelCache = new Map();
async function dekrypter(env, pass) {
  const id = `${env.salt}|${env.iter}`;
  let k = nøkkelCache.get(id);
  if (!k) { k = await nøkkel(pass, b64(env.salt), env.iter || 600000); nøkkelCache.set(id, k); }
  let klar;
  try { klar = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(env.iv) }, k, b64(env.ct)); }
  catch (e) { throw new FeilPassfrase(); }
  if (env.gz) {   // pakka med gzip før kryptering (store filer som genom.json)
    const ds = new DecompressionStream('gzip');
    const strøm = new Blob([klar]).stream().pipeThrough(ds);
    klar = await new Response(strøm).arrayBuffer();
  }
  return JSON.parse(new TextDecoder().decode(klar));
}

/* Hent data/<namn>.json. Finst ho ikkje, prøv .json.enc. Manglar begge: null (= «ingen data enno»). */
export async function last(namn, { fersk = false } = {}) {
  if (!fersk && cache.has(namn)) return cache.get(namn);
  let data = null;
  let r = null;
  try { r = await fetch(`data/${namn}.json`, { cache: 'no-store' }); } catch (e) { r = null; }
  if (r && r.ok) {
    const tekst = await r.text();
    try { data = JSON.parse(tekst); } catch (e) { data = null; }   // GitHub Pages gir HTML-404 med 200 på nokre stiar
  }
  if (data === null) {
    let e = null;
    try { e = await fetch(`data/${namn}.json.enc`, { cache: 'no-store' }); } catch (err) { e = null; }
    if (e && e.ok) {
      let env = null;
      try { env = await e.json(); } catch (err) { env = null; }
      if (env && env.ct) {
        if (!passfrase) throw new TrengPassfrase();
        data = await dekrypter(env, passfrase);
      }
    }
  }
  cache.set(namn, data);
  return data;
}

export async function lastAlle(namn) {
  const ut = {};
  await Promise.all(namn.map(async (n) => { ut[n] = await last(n); }));
  return ut;
}

export function tøm() { cache.clear(); }
