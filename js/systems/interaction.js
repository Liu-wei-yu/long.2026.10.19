import * as THREE from 'three';

const BASE_OUTLINE = new THREE.Color(0x241f3a);
const HOT_OUTLINE = new THREE.Color(0xffc46b);

const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

export class Interaction {
  constructor({ camera, controls, houses, lamps, dom, growth, onHoverChange }) {
    this.camera = camera;
    this.controls = controls;
    this.houses = houses;
    this.lamps = lamps;
    this.dom = dom;
    this.growth = growth;
    this.onHoverChange = onHoverChange || (() => {});
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2(-10, -10);
    this.hovered = null;
    this.hoveredLamp = null;
    this._acc = 0;
    this.fly = null;

    this.targets = [];
    for (const h of houses) {
      this.targets.push(h.bodyMesh, h.trimMesh, h.roofMesh);
    }
    for (const l of lamps) this.targets.push(l.userData.poleMesh);

    dom.addEventListener('pointermove', (e) => {
      this.pointer.x = (e.clientX / innerWidth) * 2 - 1;
      this.pointer.y = -(e.clientY / innerHeight) * 2 + 1;
      this._moved = true;
    });
    dom.addEventListener('pointerleave', () => {
      this.pointer.set(-10, -10);
    });
    dom.addEventListener('click', (e) => {
      if (e.target !== dom) return;
      this.click();
    });
  }

  setHovered(rec) {
    if (this.hovered === rec) return;
    if (this.hovered) this.hovered.bodyOutline.material.uniforms.uColor.value.copy(BASE_OUTLINE);
    this.hovered = rec;
    if (rec) rec.bodyOutline.material.uniforms.uColor.value.copy(HOT_OUTLINE);
    this.dom.style.cursor = rec ? 'pointer' : 'default';
    this.onHoverChange(rec);
  }

  hoverTest() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.targets, false);
    let rec = null;
    let lamp = null;
    if (hits.length) {
      const o = hits[0].object;
      if (o.userData && o.userData.house) rec = o.userData.house;
      else {
        lamp = o.parent;
      }
    }
    this.setHovered(rec);
    if (this.hoveredLamp !== lamp) {
      if (this.hoveredLamp) this.hoveredLamp.userData.poleMesh.material.emissive?.setHex(0x000000);
      this.hoveredLamp = lamp;
      if (lamp) {
        const m = lamp.userData.poleMesh.material;
        if (m.emissive) m.emissive.setHex(0x2a2a3a);
      }
    }
  }

  click() {
    if (this.hovered) {
      const h = this.hovered;
      this.growth.growHouse(h);
      h.lit = !h.lit;
      const yaw = h.group.rotation.y;
      const fx = Math.sin(yaw), fz = Math.cos(yaw);
      const p = h.group.position;
      this.flyTo(
        new THREE.Vector3(p.x + fx * 15 + 4, p.y + 9, p.z + fz * 15 + 4),
        new THREE.Vector3(p.x, p.y + h.wallHeight * 0.5, p.z),
        1.3
      );
      return true;
    }
    if (this.hoveredLamp) {
      const u = this.hoveredLamp.userData;
      u.off = !u.off;
      u.glassMat.emissiveIntensity = u.off ? 0 : 2.6;
      u.pool.visible = !u.off;
      return true;
    }
    return false;
  }

  flyTo(pos, target, dur = 1.3) {
    this.fly = {
      t: 0, dur,
      p0: this.camera.position.clone(),
      t0: this.controls.target.clone(),
      p1: pos.clone(),
      t1: target.clone(),
    };
    this.controls.enabled = false;
  }

  /** 点击房屋时切换灯 */
  toggleLamps(on = null) {
    const anyOn = this.lamps.some((l) => !l.userData.off);
    const state = on === null ? !anyOn : on;
    for (const l of this.lamps) {
      const u = l.userData;
      u.off = !state;
      u.glassMat.emissiveIntensity = state ? 2.6 : 0;
      u.pool.visible = state;
    }
    return state;
  }

  update(dt) {
    this._acc += dt;
    if (this._acc > 0.08) {
      this._acc = 0;
      this.hoverTest();
    }
    if (this.fly) {
      const f = this.fly;
      f.t += dt;
      const k = Math.min(1, f.t / f.dur);
      const e = easeInOut(k);
      this.camera.position.lerpVectors(f.p0, f.p1, e);
      this.controls.target.lerpVectors(f.t0, f.t1, e);
      this.camera.lookAt(this.controls.target);
      if (k >= 1) {
        this.fly = null;
        this.controls.enabled = true;
      }
    }
  }
}
