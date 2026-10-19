import * as THREE from 'three';

const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _s = new THREE.Vector3();

/** 给几何体刷顶点色（用于合并后的多色物体） */
export function tint(geo, color) {
  const n = geo.attributes.position.count;
  const arr = new Float32Array(n * 3);
  const c = new THREE.Color(color);
  for (let i = 0; i < n; i++) {
    arr[i * 3] = c.r;
    arr[i * 3 + 1] = c.g;
    arr[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return geo;
}

/** 合并一堆几何体（自动转非索引，保留顶点色） */
export function mergeGeos(geos) {
  const list = [];
  for (const g of geos) if (g && g.attributes.position.count > 0) list.push(g.index ? g.toNonIndexed() : g);
  let total = 0;
  for (const g of list) total += g.attributes.position.count;
  const pos = new Float32Array(total * 3);
  const nor = new Float32Array(total * 3);
  const col = new Float32Array(total * 3);
  let o = 0;
  for (const g of list) {
    const cnt = g.attributes.position.count;
    pos.set(g.attributes.position.array.subarray(0, cnt * 3), o * 3);
    if (g.attributes.normal) nor.set(g.attributes.normal.array.subarray(0, cnt * 3), o * 3);
    if (g.attributes.color) col.set(g.attributes.color.array.subarray(0, cnt * 3), o * 3);
    else col.fill(1, o * 3, (o + cnt) * 3);
    o += cnt;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.computeBoundingSphere();
  return out;
}

/** 几何体拼装器：一行一个零件，最后 build() 成一个 mesh 用的几何体 */
export class Builder {
  constructor() { this.geos = []; }
  add(geo, o = {}) {
    const g = geo.clone();
    _v.set(o.x || 0, o.y || 0, o.z || 0);
    _e.set(o.rx || 0, o.ry || 0, o.rz || 0);
    _q.setFromEuler(_e);
    _s.set(o.sx ?? 1, o.sy ?? 1, o.sz ?? 1);
    g.applyMatrix4(new THREE.Matrix4().compose(_v, _q, _s));
    if (o.color !== undefined) tint(g, o.color);
    this.geos.push(g);
    return this;
  }
  box(w, h, d, o = {}) { return this.add(new THREE.BoxGeometry(w, h, d), o); }
  cyl(rt, rb, h, seg, o = {}) { return this.add(new THREE.CylinderGeometry(rt, rb, h, seg), o); }
  sphere(r, o = {}) { return this.add(new THREE.IcosahedronGeometry(r, o.detail ?? 0), o); }
  plane(w, h, o = {}) { return this.add(new THREE.PlaneGeometry(w, h), o); }
  build() { return mergeGeos(this.geos); }
  get empty() { return this.geos.length === 0; }
}

/** 低多边形噪声（确定性） */
export function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** 围绕 y 轴旋转并平移的极坐标 → 笛卡尔 */
export function polar(r, deg) {
  const a = THREE.MathUtils.degToRad(deg);
  return { x: Math.cos(a) * r, z: Math.sin(a) * r, a };
}

export const rnd = (a, b) => a + Math.random() * (b - a);
export const pick = (arr) => arr[(Math.random() * arr.length) | 0];
