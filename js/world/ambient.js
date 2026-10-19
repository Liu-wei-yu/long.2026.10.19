import * as THREE from 'three';
import { Builder } from '../lib/geo.js';
import { toonMat, makeOutlineMat } from '../lib/npr.js';

function balloonEnvelope(r, colorA, colorB) {
  const geo = new THREE.SphereGeometry(r, 20, 14);
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const a = new THREE.Color(colorA), b = new THREE.Color(colorB);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const ang = Math.atan2(pos.getZ(i), pos.getX(i));
    const gore = Math.floor(((ang + Math.PI) / (Math.PI * 2)) * 10);
    c.copy(gore % 2 ? a : b);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

function makeBalloon(colorA, colorB, scale = 1) {
  const g = new THREE.Group();
  const mat = toonMat({ vertexColors: true, emissive: 0x000000 });

  const env = new THREE.Mesh(balloonEnvelope(3.0 * scale, colorA, colorB), mat);
  env.position.y = 6.4 * scale;
  env.scale.y = 1.18;
  env.castShadow = false;
  env.add(new THREE.Mesh(env.geometry, makeOutlineMat(0x2a2233, 0.12)));
  g.add(env);

  const b = new Builder();
  // 吊篮
  b.box(1.3, 1.0, 1.3, { y: 0.5, color: 0x8A6A48 });
  b.box(1.42, 0.14, 1.42, { y: 1.0, color: 0x6B503A });
  for (let i = 0; i < 4; i++) {
    const sx = i % 2 ? 0.66 : -0.66;
    const sz = i < 2 ? 0.66 : -0.66;
    b.box(0.05, 3.2, 0.05, { x: sx, y: 2.6, z: sz, rz: -sx * 0.12, rx: sz * 0.12, color: 0x4A3A2E });
  }
  const basket = new THREE.Mesh(b.build(), toonMat({ vertexColors: true }));
  basket.castShadow = false;
  g.add(basket);

  // 燃烧器
  const burnerMat = new THREE.MeshBasicMaterial({ color: 0xFFC46B, transparent: true, opacity: 0.85 });
  const burner = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34, 0), burnerMat);
  burner.position.y = 1.9;
  g.add(burner);

  return { group: g, env, mat, burner, burnerMat };
}

/**
 * 环境元素：热气球 + 夜间萤火
 */
export function buildAmbient(scene) {
  const balloons = [];
  const defs = [
    { a: 0xE07A5F, b: 0xF2E3C8, r: 96, y: 34, s: 1.0, sp: 0.045, ph: 0 },
    { a: 0x4F8EA8, b: 0xE9C46A, r: 72, y: 46, s: 0.72, sp: -0.062, ph: 2.4 },
  ];
  for (const d of defs) {
    const bal = makeBalloon(d.a, d.b, d.s);
    bal.group.position.set(Math.cos(d.ph) * d.r, d.y, Math.sin(d.ph) * d.r);
    scene.add(bal.group);
    balloons.push({ ...bal, ...d, angle: d.ph });
  }

  // 萤火
  const N = 140;
  const fpos = new Float32Array(N * 3);
  const fdata = [];
  for (let i = 0; i < N; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 18 + Math.random() * 40;
    const y = 1.2 + Math.random() * 6.5;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    fpos[i * 3] = x; fpos[i * 3 + 1] = y; fpos[i * 3 + 2] = z;
    fdata.push({ x, y, z, ph: Math.random() * 6.28, sp: 0.25 + Math.random() * 0.6, r: 0.5 + Math.random() });
  }
  const fgeo = new THREE.BufferGeometry();
  fgeo.setAttribute('position', new THREE.BufferAttribute(fpos, 3));
  const fmat = new THREE.PointsMaterial({
    color: 0xFFD98A, size: 0.34, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  });
  const points = new THREE.Points(fgeo, fmat);
  points.frustumCulled = false;
  scene.add(points);

  return {
    update(dt, t, night = 0) {
      for (const b of balloons) {
        b.angle += b.sp * dt;
        b.group.position.set(Math.cos(b.angle) * b.r, b.y + Math.sin(t * 0.35 + b.ph) * 1.6, Math.sin(b.angle) * b.r);
        b.group.rotation.y = -b.angle + Math.PI / 2;
        b.group.rotation.z = Math.sin(t * 0.6 + b.ph) * 0.03;
        b.burnerMat.opacity = 0.35 + night * 0.6 + Math.sin(t * 6 + b.ph) * 0.12;
        b.burner.scale.setScalar(1 + Math.sin(t * 5 + b.ph) * 0.1);
      }
      // 萤火浮动
      const arr = fgeo.attributes.position.array;
      for (let i = 0; i < N; i++) {
        const d = fdata[i];
        arr[i * 3] = d.x + Math.sin(t * d.sp + d.ph) * d.r;
        arr[i * 3 + 1] = d.y + Math.sin(t * d.sp * 1.7 + d.ph * 2) * 0.5;
        arr[i * 3 + 2] = d.z + Math.cos(t * d.sp * 0.8 + d.ph) * d.r;
      }
      fgeo.attributes.position.needsUpdate = true;
      fmat.opacity = night * (0.55 + Math.sin(t * 2) * 0.12);
      points.visible = night > 0.02;
    },
  };
}
