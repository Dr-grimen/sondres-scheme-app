/* Hjernen i 3D. Kvar node er eit lysande punkt, kvar kant ei tynn line, kvar region ei klase
   med eige lys (referanse B). Alt kjem frå brain.json; ingenting er teikna utan ei node bak. */
import * as THREE from 'three';
import { OrbitControls } from 'three/OrbitControls';

const REGION_POS = {};  // fyllast ved fyrste sett()

function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rnd(seed) { let x = seed || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return (x % 100000) / 100000; }; }

const VERT = `
  attribute float size; attribute vec3 farge; varying vec3 vFarge; uniform float pr;
  void main(){ vFarge = farge; vec4 mv = modelViewMatrix * vec4(position,1.0);
    gl_PointSize = size * pr * (260.0 / -mv.z); gl_Position = projectionMatrix * mv; }`;
const FRAG = `
  varying vec3 vFarge;
  void main(){ float d = length(gl_PointCoord - vec2(0.5)); if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.05, d); float kjerne = smoothstep(0.22, 0.0, d);
    gl_FragColor = vec4(vFarge + kjerne * 0.6, a * 0.95); }`;

export class Hjerne3D {
  constructor(el, { onVel } = {}) {
    this.el = el; this.onVel = onVel; this.noder = []; this.pulse = new Set(); this.t0 = performance.now();
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x000000, 1);
    el.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x000000, 0.0045);
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 2000);
    this.camera.position.set(0, 34, 118);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; this.controls.dampingFactor = 0.08; this.controls.autoRotate = true; this.controls.autoRotateSpeed = 0.35;
    this.controls.minDistance = 20; this.controls.maxDistance = 320;
    this.ray = new THREE.Raycaster(); this.ray.params.Points = { threshold: 1.8 };
    this.merkelapp = document.createElement('div'); this.merkelapp.className = 'hjerne-merkelappar'; el.appendChild(this.merkelapp);
    this.labels = [];
    this._resize = () => this.resize(); addEventListener('resize', this._resize);
    this.ro = new ResizeObserver(this._resize); this.ro.observe(el);
    this._ned = null;
    el.addEventListener('pointerdown', (e) => { this._ned = [e.clientX, e.clientY]; });
    el.addEventListener('pointerup', (e) => { if (this._ned && Math.hypot(e.clientX - this._ned[0], e.clientY - this._ned[1]) < 6) this.klikk(e); this._ned = null; });
    this.resize(); this.loop = this.loop.bind(this); this.kjør = true; requestAnimationFrame(this.loop);
  }

  resize() {
    const w = this.el.clientWidth || 300, h = this.el.clientHeight || 300;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    if (this.mat) this.mat.uniforms.pr.value = this.renderer.getPixelRatio();
  }

  /* hjerne = brain.json; filter = Set av region-id eller null; pulse = Set av node-id som skal pulsere */
  sett(hjerne, { filter = null, pulse = new Set(), genom = null } = {}) {
    this.rydd();
    this.pulse = pulse;
    const regionar = hjerne.regionar || [];
    regionar.forEach((r, i) => { const a = (i / regionar.length) * Math.PI * 2; REGION_POS[r.id] = { x: Math.cos(a) * 44, y: Math.sin(a * 2) * 8, z: Math.sin(a) * 44, farge: new THREE.Color(r.farge || '#22d3ee'), namn: r.namn, n: 0 }; });
    const nodar = (hjerne.nodar || []).filter((n) => !filter || filter.has(n.region));
    const idx = new Map(); const pos = new Float32Array(nodar.length * 3); const farge = new Float32Array(nodar.length * 3); const size = new Float32Array(nodar.length);
    this.noder = nodar; this.grunnstorleik = size;
    nodar.forEach((n, i) => {
      const rp = REGION_POS[n.region] || { x: 0, y: 0, z: 0, farge: new THREE.Color('#888') }; rp.n = (rp.n || 0) + 1;
      const r = rnd(hash(n.id)); const rad = n.type === 'agent' ? 5 : (n.type === 'kandidat' ? 15 : 11);
      const th = r() * Math.PI * 2, ph = Math.acos(2 * r() - 1), rr = rad * Math.cbrt(r());
      pos[i * 3] = rp.x + rr * Math.sin(ph) * Math.cos(th); pos[i * 3 + 1] = rp.y + rr * Math.cos(ph) * 0.6; pos[i * 3 + 2] = rp.z + rr * Math.sin(ph) * Math.sin(th);
      let c = rp.farge.clone(); let s = 1.6;
      const st = (n.data || {}).status;
      if (n.type === 'agent') { c = new THREE.Color('#ffffff').lerp(rp.farge, 0.4); s = 3.2; }
      else if (n.type === 'kandidat') { if (st === 'fremja') { c = new THREE.Color('#34d399'); s = 2.4; } else if (st === 'observasjon') { c = new THREE.Color('#f5b731'); s = 2.0; } else if (st === 'død') { c = new THREE.Color('#5a1e26'); s = 1.0; } else { c = new THREE.Color('#4b5563'); s = 1.1; } }
      else if (n.type === 'instrument' || n.type === 'kjelde' || n.type === 'modell' || n.type === 'bok') s = 2.6;
      else if (n.type === 'meklar') { s = 2.2; if (!(n.data || {}).har_nokkel) c = c.clone().multiplyScalar(0.45); }
      // Lærdom er eit nevron: jo fleire gonger agenten har sett det same, jo større og lysare.
      else if (n.type === 'laerdom') { const g = Math.min(6, (n.data || {}).n || 1); c = new THREE.Color('#e879f9').lerp(new THREE.Color('#ffffff'), 0.12 * g); s = 1.4 + 0.35 * g; }
      farge[i * 3] = c.r; farge[i * 3 + 1] = c.g; farge[i * 3 + 2] = c.b; size[i] = s; idx.set(n.id, i);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('farge', new THREE.BufferAttribute(farge, 3)); g.setAttribute('size', new THREE.BufferAttribute(size.slice(), 1));
    this.mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { pr: { value: this.renderer.getPixelRatio() } } });
    this.punkt = new THREE.Points(g, this.mat); this.scene.add(this.punkt);
    // kantar
    const kantar = (hjerne.kantar || []).filter((k) => idx.has(k.fra) && idx.has(k.til));
    const lp = new Float32Array(kantar.length * 6); const lc = new Float32Array(kantar.length * 6);
    kantar.forEach((k, i) => {
      const a = idx.get(k.fra), b = idx.get(k.til);
      lp.set([pos[a * 3], pos[a * 3 + 1], pos[a * 3 + 2], pos[b * 3], pos[b * 3 + 1], pos[b * 3 + 2]], i * 6);
      const styrke = 0.18 + 0.5 * Math.min(1, k.vekt || 0.3);
      const c = (k.type === 'laert' || k.type === 'laering') ? new THREE.Color('#e879f9') : (k.type === 'samtale' ? new THREE.Color('#a78bfa') : (k.type === 'avgjerd' ? new THREE.Color('#f43f5e') : (k.type === 'dom' ? new THREE.Color('#34d399') : new THREE.Color('#22d3ee'))));
      lc.set([c.r * styrke, c.g * styrke, c.b * styrke, farge[b * 3] * styrke, farge[b * 3 + 1] * styrke, farge[b * 3 + 2] * styrke], i * 6);
    });
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(lp, 3)); lg.setAttribute('color', new THREE.BufferAttribute(lc, 3));
    this.liner = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.scene.add(this.liner);
    // regionmerkelappar
    this.merkelapp.innerHTML = '';
    this.labels = regionar.filter((r) => !filter || filter.has(r.id)).map((r) => {
      const d = document.createElement('div'); d.className = 'hjerne-lapp'; d.style.borderColor = r.farge; d.style.color = r.farge;
      d.innerHTML = `<b>${r.namn.toUpperCase()}</b><span>${REGION_POS[r.id].n} nodar · ${r.skildring}</span>`; this.merkelapp.appendChild(d);
      return { el: d, p: REGION_POS[r.id] };
    });
    this.idx = idx;
    // Genom-skya: tusenvis av avla strategiar som små punkt rundt Verkstad. Døde er mørke, overlevande gløder.
    if (genom && genom.length && (!filter || filter.has('verkstad'))) {
      const rp = REGION_POS['verkstad'] || { x: 0, y: 0, z: 0 };
      const n = genom.length; const gp = new Float32Array(n * 3); const gc = new Float32Array(n * 3); const gs = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const g = genom[i]; const r = rnd(hash('g' + i + ':' + (g[0] ?? 0)));
        const th = r() * Math.PI * 2, ph = Math.acos(2 * r() - 1), rr = 22 * Math.cbrt(r());
        const fit = g[2] == null ? -3 : g[2] / 100;
        gp[i * 3] = rp.x + rr * Math.sin(ph) * Math.cos(th); gp[i * 3 + 1] = rp.y - 6 + Math.max(-1, Math.min(1.6, fit)) * 9 + (r() - 0.5) * 3; gp[i * 3 + 2] = rp.z + rr * Math.sin(ph) * Math.sin(th);
        const ov = g[3] === 1;
        gc[i * 3] = ov ? 0.13 : 0.35; gc[i * 3 + 1] = ov ? 0.83 : 0.16; gc[i * 3 + 2] = ov ? 0.93 : 0.12; gs[i] = ov ? 1.6 : 0.55;
      }
      const gg = new THREE.BufferGeometry();
      gg.setAttribute('position', new THREE.BufferAttribute(gp, 3)); gg.setAttribute('farge', new THREE.BufferAttribute(gc, 3)); gg.setAttribute('size', new THREE.BufferAttribute(gs, 1));
      this.genomSky = new THREE.Points(gg, this.mat); this.scene.add(this.genomSky);
    }
  }

  rydd() {
    for (const o of [this.punkt, this.liner]) { if (o) { this.scene.remove(o); o.geometry.dispose(); o.material.dispose(); } }
    if (this.genomSky) { this.scene.remove(this.genomSky); this.genomSky.geometry.dispose(); this.genomSky = null; }
    this.punkt = this.liner = null; for (const k in REGION_POS) REGION_POS[k].n = 0;
  }

  klikk(e) {
    if (!this.punkt) return;
    const r = this.renderer.domElement.getBoundingClientRect();
    const m = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(m, this.camera);
    const treff = this.ray.intersectObject(this.punkt);
    if (treff.length && this.onVel) { treff.sort((a, b) => a.distanceToRay - b.distanceToRay); this.onVel(this.noder[treff[0].index]); this.controls.autoRotate = false; }
  }

  fokus(id) {
    if (!this.idx || !this.idx.has(id)) return;
    const i = this.idx.get(id); const p = this.punkt.geometry.attributes.position;
    this.controls.target.set(p.getX(i), p.getY(i), p.getZ(i));
  }

  loop() {
    if (!this.kjør) return;
    requestAnimationFrame(this.loop);
    this.controls.update();
    if (this.punkt && this.pulse.size) {
      const t = (performance.now() - this.t0) / 1000; const a = this.punkt.geometry.attributes.size;
      this.noder.forEach((n, i) => { if (this.pulse.has(n.id)) a.setX(i, this.grunnstorleik[i] * (1.6 + 0.9 * Math.sin(t * 3 + i))); });
      a.needsUpdate = true;
    }
    for (const l of this.labels) {
      const v = new THREE.Vector3(l.p.x, l.p.y + 16, l.p.z).project(this.camera);
      const r = this.renderer.domElement; const x = (v.x + 1) / 2 * r.clientWidth, y = (1 - v.y) / 2 * r.clientHeight;
      l.el.style.transform = `translate(${x}px, ${y}px)`; l.el.style.opacity = v.z < 1 ? String(Math.max(0.25, 1 - (v.z - 0.8) * 4)) : '0';
    }
    this.renderer.render(this.scene, this.camera);
  }

  destroy() { this.kjør = false; this.rydd(); this.ro.disconnect(); removeEventListener('resize', this._resize); this.controls.dispose(); this.renderer.dispose(); this.el.innerHTML = ''; }
}
