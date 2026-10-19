// ===== 全局可调参数（美术调参都放这里）=====
export const CFG = {
  island: { r: 80, flatR: 68, edgeDrop: 4.5 },
  town: {
    plazaR: 15,
    ringIn: 34,
    ringOut: 40.5,
    roadW: 8,
    roadAngles: [45, 135, 225, 315],   // 度
    roadIn: 15,
    roadOut: 59,
    innerR: [17.5, 31],                // 广场与环岛路之间的房子
    outerR: [43, 59.5],                // 环岛路外侧的房子
    sidewalk: 2.6,
  },
  growth: { perHouse: 2.1, spread: 0.95, jitter: 0.05 },
  cam: { min: 30, max: 260, fov: 42 },
};

// ===== 全局光照强度折算（保持卡通阶梯不被高光晒平）=====
export const LIGHT_SCALE = { sun: 1.0, hemi: 1.0, amb: 1.0 };

// ===== 色板 =====
export const PAL = {
  grass: [0x9CCB7C, 0x8FC274, 0xA8D188],
  soil: 0xC9B183,
  rock: [0x7E7596, 0x6B6483, 0x8E85A4, 0x5C5672],
  cliffTop: 0x8A8099,

  wall: [0xF3E3C8, 0xEFD9B4, 0xF7ECE0, 0xDCE8E4, 0xF2D6C4, 0xE9E0CC, 0xD7E2EE, 0xF0DCC8],
  roof: [0xC75B45, 0xA94C3C, 0x8C5F7A, 0x4A6E86, 0x5C7A5A, 0x9A6B4F, 0xB4533F],
  trim: [0x5A4A42, 0x3E4A5C, 0x6B4A3C, 0x4A4038],
  door: [0x7A4B36, 0x2F5D5B, 0x4A3A52, 0x8A6A3C],
  shutter: [0x4E8E8B, 0x6E7C8C, 0x9C6B5A],
  glass: 0xFFCF7E,
  road: 0x555A73,
  roadEdge: 0x5A5F79,
  stone: 0xCBC3B4,
  stoneDark: 0xA79E8F,
  line: 0xF2EFE6,
  metal: 0x37384A,
  leaf: [0x6FA860, 0x5D9A57, 0x84B96B],
  trunk: 0x6B5343,
  smoke: 0xE8E4DA,
};

// ===== 时间关键帧：hour -> 全场状态 =====
// 每一项都会被插值；colors 用 hex（THREE.Color 会转线性空间）
export const TIME_KEYS = [
  {
    h: 0.0,
    fog: 0x0D1730, den: 0.0024,
    top: 0x080D26, mid: 0x131C44, bot: 0x243F72,
    sun: 0x9FC4FF, sunI: 0.30, glow: 0.35,
    hemiSky: 0x2C3F70, hemiGnd: 0x181E33, hemiI: 0.52, amb: 0.10,
    win: 1.0, star: 1.0, moon: 1.0,
    cloudTop: 0x8496BE, cloudBot: 0x3F4F74,
  },
  {
    h: 5.0,
    fog: 0x121D38, den: 0.0024,
    top: 0x0B1130, mid: 0x1B2650, bot: 0x2E4C7E,
    sun: 0xA6C8FF, sunI: 0.30, glow: 0.4,
    hemiSky: 0x33477A, hemiGnd: 0x1C2338, hemiI: 0.52, amb: 0.10,
    win: 0.95, star: 0.85, moon: 0.8,
    cloudTop: 0x8C9CC2, cloudBot: 0x475677,
  },
  {
    h: 6.9,
    fog: 0xD98F72, den: 0.0020,
    top: 0x2E3A78, mid: 0xD4496F, bot: 0xFFB36B,
    sun: 0xFF8A50, sunI: 0.78, glow: 1.25,
    hemiSky: 0x8E7FB0, hemiGnd: 0x6A5B52, hemiI: 0.62, amb: 0.13,
    win: 0.55, star: 0.12, moon: 0.0,
    cloudTop: 0xFFD8C0, cloudBot: 0xC98FA0,
  },
  {
    h: 10.0,
    fog: 0xCDE9FF, den: 0.0015,
    top: 0x4FA3E3, mid: 0x8FC8F2, bot: 0xCFE9FF,
    sun: 0xFFF6E0, sunI: 1.05, glow: 0.55,
    hemiSky: 0xBEE2FF, hemiGnd: 0x8C9A76, hemiI: 0.72, amb: 0.13,
    win: 0.0, star: 0.0, moon: 0.0,
    cloudTop: 0xFFFFFF, cloudBot: 0xC9D8EE,
  },
  {
    h: 15.0,
    fog: 0xD3E7FA, den: 0.0016,
    top: 0x5AA7DF, mid: 0x9ACBF0, bot: 0xE2F0FC,
    sun: 0xFFF1D0, sunI: 1.00, glow: 0.65,
    hemiSky: 0xC3E2FA, hemiGnd: 0x8C9A76, hemiI: 0.72, amb: 0.13,
    win: 0.05, star: 0.0, moon: 0.0,
    cloudTop: 0xFFFDF4, cloudBot: 0xCEDCEE,
  },
  {
    h: 18.4,
    fog: 0xE8A07A, den: 0.0019,
    top: 0x3A2B6B, mid: 0xD4496F, bot: 0xFFB36B,
    sun: 0xFF7A45, sunI: 0.86, glow: 1.45,
    hemiSky: 0x9C7FA8, hemiGnd: 0x6E5A4C, hemiI: 0.62, amb: 0.13,
    win: 0.6, star: 0.1, moon: 0.0,
    cloudTop: 0xFFCFAE, cloudBot: 0xB87E96,
  },
  {
    h: 20.4,
    fog: 0x2A3454, den: 0.0022,
    top: 0x121838, mid: 0x33325E, bot: 0x5B4E82,
    sun: 0xC8A0FF, sunI: 0.42, glow: 0.4,
    hemiSky: 0x3B4270, hemiGnd: 0x262A3E, hemiI: 0.56, amb: 0.10,
    win: 0.9, star: 0.5, moon: 0.35,
    cloudTop: 0xA79BC4, cloudBot: 0x5A4E76,
  },
  {
    h: 22.5,
    fog: 0x101B36, den: 0.0024,
    top: 0x090F2A, mid: 0x16204A, bot: 0x26427A,
    sun: 0x9FC4FF, sunI: 0.30, glow: 0.3,
    hemiSky: 0x2C3F70, hemiGnd: 0x181E33, hemiI: 0.52, amb: 0.10,
    win: 1.0, star: 0.95, moon: 0.9,
    cloudTop: 0x8799C0, cloudBot: 0x415681,
  },
  {
    h: 24.0,
    fog: 0x0D1730, den: 0.0024,
    top: 0x080D26, mid: 0x131C44, bot: 0x243F72,
    sun: 0x9FC4FF, sunI: 0.30, glow: 0.35,
    hemiSky: 0x2C3F70, hemiGnd: 0x181E33, hemiI: 0.52, amb: 0.10,
    win: 1.0, star: 1.0, moon: 1.0,
    cloudTop: 0x8496BE, cloudBot: 0x3F4F74,
  },
];

// 视角预设
export const VIEWS = {
  overview: { pos: [110, 54, 154], target: [0, 0, 0] },
  street: { pos: [15.5, 6.2, 15.5], target: [43, 8.5, 43] },
  plaza: { pos: [2, 21, 46], target: [0, 11, 0] },
  hero: { pos: [-124, 48, 106], target: [0, 11, 0] },
};
