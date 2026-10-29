/* =====================================================================
 * weather.js — 晴 / 阴 / 雨 / 雪
 * 改动摘要：新增。applyTime 先把场景算成该时刻的晴天基准，
 * weatherAdjust 再做乘法修正。雨雪共用一个 Points，贴图和雨声都在运行时生成。
 * ===================================================================== */
import * as THREE from 'three';

export const WEATHER_KEY = 'atelier.weather';

const IDS = ['clear', 'overcast', 'rain', 'snow'];
const RAIN_N = 1600;
const SNOW_N = 900;
const MAX_N = RAIN_N;
const PAD = 7;             // 活动盒比户型外轮廓每边大约外扩 7m
const BOX_H = 14;          // 活动盒高度
const FADE = 1.5;          // 雨声淡入 / 淡出
const RAIN_GAIN = 0.05;

/* 晴天倍率全是 1，雾距回到场景初始的 40 / 90，这样晴天夜晚与原来一致。
 * 阴雨雪的半球光和反射略抬，用来补被压低的太阳，避免室内死黑。 */
const PRESET = {
  clear:    { sun: 1,    hemi: 1,    env: 1,    sky: 0,    tint: 0x000000, fogNear: 40, fogFar: 90 },
  overcast: { sun: 0.35, hemi: 1.25, env: 0.80, sky: 0.40, tint: 0xB4C1CA, fogNear: 32, fogFar: 76 },
  rain:     { sun: 0.16, hemi: 1.40, env: 0.55, sky: 0.64, tint: 0x7A8B98, fogNear: 11, fogFar: 38 },
  snow:     { sun: 0.45, hemi: 1.18, env: 0.88, sky: 0.52, tint: 0xF6F8F8, fogNear: 24, fogFar: 66 },
};

const tint = new THREE.Color();
const rainDay = new THREE.Color(0x4E5E6C);
const rainNight = new THREE.Color(0xE7F0F6);
const snowDay = new THREE.Color(0xC5D0D8);
const snowNight = new THREE.Color(0xFFFEFF);

let plan = null;
let booted = false;
let weatherId = 'clear';
let points = null;
let mat = null;
let pos = null;
let posAttr = null;
let wet = null;
let rainTex = null;
let snowTex = null;
let fall = null;
let phase = null;
let windX = null;
let windZ = null;
let elapsed = 0;
let reveal = 1;
let baseOpacity = 0.75;

let audioCtx = null;
let master = null;
let gainFrom = 0;
let gainTo = 0;
let gainT0 = 0;
let gainDur = 0;
let audioToken = 0;
let audioPlaying = false;

function makeRainTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, 'rgba(255,255,255,0)');
  grd.addColorStop(0.16, 'rgba(255,255,255,0.08)');
  grd.addColorStop(0.42, 'rgba(255,255,255,0.95)');
  grd.addColorStop(0.78, 'rgba(255,255,255,0.28)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.strokeStyle = grd;
  g.lineCap = 'round';
  g.lineWidth = 5;
  g.globalAlpha = 0.28;
  g.beginPath();
  g.moveTo(32, 8);
  g.lineTo(32, 248);
  g.stroke();
  g.globalAlpha = 1;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(32, 6);
  g.lineTo(32, 250);
  g.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function makeSnowTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 31);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.28, 'rgba(255,255,255,0.92)');
  grd.addColorStop(0.62, 'rgba(255,255,255,0.28)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function inHouse(x, z, y) {
  /* 室内体积不落粒子：dollhouse 看四周，漫游只透过窗户看到。层高以上仍允许，雨雪会落向屋顶。 */
  return y < plan.H && x > -0.05 && x < plan.W + 0.05 && z > -0.05 && z < plan.D + 0.05;
}

function placeInShell(i, yFixed) {
  const x0 = -PAD, x1 = plan.W + PAD, z0 = -PAD, z1 = plan.D + PAD;
  let x = 0, z = 0, y = 0;
  for (let k = 0; k < 10; k++) {
    x = x0 + Math.random() * (x1 - x0);
    z = z0 + Math.random() * (z1 - z0);
    y = yFixed == null ? Math.random() * BOX_H : yFixed;
    if (!inHouse(x, z, y)) break;
  }
  if (inHouse(x, z, y)) {
    x = x0 + Math.random() * (x1 - x0);
    z = plan.D + 0.4 + Math.random() * Math.max(PAD - 0.5, 0.5);
    y = yFixed == null ? Math.random() * BOX_H : yFixed;
  }
  pos[i * 3] = x;
  pos[i * 3 + 1] = y;
  pos[i * 3 + 2] = z;
}

function seedMotion(i) {
  phase[i] = Math.random() * Math.PI * 2;
  if (weatherId === 'snow') {
    fall[i] = 0.65 + Math.random() * 0.85;
    windX[i] = 0.55 + Math.random() * 0.5;
    windZ[i] = 0.45 + Math.random() * 0.45;
  } else {
    fall[i] = 9.2 + Math.random() * 4.2;
    windX[i] = 0.85 + Math.random() * 0.7;     // 微斜风，向东
    windZ[i] = -0.28 + Math.random() * 0.55;
  }
}

function seedAll() {
  const n = MAX_N;
  for (let i = 0; i < n; i++) {
    placeInShell(i, null);
    seedMotion(i);
  }
  posAttr.needsUpdate = true;
}

function wrapXZ(x, z) {
  const x0 = -PAD, x1 = plan.W + PAD, z0 = -PAD, z1 = plan.D + PAD;
  if (x < x0) x = x1;
  else if (x > x1) x = x0;
  if (z < z0) z = z1;
  else if (z > z1) z = z0;
  return [x, z];
}

function stepParticle(i, dt, kind) {
  const i3 = i * 3;
  let x = pos[i3];
  let y = pos[i3 + 1];
  let z = pos[i3 + 2];
  if (kind === 'rain') {
    x += windX[i] * dt;
    z += windZ[i] * dt;
    y -= fall[i] * dt;
  } else {
    const a = windX[i];
    const b = windZ[i];
    x += (Math.sin(elapsed * 0.72 + phase[i]) * a + Math.sin(elapsed * 1.85 + phase[i] * 2.1) * a * 0.35) * dt;
    z += (Math.cos(elapsed * 0.48 + phase[i] * 1.37) * b + Math.cos(elapsed * 1.45 + phase[i]) * b * 0.32) * dt;
    y -= fall[i] * dt;
  }
  if (y < 0 || y > BOX_H + 0.2) {
    placeInShell(i, BOX_H - Math.random() * 0.6);
    return;
  }
  const wrapped = wrapXZ(x, z);
  x = wrapped[0];
  z = wrapped[1];
  if (inHouse(x, z, y)) {
    placeInShell(i, BOX_H - Math.random() * 0.6);
    return;
  }
  pos[i3] = x;
  pos[i3 + 1] = y;
  pos[i3 + 2] = z;
}

/* t>0.68 不再染天空。前 0.1 做平滑，滑杆跨进夜晚时不跳色。 */
function skyGate(t) {
  if (t <= 0.58) return 1;
  if (t >= 0.68) return 0;
  const u = (0.68 - t) / 0.10;
  return u * u * (3 - 2 * u);
}

/* 粒子颜色跟时刻走：白天要压得过亮天，夜晚要亮过夜空。 */
function nightBlend(t) {
  if (t <= 0.55) return 0;
  if (t >= 0.82) return 1;
  const u = (t - 0.55) / 0.27;
  return u * u * (3 - 2 * u);
}

function syncLook(t) {
  if (!mat) return;
  const k = nightBlend(t);
  if (weatherId === 'rain') {
    mat.color.copy(rainDay).lerp(rainNight, k);
    mat.size = 0.95;
    baseOpacity = 0.58 + 0.24 * k;
  } else if (weatherId === 'snow') {
    mat.color.copy(snowDay).lerp(snowNight, k);
    mat.size = 0.5;
    baseOpacity = 0.8 + 0.15 * k;
  }
  mat.opacity = baseOpacity * reveal;
}

function syncButtons() {
  const root = document.getElementById('weatherSeg');
  if (!root) return;
  const buttons = root.querySelectorAll('button');
  for (let i = 0; i < buttons.length; i++) {
    const on = buttons[i].dataset.w === weatherId;
    buttons[i].classList.toggle('on', on);
    buttons[i].setAttribute('aria-pressed', on ? 'true' : 'false');
  }
}

function applyKind(prev) {
  const precip = weatherId === 'rain' || weatherId === 'snow';
  points.visible = precip;
  if (wet) wet.visible = weatherId === 'rain';
  if (!precip) {
    reveal = 1;
    return;
  }
  const n = weatherId === 'rain' ? RAIN_N : SNOW_N;
  points.geometry.setDrawRange(0, n);
  mat.map = weatherId === 'rain' ? rainTex : snowTex;
  mat.needsUpdate = true;
  if (prev !== weatherId) {
    seedAll();
    if (prev !== 'rain' && prev !== 'snow') reveal = 0;
  }
}

function fillPink(data) {
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    b6 = white * 0.115926;
  }
  normalize(data, 0.9);
}

function fillBrown(data) {
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last;
  }
  normalize(data, 0.9);
}

function normalize(data, peakTarget) {
  let peak = 0.0001;
  for (let i = 0; i < data.length; i++) {
    const a = data[i] < 0 ? -data[i] : data[i];
    if (a > peak) peak = a;
  }
  const s = peakTarget / peak;
  for (let i = 0; i < data.length; i++) data[i] *= s;
}

function buildAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  const ctx = new AC();
  const rate = ctx.sampleRate;
  const len = rate * 2;
  const pinkBuf = ctx.createBuffer(1, len, rate);
  const brownBuf = ctx.createBuffer(1, len, rate);
  fillPink(pinkBuf.getChannelData(0));
  fillBrown(brownBuf.getChannelData(0));

  const pink = ctx.createBufferSource();
  pink.buffer = pinkBuf;
  pink.loop = true;
  const pinkFilter = ctx.createBiquadFilter();
  pinkFilter.type = 'lowpass';
  pinkFilter.frequency.value = 1100;
  pinkFilter.Q.value = 0.35;
  const pinkGain = ctx.createGain();
  pinkGain.gain.value = 0.7;

  const brown = ctx.createBufferSource();
  brown.buffer = brownBuf;
  brown.loop = true;
  const brownFilter = ctx.createBiquadFilter();
  brownFilter.type = 'lowpass';
  brownFilter.frequency.value = 340;
  const brownGain = ctx.createGain();
  brownGain.gain.value = 0.5;

  master = ctx.createGain();
  master.gain.value = 0;
  const wobble = ctx.createGain();
  wobble.gain.value = 1;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.16;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.1;
  lfo.connect(lfoGain);
  lfoGain.connect(wobble.gain);

  pink.connect(pinkFilter);
  pinkFilter.connect(pinkGain);
  pinkGain.connect(master);
  brown.connect(brownFilter);
  brownFilter.connect(brownGain);
  brownGain.connect(master);
  master.connect(wobble);
  wobble.connect(ctx.destination);
  pink.start();
  brown.start();
  lfo.start();
  audioCtx = ctx;
  gainFrom = 0;
  gainTo = 0;
  gainT0 = ctx.currentTime;
  gainDur = 0;
  return true;
}

function rampGain(target) {
  if (!audioCtx || !master) return;
  const now = audioCtx.currentTime;
  const u = gainDur <= 0 ? 1 : Math.min(1, (now - gainT0) / gainDur);
  const current = gainFrom + (gainTo - gainFrom) * u;
  gainFrom = current;
  gainTo = target;
  gainT0 = now;
  gainDur = FADE;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(current, now);
  master.gain.linearRampToValueAtTime(target, now + FADE);
}

function userActive() {
  if (!navigator.userActivation) return null;
  return navigator.userActivation.isActive;
}

/* force 只给指针事件用。页面初始化时没有手势，不能建 AudioContext。 */
function tryStartAudio(force) {
  const flag = userActive();
  if (!audioCtx && !force && flag !== true) return false;
  if (!audioCtx) {
    try {
      if (!buildAudio()) return false;
    } catch (e) {
      audioCtx = null;
      master = null;
      return false;
    }
  }
  const resumed = audioCtx.resume();
  if (resumed && resumed.catch) resumed.catch(() => {});
  audioPlaying = true;
  rampGain(RAIN_GAIN);
  return true;
}

function syncAudio() {
  if (weatherId === 'rain') {
    audioToken++;
    tryStartAudio(false);
    return;
  }
  if (!audioCtx || !master) return;
  audioPlaying = false;
  rampGain(0);
  const token = ++audioToken;
  setTimeout(() => {
    if (token !== audioToken || audioPlaying) return;
    if (audioCtx && audioCtx.state === 'running') audioCtx.suspend();
  }, FADE * 1000 + 80);
}

export function initWeather(scene, PLAN) {
  plan = PLAN;
  rainTex = makeRainTexture();
  snowTex = makeSnowTexture();
  pos = new Float32Array(MAX_N * 3);
  fall = new Float32Array(MAX_N);
  phase = new Float32Array(MAX_N);
  windX = new Float32Array(MAX_N);
  windZ = new Float32Array(MAX_N);
  const geo = new THREE.BufferGeometry();
  posAttr = new THREE.BufferAttribute(pos, 3);
  geo.setAttribute('position', posAttr);
  geo.setDrawRange(0, 0);
  mat = new THREE.PointsMaterial({
    color: 0xffffff,
    map: rainTex,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: true,
    size: 0.95,
    sizeAttenuation: true,
    fog: true,
  });
  points = new THREE.Points(geo, mat);
  points.name = 'weatherParticles';
  points.frustumCulled = false;
  points.renderOrder = 2;
  points.visible = false;
  scene.add(points);

  /* 室外地面打湿：15% 黑透明罩在地面上，等效 albedo × 0.85。
   * 不改 MAT.ground，风格渐变仍写自己的颜色。 */
  wet = new THREE.Mesh(
    new THREE.CircleGeometry(26, 48),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.15, depthWrite: false })
  );
  wet.name = 'weatherWet';
  wet.rotation.x = -Math.PI / 2;
  wet.position.set(5, -0.012, 4);
  wet.visible = false;
  scene.add(wet);

  seedAll();
  geo.computeBoundingSphere();
  booted = true;
  applyKind(null);

  addEventListener('pointerup', (e) => {
    if (weatherId !== 'rain') return;
    if (e.target && e.target.closest && e.target.closest('#weatherSeg')) return;
    tryStartAudio(true);
  }, true);
}

export function setWeather(id) {
  if (!IDS.includes(id)) return false;
  const prev = weatherId;
  weatherId = id;
  try { localStorage.setItem(WEATHER_KEY, id); } catch (e) { /* 隐私模式等场景忽略 */ }
  syncButtons();
  if (booted) applyKind(prev);
  syncAudio();
  return true;
}

/* 必须接在 applyTime 写完晴天基准之后，且每帧只调用一次。 */
export function weatherAdjust(ctx) {
  if (!booted || !ctx || !ctx.scene) return;
  const preset = PRESET[weatherId] || PRESET.clear;
  const t = typeof ctx.t === 'number' ? ctx.t : 0;
  if (ctx.sun) ctx.sun.intensity *= preset.sun;
  if (ctx.hemi) ctx.hemi.intensity *= preset.hemi;
  ctx.scene.environmentIntensity *= preset.env;
  if (ctx.scene.fog) {
    ctx.scene.fog.near = preset.fogNear;
    ctx.scene.fog.far = preset.fogFar;
  }
  const gate = skyGate(t);
  if (gate > 0 && preset.sky > 0 && ctx.scene.background && ctx.scene.background.isColor) {
    tint.set(preset.tint);
    ctx.scene.background.lerp(tint, preset.sky * gate);
    if (ctx.scene.fog && ctx.scene.fog.color) ctx.scene.fog.color.copy(ctx.scene.background);
  }
  if (wet) wet.visible = weatherId === 'rain';
  syncLook(t);
}

export function updateWeather(dt) {
  if (!booted || !points || !points.visible) return;
  const step = Math.min(Math.max(dt || 0, 0), 0.05);
  elapsed += step;
  reveal = Math.min(1, reveal + step / 0.55);
  mat.opacity = baseOpacity * reveal;
  const kind = weatherId === 'snow' ? 'snow' : 'rain';
  const n = kind === 'snow' ? SNOW_N : RAIN_N;
  for (let i = 0; i < n; i++) stepParticle(i, step, kind);
  posAttr.needsUpdate = true;
}
