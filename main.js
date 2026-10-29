/* =====================================================================
 * main.js — 「73㎡，第二间房应该留给谁？」3D 交互式 Showcase
 * 同一个家，三种生活答案。
 * ===================================================================== */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PALETTE } from './floorplan-data.js';
import { STYLES, resolveSpec } from './styles-data.js';
import { pickPlan } from './plans/index.js';
import { drawPlan2D } from './plans/plan-image.js';

/* ---------- 户型配置（?plan=p73|p45|p96，缺省 p73） ---------- */
const config = pickPlan();
const { PLAN, WALLS, DOORS, ROOMS, MODES } = config;
const planCanvas = config.planImage ? null : drawPlan2D(config);
import { makeWoodFloor, makeTileFloor, makeWallTex, makeFabric, makeRug, makeContactShadow } from './textures.js';
import * as F from './furniture.js';

/* ---------- 种子随机 ---------- */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260906);
const randRange = (a, b) => a + (b - a) * rand();

/* ---------- WebGL 可用性兜底 ---------- */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  if (!renderer.getContext()) throw new Error('no webgl');
} catch (e) {
  document.getElementById('fallback').style.display = 'grid';
  document.getElementById('loading').style.display = 'none';
  document.getElementById('intro').style.display = 'none';
  throw e;
}

/* ---------- 资源就绪钩子 ---------- */
const manager = new THREE.LoadingManager();
let loadingStarted = false;
manager.onStart = () => { loadingStarted = true; };
window.__ready = new Promise((resolve) => {
  manager.onLoad = resolve;
  setTimeout(() => { if (!loadingStarted) resolve(); }, 0);
});

/* ---------- 渲染器 / 场景 ---------- */
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.localClippingEnabled = true;
document.getElementById('stage').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(PALETTE.bg);
scene.fog = new THREE.Fog(PALETTE.bg, 40, 90);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.42;
pmrem.dispose();

const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 200);
const topCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
function fitTopCamera() {
  const aspect = innerWidth / innerHeight;
  const s = Math.max(PLAN.D, PLAN.W / aspect) / 2 + 2.4;
  topCamera.left = -s * aspect; topCamera.right = s * aspect;
  topCamera.top = s; topCamera.bottom = -s;
  topCamera.updateProjectionMatrix();
}
fitTopCamera();
topCamera.position.set(...config.views.top.pos);
topCamera.up.set(0, 0, -1);
topCamera.lookAt(...config.views.top.tgt);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI * 0.495;
controls.minDistance = 2;
controls.maxDistance = 30;
controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };

/* ---------- 材质 ---------- */
const woodTex = makeWoodFloor();
woodTex.repeat.set(1 / 2.4, 1 / 2.4);
const tileTex = makeTileFloor();
tileTex.repeat.set(1 / 1.2, 1 / 1.2);
/* 墙面基色刻意与背景 0xF2F0EB 拉开明度差：此前二者只相差 1–2 个 RGB 阶，
 * 受光外墙在立体视角下溶进背景，看起来像"墙少了一半"。 */
const wallTex = makeWallTex('#E2DCCF');
const wallExtTex = makeWallTex('#D8D1C0');

const MAT = {
  floorWood: new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.55, side: THREE.DoubleSide }),
  floorTile: new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.35, side: THREE.DoubleSide }),
  wall:      new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.9 }),
  wallExt:   new THREE.MeshStandardMaterial({ map: wallExtTex, roughness: 0.92 }),
  ceiling:   new THREE.MeshStandardMaterial({ color: 0xF3F0E9, roughness: 0.95 }),
  roof:      new THREE.MeshStandardMaterial({ color: 0xDDD8CD, roughness: 0.9 }),
  skirt:     new THREE.MeshStandardMaterial({ color: 0xE2DCD1, roughness: 0.8 }),
  frame:     new THREE.MeshStandardMaterial({ color: 0x343434, roughness: 0.5, metalness: 0.6 }),
  doorPanel: new THREE.MeshStandardMaterial({ color: 0xC7A77A, roughness: 0.6 }),
  glass:     new THREE.MeshPhysicalMaterial({ color: 0xDCE6E8, roughness: 0.06, transparent: true, opacity: 0.22, depthWrite: false }),
  sill:      new THREE.MeshStandardMaterial({ color: 0xE8E3D8, roughness: 0.7 }),
  ground:    new THREE.MeshStandardMaterial({ color: 0xE9E6DE, roughness: 1 }),
};

/* 风格系统目标注册表：地毯等匿名材质在创建时登记，切换风格时统一换装 */
const styleTargets = { rugLiving: null, entryMat: null, rugPrimary: null, rugWork: null, rugGuest: null, rugFuture: null };

/* =====================================================================
 * 建筑外壳：墙体（含门窗洞口）/ 地板 / 踢脚线 / 天花
 * ===================================================================== */
const building = new THREE.Group(); building.name = 'building';
const wallsGroup = new THREE.Group(); wallsGroup.name = 'walls';
const floorsGroup = new THREE.Group(); floorsGroup.name = 'floors';
const ceilingGroup = new THREE.Group(); ceilingGroup.name = 'ceiling';
const framesGroup = new THREE.Group(); framesGroup.name = 'frames';
building.add(wallsGroup, floorsGroup, ceilingGroup, framesGroup);
scene.add(building);

/* 单面墙 → 合并几何（墙段 + 窗台 + 过梁） */
function buildWallMesh(w) {
  const H = PLAN.H, t = w.t;
  const parts = [];
  const box = (a0, a1, y0, y1) => {
    if (a1 - a0 < 0.005 || y1 - y0 < 0.005) return;
    const len = a1 - a0, h = y1 - y0;
    const g = new THREE.BoxGeometry(w.axis === 'x' ? len : t, h, w.axis === 'x' ? t : len);
    const mid = (a0 + a1) / 2;
    g.translate(w.axis === 'x' ? mid : w.c, y0 + h / 2, w.axis === 'x' ? w.c : mid);
    parts.push(g);
  };
  let cursor = w.from;
  const ops = [...(w.openings || [])].sort((p, q) => p.a - q.a);
  for (const op of ops) {
    box(cursor, op.a, 0, H);                 // 洞口左侧整段
    box(op.a, op.b, 0, op.sill);             // 窗台下墙（门 sill=0 自动跳过）
    box(op.a, op.b, op.top, H);              // 过梁
    cursor = op.b;
  }
  box(cursor, w.to, 0, H);
  const geo = mergeGeometries(parts);
  const m = new THREE.Mesh(geo, w.ext ? MAT.wallExt : MAT.wall);
  m.castShadow = true; m.receiveShadow = true;
  m.name = 'wall_' + w.id;
  m.userData.wall = w;
  return m;
}
const wallMeshes = WALLS.map(buildWallMesh);
wallMeshes.forEach(m => wallsGroup.add(m));

/* 踢脚线：沿每面墙两侧（跳过洞口） */
function buildSkirting() {
  const parts = [];
  const H = 0.08, D = 0.014;
  for (const w of WALLS) {
    const ops = [...(w.openings || [])].sort((p, q) => p.a - q.a);
    const segs = [];
    let cursor = w.from;
    for (const op of ops) {
      if (op.sill > 0.01) continue; // 窗台高于地面：踢脚线在窗下连续通过，只避门洞
      segs.push([cursor, op.a]); cursor = op.b;
    }
    segs.push([cursor, w.to]);
    for (const [a0, a1] of segs) {
      if (a1 - a0 < 0.1) continue;
      for (const side of [-1, 1]) {
        const len = a1 - a0 - 0.02, mid = (a0 + a1) / 2;
        const off = side * (w.t / 2 + D / 2);
        const g = new THREE.BoxGeometry(w.axis === 'x' ? len : D, H, w.axis === 'x' ? D : len);
        g.translate(w.axis === 'x' ? mid : w.c + off, H / 2, w.axis === 'x' ? w.c + off : mid);
        parts.push(g);
      }
    }
  }
  const m = new THREE.Mesh(mergeGeometries(parts), MAT.skirt);
  m.name = 'skirting';
  m.receiveShadow = true;
  return m;
}
wallsGroup.add(buildSkirting());

/* 地板（按房间多边形，world-space UV） */
const roomFloors = {};
for (const r of ROOMS) {
  const shape = new THREE.Shape(r.poly.map(([x, z]) => new THREE.Vector2(x, z)));
  const geo = new THREE.ShapeGeometry(shape);
  geo.rotateX(Math.PI / 2); // shape(x,z) → 世界 (x,0,z)，法线朝下 → 双面材质
  const mesh = new THREE.Mesh(geo, r.floor === 'tile' ? MAT.floorTile : MAT.floorWood);
  mesh.position.y = 0.005;
  mesh.receiveShadow = true;
  mesh.name = 'floor_' + r.id;
  mesh.userData.room = r;
  floorsGroup.add(mesh);
  roomFloors[r.id] = mesh;
}
/* 室外地面 + 基座 */
const ground = new THREE.Mesh(new THREE.CircleGeometry(26, 48), MAT.ground);
ground.rotation.x = -Math.PI / 2; ground.position.set(5, -0.02, 4);
ground.receiveShadow = true;
scene.add(ground);

/* 天花 + 屋顶 */
{
  const ceil = new THREE.Mesh(new THREE.BoxGeometry(PLAN.W, 0.05, PLAN.D), MAT.ceiling);
  ceil.position.set(PLAN.W / 2, PLAN.H + 0.025, PLAN.D / 2);
  ceil.receiveShadow = true;
  ceilingGroup.add(ceil);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(PLAN.W + 0.5, 0.18, PLAN.D + 0.5), MAT.roof);
  roof.position.set(PLAN.W / 2, PLAN.H + 0.14, PLAN.D / 2);
  roof.castShadow = true; roof.receiveShadow = true;
  roof.name = 'roofSlab';
  ceilingGroup.add(roof);
  const parapet = new THREE.Mesh(new THREE.BoxGeometry(PLAN.W + 0.5, 0.1, PLAN.D + 0.5), MAT.wallExt);
  parapet.position.set(PLAN.W / 2, PLAN.H + 0.02, PLAN.D / 2);
  ceilingGroup.add(parapet);
}
ceilingGroup.visible = false; // Dollhouse 默认无顶

/* =====================================================================
 * 门窗：框、扇、玻璃、窗台
 * ===================================================================== */
const doorPivots = [];   // 可点击门
const windowMeshes = []; // 可点击窗

for (const w of WALLS) {
  for (const op of (w.openings || [])) {
    const mid = (op.a + op.b) / 2, len = op.b - op.a;
    const at = (a, off = 0) => w.axis === 'x' ? [a, w.c + off] : [w.c + off, a];
    const frameD = w.t + 0.02;
    if (op.kind === 'door') {
      // 门框：两梃 + 上框
      const jamb = (a) => {
        const [x, z] = at(a);
        const g = new THREE.Mesh(new THREE.BoxGeometry(w.axis === 'x' ? 0.07 : frameD, op.top, w.axis === 'x' ? frameD : 0.07), MAT.frame);
        g.position.set(x, op.top / 2, z); g.castShadow = true;
        framesGroup.add(g);
      };
      jamb(op.a); jamb(op.b);
      const [hx, hz] = at(mid);
      const head = new THREE.Mesh(new THREE.BoxGeometry(w.axis === 'x' ? len : frameD, 0.07, w.axis === 'x' ? frameD : len), MAT.frame);
      head.position.set(hx, op.top - 0.035, hz); head.castShadow = true;
      framesGroup.add(head);
    } else {
      // 窗：外框 + 中梃 + 玻璃 + 窗台板
      const [cx, cz] = at(mid);
      const hWin = op.top - op.sill, yMid = (op.sill + op.top) / 2;
      const mk = (ww, hh, x, y, z) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w.axis === 'x' ? ww : hh.frame ? w.t + 0.02 : ww, hh.h !== undefined ? hh.h : hh, w.axis === 'x' ? (hh.d || 0.05) : ww), MAT.frame);
        return m;
      };
      const fg = new THREE.Group(); fg.name = 'window_' + op.name;
      const fw = 0.045;
      const mkBox = (sw, sh, sd, x, y, z) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(sw, sh, sd), MAT.frame);
        m.position.set(x, y, z); m.castShadow = true;
        fg.add(m);
      };
      if (w.axis === 'x') {
        mkBox(len, fw, w.t + 0.01, cx, op.sill + fw / 2, cz);
        mkBox(len, fw, w.t + 0.01, cx, op.top - fw / 2, cz);
        mkBox(fw, hWin, w.t + 0.01, op.a + fw / 2, yMid, cz);
        mkBox(fw, hWin, w.t + 0.01, op.b - fw / 2, yMid, cz);
        mkBox(0.022, hWin, 0.022, cx, yMid, cz); // 中梃：贯穿上下的整根，与上下横档相交连接
        const glass = new THREE.Mesh(new THREE.PlaneGeometry(len - fw, hWin - fw), MAT.glass);
        glass.position.set(cx, yMid, cz); glass.renderOrder = 4;
        fg.add(glass);
        const sill = new THREE.Mesh(new THREE.BoxGeometry(len + 0.06, 0.03, w.t + 0.14), MAT.sill);
        sill.position.set(cx, op.sill - 0.015, cz);
        fg.add(sill);
      } else {
        mkBox(w.t + 0.02, fw, len, cx, op.sill + fw / 2, cz);
        mkBox(w.t + 0.02, fw, len, cx, op.top - fw / 2, cz);
        mkBox(w.t + 0.02, hWin, fw, cx, yMid, op.a + fw / 2);
        mkBox(w.t + 0.02, hWin, fw, cx, yMid, op.b - fw / 2);
        mkBox(0.03, hWin, 0.03, cx, yMid, cz);
        const glass = new THREE.Mesh(new THREE.PlaneGeometry(len - fw, hWin - fw), MAT.glass);
        glass.rotation.y = Math.PI / 2;
        glass.position.set(cx, yMid, cz); glass.renderOrder = 4;
        fg.add(glass);
        const sill = new THREE.Mesh(new THREE.BoxGeometry(w.t + 0.14, 0.03, len + 0.06), MAT.sill);
        sill.position.set(cx, op.sill - 0.015, cz);
        fg.add(sill);
      }
      fg.userData = { kind: 'window', name: op.name, wall: w, op, center: [cx, cz], len };
      framesGroup.add(fg);
      windowMeshes.push(fg);
      // 采光范围高亮面（点击窗时显示）
      const patchTex = (() => {
        const c = document.createElement('canvas'); c.width = c.height = 128;
        const ctx = c.getContext('2d');
        const grd = ctx.createRadialGradient(64, 20, 6, 64, 64, 90);
        grd.addColorStop(0, 'rgba(255,238,200,0.85)');
        grd.addColorStop(1, 'rgba(255,238,200,0)');
        ctx.fillStyle = grd; ctx.fillRect(0, 0, 128, 128);
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
        return t;
      })();
      const patch = new THREE.Mesh(new THREE.PlaneGeometry(len + 0.6, 2.2),
        new THREE.MeshBasicMaterial({ map: patchTex, transparent: true, opacity: 0, depthWrite: false }));
      patch.rotation.x = -Math.PI / 2;
      const inward = w.id === 'N' ? 1 : w.id === 'S' ? -1 : w.id === 'W' ? 1 : -1;
      if (w.axis === 'x') patch.position.set(cx, 0.03, cz + inward * 1.1);
      else { patch.position.set(cx + inward * 1.1, 0.03, cz); patch.rotation.z = Math.PI / 2; }
      patch.renderOrder = 3;
      fg.userData.patch = patch;
      scene.add(patch);
    }
  }
}

/* 门扇（铰链轴旋转） */
for (const d of DOORS) {
  const pivot = new THREE.Group();
  pivot.name = 'door_' + d.id;
  pivot.position.set(d.pivot[0], 0, d.pivot[1]);
  const panel = new THREE.Group();
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(d.w - 0.04, d.h - 0.06, 0.04), MAT.doorPanel);
  leaf.position.set((d.w - 0.04) / 2 + 0.02, d.h / 2 - 0.01, 0);
  leaf.castShadow = true; leaf.receiveShadow = true;
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.14), MAT.frame);
  handle.position.set(d.w - 0.14, 1.02, 0);
  panel.add(leaf, handle);
  pivot.add(panel);
  const ang = (v) => Math.atan2(-v[1], v[0]); // 局部 +x → 目标方向
  pivot.userData = { kind: 'door', name: d.name, id: d.id, closed: ang(d.closed), open: ang(d.open), isOpen: false, target: ang(d.closed), panel };
  pivot.rotation.y = pivot.userData.closed;
  scene.add(pivot);
  doorPivots.push(pivot);
}

/* =====================================================================
 * 固定柜体 + 家具布置
 * ===================================================================== */
const furnitureGroup = new THREE.Group(); furnitureGroup.name = 'furniture';
scene.add(furnitureGroup);
const shared = new THREE.Group(); shared.name = 'shared';
furnitureGroup.add(shared);

const put = (g, x, z, ry = 0, y = 0) => { g.position.set(x, y, z); g.rotation.y = ry; return g; };
/* 使用语义标签：约定局部 +Z 为家具正面/使用面。
   frontVector = 世界坐标正面方向，usageTarget = 使用目标点（人站立处 / 朝向对象） */
const tagUsage = (g, tx, tz) => {
  g.userData.frontVector = new THREE.Vector3(Math.sin(g.rotation.y), 0, Math.cos(g.rotation.y));
  g.userData.usageTarget = new THREE.Vector3(tx, 0, tz);
  return g;
};

/* --- 户型专属布置（固定柜体 / 家具 / 次卧三态，随 ?plan= 切换） --- */
const furnishApi = { THREE, F, put, tagUsage, makeRug, shared, styleTargets };
const { modeGroups, modeFocus: MODE_FOCUS } = config.furnish(furnishApi);
for (const k of Object.keys(modeGroups)) {
  modeGroups[k].visible = false;
  furnitureGroup.add(modeGroups[k]);
}

/* 接触阴影：每件落地家具下的柔和暗斑（轻量 AO，增强落地感）。
 * 作为父组子节点添加 → 模式切换时随家具组一起显隐，不会残留。 */
{
  const csTex = makeContactShadow();
  const csMat = new THREE.MeshBasicMaterial({ map: csTex, transparent: true, opacity: 0.30, depthWrite: false });
  const tmp = new THREE.Box3();
  const addFor = (root) => {
    for (const ch of root.children) {
      if (!ch.visible && root === shared) continue;
      tmp.setFromObject(ch);
      if (tmp.isEmpty()) continue;
      if (ch.isGroup && ch.children.length > 1 &&
          (ch.name === 'kitchen' || ch.name === 'bath' ||
           ((tmp.max.x - tmp.min.x) > 1.8 && (tmp.max.z - tmp.min.z) > 1.8))) { addFor(ch); continue; }
      if (tmp.max.y - tmp.min.y < 0.12 || tmp.min.y > 0.70) continue;   // 地毯/悬挂物不加
      const w = tmp.max.x - tmp.min.x, d = tmp.max.z - tmp.min.z;
      if (w < 0.16 || d < 0.16) continue;                               // 柜门缝等薄片跳过
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.22, d * 1.22), csMat);
      m.userData.cs = true;                                   // 接触阴影标记（GLB 替换时保留）
      m.rotation.x = -Math.PI / 2;
      m.position.set((tmp.min.x + tmp.max.x) / 2, 0.007, (tmp.min.z + tmp.max.z) / 2);
      m.renderOrder = 1;
      root.add(m);
    }
  };
  addFor(shared);
  for (const k of Object.keys(modeGroups)) { modeGroups[k].visible = true; addFor(modeGroups[k]); modeGroups[k].visible = false; }
}

/* =====================================================================
 * 灯光：半球光 + 太阳（平行光）+ 室内灯
 * ===================================================================== */
const hemi = new THREE.HemisphereLight(0xFFF6E8, 0xC9BFAE, 0.42);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xFFE9C8, 2.6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -9; sun.shadow.camera.right = 9;
sun.shadow.camera.top = 9; sun.shadow.camera.bottom = -9;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 40;
sun.shadow.normalBias = 0.02;
sun.target.position.set(5, 0, 4);
scene.add(sun, sun.target);

/* 室内灯注册表：{ light, bulbMats[] } */
const lampRegistry = [];
function addLamp(name, x, y, z, color, intensity, dist) {
  const l = new THREE.PointLight(color, 0, dist, 2);
  l.position.set(x, y, z);
  scene.add(l);
  lampRegistry.push({ name, light: l, base: intensity });
  return l;
}
for (const [name, x, y, z, color, intensity, dist] of config.lamps) addLamp(name, x, y, z, color, intensity, dist);

const bulbMeshes = [];
scene.traverse(o => {
  if (o.name === 'lampShade' || o.name === 'pendantShade') {
    o.material = o.material.clone();
    bulbMeshes.push(o);
  }
});

/* 时间控制：t ∈ [0,1]  0.1=上午 0.45=下午 0.85=夜晚 */
let timeOfDay = 0.45;
let nightBg = 0x2E3440;   // 夜晚背景色，随风格预设变化
function applyTime(t) {
  timeOfDay = t;
  const day = Math.max(0, Math.sin((1 - t) * Math.PI));      // 白昼强度曲线
  const night = t > 0.68 ? (t - 0.68) / 0.32 : 0;
  // 太阳方位：上午东 → 下午西南，夜晚落到地平线下
  const az = THREE.MathUtils.lerp(0.2, 3.6, t);              // 上午东南 → 下午西南
  const el = t > 0.7 ? -0.15 : THREE.MathUtils.lerp(0.20, 0.58, Math.sin(Math.min(t / 0.7, 1) * Math.PI));
  const r = 18;
  sun.position.set(5 + r * Math.cos(el) * Math.cos(az), r * Math.sin(el) + 1, 4 + r * Math.cos(el) * Math.sin(az));
  const sunI = t > 0.7 ? 0 : THREE.MathUtils.lerp(1.6, 3.0, day);
  sun.intensity = sunI;
  const warm = new THREE.Color(0xFFDFB0), noon = new THREE.Color(0xFFF3E2), dusk = new THREE.Color(0xFFB98A);
  sun.color.copy(noon);
  if (t < 0.25) sun.color.lerpColors(noon, warm, 0.5);
  else if (t > 0.5) sun.color.lerpColors(noon, dusk, Math.min((t - 0.5) / 0.2, 1));
  hemi.intensity = THREE.MathUtils.lerp(0.42, 0.10, night);
  hemi.color.set(t > 0.7 ? 0x8FA3C4 : 0xFFF6E8);
  scene.environmentIntensity = THREE.MathUtils.lerp(0.42, 0.12, night);
  scene.background.set(t > 0.7 ? nightBg : PALETTE.bg);
  scene.fog.color.copy(scene.background);
  renderer.toneMappingExposure = THREE.MathUtils.lerp(1.0, 0.92, night);
  // 室内灯：傍晚起渐亮，夜晚全亮（夜景不漆黑）
  const lampOn = THREE.MathUtils.smoothstep(t, 0.55, 0.8);
  for (const rec of lampRegistry) rec.light.intensity = rec.base * (0.15 + 0.85 * lampOn);
  for (const b of bulbMeshes) {
    b.material.emissive = b.material.emissive || new THREE.Color(0);
    b.material.emissive.set(0xFFC98A);
    b.material.emissiveIntensity = lampOn * 1.6;
  }
}

/* =====================================================================
 * 房间悬停 / 选中：高亮 + 压暗其他空间
 * ===================================================================== */
const hoverHl = {}, dimPlane = {};
for (const r of ROOMS) {
  const shape = new THREE.Shape(r.poly.map(([x, z]) => new THREE.Vector2(x, z)));
  const mk = (color, op) => {
    const g = new THREE.ShapeGeometry(shape);
    g.rotateX(Math.PI / 2);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    m.position.y = 0.02; m.renderOrder = 2;
    scene.add(m);
    return m;
  };
  hoverHl[r.id] = mk(0x7E8D7A, 0.22);
  dimPlane[r.id] = mk(0x2A2723, 0.30);
}

/* 房间标签（CanvasTexture sprite，屏幕重叠自动隐藏次要标签） */
const labelGroup = new THREE.Group(); labelGroup.name = 'labels';
scene.add(labelGroup);
const labelSprites = [];
function makeLabelSprite(text, prio) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 160;
  const ctx = c.getContext('2d');
  ctx.font = '600 56px "Songti SC", "Noto Serif SC", serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#3A352E';
  ctx.fillText(text, 256, 66);
  ctx.strokeStyle = 'rgba(58,53,46,0.5)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(196, 118); ctx.lineTo(316, 118); ctx.stroke();
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  sp.scale.set(1.6, 0.5, 1);
  sp.userData.prio = prio;
  sp.renderOrder = 20;
  return sp;
}
ROOMS.forEach((r, i) => {
  if (r.id === 'hall') return; // 走廊不置顶标签（信息卡里有）
  const sp = makeLabelSprite(r.name, i);
  sp.position.set(r.label[0], 1.9, r.label[1]);
  labelGroup.add(sp);
  labelSprites.push(sp);
});
function resolveLabelOverlap() {
  const cam = getActiveCamera();
  const pts = labelSprites.map(sp => {
    const v = sp.position.clone().project(cam);
    return { sp, x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight, behind: v.z > 1 };
  });
  pts.sort((a, b) => a.sp.userData.prio - b.sp.userData.prio);
  const placed = [];
  for (const p of pts) {
    let hide = p.behind;
    if (!hide) for (const q of placed) {
      if (Math.abs(p.x - q.x) < 130 && Math.abs(p.y - q.y) < 46) { hide = true; break; }
    }
    const dist = getActiveCamera().position.distanceTo(p.sp.position);
    p.sp.visible = !hide && labelsOn && viewMode !== 'interior' && !ceilingGroup.visible && dist > 5.5;
    if (!hide) placed.push(p);
  }
}

/* 尺寸线（整体 10.0 × 8.0 + 主卧/次卧标注） */
const dimGroup = new THREE.Group(); dimGroup.name = 'dimensions';
scene.add(dimGroup);
{
  const lineMat = new THREE.LineBasicMaterial({ color: 0x8A8478 });
  const mkLine = (pts) => {
    const g = new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(...p)));
    dimGroup.add(new THREE.Line(g, lineMat));
  };
  const mkText = (text, x, z, ry = 0) => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 80;
    const ctx = c.getContext('2d');
    ctx.font = '42px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#6B655A'; ctx.fillText(text, 128, 40);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    sp.scale.set(1.1, 0.34, 1); sp.position.set(x, 0.4, z); sp.renderOrder = 19;
    dimGroup.add(sp);
  };
  // 北侧总宽
  mkLine([[0, 0.05, -0.5], [PLAN.W, 0.05, -0.5]]);
  mkLine([[0, 0.05, -0.65], [0, 0.05, -0.35]]);
  mkLine([[PLAN.W, 0.05, -0.65], [PLAN.W, 0.05, -0.35]]);
  mkText(String(Math.round(PLAN.W * 1000)), PLAN.W / 2, -0.85);
  // 西侧总深
  mkLine([[-0.5, 0.05, 0], [-0.5, 0.05, PLAN.D]]);
  mkLine([[-0.65, 0.05, 0], [-0.35, 0.05, 0]]);
  mkLine([[-0.65, 0.05, PLAN.D], [-0.35, 0.05, PLAN.D]]);
  mkText(String(Math.round(PLAN.D * 1000)), -0.9, PLAN.D / 2);
  for (const [text, x, z] of config.dimLabels) mkText(text, x, z);
}
dimGroup.visible = false;

/* =====================================================================
 * 2D 户型图平面（开场 → 地面轮廓；也可由开关重新叠显）
 * ===================================================================== */
const planTex = config.planImage
  ? new THREE.TextureLoader(manager).load(config.planImage)
  : new THREE.CanvasTexture(planCanvas);
planTex.colorSpace = THREE.SRGBColorSpace;
const planSize = config.planImageSize || [PLAN.W + 1.6, PLAN.D + 1.65];
const planCenter = config.planCenter || [PLAN.W / 2, PLAN.D / 2 + 0.15];
const planPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(planSize[0], planSize[1]),
  new THREE.MeshBasicMaterial({ map: planTex, transparent: true, opacity: 1 }));
planPlane.rotation.x = -Math.PI / 2;
planPlane.position.set(planCenter[0], 0.03, planCenter[1]);
planPlane.renderOrder = 1;
scene.add(planPlane);
let planOverlayOn = false;

/* =====================================================================
 * 相机视角与视图模式
 * ===================================================================== */
const VIEWS = config.views;
let viewMode = 'dollhouse';   // dollhouse | top | interior | section
const camTween = { active: false, t: 0, dur: 1.2, fromP: new THREE.Vector3(), toP: new THREE.Vector3(), fromT: new THREE.Vector3(), toT: new THREE.Vector3(), fromCam: null, toCam: null, fromF: 40, toF: 40 };
function flyTo(pos, tgt, dur = 1.2, cam = null, fov = null) {
  const ac = getActiveCamera();
  camTween.fromP.copy(ac.position); camTween.toP.set(...pos);
  camTween.fromT.copy(controls.target); camTween.toT.set(...tgt);
  camTween.fromF = camera.fov; camTween.toF = (fov == null ? 40 : fov);   // 缺省回落标准 FOV 40
  camTween.t = 0; camTween.dur = dur; camTween.active = true;
}
function getActiveCamera() { return viewMode === 'top' ? topCamera : camera; }

const sectionPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1.35);

/* 相机预设随户型配置（dollhouseCamera / sectionCamera / interiorCamera / roamStartCamera） */
const CAMERA_PRESETS = config.cameras;
let savedViewBeforeRoam = null;   // 进入漫游前保存的机位 {mode,pos,tgt}
let savedPanelsBeforeRoam = null; // 进入漫游前保存的面板状态 {more,dims,room}

/* 俯视/剖切图面优化：关闭墙体与窗框的投影，避免户型外部大面积无意义阴影；
 * 家具投影与地面接触阴影盘保留，图面仍有层次。 */
function setWallShadows(on) {
  for (const g of [wallsGroup, framesGroup]) g.traverse(o => { if (o.isMesh) o.castShadow = on; });
}

function setViewMode(mode) {
  const prev = viewMode;
  // 进入漫游：保存当前视图模式与机位（top 是正交相机，只记模式）+ 强制收起面板（退出时恢复）
  if (mode === 'interior' && prev !== 'interior') {
    savedViewBeforeRoam = {
      mode: prev,
      pos: (prev === 'dollhouse' || prev === 'section') ? camera.position.clone() : null,
      tgt: (prev === 'dollhouse' || prev === 'section') ? controls.target.clone() : null,
    };
    savedPanelsBeforeRoam = {
      more: $('morePanel').classList.contains('show'),
      dims: dimGroup.visible,
      room: selectedRoom,
    };
    $('morePanel').classList.remove('show');
    dimGroup.visible = false;
    if (selectedRoom) { selectedRoom = null; roomCard.classList.remove('show'); }
  }
  // 离开漫游：恢复进入前的面板状态（不触发房间聚焦飞行）
  if (mode !== 'interior' && prev === 'interior' && savedPanelsBeforeRoam) {
    if (savedPanelsBeforeRoam.more) $('morePanel').classList.add('show');
    dimGroup.visible = savedPanelsBeforeRoam.dims;
    if (savedPanelsBeforeRoam.room) {
      selectedRoom = savedPanelsBeforeRoam.room;
      roomCard.classList.add('show');
    }
    savedPanelsBeforeRoam = null;
  }
  viewMode = mode;
  controls.enabled = (mode !== 'interior');
  document.body.classList.toggle('roaming', mode === 'interior');
  setWallShadows(mode !== 'top' && mode !== 'section');
  const clip = (mode === 'section');
  for (const m of [MAT.wall, MAT.wallExt, MAT.skirt]) m.clippingPlanes = clip ? [sectionPlane] : null;
  // 剖切时隐藏顶；漫游时强制有天花（否则抬头看到天空，不像室内）；其余视图跟随屋顶开关
  ceilingGroup.visible = !clip && (roofOn || mode === 'interior');
  if (mode === 'dollhouse') {
    // 漫游 → 立体：恢复保存机位；其余情况回预设
    const sv = (prev === 'interior' && savedViewBeforeRoam && savedViewBeforeRoam.mode === 'dollhouse' && savedViewBeforeRoam.pos) ? savedViewBeforeRoam : null;
    flyTo(sv ? sv.pos.toArray() : CAMERA_PRESETS.dollhouseCamera.pos,
          sv ? sv.tgt.toArray() : CAMERA_PRESETS.dollhouseCamera.tgt, 1.4);
  }
  else if (mode === 'section') {
    // 漫游 → 剖切：恢复保存机位；其余情况回预设
    const sv = (prev === 'interior' && savedViewBeforeRoam && savedViewBeforeRoam.mode === 'section' && savedViewBeforeRoam.pos) ? savedViewBeforeRoam : null;
    flyTo(sv ? sv.pos.toArray() : CAMERA_PRESETS.sectionCamera.pos,
          sv ? sv.tgt.toArray() : CAMERA_PRESETS.sectionCamera.tgt, 1.4);
  }
  else if (mode === 'top') { fitTopCamera(); }                     // 漫游 → 俯视：正交相机，不带漫游位置
  else if (mode === 'interior') {
    if (camera.fov !== 40) { camera.fov = 40; camera.updateProjectionMatrix(); }   // 漫游固定标准 FOV
    const p = CAMERA_PRESETS.roamStartCamera;
    const [sx, sz] = findFreeSpawn(p.pos[0], p.pos[2]);            // 出生点校验，被占则螺旋找最近可通行点
    interior.pos.set(sx, 1.6, sz);                                 // 眼高固定 1.60m
    interior.yaw = p.yaw; interior.pitch = p.pitch;
    camera.position.copy(interior.pos);
    controls.target.set(sx - Math.sin(p.yaw), 1.5, sz - Math.cos(p.yaw));
    controls.update();
  }
  document.querySelectorAll('#viewSeg button').forEach(b => b.classList.toggle('on', b.dataset.v === mode));
}

/* =====================================================================
 * 第一人称漫游：拖拽环视 + WASD/方向键/滚轮移动
 * 碰撞：墙段（门洞开口可通行）+ 房间边界 + 家具 AABB，圆半径 0.25m，
 * 逐轴移动检测 → 贴墙滑动，不会卡死。
 * ===================================================================== */
const interior = { pos: new THREE.Vector3(4.55, 1.6, 6.85), yaw: 1.22, pitch: 0, keys: {} };
const ROAM_R = 0.25;

/* 墙段碰撞盒：由 WALLS 数据生成，门洞处断开（窗下有墙，不可穿越） */
const wallSegs = [];
{
  for (const w of WALLS) {
    const h = w.t / 2 + 0.01;
    let ints = [[w.from, w.to]];
    for (const d of (w.openings || []).filter(o => o.kind === 'door')) {
      const next = [];
      for (const [a, b] of ints) {
        if (d.b <= a || d.a >= b) { next.push([a, b]); continue; }
        if (d.a > a) next.push([a, d.a]);
        if (d.b < b) next.push([d.b, b]);
      }
      ints = next;
    }
    for (const [a, b] of ints) {
      if (b - a < 0.02) continue;
      if (w.axis === 'x') wallSegs.push({ x1: a, z1: w.c - h, x2: b, z2: w.c + h });
      else wallSegs.push({ x1: w.c - h, z1: a, x2: w.c + h, z2: b });
    }
  }
}

/* 家具碰撞盒：static（shared）+ 当前模式组，模式切换后重建 */
let furnitureBoxes = [];
function rebuildFurnitureBoxes() {
  furnitureBoxes = [];
  const tmp = new THREE.Box3();
  const collect = (root) => {
    for (const ch of root.children) {
      if (!ch.visible) continue;
      tmp.setFromObject(ch);
      if (tmp.isEmpty()) continue;
      // 整房间容器组（厨房/卫生间）：包围盒覆盖整个房间，下钻按单件建盒
      if (ch.isGroup && ch.children.length > 1 &&
          (ch.name === 'kitchen' || ch.name === 'bath' ||
           ((tmp.max.x - tmp.min.x) > 1.8 && (tmp.max.z - tmp.min.z) > 1.8))) { collect(ch); continue; }
      if (tmp.max.y - tmp.min.y < 0.12) continue;   // 地毯等扁平物不挡路
      if (tmp.min.y > 0.70) continue;               // 挂画/镜柜/毛巾/吊灯等悬挂物不挡路（落地家具 min.y≈0）
      furnitureBoxes.push({ x1: tmp.min.x - 0.02, z1: tmp.min.z - 0.02, x2: tmp.max.x + 0.02, z2: tmp.max.z + 0.02, name: ch.name || ch.type });
    }
  };
  collect(shared);
  for (const k of Object.keys(modeGroups)) if (modeGroups[k].visible) collect(modeGroups[k]);
}

function circleHits(x, z, b) {
  const cx = Math.max(b.x1, Math.min(x, b.x2));
  const cz = Math.max(b.z1, Math.min(z, b.z2));
  const dx = x - cx, dz = z - cz;
  return dx * dx + dz * dz < ROAM_R * ROAM_R;
}
function isFree(x, z) {
  if (x < 0.30 || x > PLAN.W - 0.30 || z < 0.30 || z > PLAN.D - 0.30) return false;   // 房间边界兜底
  for (const b of wallSegs) if (circleHits(x, z, b)) return false;
  for (const b of furnitureBoxes) if (circleHits(x, z, b)) return false;
  return true;
}
function findFreeSpawn(x, z) {
  if (isFree(x, z)) return [x, z];
  for (const r of [0.3, 0.6, 0.9, 1.2, 1.6, 2.0])
    for (let a = 0; a < 8; a++) {
      const nx = x + Math.cos(a * Math.PI / 4) * r, nz = z + Math.sin(a * Math.PI / 4) * r;
      if (isFree(nx, nz)) return [nx, nz];
    }
  const fb = config.cameras.roamStartCamera.pos;
  return [fb[0], fb[2]];   // 兜底：户型配置的漫游出生点
}

addEventListener('keydown', e => { interior.keys[e.code] = true; });
addEventListener('keyup', e => { interior.keys[e.code] = false; });
let dragLook = null;
renderer.domElement.addEventListener('pointerdown', e => {
  if (viewMode === 'interior') dragLook = { x: e.clientX, y: e.clientY };
});
addEventListener('pointermove', e => {
  if (dragLook && viewMode === 'interior') {
    interior.yaw -= (e.clientX - dragLook.x) * 0.0035;
    interior.pitch = THREE.MathUtils.clamp(interior.pitch - (e.clientY - dragLook.y) * 0.0028, -0.6, 0.6);
    dragLook = { x: e.clientX, y: e.clientY };
  }
});
addEventListener('pointerup', () => { dragLook = null; });
renderer.domElement.addEventListener('wheel', e => {
  if (viewMode === 'interior') {
    e.preventDefault();
    moveInterior(Math.sign(e.deltaY) * -0.35, 0);
  }
}, { passive: false });
function nearestBlocker(x, z) {
  let best = null, bd = ROAM_R * ROAM_R;
  for (const list of [wallSegs, furnitureBoxes])
    for (const b of list) {
      const cx = Math.max(b.x1, Math.min(x, b.x2));
      const cz = Math.max(b.z1, Math.min(z, b.z2));
      const d2 = (x - cx) * (x - cx) + (z - cz) * (z - cz);
      if (d2 < bd) { bd = d2; best = { b, cx, cz }; }
    }
  return best;
}
function moveInterior(fwd, side) {
  const dx = Math.sin(interior.yaw) * -fwd + Math.cos(interior.yaw) * side;
  const dz = Math.cos(interior.yaw) * -fwd - Math.sin(interior.yaw) * side;
  const p = interior.pos;
  const nx = p.x + dx, nz = p.z + dz;
  if (isFree(nx, nz)) { p.x = nx; p.z = nz; return; }
  if (Math.abs(dx) > 1e-9 && isFree(nx, p.z)) { p.x = nx; return; }   // 逐轴检测 → 沿墙/家具滑动
  if (Math.abs(dz) > 1e-9 && isFree(p.x, nz)) { p.z = nz; return; }
  // 贴角/斜面滑动：取最近阻挡物的切线方向继续挪动，避免在墙角完全卡死
  const hit = nearestBlocker(nx, nz);
  if (hit) {
    let ox = nx - hit.cx, oz = nz - hit.cz;
    const d = Math.hypot(ox, oz) || 1;
    let tx = -oz / d, tz = ox / d;
    const m = Math.hypot(dx, dz);
    if (tx * dx + tz * dz < 0) { tx = -tx; tz = -tz; }
    const sx = p.x + tx * m, sz = p.z + tz * m;
    if (isFree(sx, sz)) { p.x = sx; p.z = sz; }
  }
}
function updateInterior(dt) {
  if (viewMode !== 'interior') return;
  const sp = (interior.keys.ShiftLeft ? 3.2 : 1.7) * dt;
  if (interior.keys.KeyW || interior.keys.ArrowUp) moveInterior(sp, 0);
  if (interior.keys.KeyS || interior.keys.ArrowDown) moveInterior(-sp, 0);
  if (interior.keys.KeyA || interior.keys.ArrowLeft) moveInterior(0, -sp);
  if (interior.keys.KeyD || interior.keys.ArrowRight) moveInterior(0, sp);
  interior.pos.y = 1.6;                        // 眼高恒定：不低于地板、不高于天花
  camera.position.copy(interior.pos);
  const look = new THREE.Vector3(
    interior.pos.x - Math.sin(interior.yaw) * Math.cos(interior.pitch),
    interior.pos.y + Math.sin(interior.pitch),
    interior.pos.z - Math.cos(interior.yaw) * Math.cos(interior.pitch));
  camera.lookAt(look);
}

/* =====================================================================
 * 拾取：房间悬停 / 点击聚焦，门开关，窗高亮
 * ===================================================================== */
const ray = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredRoom = null, selectedRoom = null;
let downAt = null;

function pick(ev) {
  mouse.set((ev.clientX / innerWidth) * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(mouse, getActiveCamera());
  const doorHits = ray.intersectObjects(doorPivots, true);
  if (doorHits.length) return { type: 'door', obj: doorHits[0].object };
  const winHits = ray.intersectObjects(windowMeshes, true);
  if (winHits.length) {
    let o = winHits[0].object;
    while (o && !o.userData.kind) o = o.parent;
    if (o) return { type: 'window', obj: o };
  }
  const floorHits = ray.intersectObjects(Object.values(roomFloors));
  if (floorHits.length) return { type: 'room', obj: floorHits[0].object };
  return null;
}

renderer.domElement.addEventListener('pointermove', ev => {
  if (viewMode === 'interior' || dragLook || arranging) return;
  const hit = pick(ev);
  hoveredRoom = hit && hit.type === 'room' ? hit.obj.userData.room.id : null;
  renderer.domElement.style.cursor =
    hit && (hit.type === 'door' || hit.type === 'window' || hit.type === 'room') ? 'pointer' : 'default';
});
renderer.domElement.addEventListener('pointerdown', ev => { downAt = [ev.clientX, ev.clientY]; });
function toggleDoor(obj) {
  let p = obj;
  while (p && !p.userData.kind) p = p.parent;
  if (p) { p.userData.isOpen = !p.userData.isOpen; p.userData.target = p.userData.isOpen ? p.userData.open : p.userData.closed; }
}
renderer.domElement.addEventListener('pointerup', ev => {
  if (!downAt) return;
  const moved = Math.hypot(ev.clientX - downAt[0], ev.clientY - downAt[1]);
  downAt = null;
  if (moved > 6) return;
  if (arranging) return;                  // 布置模式下不触发房间/门窗交互
  const hit = pick(ev);
  if (viewMode === 'interior') {          // 漫游中：仅响应门开关，不触发房间选择/窗高亮
    if (hit && hit.type === 'door') toggleDoor(hit.obj);
    return;
  }
  if (!hit) { selectRoom(null); return; }
  if (hit.type === 'door') {
    toggleDoor(hit.obj);
  } else if (hit.type === 'window') {
    flashWindow(hit.obj);
  } else if (hit.type === 'room') {
    selectRoom(hit.obj.userData.room.id === selectedRoom ? null : hit.obj.userData.room.id);
  }
});

let activePatch = null, patchFade = 0;
function flashWindow(winGroup) {
  if (activePatch) activePatch.material.opacity = 0;
  activePatch = winGroup.userData.patch;
  patchFade = 1.6;
}

const roomCard = document.getElementById('roomCard');
function selectRoom(id) {
  selectedRoom = id;
  if (!id) { roomCard.classList.remove('show'); return; }
  const r = ROOMS.find(q => q.id === id);
  document.getElementById('rcName').textContent = r.name;
  document.getElementById('rcSize').textContent = r.size;
  document.getElementById('rcDesc').textContent = r.desc;
  document.getElementById('rcFurn').textContent = r.furn;
  roomCard.classList.add('show');
  // 镜头平滑移到房间
  const c = [(r.poly.reduce((s, p) => s + p[0], 0)) / r.poly.length, (r.poly.reduce((s, p) => s + p[1], 0)) / r.poly.length];
  const d = Math.max(...r.poly.map(p => Math.hypot(p[0] - c[0], p[1] - c[1])));
  const dist = THREE.MathUtils.clamp(d * 3.2 + 2.2, 4, 10);
  flyTo([c[0] + dist * 0.55, dist * 0.8, c[1] + dist * 0.75], [c[0], 0.6, c[1]], 1.2);
  if (viewMode === 'top' || viewMode === 'section') setViewMode('dollhouse');
}
document.getElementById('rcClose').onclick = () => selectRoom(null);

/* =====================================================================
 * UI：开关 / 时间 / 生活状态 / 选择
 * ===================================================================== */
let roofOn = false, labelsOn = true, furnitureOn = true;
const $ = (id) => document.getElementById(id);

$('tglRoof').onchange = e => { roofOn = e.target.checked; ceilingGroup.visible = roofOn && viewMode !== 'section'; };
$('tglFurn').onchange = e => { furnitureOn = e.target.checked; furnitureGroup.visible = furnitureOn; };
$('tglLabels').onchange = e => { labelsOn = e.target.checked; };
$('tglDims').onchange = e => { dimGroup.visible = e.target.checked; };
$('tglPlan').onchange = e => {
  planOverlayOn = e.target.checked;
  planPlane.visible = planOverlayOn;
  planPlane.material.opacity = planOverlayOn ? 0.55 : 1;
};
$('wallAlpha').oninput = e => {
  const a = Number(e.target.value);
  for (const m of [MAT.wall, MAT.wallExt]) {
    m.transparent = a < 0.99;
    m.opacity = a;
    m.depthWrite = a > 0.6;
  }
};
$('btnReset').onclick = () => { selectRoom(null); setViewMode('dollhouse'); };
$('roamExit').onclick = () => setViewMode((savedViewBeforeRoam && savedViewBeforeRoam.mode) || 'dollhouse');   // 漫游 → 进入前的视图（立体/俯视/剖切）
document.querySelectorAll('#viewSeg button').forEach(b => b.onclick = () => setViewMode(b.dataset.v));
$('moreBtn').onclick = () => $('morePanel').classList.toggle('show');

/* 时间滑杆 */
const timeSlider = $('timeSlider');
const timeLabel = $('timeLabel');
timeSlider.oninput = () => {
  const t = Number(timeSlider.value) / 100;
  applyTime(t);
  timeLabel.textContent = t < 0.35 ? '上午' : t < 0.68 ? '下午' : '夜晚';
};

/* 生活状态切换 */
let currentMode = null;
const modeNames = Object.fromEntries(MODES.map(m => [m.id, m.name]));
function setMode(id, instant = false) {
  const mode = MODES.find(m => m.id === id);
  if (!mode || currentMode === id) return;
  currentMode = id;
  for (const k of Object.keys(modeGroups)) {
    const g = modeGroups[k];
    if (k === id) {
      g.visible = true;
      if (!instant) {
        g.scale.setScalar(0.001);
        g.userData.popIn = 0;
      } else g.scale.setScalar(1);
    } else g.visible = false;
  }
  timeSlider.value = mode.time * 100;
  applyTime(mode.time);
  timeLabel.textContent = mode.time < 0.35 ? '上午' : mode.time < 0.68 ? '下午' : '夜晚';
  document.querySelectorAll('#modeBar .mode').forEach(b => b.classList.toggle('on', b.dataset.m === id));
  $('modeDesc').textContent = mode.desc;
  rebuildFurnitureBoxes();          // 模式家具变化 → 漫游碰撞盒同步重建
  // 已做出选择时同步徽章
  if (chosen) updateChosenBadge();
  renderList();                     // 软装清单随模式联动
}
/* 每个模式的聚焦方向与关键家具（焦点 = 该模式的视觉中心）：数据随户型配置 */
function focusModeView(m) {
  const g = modeGroups[m], cfg = MODE_FOCUS[m];
  if (!g || !cfg) { flyTo(VIEWS.detail.pos, VIEWS.detail.tgt, 1.3); return; }
  const box = new THREE.Box3(), tmp = new THREE.Box3();
  box.makeEmpty();
  for (const ch of g.children) {
    if (cfg.keys.includes(ch.name)) { tmp.setFromObject(ch); box.union(tmp); }
  }
  if (box.isEmpty()) box.setFromObject(g);
  const c = box.getCenter(new THREE.Vector3());
  const corners = [];
  for (const x of [box.min.x, box.max.x])
    for (const y of [box.min.y, box.max.y])
      for (const z of [box.min.z, box.max.z]) corners.push(new THREE.Vector3(x, y, z));
  // 距离/高度不由固定公式：把关键家具包围盒角点投影到自检相机，
  // 迭代抬升机位直到全部入画（含底部模式面板余量）→ 三种模式距离各不相同
  const fov = cfg.fov || 40;
  const tc = camera.clone();
  tc.fov = fov; tc.updateProjectionMatrix();
  const tgt = new THREE.Vector3(c.x, c.y - 0.10, c.z);
  const dl = Math.hypot(cfg.dir[0], cfg.dir[1]);
  const dx = cfg.dir[0] / dl, dz = cfg.dir[1] / dl;
  const r = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) / 2;
  const tV = Math.tan(THREE.MathUtils.degToRad(fov / 2));
  const dh = Math.max(r / (tV * Math.min(camera.aspect || 1.6, 1.6) * 0.85), 1.6);
  const mb = config.modeBounds || { x1: 0.3, x2: PLAN.W - 0.3, z1: 0.3, z2: PLAN.D - 0.3 };
  const px = THREE.MathUtils.clamp(c.x + dx * dh, mb.x1, mb.x2);          // 保持在目标房间内（不被墙遮挡）
  const pz = THREE.MathUtils.clamp(c.z + dz * dh, mb.z1, mb.z2);
  const yMax = roofOn ? 2.55 : 3.45;                                     // 天花可见时不穿顶
  const fits = (y) => {
    tc.position.set(px, y, pz);
    tc.lookAt(tgt);
    tc.updateMatrixWorld();
    for (const k of corners) {
      const v = k.clone().project(tc);
      if (v.z < -1 || v.z > 1) return false;                             // 相机身后
      if (Math.abs(v.x) > 0.98 || v.y > 0.95 || v.y < -0.62) return false;
    }
    return true;
  };
  let py = 1.7;
  while (py < yMax && !fits(py)) py += 0.08;
  flyTo([px, py, pz], [tgt.x, tgt.y, tgt.z], 1.3, null, fov);
}
document.querySelectorAll('#modeBar .mode').forEach(b => b.onclick = () => {
  setMode(b.dataset.m);
  // 手动切换模式：相机自动聚焦次卧（房内安全机位，不被墙/家具遮挡）
  if (viewMode === 'dollhouse' || viewMode === 'section') {
    setViewMode('dollhouse');
    focusModeView(b.dataset.m);
  }
});

/* 「这是我的选择」 */
let chosen = null;
$('chooseBtn').onclick = () => {
  chosen = currentMode;
  const card = $('chosenCard');
  $('chosenText').textContent = `这是你的选择 · ${modeNames[chosen]}`;
  card.classList.add('show');
  setTimeout(() => {
    card.classList.remove('show');
    setTimeout(updateChosenBadge, 400);
  }, 2600);
};
function updateChosenBadge() {
  const badge = $('chosenBadge');
  badge.textContent = `这是我的选择：${modeNames[chosen]}`;
  badge.classList.add('show');
  $('question').classList.remove('show'); // 徽标占据同一位置，让位
}

/* =====================================================================
 * 风格系统：四套预设一键换装（3D 材质 / UI 强调色 / 清单 / 海报同源）
 * ===================================================================== */
let currentStyle = null;

function swapTexture(mat, tex) {
  const old = mat.map;
  if (old) { tex.repeat.copy(old.repeat); tex.offset.copy(old.offset); old.dispose(); }
  mat.map = tex;
  mat.needsUpdate = true;
}

/* GLB 资产按材质名染色：GLB 贴图为近白细节纹理，固有色由 color 承载 */
const TINT_KEYS = ['oak', 'oakDark', 'walnut', 'lacquer', 'stone', 'metal', 'metalSoft',
  'linen', 'sage', 'bedding', 'blanket', 'plant', 'pot', 'paper'];
function tintGLBMaterials(fm) {
  scene.traverse(o => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      if (m && m.name && TINT_KEYS.includes(m.name) && fm[m.name] !== undefined) m.color.set(fm[m.name]);
    }
  });
}

function applyStyle(id) {
  const s = STYLES.find(q => q.id === id);
  if (!s || s === currentStyle) return;
  currentStyle = s;
  const sc = s.scene;
  PALETTE.bg = sc.bg;
  nightBg = sc.nightBg;
  swapTexture(MAT.floorWood, makeWoodFloor(sc.woodFloor));
  swapTexture(MAT.floorTile, makeTileFloor(sc.tileFloor));
  swapTexture(MAT.wall, makeWallTex(sc.wall));
  swapTexture(MAT.wallExt, makeWallTex(sc.wallExt));
  MAT.ceiling.color.set(sc.ceiling);
  MAT.roof.color.set(sc.roof);
  MAT.skirt.color.set(sc.skirt);
  MAT.sill.color.set(sc.sill);
  MAT.ground.color.set(sc.ground);
  MAT.doorPanel.color.set(sc.doorPanel);
  MAT.frame.color.set(sc.frame);
  const fm = sc.furniture;   // 程序化家具共享材质
  F.MAT.oak.color.set(fm.oak); F.MAT.oakDark.color.set(fm.oakDark);
  F.MAT.walnut.color.set(fm.walnut); F.MAT.lacquer.color.set(fm.lacquer);
  F.MAT.stone.color.set(fm.stone); F.MAT.metal.color.set(fm.metal);
  F.MAT.metalSoft.color.set(fm.metalSoft); F.MAT.sage.color.set(fm.sage);
  F.MAT.bedding.color.set(fm.bedding); F.MAT.blanket.color.set(fm.blanket);
  F.MAT.plant.color.set(fm.plant); F.MAT.pot.color.set(fm.pot);
  F.MAT.paper.color.set(fm.paper);
  swapTexture(F.MAT.linen, makeFabric(fm.linen));
  tintGLBMaterials(fm);
  if (styleTargets.rugLiving) swapTexture(styleTargets.rugLiving, makeRug(sc.rugLiving.base, sc.rugLiving.border));
  if (styleTargets.entryMat) styleTargets.entryMat.color.set(sc.entryMat);
  if (styleTargets.rugPrimary) styleTargets.rugPrimary.color.set(sc.rugPrimary);
  if (styleTargets.rugWork) styleTargets.rugWork.color.set(sc.rugWork);
  if (styleTargets.rugGuest) styleTargets.rugGuest.color.set(sc.rugGuest);
  if (styleTargets.rugFuture) styleTargets.rugFuture.color.set(sc.rugFuture);
  document.documentElement.style.setProperty('--sage', s.ui.accent);
  document.documentElement.style.setProperty('--bg', s.ui.bg);
  document.querySelectorAll('#styleBar .style').forEach(b => b.classList.toggle('on', b.dataset.s === id));
  $('styleDesc').textContent = s.desc;
  applyTime(timeOfDay);
  renderList();
}

document.querySelectorAll('#styleBar .style').forEach(b => b.onclick = () => applyStyle(b.dataset.s));

/* ---------- 软装清单 ---------- */
const fmtPrice = (n) => '¥' + n.toLocaleString('zh-CN');
function listTotalOf(L, modeId) {
  let sum = 0;
  for (const g of L.shared) for (const it of g.items) sum += it.price;
  if (L.modes && modeId && L.modes[modeId]) for (const it of L.modes[modeId].items) sum += it.price;
  return sum;
}
function renderList() {
  if (!currentStyle) return;
  const L = config.list;
  const mode = L.modes && currentMode ? L.modes[currentMode] : null;
  let html = `<p class="ls-note">材质基调 · ${currentStyle.materials.wood} / ${currentStyle.materials.fabric} / 点缀 ${currentStyle.materials.accent}</p>`;
  for (const g of L.shared) {
    html += `<h4>${g.room}</h4>` + g.items.map(it =>
      `<div class="ls-item"><span class="ls-name">${it.name}<em>${resolveSpec(it.spec, currentStyle)}</em></span><span class="ls-price">${fmtPrice(it.price)}</span></div>`).join('');
  }
  if (mode) html += `<h4>${mode.label}</h4>` + mode.items.map(it =>
    `<div class="ls-item"><span class="ls-name">${it.name}<em>${resolveSpec(it.spec, currentStyle)}</em></span><span class="ls-price">${fmtPrice(it.price)}</span></div>`).join('');
  $('listBody').innerHTML = html;
  $('listTotal').textContent = fmtPrice(listTotalOf(L, currentMode));
  $('listStyleName').textContent = currentStyle.name + (mode ? ` · ${modeNames[currentMode]}` : '');
}
$('listBtn').onclick = () => { renderList(); $('listPanel').classList.toggle('show'); };
$('listClose').onclick = () => $('listPanel').classList.remove('show');

/* ---------- 分享海报 ---------- */
function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
let posterURL = null;
function makePoster() {
  window.__render();                       // 同步重绘一帧，保证 WebGL canvas 可读
  const shot = renderer.domElement;
  const W = 1080, H = 1440;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const s = currentStyle;
  const L = config.list;
  const mode = L.modes && currentMode ? L.modes[currentMode] : null;
  const serif = '"Songti SC", "Noto Serif SC", "STSong", serif';
  ctx.fillStyle = s.ui.bg; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  // 顶部
  ctx.fillStyle = '#6B655A';
  ctx.font = '24px system-ui, sans-serif';
  ctx.fillText(config.kicker.split('·').join(' · '), W / 2, 78);
  ctx.fillStyle = '#3A352E';
  ctx.font = `600 52px ${serif}`;
  ctx.fillText(config.title, W / 2, 140);
  // 3D 截图（cover 裁切 + 圆角）
  const mg = 64, iy = 190, iw = W - mg * 2, ih = 780;
  const sa = shot.width / shot.height, ta = iw / ih;
  let sw, sh, sx, sy;
  if (sa > ta) { sh = shot.height; sw = sh * ta; sx = (shot.width - sw) / 2; sy = 0; }
  else { sw = shot.width; sh = sw / ta; sx = 0; sy = (shot.height - sh) / 2; }
  ctx.save();
  roundRectPath(ctx, mg, iy, iw, ih, 28); ctx.clip();
  ctx.drawImage(shot, sx, sy, sw, sh, mg, iy, iw, ih);
  ctx.restore();
  roundRectPath(ctx, mg, iy, iw, ih, 28);
  ctx.strokeStyle = 'rgba(58,53,46,0.22)'; ctx.lineWidth = 2; ctx.stroke();
  // 方案
  ctx.fillStyle = '#3A352E';
  ctx.font = `600 44px ${serif}`;
  ctx.fillText(mode ? `${s.name} × ${modeNames[currentMode]}` : s.name, W / 2, 1058);
  ctx.fillStyle = '#6B655A';
  ctx.font = `26px ${serif}`;
  ctx.fillText(s.desc, W / 2, 1108);
  // 清单摘要：模式新增项（无模式户型取客厅前三项）
  ctx.font = '24px system-ui, sans-serif';
  ctx.fillStyle = '#3A352E';
  const names = (mode ? mode.items : L.shared[0].items).slice(0, 3).map(it => it.name).join(' · ');
  ctx.fillText(names, W / 2, 1170);
  ctx.fillStyle = s.ui.accent;
  ctx.font = `600 34px ${serif}`;
  ctx.fillText(`全屋软装参考  ${fmtPrice(listTotalOf(L, currentMode))}`, W / 2, 1236);
  // 底部署名
  ctx.strokeStyle = 'rgba(58,53,46,0.25)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(W / 2 - 60, 1300); ctx.lineTo(W / 2 + 60, 1300); ctx.stroke();
  ctx.fillStyle = '#6B655A';
  ctx.font = '22px system-ui, sans-serif';
  ctx.fillText(`ATELIER ${config.area} · ${config.sub}`, W / 2, 1348);
  posterURL = c.toDataURL('image/png');
  $('posterImg').src = posterURL;
  $('posterModal').classList.add('show');
}
$('shareBtn').onclick = makePoster;
$('posterClose').onclick = () => $('posterModal').classList.remove('show');
$('posterDownload').onclick = () => {
  const a = document.createElement('a');
  a.href = posterURL;
  a.download = `${config.area}㎡-${currentStyle.name}${currentMode ? '-' + modeNames[currentMode] : ''}.png`;
  a.click();
};

/* =====================================================================
 * 开场：2D 户型图 → 3D 生长动画（6–8s，可跳过）
 * ===================================================================== */
let introT = -1;          // -1 = 未开始；[0,1] 进行中；1 = 完成
const INTRO_DUR = 7.2;
const introFrom = { pos: new THREE.Vector3(...config.introFrom.pos), tgt: new THREE.Vector3(...config.introFrom.tgt) };
function startIntro() {
  $('intro').classList.add('hide');
  $('skipBtn').classList.add('show');
  introT = 0;
  camera.position.copy(introFrom.pos);
  controls.target.copy(introFrom.tgt);
  controls.enabled = false;
}
function skipIntro() { if (introT >= 0 && introT < 1) { introT = 0.999; } }
$('enterBtn').onclick = startIntro;
$('skipBtn').onclick = skipIntro;

function applyIntro(t) {
  const ease = (x) => x < 0 ? 0 : x > 1 ? 1 : 1 - Math.pow(1 - x, 3);
  // 1) 平面图 → 地板（0.05–0.25 淡出，地板 0.15–0.3 淡入）
  planPlane.material.opacity = planOverlayOn ? 0.55 : 1 - ease((t - 0.05) / 0.2);
  planPlane.visible = planPlane.material.opacity > 0.01;
  const fl = ease((t - 0.12) / 0.18);
  floorsGroup.visible = fl > 0;
  floorsGroup.traverse(o => { if (o.material) { o.material.transparent = fl < 1; o.material.opacity = fl; } });
  // 2) 墙体生长（0.22–0.55，逐墙错拍）
  wallsGroup.children.forEach((m, i) => {
    const lt = ease((t - 0.22 - i * 0.018) / 0.3);
    m.scale.y = Math.max(lt, 0.001);
    m.visible = lt > 0;
  });
  // 3) 门窗框（0.5–0.68）
  const fr = ease((t - 0.5) / 0.18);
  framesGroup.visible = fr > 0;
  framesGroup.scale.setScalar(Math.max(fr, 0.001));
  doorPivots.forEach((p, i) => {
    const lt = ease((t - 0.55 - i * 0.02) / 0.15);
    p.scale.setScalar(Math.max(lt, 0.001));
    p.visible = lt > 0;
  });
  // 4) 柜体家具（0.62–0.9，pop）
  const fu = ease((t - 0.62) / 0.26);
  const pop = fu >= 1 ? 1 : (1 + 1.4 * Math.pow(fu - 1, 3) + 1.4 * Math.pow(fu - 1, 2) * 0 + fu * 0 + Math.sin(fu * Math.PI) * 0.08);
  furnitureGroup.visible = furnitureOn && fu > 0;
  shared.scale.setScalar(Math.max(pop, 0.001));
  if (currentMode) modeGroups[currentMode].visible = furnitureOn && fu > 0.6;
  // 5) 镜头：顶部俯视 → 3/4 Dollhouse（0.55–1.0）
  const cm = ease((t - 0.5) / 0.48);
  camera.position.lerpVectors(introFrom.pos, new THREE.Vector3(...VIEWS.dollhouse.pos), cm);
  controls.target.lerpVectors(introFrom.tgt, new THREE.Vector3(...VIEWS.dollhouse.tgt), cm);
  camera.lookAt(controls.target); // 开场期间 controls.update() 被跳过，朝向必须显式更新
  if (t >= 1) finishIntro();
}
function finishIntro() {
  introT = 1;
  $('intro').classList.add('hide');
  $('skipBtn').classList.remove('show');
  $('hud').classList.add('show');
  $('modeBar').classList.add('show');
  $('question').classList.add('show');
  controls.enabled = true;
  planPlane.visible = planOverlayOn;
  planPlane.material.opacity = planOverlayOn ? 0.55 : 1;
  floorsGroup.traverse(o => { if (o.material) { o.material.transparent = false; o.material.opacity = 1; } });
  wallsGroup.children.forEach(m => { m.scale.y = 1; m.visible = true; });
  framesGroup.visible = true; framesGroup.scale.setScalar(1);
  doorPivots.forEach(p => { p.scale.setScalar(1); p.visible = true; });
  shared.scale.setScalar(1);
  furnitureGroup.visible = furnitureOn;
}

/* =====================================================================
 * 动画主循环
 * ===================================================================== */
const clk = { last: performance.now(), getDelta() { const n = performance.now(); const d = (n - this.last) / 1000; this.last = n; return d; } };
let elapsed = 0;
window.__render = () => renderer.render(scene, getActiveCamera());

function animate() {
  const dt = Math.min(clk.getDelta(), 0.05);
  elapsed += dt;

  if (introT >= 0 && introT < 1) {
    introT = Math.min(introT + dt / INTRO_DUR, 1);
    applyIntro(introT);
  }
  // 相机补间
  if (camTween.active) {
    camTween.t += dt / camTween.dur;
    const k = camTween.t >= 1 ? 1 : 1 - Math.pow(1 - camTween.t, 3);
    getActiveCamera().position.lerpVectors(camTween.fromP, camTween.toP, k);
    controls.target.lerpVectors(camTween.fromT, camTween.toT, k);
    const nf = camTween.fromF + (camTween.toF - camTween.fromF) * k;      // FOV 随飞行平滑变焦
    if (Math.abs(camera.fov - nf) > 1e-3) { camera.fov = nf; camera.updateProjectionMatrix(); }
    if (camTween.t >= 1) camTween.active = false;
  }
  // 门扇平滑开合（绕铰链轴）
  for (const p of doorPivots) {
    const u = p.userData;
    let d = u.target - p.rotation.y;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    p.rotation.y += d * Math.min(dt * 6, 1);
  }
  // 模式切换 pop-in
  if (currentMode && modeGroups[currentMode].userData.popIn !== undefined) {
    const g = modeGroups[currentMode];
    g.userData.popIn = Math.min(g.userData.popIn + dt / 0.9, 1);   // 模式家具入场动画 0.9s（规格 800–1400ms）
    const k = g.userData.popIn;
    g.scale.setScalar(k >= 1 ? 1 : 0.6 + 0.4 * (1 - Math.pow(1 - k, 3)));
    if (k >= 1) delete g.userData.popIn;
  }
  // 悬停 / 选中高亮
  for (const r of ROOMS) {
    const h = hoverHl[r.id], dm = dimPlane[r.id];
    const hTarget = (r.id === hoveredRoom || r.id === selectedRoom) ? (r.id === selectedRoom ? 0.30 : 0.16) : 0;
    h.material.opacity += (hTarget - h.material.opacity) * Math.min(dt * 10, 1);
    const dTarget = (selectedRoom && r.id !== selectedRoom) ? 0.30 : 0;
    dm.material.opacity += (dTarget - dm.material.opacity) * Math.min(dt * 8, 1);
  }
  // 窗采光高亮淡出
  if (activePatch && patchFade > 0) {
    patchFade -= dt;
    activePatch.material.opacity = Math.min(patchFade / 1.6, 1) * 0.75;
  }
  updateInterior(dt);
  if (controls.enabled) controls.update();
  if (labelsOn) resolveLabelOverlap(); else labelSprites.forEach(s => s.visible = false);
  window.__render();
}

renderer.setAnimationLoop(animate);
function fitPerspForAspect() {
  const a = innerWidth / innerHeight;
  // 竖屏（手机）放宽视场，保证 Dollhouse 全屋入画
  camera.fov = a < 0.75 ? 64 : (a < 1.05 ? 48 : 40);
  camera.aspect = a;
  camera.updateProjectionMatrix();
}
addEventListener('resize', () => {
  fitPerspForAspect();
  fitTopCamera();
  renderer.setSize(innerWidth, innerHeight);
});
fitPerspForAspect();

/* =====================================================================
 * 自检钩子（shot.py）
 * ===================================================================== */
window.__scene = scene;
window.__renderer = renderer;
window.__camera = camera;
window.__views = {
  front: VIEWS.front, top: VIEWS.top, detail: VIEWS.detail, dollhouse: VIEWS.dollhouse,
};
const __finishNow = () => {
  if (introT !== 1) { introT = 0.999; applyIntro(1); }
  if (camTween.active) {                       // 相机飞行瞬时完成（供无头截图，不影响运行时行为）
    camTween.active = false;
    getActiveCamera().position.copy(camTween.toP);
    controls.target.copy(camTween.toT);
    if (Math.abs(camera.fov - camTween.toF) > 1e-3) { camera.fov = camTween.toF; camera.updateProjectionMatrix(); }
    controls.update();
  }
};
window.__finishNow = __finishNow;
window.__fov = () => +camera.fov.toFixed(2);   // FOV 读数（供无头校验）
window.__intro = (t) => { // 开场时间轴直跳（供截图）
  $('intro').classList.add('hide');
  introT = Math.min(Math.max(t, 0), 0.999);
  controls.enabled = false;
  applyIntro(introT);
};
window.__setState = (s) => {
  // 直接跳到完成态（首帧即成品）
  __finishNow();
  const [cmd, arg] = String(s).split(':');
  if (cmd === 'mode') setMode(arg, true);
  else if (cmd === 'time') { applyTime(Number(arg)); }
  else if (cmd === 'view') setViewMode(arg);
  else if (cmd === 'room') selectRoom(arg);
  else if (cmd === 'door') {
    const p = doorPivots.find(d => d.userData.id === arg);
    if (p) { p.userData.isOpen = true; p.rotation.y = p.userData.target = p.userData.open; }
  }
  else if (cmd === 'roof') { roofOn = arg === 'on'; $('tglRoof').checked = roofOn; ceilingGroup.visible = roofOn && viewMode !== 'section'; }
  else if (cmd === 'dims') { dimGroup.visible = true; }
};
// 漫游测试钩子：__roamMove(fwd, side, n) 确定性步进并返回位置；__roamState() 读状态
window.__roamMove = (fwd, side, n = 1) => {
  for (let i = 0; i < n; i++) moveInterior(fwd, side);
  camera.position.copy(interior.pos);
  return [interior.pos.x.toFixed(3), interior.pos.z.toFixed(3)];
};
window.__roamState = () => ({ x: +interior.pos.x.toFixed(3), z: +interior.pos.z.toFixed(3), yaw: +interior.yaw.toFixed(3), free: isFree(interior.pos.x, interior.pos.z) });
window.__isFree = (x, z) => isFree(x, z);
window.__popDone = () => { const g = modeGroups[currentMode]; if (g) { delete g.userData.popIn; g.scale.setScalar(1); } };
window.__blocker = (x, z) => { const h = nearestBlocker(x, z); return h ? h.b : null; };
window.__boxes = () => furnitureBoxes.map(b => ({ n: b.name, x1: +b.x1.toFixed(2), z1: +b.z1.toFixed(2), x2: +b.x2.toFixed(2), z2: +b.z2.toFixed(2) }));
// 相机直跳（供截图）：__jump('dollhouse')
window.__jump = (v, cam) => {
  __finishNow();
  const vv = VIEWS[v] || VIEWS.dollhouse;
  const c = cam === 'top' ? topCamera : camera;
  c.position.set(...vv.pos);
  controls.target.set(...vv.tgt);
  controls.update();
};
// 自由机位（供截图）
window.__cam = (px, py, pz, tx, ty, tz) => {
  __finishNow();
  camTween.active = false;
  if (viewMode === 'interior') {
    interior.pos.set(px, py, pz);
    const dx = tx - px, dy = ty - py, dz = tz - pz, l = Math.hypot(dx, dy, dz) || 1;
    interior.yaw = Math.atan2(-dx, -dz);
    interior.pitch = Math.asin(dy / l);
    return; // 漫游模式每帧由 updateInterior 驱动相机
  }
  camera.position.set(px, py, pz);
  controls.target.set(tx, ty, tz);
  controls.update();
};

/* ================= Blender GLB 高质量资产替换层 =================
 * 原位替换：保留原家具组（名称/位置/旋转/缩放/userData/接触阴影），仅把内部网格
 * 换成 Blender 低面数 GLB。碰撞盒/漫游/模式切换/交互逻辑不变。
 * 任何 GLB 加载失败 → 该件保留程序化资产兜底。 */
const GLB_DIR = './assets/glb/';
const GLB_MAP = {
  // 通用（按组名）
  sofa: 'sofa.glb', coffeeTable: 'coffeeTable.glb', mediaConsole: 'mediaConsole.glb',
  diningTable: 'diningTable.glb', diningChair: 'diningChair.glb',
  floorLamp: 'floorLamp.glb', livingFloorLamp: 'floorLamp.glb', readLampA: 'floorLamp.glb',
  tableLamp: 'tableLamp.glb', primaryLamp: 'tableLamp.glb', guestLamp: 'tableLamp.glb',
  deskLamp: 'deskLamp.glb', deskLampA: 'deskLamp.glb',
  pendantLamp: 'pendantLamp.glb', plant: 'plant.glb',
  bed: 'bed.glb', nightstand: 'nightstand.glb', wardrobe: 'wardrobe.glb',
  coatsCloset: 'coatsCloset.glb', desk: 'desk.glb', officeChair: 'officeChair.glb',
  bookshelf: 'bookshelf.glb', loungeChair: 'loungeChair.glb', laptop: 'laptop.glb',
  lowCabinet: 'lowCabinet.glb', toys: 'toys.glb',
  fridge: 'fridge.glb', washer: 'washer.glb',
  toilet: 'toilet.glb', vanity: 'vanity.glb', mirrorCabinet: 'mirrorCabinet.glb', shower: 'shower.glb',
  // 父组特定覆盖（同一名称在不同模式下对应不同 GLB）
  'mode_guest:bed': 'bedGuest.glb',
  'mode_future:bed': 'bedKid.glb',
  'mode_future:desk': 'deskKid.glb',
  'mode_guest:wardrobe': 'wardrobeSmall.glb',
};
const __glbStatus = { total: 0, swapped: [], kept: [], failed: [], done: false };
window.__glbStatus = __glbStatus;

async function swapInGLBAssets() {
  const loader = new GLTFLoader();
  const cache = new Map();
  const loadGLB = (file) => {
    if (!cache.has(file)) cache.set(file, new Promise((res, rej) =>
      loader.load(GLB_DIR + file, g => res(g.scene), undefined, rej)));
    return cache.get(file);
  };
  /* —— 质感增强：按 GLB 材质名注入程序化纹理与 PBR 参数（保留原色，仅叠加细节） —— */
  const canvasTex = (size, draw) => {
    const cv = document.createElement('canvas'); cv.width = cv.height = size;
    draw(cv.getContext('2d'), size);
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  };
  const detailTex = {
    // 木纹：近白底 + 波浪纹理 + 细噪点（与原色相乘后保留原配色）
    wood: canvasTex(256, (ctx, s) => {
      ctx.fillStyle = '#f5f3ef'; ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 46; i++) {
        const y = Math.random() * s;
        ctx.strokeStyle = `rgba(120,96,70,${0.05 + Math.random() * 0.10})`;
        ctx.lineWidth = 0.6 + Math.random() * 1.8;
        ctx.beginPath();
        for (let x = 0; x <= s; x += 8)
          ctx.lineTo(x, y + Math.sin(x * 0.05 + i) * 2.2 + Math.sin(x * 0.013 + i * 2.7) * 3.5);
        ctx.stroke();
      }
      for (let i = 0; i < 260; i++) {
        ctx.fillStyle = `rgba(90,70,50,${Math.random() * 0.08})`;
        ctx.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 3, 0.8);
      }
    }),
    // 织物：细十字织纹
    fabric: canvasTex(128, (ctx, s) => {
      ctx.fillStyle = '#f7f6f4'; ctx.fillRect(0, 0, s, s);
      for (let y = 0; y < s; y += 3)
        for (let x = 0; x < s; x += 3) {
          ctx.fillStyle = `rgba(80,80,90,${(((x + y) % 6 === 0) ? 0.10 : 0.04) + Math.random() * 0.04})`;
          ctx.fillRect(x, y, 1.6, 1.6);
        }
    }),
    // 石材/陶面：细颗粒斑点
    stone: canvasTex(256, (ctx, s) => {
      ctx.fillStyle = '#f6f5f3'; ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 900; i++) {
        ctx.fillStyle = `rgba(70,70,75,${Math.random() * 0.10})`;
        ctx.beginPath(); ctx.arc(Math.random() * s, Math.random() * s, Math.random() * 1.4 + 0.3, 0, 7); ctx.fill();
      }
    }),
  };
  const GLB_MAT_PRESETS = {
    oak:       { map: 'wood',   bump: 0.004,  roughness: 0.55 },
    oakDark:   { map: 'wood',   bump: 0.004,  roughness: 0.60 },
    walnut:    { map: 'wood',   bump: 0.004,  roughness: 0.62 },
    lacquer:   { roughness: 0.30 },
    stone:     { map: 'stone',  bump: 0.003,  roughness: 0.45 },
    ceramic:   { roughness: 0.18 },
    metal:     { roughness: 0.32, metalness: 0.85 },
    metalSoft: { roughness: 0.45, metalness: 0.60 },
    linen:     { map: 'fabric', bump: 0.003,  roughness: 0.95 },
    bedding:   { map: 'fabric', bump: 0.003,  roughness: 0.95 },
    blanket:   { map: 'fabric', bump: 0.0035, roughness: 1.00 },
    sage:      { map: 'fabric', bump: 0.003,  roughness: 0.95 },
    shade:     { map: 'fabric', bump: 0.002,  roughness: 0.90 },
    plant:     { map: 'fabric', bump: 0.004,  roughness: 0.85 },
    pot:       { map: 'stone',  bump: 0.002,  roughness: 0.70 },
    paper:     { roughness: 0.90 },
    toyRed:    { roughness: 0.50 }, toyBlue: { roughness: 0.50 },
  };
  const upgradedMats = new Map();   // 原材质 → 增强材质（同名共享，夜景灯罩克隆逻辑不受影响）
  const upgradeGLBMaterial = (m) => {
    if (!m) return m;
    if (upgradedMats.has(m.uuid)) return upgradedMats.get(m.uuid);
    const p = GLB_MAT_PRESETS[m.name];
    if (!p) { upgradedMats.set(m.uuid, m); return m; }
    const n = m.clone();
    if (p.map) {
      n.map = detailTex[p.map];
      if (p.bump) { n.bumpMap = n.map; n.bumpScale = p.bump; }
    }
    if (p.roughness !== undefined) n.roughness = p.roughness;
    if (p.metalness !== undefined) n.metalness = p.metalness;
    upgradedMats.set(m.uuid, n);
    return n;
  };
  const prepGLB = (src) => {
    src.traverse(o => {
      if (!o.isMesh) return;
      o.castShadow = true; o.receiveShadow = true;
      o.material = Array.isArray(o.material)
        ? o.material.map(upgradeGLBMaterial)
        : upgradeGLBMaterial(o.material);
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) if (m && m.transparent) {
        m.depthWrite = false; o.castShadow = false; o.renderOrder = 5;   // 玻璃：正确排序、不挡光
      }
    });
    return src;
  };
  const b1 = new THREE.Box3(), b2 = new THREE.Box3();
  const m3 = new THREE.Matrix3();
  const swapOne = (group, src) => {
    group.updateWorldMatrix(true, true);
    b1.setFromObject(group);                       // 程序化包围盒（世界系）
    if (b1.isEmpty()) return;
    for (const ch of [...group.children]) {        // 移除旧子网格（保留标记子节点）
      if (ch.userData && ch.userData.cs) continue;
      ch.traverse(o => { if (o.isMesh) o.geometry.dispose(); });   // 材质为共享 MAT，不销毁
      group.remove(ch);
    }
    const inst = src.clone(true);
    group.add(inst);
    group.updateWorldMatrix(true, true);
    b2.setFromObject(inst);
    if (b2.isEmpty()) return;
    // 自动适配：等比缩放（限幅），x/z 中心对齐；落地物底面对齐；
    // 悬挂物同时按高度适配，贴顶物（吊灯）顶面对齐，壁挂物（镜柜）中心对齐
    const hanging = b1.min.y > 1.0;
    const pw = b1.max.x - b1.min.x, pd = b1.max.z - b1.min.z;
    const gw = b2.max.x - b2.min.x, gd = b2.max.z - b2.min.z;
    let s = Math.min(pw / Math.max(gw, 1e-6), pd / Math.max(gd, 1e-6));
    if (hanging) s = Math.min(s, (b1.max.y - b1.min.y) / Math.max(b2.max.y - b2.min.y, 1e-6));
    s = Math.min(1.6, Math.max(0.4, s));
    inst.scale.multiplyScalar(s);
    group.updateWorldMatrix(true, true);
    b2.setFromObject(inst);
    m3.setFromMatrix4(group.matrixWorld).invert();
    const off = new THREE.Vector3(
      (b1.min.x + b1.max.x - b2.min.x - b2.max.x) / 2, 0,
      (b1.min.z + b1.max.z - b2.min.z - b2.max.z) / 2).applyMatrix3(m3);
    const dyW = !hanging
      ? b1.min.y - b2.min.y                                // 落地家具：底面对齐
      : b1.max.y > 2.3
        ? b1.max.y - b2.max.y                              // 吊灯：顶面贴天花
        : (b1.min.y + b1.max.y - b2.min.y - b2.max.y) / 2; // 壁挂：中心对齐
    off.y = new THREE.Vector3(0, dyW, 0).applyMatrix3(m3).y;
    inst.position.add(off);
  };

  // 收集替换目标：shared/模式组 的命名子组 + 厨房/卫生间容器内的命名子组
  const targets = [];
  const scan = (root, depth0) => {
    for (const ch of root.children) {
      if (ch.userData && ch.userData.cs) continue;
      if (!ch.isGroup || !ch.name) continue;               // 地毯/垫子/镜子等匿名网格保留程序化
      if (ch.name === 'kitchen' || ch.name === 'bath') { scan(ch, false); continue; }
      targets.push(ch);
    }
  };
  scan(shared, true);
  for (const k of Object.keys(modeGroups)) scan(modeGroups[k], true);

  const jobs = [];
  for (const t of targets) {
    const key = `${t.parent.name}:${t.name}`;
    const file = GLB_MAP[key] || GLB_MAP[t.name];
    if (!file) { __glbStatus.kept.push(key); continue; }
    __glbStatus.total++;
    jobs.push(loadGLB(file).then(src => {
      prepGLB(src);
      swapOne(t, src);
      __glbStatus.swapped.push(key);
    }).catch(() => __glbStatus.failed.push(key)));
  }

  // 厨房容器：匿名橱柜网格整体替换为 kitchen.glb（按 73㎡ 户型世界坐标建模，仅限 p73）
  const k = shared.getObjectByName('kitchen');
  if (k && config.id === 'p73') {
    __glbStatus.total++;
    jobs.push(loadGLB('kitchen.glb').then(src => {
      prepGLB(src);
      for (const ch of [...k.children]) {
        if (ch.userData && ch.userData.cs) continue;       // 接触阴影保留
        if (ch.isGroup && ch.name) continue;               // 冰箱/洗衣机已单独替换
        ch.traverse(o => { if (o.isMesh) o.geometry.dispose(); });
        k.remove(ch);
      }
      const inst = src.clone(true);
      inst.name = 'kitchenGLB';
      k.add(inst);
      __glbStatus.swapped.push('kitchen:cabinets');
    }).catch(() => __glbStatus.failed.push('kitchen:cabinets')));
  }

  await Promise.allSettled(jobs);
  // 灯罩自发光注册表刷新：GLB 灯罩沿用 lampShade / pendantShade 命名
  bulbMeshes.length = 0;
  scene.traverse(o => {
    if (o.isMesh && (o.name === 'lampShade' || o.name === 'pendantShade')) {
      o.material = o.material.clone();
      bulbMeshes.push(o);
    }
  });
  applyTime(timeOfDay);            // 重挂灯罩后同步当前时间段的自发光
  rebuildFurnitureBoxes();         // 碰撞盒按新资产重建
  __glbStatus.done = true;
  console.log('[GLB]', __glbStatus.swapped.length, 'swapped,',
    __glbStatus.kept.length, 'procedural,', __glbStatus.failed.length, 'failed');
}

/* =====================================================================
 * 家具自主布置：布置模式下拖拽移动 / R 键旋转 / 碰撞约束 / localStorage 持久化
 * ===================================================================== */
const LAYOUT_KEY = 'atelier.layout.' + config.id;
const draggables = [];          // { root, key, r, def: [x, z, ry] }
let arranging = false, dragItem = null, dragGrab = null, selectedItem = null;
let staticBoxes = [];           // 厨房/卫生间固定柜体 AABB（不可拖动，仅作碰撞）

function isVisibleUp(o) { while (o) { if (!o.visible) return false; o = o.parent; } return true; }

function collectDraggables() {
  draggables.length = 0;
  const roots = [];
  for (const ch of shared.children) {
    if (ch.userData.cs) continue;
    if (ch.isGroup && ch.name && ch.name !== 'kitchen' && ch.name !== 'bath') roots.push(ch);
  }
  for (const k of Object.keys(modeGroups))
    for (const ch of modeGroups[k].children) if (ch.isGroup && ch.name) roots.push(ch);
  const tmp = new THREE.Box3();
  const seen = {};
  for (const g of roots) {
    tmp.setFromObject(g);
    if (tmp.isEmpty()) continue;
    const w = tmp.max.x - tmp.min.x, d = tmp.max.z - tmp.min.z;
    const parentKey = g.parent.name || 'shared';
    const idx = seen[parentKey + g.name] = (seen[parentKey + g.name] || 0) + 1;
    draggables.push({
      root: g, key: `${parentKey}:${g.name}:${idx}`,
      r: Math.max(0.18, Math.min(w, d) / 2 + 0.03),
      def: [g.position.x, g.position.z, g.rotation.y],
    });
  }
  // 固定柜体碰撞盒：厨房 / 卫生间容器
  staticBoxes = [];
  for (const name of ['kitchen', 'bath']) {
    const k = shared.getObjectByName(name);
    if (!k) continue;
    tmp.setFromObject(k);
    if (!tmp.isEmpty()) staticBoxes.push({ x1: tmp.min.x, z1: tmp.min.z, x2: tmp.max.x, z2: tmp.max.z });
  }
}

function layoutSave() {
  const data = {};
  for (const d of draggables) {
    const g = d.root;
    const cur = [+g.position.x.toFixed(3), +g.position.z.toFixed(3), +g.rotation.y.toFixed(4)];
    if (cur[0] !== d.def[0] || cur[1] !== d.def[1] || cur[2] !== d.def[2]) data[d.key] = cur;
  }
  try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(data)); } catch (e) { /* 隐私模式等场景忽略 */ }
}
function layoutLoad() {
  let data = null;
  try { data = JSON.parse(localStorage.getItem(LAYOUT_KEY) || 'null'); } catch (e) { return; }
  if (!data) return;
  for (const d of draggables) {
    const saved = data[d.key];
    if (saved) { d.root.position.x = saved[0]; d.root.position.z = saved[1]; d.root.rotation.y = saved[2]; }
  }
}
function layoutReset() {
  for (const d of draggables) { d.root.position.x = d.def[0]; d.root.position.z = d.def[1]; d.root.rotation.y = d.def[2]; }
  try { localStorage.removeItem(LAYOUT_KEY); } catch (e) {}
  rebuildFurnitureBoxes();
}

/* 选中高亮圈（贴地，随选中家具包围盒缩放） */
const selRing = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  new THREE.MeshBasicMaterial({ color: 0x7E8D7A, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide }));
selRing.rotation.x = -Math.PI / 2;
selRing.position.y = 0.025;
selRing.renderOrder = 3;
selRing.visible = false;
scene.add(selRing);
const selBox = new THREE.Box3();
function selectItem(d) {
  selectedItem = d;
  if (!d) { selRing.visible = false; return; }
  selBox.setFromObject(d.root);
  const w = Math.max(selBox.max.x - selBox.min.x, 0.3), dd = Math.max(selBox.max.z - selBox.min.z, 0.3);
  selRing.scale.set(w * 1.25, dd * 1.25, 1);
  selRing.position.x = d.root.position.x;
  selRing.position.z = d.root.position.z;
  selRing.visible = true;
}

/* 拖拽落点合法性：户内边界 + 墙体 + 固定柜体 + 其他家具（圆近似） */
function canPlace(x, z, self) {
  if (x < 0.30 || x > PLAN.W - 0.30 || z < 0.30 || z > PLAN.D - 0.30) return false;
  for (const b of wallSegs) if (circleHits(x, z, b)) return false;
  for (const b of staticBoxes) if (circleHits(x, z, b)) return false;
  for (const d of draggables) {
    if (d === self || !isVisibleUp(d.root)) continue;
    const dx = x - d.root.position.x, dz = z - d.root.position.z;
    if (dx * dx + dz * dz < (self.r + d.r) * (self.r + d.r) * 0.64) return false;   // 允许轻微相切
  }
  return true;
}

const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const dragPoint = new THREE.Vector3();
function pickDraggable(ev) {
  mouse.set((ev.clientX / innerWidth) * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(mouse, getActiveCamera());
  const roots = draggables.filter(d => isVisibleUp(d.root)).map(d => d.root);
  const hits = ray.intersectObjects(roots, true);
  if (!hits.length) return null;
  let o = hits[0].object;
  while (o && !roots.includes(o)) o = o.parent;
  return o ? draggables.find(d => d.root === o) : null;
}

renderer.domElement.addEventListener('pointerdown', ev => {
  if (!arranging || viewMode === 'interior') return;
  const d = pickDraggable(ev);
  if (!d) { selectItem(null); return; }
  dragItem = d;
  selectItem(d);
  controls.enabled = false;
  ray.setFromCamera(mouse, getActiveCamera());
  if (ray.ray.intersectPlane(dragPlane, dragPoint)) {
    dragGrab = { x: dragPoint.x - d.root.position.x, z: dragPoint.z - d.root.position.z };
  } else dragGrab = { x: 0, z: 0 };
});
addEventListener('pointermove', ev => {
  if (!arranging || !dragItem || !dragGrab) return;
  mouse.set((ev.clientX / innerWidth) * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(mouse, getActiveCamera());
  if (!ray.ray.intersectPlane(dragPlane, dragPoint)) return;
  const nx = dragPoint.x - dragGrab.x, nz = dragPoint.z - dragGrab.z;
  if (canPlace(nx, nz, dragItem)) {
    dragItem.root.position.x = nx; dragItem.root.position.z = nz;
  } else if (canPlace(nx, dragItem.root.position.z, dragItem)) {
    dragItem.root.position.x = nx;                       // 逐轴滑动，贴墙不卡死
  } else if (canPlace(dragItem.root.position.x, nz, dragItem)) {
    dragItem.root.position.z = nz;
  }
  selectItem(dragItem);                                  // 高亮圈跟随
});
addEventListener('pointerup', () => {
  if (dragItem) {
    dragItem = null; dragGrab = null;
    controls.enabled = viewMode !== 'interior';
    rebuildFurnitureBoxes();                             // 漫游碰撞同步
    layoutSave();
  }
});
function rotateSelected() {
  if (!selectedItem) return;
  selectedItem.root.rotation.y += Math.PI / 4;
  rebuildFurnitureBoxes();
  layoutSave();
}
addEventListener('keydown', e => { if (arranging && e.code === 'KeyR') rotateSelected(); });

function setArranging(on) {
  arranging = on;
  document.body.classList.toggle('arranging', on);
  if (!on) selectItem(null);
  $('arrangeBtn').classList.toggle('on', on);
}
$('arrangeBtn').onclick = () => setArranging(!arranging);
$('rotBtn').onclick = rotateSelected;
$('arrangeReset').onclick = () => { layoutReset(); selectItem(selectedItem); };
$('arrangeDone').onclick = () => setArranging(false);

collectDraggables();
layoutLoad();
rebuildFurnitureBoxes();

/* 初始：开场覆盖层 + 下午光 + 默认模式 + 默认风格 + 户型文案 */
document.title = config.title;
document.querySelector('.title-block h1').textContent = config.title;
document.querySelector('.title-block p').textContent = config.sub;
document.querySelector('.intro-card .kicker').textContent = config.kicker;
document.querySelector('.intro-card h1').textContent = config.title;
document.querySelector('.intro-card .sub').textContent = config.sub;
document.querySelector('.intro-card .hint').textContent = config.hint;
if (config.question) $('question').textContent = config.question;
const planImgSrc = config.planImage || planCanvas.toDataURL();
document.querySelectorAll('.plan-wrap img, #fallback img').forEach(im => { im.src = planImgSrc; });
document.querySelectorAll('#planBar .plan').forEach(b => b.classList.toggle('on', b.dataset.p === config.id));
if (!MODES.length) document.body.classList.add('no-modes');

applyTime(0.45);
if (MODES.length) setMode(MODES[0].id, true);
applyStyle('morning');
camera.position.set(...config.introFrom.pos);
controls.target.set(...config.introFrom.tgt);
swapInGLBAssets().finally(() => {
  document.getElementById('loading').style.display = 'none';
});
