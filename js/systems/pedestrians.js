import * as THREE from 'three';
import { Builder } from '../lib/geo.js';
import { toonMat, makeOutlineMat } from '../lib/npr.js';
import { CFG } from '../config.js';

const D2R = THREE.MathUtils.degToRad;
const wrap = (v, L) => ((v % L) + L) % L;

const SKIN = [0xF0C9A8, 0xE5B891, 0xC99A76, 0x9A6C4E, 0x7A5540];
const COAT = [0xE07A5F, 0x3D5A80, 0x7FA37E, 0xD0A227, 0x9A6B8C, 0xE9C46A, 0x6B7B8C, 0xD65D4E, 0x4F6E62, 0xB4593F];
const PANT = [0x3C4257, 0x5B4636, 0x2F3A4A, 0x6D5A4A, 0x4A4A5C];
const HAIR = [0x2E2A28, 0x4A3526, 0x6B4A2E, 0x1E1C1A, 0x8A7A5E];
const pick = (a) => a[(Math.random() * a.length) | 0];

const bodyMat = toonMat({ vertexColors: true });
const outlineMat = makeOutlineMat(0x241f3a, 0.035);

/** 低多边形小人（脚底 y=0，面朝 +Z） */
function buildPed() {
  const kid = Math.random() < 0.22;
  const s = kid ? 0.62 + Math.random() * 0.1 : 0.86 + Math.random() * 0.22;
  const coat = pick(COAT), pant = pick(PANT), skin = pick(SKIN), hair = pick(HAIR);
  const hat = Math.random() < 0.3, bag = Math.random() < 0.22, scarf = Math.random() < 0.35;

  const b = new Builder();
  const hip = 0.78 * s;

  b.box(0.46 * s, 0.34 * s, 0.3 * s, { y: hip + 0.02, color: coat });
  b.box(0.42 * s, 0.42 * s, 0.26 * s, { y: hip + 0.36 * s, color: coat });
  b.box(0.46 * s, 0.1 * s, 0.28 * s, { y: hip + 0.55 * s, color: new THREE.Color(coat).multiplyScalar(0.88) });
  b.box(0.1 * s, 0.42 * s, 0.13 * s, { x: 0.25 * s, y: hip + 0.34 * s, rz: 0.08, color: coat });
  b.box(0.1 * s, 0.42 * s, 0.13 * s, { x: -0.25 * s, y: hip + 0.34 * s, rz: -0.08, color: coat });
  b.box(0.1 * s, 0.1 * s, 0.13 * s, { x: 0.27 * s, y: hip + 0.12 * s, color: skin });
  b.box(0.1 * s, 0.1 * s, 0.13 * s, { x: -0.27 * s, y: hip + 0.12 * s, color: skin });
  if (scarf) b.box(0.44 * s, 0.11 * s, 0.3 * s, { y: hip + 0.6 * s, color: pick([0xC0483C, 0xE0C36A, 0x5A8FA0]) });
  b.box(0.12 * s, 0.1 * s, 0.12 * s, { y: hip + 0.63 * s, color: skin });
  b.add(new THREE.IcosahedronGeometry(0.17 * s, 1), { y: hip + 0.79 * s, sy: 1.05, color: skin });
  if (hat) {
    b.cyl(0.2 * s, 0.21 * s, 0.13 * s, 8, { y: hip + 0.94 * s, color: pick([0x4A3B33, 0x2E3440, 0x7A4B36]) });
    b.cyl(0.28 * s, 0.28 * s, 0.03 * s, 10, { y: hip + 0.88 * s, color: 0x3A2E2A });
  } else {
    b.add(new THREE.IcosahedronGeometry(0.178 * s, 1), { y: hip + 0.83 * s, sy: 0.72, sz: 1.02, color: hair });
  }
  if (bag) b.box(0.3 * s, 0.34 * s, 0.16 * s, { y: hip + 0.36 * s, z: -0.2 * s, color: pick([0x6B5A4A, 0x4A5A6E, 0x8A6A3C]) });

  const bodyMesh = new THREE.Mesh(b.build(), bodyMat);
  bodyMesh.castShadow = true;
  bodyMesh.add(new THREE.Mesh(bodyMesh.geometry, outlineMat));

  const legGeo = (() => {
    const lb = new Builder();
    lb.box(0.155 * s, 0.76 * s, 0.17 * s, { y: -0.38 * s, color: pant });
    lb.box(0.17 * s, 0.1 * s, 0.26 * s, { y: -0.72 * s, z: 0.04 * s, color: 0x2A2622 });
    return lb.build();
  })();
  const legL = new THREE.Mesh(legGeo, bodyMat);
  const legR = new THREE.Mesh(legGeo, bodyMat);
  legL.castShadow = legR.castShadow = true;
  legL.add(new THREE.Mesh(legGeo, outlineMat));
  legR.add(new THREE.Mesh(legGeo, outlineMat));

  const bodyG = new THREE.Group();
  bodyG.add(bodyMesh);
  const root = new THREE.Group();
  root.add(bodyG, legL, legR);
  legL.position.y = hip;
  legR.position.y = hip;

  return { root, bodyG, legL, legR, hip, isDog: false, speed: (kid ? 1.05 : 1.25) + Math.random() * 0.55 };
}

/** 狗（面朝 +Z，脚底 y=0） */
function buildDog() {
  const s = 1.0;
  const b = new Builder();
  const fur = pick([0xC9A06A, 0x8A6A4A, 0xEDE3D2, 0x4A4048]);
  b.box(0.28 * s, 0.3 * s, 0.74 * s, { y: 0.52 * s, color: fur });
  b.box(0.24 * s, 0.24 * s, 0.24 * s, { y: 0.66 * s, z: 0.42 * s, color: fur });
  b.box(0.16 * s, 0.14 * s, 0.16 * s, { y: 0.6 * s, z: 0.58 * s, color: new THREE.Color(fur).multiplyScalar(0.85) });
  b.box(0.06 * s, 0.12 * s, 0.06 * s, { x: 0.1 * s, y: 0.8 * s, z: 0.38 * s, color: new THREE.Color(fur).multiplyScalar(0.8) });
  b.box(0.06 * s, 0.12 * s, 0.06 * s, { x: -0.1 * s, y: 0.8 * s, z: 0.38 * s, color: new THREE.Color(fur).multiplyScalar(0.8) });
  b.box(0.08 * s, 0.08 * s, 0.28 * s, { y: 0.62 * s, z: -0.42 * s, rx: -0.6, color: fur });

  const bodyMesh = new THREE.Mesh(b.build(), bodyMat);
  bodyMesh.castShadow = true;
  bodyMesh.add(new THREE.Mesh(bodyMesh.geometry, outlineMat));

  const legGeo = (() => {
    const lb = new Builder();
    lb.box(0.1 * s, 0.42 * s, 0.11 * s, { y: -0.2 * s, color: new THREE.Color(fur).multiplyScalar(0.9) });
    lb.box(0.12 * s, 0.07 * s, 0.16 * s, { y: -0.4 * s, z: 0.02 * s, color: 0x3A3028 });
    return lb.build();
  })();
  const legs = [];
  const root = new THREE.Group();
  root.add(bodyMesh);
  for (const lx of [-0.11, 0.11]) {
    for (const lz of [0.26, -0.26]) {
      const m = new THREE.Mesh(legGeo, bodyMat);
      m.position.set(lx * s, 0.42 * s, lz * s);
      m.castShadow = true;
      m.add(new THREE.Mesh(legGeo, outlineMat));
      root.add(m);
      legs.push(m);
    }
  }
  return { root, legs, isDog: true, bodyMesh };
}

/** 折线路径 */
class WalkPath {
  constructor(pts) {
    this.segs = [];
    let total = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const dx = b[0] - a[0], dz = b[1] - a[1];
      const len = Math.hypot(dx, dz);
      if (len < 1e-4) continue;
      this.segs.push({ a, dx, dz, len, start: total });
      total += len;
    }
    this.length = total;
    this.gates = [];
    this.stops = [];
  }
  sample(d) {
    d = wrap(d, this.length);
    let lo = 0, hi = this.segs.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (this.segs[mid].start <= d) lo = mid;
      else hi = mid - 1;
    }
    const s = this.segs[lo];
    const t = Math.min(1, (d - s.start) / s.len);
    return { x: s.a[0] + s.dx * t, z: s.a[1] + s.dz * t, dx: s.dx / s.len, dz: s.dz / s.len };
  }
  /** 半径落在环岛路内 → 需要过马路 */
  findGates(group) {
    const T = CFG.town;
    const gates = [];
    const step = 0.5;
    let prevIn = false;
    let firstIn = null;
    for (let d = 0; d <= this.length; d += step) {
      const s = this.sample(d);
      const r = Math.hypot(s.x, s.z);
      const inRoad = r > T.ringIn - 0.6 && r < T.ringOut + 0.6;
      if (inRoad && !prevIn) {
        if (firstIn === null && d < 1) firstIn = true;
        else gates.push({ d: Math.max(0, d - 0.6), group });
      }
      prevIn = inRoad;
    }
    this.gates = gates;
    return gates;
  }
}

function ringPoints(radius, dir = 1, n = 88) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (dir > 0 ? 1 : -1) * (i / n) * Math.PI * 2;
    pts.push([Math.cos(a) * radius, Math.sin(a) * radius]);
  }
  return pts;
}

function radialLoop(a, rStart, rEnd, off, dir = 1) {
  const dx = Math.cos(a), dz = Math.sin(a);
  const tx = -Math.sin(a), tz = Math.cos(a);
  const pts = [];
  const step = 2.6;
  const arc = 9;
  const push = (r, lat) => pts.push([dx * r + tx * lat, dz * r + tz * lat]);
  if (dir > 0) {
    for (let r = rStart; r < rEnd; r += step) push(r, off);
    for (let i = 1; i < arc; i++) {
      const th = (Math.PI * i) / arc;
      push(rEnd + off * Math.sin(th), off * Math.cos(th));
    }
    for (let r = rEnd; r > rStart; r -= step) push(r, -off);
    for (let i = 1; i < arc; i++) {
      const th = (Math.PI * i) / arc;
      push(rStart - off * Math.sin(th), -off * Math.cos(th));
    }
  } else {
    for (let r = rStart; r < rEnd; r += step) push(r, -off);
    for (let i = 1; i < arc; i++) {
      const th = (Math.PI * i) / arc;
      push(rEnd + off * Math.sin(th), -off * Math.cos(th));
    }
    for (let r = rEnd; r > rStart; r -= step) push(r, off);
    for (let i = 1; i < arc; i++) {
      const th = (Math.PI * i) / arc;
      push(rStart - off * Math.sin(th), off * Math.cos(th));
    }
  }
  return pts;
}

/** 红绿灯周期：两相位交替 */
export class TrafficCycle {
  constructor() {
    this.t = 0;
    this.period = 15;
    this.walkTime = 8.5;
  }
  update(dt) { this.t = (this.t + dt) % this.period; }
  isWalk(group) { return wrap(this.t + (group ? this.period / 2 : 0), this.period) < this.walkTime; }
}

export class PedestrianSystem {
  constructor(scene, lights) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.lights = lights;
    this.peds = [];
    this.dogs = [];

    const T = CFG.town;
    const paths = [];
    const addPath = (pts, group, opts = {}) => {
      const p = new WalkPath(pts);
      p.group = group;
      p.findGates(group);
      p.stops = opts.stops || [];
      paths.push(p);
      return p;
    };

    // 广场环（有摊位）
    const plazaPts = ringPoints(T.plazaR - 2.0, 1, 64);
    const plazaPath = addPath(plazaPts, 0);
    // 摊位停留点：摊位在 0.55 + i*90°，圆上同一角度就是最近点
    for (let i = 0; i < 4; i++) {
      const ang = 0.55 + (i / 4) * Math.PI * 2 + Math.PI / 2; // 与摊位朝向一致
      plazaPath.stops.push({ d: (ang / (Math.PI * 2)) * plazaPath.length, face: ang + Math.PI });
    }
    plazaPath.stops.forEach((s) => { s.d = wrap(s.d, plazaPath.length); });

    // 环岛路内外两条
    addPath(ringPoints((T.ringIn + T.ringOut) / 2 - 5.0, 1, 96), 1);
    addPath(ringPoints((T.ringIn + T.ringOut) / 2 + 5.0, -1, 96), 1);

    // 四条放射街（各自过两次马路）
    for (let i = 0; i < T.roadAngles.length; i++) {
      const a = D2R(T.roadAngles[i]);
      const g = i % 2;
      addPath(radialLoop(a, 21.5, T.roadOut - 1.5, T.roadW / 2 + 1.5, 1), g);
      addPath(radialLoop(a, 21.5, T.roadOut - 1.5, T.roadW / 2 + 1.5, -1), g);
    }
    this.paths = paths;

    const totalLen = paths.reduce((s, p) => s + p.length, 0);
    const want = 24;
    paths.forEach((path) => {
      const n = Math.max(1, Math.round((path.length / totalLen) * want));
      for (let i = 0; i < n; i++) {
        const p = buildPed();
        p.path = path;
        p.d = (path.length * i) / n + Math.random() * 8;
        p.d = wrap(p.d, path.length);
        p.phase = Math.random() * Math.PI * 2;
        p.yaw = 0;
        p.mode = 'walk';
        p.scale = 1;
        p.pauseT = 0;
        p.stopsLeft = new Set();
        // 夜里约 65% 的人回家
        p.nightOff = Math.random() < 0.65;
        p.homeD = Math.random() * path.length;
        p.legAmt = 0;
        this.peds.push(p);
        this.group.add(p.root);
        const s0 = path.sample(p.d);
        p.root.position.set(s0.x, 0, s0.z);
      }
    });

    // 狗：跟着第一个广场上的行人
    const owner = this.peds.find((p) => p.path === plazaPath) || this.peds[0];
    if (owner) {
      const dog = buildDog();
      dog.path = owner.path;
      dog.owner = owner;
      dog.d = owner.d - 1.5;
      dog.yaw = 0;
      dog.phase = 0;
      dog.mode = 'walk';
      dog.scale = 1;
      dog.legAmt = 0;
      this.dogs.push(dog);
      this.group.add(dog.root);
      owner.hasDog = true;
    }
  }

  update(dt, t, night = 0) {
    const walk0 = this.lights.isWalk(0);
    const walk1 = this.lights.isWalk(1);

    // ---- 人 ----
    for (const p of this.peds) {
      const L = p.path.length;

      // 夜间回家 / 白天出门
      if (p.nightOff) {
        if (night > 0.62 && p.mode === 'walk') p.mode = 'home';
        if (night < 0.4 && p.mode === 'hidden') p.mode = 'return';
      }
      if (p.mode === 'hidden') {
        p.root.visible = false;
        continue;
      }
      p.root.visible = true;

      if (p.mode === 'return') {
        p.scale = Math.min(1, p.scale + dt * 2.2);
        if (p.scale >= 1) p.mode = 'walk';
      }

      let moving = false;
      let targetSpeed = p.speed;

      if (p.mode === 'linger') {
        p.pauseT -= dt;
        if (p.pauseT <= 0) p.mode = 'walk';
      } else if (p.mode === 'home') {
        const toHome = wrap(p.homeD - p.d, L);
        const away = Math.min(toHome, L - toHome);
        if (away < 0.6) {
          p.scale -= dt * 1.8;
          if (p.scale <= 0.02) { p.mode = 'hidden'; p.root.visible = false; }
        } else {
          p.d = wrap(p.d + p.speed * 1.3 * dt * (toHome < L / 2 ? 1 : -1), L);
          moving = true;
        }
      } else {
        // 红绿灯：先看前方 2.2 单位内有没有闸口
        let blocked = false;
        const walkState = p.path.group === 0 ? walk0 : walk1;
        for (const g of p.path.gates) {
          const ahead = wrap(g.d - p.d, L);
          if (ahead > 0.05 && ahead < 2.2 && !walkState) { blocked = true; break; }
        }
        if (blocked) {
          p.mode = 'wait';
        } else {
          if (p.mode === 'wait') p.mode = 'walk';
          // 摊位停留
          if (p.path.stops.length && !p.pauseT) {
            for (let si = 0; si < p.path.stops.length; si++) {
              const st = p.path.stops[si];
              const ahead = wrap(st.d - p.d, L);
              if (ahead > 0 && ahead < 0.9 && !p.stopsLeft.has(si)) {
                p.stopsLeft.add(si);
                if (Math.random() < 0.45) {
                  p.mode = 'linger';
                  p.pauseT = 4 + Math.random() * 6;
                  p.faceYaw = st.face;
                  p.lingerYaw = st.face;
                }
              }
            }
          }
          if (p.mode !== 'linger') {
            // 到达后重置已停过的摊位，形成循环
            if (Math.random() < 0.0005) p.stopsLeft.clear();
            p.d = wrap(p.d + p.speed * dt, L);
            moving = true;
          }
        }
      }

      const s = p.path.sample(p.d);
      p.root.position.x = s.x;
      p.root.position.z = s.z;

      let target = Math.atan2(s.dx, s.dz);
      if (p.mode === 'linger' && p.lingerYaw !== undefined) target = p.lingerYaw;
      let delta = target - p.yaw;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      p.yaw += delta * Math.min(1, dt * 6);
      p.root.rotation.y = p.yaw;
      p.root.scale.setScalar(Math.max(0.001, p.scale));

      // 动画
      p.legAmt += ((moving ? 1 : 0) - p.legAmt) * Math.min(1, dt * 8);
      if (moving) p.phase += dt * p.speed * 5.2;
      const sw = Math.sin(p.phase);
      p.legL.rotation.x = sw * 0.55 * p.legAmt;
      p.legR.rotation.x = -sw * 0.55 * p.legAmt;
      p.bodyG.position.y = Math.abs(Math.cos(p.phase)) * 0.035 * p.legAmt + Math.sin(t * 1.6 + p.phase) * 0.006;
      p.bodyG.rotation.z = sw * 0.02 * p.legAmt;
      if (p.mode === 'linger') {
        p.bodyG.rotation.y = Math.sin(t * 0.7 + p.phase) * 0.12;
      } else {
        p.bodyG.rotation.y *= 0.9;
      }
    }

    // ---- 狗 ----
    for (const dog of this.dogs) {
      const owner = dog.owner;
      const L = dog.path.length;
      if (!owner.root.visible) { dog.root.visible = false; continue; }
      dog.root.visible = true;
      const targetD = wrap(owner.d - 1.55, L);
      let diff = targetD - dog.d;
      if (diff > L / 2) diff -= L;
      if (diff < -L / 2) diff += L;
      dog.d = wrap(dog.d + diff * Math.min(1, dt * 3.2), L);

      const s = dog.path.sample(dog.d);
      dog.root.position.x = s.x;
      dog.root.position.z = s.z;
      let target = Math.atan2(s.dx, s.dz);
      let delta = target - dog.yaw;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      dog.yaw += delta * Math.min(1, dt * 6);
      dog.root.rotation.y = dog.yaw;
      dog.root.scale.setScalar(Math.max(0.001, owner.scale));

      const running = owner.mode === 'walk' || owner.mode === 'home';
      dog.legAmt += ((running ? 1 : 0) - dog.legAmt) * Math.min(1, dt * 8);
      if (running) dog.phase += dt * owner.speed * 7.5;
      const sw = Math.sin(dog.phase);
      // 四条腿交替
      dog.legs[0].rotation.x = sw * 0.7 * dog.legAmt;
      dog.legs[1].rotation.x = -sw * 0.7 * dog.legAmt;
      dog.legs[2].rotation.x = -sw * 0.7 * dog.legAmt;
      dog.legs[3].rotation.x = sw * 0.7 * dog.legAmt;
      // 停下时坐下
      if (!running) {
        dog.root.position.y = -0.06;
      } else {
        dog.root.position.y = Math.abs(Math.sin(dog.phase)) * 0.03;
      }
    }
  }
}
