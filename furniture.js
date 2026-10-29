/* furniture.js — 程序化家具（低多边形、真实尺度、轻微 bevel、贴地）
 * 约定：每件家具以 footprint 中心为原点，底面在 y=0，正面朝 +z（放置时用 rotation.y 调整） */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { makeFabric } from './textures.js';

/* ---------- 共享材质 ---------- */
export const MAT = {
  oak:      new THREE.MeshStandardMaterial({ color: 0xC7A77A, roughness: 0.62, metalness: 0.0 }),
  oakDark:  new THREE.MeshStandardMaterial({ color: 0xA9885C, roughness: 0.6 }),
  walnut:   new THREE.MeshStandardMaterial({ color: 0x695044, roughness: 0.55 }),
  lacquer:  new THREE.MeshStandardMaterial({ color: 0xF1EEE7, roughness: 0.42 }),
  stone:    new THREE.MeshStandardMaterial({ color: 0xCFCFC9, roughness: 0.28 }),
  metal:    new THREE.MeshStandardMaterial({ color: 0x343434, roughness: 0.45, metalness: 0.75 }),
  metalSoft:new THREE.MeshStandardMaterial({ color: 0x8A857C, roughness: 0.55, metalness: 0.35 }),
  linen:    new THREE.MeshStandardMaterial({ map: null, roughness: 0.95 }),
  sage:     new THREE.MeshStandardMaterial({ color: 0x7E8D7A, roughness: 0.92 }),
  bedding:  new THREE.MeshStandardMaterial({ color: 0xEDE8DD, roughness: 0.95 }),
  blanket:  new THREE.MeshStandardMaterial({ color: 0xB7B1A8, roughness: 0.95 }),
  ceramic:  new THREE.MeshStandardMaterial({ color: 0xF4F2ED, roughness: 0.25, side: THREE.DoubleSide }),
  ceramicIn:new THREE.MeshStandardMaterial({ color: 0x3A3733, roughness: 0.6 }),   // 器皿内壁/开口暗部
  coffee:   new THREE.MeshStandardMaterial({ color: 0x4A3526, roughness: 0.3 }),   // 杯内液面
  glass:    new THREE.MeshPhysicalMaterial({ color: 0xDDE8E8, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.28, depthWrite: false }),
  mirror:   new THREE.MeshStandardMaterial({ color: 0xC9D2D4, roughness: 0.08, metalness: 0.9 }),
  plant:    new THREE.MeshStandardMaterial({ color: 0x6F7F63, roughness: 0.9 }),
  pot:      new THREE.MeshStandardMaterial({ color: 0x9C938A, roughness: 0.8 }),
  paper:    new THREE.MeshStandardMaterial({ color: 0xEFEAE0, roughness: 0.9 }),
  screen:   new THREE.MeshStandardMaterial({ color: 0x2A2C2E, roughness: 0.35, metalness: 0.2 }),
  toyRed:   new THREE.MeshStandardMaterial({ color: 0xA9645A, roughness: 0.8 }),
  toyBlue:  new THREE.MeshStandardMaterial({ color: 0x6B7F8E, roughness: 0.8 }),
};
MAT.linen.map = makeFabric('#B7B1A8');

const RB = (w, h, d, r = 0.015) => new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2.01, h / 2.01, d / 2.01));
const BOX = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const CYL = (rt, rb, h, s = 20) => new THREE.CylinderGeometry(rt, rb, h, s);

function mesh(geo, mat, x = 0, y = 0, z = 0, shadow = true) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  if (shadow) { m.castShadow = true; m.receiveShadow = true; }
  return m;
}
function grp(name, ...children) {
  const g = new THREE.Group();
  g.name = name;
  children.forEach(c => g.add(c));
  return g;
}

/* ---------- 客厅 ---------- */
export function buildSofa(len = 2.25, dep = 0.86) {
  const g = grp('sofa');
  const baseH = 0.30, seatH = 0.14, backH = 0.42, armW = 0.20, armH = 0.26;
  g.add(mesh(RB(len, baseH, dep - 0.06, 0.03), MAT.linen, 0, baseH / 2 + 0.06, 0));
  // 三个坐垫 + 靠垫（坐垫 / 靠背 / 扶手层次）
  const cw = (len - armW * 2) / 3;
  for (let i = 0; i < 3; i++) {
    const x = -len / 2 + armW + cw / 2 + i * cw;
    g.add(mesh(RB(cw - 0.03, seatH, dep - 0.24, 0.045), MAT.linen, x, baseH + 0.06 + seatH / 2, 0.05));
    const back = mesh(RB(cw - 0.03, backH, 0.16, 0.05), MAT.linen, x, baseH + 0.06 + backH / 2 + 0.06, -dep / 2 + 0.16);
    back.rotation.x = -0.10;
    g.add(back);
  }
  // 扶手
  [-1, 1].forEach(s => g.add(mesh(RB(armW, armH + 0.1, dep - 0.04, 0.035), MAT.linen, s * (len / 2 - armW / 2), baseH + 0.06 + (armH + 0.1) / 2 - 0.08, 0)));
  // 木脚
  [-1, 1].forEach(sx => [-1, 1].forEach(sz => g.add(mesh(CYL(0.025, 0.02, 0.08), MAT.walnut, sx * (len / 2 - 0.1), 0.04, sz * (dep / 2 - 0.1)))));
  // 一个鼠尾草绿抱枕
  const pillow = mesh(RB(0.34, 0.30, 0.10, 0.05), MAT.sage, -len / 2 + armW + 0.3, baseH + seatH + 0.24, -dep / 2 + 0.26);
  pillow.rotation.z = 0.15; pillow.rotation.x = -0.15;
  g.add(pillow);
  return g;
}

/* 敞口小器皿：开口杯壁 + 杯底 + 内凹暗面（杜绝"倒扣"观感），mug 另带把手 */
function buildVessel(rTop, rBot, h, { handle = false, liquid = null } = {}) {
  const g = grp(handle ? 'mug' : 'vase');
  const wall = mesh(new THREE.CylinderGeometry(rTop, rBot, h, 20, 1, true), MAT.ceramic, 0, h / 2, 0);
  const bottom = mesh(new THREE.CircleGeometry(rBot, 20), MAT.ceramic, 0, 0.004, 0, false);
  bottom.rotation.x = -Math.PI / 2;
  const inner = mesh(new THREE.CircleGeometry(rTop - 0.003, 20), liquid || MAT.ceramicIn, 0, h - 0.014, 0, false);
  inner.rotation.x = -Math.PI / 2;
  g.add(wall, bottom, inner);
  if (handle) {
    const hd = mesh(new THREE.TorusGeometry(rTop * 0.62, 0.0045, 8, 20, Math.PI), MAT.ceramic, rTop + 0.001, h * 0.52, 0);
    hd.rotation.z = -Math.PI / 2;
    g.add(hd);
  }
  return g;
}

export function buildCoffeeTable(w = 1.0, d = 0.5) {
  const g = grp('coffeeTable');
  g.add(mesh(RB(w, 0.035, d, 0.01), MAT.oak, 0, 0.36, 0));
  [-1, 1].forEach(sx => [-1, 1].forEach(sz => g.add(mesh(CYL(0.02, 0.016, 0.35), MAT.walnut, sx * (w / 2 - 0.07), 0.175, sz * (d / 2 - 0.07)))));
  // 生活痕迹：两本书 + 一只敞口马克杯（带把手与咖啡液面）
  g.add(mesh(BOX(0.24, 0.025, 0.17), MAT.paper, -0.18, 0.39, 0.02));
  g.add(mesh(BOX(0.2, 0.02, 0.15), MAT.walnut, -0.17, 0.412, 0.03));
  const mug = buildVessel(0.032, 0.030, 0.085, { handle: true, liquid: MAT.coffee });
  mug.position.set(0.22, 0.378, -0.08);
  g.add(mug);
  return g;
}

export function buildMediaConsole(w = 1.6, d = 0.40) {
  const g = grp('mediaConsole');
  g.add(mesh(RB(w, 0.32, d, 0.012), MAT.walnut, 0, 0.24, 0));
  // 柜门分缝
  [-0.25, 0.25].forEach(f => g.add(mesh(BOX(0.006, 0.26, 0.006), MAT.metal, f * w, 0.24, d / 2 + 0.002, false)));
  [-1, 1].forEach(sx => [-1, 1].forEach(sz => g.add(mesh(CYL(0.018, 0.014, 0.08), MAT.metal, sx * (w / 2 - 0.08), 0.04, sz * (d / 2 - 0.08)))));
  // 电视机（薄面板）
  const tv = grp('tv',
    mesh(RB(1.15, 0.65, 0.035, 0.008), MAT.screen, 0, 0.75, 0),
    mesh(BOX(0.4, 0.03, 0.18), MAT.metal, 0, 0.415, 0));
  tv.position.set(0, 0, -0.05);
  g.add(tv);
  return g;
}

export function buildFloorLamp() {
  const g = grp('floorLamp');
  g.add(mesh(CYL(0.14, 0.16, 0.02), MAT.metal, 0, 0.01, 0));
  g.add(mesh(CYL(0.012, 0.012, 1.45), MAT.metal, 0, 0.74, 0));
  const shade = mesh(CYL(0.16, 0.19, 0.24, 24), MAT.paper, 0, 1.55, 0);
  shade.material = new THREE.MeshStandardMaterial({ color: 0xEFE7D8, roughness: 0.9, emissive: 0x000000 });
  shade.name = 'lampShade';
  g.add(shade);
  return g;
}

/* ---------- 餐厅 ---------- */
export function buildDiningTable(w = 1.4, d = 0.8) {
  const g = grp('diningTable');
  g.add(mesh(RB(w, 0.035, d, 0.008), MAT.oak, 0, 0.73, 0));
  [-1, 1].forEach(sx => [-1, 1].forEach(sz => g.add(mesh(BOX(0.05, 0.72, 0.05), MAT.walnut, sx * (w / 2 - 0.09), 0.36, sz * (d / 2 - 0.09)))));
  // 一只敞口小花器（可见瓶口，不再像倒扣的杯子）
  const vase = buildVessel(0.038, 0.048, 0.14);
  vase.position.set(0.15, 0.748, 0);
  g.add(vase);
  return g;
}

export function buildDiningChair() {
  const g = grp('diningChair');
  g.add(mesh(RB(0.42, 0.04, 0.40, 0.01), MAT.oak, 0, 0.45, 0));
  g.add(mesh(RB(0.42, 0.42, 0.035, 0.01), MAT.oak, 0, 0.68, -0.185));
  [-1, 1].forEach(sx => [-1, 1].forEach(sz => g.add(mesh(CYL(0.016, 0.013, 0.45), MAT.walnut, sx * 0.18, 0.225, sz * 0.17))));
  return g;
}

export function buildPendant() {
  const g = grp('pendant');
  g.add(mesh(CYL(0.005, 0.005, 0.9), MAT.metal, 0, -0.45, 0, false));
  const shade = mesh(CYL(0.10, 0.22, 0.18, 24), MAT.metal, 0, -0.95, 0);
  shade.name = 'pendantShade';
  g.add(shade);
  return g; // 原点挂在天花板
}

/* ---------- 卧室 ---------- */
export function buildBed(w = 1.6, l = 2.0, { kid = false } = {}) {
  const g = grp('bed');
  const frameH = kid ? 0.24 : 0.28, headH = kid ? 0.7 : 1.0;
  g.add(mesh(RB(w, 0.10, l, 0.02), MAT.walnut, 0, frameH, 0));                        // 床架
  [-1, 1].forEach(sx => [-1, 1].forEach(sz => g.add(mesh(BOX(0.06, frameH - 0.05, 0.06), MAT.walnut, sx * (w / 2 - 0.08), (frameH - 0.05) / 2, sz * (l / 2 - 0.08))))); // 床腿
  g.add(mesh(RB(w, headH, 0.07, 0.02), kid ? MAT.linen : MAT.walnut, 0, headH / 2 + 0.1, -l / 2 + 0.035)); // 床头
  g.add(mesh(RB(w - 0.08, 0.20, l - 0.10, 0.05), MAT.bedding, 0, frameH + 0.15, 0.01)); // 床垫+床单
  // 薄被：搭在床尾一半
  const blanket = mesh(RB(w - 0.06, 0.09, l * 0.52, 0.04), kid ? MAT.sage : MAT.blanket, 0, frameH + 0.22, l * 0.22);
  g.add(blanket);
  // 枕头
  const single = kid || w < 1.3;
  const pw = single ? Math.min(0.5, w - 0.4) : (w - 0.3) / 2;
  const n = single ? 1 : 2;
  for (let i = 0; i < n; i++) {
    const x = n === 1 ? 0 : (i === 0 ? -1 : 1) * (pw / 2 + 0.05);
    const p = mesh(RB(pw, 0.12, 0.32, 0.05), MAT.paper, x, frameH + 0.30, -l / 2 + 0.32);
    p.rotation.x = -0.12;
    g.add(p);
  }
  return g;
}

export function buildNightstand() {
  const g = grp('nightstand');
  g.add(mesh(RB(0.40, 0.42, 0.38, 0.01), MAT.walnut, 0, 0.25, 0));
  g.add(mesh(BOX(0.30, 0.008, 0.008), MAT.metal, 0, 0.30, 0.192, false)); // 拉手缝
  [-1, 1].forEach(sx => [-1, 1].forEach(sz => g.add(mesh(CYL(0.014, 0.011, 0.06), MAT.metal, sx * 0.16, 0.03, sz * 0.15))));
  // 一本书
  g.add(mesh(BOX(0.2, 0.022, 0.14), MAT.sage, 0.02, 0.475, 0.02));
  return g;
}

export function buildTableLamp() {
  const g = grp('tableLamp');
  g.add(mesh(CYL(0.07, 0.09, 0.02), MAT.metal, 0, 0.01, 0));
  g.add(mesh(CYL(0.010, 0.010, 0.26), MAT.metal, 0, 0.15, 0));
  const shade = mesh(CYL(0.09, 0.11, 0.13, 20), MAT.paper, 0, 0.33, 0);
  shade.name = 'lampShade';
  g.add(shade);
  return g;
}

export function buildWardrobe(w = 1.8, d = 0.55, h = 2.2, doors = 3) {
  const g = grp('wardrobe');
  g.add(mesh(RB(w, h - 0.1, d - 0.03, 0.008), MAT.lacquer, 0, (h - 0.1) / 2 + 0.06, 0));
  g.add(mesh(BOX(w, 0.06, d), MAT.oak, 0, 0.03, 0)); // 踢脚
  g.add(mesh(BOX(w, 0.04, d), MAT.oak, 0, h - 0.02, 0)); // 顶板
  // 柜门分缝
  for (let i = 1; i < doors; i++) {
    const x = -w / 2 + (w / doors) * i;
    g.add(mesh(BOX(0.006, h - 0.24, 0.008), MAT.metalSoft, x, h / 2, d / 2 - 0.008, false));
  }
  // 拉手
  for (let i = 0; i < doors; i++) {
    const x = -w / 2 + (w / doors) * (i + 0.5) + (i % 2 ? -0.05 : 0.05);
    g.add(mesh(BOX(0.012, 0.14, 0.012), MAT.metal, x, h * 0.55, d / 2 + 0.004, false));
  }
  return g;
}

/* ---------- 书房 / 次卧三态 ---------- */
export function buildDesk(w = 1.4, d = 0.6, h = 0.74) {
  const g = grp('desk');
  g.add(mesh(RB(w, 0.03, d, 0.008), MAT.oak, 0, h, 0));
  [-1, 1].forEach(sx => [-1, 1].forEach(sz => g.add(mesh(BOX(0.045, h, 0.045), MAT.metal, sx * (w / 2 - 0.06), h / 2, sz * (d / 2 - 0.06)))));
  return g;
}

export function buildOfficeChair() {
  const g = grp('officeChair');
  g.add(mesh(CYL(0.30, 0.32, 0.03, 5), MAT.metal, 0, 0.08, 0));       // 五星脚（简化）
  g.add(mesh(CYL(0.025, 0.025, 0.32), MAT.metal, 0, 0.26, 0));
  g.add(mesh(RB(0.46, 0.07, 0.44, 0.03), MAT.metalSoft, 0, 0.46, 0));
  const back = mesh(RB(0.44, 0.5, 0.06, 0.03), MAT.metalSoft, 0, 0.78, -0.22);
  back.rotation.x = -0.08;
  g.add(back);
  return g;
}

export function buildBookshelf(w = 0.55, h = 1.8, d = 0.32) {
  const g = grp('bookshelf');
  g.add(mesh(BOX(0.03, h, d), MAT.oak, -w / 2 + 0.015, h / 2, 0));
  g.add(mesh(BOX(0.03, h, d), MAT.oak, w / 2 - 0.015, h / 2, 0));
  g.add(mesh(BOX(w, 0.03, d), MAT.oak, 0, h - 0.015, 0));
  g.add(mesh(BOX(w, 0.03, d), MAT.oak, 0, 0.015, 0));
  const rand = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  const cols = [MAT.walnut, MAT.sage, MAT.paper, MAT.oakDark, MAT.metalSoft];
  for (let shelf = 0; shelf < 4; shelf++) {
    const y = 0.35 + shelf * 0.42;
    g.add(mesh(BOX(w - 0.05, 0.025, d - 0.02), MAT.oak, 0, y, 0));
    // 每层疏密不一的书
    let x = -w / 2 + 0.06;
    while (x < w / 2 - 0.09) {
      if (rand() < 0.18) { x += 0.05; continue; }              // 刻意留空
      const bw = 0.025 + rand() * 0.03, bh = 0.20 + rand() * 0.10;
      g.add(mesh(BOX(bw, bh, d - 0.10), cols[(rand() * cols.length) | 0], x + bw / 2, y + 0.013 + bh / 2, -0.01));
      x += bw + 0.004;
    }
  }
  return g;
}

export function buildLoungeChair() {
  const g = grp('loungeChair');
  g.add(mesh(RB(0.62, 0.16, 0.60, 0.05), MAT.linen, 0, 0.30, 0));
  const back = mesh(RB(0.62, 0.44, 0.14, 0.05), MAT.linen, 0, 0.60, -0.26);
  back.rotation.x = -0.16;
  g.add(back);
  [-1, 1].forEach(sx => [-1, 1].forEach(sz => {
    const leg = mesh(CYL(0.018, 0.014, 0.24), MAT.walnut, sx * 0.25, 0.12, sz * 0.24);
    leg.rotation.z = sx * 0.1; leg.rotation.x = -sz * 0.1;
    g.add(leg);
  }));
  // 搭一条薄毯
  const throw_ = mesh(RB(0.3, 0.03, 0.5, 0.015), MAT.sage, -0.18, 0.40, 0.02);
  throw_.rotation.y = 0.2;
  g.add(throw_);
  return g;
}

export function buildDeskLamp() {
  const g = grp('deskLamp');
  g.add(mesh(CYL(0.07, 0.08, 0.02), MAT.metal, 0, 0.01, 0));
  const arm1 = mesh(CYL(0.008, 0.008, 0.30), MAT.metal, 0.05, 0.16, 0);
  arm1.rotation.z = -0.35;
  const arm2 = mesh(CYL(0.008, 0.008, 0.26), MAT.metal, 0.16, 0.38, 0);
  arm2.rotation.z = 0.5;
  const head = mesh(CYL(0.045, 0.06, 0.09, 16), MAT.metal, 0.24, 0.47, 0);
  head.rotation.z = 2.2;
  head.name = 'lampShade';
  g.add(arm1, arm2, head);
  return g;
}

export function buildLaptop() {
  const g = grp('laptop');
  g.add(mesh(BOX(0.32, 0.015, 0.22), MAT.metalSoft, 0, 0.008, 0));
  const scr = mesh(BOX(0.32, 0.21, 0.01), MAT.screen, 0, 0.11, -0.105);
  scr.rotation.x = -0.28;
  g.add(scr);
  return g;
}

export function buildKidBed() { return buildBed(0.9, 1.8, { kid: true }); }

export function buildLowCabinet(w = 1.2, d = 0.4, h = 0.8) {
  const g = grp('lowCabinet');
  g.add(mesh(RB(w, h, d, 0.01), MAT.lacquer, 0, h / 2, 0));
  // 四个开放格 + 布盒
  const cols = [MAT.sage, MAT.linen, MAT.oakDark, MAT.paper];
  for (let i = 0; i < 4; i++) {
    const x = -w / 2 + w / 8 + (w / 4) * i;
    g.add(mesh(BOX(0.006, h - 0.1, d - 0.06), MAT.metalSoft, -w / 2 + (w / 4) * i, h / 2, 0, false));
    if (i !== 2) g.add(mesh(RB(w / 4 - 0.08, h - 0.2, d - 0.1, 0.02), cols[i], x, h / 2 - 0.02, 0.01));
  }
  // 顶上两本绘本
  g.add(mesh(BOX(0.22, 0.015, 0.26), MAT.toyBlue, -0.2, h + 0.008, 0));
  g.add(mesh(BOX(0.18, 0.015, 0.22), MAT.sage, -0.19, h + 0.024, 0.01));
  return g;
}

export function buildToys() {
  const g = grp('toys');
  const a = mesh(BOX(0.09, 0.09, 0.09), MAT.toyRed, 0, 0.045, 0);
  const b = mesh(BOX(0.07, 0.07, 0.07), MAT.toyBlue, 0.12, 0.035, 0.06);
  const c = mesh(CYL(0.05, 0.05, 0.09, 16), MAT.oak, -0.1, 0.045, 0.1);
  b.rotation.y = 0.5; c.rotation.z = Math.PI / 2;
  g.add(a, b, c);
  return g;
}

/* ---------- 厨卫 ---------- */
export function buildFridge() {
  const g = grp('fridge');
  g.add(mesh(RB(0.60, 1.85, 0.65, 0.015), MAT.lacquer, 0, 0.925, 0));
  g.add(mesh(BOX(0.006, 1.7, 0.01), MAT.metalSoft, 0, 0.95, 0.326, false));       // 门缝
  g.add(mesh(BOX(0.02, 0.5, 0.02), MAT.metal, 0.22, 1.15, 0.335, false));          // 拉手
  return g;
}

export function buildWasher() {
  const g = grp('washer');
  g.add(mesh(RB(0.58, 0.84, 0.56, 0.015), MAT.lacquer, 0, 0.42, 0));
  const door = mesh(new THREE.TorusGeometry(0.17, 0.022, 10, 28), MAT.metal, 0, 0.48, 0.285);
  g.add(door);
  g.add(mesh(new THREE.CircleGeometry(0.165, 28), MAT.screen, 0, 0.48, 0.283));
  g.add(mesh(BOX(0.5, 0.1, 0.02), MAT.metalSoft, 0, 0.76, 0.285, false));          // 控制条
  return g;
}

export function buildToilet() {
  const g = grp('toilet');
  g.add(mesh(RB(0.38, 0.42, 0.16, 0.02), MAT.ceramic, 0, 0.55, -0.22));            // 水箱
  const bowl = mesh(CYL(0.20, 0.15, 0.38, 20), MAT.ceramic, 0, 0.20, 0.05);
  bowl.scale.z = 1.35;
  g.add(bowl);
  const seat = mesh(CYL(0.21, 0.21, 0.05, 20), MAT.ceramic, 0, 0.42, 0.05);
  seat.scale.z = 1.35;
  g.add(seat);
  return g;
}

export function buildVanity() {
  const g = grp('vanity');
  g.add(mesh(RB(0.50, 0.55, 0.42, 0.012), MAT.walnut, 0, 0.55, 0));
  g.add(mesh(RB(0.54, 0.04, 0.46, 0.008), MAT.stone, 0, 0.845, 0));
  const basin = mesh(CYL(0.15, 0.12, 0.09, 22), MAT.ceramic, 0, 0.90, 0.02);
  g.add(basin);
  g.add(mesh(CYL(0.012, 0.012, 0.18), MAT.metal, 0, 0.95, -0.14));
  const spout = mesh(CYL(0.010, 0.010, 0.12), MAT.metal, 0, 1.03, -0.09);
  spout.rotation.x = Math.PI / 2;
  g.add(spout);
  return g;
}

export function buildMirrorCabinet(w = 0.5) {
  const g = grp('mirrorCabinet');
  g.add(mesh(RB(w, 0.7, 0.14, 0.01), MAT.lacquer, 0, 0, 0));
  g.add(mesh(BOX(w - 0.04, 0.62, 0.005), MAT.mirror, 0, 0, 0.072, false));
  return g;
}

export function buildShower(w = 0.95, d = 0.95) {
  const g = grp('shower');
  g.add(mesh(RB(w, 0.06, d, 0.01), MAT.ceramic, 0, 0.03, 0));                      // 淋浴底盘
  // 玻璃隔断：东面全幅 + 南面西半幅固定，南面东端留出入口（朝向卫生间内部）
  const fw = w * 0.55;
  const g1 = mesh(BOX(fw, 1.9, 0.008), MAT.glass, -w / 2 + fw / 2, 1.0, d / 2, false);
  const g2 = mesh(BOX(0.008, 1.9, d), MAT.glass, w / 2, 1.0, 0, false);
  g1.renderOrder = 5; g2.renderOrder = 5;
  g.add(g1, g2);
  // 型材（含固定玻璃端柱）
  [ [-w/2, d/2], [-w/2 + fw, d/2], [w/2, d/2], [w/2, -d/2] ].forEach(([x, z]) =>
    g.add(mesh(BOX(0.025, 1.95, 0.025), MAT.metal, x, 1.0, z, false)));
  // 花洒
  g.add(mesh(CYL(0.010, 0.010, 0.5), MAT.metal, -w / 2 + 0.06, 1.75, -d / 2 + 0.06, false));
  const head = mesh(CYL(0.09, 0.09, 0.015, 20), MAT.metal, -w / 2 + 0.18, 2.0, -d / 2 + 0.06, false);
  head.rotation.z = Math.PI / 2.3;
  g.add(head);
  return g;
}

/* ---------- 装饰 ---------- */
export function buildPlant(scale = 1) {
  const g = grp('plant');
  g.add(mesh(CYL(0.14 * scale, 0.11 * scale, 0.26 * scale, 18), MAT.pot, 0, 0.13 * scale, 0));
  g.add(mesh(CYL(0.015, 0.02, 0.5 * scale), MAT.walnut, 0, 0.5 * scale, 0));
  const rand = (() => { let s = 13; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  for (let i = 0; i < 7; i++) {
    const leaf = mesh(new THREE.SphereGeometry(0.16 * scale, 8, 6), MAT.plant,
      (rand() - 0.5) * 0.3 * scale, (0.65 + rand() * 0.45) * scale, (rand() - 0.5) * 0.3 * scale);
    leaf.scale.set(1, 0.6 + rand() * 0.5, 1);
    g.add(leaf);
  }
  return g;
}

export function buildArtFrame(w = 0.7, h = 0.9, tone = 0x7E8D7A) {
  const g = grp('artFrame');
  g.add(mesh(BOX(w, h, 0.03), MAT.walnut, 0, 0, 0, false));
  g.add(mesh(BOX(w - 0.08, h - 0.08, 0.032), MAT.paper, 0, 0, 0, false));
  // 抽象山水色块
  g.add(mesh(BOX(w * 0.5, h * 0.28, 0.034), new THREE.MeshStandardMaterial({ color: tone, roughness: 0.9 }), -w * 0.12, -h * 0.12, 0, false));
  g.add(mesh(new THREE.CircleGeometry(w * 0.12, 24), new THREE.MeshStandardMaterial({ color: 0xC7A77A, roughness: 0.9 }), w * 0.18, h * 0.18, 0.018, false));
  return g;
}

export function buildCoatsCloset(w = 0.9, d = 0.6, h = 2.2) {
  const g = buildWardrobe(w, d, h, 2);
  g.name = 'coatsCloset';
  return g;
}
