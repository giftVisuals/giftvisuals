// Gift Visuals · Chapter 1 prototype. Real Challenge, Ibadan streets (OpenStreetMap) in three.js.
import * as THREE from 'three';
import { GLTFLoader } from './jsm/loaders/GLTFLoader.js';
import { RGBELoader } from './jsm/loaders/RGBELoader.js';
import * as SkeletonUtils from './jsm/utils/SkeletonUtils.js';
import { buildHouses } from './houses.js';
import { makeInteriors } from './interior.js';
import { buildStreetLife } from './streetlife.js';
import { EffectComposer } from './jsm/postprocessing/EffectComposer.js';
import { RenderPass } from './jsm/postprocessing/RenderPass.js';
import { ShaderPass } from './jsm/postprocessing/ShaderPass.js';
import { OutputPass } from './jsm/postprocessing/OutputPass.js';

const $ = (id) => document.getElementById(id);
const isTouch = matchMedia('(pointer:coarse)').matches;
window.__step('Loading map 1/6…');
const W = await (await fetch('world.json')).json();

// ---------------------------------------------------------------- renderer, scene, light
const renderer = new THREE.WebGLRenderer({ canvas: $('c'), antialias: !isTouch, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const HAZE = new THREE.Color(0xd8cdbb);           // harmattan haze
scene.background = HAZE.clone();
scene.fog = new THREE.Fog(0xd9d6cc, 40, 380);
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.3, 1200);

const pmrem = new THREE.PMREMGenerator(renderer);
window.__step('Loading sky 2/6…');
const skyHdr = await new RGBELoader().loadAsync('tex/sky_1k.hdr');
skyHdr.mapping = THREE.EquirectangularReflectionMapping;
scene.environment = pmrem.fromEquirectangular(skyHdr).texture;
scene.background = skyHdr; scene.backgroundIntensity = 1.05; scene.backgroundBlurriness = .35;
scene.environmentIntensity = .75;
const hemi = new THREE.HemisphereLight(0xfff4e0, 0x6b5a48, .35); scene.add(hemi);
const camRay = new THREE.Raycaster();
const sun = new THREE.DirectionalLight(0xffe2b8, 2.1);
sun.castShadow = true;
sun.shadow.mapSize.set(isTouch ? 1024 : 2048, isTouch ? 1024 : 2048);
const SC = 60;
Object.assign(sun.shadow.camera, { left: -SC, right: SC, top: SC, bottom: -SC, near: 1, far: 260 });
sun.shadow.bias = -0.0006;
scene.add(sun, sun.target);

// ---------------------------------------------------------------- textures
function canvasTex(w, h, draw, rep = 1) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; t.repeat.set(rep, rep);
  return t;
}
const rnd = (a, b) => a + Math.random() * (b - a);
const TL = new THREE.TextureLoader();
function ptex(name, rep = 1) {
  const load = (k, srgb) => { const t = TL.load(`tex/${name}_${k}.jpg`); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  return { map: load('diff', true), normalMap: load('nor'), roughnessMap: load('rough') };
}
const loadImg = (src) => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; });
const plasterImg = await loadImg('tex/wall_diff.jpg');
const groundTex = canvasTex(512, 512, (g, w, h) => {      // dusty laterite ground
  g.fillStyle = '#9a7f62'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) { const v = rnd(-28, 28); g.fillStyle = `rgba(${130 + v},${102 + v},${76 + v},${rnd(.15, .5)})`; g.fillRect(rnd(0, w), rnd(0, h), rnd(1, 4), rnd(1, 4)); }
}, 120);
const asphaltTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#4a4a4c'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 5000; i++) { const v = rnd(-18, 18); g.fillStyle = `rgba(${74 + v},${74 + v},${76 + v},.6)`; g.fillRect(rnd(0, w), rnd(0, h), 2, 2); }
});
const wallTex = canvasTex(512, 512, (g, w, h) => {        // one storey, two windows; tinted per building
  g.drawImage(plasterImg, 0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(60,40,20,.22)'; g.fillRect(0, h - 44, w, 44);                     // grime band
  for (const x of [76, 300]) {
    g.fillStyle = '#2f3438'; g.fillRect(x, 140, 136, 184);
    g.strokeStyle = '#6d6250'; g.lineWidth = 12; g.strokeRect(x, 140, 136, 184);
    g.fillStyle = 'rgba(160,190,210,.3)'; g.fillRect(x + 16, 156, 48, 152);
    g.strokeStyle = '#4a4034'; g.lineWidth = 6; for (let k = 1; k < 5; k++) { g.beginPath(); g.moveTo(x, 140 + k * 36); g.lineTo(x + 136, 140 + k * 36); g.stroke(); }
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x - 6, 330, 148, 14);
    g.strokeStyle = '#1e1e1e'; g.lineWidth = 5; for (let k = 0; k <= 8; k++) { g.beginPath(); g.moveTo(x + k * 17, 140); g.lineTo(x + k * 17, 324); g.stroke(); }
    for (const yy of [190, 270]) { g.beginPath(); g.moveTo(x, yy); g.lineTo(x + 136, yy); g.stroke(); }
  }
});
const roofTex = canvasTex(128, 128, (g, w, h) => {        // rusted corrugated iron (Ibadan brown roofs)
  for (let x = 0; x < w; x += 8) { g.fillStyle = x % 16 ? '#8a4f2c' : '#7a4426'; g.fillRect(x, 0, 8, h); }
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${rnd(60, 120)},${rnd(30, 60)},${rnd(10, 30)},${rnd(.2, .6)})`; g.fillRect(rnd(0, w), rnd(0, h), rnd(2, 10), rnd(2, 10)); }
});

// ---------------------------------------------------------------- ground and roads
const ground = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), new THREE.MeshStandardMaterial({ ...ptex('soil', 300), color: 0x938a7c }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

function ribbon(pts, width, y) {
  const pos = [], uv = [], idx = []; let dist = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dz = b[1] - a[1]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    const nx = -dz * width / 2, nz = dx * width / 2;
    if (i) dist += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
    pos.push(p[0] + nx, y, p[1] + nz, p[0] - nx, y, p[1] - nz); uv.push(0, dist / width, 1, dist / width);
    if (i) { const k = i * 2; idx.push(k - 2, k - 1, k, k - 1, k + 1, k); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals(); return g;
}
function mergeGeos(geos) {
  let n = 0, ni = 0; for (const g of geos) { n += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
  const pos = new Float32Array(n * 3), uv = new Float32Array(n * 2), nor = new Float32Array(n * 3), col = geos[0].attributes.color ? new Float32Array(n * 3) : null;
  const idx = new Uint32Array(ni); let o = 0, oi = 0;
  for (const g of geos) {
    const c = g.attributes.position.count;
    pos.set(g.attributes.position.array, o * 3); uv.set(g.attributes.uv.array, o * 2);
    if (!g.attributes.normal) g.computeVertexNormals(); nor.set(g.attributes.normal.array, o * 3);
    if (col) col.set(g.attributes.color.array, o * 3);
    const gi = g.index ? g.index.array : [...Array(c).keys()]; for (let i = 0; i < gi.length; i++) idx[oi + i] = gi[i] + o;
    o += c; oi += gi.length;
  }
  const m = new THREE.BufferGeometry();
  m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); m.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); m.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  if (col) m.setAttribute('color', new THREE.BufferAttribute(col, 3));
  m.setIndex(new THREE.BufferAttribute(idx, 1)); return m;
}
const MAJOR = new Set(['trunk', 'trunk_link', 'primary', 'secondary', 'tertiary']);
const majSegs = []; for (const r of W.roads) if (MAJOR.has(r.k) && r.w >= 12) for (let i = 1; i < r.p.length; i++) majSegs.push([r.p[i - 1], r.p[i]]);
const segDist = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], L = dx * dx + dz * dz || 1; let t = ((x - a[0]) * dx + (z - a[1]) * dz) / L; t = Math.max(0, Math.min(1, t)); return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); };
const shopG = [];
const major = [], minor = [], kerb = [], lines = [], gutter = [];
for (const r of W.roads) {
  if (MAJOR.has(r.k)) { kerb.push(ribbon(r.p, r.w + 2.4, 0.02)); gutter.push(ribbon(r.p, r.w + 1.1, 0.035)); major.push(ribbon(r.p, r.w, 0.05)); if (r.w >= 12 && r.w < 14) lines.push(ribbon(r.p, 0.25, 0.07)); }
  else minor.push(ribbon(r.p, r.w, 0.03 + (r.k === 'service' ? 0 : 0.005)));
}
asphaltTex.repeat.set(1, 1);
const roadMat = new THREE.MeshStandardMaterial({ ...ptex('asphalt'), side: THREE.DoubleSide });
const dirtMat = new THREE.MeshStandardMaterial({ ...ptex('asphalt'), color: 0xb09a86, side: THREE.DoubleSide });
const kerbMat = new THREE.MeshStandardMaterial({ ...ptex('pave'), side: THREE.DoubleSide });
const lineTex = canvasTex(16, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#f2f0e8'; g.fillRect(0, 0, w, h * .5); });
const lineMat = new THREE.MeshBasicMaterial({ map: lineTex, transparent: true, depthWrite: false, side: THREE.DoubleSide });
for (const [list, mat] of [[kerb, kerbMat], [gutter, new THREE.MeshStandardMaterial({ color: 0x34312d, roughness: 1, side: THREE.DoubleSide })], [major, roadMat], [minor, dirtMat], [lines, lineMat]]) {
  if (!list.length) continue; const m = new THREE.Mesh(mergeGeos(list), mat); m.receiveShadow = true; scene.add(m);
}

// ---------------------------------------------------------------- buildings (merged) + collision grid

// ---------------------------------------------------------------- landmark sites (from the player's Challenge photos)
function siteNear(pt, back, w, d) {          // a w x d lot set back from the nearest big road, front facing the road
  let best = null;
  for (const [a, c] of majSegs) { const dx = c[0] - a[0], dz = c[1] - a[1], L = dx * dx + dz * dz || 1;
    let t = ((pt[0] - a[0]) * dx + (pt[1] - a[1]) * dz) / L; t = Math.max(0, Math.min(1, t));
    const qx = a[0] + dx * t, qz = a[1] + dz * t, dd = Math.hypot(pt[0] - qx, pt[1] - qz); if (!best || dd < best.dd) best = { dd, qx, qz }; }
  let ux = pt[0] - best.qx, uz = pt[1] - best.qz; const ul = Math.hypot(ux, uz) || 1; ux /= ul; uz /= ul;
  const cx = best.qx + ux * back, cz = best.qz + uz * back, rot = Math.atan2(-ux, -uz);
  const vx = -uz, vz = ux, hw = w / 2, hd = d / 2;
  const corners = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([s, f]) => [cx + vx * s - ux * f, cz + vz * s - uz * f]);
  return { cx, cz, rot, w, d, corners, ux, uz };
}
const SITES = {
  terminal: siteNear(W.poi.motorpark, 34, 46, 24),
  carpark: siteNear(W.poi.motorpark, 13, 30, 14),
  mall: siteNear([W.poi.fuel[0] + 70, W.poi.fuel[1] + 40], 38, 64, 30),
};
const inPoly = (x, z, p) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const a = p[i], b = p[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
for (const k of ['terminal', 'mall', 'carpark']) { const big = SITES[k].corners.map(([x, z]) => [SITES[k].cx + (x - SITES[k].cx) * 1.25, SITES[k].cz + (z - SITES[k].cz) * 1.25]);
  W.buildings = W.buildings.filter(b => !b.p.some(([x, z]) => inPoly(x, z, big))); }

const PALETTE = [0xe9dcc3, 0xf1e6cf, 0xe6cfa6, 0xd9b98c, 0xf3eee4, 0xd8c4a8, 0xe2d6bd, 0xcfb894, 0xefe0c0, 0xc9d1c8, 0xe8c9b0, 0xcfe3c3, 0xc9dbe8, 0xf0d0c8, 0xf1e3a0, 0xbfd8b8];
const ROOFC = [[1, 1, 1], [1, 1, 1], [1, 1, 1], [.92, .7, .62], [1.25, .82, .7], [.95, .97, 1.08], [1.35, 1.35, 1.4], [.7, .6, .55], [.75, .9, 1.25]];
function hipRoof(p, h, col) {
  let best = 0, ux = 1, uz = 0;                         // direction of the longest wall
  for (let i = 0; i < p.length; i++) { const a = p[i], c = p[(i + 1) % p.length], L = Math.hypot(c[0] - a[0], c[1] - a[1]); if (L > best) { best = L; ux = (c[0] - a[0]) / L; uz = (c[1] - a[1]) / L; } }
  const vx = -uz, vz = ux; let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9;
  for (const q of p) { const a = q[0] * ux + q[1] * uz, b = q[0] * vx + q[1] * vz; a0 = Math.min(a0, a); a1 = Math.max(a1, a); b0 = Math.min(b0, b); b1 = Math.max(b1, b); }
  const o = .45; a0 -= o; a1 += o; b0 -= o; b1 += o;
  const A = a1 - a0, B = b1 - b0, rise = Math.min(2.6, Math.max(1, Math.min(A, B) * .32)), y0 = h + .25, y1 = y0 + rise;
  const P2 = (a, b, y) => [ux * a + vx * b, y, uz * a + vz * b];
  const inset = Math.min(A, B) / 2;
  const c00 = P2(a0, b0, y0), c10 = P2(a1, b0, y0), c11 = P2(a1, b1, y0), c01 = P2(a0, b1, y0);
  let r0, r1; const bm = (b0 + b1) / 2, am = (a0 + a1) / 2;
  if (A >= B) { r0 = P2(a0 + inset, bm, y1); r1 = P2(a1 - inset, bm, y1); } else { r0 = P2(am, b0 + inset, y1); r1 = P2(am, b1 - inset, y1); }
  const tris = A >= B ? [[c00, c10, r1], [c00, r1, r0], [c11, c01, r0], [c11, r0, r1], [c10, c11, r1], [c01, c00, r0]]
                      : [[c10, c11, r1], [c10, r1, r0], [c01, c00, r0], [c01, r0, r1], [c00, c10, r0], [c11, c01, r1]];
  const pos = [], uv = [], cc = [], tint = rnd(.85, 1.1);
  for (const t of tris) for (const v of t) { pos.push(...v); const a = v[0] * ux + v[2] * uz, b = v[0] * vx + v[2] * vz; uv.push(a / 3, (b + v[1]) / 3); cc.push(col[0] * tint, col[1] * tint, col[2] * tint); }
  const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); gg.setAttribute('color', new THREE.Float32BufferAttribute(cc, 3)); gg.computeVertexNormals();
  return gg;
}
const cells = new Map(), CELL = 24;
const key = (x, z) => `${Math.floor(x / CELL)},${Math.floor(z / CELL)}`;
const addRect = (p) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const q of p) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); z0 = Math.min(z0, q[1]); z1 = Math.max(z1, q[1]); }
  const rec = { p, x0, x1, z0, z1 }; for (let cx = Math.floor(x0 / CELL); cx <= Math.floor(x1 / CELL); cx++) for (let cz = Math.floor(z0 / CELL); cz <= Math.floor(z1 / CELL); cz++) { const k = `${cx},${cz}`; (cells.get(k) || cells.set(k, []).get(k)).push(rec); } };
window.__step('Building houses 3/6…'); await new Promise(r => setTimeout(r, 30));
const HOUSES = buildHouses({ THREE, scene, W, ptex, canvasTex, TL, addRect });
console.log('houses', JSON.stringify(HOUSES.count), 'doors', HOUSES.doors.length);
const mtx = new THREE.Matrix4();
const INT = makeInteriors({ THREE, scene, canvasTex });
let indoors = null;   // { door } while Frank is inside a house
// wooden electricity poles and sagging overhead wires along the big roads
const wirePts = [], woodMat = new THREE.MeshStandardMaterial({ color: 0x5b4632, roughness: 1 }), poleGeo = new THREE.CylinderGeometry(.11, .14, 9, 7);
const poleSpots = [];
for (const r of W.roads) {
  if (!MAJOR.has(r.k) || r.w < 12) continue;
  let acc = 0, prev = null;
  for (let i = 1; i < r.p.length; i++) {
    const a = r.p[i - 1], b = r.p[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (!L) continue;
    for (let t = 0; t < L; t += 1) { acc += 1; if (acc < 32) continue; acc = 0;
      const x = a[0] + (b[0] - a[0]) * t / L, z = a[1] + (b[1] - a[1]) * t / L, nx = -(b[1] - a[1]) / L, nz = (b[0] - a[0]) / L, off = -(r.w / 2 + 1.6);
      const px = x + nx * off, pz = z + nz * off; if (blocked(px, pz, .3)) { prev = null; continue; }
      poleSpots.push([px, pz]);
      if (prev) for (const [hh, dx] of [[8.6, -.5], [8.6, .5], [8.1, 0]]) { const n = 10;
        for (let k = 0; k < n; k++) { const t0 = k / n, t1 = (k + 1) / n, s0 = Math.sin(t0 * Math.PI) * .7, s1 = Math.sin(t1 * Math.PI) * .7;
          wirePts.push(prev[0] + (px - prev[0]) * t0, hh - s0, prev[1] + (pz - prev[1]) * t0, prev[0] + (px - prev[0]) * t1, hh - s1, prev[1] + (pz - prev[1]) * t1); } }
      prev = [px, pz]; }
  }
}
const woodPoles = new THREE.InstancedMesh(poleGeo, woodMat, poleSpots.length);
poleSpots.forEach(([x, z], i) => { mtx.makeTranslation(x, 4.5, z); woodPoles.setMatrixAt(i, mtx); }); woodPoles.castShadow = true; scene.add(woodPoles);
const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wirePts, 3));
scene.add(new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ color: 0x1a1a1a, transparent: true, opacity: .85 })));

function inside(x, z, p) { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const a = p[i], b = p[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
function blocked(x, z, r = 0.35) {
  if (indoors) return INT.blocked(x, z, r);
  if (Math.hypot(x, z) > W.R - 5) return true;
  for (const [dx, dz] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]]) {
    const list = cells.get(key(x + dx, z + dz)); if (!list) continue;
    for (const b of list) if (x + dx > b.x0 && x + dx < b.x1 && z + dz > b.z0 && z + dz < b.z1 && inside(x + dx, z + dz, b.p)) return true;
  }
  return false;
}

// ---------------------------------------------------------------- props: street lights, umbrellas, stalls
const poleMat = new THREE.MeshLambertMaterial({ color: 0x8e9196 });

// ---------------------------------------------------------------- landmarks
const addSolid = (corners) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const q of corners) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); z0 = Math.min(z0, q[1]); z1 = Math.max(z1, q[1]); }
  const rec = { p: corners, x0, x1, z0, z1 }; for (let cx = Math.floor(x0 / CELL); cx <= Math.floor(x1 / CELL); cx++) for (let cz = Math.floor(z0 / CELL); cz <= Math.floor(z1 / CELL); cz++) { const k = `${cx},${cz}`; (cells.get(k) || cells.set(k, []).get(k)).push(rec); } };
function lot(s) { const g = new THREE.Group(); g.position.set(s.cx, 0, s.cz); g.rotation.y = s.rot; scene.add(g); return g; }
const std = (o) => new THREE.MeshStandardMaterial(o);
function textPlane(w, h, draw, pw = 1024) { const ph = Math.round(pw * h / w); const t = canvasTex(pw, ph, (g, W2, H2) => draw(g, W2, H2)); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), std({ map: t, transparent: true, roughness: .5, side: THREE.DoubleSide })); return m; }
const box = (w, h, d, mat, x, y, z, grp) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; grp.add(m); return m; };

// --- Challenge Bus Terminal: orange and brown block facade, window strips, glass corner, white canopy, fence with blue gate
{
  const s = SITES.terminal, G = lot(s), W2 = s.w, D = s.d, H = 11, front = D / 2;
  const facade = canvasTex(2048, 512, (g, w, h) => {
    g.fillStyle = '#d6d2cb'; g.fillRect(0, h * .7, w, h * .3);                       // grey ground floor
    const bw = 96, bh = 30; for (let y = 0, row = 0; y < h * .7; y += bh, row++) for (let x = -((row % 3) * 32); x < w; x += bw) {
      g.fillStyle = Math.random() < .55 ? '#ef5a24' : (Math.random() < .5 ? '#a5684d' : '#b5745a'); g.fillRect(x, y, bw - 1, bh - 1); }
    for (let r = 0; r < 3; r++) for (let x = 120 + r * 40; x < w - 80; x += 260) { const y = 60 + r * 105; g.fillStyle = '#e8eef2'; g.fillRect(x, y, 150, 30); g.fillStyle = '#9fc3d8'; for (let k = 0; k < 4; k++) g.fillRect(x + 4 + k * 37, y + 4, 33, 22); }
    g.fillStyle = '#9aa0a6'; for (let x = 60; x < w; x += 300) g.fillRect(x, h * .74, 120, h * .26);     // doors / shopfronts
  }); facade.wrapS = THREE.ClampToEdgeWrapping;
  const fm = std({ map: facade, roughness: .75 }), top = std({ color: 0x9a9a96, roughness: .9 });
  const body = box(W2, H, D, [fm, fm, top, top, fm, fm], 0, H / 2, 0, G);
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x24323c, metalness: .6, roughness: .05, clearcoat: 1 });
  box(14, 4.6, .3, glass, -W2 / 2 + 8.5, 6.1, front + .12, G);
  const sign = textPlane(17, 4, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#ffffff'; g.font = '800 170px Inter, sans-serif'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 8; g.fillText('Challenge', 40, h * .32); g.font = '600 120px Inter, sans-serif'; g.fillText('Bus Terminal', 44, h * .76); });
  sign.position.set(2, 8.6, front + .2); G.add(sign);
  box(24, .35, 5, std({ color: 0xf4f4f2, roughness: .6 }), W2 / 2 - 12, 4.2, front + 2.5, G);                       // canopy
  for (const x of [W2 / 2 - 23, W2 / 2 - 12, W2 / 2 - 1]) box(.18, 4.1, .18, poleMat, x, 2.05, front + 4.8, G);
  const fz = front + 9, pil = std({ color: 0xd9dbdd, roughness: .8 }), blue = std({ color: 0x1f6fd1, roughness: .5, metalness: .3 });
  for (let x = -W2 / 2; x <= W2 / 2; x += 4) { box(.6, 1.9, .6, pil, x, .95, fz, G); box(.8, .18, .8, pil, x, 1.95, fz, G); }
  box(W2, .7, .25, pil, 0, .35, fz, G);
  box(5, 1.8, .12, blue, -W2 / 2 + 6, 1, fz, G);
  const welcome = textPlane(4.2, 2.6, (g, w, h) => { g.fillStyle = '#a2553b'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 3;
    for (let y = 0; y < h; y += 34) for (let x = (y / 34) % 2 ? -40 : 0; x < w; x += 80) g.strokeRect(x, y, 80, 34);
    g.fillStyle = '#e9e9e9'; g.font = '700 84px Inter, sans-serif'; g.textAlign = 'center'; g.fillText('Welcome To', w / 2, h * .4); g.fillText('Challenge', w / 2, h * .62); g.fillText('Bus Terminal', w / 2, h * .84); });
  box(4.4, 2.8, .6, std({ color: 0xa2553b, roughness: .9 }), -W2 / 2 + 12, 1.4, fz, G); welcome.position.set(-W2 / 2 + 12, 1.4, fz + .31); G.add(welcome);
  const yard = new THREE.Mesh(new THREE.PlaneGeometry(W2, 9), std({ ...ptex('pave', 4) })); yard.rotation.x = -Math.PI / 2; yard.position.set(0, .04, front + 4.5); yard.receiveShadow = true; G.add(yard);
  addSolid(s.corners);
}

// --- Challenge Car Park sign (brick pillar) by the park entrance
{
  const s = SITES.carpark, G = lot(s);
  const brick = textPlane(3.4, 3.6, (g, w, h) => { g.fillStyle = '#b4532f'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 3;
    for (let y = 0; y < h; y += 30) for (let x = (y / 30) % 2 ? -36 : 0; x < w; x += 72) g.strokeRect(x, y, 72, 30);
    g.fillStyle = '#eeeeee'; g.font = '800 110px Inter, sans-serif'; g.textAlign = 'center'; g.fillText('CHALLENGE', w / 2, h * .58); g.fillText('Car Park', w / 2, h * .76); });
  box(3.8, 3.8, .7, std({ color: 0xf2f2f0 }), 0, 1.9, s.d / 2, G); brick.position.set(0, 1.9, s.d / 2 + .36); G.add(brick);
  const lp = box(.14, 7, .14, std({ color: 0x2c2f33, metalness: .6 }), 3, 3.5, s.d / 2, G); box(1.6, .08, .7, std({ color: 0x1e2a36, metalness: .4 }), 3.6, 7.05, s.d / 2, G);
  addSolid([[s.corners[3][0] * .5 + s.corners[2][0] * .5 - 2, s.corners[3][1] * .5 + s.corners[2][1] * .5 - 2], [s.corners[3][0] * .5 + s.corners[2][0] * .5 + 2, s.corners[3][1] * .5 + s.corners[2][1] * .5 - 2],
    [s.corners[3][0] * .5 + s.corners[2][0] * .5 + 2, s.corners[3][1] * .5 + s.corners[2][1] * .5 + 2], [s.corners[3][0] * .5 + s.corners[2][0] * .5 - 2, s.corners[3][1] * .5 + s.corners[2][1] * .5 + 2]]);
}

// --- Grove Shopping Mall: hexagon panel facade, green script sign, glass shopfronts
{
  const s = SITES.mall, G = lot(s), W2 = s.w, D = s.d, H = 14, front = D / 2;
  const hex = canvasTex(1024, 512, (g, w, h) => { g.fillStyle = '#5c544c'; g.fillRect(0, 0, w, h);
    const r = 34; for (let y = 0, row = 0; y < h + r; y += r * 1.5, row++) for (let x = (row % 2) * r * .866; x < w + r; x += r * 1.732) {
      g.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath();
      g.fillStyle = ['#cfc3b4', '#b8ab9a', '#e2d8ca'][(row + Math.round(x)) % 3]; g.fill(); g.strokeStyle = '#4d463f'; g.lineWidth = 3; g.stroke();
      g.fillStyle = 'rgba(40,36,32,.55)'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + r * .8, y - r * .4); g.lineTo(x + r * .8, y + r * .45); g.lineTo(x, y + r * .85); g.fill(); }
  }); hex.repeat.set(2, 1);
  const hm = std({ map: hex, roughness: .7 }), roof = std({ color: 0x8d8f8c });
  box(W2, H, D, [hm, hm, roof, roof, hm, hm], 0, H / 2, 0, G);
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x1d2a33, metalness: .5, roughness: .05, clearcoat: 1 });
  box(W2 - 4, 3.6, .3, glass, 0, 1.9, front + .12, G);
  const shopNames = ['GOLDEN SUPERMARKET', 'CHICKEN PALACE', 'FASHION HUB', 'PHONE WORLD', 'CINEMA'];
  shopNames.forEach((n, i) => { const t = textPlane(10, 1.1, (g, w, h) => { g.fillStyle = ['#c8102e', '#e65100', '#0b5394', '#1b7a3e', '#111'][i]; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = '800 80px Inter, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(n, w / 2, h / 2); });
    t.position.set(-W2 / 2 + 7 + i * 12.5, 4.3, front + .2); G.add(t); });
  const sign = textPlane(20, 6.4, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#ffffff'; g.font = 'italic 800 300px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 26; g.strokeStyle = '#ffffff'; g.strokeText('Grove', w / 2, h * .4); g.fillStyle = '#2e9e5b'; g.fillText('Grove', w / 2, h * .4);
    g.fillStyle = '#fff'; g.fillRect(w * .22, h * .74, w * .56, h * .2); g.fillStyle = '#2e9e5b'; g.font = '800 92px Inter, sans-serif'; g.fillText('SHOPPING MALL', w / 2, h * .845); });
  sign.position.set(0, 9.6, front + .3); G.add(sign);
  const lotP = new THREE.Mesh(new THREE.PlaneGeometry(W2, 14), std({ ...ptex('asphalt', 3), color: 0xbab6b0 })); lotP.rotation.x = -Math.PI / 2; lotP.position.set(0, .04, front + 7); lotP.receiveShadow = true; G.add(lotP);
  addSolid(s.corners);
}

const poles = [];
const median = [], grass = [];
const banTex = canvasTex(1024, 512, (g, w, h) => {
  const ads = [['PIPSNIPE', 'Trade gold smarter', '#0b0b0c', '#f2c14e'], ['WORK PORTAL', 'Get paid to create', '#1b7a3e', '#ffffff'], ['EKO VIBES FM', '98.1 · Turn it up', '#c8102e', '#ffffff'], ['VOTE BANKOLE', 'Progress for all · 2027', '#0b5394', '#ffffff']];
  ads.forEach(([t1, t2, bg, fg], i) => { const x = i * w / 4; g.fillStyle = bg; g.fillRect(x, 0, w / 4, h); g.fillStyle = fg; g.textAlign = 'center';
    g.font = '800 46px Inter, sans-serif'; g.fillText(t1, x + w / 8, h * .38); g.font = '600 24px Inter, sans-serif'; g.fillText(t2, x + w / 8, h * .5);
    g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x + 20, h * .62, w / 4 - 40, h * .3); });
}); banTex.wrapS = banTex.wrapT = THREE.ClampToEdgeWrapping;
const banMats = [0, 1, 2, 3].map(i => { const t = banTex.clone(); t.needsUpdate = true; t.repeat.set(.25, 1); t.offset.set(i * .25, 0); return std({ map: t, roughness: .7, side: THREE.DoubleSide }); });
const darkPole = std({ color: 0x23262a, metalness: .6, roughness: .45 });
let banN = 0;
for (const r of W.roads) {
  if (!MAJOR.has(r.k) || r.w < 12) continue;
  const dual = r.w >= 14;
  if (dual) { median.push(ribbon(r.p, 1.5, .1)); grass.push(ribbon(r.p, 1.1, .13)); }
  let acc = 0;
  for (let i = 1; i < r.p.length; i++) {
    const a = r.p[i - 1], b = r.p[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); acc += L;
    if (acc < (dual ? 30 : 38)) continue; acc = 0;
    const dx = (b[0] - a[0]) / L, dz = (b[1] - a[1]) / L, nx = -dz, nz = dx;
    if (dual) {                                        // double-arm light in the median
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(.1, .14, 10, 8), darkPole); pole.position.set(b[0], 5, b[1]); pole.castShadow = true; scene.add(pole); poles.push(pole);
      const arms = new THREE.Group(); arms.position.set(b[0], 10, b[1]); arms.rotation.y = Math.atan2(nx, nz); scene.add(arms); pole.userData.arm = arms;
      for (const sg of [-1, 1]) { const arm = new THREE.Mesh(new THREE.BoxGeometry(.09, .09, 2.6), darkPole); arm.position.set(0, .3, sg * 1.25); arm.rotation.x = sg * -.25; arms.add(arm);
        const lamp = new THREE.Mesh(new THREE.BoxGeometry(.4, .14, .9), darkPole); lamp.position.set(0, .62, sg * 2.5); arms.add(lamp);
        const glow = new THREE.Mesh(new THREE.PlaneGeometry(.32, .8), new THREE.MeshBasicMaterial({ color: 0xfff3d6 })); glow.rotation.x = Math.PI / 2; glow.position.set(0, .54, sg * 2.5); arms.add(glow); }
      if (banN++ % 2 === 0) { const bm = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.6), banMats[(banN / 2 | 0) % 4]); bm.position.set(b[0] + dx * .55, 6.2, b[1] + dz * .55); bm.rotation.y = Math.atan2(nx, nz); scene.add(bm);
        const rod = new THREE.Mesh(new THREE.BoxGeometry(.05, .05, 1.4), darkPole); rod.position.set(b[0] + dx * .5, 7.55, b[1] + dz * .5); rod.rotation.y = Math.atan2(dx, dz); scene.add(rod); }
    } else {
      const off = r.w / 2 + 1.4;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(.09, .12, 8, 6), poleMat); pole.position.set(b[0] + nx * off, 4, b[1] + nz * off); pole.castShadow = true; scene.add(pole); poles.push(pole);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(2.2, .1, .14), poleMat); pole.userData.arm = arm; arm.position.set(b[0] + nx * (off - 1), 8, b[1] + nz * (off - 1)); arm.rotation.y = -Math.atan2(nz, nx); scene.add(arm);
    }
  }
}
if (median.length) { const m = new THREE.Mesh(mergeGeos(median), std({ ...ptex("pave", 1), color: 0xd8d8d2, side: THREE.DoubleSide })); m.receiveShadow = true; scene.add(m);
  const gr = new THREE.Mesh(mergeGeos(grass), std({ color: 0x5d7d3b, roughness: 1, side: THREE.DoubleSide })); gr.receiveShadow = true; scene.add(gr); }
// remove the old centre lane line where there is a median now

// ---------------------------------------------------------------- trees (palms + broadleaf), instanced
const allSegs = []; for (const r of W.roads) for (let i = 1; i < r.p.length; i++) allSegs.push([r.p[i - 1], r.p[i], r.w]);
const nearRoad = (x, z, pad) => { for (const [a, c, w] of allSegs) if (Math.abs(a[0] - x) < 60 && Math.abs(a[1] - z) < 60 && segDist(x, z, a, c) < w / 2 + pad) return true; return false; };
const leafTex = canvasTex(256, 256, (g, w, h) => { g.clearRect(0, 0, w, h);
  for (let i = 0; i < 26; i++) { const t = i / 26, x = w / 2, y = h * .06 + t * h * .9; g.strokeStyle = `rgb(${50 + rnd(0, 30)},${100 + rnd(0, 40)},${40 + rnd(0, 20)})`; g.lineWidth = 5;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x - (1 - Math.abs(t - .45)) * w * .48, y + 18); g.stroke(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + (1 - Math.abs(t - .45)) * w * .48, y + 18); g.stroke(); }
  g.strokeStyle = '#4a5a2a'; g.lineWidth = 6; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.stroke(); });
leafTex.wrapS = leafTex.wrapT = THREE.ClampToEdgeWrapping;
const palmTrunk = new THREE.CylinderGeometry(.16, .26, 8, 7); palmTrunk.translate(0, 4, 0);
const frondG = []; for (let k = 0; k < 8; k++) { const f = new THREE.PlaneGeometry(1.2, 4.2); f.translate(0, 2.1, 0); f.rotateX(-1.05); f.rotateY(k * Math.PI / 4); f.translate(0, 8, 0); frondG.push(f); }
const fronds = mergeGeos(frondG.map(f => { f.deleteAttribute('normal'); f.computeVertexNormals(); return f; }));
const blobs = []; for (const [x, y, z, r] of [[0, 5.2, 0, 2.6], [1.4, 4.6, .6, 1.9], [-1.3, 4.7, -.4, 2], [.3, 6.4, -.6, 1.8]]) { const s = new THREE.IcosahedronGeometry(r, 3); s.translate(x, y, z); s.deleteAttribute('uv'); blobs.push(s); }
const crown = (() => { let n = 0; for (const b of blobs) n += b.attributes.position.count; const pos = new Float32Array(n * 3); let o = 0;
  for (const b of blobs) { const a = b.toNonIndexed ? b.toNonIndexed() : b; pos.set(a.attributes.position.array.slice(0, b.attributes.position.count * 3), o); o += b.attributes.position.count * 3; }
  const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); for (let i = 0; i < pos.length; i += 3) { pos[i] += rnd(-.12, .12); pos[i + 1] += rnd(-.12, .12); pos[i + 2] += rnd(-.12, .12); } m.computeVertexNormals(); return m; })();
const broadTrunk = new THREE.CylinderGeometry(.2, .32, 4.4, 7); broadTrunk.translate(0, 2.2, 0);
const palms = [], broads = [];
for (let n = 0; n < 2600 && palms.length + broads.length < 340; n++) {
  const a = rnd(0, Math.PI * 2), d = Math.sqrt(Math.random()) * (W.R - 30), x = Math.cos(a) * d, z = Math.sin(a) * d;
  if (blocked(x, z, 2.2) || nearRoad(x, z, 1.6)) continue;
  (Math.random() < .42 ? palms : broads).push([x, z, rnd(.8, 1.25), rnd(0, 6.28)]);
}
const inst = (geo, mat, list, sy = 1) => { const m = new THREE.InstancedMesh(geo, mat, list.length), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  list.forEach(([x, z, s, r], i) => { e.set(rnd(-.06, .06), r, rnd(-.06, .06)); q.setFromEuler(e); sc.set(s, s * sy, s); mtx.compose(v.set(x, 0, z), q, sc); m.setMatrixAt(i, mtx); }); m.castShadow = true; m.receiveShadow = true; scene.add(m); return m; };
const barkM = std({ color: 0x5e4a38, roughness: 1 });
inst(palmTrunk, barkM, palms); inst(fronds, std({ map: leafTex, alphaTest: .4, side: THREE.DoubleSide, roughness: .9 }), palms);
inst(broadTrunk, barkM, broads); inst(crown, std({ color: 0x3f5f28, roughness: 1 }), broads);

// ---------------------------------------------------------------- the motor park: parked white buses and cars, crowds
const parkVeh = [];
{ const MPp = W.poi.motorpark, ang = SITES.terminal.rot; const fx = Math.sin(ang), fz = Math.cos(ang), sx = Math.cos(ang), sz = -Math.sin(ang);
  for (let row = -3; row <= 3; row++) for (let col = -5; col <= 5; col++) {
    if (Math.random() < .22) continue;
    const x = MPp[0] + sx * col * 3.2 + fx * row * 7, z = MPp[1] + sz * col * 3.2 + fz * row * 7;
    if (blocked(x, z, 2.6) || nearRoad(x, z, 2.5) || Math.hypot(x - MPp[0], z - MPp[1]) < 6) continue;
    parkVeh.push([x, z, ang + (Math.random() < .5 ? 0 : Math.PI) + rnd(-.08, .08), Math.random() < .45]);
  }
}

const UMB = [0x7da64a, 0xe9e2d0, 0xd9533b, 0x3e6fb0, 0xe6b33a];
function umbrella(x, z, c) {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.ConeGeometry(1.9, .7, 12, 1, true), new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide })); top.position.y = 2.4;
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 2.4, 5), poleMat); stick.position.y = 1.2;
  const table = new THREE.Mesh(new THREE.BoxGeometry(1.6, .08, .9), new THREE.MeshLambertMaterial({ color: 0x7a5a3c })); table.position.y = .85;
  const legs = new THREE.Mesh(new THREE.BoxGeometry(1.5, .85, .8), new THREE.MeshLambertMaterial({ color: 0x5b4330 })); legs.position.y = .42; legs.scale.set(1, 1, .9);
  g.add(top, stick, table, legs); g.position.set(x, 0, z); g.traverse(o => o.castShadow = true); scene.add(g);
}
const MP = W.poi.motorpark;
for (let i = 0; i < 14; i++) {
  const a = rnd(0, Math.PI * 2), d = rnd(9, 26), x = MP[0] + Math.cos(a) * d, z = MP[1] + Math.sin(a) * d;
  if (!blocked(x, z, 1.8)) umbrella(x, z, UMB[i % UMB.length]);
}

// ---------------------------------------------------------------- people
const SKIN = [0x5a3a2a, 0x6b4430, 0x7a4e36, 0x4a3024, 0x8a5a40];
const CLOTH = [0x2a5d8f, 0xb8452f, 0xe0c35a, 0x3d7a4a, 0xeeeeee, 0x7a3b7a, 0x1f1f22, 0xc87533, 0x5a6b7a];
const gltfL = new GLTFLoader();
window.__step('Loading people 4/6…');
const [avatar, mocap] = await Promise.all([gltfL.loadAsync('models/frank.glb'), gltfL.loadAsync('models/anims.glb')]);
const CLIPS = {};
for (const c of mocap.animations) {
  const tracks = c.tracks.filter(t => t.name.endsWith('.quaternion') && !t.name.startsWith('mixamorigHips')).map(t => { const n = t.clone(); n.name = t.name.replace('mixamorig', ''); return n; });
  CLIPS[c.name] = new THREE.AnimationClip(c.name, c.duration, tracks);
}
function person({ shirt, pants, skin, shoes, tall = 1.75, wide = 1, chain = false }) {
  const root = new THREE.Group(), body = SkeletonUtils.clone(avatar.scene);
  body.traverse(o => {
    if (!o.isMesh && !o.isSkinnedMesh) return;
    o.castShadow = true; o.frustumCulled = false;
    const n = o.material.name; o.material = o.material.clone();
    if (n === 'Wolf3D_Outfit_Top') { o.material.map = null; o.material.color.set(shirt); o.material.roughness = .95; o.material.metalness = 0; }
    if (n === 'Wolf3D_Outfit_Bottom') { o.material.map = null; o.material.color.set(pants); o.material.roughness = .95; }
    if (n === 'Wolf3D_Outfit_Footwear' && shoes) { o.material.color.set(shoes); }
    if (n === 'Wolf3D_Skin' || n === 'Wolf3D_Body') { const c = new THREE.Color(skin); o.material.color.setRGB(.42 + c.r * .6, .3 + c.g * .5, .25 + c.b * .45); }
    if (n === 'Wolf3D_Beard') o.visible = false;
    if (n === 'Wolf3D_Headwear') o.visible = false;
  });
  body.scale.setScalar(tall / 1.8); body.scale.x *= wide; root.add(body);
  if (chain) { let neck; body.traverse(o => { if (o.isBone && o.name === 'Neck') neck = o; });
    if (neck) { const ch = new THREE.Mesh(new THREE.TorusGeometry(.085, .007, 6, 24), new THREE.MeshStandardMaterial({ color: 0xe0e2e6, metalness: 1, roughness: .2 })); ch.rotation.x = Math.PI / 2.2; ch.position.set(0, .02, .03); neck.add(ch); } }
  let head; body.traverse(o => { if (o.isBone && o.name === 'Head') head = o; });
  if (head) { const hair = new THREE.Mesh(new THREE.SphereGeometry(.098, 18, 12, 0, Math.PI * 2, 0, Math.PI * .5), new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 1 }));
    hair.scale.set(1, .62, 1.08); hair.position.set(0, .115, .005); head.add(hair); }
  const mixer = new THREE.AnimationMixer(body), act = {};
  for (const k of ['Idle', 'Walk', 'Run']) { act[k] = mixer.clipAction(CLIPS[k]); act[k].play(); act[k].setEffectiveWeight(k === 'Idle' ? 1 : 0); }
  let arm; body.traverse(o => { if (o.isBone && o.name === 'RightArm') arm = o; });
  root.userData = { mixer, act, arm, punch: 0, w: { Idle: 1, Walk: 0, Run: 0 } };
  return root;
}
function animate(p, speed, dt, air = false) {
  const u = p.userData, tgt = { Idle: speed < .3 ? 1 : 0, Walk: speed >= .3 && speed < 4 ? 1 : 0, Run: speed >= 4 ? 1 : 0 };
  for (const k in tgt) { u.w[k] += (tgt[k] - u.w[k]) * Math.min(1, dt * 8); u.act[k].setEffectiveWeight(u.w[k]); }
  u.act.Walk.timeScale = Math.max(.6, speed / 1.6); u.act.Run.timeScale = Math.max(.7, speed / 5.5);
  u.mixer.update(dt);
  if (u.punch > 0 && u.arm) { u.punch -= dt; const t = 1 - u.punch / .35; u.arm.rotateX(-Math.sin(t * Math.PI) * 1.4); }
}

// Frank: black oversized tee, charcoal cargo pants, grey/black sneakers, silver chain
const frank = person({ shirt: 0x161616, pants: 0x3a3733, skin: 0x5c3a2c, shoes: 0x9a9a98, tall: 1.78, chain: true, wide: 1.04 });
// spawn on the pavement of the big road closest to the motor park, ~45 m away so Mission 1 has a short walk
let best = null;
for (const r of W.roads) { if (!MAJOR.has(r.k) || r.w < 12) continue;
  for (let i = 1; i < r.p.length; i++) { const a = r.p[i - 1], b = r.p[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (!L) continue;
    for (let t = 0; t <= 1; t += .1) { const x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t, d = Math.abs(Math.hypot(x - W.poi.motorpark[0], z - W.poi.motorpark[1]) - 45);
      const nx = -(b[1] - a[1]) / L, nz = (b[0] - a[0]) / L;
      for (const sgn of [1, -1]) { const px = x + nx * sgn * (r.w / 2 + 1.6), pz = z + nz * sgn * (r.w / 2 + 1.6);
        if (!blocked(px, pz, .8) && (!best || d < best.d)) best = { d, px, pz, cx: x + nx * sgn * (r.w / 2 - 2), cz: z + nz * sgn * (r.w / 2 - 2), yaw: Math.atan2(b[0] - a[0], b[1] - a[1]) }; } } } }
for (const pl of poles) if (Math.hypot(pl.position.x - best.px, pl.position.z - best.pz) < 7) { pl.visible = false; pl.userData.arm.visible = false; }
frank.position.set(best.px, 0, best.pz); frank.rotation.y = Math.atan2(W.poi.motorpark[0] - best.px, W.poi.motorpark[1] - best.pz); scene.add(frank);
const tunde = person({ shirt: 0xb8452f, pants: 0x1f2a44, skin: 0x5a3a2a, tall: 1.78 });
tunde.position.set(MP[0], 0, MP[1]); tunde.rotation.y = Math.PI; scene.add(tunde);
// mission marker
const marker = new THREE.Group();
const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 40, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xf2c14e, transparent: true, opacity: .22, side: THREE.DoubleSide, depthWrite: false })); beam.position.y = 20;
const ring = new THREE.Mesh(new THREE.TorusGeometry(1.3, .07, 8, 40), new THREE.MeshBasicMaterial({ color: 0xf2c14e })); ring.rotation.x = Math.PI / 2; ring.position.y = .1;
marker.add(beam, ring); scene.add(marker);

const npcs = [];
for (let i = 0; i < 16; i++) {
  const p = person({ shirt: CLOTH[i % CLOTH.length], pants: [0x2b2b30, 0x3b4a5c, 0x6b5a45, 0x1f1f22][i % 4], skin: SKIN[i % SKIN.length], tall: rnd(1.6, 1.85), wide: rnd(.95, 1.12) });
  let x, z, n = 0; do { const a = rnd(0, 6.28), d = rnd(6, 70); x = MP[0] + Math.cos(a) * d; z = MP[1] + Math.sin(a) * d; } while (blocked(x, z, .6) && ++n < 30);
  p.position.set(x, 0, z); p.userData.dir = rnd(0, 6.28); p.userData.speed = rnd(.9, 1.5); p.userData.t = rnd(2, 6); p.userData.flee = 0;
  scene.add(p); npcs.push(p);
}

// ---------------------------------------------------------------- vehicles
function vehicle({ body = 0xe2b51c, danfo = false, cab = false }) {
  const g = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({ color: body, metalness: .35, roughness: .32, clearcoat: 1, clearcoatRoughness: .12 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x15191d, metalness: .2, roughness: .05, clearcoat: 1 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: .8 });
  // side profiles (x = length, front at +x; y = height), extruded across the width with rounded edges
  const P = danfo
    ? { len: 4.6, wid: 1.9, body: [[-2.3, .38], [-2.3, 2.0], [-2.18, 2.12], [1.86, 2.12], [2.2, 1.78], [2.3, 1.05], [2.3, .38]], win: [[-2.2, 1.32], [-2.2, 1.95], [1.82, 1.95], [2.14, 1.62], [2.2, 1.32]], stripes: [[.86, .95], [1.04, 1.12]] }
    : { len: 4.1, wid: 1.72, body: [[-2.05, .36], [-2.05, .98], [-1.9, 1.08], [-1.55, 1.5], [.2, 1.52], [.95, 1.0], [1.98, .9], [2.05, .74], [2.05, .36]], win: [[-1.6, 1.06], [-1.46, 1.44], [.16, 1.46], [.82, 1.02]], stripes: cab ? [[.66, .72]] : [] };
  const ext = (pts, depth, mat, bevel = .05) => { const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
    const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3, curveSegments: 4 });
    geo.translate(0, 0, -depth / 2); geo.rotateY(-Math.PI / 2); const m = new THREE.Mesh(geo, mat); m.castShadow = true; g.add(m); return m; };
  ext(P.body, P.wid - .1, paint, .06);
  if (cab) { const roof = new THREE.Mesh(new THREE.BoxGeometry(P.wid - .12, .07, 1.72), new THREE.MeshStandardMaterial({ color: 0xf1e7c9, roughness: .4 })); roof.position.set(0, 1.535, -.67); roof.castShadow = true; g.add(roof); }
  ext(P.win, P.wid - .06, glass, .04);
  for (const [y0, y1] of P.stripes) ext([[-P.len / 2 + .02, y0], [P.len / 2 - .02, y0], [P.len / 2 - .02, y1], [-P.len / 2 + .02, y1]], P.wid - .02, cab ? new THREE.MeshStandardMaterial({ color: 0xf2efe6 }) : dark, .01);
  // wheels: tyre + rim
  const tyre = new THREE.CylinderGeometry(.36, .36, .24, 18), rim = new THREE.CylinderGeometry(.22, .22, .26, 12), rimM = new THREE.MeshStandardMaterial({ color: 0xb0b4b8, metalness: .9, roughness: .3 });
  for (const [x, z] of [[-P.wid / 2, P.len * .32], [P.wid / 2, P.len * .32], [-P.wid / 2, -P.len * .32], [P.wid / 2, -P.len * .32]]) {
    const t = new THREE.Mesh(tyre, dark), r = new THREE.Mesh(rim, rimM); t.rotation.z = r.rotation.z = Math.PI / 2; t.position.set(x, .36, z); r.position.set(x, .36, z); t.castShadow = true; g.add(t, r); }
  for (const s of [-1, 1]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(.32, .16, .04), new THREE.MeshBasicMaterial({ color: 0xfff6d8 })); hl.position.set(s * P.wid * .32, danfo ? .95 : .78, P.len / 2 + .06); g.add(hl);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(.2, .3, .04), new THREE.MeshBasicMaterial({ color: 0xc8231c })); tl.position.set(s * P.wid * .38, danfo ? 1.05 : .92, -P.len / 2 - .06); g.add(tl); }
  for (const z of [P.len / 2 + .08, -P.len / 2 - .08]) { const bp = new THREE.Mesh(new THREE.BoxGeometry(P.wid + .04, .16, .14), dark); bp.position.set(0, .5, z); g.add(bp); }
  const plate = new THREE.Mesh(new THREE.BoxGeometry(.5, .14, .02), new THREE.MeshStandardMaterial({ color: 0xf2f2ea })); plate.position.set(0, .66, -P.len / 2 - .16); g.add(plate);
  g.userData = { len: P.len, wid: P.wid, speed: 0 };
  return g;
}
const danfo = vehicle({ danfo: true });
danfo.position.set(best.cx + Math.sin(best.yaw) * 6, 0, best.cz + Math.cos(best.yaw) * 6); danfo.rotation.y = best.yaw; scene.add(danfo);

for (const [x, z, r, bus] of parkVeh) {
  const v = vehicle(bus ? { danfo: true, body: [0xf2f1ec, 0xe9e6dc, 0xf4f4f0][(Math.random() * 3) | 0] } : { body: [0xb8302a, 0xd5d8dc, 0x2c3e50, 0x8a8f94, 0x1a1a1a, 0x7a1f1f][(Math.random() * 6) | 0], cab: Math.random() < .3 });
  v.position.set(x, 0, z); v.rotation.y = r; scene.add(v);
  const hl = v.userData.len / 2 + .2, hw = v.userData.wid / 2 + .15, c = Math.cos(r), s = Math.sin(r);
  addSolid([[-hw, -hl], [hw, -hl], [hw, hl], [-hw, hl]].map(([a, b]) => [x + a * c + b * s, z - a * s + b * c]));
}
// roadside billboards on two legs
{ const ads = [['GOLDEN SEMOVITA', 'The taste of home', '#f2c14e', '#7a1f1f'], ['BLESSING MOBILE', 'Data that never finish', '#0b5394', '#fff'], ['PIPSNIPE', 'Your gold. Your rules.', '#0b0b0c', '#f2c14e'], ['GIFT VISUALS', 'Games from Nigeria', '#111', '#fff'], ['EKO VIBES FM 98.1', 'Lagos to Ibadan, one sound', '#c8102e', '#fff']];
  let k = 0, acc = 0;
  for (const r of W.roads) { if (!MAJOR.has(r.k) || r.w < 12) continue;
    for (let i = 1; i < r.p.length && k < 9; i++) { const a = r.p[i - 1], b = r.p[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); acc += L; if (acc < 140 || !L) continue;
      const nx = -(b[1] - a[1]) / L, nz = (b[0] - a[0]) / L, side = k % 2 ? 1 : -1, off = r.w / 2 + 6, x = b[0] + nx * off * side, z = b[1] + nz * off * side;
      if (blocked(x, z, 3)) continue; acc = 0;
      const [t1, t2, bg, fg] = ads[k++ % ads.length];
      const G = new THREE.Group(); G.position.set(x, 0, z); G.rotation.y = Math.atan2(-nx * side, -nz * side) ; scene.add(G);
      for (const lx of [-2.6, 2.6]) box(.3, 7, .3, darkPole, lx, 3.5, 0, G);
      box(10.4, 4.6, .3, std({ color: 0x2a2a2a, metalness: .5 }), 0, 8.6, -.05, G);
      const face = textPlane(10, 4.2, (g, w, h) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.textAlign = 'center'; g.font = '800 120px Inter, sans-serif'; g.fillText(t1, w / 2, h * .48); g.font = '600 56px Inter, sans-serif'; g.fillText(t2, w / 2, h * .72); });
      face.position.set(0, 8.6, .12); G.add(face); }
  }
}

// traffic on the two big roads
const traffic = [];
const bigRoads = W.roads.filter(r => r.w >= 12 && r.p.length > 3);
for (let i = 0; i < 14; i++) {
  const r = bigRoads[i % bigRoads.length];
  const car = vehicle(Math.random() < .7 ? { body: [0xb8302a, 0xc63a2e, 0xa82822][i % 3], cab: true } : Math.random() < .5 ? { danfo: true } : { body: [0x2c3e50, 0xd5d8dc, 0x7f8c8d, 0x1a1a1a][i % 4] });
  car.userData.road = r; car.userData.seg = (Math.random() * (r.p.length - 1)) | 0; car.userData.t = Math.random(); car.userData.dirn = Math.random() < .5 ? 1 : -1; car.userData.v = rnd(7, 11);
  scene.add(car); traffic.push(car);
}
// street life: gutters, kiosks, POS umbrellas, sheds, mosque, mechanic yard; kekes and okadas
window.__step('Street life 5/6…'); await new Promise(r => setTimeout(r, 30));
const SL = buildStreetLife({ THREE, scene, W, blocked, addRect, canvasTex, ptex, majSegs, vehicle, start: [frank.position.x, frank.position.z] });
console.log('stalls', SL.stalls, 'mosque', !!SL.mosque, 'mech', !!SL.mech);
function seat(p) {      // a rider sitting on a bike: idle pose, then bend hips and knees, arms forward
  const u = p.userData; u.mixer.update(.05); const bones = {}; p.traverse(o => { if (o.isBone) bones[o.name] = o; });
  for (const s of ['Left', 'Right']) { bones[s + 'UpLeg']?.rotateX(-1.35); bones[s + 'Leg']?.rotateX(1.45); bones[s + 'Arm']?.rotateX(-.75); bones[s + 'ForeArm']?.rotateX(-.4); }
  u.seated = true; return p;
}
const KEKEC = [0xf2c400, 0xf2c400, 0xe8b400, 0x2e8b57, 0xc0392b];
for (let i = 0; i < 14; i++) {
  const r = bigRoads[(i * 3 + 1) % bigRoads.length], isK = i < 6;
  const v = isK ? SL.keke(KEKEC[i % KEKEC.length]) : SL.okada([0x1f4fbf, 0x111111, 0xc0392b, 0x7f8c8d][i % 4]);
  if (!isK) { const rider = seat(person({ shirt: CLOTH[i % CLOTH.length], pants: 0x2b2b30, skin: SKIN[i % SKIN.length], tall: 1.75 })); rider.position.set(0, .45, -.25); v.add(rider); }
  v.userData.road = r; v.userData.seg = (Math.random() * (r.p.length - 1)) | 0; v.userData.t = Math.random(); v.userData.dirn = Math.random() < .5 ? 1 : -1; v.userData.v = isK ? rnd(5, 7) : rnd(8, 12); v.userData.edge = isK ? 1.2 : .8;
  scene.add(v); traffic.push(v);
}
{ const MPp = W.poi.motorpark; let n = 0;
  for (let k = 0; k < 400 && n < 16; k++) { const a = rnd(0, Math.PI * 2), d = rnd(10, 40), x = MPp[0] + Math.cos(a) * d, z = MPp[1] + Math.sin(a) * d;
    if (blocked(x, z, 1.4)) continue; const v = n < 4 ? SL.keke(KEKEC[n % KEKEC.length]) : SL.okada([0x1f4fbf, 0x111111, 0xc0392b, 0x7f8c8d][n % 4]);
    v.position.set(x, 0, z); v.rotation.y = rnd(0, 6.28); scene.add(v); n++; } }
function stepTraffic(dt) {
  for (const c of traffic) {
    const u = c.userData, p = u.road.p;
    const segLen = () => { const a = p[u.seg], b = p[u.seg + 1]; return Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; };
    // stop for Frank or the player's car
    const ahead = new THREE.Vector3(Math.sin(c.rotation.y), 0, Math.cos(c.rotation.y));
    const toP = (inCar ? danfo.position : frank.position).clone().sub(c.position);
    const stop = toP.dot(ahead) > 0 && toP.dot(ahead) < 9 && Math.abs(toP.x * ahead.z - toP.z * ahead.x) < 2.2;
    const v = stop ? 0 : u.v; u.cur = THREE.MathUtils.lerp(u.cur || v, v, Math.min(1, dt * (stop ? 6 : 1.2)));
    u.t += u.dirn * u.cur * dt / segLen();
    while (u.t > 1) { u.t -= 1; u.seg++; if (u.seg >= p.length - 1) { u.seg = p.length - 2; u.t = 1; u.dirn = -1; break; } }
    while (u.t < 0) { u.t += 1; u.seg--; if (u.seg < 0) { u.seg = 0; u.t = 0; u.dirn = 1; break; } }
    const a = p[u.seg], b = p[u.seg + 1], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1;
    const nx = -dz / L, nz = dx / L, lane = (u.dirn > 0 ? 1 : -1) * ((u.road.w >= 14 ? 3.4 : 2.6) + (u.edge || 0));
    c.position.set(a[0] + dx * u.t + nx * lane, 0, a[1] + dz * u.t + nz * lane);
    const yaw = Math.atan2(dx * u.dirn, dz * u.dirn); c.rotation.y += Math.atan2(Math.sin(yaw - c.rotation.y), Math.cos(yaw - c.rotation.y)) * Math.min(1, dt * 6);
  }
}

// ---------------------------------------------------------------- input
const input = { mx: 0, my: 0, run: false, jump: false, car: false, atk: false, lookX: 0, lookY: 0 };
const keys = {};
addEventListener('keydown', e => { keys[e.code] = true; if (e.code === 'KeyF') input.car = true; if (e.code === 'KeyE') input.enter = true; if (e.code === 'Space') input.jump = true; if (e.code === 'KeyM') toggleMap(); });
addEventListener('keyup', e => { keys[e.code] = false; });
let dragging = false, lx = 0, ly = 0;
$('c').addEventListener('mousedown', e => { dragging = true; lx = e.clientX; ly = e.clientY; if (!isTouch) input.atk = true; });
addEventListener('mouseup', () => dragging = false);
addEventListener('mousemove', e => { if (dragging) { input.lookX += (e.clientX - lx) * .005; input.lookY += (e.clientY - ly) * .003; lx = e.clientX; ly = e.clientY; } });
// joystick
const stick = $('stick'), knob = $('knob'); let stickId = null;
function stickMove(t) { const r = stick.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, R = r.width / 2;
  let dx = t.clientX - cx, dy = t.clientY - cy; const l = Math.hypot(dx, dy); if (l > R) { dx *= R / l; dy *= R / l; }
  knob.style.transform = `translate(${dx}px,${dy}px)`; input.mx = dx / R; input.my = dy / R; }
stick.addEventListener('touchstart', e => { const t = e.changedTouches[0]; stickId = t.identifier; stickMove(t); e.preventDefault(); }, { passive: false });
// look by dragging the free screen area
let lookId = null;
$('c').addEventListener('touchstart', e => { const t = e.changedTouches[0]; lookId = t.identifier; lx = t.clientX; ly = t.clientY; e.preventDefault(); }, { passive: false });
addEventListener('touchmove', e => { for (const t of e.changedTouches) {
  if (t.identifier === stickId) stickMove(t);
  else if (t.identifier === lookId) { input.lookX += (t.clientX - lx) * .006; input.lookY += (t.clientY - ly) * .004; lx = t.clientX; ly = t.clientY; } } e.preventDefault(); }, { passive: false });
addEventListener('touchend', e => { for (const t of e.changedTouches) {
  if (t.identifier === stickId) { stickId = null; input.mx = input.my = 0; knob.style.transform = ''; }
  if (t.identifier === lookId) lookId = null; } });
const hold = (id, on, off) => { const el = $(id);
  el.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); el.classList.add('on'); on(); }, { passive: false });
  el.addEventListener('touchend', e => { e.preventDefault(); el.classList.remove('on'); off && off(); }, { passive: false });
  el.addEventListener('mousedown', e => { e.stopPropagation(); on(); }); el.addEventListener('mouseup', () => off && off()); };
hold('bRun', () => input.run = true, () => input.run = false);
hold('bJump', () => input.jump = true);
hold('bCar', () => input.car = true);
hold('bEnter', () => input.enter = true);
hold('bAtk', () => input.atk = true);
hold('bMap', () => toggleMap());
hold('bPhone', () => toggleMap());
hold('bClose', () => toggleMap());

// ---------------------------------------------------------------- HUD: minimap and big map
const mini = $('mini').getContext('2d'), big = $('bigmap').getContext('2d');
function drawMap(g, w, h, cx, cz, scale, rot) {
  g.save(); g.fillStyle = '#16191e'; g.fillRect(0, 0, w, h); g.translate(w / 2, h / 2); g.rotate(rot); g.scale(scale, scale); g.translate(-cx, -cz);
  g.fillStyle = '#2a2f37'; for (const b of W.buildings) { if (Math.abs(b.p[0][0] - cx) * scale > w || Math.abs(b.p[0][1] - cz) * scale > w) continue; g.beginPath(); b.p.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.fill(); }
  g.lineCap = g.lineJoin = 'round';
  for (const pass of [0, 1]) for (const r of W.roads) { const m = MAJOR.has(r.k);
    g.strokeStyle = pass ? (m ? '#f0b13c' : '#8c939c') : '#0c0e11'; g.lineWidth = (m ? r.w : r.w * .9) + (pass ? 0 : 3 / scale);
    g.beginPath(); r.p.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.stroke(); }
  const tgt = mission.target(); if (tgt) { g.fillStyle = '#f2c14e'; g.strokeStyle = '#111'; g.lineWidth = 3 / scale; g.beginPath(); g.arc(tgt[0], tgt[1], 9 / scale, 0, 7); g.fill(); g.stroke(); }
  g.restore();
}
function playerArrow(g, w, h, yaw, size) { g.save(); g.translate(w / 2, h / 2); g.rotate(yaw); g.fillStyle = '#fff'; g.strokeStyle = '#111'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(0, -size); g.lineTo(size * .7, size * .8); g.lineTo(0, size * .4); g.lineTo(-size * .7, size * .8); g.closePath(); g.fill(); g.stroke(); g.restore(); }
let mapOpen = false;
function toggleMap() { mapOpen = !mapOpen; $('map-big').style.display = mapOpen ? 'block' : 'none'; }

// ---------------------------------------------------------------- mission 1
const sub = $('sub');
let subTimer = 0;
function say(who, text, t = 3.2) { sub.innerHTML = `<b>${who}:</b> ${text}`; sub.style.opacity = 1; subTimer = t; }
function toast(a, b) { $('t1').textContent = a; $('t2').textContent = b || ''; $('toast').style.opacity = 1; setTimeout(() => $('toast').style.opacity = 0, 3600); }
let money = 45500;
const mission = {
  step: 0, script: [], wait: 0,
  target() { return [[tunde.position.x, tunde.position.z], [danfo.position.x, danfo.position.z], W.poi.fuel, null][this.step]; },
  label() { return ['Meet Tunde at the motor park', 'Get in the danfo', 'Drive to the fuel station on Ring Road', 'Free roam'][this.step]; },
  update(dt) {
    if (this.script.length || this.wait > 0) { this.wait -= dt; if (this.wait <= 0 && this.script.length) { const [w, t, d] = this.script.shift(); say(w, t, d); this.wait = d; } }
    const P = inCar ? danfo.position : frank.position, tg = this.target();
    if (this.step === 0 && Math.hypot(P.x - tg[0], P.z - tg[1]) < 3.2 && !inCar) {
      tunde.lookAt(frank.position.x, 0, frank.position.z);
      this.script = [['Tunde', 'Frank! The results are out. Tonight we celebrate.', 3], ['Frank', 'Did we pass?', 2.2], ['Tunde', 'We both passed. Get the danfo. We fill the tank first, then we go out.', 3.6]];
      this.step = 1;
    } else if (this.step === 1 && inCar && !this.script.length) { this.step = 2; tunde.visible = false; say('Tunde', 'Ring Road. The fuel station. Drive like you have sense.', 3.4); }
    else if (this.step === 2 && inCar && Math.hypot(P.x - tg[0], P.z - tg[1]) < 14) {
      this.step = 3; money += 5000; danfo.userData.speed *= .3;
      this.script = [['Tunde', 'Look at you. Tonight is going to be crazy.', 3]];
      toast('Mission passed', 'Last Day of School  ·  +₦5,000');
    }
  },
};

// ---------------------------------------------------------------- player update
let yaw = frank.rotation.y + Math.PI, pitch = .28, inCar = false, vy = 0, hp = 100, clock = 18 * 60 + 40;
const tmp = new THREE.Vector3();
function update(dt) {
  yaw -= input.lookX; pitch = THREE.MathUtils.clamp(pitch + input.lookY, .05, .9); input.lookX = input.lookY = 0;
  let mx = input.mx, my = input.my;
  if (keys.KeyW || keys.ArrowUp) my = -1; if (keys.KeyS || keys.ArrowDown) my = 1; if (keys.KeyA || keys.ArrowLeft) mx = -1; if (keys.KeyD || keys.ArrowRight) mx = 1;
  const run = input.run || keys.ShiftLeft || keys.ShiftRight;
  // doors: enter / leave houses
  let near = null;
  if (!inCar && !indoors) { let bd = 1.7; for (const d of HOUSES.doors) { const dd = Math.hypot(d.x - frank.position.x, d.z - frank.position.z); if (dd < bd) { bd = dd; near = d; } } }
  const exitPt = indoors && INT.layouts[INT.current].exit, atExit = exitPt && Math.hypot(frank.position.x - exitPt[0], frank.position.z - exitPt[1]) < 1.1;
  $('bEnter').classList.toggle('hidden', !(near || atExit));
  if (input.enter) { input.enter = false;
    if (near) { const lay = INT.layouts[near.layout]; INT.current = near.layout; INT.show(near.layout, near.seed); indoors = { door: near };
      frank.position.set(lay.spawn[0], 0, lay.spawn[1] + .8); frank.rotation.y = 0; yaw = Math.PI; camera.position.set(frank.position.x, 2, frank.position.z - .5);
      sun.intensity = 0; hemi.intensity = 1.1; scene.environmentIntensity = .35; say('Frank', near.layout === 'house' ? 'Nice place.' : 'Same compound life.', 2); }
    else if (atExit) { const d = indoors.door; indoors = null; INT.current = null; INT.show(null);
      frank.position.set(d.x + d.nx * .3, 0, d.z + d.nz * .3); frank.rotation.y = Math.atan2(d.nx, d.nz); yaw = frank.rotation.y + Math.PI; camera.position.set(frank.position.x - d.nx * 4, 2.6, frank.position.z - d.nz * 4);
      sun.intensity = 2.1; hemi.intensity = .35; scene.environmentIntensity = .75; } }
  if (input.car && indoors) input.car = false;
  if (input.car) { input.car = false;
    if (inCar) { const side = new THREE.Vector3(-Math.cos(danfo.rotation.y), 0, Math.sin(danfo.rotation.y)).multiplyScalar(-1.8);
      const ex = danfo.position.clone().add(side); if (!blocked(ex.x, ex.z)) { frank.position.copy(ex); inCar = false; frank.visible = true; danfo.userData.speed = 0; } }
    else if (frank.position.distanceTo(danfo.position) < 4.2) { inCar = true; frank.visible = false; yaw = danfo.rotation.y + Math.PI; } }
  if (inCar) {
    const u = danfo.userData, thr = -my, steer = -mx;
    u.speed += (thr > 0 ? thr * 9 : thr * 14) * dt; u.speed *= Math.pow(.6, dt); u.speed = THREE.MathUtils.clamp(u.speed, -6, run ? 26 : 19);
    danfo.rotation.y += steer * dt * Math.min(Math.abs(u.speed) / 6, 1) * 1.6 * Math.sign(u.speed || 1);
    const nx = danfo.position.x + Math.sin(danfo.rotation.y) * u.speed * dt, nz = danfo.position.z + Math.cos(danfo.rotation.y) * u.speed * dt;
    const fx = nx + Math.sin(danfo.rotation.y) * 2.3 * Math.sign(u.speed || 1), fz = nz + Math.cos(danfo.rotation.y) * 2.3 * Math.sign(u.speed || 1);
    if (!blocked(nx, nz, 1) && !blocked(fx, fz, .6)) danfo.position.set(nx, 0, nz); else u.speed *= -.25;
    for (const c of traffic) if (c.position.distanceTo(danfo.position) < 3.6) { u.speed *= .5; tmp.subVectors(danfo.position, c.position).setY(0).normalize().multiplyScalar(.2); danfo.position.add(tmp); }
    for (const n of npcs) if (n.position.distanceTo(danfo.position) < 2.6) { n.userData.flee = 3; n.userData.dir = Math.atan2(n.position.x - danfo.position.x, n.position.z - danfo.position.z); }
    frank.position.copy(danfo.position);
    yaw += Math.atan2(Math.sin(danfo.rotation.y + Math.PI - yaw), Math.cos(danfo.rotation.y + Math.PI - yaw)) * Math.min(1, dt * 2.2);
  } else {
    const len = Math.min(1, Math.hypot(mx, my)), speed = len * (run ? 6.2 : 2.6);
    if (len > .05) {
      const ang = Math.atan2(mx, my) + yaw;       // camera-relative
      const dx = -Math.sin(ang) * speed * dt, dz = -Math.cos(ang) * speed * dt;
      if (!blocked(frank.position.x + dx, frank.position.z)) frank.position.x += dx;
      if (!blocked(frank.position.x, frank.position.z + dz)) frank.position.z += dz;
      const face = Math.atan2(-Math.sin(ang), -Math.cos(ang));
      frank.rotation.y += Math.atan2(Math.sin(face - frank.rotation.y), Math.cos(face - frank.rotation.y)) * Math.min(1, dt * 12);
    }
    if (input.jump && frank.position.y <= 0.001) vy = 4.6; input.jump = false;
    vy -= 12 * dt; frank.position.y = Math.max(0, frank.position.y + vy * dt);
    if (input.atk) { frank.userData.punch = .35;
      for (const n of npcs) { tmp.subVectors(n.position, frank.position); if (tmp.length() < 1.6) { n.userData.flee = 4; n.userData.dir = Math.atan2(tmp.x, tmp.z); n.rotation.z = .25; setTimeout(() => n.rotation.z = 0, 400); } } }
    animate(frank, speed, dt, frank.position.y > .01);
    for (const c of traffic) if (c.position.distanceTo(frank.position) < 2.1 && c.userData.cur > 3) { hp = Math.max(5, hp - 30); tmp.subVectors(frank.position, c.position).setY(0).normalize().multiplyScalar(1.5); frank.position.add(tmp); }
  }
  input.atk = false;
  // NPCs wander
  for (const n of npcs) { const u = n.userData; u.t -= dt; if (u.t < 0) { u.t = rnd(2, 6); u.dir += rnd(-1.4, 1.4); }
    const sp = u.flee > 0 ? 4.5 : u.speed; u.flee -= dt;
    const nx = n.position.x + Math.sin(u.dir) * sp * dt, nz = n.position.z + Math.cos(u.dir) * sp * dt;
    if (!blocked(nx, nz, .4) && Math.hypot(nx - MP[0], nz - MP[1]) < 90) { n.position.x = nx; n.position.z = nz; } else u.dir += Math.PI * rnd(.5, 1);
    n.rotation.y = u.dir; animate(n, sp, dt); }
  animate(tunde, 0, dt);
  stepTraffic(dt);
  mission.update(dt);
  // camera
  const focus = inCar ? danfo.position : frank.position, dist = inCar ? 11 : indoors ? 2.7 : 4.6, hgt = inCar ? 2.2 : indoors ? 1.5 : 1.55;
  if (indoors) pitch = Math.min(pitch, .42);
  const want = new THREE.Vector3(focus.x + Math.sin(yaw) * Math.cos(pitch) * dist, focus.y + hgt + Math.sin(pitch) * dist, focus.z + Math.cos(yaw) * Math.cos(pitch) * dist);
  const sh = inCar ? 0 : .55; want.x += Math.cos(yaw) * sh; want.z -= Math.sin(yaw) * sh;
  if (indoors) {   // keep the camera inside the room: pull it in front of any wall between it and Frank
    const from = new THREE.Vector3(focus.x, focus.y + hgt, focus.z), dir = want.clone().sub(from), len = dir.length(); dir.normalize();
    camRay.set(from, dir); camRay.far = len; const hit = camRay.intersectObjects(INT.layouts[INT.current].k.walls, false)[0];
    if (hit) want.copy(from).addScaledVector(dir, Math.max(.35, hit.distance - .25)); camera.position.copy(want); }
  camera.position.lerp(want, Math.min(1, dt * 10)); camera.lookAt(focus.x + Math.cos(yaw) * sh, focus.y + hgt, focus.z - Math.sin(yaw) * sh);
  sun.position.set(focus.x - 60, 90, focus.z + 40); sun.target.position.set(focus.x, 0, focus.z);
  // marker
  const tg = mission.target(); marker.visible = !!tg && mission.step !== 1 && !indoors;
  if (tg) { marker.position.set(tg[0], 0, tg[1]); ring.rotation.z += dt; }
  // HUD
  if (subTimer > 0) { subTimer -= dt; if (subTimer <= 0) sub.style.opacity = 0; }
  clock += dt * 1.5; const hh = Math.floor(clock / 60) % 24, mm = Math.floor(clock % 60);
  $('clock').textContent = `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'AM' : 'PM'} · Monday`;
  $('money').textContent = '₦' + money.toLocaleString('en-NG');
  $('hp').style.width = hp + '%'; hp = Math.min(100, hp + dt * 2);
  $('objS').textContent = mission.label();
  $('objD').textContent = indoors ? '' : tg ? `${Math.round(Math.hypot(focus.x - tg[0], focus.z - tg[1]))} m` : '';
  const mf = indoors ? { x: indoors.door.x, z: indoors.door.z } : focus;
  drawMap(mini, 340, 340, mf.x, mf.z, 1.6, yaw - Math.PI); playerArrow(mini, 340, 340, (inCar ? danfo.rotation.y : frank.rotation.y) - yaw + Math.PI, 13);
  if (mapOpen) { drawMap(big, 1400, 900, focus.x, focus.z, .95, 0); playerArrow(big, 1400, 900, Math.PI - (inCar ? danfo.rotation.y : frank.rotation.y), 16); }
}

// ---------------------------------------------------------------- loop
let last = performance.now(), freeCam = null;
const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera));
composer.addPass(new OutputPass());
composer.addPass(new ShaderPass({ uniforms: { tDiffuse: { value: null } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
  fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
  void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb;
    c = mix(c, c * vec3(1.06, 1.0, .9), .6);                       // warm Ibadan tone
    float l = dot(c, vec3(.299,.587,.114)); c = mix(vec3(l), c, .9); // slightly muted colours, like the photos
    c = (c - .5) * 1.05 + .5 + .015;                                  // soft contrast, lifted blacks (haze)
    float v = smoothstep(.95, .35, distance(vUv, vec2(.5))); c *= mix(.82, 1., v);   // vignette
    gl_FragColor = vec4(clamp(c, 0., 1.), 1.); }` }));
function loop(now) { const dt = Math.min(.05, (now - last) / 1000); last = now; update(dt); if (freeCam) { camera.position.set(freeCam[0], freeCam[1], freeCam[2]); camera.lookAt(freeCam[3], freeCam[4], freeCam[5]); } composer.render(); requestAnimationFrame(loop); }
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); });
window.__step('Almost ready 6/6…');
const go = $('go'); go.disabled = false; go.textContent = 'Play';
if (isTouch) $('rotate').classList.add('need');
function start() {
  $('start').style.display = 'none'; $('hud').style.display = 'block';
  if (!isTouch) document.querySelectorAll('.stick,.btn.b-s,.b-l').forEach(e => e.classList.add('hidden'));
  try { if (isTouch) document.documentElement.requestFullscreen?.().then(() => screen.orientation?.lock?.('landscape')).catch(() => {}); } catch (e) {}
  say('Tunde (phone)', 'Frank, where are you? I am at the motor park. Come now.', 3.6);
  requestAnimationFrame(loop);
}
go.addEventListener('click', start);
window.__game = { start, frank, danfo, input, mission, SITES, HOUSES, INT, SL, traffic, get indoors() { return indoors; }, camera, setView(x, y, z, tx, ty, tz) { freeCam = [x, y, z, tx, ty, tz]; }, get inCar() { return inCar; } };
