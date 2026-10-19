import * as THREE from 'three';
import { CFG, PAL } from '../config.js';
import { toonMat, makeOutlineMat } from '../lib/npr.js';
import { Builder, rnd, pick } from '../lib/geo.js';
import { terrainY } from './island.js';
import { createHouse } from './houses.js';
import {
  addTree, addBench, addBin, addHydrant, addPlanter, addSign, addStone, addFence,
  addStall, addBike, addFlowerBed, addBush, createGazebo,
  createLamp, createClockTower, createFountain, createWindmill, createWaterTower,
} from './props.js';
import { PROFESSIONS, makeOwner } from '../data/owners.js';

const D2R = THREE.MathUtils.degToRad;

function groundPlane(w, h, mat) {
  const g = new THREE.PlaneGeometry(w, h);
  g.rotateX(-Math.PI / 2);
  return new THREE.Mesh(g, mat);
}

function placeStrip(mesh, r, a, y) {
  mesh.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
  mesh.rotation.y = Math.PI / 2 - a;
  return mesh;
}

function makeDisc(R, seg, cA, cB) {
  const pos = [], col = [], idx = [];
  const a = new THREE.Color(cA), b = new THREE.Color(cB);
  pos.push(0, 0, 0); col.push(a.r, a.g, a.b);
  for (let i = 0; i < seg; i++) {
    const ang = (i / seg) * Math.PI * 2;
    pos.push(Math.cos(ang) * R, 0, Math.sin(ang) * R);
    const c = i % 2 ? b : a;
    col.push(c.r, c.g, c.b);
  }
  for (let i = 0; i < seg; i++) {
    const n = (i + 1) % seg;
    if (i % 2) idx.push(0, i + 1, n + 1);
    else idx.push(0, n + 1, i + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function buildTown() {
  const group = new THREE.Group();
  const T = CFG.town;
  const houses = [];
  const lamps = [];
  const staticB = new Builder();
  let houseIndex = 0;

  const roadMat = toonMat({ color: PAL.road });
  const walkMat = toonMat({ color: PAL.stone });
  const lineMat = toonMat({ color: PAL.line });
  const curbMat = toonMat({ color: 0xC3BAA8 });

  // ---------- 广场 ----------
  const plazaMat = toonMat({ color: 0xD5CBB9 });
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(T.plazaR, 64), plazaMat);
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.y = 0.085;
  plaza.receiveShadow = true;
  group.add(plaza);

  // 同心铺装环
  const inlayMat = toonMat({ color: 0xB9AE9C });
  for (const rr of [4.6, 8.4, 12.2]) {
    const ring2 = new THREE.Mesh(new THREE.RingGeometry(rr - 0.16, rr + 0.16, 72), inlayMat);
    ring2.rotation.x = -Math.PI / 2;
    ring2.position.y = 0.092;
    ring2.receiveShadow = true;
    group.add(ring2);
  }

  const plazaRim = new THREE.Mesh(
    new THREE.RingGeometry(T.plazaR - 1.0, T.plazaR + 0.6, 72),
    toonMat({ color: 0x9C927F })
  );
  plazaRim.rotation.x = -Math.PI / 2;
  plazaRim.position.y = 0.1;
  plazaRim.receiveShadow = true;
  group.add(plazaRim);

  // ---------- 环岛路 ----------
  const ringWalk = new THREE.Mesh(
    new THREE.RingGeometry(T.ringIn - T.sidewalk, T.ringOut + T.sidewalk, 110),
    walkMat
  );
  ringWalk.rotation.x = -Math.PI / 2;
  ringWalk.position.y = 0.03;
  ringWalk.receiveShadow = true;
  group.add(ringWalk);

  const ring = new THREE.Mesh(new THREE.RingGeometry(T.ringIn, T.ringOut, 110), roadMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.055;
  ring.receiveShadow = true;
  group.add(ring);

  // ---------- 放射状道路 ----------
  const roadLen = T.roadOut - T.roadIn;
  const roadMid = (T.roadOut + T.roadIn) / 2;
  for (const deg of T.roadAngles) {
    const a = D2R(deg);
    const walk = groundPlane(T.roadW + T.sidewalk * 2, roadLen + 3, walkMat);
    placeStrip(walk, roadMid, a, 0.032);
    walk.receiveShadow = true;
    group.add(walk);

    const road = groundPlane(T.roadW, roadLen + 3, roadMat);
    placeStrip(road, roadMid, a, 0.056);
    road.receiveShadow = true;
    group.add(road);

    // 路缘石
    for (const s of [-1, 1]) {
      const c = groundPlane(0.38, roadLen + 3, curbMat);
      const off = T.roadW / 2 + 0.16;
      c.position.set(
        Math.cos(a) * roadMid + -Math.sin(a) * off * s, 0.085,
        Math.sin(a) * roadMid + Math.cos(a) * off * s
      );
      c.rotation.y = Math.PI / 2 - a;
      c.receiveShadow = true;
      c.castShadow = true;
      group.add(c);
    }
  }

  // ---------- 道路尽头的环形小广场 ----------
  for (const deg of T.roadAngles) {
    const a = D2R(deg);
    const x = Math.cos(a) * T.roadOut;
    const z = Math.sin(a) * T.roadOut;
    const disc = new THREE.Mesh(new THREE.CircleGeometry(5.4, 32), plazaMat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(x, 0.058, z);
    disc.receiveShadow = true;
    group.add(disc);
    addTree(staticB, x, z, 0, 1.45);
    addBench(staticB, x + 2.4, z + 1.2, a, 0);
    addBench(staticB, x - 2.2, z - 1.4, a + Math.PI, 0);
  }

  // ---------- 路面标线（虚线 + 斑马线，全部合并成一个 mesh）----------
  const lineB = new Builder();
  for (const deg of T.roadAngles) {
    const a = D2R(deg);
    for (let r = T.roadIn + 3; r < T.roadOut - 1; r += 4.6) {
      lineB.box(0.26, 0.03, 2.4, {
        x: Math.cos(a) * r, y: 0.068, z: Math.sin(a) * r, ry: Math.PI / 2 - a, color: PAL.line,
      });
    }
  }

  const crossings = [];
  for (const deg of T.roadAngles) {
    const a = D2R(deg);
    crossings.push({ r: T.plazaR + 2.8, a });
    crossings.push({ r: T.ringIn - 1.4, a });
    crossings.push({ r: T.ringOut + 1.4, a });
  }
  for (const { r, a } of crossings) {
    const tx = -Math.sin(a), tz = Math.cos(a);
    for (let i = 0; i < 6; i++) {
      const off = (i - 2.5) * 1.15;
      lineB.box(0.62, 0.03, 3.4, {
        x: Math.cos(a) * r + tx * off + rnd(-0.03, 0.03),
        y: 0.072,
        z: Math.sin(a) * r + tz * off + rnd(-0.03, 0.03),
        ry: Math.PI / 2 - a + rnd(-0.012, 0.012),
        color: PAL.line,
      });
    }
    const rr = r + 2.9;
    lineB.box(T.roadW * 0.94, 0.03, 0.4, {
      x: Math.cos(a) * rr, y: 0.072, z: Math.sin(a) * rr, ry: Math.PI / 2 - a, color: PAL.line,
    });
  }
  const lineMesh = new THREE.Mesh(lineB.build(), toonMat({ vertexColors: true }));
  lineMesh.receiveShadow = true;
  group.add(lineMesh);

  // ---------- 行人红绿灯 ----------
  const walkB = [new Builder(), new Builder()];
  const stopB = [new Builder(), new Builder()];
  crossings.forEach(({ r, a }, ci) => {
    const gi = Math.floor(ci / 3) % 2;
    const tx = -Math.sin(a), tz = Math.cos(a);
    const lat = T.roadW / 2 + 1.05;
    const px = Math.cos(a) * r + tx * lat;
    const pz = Math.sin(a) * r + tz * lat;
    // 立柱
    staticB.cyl(0.07, 0.09, 2.55, 6, { x: px, y: 1.27, z: pz, color: 0x3A3A42 });
    staticB.box(0.3, 0.12, 0.3, { x: px, y: 0.06, z: pz, color: 0x2E2E36 });
    // 灯箱（面朝斑马线）
    const fx = -tx, fz = -tz;
    const ry = Math.atan2(fx, fz);
    staticB.box(0.42, 0.78, 0.26, { x: px, y: 2.7, z: pz, ry, color: 0x33333C });
    staticB.box(0.5, 0.08, 0.34, { x: px, y: 3.13, z: pz, ry, color: 0x33333C });
    const ox = px + fx * 0.16, oz = pz + fz * 0.16;
    walkB[gi].box(0.3, 0.26, 0.04, { x: ox, y: 2.52, z: oz, ry, color: 0x4CE07A });
    stopB[gi].box(0.3, 0.26, 0.04, { x: ox, y: 2.86, z: oz, ry, color: 0xFF5A4A });
  });
  const signals = [];
  for (let gi = 0; gi < 2; gi++) {
    const walkMesh = new THREE.Mesh(walkB[gi].build(), toonMat({ vertexColors: true }));
    const stopMesh = new THREE.Mesh(stopB[gi].build(), toonMat({ vertexColors: true }));
    walkMesh.visible = false;
    group.add(walkMesh, stopMesh);
    signals.push({ group: gi, walkMesh, stopMesh });
  }

  // ---------- 房屋 ----------
  const frontGap = T.roadW / 2 + T.sidewalk;

  function placeAlong(a, side, rStart, rEnd, slots) {
    const span = rEnd - rStart;
    const slot = span / slots;
    let i = 0;
    while (i < slots) {
      let take = 1;
      if (i < slots - 1 && Math.random() < 0.26) take = 2;
      const w = Math.max(3.6, slot * take - rnd(1.1, 2.1));
      const d = rnd(5.0, 7.0);
      const rCenter = rStart + slot * (i + take / 2);
      const offset = frontGap + d / 2 + 0.35;
      const tx = -Math.sin(a), tz = Math.cos(a);
      placeHouse(
        Math.cos(a) * rCenter + tx * offset * side,
        Math.sin(a) * rCenter + tz * offset * side,
        a, side, w, d
      );
      i += take;
    }
  }

  function placeHouse(px, pz, a, side, w, d) {
    const idx = houseIndex++;
    const prof = PROFESSIONS[idx % PROFESSIONS.length];
    const owner = makeOwner(idx, prof.id);
    const isLighthouse = prof.id === 'lighthouse';
    const isClockmaker = prof.id === 'clockmaker';
    const isCloud = prof.id === 'cloud';
    const shop = ['bakery', 'bookstore', 'umbrella'].includes(prof.id);

    // 职业决定体量：窄高的钟表匠/拾云人、方正的灯塔
    let ww = w, dd = d, floors;
    if (isClockmaker) { ww = Math.min(w, 5.0); floors = 3; }
    else if (isCloud) { ww = Math.min(w, 4.8); floors = Math.random() < 0.5 ? 2 : 3; }
    else if (isLighthouse) { ww = Math.max(w, 5.2); floors = 2; }
    else floors = w > 6.1 ? (Math.random() < 0.72 ? 2 : 3) : (Math.random() < 0.5 ? 1 : 2);

    const roofType = isClockmaker ? 'gable' : (ww > 5.6 && Math.random() < 0.28 ? 'pyramid' : Math.random() < 0.06 ? 'flat' : 'gable');
    const h = isClockmaker ? rnd(8.8, 10.0)
      : isCloud ? rnd(7.4, 9.0)
        : floors === 1 ? rnd(3.6, 4.5) : floors === 2 ? rnd(6.4, 7.8) : rnd(9.0, 10.4);
    const roofH = roofType === 'pyramid' ? rnd(2.4, 3.2) : rnd(1.6, 2.6);

    const rec = createHouse({
      w: ww, d: dd, h, floors, roofType, roofH,
      wallColor: pick(prof.wall),
      roofColor: pick(prof.roof),
      trimColor: pick(prof.trim),
      doorColor: pick(prof.door),
      shutterColor: pick(PAL.shutter),
      shutters: Math.random() < 0.75,
      balcony: floors >= 2 && Math.random() < 0.42,
      chimney: !isLighthouse && Math.random() < 0.8,
      shop,
      sign: shop && Math.random() < 0.75,
      profession: prof.id,
      timber: Math.random() < 0.3,
      dormer: floors >= 2 && Math.random() < 0.35,
      quoins: Math.random() < 0.35,
    });
    rec.owner = owner;
    rec.w = ww; rec.d = dd;

    const dx = Math.sin(a) * side;
    const dz = -Math.cos(a) * side;
    const yaw = Math.atan2(dx, dz) + rnd(-0.04, 0.04);
    rec.group.position.set(px, terrainY(Math.hypot(px, pz)), pz);
    rec.group.rotation.y = yaw;
    rec.distToCenter = Math.hypot(px, pz);
    rec.yaw = yaw;
    group.add(rec.group);
    houses.push(rec);

    // ---- 院子：侧边绿篱 + 门前石径 + 信箱 ----
    const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
    const L = (lx, lz) => ({ x: px + lx * cosY + lz * sinY, z: pz - lx * sinY + lz * cosY });
    for (const s of [-1, 1]) {
      const hh = L(s * (ww / 2 + 1.9), -0.4);
      staticB.box(0.5, rnd(0.75, 1.05), dd * 0.7, { x: hh.x, y: 0.45, z: hh.z, ry: yaw, color: 0x5E8F52 });
    }
    const p2 = L(0, dd / 2 + 1.2);
    staticB.box(1.35, 0.07, 2.6, { x: p2.x, y: 0.03, z: p2.z, ry: yaw, color: PAL.stone });
    const p3 = L(ww / 2 + 0.1, dd / 2 + 1.5);
    staticB.box(0.1, 0.95, 0.1, { x: p3.x, y: 0.48, z: p3.z, ry: yaw, color: 0x4A4B58 });
    staticB.box(0.26, 0.2, 0.36, { x: p3.x, y: 1.02, z: p3.z, ry: yaw, color: 0x8E6A4E });
    if (Math.random() < 0.4) {
      const p4 = L(-ww / 2 - 1.3, dd / 2 + 1.1);
      addBike(staticB, p4.x, p4.z, yaw + 1.57, 0);
    }
    if (Math.random() < 0.45) {
      const p5 = L(ww * 0.36, dd / 2 + 0.95);
      addFlowerBed(staticB, p5.x, p5.z, yaw, 0);
    }
    if (Math.random() < 0.3) {
      const p6 = L(-ww * 0.3, dd / 2 + 1.9);
      addBush(staticB, p6.x, p6.z, 0, 1);
    }
  }

  for (const deg of T.roadAngles) {
    const a = D2R(deg);
    for (const side of [-1, 1]) {
      placeAlong(a, side, T.innerR[0], T.innerR[1], 2);
      placeAlong(a, side, T.outerR[0], T.outerR[1], 3);
    }
  }

  // ---------- 路灯 ----------
  const lampSpots = [];
  for (const deg of T.roadAngles) {
    const a = D2R(deg);
    const list = [
      { r: 18, side: 1 }, { r: 25, side: -1 }, { r: 31, side: 1 },
      { r: 44, side: -1 }, { r: 51, side: 1 }, { r: 58, side: -1 },
    ];
    for (const s of list) {
      const off = T.roadW / 2 + 1.0;
      const tx = -Math.sin(a), tz = Math.cos(a);
      lampSpots.push({
        x: Math.cos(a) * s.r + tx * off * s.side,
        z: Math.sin(a) * s.r + tz * off * s.side,
        a,
      });
    }
  }
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2 + 0.4;
    lampSpots.push({ x: Math.cos(ang) * (T.plazaR - 1.4), z: Math.sin(ang) * (T.plazaR - 1.4), a: ang });
  }
  for (const deg of T.roadAngles) {
    const a = D2R(deg + 45);
    const r = (T.ringIn + T.ringOut) / 2;
    lampSpots.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, a });
    lampSpots.push({ x: Math.cos(a) * (r + 9), z: Math.sin(a) * (r + 9), a });
  }

  for (const s of lampSpots) {
    const lamp = createLamp();
    lamp.position.set(s.x, terrainY(Math.hypot(s.x, s.z)), s.z);
    lamp.rotation.y = Math.random() * Math.PI;
    group.add(lamp);
    lamps.push(lamp);
  }

  // ---------- 静态小道具 ----------
  for (let i = 0; i < 10; i++) {
    const ang = (i / 10) * Math.PI * 2 + 0.8;
    const r = T.plazaR - 3.0;
    addBench(staticB, Math.cos(ang) * r, Math.sin(ang) * r, -ang + Math.PI / 2);
  }
  for (let i = 0; i < 10; i++) {
    const ang = (i / 10) * Math.PI * 2 + 0.2;
    addTree(staticB, Math.cos(ang) * (T.plazaR + 3.6), Math.sin(ang) * (T.plazaR + 3.6), 0, rnd(0.9, 1.3));
  }
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2 + 1.2;
    addPlanter(staticB, Math.cos(ang) * (T.plazaR - 5.2), Math.sin(ang) * (T.plazaR - 5.2), -ang);
  }
  const fencePts = [];
  for (let i = 0; i <= 15; i++) {
    const ang = 0.55 + (i / 15) * 1.05;
    fencePts.push([Math.cos(ang) * (T.plazaR + 1.4), Math.sin(ang) * (T.plazaR + 1.4)]);
  }
  addFence(staticB, fencePts);

  // 广场集市
  for (let i = 0; i < 4; i++) {
    const ang = 0.55 + (i / 4) * Math.PI * 2;
    addStall(staticB, Math.cos(ang) * 10.4, Math.sin(ang) * 10.4, -ang + Math.PI / 2, 0.09);
  }
  // 广场外圈花圃
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2 + 0.55;
    addFlowerBed(staticB, Math.cos(ang) * (T.plazaR + 2.1), Math.sin(ang) * (T.plazaR + 2.1), -ang + Math.PI / 2);
  }

  for (const deg of T.roadAngles) {
    const a = D2R(deg);
    const tx = -Math.sin(a), tz = Math.cos(a);
    for (const side of [-1, 1]) {
      const off = T.roadW / 2 + 1.7;
      const at = (r, extra = 0) => ({
        x: Math.cos(a) * r + tx * (off + extra) * side,
        z: Math.sin(a) * r + tz * (off + extra) * side,
      });
      let p = at(20.5);
      addBin(staticB, p.x, p.z, -a + (side > 0 ? 0.4 : -0.4));
      p = at(27.5);
      addBench(staticB, p.x, p.z, -a + Math.PI / 2 + (side > 0 ? 0 : Math.PI));
      p = at(46.5);
      addBin(staticB, p.x, p.z, -a);
      p = at(53.5);
      addBench(staticB, p.x, p.z, -a + Math.PI / 2 + (side > 0 ? 0 : Math.PI));
      p = at(T.plazaR + 1.6, 0.6);
      addSign(staticB, p.x, p.z, -a + Math.PI / 2);
      p = at(42.4, 1.0);
      addHydrant(staticB, p.x, p.z);
      for (let r = 17; r < 61; r += rnd(7, 10)) {
        if (r > 32 && r < 42.5) continue;
        const q = at(r, 0.3);
        if (Math.random() < 0.7) addTree(staticB, q.x, q.z, 0, rnd(0.75, 1.05));
      }
    }
  }

  // 岛上散落
  for (let i = 0; i < 90; i++) {
    const ang = Math.random() * Math.PI * 2;
    const r = rnd(64, 77);
    const x = Math.cos(ang) * r, z = Math.sin(ang) * r;
    const y = terrainY(r);
    if (Math.random() < 0.6) addTree(staticB, x, z, y, rnd(0.85, 1.4));
    else addStone(staticB, x, z, y, rnd(0.8, 1.9));
  }
  for (let i = 0; i < 40; i++) {
    const ang = Math.random() * Math.PI * 2;
    const r = rnd(T.plazaR + 2, 63);
    const x = Math.cos(ang) * r, z = Math.sin(ang) * r;
    let blocked = false;
    for (const deg of T.roadAngles) {
      const a = D2R(deg);
      const along = x * Math.cos(a) + z * Math.sin(a);
      const across = Math.abs(-x * Math.sin(a) + z * Math.cos(a));
      if (along > T.plazaR && along < T.roadOut && across < T.roadW / 2 + 4) blocked = true;
    }
    const rr = Math.hypot(x, z);
    if (rr > T.ringIn - 5 && rr < T.ringOut + 5) blocked = true;
    if (blocked) continue;
    if (Math.random() < 0.5) addStone(staticB, x, z, 0, rnd(0.5, 1.2));
    else addTree(staticB, x, z, 0, rnd(0.7, 1.1));
  }

  const propMesh = new THREE.Mesh(staticB.build(), toonMat({ vertexColors: true }));
  propMesh.castShadow = true;
  propMesh.receiveShadow = true;
  group.add(propMesh);

  // ---------- 街心凉亭（东南角的楔形空地）----------
  {
    const ga = D2R(318), gr = 49;
    const gx = Math.cos(ga) * gr, gz = Math.sin(ga) * gr;
    const gazebo = createGazebo();
    gazebo.position.set(gx, terrainY(Math.hypot(gx, gz)), gz);
    gazebo.rotation.y = -ga;
    group.add(gazebo);
    for (let i = 0; i < 6; i++) {
      const aa = ga + (i / 6) * Math.PI * 2;
      const rr = 9.5 + Math.random() * 2;
      addBush(staticB, gx + Math.cos(aa) * rr, gz + Math.sin(aa) * rr, 0, 1.2);
    }
    for (let i = 0; i < 5; i++) {
      const aa = ga + (i / 5) * Math.PI * 2 + 0.5;
      addBench(staticB, gx + Math.cos(aa) * 5.4, gz + Math.sin(aa) * 5.4, -aa + Math.PI / 2, 0);
    }
  }

  // ---------- 地标 ----------
  const fountain = createFountain();  fountain.position.set(0, 0.1, 0);
  fountain.scale.setScalar(1.15);
  group.add(fountain);

  const tower = createClockTower();
  tower.position.set(0, 0.1, 0);
  tower.rotation.y = -0.55;
  tower.scale.setScalar(1.0);
  // 钟楼放在广场一侧，喷泉挪到另一侧
  fountain.position.set(-4.2, 0.1, 3.0);
  fountain.scale.setScalar(0.85);
  tower.position.set(4.6, 0.1, -3.2);
  group.add(tower);

  const windmill = createWindmill();
  const wa = D2R(352), wr = 68;
  windmill.position.set(Math.cos(wa) * wr, terrainY(wr), Math.sin(wa) * wr);
  windmill.rotation.y = -wa + Math.PI;
  windmill.scale.setScalar(1.25);
  group.add(windmill);

  const water = createWaterTower();
  const ta = D2R(198), tr = 66.5;
  water.position.set(Math.cos(ta) * tr, terrainY(tr), Math.sin(ta) * tr);
  water.scale.setScalar(1.2);
  group.add(water);

  return {
    group, houses, lamps, fountain, tower, windmill, water, signals,
    glowMats: [tower.userData.faceMat],
  };
}
