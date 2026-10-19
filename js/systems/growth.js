import { CFG } from '../config.js';

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (x) => x * x * (3 - 2 * x);
const easeOutBack = (x) => {
  const c1 = 1.28, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);

/**
 * 房屋生长动画：中心向外的涟漪式编排
 * 四段：地基波纹 → 墙体裁剪生长 → 屋顶展开 → 细节弹出
 */
export class GrowthSystem {
  constructor(houses) {
    this.items = houses.map((h) => ({
      h,
      t: -1,
      dur: CFG.growth.perHouse * (0.88 + Math.random() * 0.24),
      delay: 0,
      done: false,
    }));
    this.started = false;
    this.time = 0;
    for (const it of this.items) this.applyAt(it, 0);
  }

  reset() {
    const maxDist = Math.max(...this.items.map((i) => i.h.distToCenter || 1));
    for (const it of this.items) {
      const d = it.h.distToCenter || 0;
      it.delay = (d / maxDist) * CFG.growth.spread + Math.random() * CFG.growth.jitter;
      it.t = 0;
      it.done = false;
      this.applyAt(it, -1);
    }
    this.time = 0;
    this.started = true;
  }

  startAll() { this.reset(); }
  growHouse(h) {
    const it = this.items.find((i) => i.h === h);
    if (!it) return;
    it.t = 0; it.delay = 0; it.done = false;
    this.started = true;
  }

  /** 静态地把一栋房子摆到某个进度（-1 = 完全未长） */
  applyAt(it, p) {
    const { h } = it;
    const base = h.group.position.y;
    const bodyH = h.wallHeight;

    if (p < 0) {
      h.uProg.value = base - 0.4;
      h.roofMesh.scale.setScalar(0.001);
      h.trimMesh.scale.setScalar(0.001);
      h.glassMesh.scale.setScalar(0.001);
      h.ring.visible = false;
      it.done = false;
      return;
    }

    // 1) 墙体：世界高度裁剪
    const bodyP = smooth(clamp01((p - 0.1) / 0.42));
    h.uProg.value = base - 0.25 + (bodyH + 0.55) * bodyP;

    // 2) 屋顶：从檐口展开（easeOutBack 轻微过冲）
    const roofP = clamp01((p - 0.5) / 0.3);
    const rs = Math.max(0.001, easeOutBack(roofP));
    h.roofMesh.scale.setScalar(rs);

    // 3) 细节弹出
    const detP = clamp01((p - 0.68) / 0.32);
    const ds = Math.max(0.001, easeOutBack(detP));
    h.trimMesh.scale.setScalar(ds);
    h.glassMesh.scale.setScalar(Math.max(0.001, easeOutCubic(detP)));

    // 4) 地面波纹
    const ripP = clamp01(p / 0.34);
    h.ring.visible = ripP > 0.001 && ripP < 0.999;
    if (h.ring.visible) {
      const r = 0.7 + easeOutCubic(ripP) * 3.6;
      h.ring.scale.set(r, r, r);
      h.ring.material.opacity = (1 - ripP) * 0.5;
    }

    if (p >= 1) it.done = true;
  }

  update(dt, win = 0) {
    this.time += dt;
    for (const it of this.items) {
      if (it.t < 0) continue;
      it.t += dt;
      const p = clamp01((it.t - it.delay) / it.dur);
      this.applyAt(it, it.t - it.delay < 0 ? -1 : p);
      if (it.t - it.delay < 0) continue;

      // 窗户发光随生长淡入
      const detP = clamp01((p - 0.68) / 0.32);
      const g = 0.12 + 0.88 * detP;
      it.h.glassMat.emissiveIntensity = win * (it.h.lit ? 2.4 : 1.35) * g * (it.h.winVar ?? 1);
    }
  }

  get progress() {
    const done = this.items.filter((i) => i.done).length;
    return done / this.items.length;
  }
}
