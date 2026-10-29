/* =====================================================================
 * catalog.js — 布置模式家具目录（F3）
 * 改动摘要：新增。只使用 furniture.js 已有构建器，不加载外链模型。
 * 按户型给 10–11 件；幽灵是材质克隆（不改共享 MAT 的透明度）。
 * ===================================================================== */

const META = {
  sofa:         { name: '三人沙发', build: (F) => F.buildSofa(2.25, 0.86) },
  loungeChair:  { name: '休闲单椅', build: (F) => F.buildLoungeChair() },
  coffeeTable:  { name: '茶几',     build: (F) => F.buildCoffeeTable(1.0, 0.5) },
  bookshelf:    { name: '书架',     build: (F) => F.buildBookshelf(0.8, 1.8, 0.32) },
  nightstand:   { name: '床头柜',   build: (F) => F.buildNightstand() },
  lowCabinet:   { name: '矮柜',     build: (F) => F.buildLowCabinet(1.2, 0.4, 0.8) },
  floorLamp:    { name: '落地灯',   build: (F) => F.buildFloorLamp() },
  plant:        { name: '绿植',     build: (F) => F.buildPlant(1) },
  artFrame:     { name: '挂画',     build: (F) => F.buildArtFrame(0.7, 0.9), floorY: 0.46 },
  diningChair:  { name: '餐椅',     build: (F) => F.buildDiningChair() },
  toys:         { name: '玩具组合', build: (F) => F.buildToys() },
};

/* 小户型拿掉玩具组合；两居 / 三居保留完整目录 */
const BY_PLAN = {
  p73: ['sofa', 'loungeChair', 'coffeeTable', 'bookshelf', 'nightstand', 'lowCabinet', 'floorLamp', 'plant', 'artFrame', 'diningChair', 'toys'],
  p45: ['sofa', 'loungeChair', 'coffeeTable', 'bookshelf', 'nightstand', 'lowCabinet', 'floorLamp', 'plant', 'artFrame', 'diningChair'],
  p96: ['sofa', 'loungeChair', 'coffeeTable', 'bookshelf', 'nightstand', 'lowCabinet', 'floorLamp', 'plant', 'artFrame', 'diningChair', 'toys'],
};

export function catalogEntries(planId) {
  const ids = BY_PLAN[planId] || BY_PLAN.p73;
  return ids.filter(id => META[id]).map(id => ({ type: id, name: META[id].name }));
}

export function isCatalogType(type) { return !!META[type]; }

/* 程序化家具。挂画的网格以中心为原点，抬到 floorY 让底边贴地。 */
export function createPiece(F, type) {
  const meta = META[type];
  if (!meta) return null;
  const g = meta.build(F);
  g.userData.catalogType = type;
  g.userData.floorY = meta.floorY || 0;
  g.userData.catalog = true;
  g.position.y = g.userData.floorY;
  return g;
}

/* 半透明幽灵：克隆材质，几何与原件共享（不要 dispose 几何） */
export function makeGhost(source) {
  const g = source.clone(true);
  g.traverse(o => {
    if (!o.isMesh) return;
    const list = Array.isArray(o.material) ? o.material : [o.material];
    const clones = list.map(m => {
      if (!m) return m;
      const c = m.clone();
      c.transparent = true;
      c.opacity = 0.42;
      c.depthWrite = false;
      return c;
    });
    o.material = Array.isArray(o.material) ? clones : clones[0];
    o.castShadow = false;
    o.receiveShadow = false;
  });
  g.name = 'catalogGhost';
  g.userData.floorY = source.userData.floorY || 0;
  return g;
}

export function disposeGhost(g) {
  if (!g) return;
  g.traverse(o => {
    if (!o.isMesh) return;
    const list = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of list) if (m && m.dispose) m.dispose();
  });
}

/* 落点合法时偏绿，不合法时压暗，方便对位 */
export function paintGhost(g, ok) {
  if (!g) return;
  g.traverse(o => {
    if (!o.isMesh) return;
    const list = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of list) if (m) m.opacity = ok ? 0.46 : 0.2;
  });
}
