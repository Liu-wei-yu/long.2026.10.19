import * as THREE from 'three';
import { PAL } from '../config.js';
import { Builder } from '../lib/geo.js';
import { toonMat, makeOutlineMat } from '../lib/npr.js';

// ===== 小道具（全部塞进同一个 Builder，最后合并成一个 mesh）=====

export function addTree(b, x, z, y = 0, s = 1) {
  const h = 2.2 * s;
  b.cyl(0.14 * s, 0.22 * s, h, 6, { x, y: y + h / 2, z, color: PAL.trunk });
  const lc = PAL.leaf[(Math.random() * PAL.leaf.length) | 0];
  const n = 3;
  for (let i = 0; i < n; i++) {
    const r = (1.15 - i * 0.18) * s * (0.9 + Math.random() * 0.25);
    b.add(new THREE.IcosahedronGeometry(r, 0), {
      x: x + (Math.random() - 0.5) * 0.55 * s,
      y: y + h + (0.55 + i * 0.62) * s,
      z: z + (Math.random() - 0.5) * 0.55 * s,
      sy: 0.85 + Math.random() * 0.25,
      color: new THREE.Color(lc).offsetHSL(0, 0, (Math.random() - 0.5) * 0.07),
    });
  }
}

export function addBench(b, x, z, ry = 0, y = 0) {
  const wood = 0x8A6A48;
  const iron = 0x3B3C48;
  const c = Math.cos(ry), s = Math.sin(ry);
  const at = (dx, dz, h, w, d, yy, color) => {
    b.box(w, h, d, { x: x + dx * c - dz * s, z: z + dx * s + dz * c, y: y + yy, ry, color });
  };
  at(0, 0, 0.12, 1.9, 0.62, 0.48, wood);
  at(0, -0.28, 0.5, 1.9, 0.12, 0.86, wood);
  at(-0.78, 0, 0.5, 0.1, 0.6, 0.25, iron);
  at(0.78, 0, 0.5, 0.1, 0.6, 0.25, iron);
}

export function addBin(b, x, z, ry = 0, y = 0) {
  const body = 0x4F6E62;
  const dark = 0x354A44;
  b.box(0.62, 0.95, 0.56, { x, y: y + 0.5, z, ry, color: body });
  b.box(0.7, 0.12, 0.64, { x, y: y + 1.02, z, ry, color: dark, rx: 0.06 });
  // 竖纹
  for (let i = -1; i <= 1; i++) {
    b.box(0.05, 0.8, 0.58, { x: x + i * 0.19, y: y + 0.52, z, ry, color: dark });
  }
  // 分类色标
  b.box(0.34, 0.2, 0.04, { x, y: y + 0.86, z: z + 0.29, ry, color: 0xE0C36A });
  b.box(0.74, 0.1, 0.68, { x, y: y + 0.05, z, ry, color: 0x2E3A3A });
}

export function addHydrant(b, x, z, y = 0) {
  const c = 0xC4553F;
  b.cyl(0.16, 0.2, 0.62, 8, { x, y: y + 0.31, z, color: c });
  b.add(new THREE.IcosahedronGeometry(0.17, 0), { x, y: y + 0.66, z, sy: 0.8, color: c });
  b.cyl(0.06, 0.06, 0.5, 6, { x, y: y + 0.42, z, rx: Math.PI / 2, color: 0x8E3B2E });
  b.box(0.1, 0.1, 0.1, { x, y: y + 0.78, z, color: 0x8E3B2E });
}

export function addPlanter(b, x, z, ry = 0, y = 0) {
  b.box(1.3, 0.5, 0.62, { x, y: y + 0.25, z, ry, color: 0x9A7B62 });
  b.box(1.16, 0.08, 0.5, { x, y: y + 0.5, z, ry, color: 0x4A3A2E });
  for (let i = -1; i <= 1; i++) {
    b.add(new THREE.IcosahedronGeometry(0.24, 0), {
      x: x + i * 0.36 * Math.cos(ry), z: z + i * 0.36 * Math.sin(ry), y: y + 0.62,
      color: PAL.leaf[(Math.random() * 2) | 0],
    });
    b.add(new THREE.IcosahedronGeometry(0.1, 0), {
      x: x + i * 0.36 * Math.cos(ry), z: z + i * 0.36 * Math.sin(ry), y: y + 0.8,
      color: 0xE86A8A,
    });
  }
}

export function addSign(b, x, z, ry = 0, y = 0) {
  b.cyl(0.06, 0.07, 1.9, 6, { x, y: y + 0.95, z, color: 0x4A4B58 });
  b.box(0.9, 0.55, 0.08, { x, y: y + 1.85, z, ry, color: 0x4A4B58 });
  b.box(0.76, 0.42, 0.1, { x, y: y + 1.85, z, ry, color: 0xEDE6D6 });
}

export function addStone(b, x, z, y = 0, s = 1) {
  b.add(new THREE.IcosahedronGeometry(0.5 * s, 0), {
    x, y: y + 0.18 * s, z,
    sy: 0.6, ry: Math.random() * 3,
    color: new THREE.Color(PAL.rock[(Math.random() * PAL.rock.length) | 0]).offsetHSL(0, 0, 0.05),
  });
}

export function addFence(b, pts, y = 0) {
  const col = 0xD9CFBB;
  for (let i = 0; i < pts.length; i++) {
    const [x, z] = pts[i];
    b.box(0.14, 0.9, 0.14, { x, y: y + 0.45, z, color: col });
    if (i < pts.length - 1) {
      const [x2, z2] = pts[i + 1];
      const dx = x2 - x, dz = z2 - z;
      const len = Math.hypot(dx, dz);
      const ry = Math.atan2(dx, dz);
      const mx = (x + x2) / 2, mz = (z + z2) / 2;
      b.box(0.08, 0.1, len, { x: mx, y: y + 0.72, z: mz, ry, color: col });
      b.box(0.08, 0.1, len, { x: mx, y: y + 0.38, z: mz, ry, color: col });
    }
  }
}

// ===== 集市摊位 =====
export function addStall(b, x, z, ry = 0, y = 0) {
  const w = 2.6, d = 1.7;
  const woodDark = 0x6B503A, wood = 0x8A6A48;
  const cs = Math.cos(ry), sn = Math.sin(ry);
  const at = (lx, lz) => ({ x: x + lx * cs + lz * sn, z: z - lx * sn + lz * cs });
  // 立柱
  for (const [lx, lz] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) {
    const p = at(lx, lz);
    b.box(0.13, 2.3, 0.13, { x: p.x, y: y + 1.15, z: p.z, ry, color: woodDark });
  }
  // 台面
  const c1 = at(0, 0);
  b.box(w, 0.16, d, { x: c1.x, y: y + 0.92, z: c1.z, ry, color: wood });
  b.box(w, 0.75, 0.12, { x: c1.x, y: y + 0.52, z: c1.z, ry, color: woodDark });
  // 条纹雨棚
  const stripeA = 0xD9534F, stripeB = 0xF2E3C8;
  const stripes = 7;
  for (let i = 0; i < stripes; i++) {
    const lx = -w / 2 + (w / stripes) * (i + 0.5);
    const p = at(lx, 0);
    b.box(w / stripes, 0.07, d + 0.5, {
      x: p.x, y: y + 2.36, z: p.z, ry, rx: 0.12, color: i % 2 ? stripeB : stripeA,
    });
  }
  // 货品
  const goods = [0xE8A33D, 0xC85B45, 0x7FA37E, 0x9B6BA8, 0xE0C36A];
  for (let i = 0; i < 6; i++) {
    const p = at(-w / 2 + 0.4 + Math.random() * (w - 0.8), (Math.random() - 0.5) * (d - 0.5));
    b.add(new THREE.IcosahedronGeometry(0.11 + Math.random() * 0.07, 0), {
      x: p.x, y: y + 1.06, z: p.z, color: goods[(Math.random() * goods.length) | 0],
    });
  }
  // 价牌
  const p2 = at(w / 2 - 0.15, d / 2 - 0.1);
  b.box(0.3, 0.4, 0.04, { x: p2.x, y: y + 1.24, z: p2.z, ry, color: 0xEDE6D6 });
}

// ===== 自行车 =====
export function addBike(b, x, z, ry = 0, y = 0) {
  const frame = 0x3B4A5E, tire = 0x2A2A2E, seat = 0x4A3A34;
  const cs = Math.cos(ry), sn = Math.sin(ry);
  const at = (lx, lz) => ({ x: x + lx * cs + lz * sn, z: z - lx * sn + lz * cs });
  for (const lx of [-0.52, 0.52]) {
    const p = at(lx, 0);
    b.add(new THREE.TorusGeometry(0.34, 0.05, 5, 12), { x: p.x, y: y + 0.34, z: p.z, ry, color: tire });
  }
  const mid = at(0, 0);
  b.box(1.05, 0.06, 0.06, { x: mid.x, y: y + 0.62, z: mid.z, ry, color: frame });
  b.box(0.06, 0.5, 0.06, { x: at(-0.3, 0).x, y: y + 0.42, z: at(-0.3, 0).z, ry, rz: 0.5, color: frame });
  b.box(0.06, 0.55, 0.06, { x: at(0.42, 0).x, y: y + 0.5, z: at(0.42, 0).z, ry, rz: -0.35, color: frame });
  const hb = at(0.5, 0);
  b.box(0.36, 0.05, 0.05, { x: hb.x, y: y + 0.92, z: hb.z, ry, color: frame });
  const st = at(-0.38, 0);
  b.box(0.26, 0.06, 0.14, { x: st.x, y: y + 0.84, z: st.z, ry, color: seat });
}

// ===== 花圃 =====
export function addFlowerBed(b, x, z, ry = 0, y = 0) {
  const cs = Math.cos(ry), sn = Math.sin(ry);
  b.box(1.7, 0.16, 0.95, { x, y: y + 0.08, z, ry, color: 0x6B5344 });
  b.box(1.86, 0.14, 0.1, { x: x - 0.88 * sn, y: y + 0.16, z: z - 0.88 * cs, ry, color: 0x9A8B72 });
  b.box(1.86, 0.14, 0.1, { x: x + 0.88 * sn, y: y + 0.16, z: z + 0.88 * cs, ry, color: 0x9A8B72 });
  const cols = [0xE86A8A, 0xF0C454, 0xB073C4, 0xF2F0E4, 0xE07A5F];
  for (let i = 0; i < 9; i++) {
    const lx = (Math.random() - 0.5) * 1.5;
    const lz = (Math.random() - 0.5) * 0.8;
    b.add(new THREE.IcosahedronGeometry(0.1 + Math.random() * 0.05, 0), {
      x: x + lx * cs + lz * sn, y: y + 0.26, z: z - lx * sn + lz * cs,
      color: cols[(Math.random() * cols.length) | 0],
    });
  }
}

// ===== 灌木丛 =====
export function addBush(b, x, z, y = 0, s = 1) {
  const n = 2 + ((Math.random() * 3) | 0);
  for (let i = 0; i < n; i++) {
    b.add(new THREE.IcosahedronGeometry((0.3 + Math.random() * 0.25) * s, 0), {
      x: x + (Math.random() - 0.5) * 0.8 * s,
      y: y + 0.22 * s,
      z: z + (Math.random() - 0.5) * 0.8 * s,
      sy: 0.8,
      color: [0x5D9A57, 0x6FA860, 0x84B96B][(Math.random() * 3) | 0],
    });
  }
}

// ===== 八角凉亭 =====
export function createGazebo() {
  const g = new THREE.Group();
  const b = new Builder();
  const R = 2.9;
  b.cyl(R, R + 0.2, 0.32, 8, { y: 0.16, color: 0xCFC4B0 });
  b.cyl(R - 0.3, R - 0.3, 0.1, 8, { y: 0.34, color: 0xB9AE9C });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    b.box(0.16, 2.9, 0.16, { x: Math.cos(a) * (R - 0.25), y: 1.75, z: Math.sin(a) * (R - 0.25), color: 0xE8E0D0 });
    // 栏杆
    if (i % 2 === 0) {
      const a2 = ((i + 1) / 8) * Math.PI * 2;
      const mx = (Math.cos(a) + Math.cos(a2)) * (R - 0.25) / 2;
      const mz = (Math.sin(a) + Math.sin(a2)) * (R - 0.25) / 2;
      const len = Math.hypot(Math.cos(a) - Math.cos(a2), Math.sin(a) - Math.sin(a2)) * (R - 0.25);
      b.box(len, 0.1, 0.08, { x: mx, y: 0.95, z: mz, ry: -a - Math.PI / 8 + Math.PI / 2, color: 0xE8E0D0 });
    }
  }
  b.cyl(0.3, 0.34, 0.3, 8, { y: 2.95 - 1.45, color: 0xE8E0D0 });
  // 瓦顶
  b.add(new THREE.ConeGeometry(R + 0.55, 1.9, 8), { y: 4.0, color: 0xA94C3C });
  b.cyl(0.14, 0.14, 0.5, 6, { y: 5.15, color: 0x8A7A66 });
  b.add(new THREE.IcosahedronGeometry(0.16, 0), { y: 5.45, color: 0xE8C36A });
  const mesh = new THREE.Mesh(b.build(), toonMat({ vertexColors: true }));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.add(new THREE.Mesh(mesh.geometry, makeOutlineMat(0x241f3a, 0.04)));
  g.add(mesh);
  return g;
}

// ===== 路灯（独立 mesh，玻璃单独控制发光）=====
export function createLamp() {
  const g = new THREE.Group();
  const b = new Builder();
  b.cyl(0.3, 0.36, 0.5, 8, { y: 0.25, color: 0x2F3040 });
  b.cyl(0.1, 0.16, 3.5, 8, { y: 0.5 + 1.75, color: 0x35364A });
  b.cyl(0.19, 0.19, 0.14, 8, { y: 3.95, color: 0x35364A });
  b.cyl(0.34, 0.12, 0.42, 6, { y: 4.62, color: 0x2B2C3A });   // 灯罩
  b.cyl(0.06, 0.34, 0.14, 6, { y: 4.96, color: 0x2B2C3A });   // 顶盖
  b.box(0.06, 0.5, 0.06, { y: 5.16, color: 0x2B2C3A });
  b.add(new THREE.IcosahedronGeometry(0.1, 0), { y: 5.44, color: 0xE8C36A });

  const poleMesh = new THREE.Mesh(b.build(), toonMat({ vertexColors: true }));
  poleMesh.castShadow = true;
  poleMesh.receiveShadow = true;
  poleMesh.add(new THREE.Mesh(poleMesh.geometry, makeOutlineMat(0x241f3a, 0.035)));

  const glassMat = toonMat({
    color: 0x3A3F52,
    emissive: new THREE.Color(0xFFD98A),
    emissiveIntensity: 0,
    vertexColors: false,
  });
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.5, 6), glassMat);
  glass.position.y = 4.4;

  // 地面光斑
  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(2.6, 24),
    new THREE.MeshBasicMaterial({
      color: 0xFFCF7E, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.06;

  g.add(poleMesh, glass, pool);
  g.userData = { glassMat, glass, pool, poleMesh };
  return g;
}

// ===== 地标：钟楼 =====
export function createClockTower() {
  const g = new THREE.Group();
  const b = new Builder();
  const stone = 0xDDD3C2;
  const stone2 = 0xBDB2A0;
  b.box(5.2, 4.4, 5.2, { y: 2.2, color: stone2 });
  b.box(4.4, 9.0, 4.4, { y: 8.9, color: stone });
  b.box(5.0, 0.5, 5.0, { y: 13.5, color: stone2 });
  b.box(4.5, 3.6, 4.5, { y: 15.5, color: stone });
  b.box(5.2, 0.4, 5.2, { y: 17.4, color: stone2 });
  // 腰线
  b.box(4.7, 0.22, 4.7, { y: 6.2, color: stone2 });
  b.box(4.7, 0.22, 4.7, { y: 10.4, color: stone2 });
  // 塔身小窗（四面各两组）
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const sx = Math.sin(a) * 2.23, sz = Math.cos(a) * 2.23;
    for (const yy of [7.6, 11.4]) {
      b.box(0.62, 1.15, 0.1, { x: sx, y: yy, z: sz, ry: a, color: 0x2E3238 });
      b.box(0.74, 0.12, 0.16, { x: sx, y: yy + 0.64, z: sz, ry: a, color: stone2 });
    }
  }
  // 尖顶
  b.add(new THREE.ConeGeometry(3.2, 4.2, 4), { y: 19.7, ry: Math.PI / 4, color: 0xA94C3C });
  b.cyl(0.09, 0.09, 1.6, 6, { y: 22.6, color: 0xE8C36A });
  // 门洞与柱
  b.box(1.9, 2.6, 0.4, { y: 1.3, z: 2.62, color: 0x4A3A34 });
  b.box(0.5, 2.6, 0.5, { x: -1.7, y: 1.3, z: 2.45, color: stone2 });
  b.box(0.5, 2.6, 0.5, { x: 1.7, y: 1.3, z: 2.45, color: stone2 });

  const mesh = new THREE.Mesh(b.build(), toonMat({ vertexColors: true }));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.add(new THREE.Mesh(mesh.geometry, makeOutlineMat(0x241f3a, 0.055)));
  g.add(mesh);

  // 表盘（夜间发光）
  const faceMat = toonMat({
    color: 0xF3EDDC,
    emissive: new THREE.Color(0x9FD8FF),
    emissiveIntensity: 0,
    vertexColors: false,
  });
  const faceGeo = new THREE.CylinderGeometry(1.25, 1.25, 0.22, 24);
  faceGeo.rotateX(Math.PI / 2); // 轴沿 Z，正面朝 +Z
  const faces = [];
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const f = new THREE.Mesh(faceGeo, faceMat);
    f.position.set(Math.sin(a) * 2.28, 15.5, Math.cos(a) * 2.28);
    f.rotation.y = a;
    faces.push(f);
    g.add(f);
    // 指针
    const h = new Builder();
    h.box(0.09, 1.0, 0.07, { y: 0.38, z: 0.14, color: 0x332A2A });
    h.box(0.78, 0.09, 0.07, { x: 0.28, y: 0.06, z: 0.14, color: 0x332A2A });
    const hm = new THREE.Mesh(h.build(), toonMat({ vertexColors: true }));
    hm.position.set(Math.sin(a) * 2.34, 15.5, Math.cos(a) * 2.34);
    hm.rotation.y = a;
    g.add(hm);
  }
  g.userData = { faceMat, mesh };
  return g;
}

// ===== 地标：喷泉 =====
export function createFountain() {
  const g = new THREE.Group();
  const b = new Builder();
  b.cyl(4.6, 4.9, 0.7, 32, { y: 0.35, color: 0xD6CCBB });
  b.cyl(4.2, 4.2, 0.3, 32, { y: 0.72, color: 0xB9AE9C });
  b.cyl(1.1, 1.5, 1.1, 12, { y: 1.05, color: 0xD6CCBB });
  b.cyl(2.4, 0.9, 0.5, 16, { y: 1.95, color: 0xD6CCBB });
  b.cyl(1.9, 1.9, 0.14, 16, { y: 2.2, color: 0x9FD4E8 });
  b.add(new THREE.IcosahedronGeometry(0.42, 0), { y: 2.9, color: 0xE8C36A });
  const mesh = new THREE.Mesh(b.build(), toonMat({ vertexColors: true }));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  g.add(mesh);

  const waterMat = toonMat({ color: 0x8FCDE6, vertexColors: false });
  const water = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 0.16, 32), waterMat);
  water.position.y = 0.88;
  g.add(water);
  g.userData = { water };
  return g;
}

// ===== 地标：风车 =====
export function createWindmill() {
  const g = new THREE.Group();
  const b = new Builder();
  b.cyl(2.6, 3.4, 9, 10, { y: 4.5, color: 0xE8DCC6 });
  b.cyl(3.5, 3.5, 0.4, 10, { y: 0.2, color: 0xB9AE9C });
  b.add(new THREE.ConeGeometry(3.0, 2.6, 10), { y: 10.3, color: 0xA94C3C });
  b.box(1.4, 2.2, 0.3, { y: 1.4, z: 2.9, color: 0x7A4B36 });
  const mesh = new THREE.Mesh(b.build(), toonMat({ vertexColors: true }));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.add(new THREE.Mesh(mesh.geometry, makeOutlineMat(0x241f3a, 0.05)));
  g.add(mesh);

  const blades = new THREE.Group();
  const bb = new Builder();
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const cx = Math.sin(a) * 3.2;
    const cy = Math.cos(a) * 3.2;
    bb.box(1.5, 5.6, 0.16, { x: cx, y: cy, z: 0, rz: -a, color: 0xF0E6D2 });
    bb.box(0.2, 5.2, 0.24, { x: cx, y: cy, z: 0.02, rz: -a, color: 0x8A6A48 });
  }
  bb.cyl(0.4, 0.4, 0.5, 8, { z: 0.1, rx: Math.PI / 2, color: 0x5A4A42 });
  const bm = new THREE.Mesh(bb.build(), toonMat({ vertexColors: true }));
  bm.castShadow = true;
  blades.position.set(0, 8.6, 2.9);
  blades.add(bm);
  g.add(blades);
  g.userData = { blades };
  return g;
}

// ===== 地标：水塔 =====
export function createWaterTower() {
  const g = new THREE.Group();
  const b = new Builder();
  const legs = [[-1.8, -1.8], [1.8, -1.8], [-1.8, 1.8], [1.8, 1.8]];
  for (const [x, z] of legs) b.box(0.32, 6.4, 0.32, { x, y: 3.2, z, color: 0x5A4A42 });
  b.box(4.2, 0.24, 0.24, { y: 2.4, z: -1.8, color: 0x5A4A42 });
  b.box(4.2, 0.24, 0.24, { y: 2.4, z: 1.8, color: 0x5A4A42 });
  b.cyl(2.6, 2.6, 3.4, 12, { y: 8.2, color: 0x9FB2BE });
  b.add(new THREE.ConeGeometry(2.9, 1.9, 12), { y: 10.85, color: 0x7F97A6 });
  b.cyl(0.14, 0.14, 1.4, 6, { y: 11.9, color: 0x5A6672 });
  const mesh = new THREE.Mesh(b.build(), toonMat({ vertexColors: true }));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.add(new THREE.Mesh(mesh.geometry, makeOutlineMat(0x241f3a, 0.05)));
  g.add(mesh);
  return g;
}
