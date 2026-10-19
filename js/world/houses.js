import * as THREE from 'three';
import { PAL } from '../config.js';
import { Builder } from '../lib/geo.js';
import { toonMat, injectGrow, makeOutlineMat } from '../lib/npr.js';

const OUTLINE = 0x241f3a;

function facePoint(dist, along, yaw, y) {
  return {
    x: Math.sin(yaw) * dist + Math.cos(yaw) * along,
    z: Math.cos(yaw) * dist - Math.sin(yaw) * along,
    y,
    ry: yaw,
  };
}

// ============================================================
// 职业专属外形：全部在房屋本地坐标里建（正面朝 +Z，墙半宽 w/2，半深 d/2）
// ============================================================

// 面包师：门口面包展示架 + 烟囱帽 + 麦穗招牌
function extraBakery(c) {
  const { trimB, glassB, w, d } = c;
  const z = d / 2;
  const bx = w * 0.30;
  // 双层木架
  trimB.box(0.12, 1.0, 0.12, { x: bx - 0.45, y: 0.5, z: z + 0.42, color: 0x6B503A });
  trimB.box(0.12, 1.0, 0.12, { x: bx + 0.45, y: 0.5, z: z + 0.42, color: 0x6B503A });
  for (let i = 0; i < 2; i++) {
    trimB.box(1.05, 0.08, 0.5, { x: bx, y: 0.62 + i * 0.44, z: z + 0.42, color: 0x8A6A48 });
  }
  // 面包
  const bread = [0xD9A566, 0xC98B4E, 0xE0B078, 0xB8793F];
  for (let i = 0; i < 6; i++) {
    trimB.add(new THREE.IcosahedronGeometry(0.12 + Math.random() * 0.04, 0), {
      x: bx - 0.42 + (i % 3) * 0.42, y: 0.74 + (i < 3 ? 0 : 0.44), z: z + 0.42 + (Math.random() - 0.5) * 0.1,
      sy: 0.7, color: bread[i % bread.length],
    });
  }
  // 门口面包筐
  trimB.cyl(0.26, 0.2, 0.28, 8, { x: -w * 0.3, y: 0.14, z: z + 0.6, color: 0xA8814E });
  // 麦穗招牌（三根斜杆）
  for (let i = -1; i <= 1; i++) {
    trimB.box(0.05, 0.42, 0.05, { x: i * 0.12, y: 3.55, z: z + 0.16, rz: i * 0.22, color: 0xD8B35A });
  }
  // 烟囱铁皮帽
  if (c.chimneyTop) {
    trimB.cyl(0.3, 0.4, 0.14, 8, { x: c.chimneyTop.x, y: c.chimneyTop.y - 0.1, z: c.chimneyTop.z, color: 0x5A5A62 });
    trimB.cyl(0.16, 0.16, 0.22, 8, { x: c.chimneyTop.x, y: c.chimneyTop.y + 0.12, z: c.chimneyTop.z, color: 0x4A4A52 });
  }
}

// 花匠：侧面玻璃温室 + 花架 + 吊篮 + 墙面藤蔓
function extraFlorist(c) {
  const { trimB, glassB, w, d } = c;
  const z = d / 2;
  const gw = 1.5, gd = d * 0.82, gh = 2.1;
  const gx = -w / 2 - gw / 2;
  // 温室底座与骨架
  trimB.box(gw + 0.16, 0.2, gd + 0.16, { x: gx, y: 0.1, z: 0, color: 0x9A8B72 });
  for (const cx of [-gw / 2, gw / 2]) {
    for (const cz of [-gd / 2, gd / 2]) {
      trimB.box(0.09, gh, 0.09, { x: gx + cx, y: gh / 2, z: cz, color: 0xE8E4DA });
    }
  }
  trimB.box(gw + 0.1, 0.09, 0.09, { x: gx, y: gh, z: -gd / 2, color: 0xE8E4DA });
  trimB.box(gw + 0.1, 0.09, 0.09, { x: gx, y: gh, z: gd / 2, color: 0xE8E4DA });
  trimB.box(0.09, 0.09, gd, { x: gx + gw / 2, y: gh, z: 0, color: 0xE8E4DA });
  // 玻璃
  glassB.box(gw, gh - 0.3, 0.05, { x: gx, y: gh / 2, z: gd / 2, color: 0xD8E8E4 });
  glassB.box(gw, gh - 0.3, 0.05, { x: gx, y: gh / 2, z: -gd / 2, color: 0xD8E8E4 });
  glassB.box(0.05, gh - 0.3, gd, { x: gx + gw / 2, y: gh / 2, z: 0, color: 0xD8E8E4 });
  // 斜玻璃顶
  const glassRoof = new THREE.BoxGeometry(gw + 0.4, 0.05, gd + 0.3);
  glassB.add(glassRoof, { x: gx, y: gh + 0.28, z: 0, rz: 0.32, color: 0xD8E8E4 });
  trimB.add(new THREE.BoxGeometry(gw + 0.4, 0.06, 0.06), { x: gx, y: gh + 0.5, z: gd / 2, color: 0xE8E4DA });
  // 里面几盆花
  for (let i = 0; i < 4; i++) {
    const px = gx - gw / 2 + 0.35 + (i % 2) * 0.75;
    const pz = -gd / 2 + 0.6 + ((i / 2) | 0) * (gd - 1.2);
    trimB.cyl(0.13, 0.1, 0.18, 6, { x: px, y: 0.3, z: pz, color: 0xA8664A });
    trimB.add(new THREE.IcosahedronGeometry(0.2, 0), {
      x: px, y: 0.52, z: pz, color: [0x6FA860, 0xE86A8A, 0xE8C36A][i % 3],
    });
  }
  // 门口三层花架
  const fz = z + 0.5, fx = w * 0.28;
  for (let i = 0; i < 3; i++) {
    trimB.box(1.1, 0.07, 0.55, { x: fx, y: 0.35 + i * 0.42, z: fz, color: 0x8A6A48 });
    for (let j = 0; j < 3; j++) {
      trimB.cyl(0.11, 0.09, 0.2, 6, { x: fx - 0.36 + j * 0.36, y: 0.5 + i * 0.42, z: fz, color: 0xA8664A });
      trimB.add(new THREE.IcosahedronGeometry(0.17, 0), {
        x: fx - 0.36 + j * 0.36, y: 0.68 + i * 0.42, z: fz,
        color: [0xE86A8A, 0xF0C454, 0xB073C4, 0xF2F0E4][(i + j) % 4],
      });
    }
  }
  // 墙面藤蔓
  for (let i = 0; i < 9; i++) {
    const yy = 0.9 + i * 0.42;
    const side = i % 2 ? 1 : -1;
    trimB.add(new THREE.IcosahedronGeometry(0.16 + Math.random() * 0.1, 0), {
      x: -w / 2 + 0.12, y: yy, z: z - 0.5 - (i % 3) * 0.55,
      sy: 0.8, color: [0x5D9A57, 0x6FA860, 0x84B96B][i % 3],
    });
  }
  // 吊篮
  for (const hx of [-w * 0.3, w * 0.05]) {
    trimB.box(0.03, 0.5, 0.03, { x: hx, y: 3.1, z: z + 0.35, color: 0x6B5A4A });
    trimB.cyl(0.2, 0.14, 0.16, 8, { x: hx, y: 2.85, z: z + 0.35, color: 0xA8664A });
    trimB.add(new THREE.IcosahedronGeometry(0.22, 0), { x: hx, y: 2.98, z: z + 0.35, sy: 0.7, color: 0x6FA860 });
  }
}

// 邮差：邮筒 + 包裹堆 + 公告板 + 载货自行车
function extraPostman(c) {
  const { trimB, w, d } = c;
  const z = d / 2;
  // 邮筒
  const mx = w * 0.36;
  trimB.cyl(0.22, 0.24, 0.95, 10, { x: mx, y: 0.48, z: z + 0.7, color: 0xC0483C });
  trimB.add(new THREE.IcosahedronGeometry(0.23, 0), { x: mx, y: 0.97, z: z + 0.7, sy: 0.6, color: 0xB03E33 });
  trimB.box(0.3, 0.06, 0.06, { x: mx, y: 0.82, z: z + 0.92, color: 0x6E2A22 });
  trimB.box(0.2, 0.16, 0.02, { x: mx, y: 0.6, z: z + 0.93, color: 0xEDE6D6 });
  // 包裹堆
  const px = -w * 0.3;
  const boxes = [
    [0.5, 0.42, 0.5, 0, 0.21], [0.42, 0.36, 0.42, 0.06, 0.6], [0.36, 0.3, 0.36, -0.05, 0.93],
  ];
  boxes.forEach(([bw, bh, bd, ox, oy], i) => {
    trimB.box(bw, bh, bd, { x: px + ox, y: oy, z: z + 0.6, color: [0xC8A97C, 0xB89A6E, 0xD8BE93][i] });
    trimB.box(bw + 0.02, 0.03, 0.03, { x: px + ox, y: oy, z: z + 0.6, color: 0x8A6A48 });
  });
  // 公告板
  trimB.box(0.9, 0.62, 0.08, { x: -w * 0.06, y: 2.05, z: z + 0.12, color: 0x5A4A3C });
  trimB.box(0.78, 0.5, 0.1, { x: -w * 0.06, y: 2.05, z: z + 0.16, color: 0xEFE8D8 });
  trimB.box(0.3, 0.36, 0.11, { x: -w * 0.06 + 0.16, y: 2.05, z: z + 0.2, color: 0xE8DCC6 });
  // 载货自行车
  const bx = w * 0.36;
  trimB.add(new THREE.TorusGeometry(0.3, 0.045, 5, 12), { x: bx - 0.4, y: 0.3, z: z + 1.4, color: 0x2A2A2E });
  trimB.add(new THREE.TorusGeometry(0.3, 0.045, 5, 12), { x: bx + 0.4, y: 0.3, z: z + 1.4, color: 0x2A2A2E });
  trimB.box(0.9, 0.05, 0.05, { x: bx, y: 0.55, z: z + 1.4, color: 0x3A5A6E });
  trimB.box(0.42, 0.34, 0.36, { x: bx + 0.42, y: 0.82, z: z + 1.4, color: 0x8A6A48 });
  trimB.box(0.24, 0.05, 0.12, { x: bx - 0.4, y: 0.7, z: z + 1.4, color: 0x4A3A34 });
}

// 钟表匠：山墙大钟 + 齿轮 + 挑出挂钟
function extraClockmaker(c) {
  const { trimB, glassB, w, d, roofH } = c;
  const z = d / 2;
  // 山墙大钟
  const cy = c.wallH + roofH * 0.42;
  trimB.cyl(1.0, 1.0, 0.14, 20, { x: 0, y: cy, z: z + 0.1, rx: Math.PI / 2, color: 0xE8DFC9 });
  glassB.cyl(0.86, 0.86, 0.1, 20, { x: 0, y: cy, z: z + 0.16, rx: Math.PI / 2, color: 0xBFD4E0 });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    trimB.box(0.06, 0.14, 0.06, {
      x: Math.sin(a) * 0.7, y: cy + Math.cos(a) * 0.7, z: z + 0.22, rx: Math.PI / 2, color: 0x3A3230,
    });
  }
  trimB.box(0.07, 0.6, 0.07, { x: 0, y: cy + 0.26, z: z + 0.24, rx: Math.PI / 2, color: 0x3A3230 });
  trimB.box(0.44, 0.07, 0.07, { x: 0.16, y: cy + 0.04, z: z + 0.24, rx: Math.PI / 2, color: 0x3A3230 });
  // 墙上齿轮
  for (const [gx, gy, r] of [[-w * 0.32, 2.5, 0.34], [-w * 0.34, 1.85, 0.22]]) {
    trimB.cyl(r, r, 0.09, 10, { x: gx, y: gy, z: z + 0.08, rx: Math.PI / 2, color: 0xB08A4A });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      trimB.box(0.1, 0.1, 0.09, { x: gx + Math.sin(a) * r, y: gy + Math.cos(a) * r, z: z + 0.08, rx: Math.PI / 2, color: 0xB08A4A });
    }
  }
  // 挑出挂钟招牌
  trimB.box(0.06, 0.06, 0.8, { x: w * 0.3, y: 3.1, z: z + 0.4, color: 0x4A4038 });
  trimB.cyl(0.4, 0.4, 0.09, 16, { x: w * 0.3, y: 2.7, z: z + 0.78, rx: Math.PI / 2, color: 0xE8DFC9 });
  glassB.cyl(0.3, 0.3, 0.08, 16, { x: w * 0.3, y: 2.7, z: z + 0.83, rx: Math.PI / 2, color: 0xBFD4E0 });
}

// 灯塔看守：侧接灯塔塔身 + 灯室
function extraLighthouse(c) {
  const { trimB, glassB, w, d, h } = c;
  const tx = -w / 2 - 1.2;
  const tz = -d * 0.1;
  const th = h + 4.4;
  // 红白分段
  const segs = 6;
  for (let i = 0; i < segs; i++) {
    const sy = (th / segs) * i;
    const r0 = 1.05 - i * 0.055;
    const r1 = 1.05 - (i + 1) * 0.055;
    trimB.cyl(r1, r0, th / segs, 12, {
      x: tx, y: sy + th / segs / 2, z: tz,
      color: i % 2 ? 0xF2EDE2 : 0xC0483C,
    });
  }
  // 基座
  trimB.cyl(1.25, 1.35, 0.5, 12, { x: tx, y: 0.25, z: tz, color: 0x9A8B72 });
  // 观景平台
  trimB.cyl(1.05, 1.05, 0.14, 14, { x: tx, y: th + 0.07, z: tz, color: 0x4A4A52 });
  // 灯室外框
  trimB.cyl(0.52, 0.52, 0.12, 10, { x: tx, y: th + 0.86, z: tz, color: 0x3A3A42 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    trimB.box(0.06, 1.1, 0.06, { x: tx + Math.sin(a) * 0.46, y: th + 0.55, z: tz + Math.cos(a) * 0.46, color: 0x3A3A42 });
  }
  glassB.cyl(0.42, 0.42, 1.0, 10, { x: tx, y: th + 0.55, z: tz, color: 0xFFE6B0 });
  // 灯室顶
  trimB.add(new THREE.ConeGeometry(0.62, 0.5, 10), { x: tx, y: th + 1.15, z: tz, color: 0x3A3A42 });
  trimB.cyl(0.04, 0.04, 0.5, 6, { x: tx, y: th + 1.6, z: tz, color: 0x3A3A42 });
  // 塔身小窗
  for (let i = 1; i < 4; i++) {
    trimB.box(0.3, 0.5, 0.12, { x: tx, y: (th / 4) * i, z: tz + 0.95, color: 0x2E3238 });
  }
  // 连接短廊
  trimB.box(1.0, 1.6, 1.0, { x: -w / 2 - 0.5, y: 0.8, z: tz, color: c.wallColor });
}

// 旧书店：A 字招牌 + 书堆 + 拱形橱窗框
function extraBookstore(c) {
  const { trimB, w, d } = c;
  const z = d / 2;
  // A 字牌
  const sx = w * 0.36;
  trimB.box(0.62, 0.9, 0.06, { x: sx, y: 0.45, z: z + 0.85, rx: -0.16, color: 0x3E4A5C });
  trimB.box(0.62, 0.9, 0.06, { x: sx, y: 0.45, z: z + 0.6, rx: 0.16, color: 0x3E4A5C });
  trimB.box(0.5, 0.5, 0.02, { x: sx, y: 0.52, z: z + 0.88, rx: -0.16, color: 0xEDE6D6 });
  // 门口书堆
  const bx = -w * 0.32;
  for (let i = 0; i < 9; i++) {
    const col = [0xA33B32, 0x2F5D5B, 0x8C5F7A, 0xC9A227, 0x4A6E86][i % 5];
    trimB.box(0.34, 0.075, 0.26, {
      x: bx + (i % 3) * 0.04, y: 0.04 + i * 0.078, z: z + 0.62, ry: (i % 3) * 0.1, color: col,
    });
  }
  trimB.box(0.5, 0.08, 0.34, { x: bx + 0.55, y: 0.04, z: z + 0.62, color: 0x6B503A });
  // 展示书架（橱窗内）
  for (let i = 0; i < 3; i++) {
    trimB.box(w * 0.6, 0.05, 0.2, { x: 0, y: 0.9 + i * 0.55, z: z - 0.06, color: 0x8A6A48 });
  }
  for (let i = 0; i < 12; i++) {
    const col = [0xA33B32, 0x2F5D5B, 0x8C5F7A, 0xC9A227, 0x4A6E86, 0x7A4B36][i % 6];
    trimB.box(0.1, 0.36, 0.16, {
      x: -w * 0.27 + (i % 6) * (w * 0.09), y: 1.12 + ((i / 6) | 0) * 0.55, z: z - 0.05, color: col,
    });
  }
  // 店招
  trimB.box(w * 0.62, 0.5, 0.1, { x: 0, y: 3.2, z: z + 0.08, color: 0x3E4A5C });
}

// 修伞匠：门口挂伞 + 工作台
function extraUmbrella(c) {
  const { trimB, w, d } = c;
  const z = d / 2;
  const cols = [0xC0483C, 0x2F5D5B, 0x8C5F7A, 0xE8C36A, 0x4A6E86];
  // 墙上挂钩 + 挂伞
  for (let i = 0; i < 4; i++) {
    const x = -w * 0.34 + i * (w * 0.2);
    trimB.box(0.05, 0.25, 0.05, { x, y: 2.35, z: z + 0.1, color: 0x4A4A52 });
    trimB.cyl(0.03, 0.03, 1.0, 6, { x, y: 1.95, z: z + 0.18, color: 0x6B503A });
    trimB.add(new THREE.ConeGeometry(0.3, 0.34, 8), { x, y: 1.62, z: z + 0.18, color: cols[i % cols.length] });
  }
  // 工作台
  const tx = w * 0.3;
  trimB.box(1.2, 0.1, 0.62, { x: tx, y: 0.86, z: z + 0.62, color: 0x8A6A48 });
  for (const ox of [-0.5, 0.5]) {
    for (const oz of [-0.22, 0.22]) {
      trimB.box(0.09, 0.82, 0.09, { x: tx + ox, y: 0.41, z: z + 0.62 + oz, color: 0x6B503A });
    }
  }
  // 台上的伞骨与布料
  for (let i = 0; i < 3; i++) {
    trimB.box(0.5, 0.04, 0.04, { x: tx - 0.3 + i * 0.3, y: 0.93, z: z + 0.62, rz: 0.1 * i, color: 0x5A4A3C });
  }
  trimB.box(0.34, 0.06, 0.3, { x: tx + 0.3, y: 0.94, z: z + 0.62, color: 0xC0483C });
}

// 织布工：晾布绳 + 布匹 + 纱线轴
function extraWeaver(c) {
  const { trimB, w, d } = c;
  const z = d / 2;
  // 晾布架（两根杆 + 绳 + 布）
  const px = w * 0.1;
  trimB.box(0.1, 2.6, 0.1, { x: px - w * 0.42, y: 1.3, z: z + 0.9, color: 0x6B503A });
  trimB.box(0.1, 2.6, 0.1, { x: px + w * 0.42, y: 1.3, z: z + 0.9, color: 0x6B503A });
  trimB.box(w * 0.86, 0.035, 0.035, { x: px, y: 2.5, z: z + 0.9, color: 0x8C7A66 });
  trimB.box(w * 0.86, 0.035, 0.035, { x: px, y: 2.1, z: z + 0.9, color: 0x8C7A66 });
  const cloths = [0x4A6E86, 0xE8C36A, 0xC0483C, 0x5C7A5A, 0xEFE6F0, 0x8C5F7A];
  for (let i = 0; i < 6; i++) {
    const cw = w * 0.13;
    trimB.box(cw, 0.9 + Math.random() * 0.5, 0.03, {
      x: px - w * 0.4 + i * (w * 0.145), y: (i % 2 ? 2.05 : 2.45) - 0.25, z: z + 0.9,
      rz: (Math.random() - 0.5) * 0.06, color: cloths[i],
    });
  }
  // 门口纱线轴
  for (let i = 0; i < 5; i++) {
    trimB.cyl(0.11, 0.11, 0.3, 8, {
      x: -w * 0.34 + (i % 3) * 0.26, y: 0.15 + ((i / 3) | 0) * 0.3, z: z + 0.5, color: cloths[(i + 2) % cloths.length],
    });
  }
  // 窗内织机（横杆）
  for (let i = 0; i < 3; i++) {
    trimB.box(w * 0.5, 0.06, 0.08, { x: 0, y: 1.3 + i * 0.3, z: z - 0.05, color: 0x8A6A48 });
  }
}

// 拾云人：屋顶玻璃收云罐 + 梯子 + 门口空罐
function extraCloud(c) {
  const { trimB, glassB, w, d, roofH, wallH, roofType } = c;
  const z = d / 2;
  // 屋顶大玻璃罐（放在屋脊上）
  const jy = wallH + roofH + 0.55;
  trimB.cyl(0.5, 0.44, 0.12, 12, { y: jy - 0.55, color: 0x8A6A48 });
  glassB.cyl(0.46, 0.56, 1.0, 12, { y: jy, color: 0xDCE6F2 });
  trimB.cyl(0.3, 0.5, 0.16, 12, { y: jy + 0.58, color: 0x8A6A48 });
  // 罐中云絮
  trimB.add(new THREE.IcosahedronGeometry(0.3, 0), { y: jy + 0.1, sy: 0.7, color: 0xF2F6FF });
  trimB.add(new THREE.IcosahedronGeometry(0.2, 0), { x: 0.12, y: jy + 0.24, z: 0.1, sy: 0.7, color: 0xFFFFFF });
  // 门口的玻璃罐
  for (let i = 0; i < 4; i++) {
    const cx = -w * 0.32 + i * 0.3;
    glassB.cyl(0.1, 0.12, 0.32, 8, { x: cx, y: 0.2, z: z + 0.45, color: 0xDCE6F2 });
    trimB.cyl(0.08, 0.1, 0.05, 8, { x: cx, y: 0.38, z: z + 0.45, color: 0x8A6A48 });
  }
  // 靠在墙上的梯子
  const lx = w * 0.38;
  for (const o of [-0.2, 0.2]) {
    trimB.box(0.06, 3.0, 0.06, { x: lx + o, y: 1.5, z: z + 0.28, rx: 0.22, color: 0x8A6A48 });
  }
  for (let i = 0; i < 6; i++) {
    trimB.box(0.44, 0.05, 0.05, { x: lx, y: 0.4 + i * 0.45, z: z + 0.28 + i * 0.1, color: 0x8A6A48 });
  }
  // 采云长杆 + 网
  trimB.box(0.05, 3.2, 0.05, { x: -w * 0.45, y: 1.6, z: z + 0.3, rz: 0.1, color: 0x8C7A66 });
  trimB.cyl(0.22, 0.28, 0.14, 8, { x: -w * 0.45 - 0.32, y: 3.2, z: z + 0.3, color: 0x8C7A66 });
}

// 风车管理员：屋顶小风车 + 木桶 + 工具
function extraWindmill(c) {
  const { trimB, w, d, wallH, roofH } = c;
  const z = d / 2;
  // 屋顶小风车塔
  const ty = wallH + roofH + 0.9;
  trimB.cyl(0.34, 0.44, 1.3, 8, { y: ty, color: 0xE8DCC6 });
  trimB.add(new THREE.ConeGeometry(0.46, 0.42, 8), { y: ty + 0.85, color: 0xA94C3C });
  // 四叶
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    trimB.box(0.16, 0.8, 0.05, {
      x: Math.sin(a) * 0.5, y: ty + 0.5 + Math.cos(a) * 0.5, z: z * 0.1 + 0.1,
      rz: -a, color: 0xF0E6D2,
    });
  }
  trimB.cyl(0.07, 0.07, 0.22, 6, { y: ty + 0.5, z: 0.18, rx: Math.PI / 2, color: 0x5A4A42 });
  // 门口木桶
  for (const [bx, bz] of [[w * 0.34, z + 0.55], [w * 0.34 + 0.55, z + 0.5]]) {
    trimB.cyl(0.26, 0.24, 0.62, 10, { x: bx, y: 0.31, z: bz, color: 0x8A6A48 });
    trimB.cyl(0.28, 0.28, 0.06, 10, { x: bx, y: 0.5, z: bz, color: 0x5A4A42 });
    trimB.cyl(0.28, 0.28, 0.06, 10, { x: bx, y: 0.2, z: bz, color: 0x5A4A42 });
  }
  // 靠在墙边的长杆
  trimB.box(0.05, 3.0, 0.05, { x: -w * 0.44, y: 1.5, z: z + 0.25, rz: 0.14, color: 0x8C7A66 });
}

const EXTRAS = {
  bakery: extraBakery,
  florist: extraFlorist,
  postman: extraPostman,
  clockmaker: extraClockmaker,
  lighthouse: extraLighthouse,
  bookstore: extraBookstore,
  umbrella: extraUmbrella,
  weaver: extraWeaver,
  cloud: extraCloud,
  windmill: extraWindmill,
};

// ============================================================
// 主工厂
// ============================================================
export function createHouse(spec) {
  const {
    w, d, h, floors = 2, roofType = 'gable', roofH = 1.9,
    wallColor = 0xF3E3C8, roofColor = 0xC75B45, trimColor = 0x5A4A42,
    doorColor = 0x7A4B36, shutterColor = 0x4E8E8B,
    shutters = true, balcony = false, chimney = true, shop = false, sign = false,
    profession = null,
    timber = false, dormer = false, quoins = false,
  } = spec;

  const group = new THREE.Group();
  const fh = h / floors;

  const bodyB = new Builder();
  const roofB = new Builder();
  const trimB = new Builder();
  const glassB = new Builder();

  // ---------- 主体 ----------
  bodyB.box(w, h, d, { y: h / 2 });

  // 转角石
  if (quoins) {
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        for (let i = 0; i < Math.floor(h / 0.55); i++) {
          const wide = i % 2 === 0;
          trimB.box(wide ? 0.5 : 0.34, 0.26, wide ? 0.34 : 0.5, {
            x: sx * (w / 2 - 0.14), y: 0.35 + i * 0.55, z: sz * (d / 2 - 0.14),
            color: new THREE.Color(wallColor).multiplyScalar(0.93),
          });
        }
      }
    }
  }

  // 半木构架
  if (timber) {
    const beam = new THREE.Color(trimColor).multiplyScalar(0.85);
    for (const y of [fh * 0.02, h - 0.2]) {
      trimB.box(w + 0.06, 0.16, 0.1, { y, z: d / 2 + 0.02, color: beam });
      trimB.box(w + 0.06, 0.16, 0.1, { y, z: -d / 2 - 0.02, color: beam });
    }
    for (let i = 0; i <= 3; i++) {
      const x = -w / 2 + (w * i) / 3;
      trimB.box(0.14, h, 0.1, { x, y: h / 2, z: d / 2 + 0.02, color: beam });
      trimB.box(0.14, h, 0.1, { x, y: h / 2, z: -d / 2 - 0.02, color: beam });
    }
  }

  // ---------- 勒脚 / 台阶 ----------
  trimB.box(w + 0.5, 0.42, d + 0.5, { y: 0.21, color: PAL.stoneDark });
  trimB.box(1.5, 0.22, 1.0, { y: 0.11, z: d / 2 + 0.5, color: PAL.stone });

  // 楼层腰线
  const bandCol = new THREE.Color(trimColor);
  for (let f = 1; f < floors; f++) {
    trimB.box(w + 0.2, 0.16, 0.12, { y: fh * f, z: d / 2 + 0.02, color: bandCol });
    trimB.box(w + 0.2, 0.16, 0.12, { y: fh * f, z: -d / 2 - 0.02, color: bandCol });
    trimB.box(0.12, 0.16, d + 0.2, { x: w / 2 + 0.02, y: fh * f, color: bandCol });
    trimB.box(0.12, 0.16, d + 0.2, { x: -w / 2 - 0.02, y: fh * f, color: bandCol });
  }

  // ---------- 窗户 ----------
  const winH = Math.min(1.05, fh * 0.48);
  const cols = w >= 6.6 ? 3 : 2;
  const span = Math.max(1.2, w - 1.9);
  const xs = [];
  for (let i = 0; i < cols; i++) xs.push(cols === 1 ? 0 : -span / 2 + (span * i) / (cols - 1));

  const placeWindow = (p, ww, wh, withBox = false) => {
    const nx = Math.sin(p.ry), nz = Math.cos(p.ry);
    // 洞口/窗框（实心，作为背衬）
    trimB.box(ww + 0.18, wh + 0.18, 0.12, { ...p, color: trimColor });
    // 玻璃前移，露在框外
    glassB.box(ww, wh, 0.03, {
      x: p.x + nx * 0.085, y: p.y, z: p.z + nz * 0.085, ry: p.ry, color: 0xC9D8E4,
    });
    // 窗棂（压在玻璃前面）
    trimB.box(0.05, wh, 0.03, {
      x: p.x + nx * 0.11, y: p.y, z: p.z + nz * 0.11, ry: p.ry, color: trimColor,
    });
    trimB.box(ww, 0.05, 0.03, {
      x: p.x + nx * 0.11, y: p.y, z: p.z + nz * 0.11, ry: p.ry, color: trimColor,
    });
    // 窗台
    trimB.box(ww + 0.42, 0.1, 0.26, { ...p, y: p.y - wh / 2 - 0.12, color: trimColor });
    if (withBox) {
      trimB.box(ww + 0.12, 0.2, 0.22, { ...p, y: p.y - wh / 2 - 0.28, color: 0x8A6A48 });
      for (let i = 0; i < 3; i++) {
        trimB.add(new THREE.IcosahedronGeometry(0.1, 0), {
          x: p.x + Math.cos(p.ry) * (-ww / 3 + (i * ww) / 3),
          z: p.z - Math.sin(p.ry) * (-ww / 3 + (i * ww) / 3),
          y: p.y - wh / 2 - 0.16,
          color: [0xE86A8A, 0xF0C454, 0xB073C4, 0x6FA860][(i + Math.abs(Math.round(p.x * 10))) % 4],
        });
      }
    }
    if (shutters) {
      const lateral = ww / 2 + 0.35;
      trimB.box(0.32, wh + 0.1, 0.1, {
        x: p.x + Math.cos(p.ry) * lateral, z: p.z - Math.sin(p.ry) * lateral, y: p.y, ry: p.ry, color: shutterColor,
      });
      trimB.box(0.32, wh + 0.1, 0.1, {
        x: p.x - Math.cos(p.ry) * lateral, z: p.z + Math.sin(p.ry) * lateral, y: p.y, ry: p.ry, color: shutterColor,
      });
    }
  };

  for (let f = 0; f < floors; f++) {
    const wy = fh * f + fh * 0.56;
    for (let i = 0; i < xs.length; i++) {
      if (f === 0 && !shop && i === ((xs.length / 2) | 0)) continue;
      placeWindow(facePoint(d / 2 + 0.02, xs[i], 0, wy), 0.86, winH, f > 0 && Math.random() < 0.5);
    }
    if (f > 0 || d > 4.6) {
      placeWindow(facePoint(d / 2 + 0.02, -w * 0.18, Math.PI, wy), 0.74, winH * 0.92);
      if (w > 5.4) placeWindow(facePoint(d / 2 + 0.02, w * 0.18, Math.PI, wy), 0.74, winH * 0.92);
    }
    placeWindow(facePoint(w / 2 + 0.02, 0, Math.PI / 2, wy), 0.7, winH * 0.9);
    placeWindow(facePoint(w / 2 + 0.02, 0, -Math.PI / 2, wy), 0.7, winH * 0.9);
  }

  // ---------- 门 ----------
  if (!shop) {
    trimB.box(1.12, 2.24, 0.16, { x: 0, y: 1.12, z: d / 2 + 0.05, color: trimColor });
    trimB.box(0.96, 2.06, 0.12, { x: 0, y: 1.06, z: d / 2 + 0.12, color: doorColor });
    trimB.box(0.7, 0.5, 0.1, { x: 0, y: 2.55, z: d / 2 + 0.06, color: trimColor });
    // 门檐
    trimB.box(1.5, 0.1, 0.55, { x: 0, y: 2.42, z: d / 2 + 0.32, rx: -0.1, color: trimColor });
    // 门牌
    trimB.box(0.2, 0.14, 0.03, { x: 0.68, y: 1.9, z: d / 2 + 0.14, color: 0xEDE6D6 });
  } else {
    trimB.box(w * 0.72, 1.9, 0.14, { x: 0, y: 1.32, z: d / 2 + 0.05, color: trimColor });
    glassB.box(w * 0.66, 1.72, 0.1, { x: 0, y: 1.3, z: d / 2 + 0.1, color: 0xC9D8E4 });
    // 橱窗竖棂
    for (let i = -1; i <= 1; i++) {
      trimB.box(0.06, 1.72, 0.12, { x: i * w * 0.22, y: 1.3, z: d / 2 + 0.12, color: trimColor });
    }
    const aw = w * 0.82;
    for (let i = 0; i < 6; i++) {
      const col = i % 2 ? 0xE7D5BE : 0xC75B45;
      trimB.box(aw / 6, 0.1, 1.05, {
        x: -aw / 2 + (aw / 6) * (i + 0.5), y: 2.62, z: d / 2 + 0.55, rx: -0.22, color: col,
      });
    }
    if (sign) {
      trimB.box(w * 0.6, 0.62, 0.12, { x: 0, y: 3.25, z: d / 2 + 0.08, color: trimColor });
      glassB.box(w * 0.52, 0.46, 0.1, { x: 0, y: 3.25, z: d / 2 + 0.15, color: 0x8FE3FF });
    }
  }

  // 门口小灯（夜间亮）
  trimB.box(0.1, 0.12, 0.1, { x: w / 2 - 0.55, y: 2.35, z: d / 2 + 0.1, color: 0x3A3A42 });
  glassB.box(0.16, 0.22, 0.16, { x: w / 2 - 0.55, y: 2.2, z: d / 2 + 0.14, color: 0xFFE6B0 });

  // ---------- 阳台 ----------
  if (balcony && floors >= 2) {
    const by = fh;
    trimB.box(w * 0.66, 0.16, 0.9, { x: 0, y: by, z: d / 2 + 0.45, color: PAL.stone });
    trimB.box(w * 0.66, 0.1, 0.1, { x: 0, y: by + 0.75, z: d / 2 + 0.88, color: trimColor });
    const n = Math.round(w * 2.2);
    for (let i = 0; i <= n; i++) {
      trimB.box(0.06, 0.75, 0.06, {
        x: -w * 0.33 + (w * 0.66 * i) / n, y: by + 0.38, z: d / 2 + 0.88, color: trimColor,
      });
    }
    trimB.box(0.1, 0.84, 0.9, { x: -w * 0.33, y: by + 0.42, z: d / 2 + 0.45, color: trimColor });
    trimB.box(0.1, 0.84, 0.9, { x: w * 0.33, y: by + 0.42, z: d / 2 + 0.45, color: trimColor });
    trimB.box(w * 0.5, 0.03, 0.03, { x: 0, y: by + 1.0, z: d / 2 + 0.55, color: 0x8C7A66 });
  }

  // ---------- 屋顶 ----------
  const o = 0.45;      // 檐口出挑
  const og = 0.16;     // 山墙出挑（小一点，避免屋面端头交叉）
  const hx = w / 2 + o;
  const hz = d / 2 + og;
  const hzEave = d / 2 + o;
  if (roofType === 'gable') {
    const len = Math.hypot(hx, roofH);
    const ang = Math.atan2(roofH, hx);
    roofB.add(new THREE.BoxGeometry(len, 0.18, hz * 2), { x: -hx / 2, y: roofH / 2, rz: ang, color: roofColor });
    roofB.add(new THREE.BoxGeometry(len, 0.18, hz * 2), { x: hx / 2, y: roofH / 2, rz: -ang, color: roofColor });
    roofB.box(0.24, 0.26, hz * 2 + 0.06, { y: roofH + 0.02, color: new THREE.Color(roofColor).multiplyScalar(0.8) });
    const darkRoof = new THREE.Color(roofColor).multiplyScalar(0.86);
    for (let i = 1; i <= 3; i++) {
      const t = i / 4.2;
      const px = -hx * (1 - t);
      const py = roofH * t + 0.1;
      roofB.box(len * 0.97, 0.07, hz * 1.98, { x: px, y: py, rz: ang, color: darkRoof });
      roofB.box(len * 0.97, 0.07, hz * 1.98, { x: -px, y: py, rz: -ang, color: darkRoof });
    }
    const shape = new THREE.Shape();
    shape.moveTo(-hx + 0.02, 0);
    shape.lineTo(hx - 0.02, 0);
    shape.lineTo(0, roofH);
    shape.closePath();
    const gable = new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: false });
    const gc = new THREE.Color(wallColor).multiplyScalar(0.94);
    roofB.add(gable, { y: 0, z: hz - 0.2, color: gc });
    roofB.add(gable, { y: 0, z: -hz, color: gc });

    // 老虎窗
    if (dormer && h > 6) {
      const dy = roofH * 0.45;
      roofB.box(1.3, 1.0, 0.9, { x: 0, y: dy, z: hz * 0.55, color: gh(wallColor) });
      roofB.box(1.42, 0.12, 1.0, { x: 0, y: dy + 0.55, z: hz * 0.55, rz: 0, color: roofColor });
      roofB.box(0.7, 0.55, 0.06, { x: 0, y: dy + 0.05, z: hz * 0.55 + 0.46, color: 0x5A6478 });
    }
  } else if (roofType === 'pyramid') {
    roofB.add(new THREE.ConeGeometry(hx * Math.SQRT2, roofH, 4, 1), {
      y: roofH / 2, ry: Math.PI / 4, sz: hz / hx, color: roofColor,
    });
    roofB.box(w + 0.6, 0.16, d + 0.6, { y: 0.06, color: new THREE.Color(roofColor).multiplyScalar(0.85) });
  } else {
    roofB.box(w + 0.5, 0.26, d + 0.5, { y: 0.1, color: roofColor });
    trimB.box(w + 0.54, 0.34, 0.16, { y: 0.36, z: d / 2 + 0.19, color: trimColor });
    trimB.box(w + 0.54, 0.34, 0.16, { y: 0.36, z: -d / 2 - 0.19, color: trimColor });
    trimB.box(0.16, 0.34, d + 0.54, { x: w / 2 + 0.19, y: 0.36, color: trimColor });
    trimB.box(0.16, 0.34, d + 0.54, { x: -w / 2 - 0.19, y: 0.36, color: trimColor });
  }

  // 檐沟 + 落水管
  trimB.box(w + 0.9, 0.12, 0.12, { y: 0.06 + 0.0, z: d / 2 + 0.44, color: 0x5A5A62 });
  trimB.box(0.12, h, 0.12, { x: -w / 2 - 0.28, y: h / 2, z: d / 2 + 0.4, color: 0x5A5A62 });

  // ---------- 烟囱 ----------
  let chimneyTop = null;
  if (chimney) {
    const cx = w * 0.26;
    const cz = -d * 0.18;
    const cy = roofH * 0.55;
    trimB.box(0.52, roofH * 0.9 + 0.6, 0.52, { x: cx, y: cy, z: cz, color: 0x9A7B6A });
    trimB.box(0.62, 0.16, 0.62, { x: cx, y: cy + roofH * 0.45 + 0.34, z: cz, color: 0x6E5A50 });
    chimneyTop = new THREE.Vector3(cx, roofH * 0.55 + roofH * 0.45 + 0.5, cz);
  }

  // ---------- 职业专属 ----------
  const extra = profession && EXTRAS[profession];
  if (extra) {
    extra({
      trimB, glassB, w, d, h, floors, roofH, roofType,
      wallH: h, wallColor, roofColor, trimColor, doorColor, chimneyTop,
    });
  }

  // ---------- 转成 mesh ----------
  const uProg = { value: 999 };
  const shared = { uProgress: uProg };

  const bodyGeo = bodyB.build();
  const bodyMat = injectGrow(toonMat({ color: wallColor }), shared);
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  const bodyOutline = new THREE.Mesh(bodyGeo, makeOutlineMat(OUTLINE, 0.05, shared));
  bodyOutline.castShadow = false;
  bodyMesh.add(bodyOutline);

  const roofGeo = roofB.build();
  const roofMat = toonMat({ vertexColors: true });
  const roofMesh = new THREE.Mesh(roofGeo, roofMat);
  roofMesh.position.y = h;
  roofMesh.castShadow = true;
  roofMesh.receiveShadow = true;
  const roofOutline = new THREE.Mesh(roofGeo, makeOutlineMat(OUTLINE, 0.05));
  roofOutline.castShadow = false;
  roofMesh.add(roofOutline);

  const trimGeo = trimB.build();
  const trimMat = toonMat({ vertexColors: true });
  const trimMesh = new THREE.Mesh(trimGeo, trimMat);
  trimMesh.castShadow = true;
  trimMesh.receiveShadow = true;

  const glassGeo = glassB.build();
  const glassMat = toonMat({
    color: 0xFFFFFF,
    emissive: new THREE.Color(PAL.glass),
    emissiveIntensity: 0.0,
    vertexColors: true,
  });
  const glassMesh = new THREE.Mesh(glassGeo, glassMat);

  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xBFE6FF, transparent: true, opacity: 0, side: THREE.DoubleSide,
    depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 40), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.08;
  ring.visible = false;

  group.add(bodyMesh, roofMesh, trimMesh, glassMesh, ring);

  const rec = {
    group, bodyMesh, bodyMat, bodyOutline,
    roofMesh, roofMat, roofOutline,
    trimMesh, glassMesh, glassMat,
    ring, uProg,
    height: h + roofH,
    wallHeight: h,
    chimneyPos: chimneyTop,
    totalH: h + roofH,
    lit: false,
    hover: 0,
    winVar: 0.55 + Math.random() * 0.45,
    profession,
    setRoofVisible(v) { roofMesh.visible = v; },
  };

  group.userData.house = rec;
  bodyMesh.userData.house = rec;
  roofMesh.userData.house = rec;
  trimMesh.userData.house = rec;
  glassMesh.userData.house = rec;

  return rec;
}

// 小工具：稍微加深的墙色
function gh(hex) {
  return new THREE.Color(hex).multiplyScalar(0.96);
}
