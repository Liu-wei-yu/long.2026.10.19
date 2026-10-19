import * as THREE from 'three';
import { CFG, PAL } from '../config.js';
import { toonMat } from '../lib/npr.js';
import { hash2 } from '../lib/geo.js';

const R = CFG.island.r;
const FLAT = CFG.island.flatR;
const DROP = CFG.island.edgeDrop;
const SEG = 120;

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function terrainY(r) {
  const RR = CFG.island.r;
  if (r <= 61) return 0;
  if (r <= 67) return 2.2 * smoothstep(61, 67, r);
  if (r <= 72) return 2.2 - 1.8 * smoothstep(67, 72, r);
  return 0.4 - (0.4 + DROP) * smoothstep(72, RR, r);
}

function ensureOutward(geo, mode = 'up') {
  geo.computeVertexNormals();
  const n = geo.attributes.normal;
  const p = geo.attributes.position;
  let sum = 0;
  for (let i = 0; i < n.count; i += 7) {
    const nx = n.getX(i), ny = n.getY(i), nz = n.getZ(i);
    if (mode === 'up') sum += ny;
    else sum += nx * p.getX(i) + nz * p.getZ(i);
  }
  if (sum < 0) {
    const idx = geo.index;
    if (idx) {
      for (let i = 0; i < idx.count; i += 3) {
        const a = idx.getX(i), b = idx.getX(i + 1);
        idx.setX(i, b); idx.setX(i + 1, a);
      }
      idx.needsUpdate = true;
      geo.computeVertexNormals();
    } else {
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i += 3) {
        const ax = pos.getX(i), ay = pos.getY(i), az = pos.getZ(i);
        pos.setXYZ(i, pos.getX(i + 1), pos.getY(i + 1), pos.getZ(i + 1));
        pos.setXYZ(i + 1, ax, ay, az);
      }
      geo.computeVertexNormals();
    }
  }
  return geo;
}

// ---------- 顶面草地 ----------
function buildTop() {
  const radii = [];
  for (let r = 0; r < R - 0.001; r += 2.2) radii.push(r);
  radii.push(R);

  const rings = radii.length;
  const pos = [];
  const col = [];
  const idx = [];
  const cGrass = PAL.grass.map((h) => new THREE.Color(h));
  const cSoil = new THREE.Color(PAL.soil);

  for (let i = 0; i < rings; i++) {
    const r = radii[i];
    for (let j = 0; j < SEG; j++) {
      const a = (j / SEG) * Math.PI * 2;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const y = terrainY(r);
      pos.push(x, y, z);
      const n = hash2(Math.floor(x * 0.42), Math.floor(z * 0.42));
      const c = cGrass[(n * cGrass.length) | 0].clone();
      c.lerp(cSoil, smoothstep(64, R, r) * 0.8 + n * 0.08);
      col.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < rings - 1; i++) {
    for (let j = 0; j < SEG; j++) {
      const a = i * SEG + j;
      const b = i * SEG + ((j + 1) % SEG);
      const c = (i + 1) * SEG + j;
      const d = (i + 1) * SEG + ((j + 1) % SEG);
      idx.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  ensureOutward(geo, 'up');

  const mat = toonMat({ vertexColors: true });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  return mesh;
}

// ---------- 岩壁 ----------
function buildCliff() {
  const profile = [
    [R, -DROP],
    [R - 1.6, -10],
    [R - 3.5, -18],
    [R - 7, -26],
    [R - 12, -34],
    [R - 20, -41],
    [R - 30, -47],
    [R - 42, -52],
    [R - 54, -56],
    [R - 66, -59.5],
    [R - 75, -62],
    [R - 77.4, -63.5],
  ];
  const pos = [];
  const col = [];
  const idx = [];
  const rocks = PAL.rock.map((h) => new THREE.Color(h));
  const cTop = new THREE.Color(PAL.soil);

  for (let i = 0; i < profile.length; i++) {
    const [rr, yy] = profile[i];
    for (let j = 0; j < SEG; j++) {
      const a = (j / SEG) * Math.PI * 2;
      const wob = 1 + 0.075 * Math.sin(j * 2.7 + i * 1.9) + 0.045 * Math.sin(j * 7.1 - i * 3.3) + (hash2(j, i * 3) - 0.5) * 0.06;
      const r = rr * (1 + (wob - 1) * (i < 5 ? 1 : 0.42));
      const y = yy + Math.sin(j * 5.3 + i * 2.1) * (i === 0 ? 0.05 : i < 4 ? 1.15 : 0.55);
      pos.push(Math.cos(a) * r, y, Math.sin(a) * r);
      const n = hash2(Math.floor(j * 0.6), i);
      const c = rocks[(n * rocks.length) | 0].clone();
      if (i < 2) c.lerp(cTop, 0.55 - i * 0.22);
      c.multiplyScalar(1 - i * 0.018);
      col.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < profile.length - 1; i++) {
    for (let j = 0; j < SEG; j++) {
      const a = i * SEG + j;
      const b = i * SEG + ((j + 1) % SEG);
      const c = (i + 1) * SEG + j;
      const d = (i + 1) * SEG + ((j + 1) % SEG);
      idx.push(a, b, c, b, d, c);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  ensureOutward(geo, 'radial');
  geo.computeVertexNormals();

  const mat = toonMat({ vertexColors: true });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// ---------- 岛上小瀑布 ----------
function buildWaterfall(deg = 18) {
  const a = THREE.MathUtils.degToRad(deg);
  const uniforms = {
    uTime: { value: 0 },
    uColorA: { value: new THREE.Color(0xCBE9FF) },
    uColorB: { value: new THREE.Color(0x7FB8E8) },
    uOpacity: { value: 0.85 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime, uOpacity;
      uniform vec3 uColorA, uColorB;
      void main(){
        float s = fract(vUv.y * 5.0 + uTime * 0.55 + sin(vUv.x * 9.0) * 0.12);
        float streak = smoothstep(0.0, 0.35, s) * smoothstep(1.0, 0.5, s);
        float edge = smoothstep(0.0, 0.22, vUv.x) * smoothstep(1.0, 0.78, vUv.x);
        float bottomFade = smoothstep(0.0, 0.35, vUv.y);
        float a = edge * uOpacity * (0.35 + streak * 0.65) * bottomFade;
        vec3 c = mix(uColorB, uColorA, streak);
        gl_FragColor = vec4(c, a);
        #include <colorspace_fragment>
      }`,
  });
  const radius = R - 0.6;
  const h = 34;
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(6, h, 1, 16), mat);
  plane.position.set(Math.cos(a) * radius, -DROP - h / 2 + 0.4, Math.sin(a) * radius);
  plane.rotation.y = Math.PI / 2 - a; // 面朝外
  plane.renderOrder = 3;

  const group = new THREE.Group();
  group.add(plane);
  // 落水处的雾团
  const mistMat = toonMat({ color: 0xEAF4FF, transparent: true, opacity: 0.55, depthWrite: false });
  for (let i = 0; i < 5; i++) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4 + Math.random() * 1.6, 0), mistMat);
    m.position.set(
      Math.cos(a) * (radius - 1.2) + (Math.random() - 0.5) * 3,
      -DROP - h + Math.random() * 3,
      Math.sin(a) * (radius - 1.2) + (Math.random() - 0.5) * 3
    );
    group.add(m);
  }
  return { group, uniforms };
}

export function buildIsland() {
  const group = new THREE.Group();
  group.add(buildTop());
  group.add(buildCliff());
  const fall = buildWaterfall(18);
  group.add(fall.group);
  return { group, fallUniforms: fall.uniforms };
}
