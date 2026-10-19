import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { CFG, VIEWS } from './config.js';
import { createSky } from './lib/npr.js';
import { buildIsland } from './world/island.js';
import { buildClouds } from './world/clouds.js';
import { buildTown } from './world/town.js';
import { TimeSystem } from './systems/timeOfDay.js';
import { GrowthSystem } from './systems/growth.js';
import { Interaction } from './systems/interaction.js';
import { PedestrianSystem, TrafficCycle } from './systems/pedestrians.js';
import { buildAmbient } from './world/ambient.js';
import { buildHUD } from './ui/hud.js';

// ---------- 渲染器 ----------
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xCDE9FF, 0.0018);

const camera = new THREE.PerspectiveCamera(CFG.cam.fov, window.innerWidth / window.innerHeight, 0.5, 4000);
camera.position.fromArray(VIEWS.overview.pos);

const controls = new OrbitControls(camera, canvas);
controls.target.fromArray(VIEWS.overview.target);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;
controls.minDistance = CFG.cam.min;
controls.maxDistance = CFG.cam.max;
controls.minPolarAngle = THREE.MathUtils.degToRad(52);
controls.maxPolarAngle = THREE.MathUtils.degToRad(87);
controls.autoRotateSpeed = 0.35;
controls.update();

// ---------- 光照 ----------
const sun = new THREE.DirectionalLight(0xFFF6E0, 2.4);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const sc = sun.shadow.camera;
sc.left = -96; sc.right = 96; sc.top = 96; sc.bottom = -96;
sc.near = 1; sc.far = 520;
sun.shadow.bias = -0.0006;
sun.shadow.normalBias = 0.05;
scene.add(sun);
scene.add(sun.target);

const hemi = new THREE.HemisphereLight(0xBEE2FF, 0x8C9A76, 0.85);
scene.add(hemi);

const ambient = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambient);

// ---------- 天空 ----------
const sky = createSky();
scene.add(sky.mesh);

// ---------- 世界 ----------
const island = buildIsland();
scene.add(island.group);

const clouds = buildClouds(scene);
const town = buildTown();
scene.add(town.group);

// ---------- 烟囱炊烟 ----------
let smoke = null;
function buildSmoke(houses) {
  const spots = houses.filter((h) => h.chimneyPos).slice(0, 26);
  if (!spots.length) return null;
  const per = 6;
  const count = spots.length * per;
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const data = [];
  for (let i = 0; i < spots.length; i++) {
    const h = spots[i];
    const local = h.chimneyPos.clone().applyMatrix4(h.group.matrixWorld);
    for (let j = 0; j < per; j++) {
      const idx = i * per + j;
      data.push({ base: local.clone(), t: Math.random(), speed: 0.16 + Math.random() * 0.12, drift: Math.random() * Math.PI * 2 });
      pos[idx * 3] = local.x;
      pos[idx * 3 + 1] = local.y;
      pos[idx * 3 + 2] = local.z;
      col[idx * 3] = 1; col[idx * 3 + 1] = 1; col[idx * 3 + 2] = 1;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

  // 圆形 sprite
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  const ctx = cv.getContext('2d');
  const grd = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,0.95)');
  grd.addColorStop(0.55, 'rgba(255,255,255,0.45)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;

  const mat = new THREE.PointsMaterial({
    size: 0.85, map: tex, transparent: true, depthWrite: false,
    vertexColors: true, opacity: 0.28, sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);
  return { points, data, geo, mat, pos };
}

function updateSmoke(dt, fogColor) {
  if (!smoke) return;
  const { data, pos, geo, mat } = smoke;
  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    d.t += dt * d.speed;
    if (d.t > 1) d.t -= 1;
    const t = d.t;
    pos[i * 3] = d.base.x + Math.sin(d.drift + t * 3.2) * (0.4 + t * 1.6) + t * 1.4;
    pos[i * 3 + 1] = d.base.y + t * 5.2;
    pos[i * 3 + 2] = d.base.z + Math.cos(d.drift + t * 2.6) * (0.4 + t * 1.4) - t * 0.7;
  }
  geo.attributes.position.needsUpdate = true;
  const c = smoke.geo.attributes.color.array;
  for (let i = 0; i < data.length; i++) {
    const t = data[i].t;
    const a = 1 - t;
    c[i * 3] = fogColor.r * (1 - a) + 1 * a;
    c[i * 3 + 1] = fogColor.g * (1 - a) + 1 * a;
    c[i * 3 + 2] = fogColor.b * (1 - a) + 1 * a;
  }
  smoke.geo.attributes.color.needsUpdate = true;
  mat.opacity = 0.3;
}

// ---------- 系统 ----------
const timeSystem = new TimeSystem({
  scene, sun, hemi, ambient, sky, clouds,
  lamps: town.lamps, houses: town.houses, glowMats: town.glowMats,
});

const growth = new GrowthSystem(town.houses);
scene.updateMatrixWorld(true);
smoke = buildSmoke(town.houses);

const lights = new TrafficCycle();
const pedSys = new PedestrianSystem(scene, lights);
const ambientFX = buildAmbient(scene);

const hud = buildHUD({
  onHour(h, instant) {
    if (instant) timeSystem.jumpTo(h);
    else timeSystem.animateTo(h, 2.6);
  },
  onView(name) {
    const v = VIEWS[name];
    if (!v) return;
    interaction.flyTo(new THREE.Vector3().fromArray(v.pos), new THREE.Vector3().fromArray(v.target), 1.4);
  },
  onReplay() {
    growth.startAll();
  },
  onLamps() {
    interaction.toggleLamps();
  },
  onOutline() {
    const on = !outlineOn;
    toggleOutline(on);
    return on;
  },
  onRotate() {
    controls.autoRotate = !controls.autoRotate;
    return controls.autoRotate;
  },
});

let outlineOn = true;
function toggleOutline(on) {
  outlineOn = on;
  scene.traverse((o) => {
    if (o.isMesh && o.material && o.material.isShaderMaterial && o.material.uniforms && o.material.uniforms.uThickness) {
      o.visible = on;
    }
  });
}

const interaction = new Interaction({
  camera, controls, houses: town.houses, lamps: town.lamps,
  dom: canvas, growth,
  onHoverChange(rec) {
    if (rec) hud.showCard(rec);
    else hud.hideCard();
  },
});

// ---------- 启动 ----------
hud.setLoading('正在铺云…');
setTimeout(() => {
  growth.startAll();
  hud.setLoading(null);
}, 700);

// ---------- 主循环 ----------
const clock = new THREE.Clock();
let fpsFrames = 0;
let fpsT0 = performance.now();

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(0.1, clock.getDelta());
  const t = clock.elapsedTime;

  timeSystem.update(dt);
  growth.update(dt, timeSystem.win ?? 0);
  clouds.update(dt, t);
  interaction.update(dt);

  // 红绿灯
  lights.update(dt);
  for (const s of town.signals) {
    const w = lights.isWalk(s.group);
    s.walkMesh.visible = w;
    s.stopMesh.visible = !w;
  }
  pedSys.update(dt, t, timeSystem.win ?? 0);
  ambientFX.update(dt, t, timeSystem.win ?? 0);

  if (island.fallUniforms) island.fallUniforms.uTime.value = t;

  // 地标动效
  town.windmill.userData.blades.rotation.z += dt * 0.7;
  town.fountain.userData.water.rotation.y += dt * 0.3;

  updateSmoke(dt, scene.fog.color);

  controls.update();
  renderer.render(scene, camera);

  // HUD
  fpsFrames++;
  const now = performance.now();
  if (now - fpsT0 > 500) {
    hud.setFPS((fpsFrames * 1000) / (now - fpsT0));
    hud.setTime(timeSystem.hour);
    fpsFrames = 0;
    fpsT0 = now;
  }
}
tick();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 自检 / 调试入口
window.__DBG = { scene, camera, controls, town, growth, timeSystem, renderer, interaction, pedSys, lights, three: THREE };
window.__SCENE_READY__ = true;
document.title = '云海小镇 · ready';
