import * as THREE from 'three';

// ===== 三渲二核心 =====

/** 4 阶明暗梯度（暗部不压黑，保留色相）*/
export function makeGradientMap(steps = 4, values = [96, 158, 216, 255]) {
  const data = new Uint8Array(steps * 4);
  for (let i = 0; i < steps; i++) {
    const v = values[i] ?? Math.round((255 * i) / (steps - 1));
    data[i * 4] = v; data[i * 4 + 1] = v; data[i * 4 + 2] = v; data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, steps, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

export const GRAD = makeGradientMap(4, [112, 168, 220, 255]);
// 云用的软阶梯：暗部也是亮的，才不会看成雪山
export const SOFT_GRAD = makeGradientMap(3, [152, 212, 255]);

/** 标准卡通材质 */
export function toonMat(opts = {}) {
  return new THREE.MeshToonMaterial({
    gradientMap: GRAD,
    vertexColors: !!opts.vertexColors,
    ...opts,
  });
}

// ===== 生长裁剪：按世界高度 discard =====
/**
 * 把 uProgress（世界坐标 Y 阈值）注入材质。
 * 顶点在阈值以下的保留，以上被裁掉，边缘加一点噪声让切口像"长出来"的
 */
export function injectGrow(material, shared, edge = 0.34) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uProgress = shared.uProgress;
    shader.vertexShader =
      'varying float vWy;\n' +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\n  vWy = (modelMatrix * vec4(transformed, 1.0)).y;'
      );
    shader.fragmentShader =
      'varying float vWy;\nuniform float uProgress;\n' +
      shader.fragmentShader.replace(
        'void main() {',
        `void main() {
  float jitter = (sin(vWy * 21.0) * 0.5 + sin(vWy * 47.0 + 1.7) * 0.5) * ${edge.toFixed(3)};
  if (vWy > uProgress + jitter) discard;`
      );
  };
  material.customProgramCacheKey = () => 'grow' + edge.toFixed(3);
  return material;
}

// ===== 反向外壳描边 =====
/**
 * @param color 线色
 * @param thickness 对象空间厚度
 * @param grow 可选共享 uniform（房屋生长时要一起被裁剪）
 */
export function makeOutlineMat(color = 0x241f3a, thickness = 0.045, grow = null) {
  const uniforms = {
    uThickness: { value: thickness },
    uColor: { value: new THREE.Color(color) },
  };
  if (grow) uniforms.uProgress = grow.uProgress;

  const vertexShader = `
    uniform float uThickness;
    ${grow ? 'varying float vWy;' : ''}
    void main() {
      vec3 p = position + normal * uThickness;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      ${grow ? 'vWy = (modelMatrix * vec4(transformed, 1.0)).y;' : ''}
      gl_Position = projectionMatrix * mv;
    }`;
  // 注意：outline 顶点着色器不走标准链，vWy 用原始 position 近似即可
  const vs = vertexShader.replace(
    'vWy = (modelMatrix * vec4(transformed, 1.0)).y;',
    'vWy = (modelMatrix * vec4(position, 1.0)).y;'
  );

  const fragmentShader = `
    uniform vec3 uColor;
    ${grow ? 'varying float vWy;\nuniform float uProgress;' : ''}
    void main() {
      ${grow ? 'float jitter = (sin(vWy * 21.0) * 0.5 + sin(vWy * 47.0 + 1.7) * 0.5) * 0.34; if (vWy > uProgress + jitter) discard;' : ''}
      gl_FragColor = vec4(uColor, 1.0);
    }`;

  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: vs,
    fragmentShader,
    side: THREE.BackSide,
    depthWrite: true,
  });
  mat.extensions = { derivatives: false };
  return mat;
}

// ===== 天空 =====
export function createSky() {
  const uniforms = {
    uTop: { value: new THREE.Color(0x4FA3E3) },
    uMid: { value: new THREE.Color(0x8FC8F2) },
    uBot: { value: new THREE.Color(0xCFE9FF) },
    uSunColor: { value: new THREE.Color(0xFFF6E0) },
    uSunDir: { value: new THREE.Vector3(0.3, 0.7, -0.3).normalize() },
    uSunGlow: { value: 0.6 },
    uStars: { value: 0.0 },
    uMoon: { value: 0.0 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      varying vec3 vDir;
      uniform vec3 uTop, uMid, uBot, uSunColor, uSunDir;
      uniform float uSunGlow, uStars, uMoon;
      float hash(vec3 p) {
        return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
      }
      void main() {
        vec3 d = normalize(vDir);
        float h = clamp(d.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 col = mix(uBot, uMid, smoothstep(0.40, 0.56, h));
        col = mix(col, uTop, smoothstep(0.54, 0.96, h));

        vec3 sd = normalize(uSunDir);
        float s = max(dot(d, sd), 0.0);
        col += uSunColor * pow(s, 8.0) * uSunGlow * 0.55;
        col += uSunColor * pow(s, 240.0) * uSunGlow * 1.1;
        col += uSunColor * smoothstep(0.9990, 0.9996, s) * uSunGlow * 2.2;

        float m = max(dot(d, -sd), 0.0);
        col += vec3(0.88, 0.92, 1.0) * smoothstep(0.9986, 0.9994, m) * uMoon * 1.6;
        col += vec3(0.5, 0.62, 0.9) * pow(m, 90.0) * uMoon * 0.35;

        if (uStars > 0.002 && d.y > 0.0) {
          vec3 cell = floor(d * 300.0);
          float n = hash(cell);
          float star = smoothstep(0.9975, 1.0, n);
          float tw = 0.65 + 0.35 * sin(uStars * 12.0 + n * 60.0);
          col += vec3(0.92, 0.96, 1.0) * star * uStars * tw * smoothstep(0.0, 0.32, d.y);
        }

        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1400, 40, 24), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  return { mesh, uniforms };
}
