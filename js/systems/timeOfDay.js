import * as THREE from 'three';
import { TIME_KEYS } from '../config.js';

const COLOR_KEYS = ['fog', 'top', 'mid', 'bot', 'sun', 'hemiSky', 'hemiGnd', 'cloudTop', 'cloudBot'];
const NUM_KEYS = ['den', 'sunI', 'glow', 'hemiI', 'amb', 'win', 'star', 'moon'];

// 预转换颜色到线性空间
const KEYS = TIME_KEYS.map((k) => {
  const o = { h: k.h };
  for (const f of COLOR_KEYS) o[f] = new THREE.Color(k[f]);
  for (const f of NUM_KEYS) o[f] = k[f];
  return o;
});

const smooth = (t) => t * t * (3 - 2 * t);

function sampleState(hour) {
  let i = 0;
  while (i < KEYS.length - 2 && hour > KEYS[i + 1].h) i++;
  const a = KEYS[i], b = KEYS[i + 1];
  const t = smooth(Math.min(1, Math.max(0, (hour - a.h) / (b.h - a.h))));
  const out = { h: hour };
  for (const f of COLOR_KEYS) out[f] = a[f].clone().lerp(b[f], t);
  for (const f of NUM_KEYS) out[f] = a[f] + (b[f] - a[f]) * t;
  return out;
}

export class TimeSystem {
  constructor({ scene, sun, hemi, ambient, sky, clouds, lamps, houses, glowMats = [] }) {
    this.scene = scene;
    this.sun = sun;
    this.hemi = hemi;
    this.ambient = ambient;
    this.sky = sky;
    this.clouds = clouds;
    this.lamps = lamps;
    this.houses = houses;
    this.glowMats = glowMats;

    this.hour = 10.5;
    this.targetHour = 10.5;
    this.speed = 0;              // 自动推进（可选）
    this.state = null;
    this.sunDir = new THREE.Vector3();
    this._tween = null;

    this.apply(this.hour);
  }

  /** 平滑切换到某个时刻 */
  animateTo(hour, duration = 2.6) {
    let delta = hour - this.hour;
    if (delta > 12) delta -= 24;
    if (delta < -12) delta += 24;
    this._tween = { from: this.hour, delta, t: 0, duration };
    this.targetHour = hour;
  }

  jumpTo(hour) {
    this._tween = null;
    this.hour = hour;
    this.targetHour = hour;
    this.apply(hour);
  }

  update(dt) {
    if (this._tween) {
      const tw = this._tween;
      tw.t += dt;
      const k = Math.min(1, tw.t / tw.duration);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      this.hour = (tw.from + tw.delta * e + 24) % 24;
      this.apply(this.hour);
      if (k >= 1) this._tween = null;
    } else if (this.speed !== 0) {
      this.hour = (this.hour + this.speed * dt + 24) % 24;
      this.apply(this.hour);
    }
  }

  apply(hour) {
    const s = sampleState(hour);
    this.state = s;

    const sky = this.sky.uniforms;
    sky.uTop.value.copy(s.top);
    sky.uMid.value.copy(s.mid);
    sky.uBot.value.copy(s.bot);
    sky.uSunColor.value.copy(s.sun);
    sky.uSunGlow.value = s.glow;
    sky.uStars.value = s.star;
    sky.uMoon.value = s.moon;

    // 太阳 / 月亮方位
    const theta = ((hour - 6) / 12) * Math.PI;
    const dir = this.sunDir.set(Math.cos(theta), Math.sin(theta), -0.34).normalize();
    const moonMode = dir.y < 0.02;
    const lightDir = moonMode ? dir.clone().multiplyScalar(-1) : dir;
    sky.uSunDir.value.copy(dir);

    this.sun.position.copy(lightDir).multiplyScalar(170);
    this.sun.color.copy(s.sun);
    this.sun.intensity = s.sunI * (moonMode ? 0.55 : 1);
    this.sun.target.position.set(0, 0, 0);
    this.sun.target.updateMatrixWorld();

    this.hemi.color.copy(s.hemiSky);
    this.hemi.groundColor.copy(s.hemiGnd);
    this.hemi.intensity = s.hemiI;
    this.ambient.intensity = s.amb;

    this.scene.fog.color.copy(s.fog);
    this.scene.fog.density = s.den;
    this.scene.background = null;

    // 云
    for (const m of this.clouds.mats) {
      m.color.copy(s.cloudTop).lerp(s.cloudBot, 0.45);
      if (m.emissive) m.emissive.copy(s.cloudTop).multiplyScalar(0.2);
    }

    // 窗、路灯、钟面
    const win = s.win;
    this.win = win;
    for (const h of this.houses) {
      h.glassMat.emissiveIntensity = win * (h.lit ? 2.4 : 1.35) * (h.winVar ?? 1);
    }
    for (const l of this.lamps) {
      const u = l.userData;
      u.glassMat.emissiveIntensity = win * 2.6;
      u.pool.material.opacity = win * 0.5;
      u.pool.visible = win > 0.05;
    }
    // 钟楼表盘
    for (const m of this.glowMats) m.emissiveIntensity = 0.1 + win * 1.7;
  }

  setWinLamps(on) {
    for (const l of this.lamps) l.userData.forcedOff = !on;
  }
}
