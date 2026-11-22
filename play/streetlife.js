// Street life from the player's photos: kekes, okadas, open gutters with slabs, kiosks, POS umbrellas, fruit tables,
// roadside sheds, a neighbourhood mosque and a mechanic yard. Static props are merged into a few meshes.
export function buildStreetLife(ctx) {
  const { THREE, scene, W, blocked, addRect, canvasTex, ptex, majSegs, vehicle, start } = ctx;
  const rnd = (a, b) => a + Math.random() * (b - a), pick = (a) => a[(Math.random() * a.length) | 0], C = (h) => new THREE.Color(h);

  class Batch { constructor() { this.p = []; this.u = []; this.c = []; }
    quad(a, b, c, d, uv, col) { const [u0, v0, u1, v1, u2, v2, u3, v3] = uv || [0, 0, 1, 0, 1, 1, 0, 1]; this.p.push(...a, ...b, ...c, ...a, ...c, ...d); this.u.push(u0, v0, u1, v1, u2, v2, u0, v0, u2, v2, u3, v3); for (let k = 0; k < 6; k++) this.c.push(col.r, col.g, col.b); }
    mesh(mat) { if (!this.p.length) return; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.computeVertexNormals();
      const m = new THREE.Mesh(g, mat); m.castShadow = m.receiveShadow = true; scene.add(m); return m; } }
  const B = { col: new Batch(), iron: new Batch(), con: new Batch(), sign: new Batch() };
  // oriented box: centre (x,y,z), size, rotation about y
  function box(b, x, y, z, w, h, d, ry, col, s = .5) {
    const c = Math.cos(ry), sn = Math.sin(ry), P = (lx, ly, lz) => [x + lx * c + lz * sn, y + ly, z - lx * sn + lz * c];
    const x0 = -w / 2, x1 = w / 2, y0 = -h / 2, y1 = h / 2, z0 = -d / 2, z1 = d / 2, uv = (a, bb) => [0, 0, a * s, 0, a * s, bb * s, 0, bb * s];
    b.quad(P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1), uv(w, h), col); b.quad(P(x1, y0, z0), P(x0, y0, z0), P(x0, y1, z0), P(x1, y1, z0), uv(w, h), col);
    b.quad(P(x1, y0, z1), P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), uv(d, h), col); b.quad(P(x0, y0, z0), P(x0, y0, z1), P(x0, y1, z1), P(x0, y1, z0), uv(d, h), col);
    b.quad(P(x0, y1, z1), P(x1, y1, z1), P(x1, y1, z0), P(x0, y1, z0), uv(w, d), col);
  }
  function slopeRoof(b, x, y, z, w, d, ry, col, rise = .5) {      // single sloped sheet (lean-to)
    const c = Math.cos(ry), sn = Math.sin(ry), P = (lx, ly, lz) => [x + lx * c + lz * sn, y + ly, z - lx * sn + lz * c];
    b.quad(P(-w / 2, 0, d / 2), P(w / 2, 0, d / 2), P(w / 2, rise, -d / 2), P(-w / 2, rise, -d / 2), [0, 0, w / 2, 0, w / 2, d / 2, 0, d / 2], col);
  }
  const segs = []; for (const r of W.roads) for (let i = 1; i < r.p.length; i++) segs.push([r.p[i - 1], r.p[i], r.w]);
  const SG = new Map(), sk = (x, z) => `${Math.floor(x / 30)},${Math.floor(z / 30)}`;
  for (const sg of segs) { const [a, b] = sg, n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 10) + 1; for (let i = 0; i <= n; i++) { const k = sk(a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n); (SG.get(k) || SG.set(k, new Set()).get(k)).add(sg); } }
  const offRoad = (x, z, pad) => { const cx = Math.floor(x / 30), cz = Math.floor(z / 30);
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const l = SG.get(`${cx + dx},${cz + dz}`); if (!l) continue;
      for (const [a, b, w] of l) { const ex = b[0] - a[0], ez = b[1] - a[1], ll = ex * ex + ez * ez || 1; let t = ((x - a[0]) * ex + (z - a[1]) * ez) / ll; t = Math.max(0, Math.min(1, t));
        if (Math.hypot(x - a[0] - ex * t, z - a[1] - ez * t) < w / 2 + (w >= 12 ? 2.9 : 0) + pad) return false; } } return true; };
  const free = (x, z, r) => { if (!offRoad(x, z, r)) return false; for (const [dx, dz] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r], [r, r], [-r, -r], [r, -r], [-r, r]]) if (blocked(x + dx, z + dz, .2)) return false; return true; };
  const solid = (x, z, w, d, ry) => { const c = Math.cos(ry), s = Math.sin(ry); addRect([[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([a, b]) => [x + a * c + b * s, z - a * s + b * c])); };

  // ---------------------------------------------------------------- open gutters with slab crossings along the big roads
  const ribbon = (b, pts, off, width, y, col, uvs = 1) => { for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], c = pts[i], L = Math.hypot(c[0] - a[0], c[1] - a[1]); if (!L) continue;
    const nx = -(c[1] - a[1]) / L, nz = (c[0] - a[0]) / L, o0 = off - width / 2, o1 = off + width / 2;
    b.quad([a[0] + nx * o1, y, a[1] + nz * o1], [a[0] + nx * o0, y, a[1] + nz * o0], [c[0] + nx * o0, y, c[1] + nz * o0], [c[0] + nx * o1, y, c[1] + nz * o1], [0, 0, 1, 0, 1, L * uvs, 0, L * uvs], col); } };
  for (const r of W.roads) { if (r.w < 12) continue;
    for (const side of [-1, 1]) { const off = side * (r.w / 2 + 1.75);
      ribbon(B.col, r.p, off, .95, .015, C(0x161412)); ribbon(B.con, r.p, off - side * .55, .16, .05, C(0xb7b2a8)); ribbon(B.con, r.p, off + side * .55, .16, .05, C(0xb7b2a8));
      let acc = 0; for (let i = 1; i < r.p.length; i++) { const a = r.p[i - 1], c = r.p[i], L = Math.hypot(c[0] - a[0], c[1] - a[1]); if (!L) continue;
        for (let t = 0; t < L; t += 1) { acc += 1; if (acc < 14) continue; acc = 0; const x = a[0] + (c[0] - a[0]) * t / L, z = a[1] + (c[1] - a[1]) * t / L, nx = -(c[1] - a[1]) / L, nz = (c[0] - a[0]) / L, ry = Math.atan2(c[0] - a[0], c[1] - a[1]);
          for (let k = 0; k < 3; k++) box(B.con, x + nx * off + (c[0] - a[0]) / L * k * .42, .08, z + nz * off + (c[1] - a[1]) / L * k * .42, 1.3, .1, .38, ry + Math.PI / 2, C(0xa9a49a)); } } } }

  // ---------------------------------------------------------------- roadside trade: kiosks, POS umbrellas, fruit tables, sheds
  const signTex = canvasTex(1024, 512, (g, w, h) => {
    const cell = (i, bg, fg, t1, t2) => { const x = (i % 2) * 512, y = (i / 2 | 0) * 256; g.fillStyle = bg; g.fillRect(x, y, 512, 256); g.fillStyle = fg; g.textAlign = 'center'; g.font = '800 72px Inter, sans-serif'; g.fillText(t1, x + 256, y + 120); g.font = '600 34px Inter, sans-serif'; g.fillText(t2, x + 256, y + 190); };
    cell(0, '#f2c400', '#111', 'BLESSING', 'MOBILE · RECHARGE'); cell(1, '#ffffff', '#c8102e', 'POS', 'Withdraw · Transfer'); cell(2, '#1b7a3e', '#fff', 'FRESH FRUITS', 'Pawpaw · Orange'); cell(3, '#c8102e', '#fff', 'PROVISIONS', 'Bread · Milo · Sugar');
  }); signTex.wrapS = signTex.wrapT = THREE.ClampToEdgeWrapping;
  const sUV = (i) => { const u0 = (i % 2) / 2, v0 = 1 - ((i / 2 | 0) + 1) / 2; return [u0, v0, u0 + .5, v0, u0 + .5, v0 + .5, u0, v0 + .5]; };
  const signQuad = (x, y, z, w, h, ry, i) => { const c = Math.cos(ry), sn = Math.sin(ry), P = (lx, ly) => [x + lx * c, y + ly, z - lx * sn]; B.sign.quad(P(-w / 2, -h / 2), P(w / 2, -h / 2), P(w / 2, h / 2), P(-w / 2, h / 2), sUV(i), C(0xffffff)); };
  const umbrellas = [];
  function kiosk(x, z, ry) { box(B.col, x, 1.15, z, 1.5, 2.3, 1.3, ry, C(0xf2c400)); box(B.col, x, 1.5, z + .66 * Math.cos(ry), 1.1, .7, .05, ry, C(0x2b2b2b));
    box(B.col, x, 2.45, z, 1.9, .12, 1.7, ry, C(0xe0b200)); box(B.col, x, 2.75, z, 1.2, .5, 1.1, ry, C(0xe0b200));
    signQuad(x + Math.sin(ry) * .67, 1.95, z + Math.cos(ry) * .67, 1.3, .55, ry, 0); solid(x, z, 1.5, 1.3, ry); }
  function posStand(x, z, ry) { box(B.col, x, .42, z, 1.1, .84, .6, ry, C(0x6b4a2f)); umbrellas.push([x, z, pick([0x1d5fbf, 0xf2c14e, 0xe8e8e8, 0xc0392b])]);
    box(B.col, x + Math.sin(ry) * .55, .55, z + Math.cos(ry) * .55, .05, 1.1, .05, ry, C(0x333333)); signQuad(x + Math.sin(ry) * .56, 1.25, z + Math.cos(ry) * .56, .8, .4, ry, 1); solid(x, z, 1.1, .6, ry); }
  function fruitTable(x, z, ry) { box(B.col, x, .4, z, 1.6, .8, .9, ry, C(0x7a5a3c)); for (let i = 0; i < 14; i++) { const s = new THREE.Mesh(fruitGeo, fruitMats[i % 3]); s.position.set(x + rnd(-.65, .65), .87, z + rnd(-.35, .35)); scene.add(s); }
    umbrellas.push([x, z, pick([0x2e8b57, 0xf2c14e, 0x1d5fbf])]); solid(x, z, 1.6, .9, ry); }
  function shed(x, z, ry) { const w = rnd(3, 4.2), d = 2.6; for (const [a, b] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) { const c = Math.cos(ry), s = Math.sin(ry); box(B.col, x + a * c + b * s, 1.25, z - a * s + b * c, .12, 2.5 + (b < 0 ? .4 : 0), .12, ry, C(0x5b4632)); }
    slopeRoof(B.iron, x, 2.5, z, w + .5, d + .6, ry, C(0xffffff), .4); box(B.col, x, .45, z + Math.cos(ry) * .5, w - .4, .9, .8, ry, C(0x6b4a2f));
    box(B.col, x, 1.2, z - Math.cos(ry) * 1.25, w, 2.4, .08, ry, C(0x7a6a58)); signQuad(x + Math.sin(ry) * 1.32, 2.15, z + Math.cos(ry) * 1.32, 1.6, .5, ry, 3); solid(x, z, w, d, ry); }
  const fruitGeo = new THREE.SphereGeometry(.09, 8, 6), fruitMats = [0xf28c28, 0xf2d43a, 0x6aa84f].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: .6 }));
  const stalls = [];
  for (const r of W.roads) { if (r.w < 12) continue; let acc = 0;
    for (let i = 1; i < r.p.length; i++) { const a = r.p[i - 1], c = r.p[i], L = Math.hypot(c[0] - a[0], c[1] - a[1]); if (!L) continue;
      for (let t = 0; t < L; t += 2) { acc += 2; if (acc < rnd(10, 22)) continue; const nx = -(c[1] - a[1]) / L, nz = (c[0] - a[0]) / L, side = Math.random() < .5 ? 1 : -1, off = side * (r.w / 2 + 3.6 + rnd(0, 1.2));
        const x = a[0] + (c[0] - a[0]) * t / L + nx * off, z = a[1] + (c[1] - a[1]) * t / L + nz * off; if (Math.hypot(x - start[0], z - start[1]) < 9 || !free(x, z, 1.8)) continue; acc = 0;
        const ry = Math.atan2(-nx * side, -nz * side), k = Math.random(); (k < .2 ? kiosk : k < .5 ? posStand : k < .7 ? fruitTable : shed)(x, z, ry); stalls.push([x, z]); } } }
  // umbrellas (instanced)
  const umbGeo = new THREE.ConeGeometry(1.25, .45, 10, 1, true); umbGeo.translate(0, 2.1, 0); const stickGeo = new THREE.CylinderGeometry(.025, .025, 2.1, 5); stickGeo.translate(0, 1.05, 0);
  const umb = new THREE.InstancedMesh(umbGeo, new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: .8 }), umbrellas.length), stk = new THREE.InstancedMesh(stickGeo, new THREE.MeshStandardMaterial({ color: 0x777777 }), umbrellas.length);
  const m4 = new THREE.Matrix4(); umbrellas.forEach(([x, z, c], i) => { m4.makeTranslation(x, 0, z); umb.setMatrixAt(i, m4); stk.setMatrixAt(i, m4); umb.setColorAt(i, C(c)); }); umb.castShadow = true; scene.add(umb, stk);

  // ---------------------------------------------------------------- a neighbourhood mosque (blue walls, minaret, loudspeakers, ablution tank, drums)
  function findSpot(cx, cz, rMin, rMax, size) { for (let n = 0; n < 900; n++) { const a = rnd(0, Math.PI * 2), d = rnd(rMin, rMax), x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; if (free(x, z, size)) return [x, z]; } return null; }
  let mosque = findSpot(start[0], start[1], 40, 200, 6.5);
  if (mosque) { const [x, z] = mosque, ry = rnd(0, Math.PI * 2), blue = C(0x3f7fc0), c = Math.cos(ry), s = Math.sin(ry), L2 = (a, b) => [x + a * c + b * s, z - a * s + b * c];
    box(B.col, x, 1.8, z, 8, 3.6, 6, ry, blue); box(B.col, x, .2, z, 8.3, .4, 6.3, ry, C(0x2c5f94));
    const r0 = [x, 3.6, z]; const hw = 4.4, hd = 3.4; const P = (a, y, b) => { const q = L2(a, b); return [q[0], y, q[1]]; };
    box(B.col, x, 3.75, z, 8.9, .3, 6.9, ry, C(0x2f6fb0)); box(B.col, x, 4.05, z, 6.5, .3, 4.5, ry, C(0x3f7fc0)); box(B.col, x, 3.62, z, 9.1, .08, 7.1, ry, C(0xf2f2ee));
    const [mx, mz] = L2(2.6, 3.2); const min = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.15, 7.5, 18), new THREE.MeshStandardMaterial({ color: 0x3f7fc0, roughness: .85 })); min.position.set(mx, 3.75, mz);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(.9, 1, 2, 18), new THREE.MeshStandardMaterial({ color: 0xf2f2ee })); cap.position.set(mx, 8.2, mz); const cone = new THREE.Mesh(new THREE.ConeGeometry(.95, 1.6, 18), new THREE.MeshStandardMaterial({ color: 0x9a8a7a })); cone.position.set(mx, 10, mz);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 4, 6), new THREE.MeshStandardMaterial({ color: 0x8c8c8c, metalness: .6 })); pole.position.set(mx + .4, 12.6, mz);
    for (let k = 0; k < 3; k++) { const h = new THREE.Mesh(new THREE.ConeGeometry(.28, .55, 10, 1, true), new THREE.MeshStandardMaterial({ color: 0xcfcfcf, metalness: .5, side: THREE.DoubleSide })); h.position.set(mx + .4 + Math.cos(k * 2.1) * .35, 14.2, mz + Math.sin(k * 2.1) * .35); h.rotation.z = Math.PI / 2; h.rotation.y = k * 2.1; scene.add(h); }
    for (const m of [min, cap, cone, pole]) { m.castShadow = true; scene.add(m); }
    const [tx, tz] = L2(-2.5, 4.6); box(B.con, tx, .55, tz, 2, 1.1, 1.2, ry, C(0xb8b2a6));
    const sg = canvasTex(1024, 256, (g, w, h) => { g.fillStyle = '#151515'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = '700 74px Inter, sans-serif'; g.textAlign = 'center'; g.fillText('CHALLENGE CENTRAL MOSQUE', w / 2, 110); g.font = '600 44px Inter, sans-serif'; g.fillText('Phase 1 · All are welcome', w / 2, 190); });
    const sm = new THREE.Mesh(new THREE.PlaneGeometry(3.6, .9), new THREE.MeshStandardMaterial({ map: sg })); const [sx, sz] = L2(0, 3.02); sm.position.set(sx, 2.7, sz); sm.rotation.y = ry; scene.add(sm);
    const door = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.3), new THREE.MeshStandardMaterial({ color: 0x1b1b1b })); const [dx, dz] = L2(-1.5, 3.02); door.position.set(dx, 1.15, dz); door.rotation.y = ry; scene.add(door);
    const drumGeo = new THREE.CylinderGeometry(.3, .3, .9, 12); for (const [a, b] of [[-1, 4.8], [-.3, 5], [-3.9, 4.4]]) { const d = new THREE.Mesh(drumGeo, new THREE.MeshStandardMaterial({ color: 0x2f7fa8 })); const q = L2(a, b); d.position.set(q[0], .45, q[1]); d.castShadow = true; scene.add(d); }
    solid(x, z, 8.3, 6.3, ry); const mm = L2(2.6, 3.2); solid(mm[0], mm[1], 2.3, 2.3, 0); solid(tx, tz, 2, 1.2, ry);
  }

  // ---------------------------------------------------------------- mechanic yard: stick-and-tarp shelter, cars with the bonnet up, tyres
  let mech = null;
  for (const [a] of majSegs.slice(Math.floor(majSegs.length * .3))) { const s = findSpot(a[0], a[1], 18, 40, 7); if (s) { mech = s; break; } }
  if (mech) { const [x, z] = mech, ry = rnd(0, 6.28), c = Math.cos(ry), s = Math.sin(ry), L2 = (a, b) => [x + a * c + b * s, z - a * s + b * c];
    for (const [a, b] of [[-3.5, -2.5], [3.5, -2.5], [-3.5, 2.5], [3.5, 2.5], [0, -2.5], [0, 2.5]]) { const q = L2(a, b); box(B.col, q[0], 1.4, q[1], .14, 2.8, .14, ry + rnd(-.1, .1), C(0x6b5440)); }
    slopeRoof(B.col, x, 2.75, z, 7.6, 5.6, ry, C(0xb8ad86), .25);
    for (const [a, b, bus] of [[-1.8, 0, true], [2, .3, false]]) { const v = vehicle(bus ? { danfo: true, body: 0xe9e6dc } : { body: 0x2c3e8c }); const q = L2(a, b); v.position.set(q[0], 0, q[1]); v.rotation.y = ry + Math.PI / 2;
      const hood = new THREE.Mesh(new THREE.BoxGeometry(1.6, .05, 1.1), new THREE.MeshStandardMaterial({ color: bus ? 0xe9e6dc : 0x2c3e8c, metalness: .4, roughness: .4 })); hood.position.set(0, 1.5, (bus ? 2.3 : 2.05)); hood.rotation.x = -1.1; v.add(hood); scene.add(v); solid(q[0], q[1], 2, 4.8, ry + Math.PI / 2); }
    const tyre = new THREE.TorusGeometry(.33, .13, 8, 16), tm = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: .9 });
    for (let k = 0; k < 6; k++) { const t = new THREE.Mesh(tyre, tm); const q = L2(rnd(-4, 4), rnd(3, 4.2)); t.position.set(q[0], .13 + (k % 3 === 0 ? .26 : 0), q[1]); t.rotation.x = Math.PI / 2; scene.add(t); }
  }

  // ---------------------------------------------------------------- materials
  const std = (o) => new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, vertexColors: true, ...o });
  B.col.mesh(std({ roughness: .8 })); B.con.mesh(std({ roughness: .95 })); B.iron.mesh(std({ ...ptex('roof'), roughness: .7, metalness: .35 })); B.sign.mesh(std({ map: signTex, roughness: .6 }));

  // ---------------------------------------------------------------- vehicle factories: keke (tricycle) and okada (motorcycle)
  function keke(color = 0xf2c400) {
    const g = new THREE.Group(), paint = new THREE.MeshPhysicalMaterial({ color, roughness: .35, metalness: .3, clearcoat: 1 }), black = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: .7 }), canv = new THREE.MeshStandardMaterial({ color: 0x1e1e1e, roughness: 1, side: THREE.DoubleSide });
    const add = (m, x, y, z) => { m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
    const nose = new THREE.Shape([[-.55, 0], [.55, 0], [.4, 1.2], [-.4, 1.2]].map(([a, b]) => new THREE.Vector2(a, b))); const ng = new THREE.ExtrudeGeometry(nose, { depth: .7, bevelEnabled: true, bevelSize: .06, bevelThickness: .06 }); ng.rotateX(-Math.PI / 2); ng.translate(0, .45, .55);
    add(new THREE.Mesh(ng, paint), 0, 0, 0); add(new THREE.Mesh(new THREE.BoxGeometry(1.3, .45, 1.6), paint), 0, .65, -.45);
    add(new THREE.Mesh(new THREE.BoxGeometry(1.32, .06, 2.5), canv), 0, 1.85, -.1); for (const [x, z] of [[-.64, .95], [.64, .95], [-.64, -1.2], [.64, -1.2]]) add(new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 1.3, 5), black), x, 1.2, z);
    const side = add(new THREE.Mesh(new THREE.PlaneGeometry(1.4, .9), canv), .66, 1.38, -.65); side.rotation.y = Math.PI / 2; const side2 = side.clone(); side2.position.x = -.66; g.add(side2);
    add(new THREE.Mesh(new THREE.BoxGeometry(1.1, .5, .05), new THREE.MeshPhysicalMaterial({ color: 0x1b2328, roughness: .05 })), 0, 1.45, .62);
    const wg = new THREE.CylinderGeometry(.24, .24, .14, 14); for (const [x, z] of [[0, 1.05], [-.6, -.9], [.6, -.9]]) { const w = add(new THREE.Mesh(wg, black), x, .24, z); w.rotation.z = Math.PI / 2; }
    g.userData = { len: 2.6, wid: 1.4, speed: 0 }; return g;
  }
  function okada(color = 0x1f4fbf) {
    const g = new THREE.Group(), paint = new THREE.MeshPhysicalMaterial({ color, roughness: .3, metalness: .4, clearcoat: 1 }), black = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: .7 }), chrome = new THREE.MeshStandardMaterial({ color: 0xc8ccd0, metalness: 1, roughness: .2 });
    const add = (m, x, y, z, rx = 0) => { m.position.set(x, y, z); m.rotation.x = rx; m.castShadow = true; g.add(m); return m; };
    const wg = new THREE.TorusGeometry(.3, .08, 8, 18); for (const z of [.72, -.62]) { const w = add(new THREE.Mesh(wg, black), 0, .34, z); w.rotation.y = Math.PI / 2; }
    add(new THREE.Mesh(new THREE.BoxGeometry(.32, .3, .6), paint), 0, .78, .2); add(new THREE.Mesh(new THREE.BoxGeometry(.28, .12, .8), black), 0, .92, -.25);
    add(new THREE.Mesh(new THREE.BoxGeometry(.24, .28, .45), chrome), 0, .45, .05); add(new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .8, 6), chrome), 0, .72, .6, -.4);
    add(new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .72, 6), chrome), 0, 1.08, .52).rotation.z = Math.PI / 2; add(new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), chrome), 0, .98, .7);
    add(new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .7, 6), chrome), .14, .38, -.35, Math.PI / 2);
    g.userData = { len: 1.9, wid: .7, speed: 0 }; return g;
  }
  return { keke, okada, stalls: stalls.length, mosque, mech };
}
