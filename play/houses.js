// Nigerian houses built from the player's reference photos:
//  bungalow  - grey walls, stone-clad porch, dark stone-coated hip roof, compound wall with white pillars, iron gate, electric fence
//  duplex    - white two-storey, first-floor slab with wood soffit, glass balcony, black-frame windows, tall grey gate
//  faceme    - "face-me-I-face-you": 2-3 floors, full-width balconies with railings, columns, rows of doors, clothes lines
//  tenement  - old stained concrete block, 3-4 floors, balconies, clothes everywhere, blue drums
//  shophouse - shops with shutters, signs and awnings downstairs, balcony with white balusters upstairs
// Everything is merged into a few big meshes (one per material) so phones can draw it fast.
export function buildHouses(ctx) {
  const { THREE, scene, W, ptex, canvasTex, TL, addRect } = ctx;
  const rnd = (a, b) => a + Math.random() * (b - a), pick = (a) => a[(Math.random() * a.length) | 0];
  const C = (h) => new THREE.Color(h), WHITE = C(0xffffff);

  // ---------------------------------------------------------------- batching
  class Batch {
    constructor() { this.p = []; this.u = []; this.c = []; }
    tri(a, b, c, ua, ub, uc, col) { this.p.push(...a, ...b, ...c); this.u.push(...ua, ...ub, ...uc); for (let k = 0; k < 3; k++) this.c.push(col.r, col.g, col.b); }
    quad(a, b, c, d, uv, col = WHITE) { const [u0, v0, u1, v1, u2, v2, u3, v3] = uv || [0, 0, 1, 0, 1, 1, 0, 1]; this.tri(a, b, c, [u0, v0], [u1, v1], [u2, v2], col); this.tri(a, c, d, [u0, v0], [u2, v2], [u3, v3], col); }
    mesh(mat, cast = true) {
      if (!this.p.length) return null;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
      g.computeVertexNormals(); const m = new THREE.Mesh(g, mat); m.castShadow = cast; m.receiveShadow = true; scene.add(m); return m;
    }
  }
  const B = {}; for (const k of ['block', 'grass', 'paint', 'old', 'trim', 'win', 'door', 'stone', 'tile', 'iron', 'rail', 'bal', 'glass', 'wood', 'gate', 'pave', 'cloth', 'shutter', 'sign', 'awn', 'slab']) B[k] = new Batch();

  // ---------------------------------------------------------------- textures (drawn in code, no copied photos)
  const cv = (w, h, draw, opts = {}) => { const t = canvasTex(w, h, draw); t.wrapS = t.wrapT = opts.clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping; return t; };
  const noise = (g, w, h, n, a0, a1, col = '0,0,0') => { for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${col},${rnd(a0, a1)})`; g.fillRect(Math.random() * w, Math.random() * h, rnd(1, 4), rnd(1, 4)); } };
  const plaster = cv(512, 512, (g, w, h) => { g.fillStyle = '#f2f2f0'; g.fillRect(0, 0, w, h); noise(g, w, h, 7000, .015, .04); noise(g, w, h, 2500, .04, .1, '255,255,255');
    for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(0,0,0,${rnd(.008, .02)})`; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, rnd(20, 70), 0, 7); g.fill(); } });
  const oldCon = cv(512, 512, (g, w, h) => { g.fillStyle = '#c9c6bd'; g.fillRect(0, 0, w, h); noise(g, w, h, 14000, .03, .1);
    for (let i = 0; i < 34; i++) { const x = Math.random() * w, len = rnd(40, 260), gr = g.createLinearGradient(0, 0, 0, len); gr.addColorStop(0, `rgba(40,38,32,${rnd(.12, .3)})`); gr.addColorStop(1, 'rgba(40,38,32,0)');
      g.fillStyle = gr; g.fillRect(x, 0, rnd(4, 26), len); }
    for (let i = 0; i < 10; i++) { g.fillStyle = `rgba(${rnd(60, 90)},${rnd(80, 100)},${rnd(50, 60)},${rnd(.06, .14)})`; g.beginPath(); g.ellipse(Math.random() * w, h - rnd(0, 120), rnd(20, 80), rnd(10, 50), 0, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(30,28,24,.22)'; g.fillRect(0, 0, w, 14); });
  // window atlas: 0 white frame + burglar bars, 1 black modern tall glass, 2 old blue louvres with bars, 3 wooden shutters
  const winTex = cv(1024, 1024, (g) => {
    const cell = (cx, cy, f) => { g.save(); g.translate(cx * 512, cy * 512); f(); g.restore(); };
    const glass = (x, y, w, h, top = '#53636d', bot = '#1f2a31') => { const gr = g.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, top); gr.addColorStop(.45, bot); gr.addColorStop(.55, '#42525b'); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(x, y, w, h); };
    cell(0, 0, () => { g.fillStyle = '#f4f4f2'; g.fillRect(0, 0, 512, 512); glass(30, 30, 220, 452); glass(262, 30, 220, 452); g.fillStyle = '#e8e8e6'; g.fillRect(250, 20, 12, 472);
      g.strokeStyle = '#151515'; g.lineWidth = 9; for (let x = 60; x < 500; x += 62) { g.beginPath(); g.moveTo(x, 20); g.lineTo(x, 492); g.stroke(); } for (const y of [140, 256, 372]) { g.beginPath(); g.moveTo(20, y); g.lineTo(492, y); g.stroke(); } });
    cell(1, 0, () => { g.fillStyle = '#121212'; g.fillRect(0, 0, 512, 512); for (const x of [16, 180, 344]) glass(x, 16, 152, 480, '#6a7a84', '#1a2328'); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(16, 16, 480, 120); });
    cell(0, 1, () => { g.fillStyle = '#c9c4b5'; g.fillRect(0, 0, 512, 512); for (let y = 30; y < 480; y += 30) { g.fillStyle = y % 60 ? '#6c94b4' : '#5a7f9e'; g.fillRect(36, y, 440, 24); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(36, y, 440, 5); }
      g.strokeStyle = '#2a2a2a'; g.lineWidth = 10; for (let x = 60; x < 480; x += 70) { g.beginPath(); g.moveTo(x, 20); g.lineTo(x, 492); g.stroke(); } g.strokeStyle = '#8c8574'; g.lineWidth = 22; g.strokeRect(14, 14, 484, 484); });
    cell(1, 1, () => { g.fillStyle = '#6b4a2f'; g.fillRect(0, 0, 512, 512); for (const x of [20, 262]) { g.fillStyle = '#7d5638'; g.fillRect(x, 20, 230, 472); for (let y = 40; y < 480; y += 22) { g.fillStyle = '#5a3d26'; g.fillRect(x + 14, y, 202, 9); } } });
  });
  // door atlas: 0 dark steel security door, 1 wood + glass, 2 iron grille door, 3 white panel
  const doorTex = cv(1024, 512, (g) => {
    const cell = (i, f) => { g.save(); g.translate(i * 256, 0); f(); g.restore(); };
    cell(0, () => { g.fillStyle = '#26282b'; g.fillRect(0, 0, 256, 512); g.strokeStyle = '#3a3d41'; g.lineWidth = 8; for (const [x, y, w, h] of [[30, 40, 196, 120], [30, 190, 196, 120], [30, 340, 196, 140]]) g.strokeRect(x, y, w, h); g.fillStyle = '#b9a66a'; g.fillRect(200, 260, 14, 40); });
    cell(1, () => { g.fillStyle = '#8a5a34'; g.fillRect(0, 0, 256, 512); g.fillStyle = 'rgba(0,0,0,.12)'; for (let x = 0; x < 256; x += 16) g.fillRect(x, 0, 3, 512); g.fillStyle = '#2b3338'; g.fillRect(40, 40, 176, 130); g.fillStyle = '#d8c48a'; g.fillRect(200, 270, 12, 60); });
    cell(2, () => { g.fillStyle = '#5b3b24'; g.fillRect(0, 0, 256, 512); g.strokeStyle = '#141414'; g.lineWidth = 10; for (let x = 20; x < 256; x += 34) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); } for (let y = 30; y < 512; y += 90) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); } });
    cell(3, () => { g.fillStyle = '#ecebe6'; g.fillRect(0, 0, 256, 512); g.strokeStyle = '#cfcdc6'; g.lineWidth = 7; g.strokeRect(30, 30, 196, 200); g.strokeRect(30, 270, 196, 210); g.fillStyle = '#9a9a9a'; g.fillRect(205, 262, 12, 34); });
  });
  // gate atlas (alpha): 0 black bars + gold scrolls, 1 grey sheet + bars, 2 blue sheet, 3 stainless checker + bars
  const gateTex = cv(1024, 512, (g) => {
    g.clearRect(0, 0, 1024, 512);
    const bars = (x0, x1, y0, y1, col, step = 22, lw = 7) => { g.strokeStyle = col; g.lineWidth = lw; for (let x = x0 + 8; x < x1; x += step) { g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1); g.stroke(); } };
    g.save(); g.fillStyle = '#151515'; g.fillRect(0, 300, 256, 212); bars(0, 256, 0, 512, '#151515'); g.strokeStyle = '#c9a54a'; g.lineWidth = 6;
    for (const cx of [64, 192]) { g.beginPath(); g.arc(cx, 380, 34, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(cx, 380, 14, 0, Math.PI * 2); g.stroke(); } g.fillStyle = '#151515'; g.fillRect(0, 0, 256, 16); g.fillRect(0, 290, 256, 14); g.restore();
    g.save(); g.translate(256, 0); g.fillStyle = '#4c5156'; g.fillRect(0, 230, 256, 282); g.fillStyle = 'rgba(255,255,255,.06)'; for (let x = 0; x < 256; x += 32) g.fillRect(x, 230, 3, 282); bars(0, 256, 0, 230, '#3a3e42', 16, 8); g.fillStyle = '#3a3e42'; g.fillRect(0, 0, 256, 14); g.restore();
    g.save(); g.translate(512, 0); g.fillStyle = '#1f5fbf'; g.fillRect(0, 0, 256, 512); g.fillStyle = 'rgba(255,255,255,.1)'; for (let y = 0; y < 512; y += 40) g.fillRect(0, y, 256, 4); g.restore();
    g.save(); g.translate(768, 0); for (let y = 250; y < 512; y += 26) for (let x = 0; x < 256; x += 26) { g.fillStyle = ((x + y) / 26) % 2 ? '#d9dcdf' : '#2b2e31'; g.fillRect(x, y, 26, 26); } bars(0, 256, 0, 250, '#c8ccd0', 20, 7); g.fillStyle = '#c8ccd0'; g.fillRect(0, 0, 256, 12); g.fillRect(0, 244, 256, 10); g.restore();
  }, { clamp: true });
  const railTex = cv(512, 256, (g) => { g.clearRect(0, 0, 512, 256); g.fillStyle = '#161616'; g.fillRect(0, 0, 512, 16); g.fillRect(0, 238, 512, 14); g.fillRect(0, 120, 512, 6); for (let x = 6; x < 512; x += 32) g.fillRect(x, 0, 7, 256); });
  const balTex = cv(512, 256, (g) => { g.clearRect(0, 0, 512, 256); g.fillStyle = '#f1efe8'; g.fillRect(0, 0, 512, 30); g.fillRect(0, 226, 512, 30);
    for (let x = 32; x < 512; x += 64) { g.beginPath(); g.moveTo(x - 9, 30); g.quadraticCurveTo(x - 26, 128, x - 9, 226); g.lineTo(x + 9, 226); g.quadraticCurveTo(x + 26, 128, x + 9, 30); g.fill(); } });
  const stoneTex = cv(512, 512, (g) => { g.fillStyle = '#2e2e2e'; g.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 512; y += 18) for (let x = -Math.random() * 80; x < 512;) { const l = rnd(40, 150), v = rnd(60, 140) | 0; g.fillStyle = `rgb(${v},${v - 4},${v - 10})`; g.fillRect(x, y + 2, l - 3, 14); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x, y + 2, l - 3, 3); x += l; } });
  const tileTex = cv(512, 512, (g) => { g.fillStyle = '#26272a'; g.fillRect(0, 0, 512, 512);
    for (let y = 0, r = 0; y < 512; y += 32, r++) for (let x = (r % 2) * 32; x < 512 + 64; x += 64) { const v = rnd(34, 58) | 0; g.fillStyle = `rgb(${v},${v + 1},${v + 4})`; g.fillRect(x - 31, y, 62, 28); g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(x - 31, y + 26, 62, 6); g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(x - 31, y, 62, 4); } });
  const woodTex = cv(512, 512, (g) => { for (let x = 0; x < 512; x += 32) { const v = rnd(.85, 1.1); g.fillStyle = `rgb(${150 * v | 0},${96 * v | 0},${58 * v | 0})`; g.fillRect(x, 0, 32, 512); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x, 0, 2, 512);
    for (let i = 0; i < 14; i++) { g.strokeStyle = 'rgba(70,40,20,.25)'; g.beginPath(); const yy = Math.random() * 512; g.moveTo(x, yy); g.bezierCurveTo(x + 10, yy + 20, x + 20, yy - 10, x + 32, yy + 15); g.stroke(); } } });
  const paveTex = cv(512, 512, (g) => { g.fillStyle = '#7d7e80'; g.fillRect(0, 0, 512, 512); for (let y = 0, r = 0; y < 512; y += 32, r++) for (let x = (r % 2) * 32; x < 544; x += 64) { const v = rnd(150, 185) | 0; g.fillStyle = `rgb(${v},${v},${v + 3})`; g.fillRect(x - 30, y + 2, 60, 28); } noise(g, 512, 512, 4000, .03, .08); });
  const SHOPS = ['Blessing Phones', "God's Time Provisions", 'Mama Tee Kitchen', 'Success Electronics', 'Divine Pharmacy', 'Grace Fashion House', 'Royal Barbers', 'Victory Spare Parts', 'Favour Supermarket', 'Mercy Hair Salon', 'Kings Pharmacy', 'Golden Bakery', 'Peace Motors', 'Unique Tailoring', 'Faith Printing Press', 'Smart Gadgets'];
  const SIGNC = ['#c8102e', '#0b5394', '#1b7a3e', '#f2c14e', '#6a1b9a', '#e65100', '#0d0d0d', '#00838f'];
  const signTex = cv(1024, 2048, (g, w, h) => { const rh = h / SHOPS.length;
    SHOPS.forEach((n, i) => { const y = i * rh, bg = SIGNC[i % SIGNC.length], light = bg === '#f2c14e'; g.fillStyle = bg; g.fillRect(0, y, w, rh); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(0, y, w, rh * .45);
      g.strokeStyle = light ? '#111' : '#fff'; g.lineWidth = 8; g.strokeRect(10, y + 10, w - 20, rh - 20); g.fillStyle = light ? '#111' : '#fff'; g.font = '800 64px Inter, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(n.toUpperCase(), w / 2, y + rh * .44); g.font = '600 26px Inter, sans-serif'; g.fillText('CHALLENGE, IBADAN  ·  08012345678', w / 2, y + rh * .78); }); }, { clamp: true });
  const blockTex = cv(512, 512, (g) => { g.fillStyle = '#6f6c66'; g.fillRect(0, 0, 512, 512);
    for (let y = 0, r = 0; y < 512; y += 64, r++) for (let x = (r % 2) * 64; x < 576; x += 128) { const v = rnd(150, 178) | 0; g.fillStyle = `rgb(${v},${v - 2},${v - 6})`; g.fillRect(x - 62, y + 3, 124, 58);
      g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x - 40, y + 18, 26, 28); g.fillRect(x + 14, y + 18, 26, 28); } noise(g, 512, 512, 9000, .03, .1); });
  const shut = ptex('shutter'), roofIron = ptex('roof'), wallNor = TL.load('tex/wall_nor.jpg'); wallNor.wrapS = wallNor.wrapT = THREE.RepeatWrapping;

  // ---------------------------------------------------------------- per-house local frame: x along the front, y up, z out of the front
  let H = null;
  const L = (x, y, z) => [H.cx + H.X[0] * x + H.F[0] * z, y, H.cz + H.X[1] * x + H.F[1] * z];
  function box(b, x, y, z, w, h, d, col = WHITE, s = 1 / 3, bottom = false) {
    const x0 = x - w / 2, x1 = x + w / 2, y0 = y - h / 2, y1 = y + h / 2, z0 = z - d / 2, z1 = z + d / 2;
    const uvw = (a, bb) => [0, 0, a * s, 0, a * s, bb * s, 0, bb * s];
    b.quad(L(x0, y0, z1), L(x1, y0, z1), L(x1, y1, z1), L(x0, y1, z1), uvw(w, h), col);   // front
    b.quad(L(x1, y0, z0), L(x0, y0, z0), L(x0, y1, z0), L(x1, y1, z0), uvw(w, h), col);   // back
    b.quad(L(x1, y0, z1), L(x1, y0, z0), L(x1, y1, z0), L(x1, y1, z1), uvw(d, h), col);   // right
    b.quad(L(x0, y0, z0), L(x0, y0, z1), L(x0, y1, z1), L(x0, y1, z0), uvw(d, h), col);   // left
    b.quad(L(x0, y1, z1), L(x1, y1, z1), L(x1, y1, z0), L(x0, y1, z0), uvw(w, d), col);   // top
    if (bottom) b.quad(L(x0, y0, z0), L(x1, y0, z0), L(x1, y0, z1), L(x0, y0, z1), uvw(w, d), col);
  }
  // the four outer faces of a w x d block: origin, tangent and normal (local)
  const faces = (w, d) => ({ front: { o: [-w / 2, d / 2], t: [1, 0], n: [0, 1], len: w }, back: { o: [w / 2, -d / 2], t: [-1, 0], n: [0, -1], len: w },
    right: { o: [w / 2, d / 2], t: [0, -1], n: [1, 0], len: d }, left: { o: [-w / 2, -d / 2], t: [0, 1], n: [-1, 0], len: d } });
  const FP = (f, s, y, off = 0) => L(f.o[0] + f.t[0] * s + f.n[0] * off, y, f.o[1] + f.t[1] * s + f.n[1] * off);
  function faceQuad(b, f, s0, s1, y0, y1, off, uv, col) { b.quad(FP(f, s0, y0, off), FP(f, s1, y0, off), FP(f, s1, y1, off), FP(f, s0, y1, off), uv, col); }
  function faceBox(b, f, s, y, off, w, h, d, col, sc) {          // a box sitting on a face, w along the face
    const cx = f.o[0] + f.t[0] * s + f.n[0] * off, cz = f.o[1] + f.t[1] * s + f.n[1] * off;
    if (f.t[0]) box(b, cx, y, cz, w, h, d, col, sc); else box(b, cx, y, cz, d, h, w, col, sc);
  }
  const atlas4 = (i) => { const u0 = (i % 2) / 2, v0 = 1 - ((i / 2 | 0) + 1) / 2; return [u0, v0, u0 + .5, v0, u0 + .5, v0 + .5, u0, v0 + .5]; };
  const strip4 = (i) => [i / 4, 0, (i + 1) / 4, 0, (i + 1) / 4, 1, i / 4, 1];
  function wallBlock(b, w, d, h, col, sc = 1 / 3) {
    for (const f of Object.values(faces(w, d))) faceQuad(b, f, 0, f.len, 0, h, 0, [0, 0, f.len * sc, 0, f.len * sc, h * sc, 0, h * sc], col);
  }
  function windows(f, floors, fh, style, { skip = [], from = 0, sill = true, wW = 1.25, wH = 1.35, y0 = 1.0, every = 3.2 } = {}) {
    const n = Math.floor((f.len - 1.2) / every); if (n < 1) return;
    const gap = (f.len - n * every) / 2;
    for (let fl = from; fl < floors; fl++) for (let i = 0; i < n; i++) {
      const s = gap + every * (i + .5); if (skip.some(([a, z]) => s > a && s < z && fl === 0)) continue;
      const yb = fl * fh + y0;
      faceQuad(B.win, f, s - wW / 2, s + wW / 2, yb, yb + wH, .03, atlas4(style));
      if (sill) faceBox(B.trim, f, s, yb - .05, .07, wW + .2, .08, .16, C(0xe9e7e0));
    }
  }
  function hipRoof(b, w, d, y0, rise, col, over = .5, sc = 1 / 2.4) {
    const W2 = w / 2 + over, D2 = d / 2 + over, y1 = y0 + rise;
    if (W2 >= D2) { const rx = W2 - D2;
      b.quad(L(-W2, y0, D2), L(W2, y0, D2), L(rx, y1, 0), L(-rx, y1, 0), [0, 0, 2 * W2 * sc, 0, (W2 + rx) * sc, D2 * 1.2 * sc, (W2 - rx) * sc, D2 * 1.2 * sc], col);
      b.quad(L(W2, y0, -D2), L(-W2, y0, -D2), L(-rx, y1, 0), L(rx, y1, 0), [0, 0, 2 * W2 * sc, 0, (W2 + rx) * sc, D2 * 1.2 * sc, (W2 - rx) * sc, D2 * 1.2 * sc], col);
      b.tri(L(W2, y0, D2), L(W2, y0, -D2), L(rx, y1, 0), [0, 0], [2 * D2 * sc, 0], [D2 * sc, D2 * 1.2 * sc], col);
      b.tri(L(-W2, y0, -D2), L(-W2, y0, D2), L(-rx, y1, 0), [0, 0], [2 * D2 * sc, 0], [D2 * sc, D2 * 1.2 * sc], col);
    } else { const rz = D2 - W2;
      b.quad(L(W2, y0, D2), L(W2, y0, -D2), L(0, y1, -rz), L(0, y1, rz), [0, 0, 2 * D2 * sc, 0, (D2 + rz) * sc, W2 * 1.2 * sc, (D2 - rz) * sc, W2 * 1.2 * sc], col);
      b.quad(L(-W2, y0, -D2), L(-W2, y0, D2), L(0, y1, rz), L(0, y1, -rz), [0, 0, 2 * D2 * sc, 0, (D2 + rz) * sc, W2 * 1.2 * sc, (D2 - rz) * sc, W2 * 1.2 * sc], col);
      b.tri(L(-W2, y0, D2), L(W2, y0, D2), L(0, y1, rz), [0, 0], [2 * W2 * sc, 0], [W2 * sc, W2 * 1.2 * sc], col);
      b.tri(L(W2, y0, -D2), L(-W2, y0, -D2), L(0, y1, -rz), [0, 0], [2 * W2 * sc, 0], [W2 * sc, W2 * 1.2 * sc], col);
    }
    const fc = C(0x3a3632), t = .28;                       // fascia boards under the eaves
    box(B.trim, 0, y0 - .12, D2, 2 * W2, t, .06, fc); box(B.trim, 0, y0 - .12, -D2, 2 * W2, t, .06, fc);
    box(B.trim, W2, y0 - .12, 0, .06, t, 2 * D2, fc); box(B.trim, -W2, y0 - .12, 0, .06, t, 2 * D2, fc);
  }
  function railing(f, s0, s1, y, off, kind = 'rail', h = 1.05) { faceQuad(kind === 'rail' ? B.rail : B.bal, f, s0, s1, y, y + h, off, [0, 0, (s1 - s0) / (kind === 'rail' ? 1.1 : 1.0), 0, (s1 - s0) / (kind === 'rail' ? 1.1 : 1.0), 1, 0, 1]); }
  const CLOTH = [0xd94141, 0x2f6fd1, 0xf2c14e, 0x3d9a5a, 0xffffff, 0x8e44ad, 0xe67e22, 0x1f1f1f, 0xf28cb1, 0x6bc6e8].map(C);
  function clothes(f, s0, s1, y, off) {
    for (let s = s0 + .3; s < s1 - .5; s += rnd(.7, 1.6)) { if (Math.random() < .35) continue; const w = rnd(.4, .8), h = rnd(.6, 1.2), col = pick(CLOTH);
      faceQuad(B.cloth, f, s, s + w, y - h, y, off + rnd(-.05, .05), [0, 0, 1, 0, 1, 1, 0, 1], col); }
  }

  // ---------------------------------------------------------------- house footprints -> oriented rectangles facing their street
  const roadSegs = []; for (const r of W.roads) for (let i = 1; i < r.p.length; i++) roadSegs.push({ a: r.p[i - 1], b: r.p[i], w: r.w, major: r.w >= 12 });
  const RG = new Map(), RC = 30, rk = (x, z) => `${Math.floor(x / RC)},${Math.floor(z / RC)}`;
  for (const s of roadSegs) { const n = Math.ceil(Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]) / 10) + 1;
    for (let i = 0; i <= n; i++) { const k = rk(s.a[0] + (s.b[0] - s.a[0]) * i / n, s.a[1] + (s.b[1] - s.a[1]) * i / n); const l = RG.get(k) || RG.set(k, new Set()).get(k); l.add(s); } }
  function nearestRoad(x, z, majorOnly = false) {
    let best = null; const cx = Math.floor(x / RC), cz = Math.floor(z / RC);
    for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { const l = RG.get(`${cx + dx},${cz + dz}`); if (!l) continue;
      for (const s of l) { if (majorOnly && !s.major) continue; const ex = s.b[0] - s.a[0], ez = s.b[1] - s.a[1], ll = ex * ex + ez * ez || 1; let t = ((x - s.a[0]) * ex + (z - s.a[1]) * ez) / ll; t = Math.max(0, Math.min(1, t));
        const qx = s.a[0] + ex * t, qz = s.a[1] + ez * t, d = Math.hypot(x - qx, z - qz) - s.w / 2; if (!best || d < best.d) best = { d, qx, qz, s }; } }
    return best;
  }
  const houses = [];
  for (const b of W.buildings) {
    const p = b.p; let best = 0, ux = 1, uz = 0;
    for (let i = 0; i < p.length; i++) { const a = p[i], c = p[(i + 1) % p.length], l = Math.hypot(c[0] - a[0], c[1] - a[1]); if (l > best) { best = l; ux = (c[0] - a[0]) / l; uz = (c[1] - a[1]) / l; } }
    const vx = -uz, vz = ux; let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9;
    for (const q of p) { const a = q[0] * ux + q[1] * uz, bb = q[0] * vx + q[1] * vz; a0 = Math.min(a0, a); a1 = Math.max(a1, a); b0 = Math.min(b0, bb); b1 = Math.max(b1, bb); }
    const am = (a0 + a1) / 2, bm = (b0 + b1) / 2, cx = ux * am + vx * bm, cz = uz * am + vz * bm;
    let A = (a1 - a0) * .96, Bd = (b1 - b0) * .96; if (A < 4 || Bd < 4) continue;
    const nr = nearestRoad(cx, cz); if (!nr) continue;
    const dx = nr.qx - cx, dz = nr.qz - cz, dl = Math.hypot(dx, dz) || 1, rx = dx / dl, rz = dz / dl;
    const opts = [[ux, uz, Bd, A], [-ux, -uz, Bd, A], [vx, vz, A, Bd], [-vx, -vz, A, Bd]];   // [front normal, width, depth]
    let o = opts[0], bd = -2; for (const op of opts) { const dt = op[0] * rx + op[1] * rz; if (dt > bd) { bd = dt; o = op; } }
    const F = [o[0], o[1]], X = [F[1], -F[0]], w = Math.min(o[2], 34), d = Math.min(o[3], 26);
    const major = nearestRoad(cx, cz, true), dMaj = major ? major.d : 1e9, area = w * d;
    let type;
    if (dMaj < 20 && bd > .6) type = Math.random() < .6 ? 'shophouse' : (w > 7 ? 'faceme' : 'shophouse');
    else if (Math.random() < .07) type = 'unfinished';
    else if (area < 130 && Math.random() < .28) type = 'oldcore';
    else if (area < 70) type = 'bungalow';
    else if (area < 240) { const r = Math.random(); type = r < .55 ? 'bungalow' : r < .78 ? 'duplex' : 'faceme'; }
    else type = Math.random() < .4 ? 'tenement' : 'faceme';
    houses.push({ cx, cz, F, X, w, d, type, dRoad: nr.d });
  }
  // grid of house rectangles (for compound-wall checks)
  const HG = new Map(), HC = 24, hk = (x, z) => `${Math.floor(x / HC)},${Math.floor(z / HC)}`;
  houses.forEach((h, i) => { const r = Math.hypot(h.w, h.d) / 2; for (let x = h.cx - r; x <= h.cx + r + HC; x += HC) for (let z = h.cz - r; z <= h.cz + r + HC; z += HC) { const k = hk(x, z); (HG.get(k) || HG.set(k, []).get(k)).push(i); } });
  const inHouse = (x, z, self, pad = 0) => { const l = HG.get(hk(x, z)); if (!l) return false;
    for (const i of l) { if (i === self) continue; const h = houses[i], ddx = x - h.cx, ddz = z - h.cz, lx = ddx * h.X[0] + ddz * h.X[1], lz = ddx * h.F[0] + ddz * h.F[1];
      if (Math.abs(lx) < h.w / 2 + pad && Math.abs(lz) < h.d / 2 + pad) return true; } return false; };
  const onRoad = (x, z) => { const r = nearestRoad(x, z); return r && r.d < .6; };
  const corners = (hw, hd) => [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([a, b]) => [H.cx + H.X[0] * a + H.F[0] * b, H.cz + H.X[1] * a + H.F[1] * b]);

  // ---------------------------------------------------------------- compound wall + gate (bungalows, duplexes)
  const fencePts = [], tankSpots = [], drumSpots = [], genSpots = [], doors = [];
  function compound(i, gateStyle, wallCol, pillarCol, tall = 2.1) {
    const h = H;
    for (const [mx, mf, mb] of [[2.2, 3.6, 1.6], [1.4, 2.6, 1]]) {
      const x0 = -h.w / 2 - mx, x1 = h.w / 2 + mx, z0 = -h.d / 2 - mb, z1 = h.d / 2 + mf; let ok = true;
      for (let t = 0; t <= 1 && ok; t += 1 / 14) for (const [lx, lz] of [[x0 + (x1 - x0) * t, z0], [x0 + (x1 - x0) * t, z1], [x0, z0 + (z1 - z0) * t], [x1, z0 + (z1 - z0) * t]]) {
        const [wx, , wz] = L(lx, 0, lz); if (inHouse(wx, wz, i, .3) || onRoad(wx, wz)) { ok = false; break; } }
      if (!ok) continue;
      const gw = Math.min(3.6, (x1 - x0) * .4), gx = 0, th = .22, segs = [[x0, z1, gx - gw / 2, z1], [gx + gw / 2, z1, x1, z1], [x1, z1, x1, z0], [x1, z0, x0, z0], [x0, z0, x0, z1]];
      for (const [ax, az, bx, bz] of segs) {
        const len = Math.hypot(bx - ax, bz - az); if (len < .3) continue; const mxx = (ax + bx) / 2, mzz = (az + bz) / 2, alongX = Math.abs(bx - ax) > Math.abs(bz - az);
        box(B.paint, mxx, tall / 2, mzz, alongX ? len : th, tall, alongX ? th : len, wallCol);
        box(B.trim, mxx, tall + .04, mzz, alongX ? len : th + .08, .08, alongX ? th + .08 : len, C(0xeeeeea));
        const np = Math.max(1, Math.round(len / 3.2));
        for (let k = 0; k <= np; k++) { const px = ax + (bx - ax) * k / np, pz = az + (bz - az) * k / np; box(B.trim, px, (tall + .25) / 2, pz, .42, tall + .25, .42, pillarCol); box(B.trim, px, tall + .3, pz, .52, .1, .52, C(0xf4f4f0)); }
        const cr = alongX ? [[ax, az - th / 2], [bx, az - th / 2], [bx, az + th / 2], [ax, az + th / 2]] : [[ax - th / 2, az], [ax + th / 2, az], [ax + th / 2, bz], [ax - th / 2, bz]];
        addRect(cr.map(([lx, lz]) => { const q = L(lx, 0, lz); return [q[0], q[2]]; }));
        if (gateStyle !== 1 && Math.random() < .7) for (const hh of [tall + .35, tall + .6, tall + .85]) { const p0 = L(ax, hh, az), p1 = L(bx, hh, bz); fencePts.push(...p0, ...p1); }
      }
      // gate: two leaves standing open, so Frank can walk in
      for (const sgn of [-1, 1]) { const hx = gx + sgn * gw / 2, ang = sgn * 1.25, lw = gw / 2, ex = hx - sgn * Math.cos(ang) * lw, ez = z1 - Math.sin(Math.abs(ang)) * lw;
        const a = L(hx, 0, z1), bb = L(ex, 0, ez), uv = strip4(gateStyle); const gh = tall + .5;
        B.gate.quad([a[0], 0, a[2]], [bb[0], 0, bb[2]], [bb[0], gh, bb[2]], [a[0], gh, a[2]], sgn > 0 ? uv : [uv[2], uv[3], uv[0], uv[1], uv[6], uv[7], uv[4], uv[5]]); }
      faceQuad(B.pave, { o: [x0, z1], t: [1, 0], n: [0, 1], len: x1 - x0 }, 0, 0, 0, 0, 0);           // (no-op guard)
      B.pave.quad(L(x0 + th, .03, z1 - th), L(x1 - th, .03, z1 - th), L(x1 - th, .03, z0 + th), L(x0 + th, .03, z0 + th), [0, 0, (x1 - x0) / 2, 0, (x1 - x0) / 2, (z1 - z0) / 2, 0, (z1 - z0) / 2]);
      if (Math.random() < .5) { const q = L(x1 - 1.2, 0, z0 + 1.2); tankSpots.push([q[0], 3.4, q[2], true]); }
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- the five house types
  const PAINT = [0xb9bcbf, 0xd5d7d8, 0xf2f2ef, 0xeadcbf, 0xc9ccce, 0xe6e1d6].map(C);
  const BRIGHT = [0xeadcbf, 0xf0d98c, 0xf0c9a8, 0xbcd8b7, 0xbcd3e6, 0xd9c27a, 0x9bb08a, 0xe8c3c0, 0xf2f2ef].map(C);
  const OLD = [0xd8cfa0, 0xc8c4b8, 0xa9b49a, 0xd9b99a, 0xbfc4c8].map(C);
  const IRONC = [C(0xffffff), C(0xffffff), C(0xc8a090), C(0x9bb7d8), C(0xb9c9a8)];
  function bungalow(i) {
    const h = H, wall = 3.3, col = pick(PAINT), trimC = C(0xf3f3ef), modern = Math.random() < .65;
    wallBlock(B.paint, h.w, h.d, wall, col);
    box(B.trim, 0, .25, 0, h.w + .1, .5, h.d + .1, C(0x6f7275));
    box(B.trim, 0, wall - .15, 0, h.w + .14, .3, h.d + .14, trimC);
    const f = faces(h.w, h.d), pw = Math.min(3.6, h.w * .38), ps = h.w / 2;
    // porch: stone-clad frame + pillars + its own little roof
    const pd = 1.7; box(B.stone, -pw / 2, wall / 2, h.d / 2 + pd / 2, .5, wall, .5, WHITE, 1 / 1.2); box(B.stone, pw / 2, wall / 2, h.d / 2 + pd / 2, .5, wall, .5, WHITE, 1 / 1.2);
    faceQuad(B.stone, f.front, ps - pw / 2 - .35, ps + pw / 2 + .35, 0, wall, .02, [0, 0, (pw + .7) / 1.2, 0, (pw + .7) / 1.2, wall / 1.2, 0, wall / 1.2]);
    box(B.trim, 0, wall + .05, h.d / 2 + pd / 2, pw + .9, .3, pd + .4, trimC);
    box(B.trim, 0, .12, h.d / 2 + .55, pw + .4, .24, 1.1, C(0x2c2d2f)); box(B.trim, 0, .06, h.d / 2 + 1.25, pw + .8, .12, .5, C(0x2c2d2f));
    faceQuad(B.door, f.front, ps - .55, ps + .55, .24, 2.45, .05, strip4(modern ? 0 : 1));
    windows(f.front, 1, wall, 0, { skip: [[ps - pw / 2 - .8, ps + pw / 2 + .8]], wW: 1.2, wH: 1.3 });
    for (const k of ['left', 'right', 'back']) windows(f[k], 1, wall, 0, { wW: 1.1, wH: 1.2, every: 3.6 });
    hipRoof(modern ? B.tile : B.iron, h.w, h.d, wall + .3, Math.min(2.8, Math.min(h.w, h.d) * .38), modern ? WHITE : pick(IRONC), .55);
    if (modern) hipRoof(B.tile, pw + .9, pd + .4, wall + .2, .9, WHITE, .1);
    doors.push({ ...door(f.front, ps, .1), layout: 'house', seed: Math.random() });
    compound(i, pick([0, 0, 3, 1, 2]), pick([C(0x9fa3a6), C(0xc9ccce), C(0xe3ddd0), C(0x9a8f86)]), Math.random() < .3 ? C(0x7b3b33) : C(0xf2f2ee));
  }
  function duplex(i) {
    const h = H, fh = 3.3, ht = fh * 2, col = C(0xf6f6f3), f = faces(h.w, h.d);
    wallBlock(B.paint, h.w, h.d, ht, col);
    box(B.trim, 0, .2, 0, h.w + .1, .4, h.d + .1, C(0x5e6164));
    const sw = Math.min(h.w * .62, 9), sx = h.w * .12;              // first-floor slab with wood soffit + glass balcony
    box(B.slab, sx, fh - .1, h.d / 2 + .8, sw, .32, 1.6, C(0xf8f8f5));
    B.wood.quad(L(sx - sw / 2, fh - .27, h.d / 2), L(sx + sw / 2, fh - .27, h.d / 2), L(sx + sw / 2, fh - .27, h.d / 2 + 1.6), L(sx - sw / 2, fh - .27, h.d / 2 + 1.6), [0, 0, sw / 2, 0, sw / 2, 1, 0, 1]);
    B.glass.quad(L(sx - sw / 2 + .1, fh + .07, h.d / 2 + 1.55), L(sx + sw / 2 - .1, fh + .07, h.d / 2 + 1.55), L(sx + sw / 2 - .1, fh + 1.15, h.d / 2 + 1.55), L(sx - sw / 2 + .1, fh + 1.15, h.d / 2 + 1.55), [0, 0, 1, 0, 1, 1, 0, 1], C(0x9fb8c4));
    box(B.trim, sx - sw / 2 + .2, fh / 2, h.d / 2 + 1.4, .3, fh, .3, C(0xf8f8f5)); box(B.trim, sx + sw / 2 - .2, fh / 2, h.d / 2 + 1.4, .3, fh, .3, C(0xf8f8f5));
    box(B.slab, 0, ht + .1, 0, h.w + .5, .35, h.d + .5, C(0xf8f8f5));
    B.wood.quad(L(-h.w / 2 - .25, ht - .08, -h.d / 2 - .25), L(h.w / 2 + .25, ht - .08, -h.d / 2 - .25), L(h.w / 2 + .25, ht - .08, h.d / 2 + .25), L(-h.w / 2 - .25, ht - .08, h.d / 2 + .25), [0, 0, h.w / 2, 0, h.w / 2, h.d / 2, 0, h.d / 2]);
    const ds = h.w / 2 + sx; faceQuad(B.door, f.front, ds - .6, ds + .6, .4, 2.75, .05, strip4(1));
    box(B.trim, sx, .2, h.d / 2 + 1, 1.6, .4, .8, C(0x3a7a3a));
    windows(f.front, 1, fh, 1, { skip: [[ds - 1.3, ds + 1.3]], wW: 1, wH: 2.2, y0: .5, every: 2.4, sill: false });
    windows(f.front, 2, fh, 1, { from: 1, wW: 1.1, wH: 2.3, y0: .4, every: 2.2, sill: false });
    for (const k of ['left', 'right', 'back']) windows(f[k], 2, fh, 1, { wW: .9, wH: 1.8, y0: .7, every: 3, sill: false });
    hipRoof(B.tile, h.w, h.d, ht + .28, Math.min(2.2, Math.min(h.w, h.d) * .3), WHITE, .3);
    doors.push({ ...door(f.front, ds, .1), layout: 'house', seed: Math.random() });
    compound(i, 1, C(0xf2f2ef), C(0xf2f2ee), 2.3);
  }
  function faceme(i, shops) {
    const h = H, floors = h.d > 14 ? 3 : 2 + (Math.random() < .4 ? 1 : 0), fh = 3.1, ht = floors * fh, col = pick(BRIGHT), f = faces(h.w, h.d), bd = 1.4;
    wallBlock(B.paint, h.w, h.d, ht, col);
    box(B.trim, 0, .2, 0, h.w + .1, .4, h.d + .1, C(0x6a6a66));
    const nc = Math.max(2, Math.round(h.w / 3.6));
    for (let k = 0; k <= nc; k++) box(B.trim, -h.w / 2 + .15 + (h.w - .3) * k / nc, ht / 2, h.d / 2 + bd - .15, .32, ht, .32, col.clone().multiplyScalar(.85));
    for (let fl = 1; fl < floors; fl++) {
      const y = fl * fh; box(B.slab, 0, y - .1, h.d / 2 + bd / 2, h.w + .2, .26, bd, C(0xe8e6de));
      const fr = { o: [-h.w / 2, h.d / 2 + bd - .05], t: [1, 0], n: [0, 1], len: h.w }; railing(fr, 0, h.w, y + .03, 0, 'rail');
      if (Math.random() < .6) clothes(fr, 0, h.w, y + 1.95, -.1);
      const nd = Math.max(2, Math.round(h.w / 3.2)); for (let k = 0; k < nd; k++) { const s = h.w * (k + .5) / nd; faceQuad(B.door, f.front, s - .45, s + .45, y, y + 2.1, .04, strip4(k % 2 ? 1 : 2)); if (h.w / nd > 2.6) faceQuad(B.win, f.front, s + .7, s + 1.6, y + .9, y + 2.1, .04, atlas4(3)); }
    }
    box(B.slab, 0, ht + .05, h.d / 2 + bd / 2, h.w + .3, .2, bd + .2, C(0xe8e6de));
    if (shops) shopFront(f.front, h.w, fh);
    else { const nd = Math.max(2, Math.round(h.w / 3.2)); for (let k = 0; k < nd; k++) { const s = h.w * (k + .5) / nd; faceQuad(B.door, f.front, s - .45, s + .45, 0, 2.1, .04, strip4(2)); } doors.push({ ...door(f.front, h.w * .5 / nd, .1), layout: 'room', seed: Math.random() }); }
    for (const k of ['left', 'right', 'back']) windows(f[k], floors, fh, 3, { wW: 1, wH: 1.2, every: 3.4 });
    hipRoof(B.iron, h.w, h.d + bd, ht + .3, 1.6, pick(IRONC), .4);
    if (Math.random() < .5) { const q = L(h.w / 2 + .8, 0, -h.d / 2 + 1); drumSpots.push([q[0], q[2]]); }
  }
  function tenement(i) {
    const h = H, floors = 3 + (Math.random() < .4 ? 1 : 0), fh = 3, ht = floors * fh, col = pick(OLD), f = faces(h.w, h.d), bd = 1.3;
    wallBlock(B.old, h.w, h.d, ht, col);
    const nc = Math.max(2, Math.round(h.w / 3.4));
    for (let k = 0; k <= nc; k++) box(B.old, -h.w / 2 + .15 + (h.w - .3) * k / nc, ht / 2, h.d / 2 + bd - .15, .34, ht, .34, col.clone().multiplyScalar(.9));
    for (let fl = 1; fl <= floors; fl++) {
      const y = fl * fh; box(B.old, 0, y - .1, h.d / 2 + bd / 2, h.w + .2, .3, bd, col.clone().multiplyScalar(.82));
      if (fl === floors) break;
      const fr = { o: [-h.w / 2, h.d / 2 + bd - .05], t: [1, 0], n: [0, 1], len: h.w };
      box(B.old, 0, y + .35, h.d / 2 + bd - .06, h.w, .7, .12, col.clone().multiplyScalar(.75)); railing(fr, 0, h.w, y + .7, .02, 'rail', .5);
      clothes(fr, 0, h.w, y + 2.1, -.15);
      const nd = Math.max(2, Math.round(h.w / 3)); for (let k = 0; k < nd; k++) { const s = h.w * (k + .5) / nd; faceQuad(B.door, f.front, s - .45, s + .45, y, y + 2.1, .04, strip4(2)); faceQuad(B.win, f.front, s + .6, s + 1.4, y + 1, y + 2, .04, atlas4(2)); }
    }
    const nd = Math.max(2, Math.round(h.w / 3)); for (let k = 0; k < nd; k++) { const s = h.w * (k + .5) / nd; faceQuad(B.door, f.front, s - .45, s + .45, 0, 2.1, .04, strip4(2)); }
    doors.push({ ...door(f.front, h.w * .5 / nd, .1), layout: 'room', seed: Math.random() });
    for (const k of ['left', 'right', 'back']) windows(f[k], floors, fh, 2, { wW: .9, wH: 1, every: 3, sill: false });
    hipRoof(B.iron, h.w, h.d + bd, ht + .2, .9, C(0xb08070), .5);
    for (let k = 0; k < 3; k++) { const q = L(rnd(-h.w / 2, h.w / 2), 0, h.d / 2 + bd + .6); drumSpots.push([q[0], q[2]]); }
  }
  function shopFront(f, w, fh) {
    const n = Math.max(1, Math.round(w / 3.5));
    for (let k = 0; k < n; k++) {
      const s0 = w * k / n + .15, s1 = w * (k + 1) / n - .15, sl = s1 - s0;
      faceQuad(B.shutter, f, s0, s1, .05, 2.75, .05, [0, 0, sl / 3, 0, sl / 3, 1, 0, 1]);
      const si = (Math.random() * SHOPS.length) | 0, v0 = 1 - (si + 1) / SHOPS.length, v1 = 1 - si / SHOPS.length;
      faceQuad(B.sign, f, s0, s1, 2.9, 3.6, .16, [0, v0, 1, v0, 1, v1, 0, v1]);
      const ac = pick([0x1d6fa3, 0xc0392b, 0x2e8b57, 0xd4a017, 0x8e44ad, 0xe67e22, 0x7f8c8d]);
      B.awn.quad(FP(f, s0, 2.82, .1), FP(f, s1, 2.82, .1), FP(f, s1, 2.42, 1.45), FP(f, s0, 2.42, 1.45), [0, 0, sl / 2, 0, sl / 2, 1, 0, 1], C(ac));
      if (k === 0) doors.push({ ...door(f, (s0 + s1) / 2, .2), layout: 'shop', seed: Math.random() });
      if (Math.random() < .25) { const q = FP(f, (s0 + s1) / 2, 0, 1.1); genSpots.push([q[0], q[2], Math.atan2(H.F[0], H.F[1])]); }
    }
  }
  function shophouse(i) {
    const h = H, fh = 3.2, floors = 2, ht = fh * floors, col = pick(BRIGHT), f = faces(h.w, h.d), bd = 1.2;
    wallBlock(B.paint, h.w, h.d, ht, col);
    shopFront(f.front, h.w, fh);
    box(B.slab, 0, fh - .05, h.d / 2 + bd / 2, h.w + .2, .3, bd, col.clone().multiplyScalar(.8));
    const fr = { o: [-h.w / 2, h.d / 2 + bd - .05], t: [1, 0], n: [0, 1], len: h.w }; railing(fr, .1, h.w - .1, fh + .1, 0, 'bal', .9);
    windows(f.front, 2, fh, Math.random() < .5 ? 3 : 0, { from: 1, wW: 1.4, wH: 1.4, every: 2.8 });
    for (const k of ['left', 'right', 'back']) windows(f[k], 2, fh, 3, { wW: 1, wH: 1.2, every: 3.4 });
    box(B.slab, 0, ht + .05, h.d / 2 + bd / 2, h.w + .3, .2, bd + .3, col.clone().multiplyScalar(.75));
    hipRoof(B.iron, h.w, h.d + bd, ht + .3, 1.5, pick(IRONC), .45);
  }
  function unfinished(i) {
    const h = H, f = faces(h.w, h.d), ht = 3, two = h.w * h.d > 90 && Math.random() < .6, sc = 1 / 1.6;
    wallBlock(B.block, h.w, h.d, ht, WHITE, sc);
    if (two) { const f2 = faces(h.w, h.d); for (const k of ['front', 'left']) faceQuad(B.block, f2[k], 0, f2[k].len * .6, ht, ht + 2.2, 0, [0, 0, f2[k].len * .6 * sc, 0, f2[k].len * .6 * sc, 2.2 * sc, 0, 2.2 * sc]); }
    for (const fc of Object.values(f)) { const n = Math.max(1, Math.floor(fc.len / 3.5)); for (let k = 0; k < n; k++) { const s = fc.len * (k + .5) / n; faceQuad(B.door, fc, s - .6, s + .6, 1, 2.2, .02, [.01, .5, .02, .5, .02, .51, .01, .51]); } }
    faceQuad(B.door, f.front, h.w / 2 - .6, h.w / 2 + .6, 0, 2.3, .03, [.01, .5, .02, .5, .02, .51, .01, .51]);
    const cs = [[-h.w / 2, -h.d / 2], [h.w / 2, -h.d / 2], [h.w / 2, h.d / 2], [-h.w / 2, h.d / 2], [0, h.d / 2], [0, -h.d / 2]];
    for (const [x, z] of cs) box(B.trim, x, (ht + (two ? 3.6 : 1.4)) / 2, z, .32, ht + (two ? 3.6 : 1.4), .32, C(0x8f8b84));
    box(B.trim, 0, ht + .12, 0, h.w + .1, .24, h.d + .1, C(0x9a968e));
    for (let k = 0; k < 14; k++) { const x = rnd(-h.w / 2 - 2.5, h.w / 2 + 2.5), z = rnd(-h.d / 2 - 2.5, h.d / 2 + 2.5); if (Math.abs(x) < h.w / 2 + .3 && Math.abs(z) < h.d / 2 + .3) continue;
      const w = rnd(.8, 1.8), hh = rnd(.3, .9); box(B.grass, x, hh / 2, z, w, hh, w * rnd(.6, 1.2), C(0x4f7a2e).multiplyScalar(rnd(.8, 1.15)), .5); }
  }
  function oldcore(i) {
    const h = H, f = faces(h.w, h.d), ht = 3, col = pick([C(0xb07a52), C(0x9c6b48), C(0xc08f62), C(0xa98463), C(0x8f6a4f)]);
    wallBlock(B.old, h.w, h.d, ht, col);
    for (const k of ['front', 'left', 'right', 'back']) windows(f[k], 1, ht, 3, { wW: .8, wH: 1, every: 3, sill: false, y0: 1.1 });
    faceQuad(B.door, f.front, h.w / 2 - .45, h.w / 2 + .45, 0, 2.1, .03, strip4(1));
    box(B.old, 0, .2, h.d / 2 + .6, h.w * .6, .4, 1.2, col.clone().multiplyScalar(.8));
    hipRoof(B.iron, h.w, h.d, ht + .05, Math.min(1.6, Math.min(h.w, h.d) * .3), pick([C(0xb07050), C(0xc08060), C(0xffffff), C(0x9a6a50)]), .7);
    doors.push({ ...door(f.front, h.w / 2, .1), layout: 'room', seed: Math.random() });
  }
  function door(f, s, off) { const q = FP(f, s, 0, off + .9); return { x: q[0], z: q[2], nx: H.F[0], nz: H.F[1] }; }

  for (let i = 0; i < houses.length; i++) {
    H = houses[i]; const t = H.type;
    if (t === 'unfinished') unfinished(i); else if (t === 'oldcore') oldcore(i); else if (t === 'bungalow') bungalow(i); else if (t === 'duplex') duplex(i); else if (t === 'faceme') faceme(i, H.dRoad < 20 && Math.random() < .5); else if (t === 'tenement') tenement(i); else shophouse(i);
    const bd = t === 'faceme' || t === 'tenement' || t === 'shophouse' ? 1.4 : 0;
    addRect(corners(H.w / 2, H.d / 2).map(([x, z], k) => k >= 2 ? [x + H.F[0] * bd, z + H.F[1] * bd] : [x, z]));
  }

  // ---------------------------------------------------------------- materials, one mesh each
  const std = (o) => new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, ...o });
  B.block.mesh(std({ map: blockTex, roughness: 1, vertexColors: true }));
  B.grass.mesh(std({ roughness: 1, vertexColors: true }));
  B.paint.mesh(std({ map: plaster, normalMap: wallNor, roughness: .92, vertexColors: true }));
  B.old.mesh(std({ map: oldCon, roughness: 1, vertexColors: true }));
  B.trim.mesh(std({ roughness: .8, vertexColors: true }));
  B.slab.mesh(std({ map: plaster, roughness: .85, vertexColors: true }));
  B.win.mesh(std({ map: winTex, roughness: .25, metalness: .25 }), false);
  B.door.mesh(std({ map: doorTex, roughness: .6 }), false);
  B.stone.mesh(std({ map: stoneTex, roughness: .85 }));
  B.tile.mesh(std({ map: tileTex, roughness: .7, vertexColors: true }));
  B.iron.mesh(std({ ...roofIron, roughness: .7, metalness: .35, vertexColors: true }));
  B.rail.mesh(std({ map: railTex, alphaTest: .5, roughness: .5, metalness: .5 }), true);
  B.bal.mesh(std({ map: balTex, alphaTest: .5, roughness: .8 }), true);
  B.glass.mesh(new THREE.MeshPhysicalMaterial({ color: 0xbcd4dc, transparent: true, opacity: .35, roughness: .05, metalness: .1, side: THREE.DoubleSide, depthWrite: false }), false);
  B.wood.mesh(std({ map: woodTex, roughness: .7 }), false);
  B.gate.mesh(std({ map: gateTex, alphaTest: .45, roughness: .45, metalness: .5 }));
  B.pave.mesh(std({ map: paveTex, roughness: .9 }), false);
  B.cloth.mesh(std({ roughness: 1, vertexColors: true }));
  B.shutter.mesh(std({ ...shut, metalness: .5 }));
  B.sign.mesh(std({ map: signTex, roughness: .55 }), false);
  B.awn.mesh(std({ roughness: .8, vertexColors: true }));
  if (fencePts.length) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(fencePts, 3)); scene.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x9a9da0 }))); }
  // water tanks on steel stands, blue drums, generators (instanced)
  const mtx = new THREE.Matrix4();
  const tankGeo = new THREE.CylinderGeometry(.62, .66, 1.35, 16); tankGeo.translate(0, .68, 0);
  const tanks = new THREE.InstancedMesh(tankGeo, new THREE.MeshStandardMaterial({ color: 0x151515, roughness: .45 }), tankSpots.length);
  const standGeo = new THREE.BoxGeometry(1.6, .12, 1.6); const stands = new THREE.InstancedMesh(standGeo, new THREE.MeshStandardMaterial({ color: 0x8c9196, metalness: .7, roughness: .4 }), tankSpots.length);
  const legGeo = new THREE.CylinderGeometry(.05, .05, 3.4, 5); legGeo.translate(0, 1.7, 0); const legs = new THREE.InstancedMesh(legGeo, new THREE.MeshStandardMaterial({ color: 0x8c9196, metalness: .7 }), tankSpots.length * 4);
  tankSpots.forEach(([x, y, z], k) => { mtx.makeTranslation(x, y, z); tanks.setMatrixAt(k, mtx); mtx.makeTranslation(x, y - .05, z); stands.setMatrixAt(k, mtx);
    [[-.7, -.7], [.7, -.7], [.7, .7], [-.7, .7]].forEach(([a, b], j) => { mtx.makeTranslation(x + a, 0, z + b); legs.setMatrixAt(k * 4 + j, mtx); }); });
  for (const m of [tanks, stands, legs]) { m.castShadow = true; scene.add(m); }
  const drumGeo = new THREE.CylinderGeometry(.3, .3, .9, 12); drumGeo.translate(0, .45, 0);
  const drums = new THREE.InstancedMesh(drumGeo, new THREE.MeshStandardMaterial({ color: 0x1e5fb4, roughness: .5 }), drumSpots.length);
  drumSpots.forEach(([x, z], k) => { mtx.makeTranslation(x, 0, z); drums.setMatrixAt(k, mtx); }); drums.castShadow = true; scene.add(drums);
  const genGeo = new THREE.BoxGeometry(1, .7, .6); genGeo.translate(0, .38, 0);
  const gens = new THREE.InstancedMesh(genGeo, new THREE.MeshStandardMaterial({ color: 0xc23a2a, roughness: .5, metalness: .3 }), genSpots.length);
  genSpots.forEach(([x, z, r], k) => { mtx.makeRotationY(r).setPosition(x, 0, z); gens.setMatrixAt(k, mtx); }); gens.castShadow = true; scene.add(gens);

  const count = {}; houses.forEach(h => count[h.type] = (count[h.type] || 0) + 1);
  return { houses, doors, count };
}
