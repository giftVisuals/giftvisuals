// House interiors, built from the player's reference photos (parlour, bedroom, kitchen, corridor) and a face-me-I-face-you room.
// Each layout is built once far away from the city and reused; colours and floors change per house so they don't all look the same.
export function makeInteriors({ THREE, scene, canvasTex }) {
  const rnd = (a, b) => a + Math.random() * (b - a), pick = (a) => a[(Math.random() * a.length) | 0];
  const tex = (w, h, draw, rx = 1, ry = 1) => { const t = canvasTex(w, h, draw); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };
  const noise = (g, w, h, n, a0, a1, col = '0,0,0') => { for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${col},${rnd(a0, a1)})`; g.fillRect(Math.random() * w, Math.random() * h, rnd(1, 3), rnd(1, 3)); } };
  // ---------------------------------------------------------------- textures
  const veins = (g, w, h, base, vein, n = 18) => { g.fillStyle = base; g.fillRect(0, 0, w, h); noise(g, w, h, 6000, .02, .05);
    for (let i = 0; i < n; i++) { g.strokeStyle = vein; g.lineWidth = rnd(.6, 3); g.globalAlpha = rnd(.25, .7); g.beginPath(); let x = Math.random() * w, y = Math.random() * h; g.moveTo(x, y);
      for (let k = 0; k < 8; k++) { x += rnd(-60, 90); y += rnd(-40, 70); g.lineTo(x, y); } g.stroke(); } g.globalAlpha = 1;
    g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 2; for (let x = 0; x <= w; x += w / 2) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y <= h; y += h / 2) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } };
  const FLOORS = {
    marble: tex(512, 512, (g, w, h) => veins(g, w, h, '#eeeeec', '#7c7c80'), 4, 4),
    black: tex(512, 512, (g, w, h) => veins(g, w, h, '#1b1c20', '#d8d8dc', 22), 4, 4),
    terra: tex(512, 512, (g, w, h) => { for (let y = 0; y < h; y += 128) for (let x = 0; x < w; x += 128) { const v = rnd(.9, 1.06); g.fillStyle = `rgb(${200 * v | 0},${136 * v | 0},${98 * v | 0})`; g.fillRect(x + 2, y + 2, 124, 124);
      const gr = g.createRadialGradient(x + 64, y + 64, 10, x + 64, y + 64, 90); gr.addColorStop(0, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(0,0,0,.08)'); g.fillStyle = gr; g.fillRect(x + 2, y + 2, 124, 124); } }, 4, 4),
    granite: tex(512, 512, (g, w, h) => { g.fillStyle = '#9fa1a3'; g.fillRect(0, 0, w, h); noise(g, w, h, 30000, .15, .5); noise(g, w, h, 8000, .2, .5, '255,255,255'); }, 3, 3),
    cement: tex(512, 512, (g, w, h) => { g.fillStyle = '#8f8b84'; g.fillRect(0, 0, w, h); noise(g, w, h, 20000, .03, .1); for (let i = 0; i < 20; i++) { g.fillStyle = `rgba(0,0,0,${rnd(.03, .08)})`; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, rnd(20, 80), 0, 7); g.fill(); } }, 3, 3),
    lino: tex(512, 512, (g, w, h) => { g.fillStyle = '#7a3b2e'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 64) for (let x = (y / 64 % 2) * 32; x < w; x += 64) { g.fillStyle = '#c9a15a'; g.beginPath(); g.arc(x, y, 18, 0, 7); g.fill(); } noise(g, w, h, 6000, .04, .1); }, 3, 3),
  };
  const kitchenTile = tex(512, 512, (g, w, h) => { g.fillStyle = '#e9dccb'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 64) for (let x = 0; x < w; x += 64) { g.strokeStyle = '#b39a7e'; g.lineWidth = 6; g.strokeRect(x + 10, y + 14, 44, 36); g.fillStyle = '#d4c2aa'; g.fillRect(x + 20, y + 24, 24, 16); } }, 4, 2);
  const kitchenTile2 = tex(512, 512, (g, w, h) => veins(g, w, h, '#f4f3f0', '#9a9aa0', 14), 3, 2);
  const duvetBlue = tex(512, 512, (g, w, h) => { g.fillStyle = '#21346b'; g.fillRect(0, 0, w, h); g.strokeStyle = '#e8ecf5'; g.lineWidth = 6; for (let y = -64; y < h + 64; y += 128) for (let x = -64; x < w + 64; x += 128) { g.beginPath(); g.moveTo(x, y + 64); g.lineTo(x + 64, y); g.lineTo(x + 128, y + 64); g.lineTo(x + 64, y + 128); g.closePath(); g.stroke(); } }, 1, 1);
  const rugTex = tex(512, 512, (g, w, h) => { g.fillStyle = '#c9b38d'; g.fillRect(0, 0, w, h); g.strokeStyle = '#6b2e2a'; g.lineWidth = 18; g.strokeRect(24, 24, w - 48, h - 48); g.strokeStyle = '#2f4f6b'; g.lineWidth = 8; g.strokeRect(56, 56, w - 112, h - 112);
    for (let i = 0; i < 6; i++) { g.fillStyle = ['#6b2e2a', '#2f4f6b', '#a07a3a'][i % 3]; g.beginPath(); g.ellipse(w / 2, h / 2, 160 - i * 24, 100 - i * 15, 0, 0, 7); g.fill(); } noise(g, w, h, 8000, .03, .08); });
  const artTex = tex(512, 384, (g, w, h) => { g.fillStyle = '#efe8dc'; g.fillRect(0, 0, w, h); for (let i = 0; i < 9; i++) { g.fillStyle = pick(['#c0392b', '#e67e22', '#f2c14e', '#2c3e50', '#16a085', '#8e44ad']); g.globalAlpha = .8; g.fillRect(rnd(20, w - 200), rnd(20, h - 150), rnd(60, 220), rnd(40, 160)); } g.globalAlpha = 1; });
  const tvTex = tex(512, 288, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#1a3a6b'); gr.addColorStop(1, '#0b1a33'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#c8102e'; g.fillRect(0, h - 70, w, 44);
    g.fillStyle = '#fff'; g.font = '700 24px Inter, sans-serif'; g.fillText('NAIJA NEWS 24  ·  CHIEF BANKOLE OPENS NEW ESTATE IN LEKKI', 16, h - 40); g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(w * .3, h * .42, 50, 0, 7); g.fill(); g.fillRect(w * .3 - 70, h * .42 + 40, 140, 100); });
  const curtTex = tex(256, 256, (g, w, h) => { for (let x = 0; x < w; x++) { const v = .8 + .2 * Math.sin(x / w * Math.PI * 10); g.fillStyle = `rgb(${255 * v | 0},${255 * v | 0},${255 * v | 0})`; g.fillRect(x, 0, 1, h); } });
  const winLight = tex(256, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#e9eef2'); gr.addColorStop(1, '#c9d2c4'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.strokeStyle = '#1b1b1b'; g.lineWidth = 8;
    for (let x = 20; x < w; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (const y of [64, 128, 192]) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } });

  // ---------------------------------------------------------------- materials (variants swap colours / maps)
  const M = (o) => new THREE.MeshStandardMaterial(o);
  const mats = {
    wall: M({ color: 0xf3efe6, roughness: .9 }), ceil: M({ color: 0xf7f7f5, roughness: 1 }), floor: M({ map: FLOORS.marble, roughness: .18, metalness: .05 }),
    skirt: M({ color: 0x3b2a20, roughness: .6 }), wood: M({ color: 0x6b3f23, roughness: .55 }), door: M({ color: 0x7a4a2a, roughness: .5 }),
    sofa: M({ color: 0x4a2c1f, roughness: .45 }), cushion: M({ color: 0xd4a017, roughness: .9 }), glassTop: new THREE.MeshPhysicalMaterial({ color: 0x223038, roughness: .05, metalness: .2, transparent: true, opacity: .55 }),
    black: M({ color: 0x111214, roughness: .4 }), white: M({ color: 0xf5f5f2, roughness: .4 }), steel: M({ color: 0xb8bcc0, metalness: .9, roughness: .25 }), gold: M({ color: 0xd2a84a, metalness: .9, roughness: .3 }),
    rug: M({ map: rugTex, roughness: 1 }), art: M({ map: artTex, roughness: .7 }), tv: M({ map: tvTex, emissive: 0xffffff, emissiveMap: tvTex, emissiveIntensity: .9 }),
    curtain: M({ map: curtTex, color: 0xd9c38a, roughness: .9, side: THREE.DoubleSide }), sheer: M({ map: curtTex, color: 0xfaf6ea, transparent: true, opacity: .7, side: THREE.DoubleSide }),
    winLight: new THREE.MeshBasicMaterial({ map: winLight }), duvet: M({ map: duvetBlue, roughness: .9 }), sheet: M({ color: 0xf8f8f6, roughness: .9 }),
    cabinet: M({ color: 0xf1ece0, roughness: .5 }), cabWood: M({ color: 0x8a5a34, roughness: .6 }), counter: M({ map: FLOORS.granite, roughness: .3 }), ktile: M({ map: kitchenTile, roughness: .4 }),
    plant: M({ color: 0x2f6b2a, roughness: .9 }), pot: M({ color: 0x3a2a20, roughness: .6 }), lamp: new THREE.MeshBasicMaterial({ color: 0xfff4d6 }), led: new THREE.MeshBasicMaterial({ color: 0x4aa3ff }),
    plastic: M({ color: 0x1f6fd1, roughness: .5 }), redPl: M({ color: 0xc0392b, roughness: .5 }), mattress: M({ color: 0xe9e2d0, roughness: 1 }),
  };
  const SOFA = [0x4a2c1f, 0xe8e2d6, 0xb9ab95, 0x2a2a2e, 0x6b1f1f], WALL = [0xf3efe6, 0xffffff, 0xf2e6cf, 0xe9eef0, 0xf1e1d8];

  // ---------------------------------------------------------------- builders
  function make(ox, oz) {
    const group = new THREE.Group(); group.position.set(ox, 0, oz); scene.add(group); group.visible = false;
    const solids = [], walls = [];
    const add = (m, wall = false) => { group.add(m); if (wall) walls.push(m); return m; };
    const box = (x, y, z, w, h, d, mat, solid = false, wall = false) => { const m = add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat), wall); m.position.set(x, y, z); if (solid) solids.push([ox + x - w / 2, ox + x + w / 2, oz + z - d / 2, oz + z + d / 2]); return m; };
    const cyl = (x, y, z, r, h, mat, seg = 16) => { const m = add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat)); m.position.set(x, y, z); return m; };
    // axis-aligned wall with door gaps [[a,b],...] along it
    function wall(x1, z1, x2, z2, gaps = [], H = 3, win = []) {
      const alongX = z1 === z2, a0 = alongX ? Math.min(x1, x2) : Math.min(z1, z2), a1 = alongX ? Math.max(x1, x2) : Math.max(z1, z2), t = .16;
      const cuts = [...gaps.map(g => [...g, 'door']), ...win.map(g => [...g, 'win'])].sort((p, q) => p[0] - q[0]); let s = a0;
      const piece = (p0, p1, y0, y1) => { if (p1 - p0 < .01) return; const c = (p0 + p1) / 2, L = p1 - p0, h = y1 - y0;
        if (alongX) box(c, y0 + h / 2, z1, L, h, t, mats.wall, y0 < 1, true); else box(x1, y0 + h / 2, c, t, h, L, mats.wall, y0 < 1, true); };
      for (const [g0, g1, kind] of cuts) { piece(s, g0, 0, H);
        if (kind === 'door') { piece(g0, g1, 2.2, H); const fr = (p, w, h, y) => alongX ? box(p, y, z1, w, h, t + .06, mats.door) : box(x1, y, p, t + .06, h, w, mats.door); fr(g0, .08, 2.2, 1.1); fr(g1, .08, 2.2, 1.1); fr((g0 + g1) / 2, g1 - g0 + .16, .08, 2.22); }
        else { piece(g0, g1, 0, .9); piece(g0, g1, 2.3, H); const c = (g0 + g1) / 2, w = g1 - g0, pl = new THREE.Mesh(new THREE.PlaneGeometry(w, 1.4), mats.winLight);
          if (alongX) { pl.position.set(c, 1.6, z1); } else { pl.position.set(x1, 1.6, c); pl.rotation.y = Math.PI / 2; } add(pl);
          const cur = (off, wide, mat) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(wide, 2.6), mat); if (alongX) { m.position.set(c + off, 1.5, z1 + (z1 > 1 ? -.12 : .12)); } else { m.position.set(x1 + (x1 > 1 ? -.12 : .12), 1.5, c + off); m.rotation.y = Math.PI / 2; } add(m); };
          cur(-w / 2 - .25, .6, mats.curtain); cur(w / 2 + .25, .6, mats.curtain); cur(0, w, mats.sheer); }
        s = g1; }
      piece(s, a1, 0, H);
      const sk = alongX ? box((a0 + a1) / 2, .06, z1, a1 - a0, .12, t + .03, mats.skirt) : box(x1, .06, (a0 + a1) / 2, t + .03, .12, a1 - a0, mats.skirt);
    }
    function floor(x0, z0, x1, z1, mat, y = 0) { const m = add(new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), mat)); m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, y + .005, (z0 + z1) / 2); m.receiveShadow = false; return m; }
    function ceiling(x0, z0, x1, z1, H = 3, pop = true) { const m = add(new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), mats.ceil)); m.rotation.x = Math.PI / 2; m.position.set((x0 + x1) / 2, H, (z0 + z1) / 2);
      if (pop && x1 - x0 > 3) { const inX = .7, w = x1 - x0 - inX * 2, d = z1 - z0 - inX * 2; box((x0 + x1) / 2, H - .18, z0 + inX / 2, x1 - x0, .36, inX, mats.ceil); box((x0 + x1) / 2, H - .18, z1 - inX / 2, x1 - x0, .36, inX, mats.ceil);
        box(x0 + inX / 2, H - .18, (z0 + z1) / 2, inX, .36, d, mats.ceil); box(x1 - inX / 2, H - .18, (z0 + z1) / 2, inX, .36, d, mats.ceil);
        for (let x = x0 + .35; x < x1; x += 1.4) for (const z of [z0 + .35, z1 - .35]) { const l = add(new THREE.Mesh(new THREE.CircleGeometry(.07, 12), mats.lamp)); l.rotation.x = Math.PI / 2; l.position.set(x, H - .37, z); } } }
    const light = (x, y, z, i = 1.4, d = 9, c = 0xfff1d8) => { const l = new THREE.PointLight(c, i, d, 1.6); l.position.set(x, y, z); group.add(l); return l; };
    return { group, solids, walls, box, cyl, wall, floor, ceiling, light, add };
  }
  function sofa(k, x, z, rot, len, mat = mats.sofa) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; k.add(g);
    const b = (bx, by, bz, w, h, d, m) => { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.position.set(bx, by, bz); g.add(me); };
    b(0, .22, 0, len, .3, .9, mat); b(0, .45, .08, len - .3, .18, .74, mat); b(0, .7, -.36, len, .55, .2, mat); b(-len / 2 + .1, .5, 0, .22, .45, .9, mat); b(len / 2 - .1, .5, 0, .22, .45, .9, mat);
    for (let i = 0; i < Math.round(len / .8); i++) b(-len / 2 + .5 + i * .8, .75, -.22, .38, .38, .12, mats.cushion);
    const c = Math.cos(rot), s = Math.sin(rot), hw = len / 2, hd = .45; const pts = [[-hw, -hd], [hw, hd]].map(([a, d]) => [x + a * c + d * s, z - a * s + d * c]);
    k.solids.push([k.group.position.x + Math.min(pts[0][0], pts[1][0]), k.group.position.x + Math.max(pts[0][0], pts[1][0]), k.group.position.z + Math.min(pts[0][1], pts[1][1]), k.group.position.z + Math.max(pts[0][1], pts[1][1])]);
  }
  function plant(k, x, z) { k.cyl(x, .25, z, .22, .5, mats.pot); for (let i = 0; i < 7; i++) { const l = new THREE.Mesh(new THREE.ConeGeometry(.08, 1.1, 5), mats.plant); l.position.set(x + rnd(-.15, .15), 1, z + rnd(-.15, .15)); l.rotation.set(rnd(-.4, .4), 0, rnd(-.4, .4)); k.add(l); } }
  function fan(k, x, z) { k.cyl(x, .02, z, .25, .04, mats.black); k.cyl(x, .7, z, .025, 1.3, mats.black); const h = k.cyl(x, 1.4, z, .26, .1, mats.black); h.rotation.x = Math.PI / 2; }
  function acUnit(k, x, y, z, rotY) { const m = k.box(x, y, z, 1, .3, .22, mats.white); m.rotation.y = rotY; }

  // ---------------------------------------------------------------- layout 1: house (parlour, corridor, two bedrooms, kitchen) 12 x 9 m
  const house = (() => {
    const k = make(5000, 0); const H = 3;
    k.wall(0, 0, 12, 0, [[2, 3]], H, [[4.6, 6.4]]);          // front: entrance door + window
    k.wall(0, 9, 12, 9, [], H, [[1.2, 2.6], [9, 10.6]]);
    k.wall(0, 0, 0, 9, [], H, [[2.4, 4]]); k.wall(12, 0, 12, 9, [], H, [[1.6, 3], [6, 7.4]]);
    k.wall(0, 6, 7.5, 6, [[5.2, 7.3]], H);                    // parlour | kitchen + corridor (wide archway to corridor)
    k.wall(7.5, 0, 7.5, 9, [[2, 3], [6.8, 7.8]], H);          // corridor | bedrooms
    k.wall(7.5, 4.5, 12, 4.5, [], H);                          // between bedrooms
    k.wall(4.5, 6, 4.5, 9, [[7, 8]], H);                       // kitchen | corridor
    const fl = k.floor(0, 0, 12, 9, mats.floor); k.ceiling(0, 0, 7.5, 6); k.ceiling(7.5, 0, 12, 4.5); k.ceiling(7.5, 4.5, 12, 9); k.ceiling(0, 6, 4.5, 9, H, false); k.ceiling(4.5, 6, 7.5, 9, H, false);
    for (let z = 6.4; z < 9; z += 1) { const l = k.add(new THREE.Mesh(new THREE.CircleGeometry(.07, 12), mats.lamp)); l.rotation.x = Math.PI / 2; l.position.set(6, H - .01, z); }
    k.box(6, H - .02, 7.5, .04, .02, 2.8, mats.led);
    // parlour
    const rug = k.add(new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.3), mats.rug)); rug.rotation.x = -Math.PI / 2; rug.position.set(3.5, .012, 3.1);
    sofa(k, .6, 3.1, Math.PI / 2, 2.6); sofa(k, 3.3, 5.35, Math.PI, 2.2); sofa(k, 5.9, 4.7, -Math.PI * .75, 1.1);
    k.box(3.5, .22, 3.1, 1.3, .4, .7, mats.black, true); k.box(3.5, .44, 3.1, 1.32, .04, .72, mats.glassTop);
    k.box(7.15, .3, 3.1, .45, .6, 2, mats.black, true); const tv = k.box(7.18, 1.25, 3.1, .06, .85, 1.5, mats.black); const scr = k.add(new THREE.Mesh(new THREE.PlaneGeometry(1.42, .79), mats.tv)); scr.position.set(7.14, 1.25, 3.1); scr.rotation.y = -Math.PI / 2;
    acUnit(k, 5.5, 2.55, .2, 0); plant(k, .45, .5); plant(k, 6.9, .5);
    const art = k.add(new THREE.Mesh(new THREE.PlaneGeometry(1.2, .9), mats.art)); art.position.set(3.4, 1.8, 5.9); art.rotation.y = Math.PI; const fr = k.box(3.4, 1.8, 5.93, 1.3, 1, .04, mats.gold);
    const ch = k.cyl(3.5, 2.55, 3.1, .35, .25, mats.gold, 12); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const b = k.add(new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), mats.lamp)); b.position.set(3.5 + Math.cos(a) * .4, 2.4, 3.1 + Math.sin(a) * .4); }
    k.light(3.5, 2.4, 3.1, 1.6, 10); k.light(6, 2.6, 7.5, .8, 6, 0xdfe9ff);
    // kitchen (x 0-4.5, z 6-9)
    const kt = k.add(new THREE.Mesh(new THREE.PlaneGeometry(4.3, 1.3), mats.ktile)); kt.position.set(2.25, 1.55, 8.9); kt.rotation.y = Math.PI;
    k.box(2.25, .45, 8.6, 4.2, .9, .6, mats.cabinet, true); k.box(2.25, .92, 8.6, 4.24, .05, .64, mats.counter);
    k.box(.3, .45, 7.3, .6, .9, 2, mats.cabinet, true); k.box(.3, .92, 7.3, .64, .05, 2.04, mats.counter);
    k.box(2.6, 2.1, 8.75, 2.6, .7, .35, mats.cabinet); k.box(1.4, .95, 8.6, .6, .04, .45, mats.steel); k.box(3.3, .96, 8.6, .7, .04, .5, mats.black);
    k.box(3.9, .9, 6.5, .7, 1.8, .7, mats.steel, true); k.box(.3, 1.15, 6.6, .5, .3, .4, mats.black);
    const heater = k.cyl(4.2, 2.2, 8.75, .18, .5, mats.white); heater.rotation.z = Math.PI / 2;
    k.light(2.2, 2.6, 7.5, 1, 6);
    // bedroom 1 (x 7.5-12, z 4.5-9)
    const bed = (bx, bz, duvet) => { k.box(bx, .25, bz, 1.7, .4, 2.1, mats.wood, true); k.box(bx, .5, bz, 1.6, .2, 2, mats.sheet); k.box(bx, .62, bz + .25, 1.62, .06, 1.5, duvet);
      k.box(bx, .95, bz - 1.07, 1.8, 1, .12, mats.wood); for (const s of [-.4, .4]) k.box(bx + s, .68, bz - .78, .6, .14, .35, mats.sheet); k.box(bx - 1.2, .3, bz - .8, .5, .6, .45, mats.wood, true); k.box(bx + 1.2, .3, bz - .8, .5, .6, .45, mats.wood, true); };
    bed(9.8, 7.4, mats.duvet); acUnit(k, 9.8, 2.55, 8.8, Math.PI); fan(k, 11.4, 5.2); k.box(8, 1.1, 5.2, .55, 2.2, 1.2, mats.wood, true); k.light(9.8, 2.6, 6.8, 1.1, 7);
    // bedroom 2 (x 7.5-12, z 0-4.5)
    bed(9.8, 2.6, mats.sheet); acUnit(k, 11.8, 2.55, 2.3, -Math.PI / 2); plant(k, 11.6, .4); k.light(9.8, 2.6, 2.2, 1.1, 7);
    return { k, spawn: [5002.5, .9], exit: [5002.5, .5], fl };
  })();

  // ---------------------------------------------------------------- layout 2: face-me-I-face-you corridor + one room
  const room = (() => {
    const k = make(5100, 0); const H = 2.9;
    k.wall(0, 0, 2.2, 0, [[.6, 1.6]], H); k.wall(0, 12, 2.2, 12, [], H, [[.6, 1.6]]);
    k.wall(0, 0, 0, 12, [[2.5, 3.4], [5.5, 6.4], [8.5, 9.4]], H); k.wall(2.2, 0, 2.2, 12, [[4.4, 5.3], [8.5, 9.4]], H);
    for (const z of [2.95, 5.95, 8.95]) k.box(-.05, 1.1, z, .06, 2.2, .9, mats.door);           // closed neighbours' doors
    k.box(2.25, 1.1, 8.95, .06, 2.2, .9, mats.door);
    k.wall(2.2, 3, 6.2, 3, [], H); k.wall(2.2, 7, 6.2, 7, [], H, [[3.7, 4.9]]); k.wall(6.2, 3, 6.2, 7, [], H, [[4.4, 5.6]]);
    k.floor(0, 0, 2.2, 12, mats.floor); k.floor(2.2, 3, 6.2, 7, M({ map: FLOORS.lino, roughness: .7 }), .002);
    const sheet = k.add(new THREE.Mesh(new THREE.PlaneGeometry(2.2, 12), new THREE.MeshBasicMaterial({ color: 0x7cc3ea, side: THREE.DoubleSide }))); sheet.rotation.x = Math.PI / 2; sheet.position.set(1.1, H + .3, 6);
    for (let z = .5; z < 12; z += 1.1) k.box(1.1, H + .25, z, 2.3, .06, .08, M({ color: 0x4f8fb5 }));
    const rugM = M({ color: 0x6f7a72, roughness: 1, side: THREE.DoubleSide });
    for (const z of [2.95, 5.95, 8.95]) { const r = k.add(new THREE.Mesh(new THREE.PlaneGeometry(.8, .7), rugM)); r.position.set(.02, 1.9, z); r.rotation.y = Math.PI / 2; }
    const net = M({ color: 0x2a2a2a, transparent: true, opacity: .75, side: THREE.DoubleSide }); for (const z of [2.95, 5.95]) { const n = k.add(new THREE.Mesh(new THREE.PlaneGeometry(.85, 2.1), net)); n.position.set(.04, 1.05, z); n.rotation.y = Math.PI / 2; } k.ceiling(2.2, 3, 6.2, 7, H, false);
    const c1 = k.add(new THREE.Mesh(new THREE.PlaneGeometry(.9, 2.1), M({ color: 0x8e44ad, side: THREE.DoubleSide, roughness: 1 }))); c1.position.set(2.32, 1.1, 4.85); c1.rotation.y = Math.PI / 2; c1.scale.x = .55; c1.position.z = 5.05;
    // room: mattress, small TV, fan, chairs, clothes rope
    k.box(4.9, .2, 5.6, 1.4, .3, 2, mats.wood, true); k.box(4.9, .42, 5.6, 1.35, .16, 1.95, mats.mattress); k.box(4.9, .52, 5.9, 1.36, .05, 1.2, mats.duvet);
    k.box(3, .3, 3.5, .7, .6, .5, mats.wood, true); k.box(3, .8, 3.5, .6, .4, .3, mats.black); const scr = k.add(new THREE.Mesh(new THREE.PlaneGeometry(.5, .3), mats.tv)); scr.position.set(3, .8, 3.66);
    fan(k, 5.8, 3.5); for (const [x, z] of [[2.8, 6.3], [3.5, 6.4]]) { k.box(x, .22, z, .45, .05, .45, mats.redPl); k.box(x, .45, z - .2, .45, .45, .05, mats.redPl); }
    const rope = k.box(4.2, 2.2, 4.2, 3.8, .01, .01, mats.black); for (let i = 0; i < 5; i++) { const c = k.add(new THREE.Mesh(new THREE.PlaneGeometry(.5, .7), M({ color: pick([0xd94141, 0x2f6fd1, 0xf2c14e, 0xffffff, 0x3d9a5a]), side: THREE.DoubleSide }))); c.position.set(2.8 + i * .7, 1.85, 4.2); }
    // corridor end: kerosene stove, pots, drums
    k.box(1.1, .35, 11.5, .9, .7, .5, mats.wood, true); k.cyl(.9, .82, 11.5, .18, .22, mats.steel); k.cyl(1.4, .78, 11.5, .14, .16, mats.redPl);
    k.cyl(.35, .45, 10.6, .28, .9, mats.plastic); k.cyl(1.85, .45, 10.2, .28, .9, mats.plastic);
    k.light(1.1, 2.7, 3, .9, 7, 0xffe2b0); k.light(1.1, 2.7, 9, .9, 7, 0xffe2b0); k.light(4.2, 2.7, 5, 1.1, 6, 0xfff4d6);
    return { k, spawn: [5101.1, .9], exit: [5101.1, .5] };
  })();


  // ---------------------------------------------------------------- layout 3: provision shop (orange shelves of bread, spreads, bottles)
  const shop = (() => {
    const k = make(5200, 0); const H = 2.8, orange = M({ color: 0xd2541f, roughness: .6, metalness: .3 });
    k.wall(0, 4, 4, 4, [], H); k.wall(0, 0, 0, 4, [], H); k.wall(4, 0, 4, 4, [], H);
    k.box(.35, H / 2, -.02, .7, H, .12, mats.wall, true, true); k.box(3.65, H / 2, -.02, .7, H, .12, mats.wall, true, true); k.box(2, H - .2, -.02, 4, .4, .12, mats.wall, false, true);
    const walls = M({ color: 0xc8501e, roughness: .7 }); for (const w of k.walls) w.material = walls;
    k.floor(0, 0, 4, 4, M({ map: FLOORS.terra, color: 0xd8d0c0, roughness: .6 })); k.ceiling(0, 0, 4, 4, H, false); k.group.children.filter(c => c.material === mats.ceil).forEach(c => c.material = M({ color: 0xc8501e }));
    const BOX = [0xf2c14e, 0xc0392b, 0x8e44ad, 0xe67e22, 0x2e86c1, 0xf5f5f2, 0xd4a017];
    const shelf = (x, z, w, d, rotY) => { for (const y of [.15, .65, 1.15, 1.65, 2.15]) { const b = k.box(x, y, z, rotY ? d : w, .04, rotY ? w : d, orange); }
      for (const [dx, dz] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) k.box(x + (rotY ? dz : dx), 1.2, z + (rotY ? dx : dz), .05, 2.4, .05, orange);
      for (const y of [.65, 1.15, 1.65, 2.15]) for (let i = 0; i < w / .32 - 1; i++) { const along = -w / 2 + .2 + i * .32; const m = M({ color: pick(BOX), roughness: .5 });
        if (Math.random() < .3) { const c = k.cyl(x + (rotY ? 0 : along), y + .14, z + (rotY ? along : 0), .045, .25, M({ color: 0xc9a050, transparent: true, opacity: .85 }), 8); }
        else k.box(x + (rotY ? 0 : along), y + .12, z + (rotY ? along : 0), rotY ? d * .8 : .26, .2, rotY ? .26 : d * .8, m); }
      k.solids.push([5200 + x - (rotY ? d : w) / 2, 5200 + x + (rotY ? d : w) / 2, z - (rotY ? w : d) / 2, z + (rotY ? w : d) / 2]); };
    shelf(2, 3.65, 3.6, .5, false); shelf(.3, 2, 2.6, .5, true); shelf(3.7, 2, 2.6, .5, true);
    k.box(2.6, .45, 1.2, 1.2, .9, .5, orange, true); k.box(2.6, .92, 1.2, 1.24, .04, .54, M({ color: 0x8a6a4a }));
    const fanH = k.cyl(2, H - .15, 2, .05, .3, mats.white); for (let i = 0; i < 3; i++) { const b = k.box(2, H - .3, 2, .9, .02, .14, mats.white); b.rotation.y = i * 2.09; }
    const bulb = k.add(new THREE.Mesh(new THREE.SphereGeometry(.08, 10, 8), mats.lamp)); bulb.position.set(3.2, H - .25, 2.6);
    const sign = canvasTex(512, 256, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#111'; g.font = '700 34px Inter, sans-serif'; g.textAlign = 'center'; g.fillText('NOTICE! NOTICE!', w / 2, 60); g.fillText('NO CREDIT TODAY', w / 2, 120); g.font = '600 26px Inter, sans-serif'; g.fillText('All transfer: 0123456789', w / 2, 180); });
    const sg = k.add(new THREE.Mesh(new THREE.PlaneGeometry(.6, .3), M({ map: sign }))); sg.position.set(2, 2.45, 3.4); sg.rotation.y = Math.PI;
    const cur = M({ color: 0x8a5a3a, roughness: 1, side: THREE.DoubleSide }); for (const x of [.85, 3.15]) { const c = k.add(new THREE.Mesh(new THREE.PlaneGeometry(.5, 2.4), cur)); c.position.set(x, 1.2, .1); }
    k.light(2, 2.5, 2, 1.6, 7, 0xfff4d6);
    return { k, spawn: [5202, .4], exit: [5202, .35] };
  })();

  const L = { house, room, shop };
  function variant(layout, seed) {
    let s = Math.floor(seed * 1e6) || 1; const r = () => (s = (s * 16807) % 2147483647) / 2147483647, pk = (a) => a[Math.floor(r() * a.length)];
    if (layout === 'house') { mats.sofa.color.set(pk(SOFA)); mats.wall.color.set(pk(WALL)); mats.floor.map = FLOORS[pk(['marble', 'marble', 'black', 'terra'])]; mats.floor.needsUpdate = true;
      mats.cushion.color.set(pk([0xd4a017, 0xc0392b, 0x2e8b57, 0xe67e22, 0xf5f5f2])); mats.curtain.color.set(pk([0xd9c38a, 0xc9a54a, 0x8a2e2e, 0x2c4f7c, 0xe8e2d6]));
      mats.cabinet.color.set(pk([0xf1ece0, 0xffffff, 0x8a5a34])); mats.ktile.map = r() < .5 ? kitchenTile : kitchenTile2; mats.ktile.needsUpdate = true; }
    else if (layout === 'room') { mats.wall.color.set(pk([0xd9b77a, 0xcfae78, 0xc9c0a4, 0xb9c4b0])); mats.floor.map = FLOORS[pk(['cement', 'terra'])]; mats.floor.needsUpdate = true; }
  }
  return {
    layouts: L,
    show(name, seed) { for (const [n, v] of Object.entries(L)) v.k.group.visible = n === name; if (name) variant(name, seed); },
    blocked(x, z, r = .3) { const v = L[this.current]; if (!v) return false; for (const [x0, x1, z0, z1] of v.k.solids) if (x + r > x0 && x - r < x1 && z + r > z0 && z - r < z1) return true; return false; },
    current: null,
  };
}
