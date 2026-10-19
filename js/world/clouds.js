import * as THREE from 'three';
import { Builder } from '../lib/geo.js';
import { toonMat, makeGradientMap } from '../lib/npr.js';
import { rnd } from '../lib/geo.js';

const GRAD_FLUFF = makeGradientMap(3, [176, 222, 255]);   // 近处蓬松云
const GRAD_SOFT = makeGradientMap(2, [230, 255]);         // 远处云海，几乎没有暗面

function cloudCluster(bumps = 3) {
  const b = new Builder();
  const n = 5 + ((Math.random() * 3) | 0);
  for (let i = 0; i < n; i++) {
    const r = 1.0 + Math.random() * 0.75;
    b.add(new THREE.IcosahedronGeometry(r, 0), {
      x: (Math.random() - 0.5) * 5.4,
      y: (Math.random() - 0.5) * 0.25,
      z: (Math.random() - 0.5) * 3.2,
      sx: 1.1 + Math.random() * 0.4,
      sy: 0.70 + Math.random() * 0.12,
      sz: 1.0 + Math.random() * 0.3,
    });
  }
  for (let i = 0; i < bumps; i++) {
    const r = 0.65 + Math.random() * 0.45;
    b.add(new THREE.IcosahedronGeometry(r, 0), {
      x: (Math.random() - 0.5) * 2.6,
      y: 0.52 + Math.random() * 0.4,
      z: (Math.random() - 0.5) * 1.8,
      sy: 0.85,
    });
  }
  const geo = b.build();
  geo.computeVertexNormals();
  return geo;
}

/**
 * 三层云：岛下蓬松云 → 中层云带 → 远处低平云海
 */
export function buildClouds(scene) {
  const layers = [];
  const mats = [];

  const specs = [
    {
      count: 320, rMin: 88, rMax: 300, yMin: -62, yMax: -108,
      scale: [7, 16], sy: [0.72, 0.95], grad: GRAD_FLUFF, speed: 0.0045, bumps: 3,
    },
    {
      count: 300, rMin: 220, rMax: 620, yMin: -98, yMax: -155,
      scale: [10, 22], sy: [0.24, 0.36], grad: GRAD_FLUFF, speed: -0.003, bumps: 2,
    },
    {
      count: 280, rMin: 340, rMax: 1500, yMin: -80, yMax: -150,
      scale: [45, 105], sy: [0.16, 0.26], grad: GRAD_SOFT, speed: 0.0015, bumps: 0,
    },
  ];

  specs.forEach((s, li) => {
    const mat = toonMat({ color: 0xffffff, gradientMap: s.grad, emissive: 0x9FB8D8, emissiveIntensity: 1 });
    const geo = cloudCluster(s.bumps);
    const inst = new THREE.InstancedMesh(geo, mat, s.count);
    inst.frustumCulled = false;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const v = new THREE.Vector3();
    const sc = new THREE.Vector3();
    for (let i = 0; i < s.count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = rnd(s.rMin, s.rMax);
      v.set(Math.cos(a) * r, rnd(s.yMin, s.yMax), Math.sin(a) * r);
      q.setFromEuler(new THREE.Euler(0, Math.random() * Math.PI * 2, 0));
      const k = rnd(s.scale[0], s.scale[1]);
      sc.set(k, k * rnd(s.sy[0], s.sy[1]), k * rnd(0.92, 1.12));
      m.compose(v, q, sc);
      inst.setMatrixAt(i, m);
    }
    inst.instanceMatrix.needsUpdate = true;
    scene.add(inst);
    layers.push({ inst, speed: s.speed });
    mats.push(mat);
  });

  // 岛正下方的一团浓云，避免从上看穿
  const under = new Builder();
  for (let i = 0; i < 11; i++) {
    under.add(new THREE.IcosahedronGeometry(rnd(11, 19), 0), {
      x: (Math.random() - 0.5) * 66,
      y: -86 + Math.random() * 12,
      z: (Math.random() - 0.5) * 66,
      sy: 0.55,
    });
  }
  const underMat = toonMat({ color: 0xffffff, gradientMap: GRAD_FLUFF, emissive: 0x9FB8D8, emissiveIntensity: 1 });
  const underMesh = new THREE.Mesh(under.build(), underMat);
  underMesh.frustumCulled = false;
  scene.add(underMesh);
  mats.push(underMat);

  return {
    layers, mats,
    update(dt, t) {
      for (const l of layers) l.inst.rotation.y += l.speed * dt;
      underMesh.rotation.y -= 0.004 * dt;
      underMesh.position.y = Math.sin(t * 0.3) * 0.6;
    },
  };
}
