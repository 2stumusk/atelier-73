/* =====================================================================
 * plans/plan45.js — 45㎡ 一室一厅（独居户型，无次卧三态）
 * 坐标系与 plan73 相同：1 unit = 1 m，x 向东 0→7.5，z 向南 0→6。
 * ===================================================================== */

const PLAN = { W: 7.5, D: 6, H: 2.8, EXT: 0.20, INT: 0.15, DOOR_H: 2.1, SILL: 0.9, WIN_TOP: 2.4 };

const WALLS = [
  { id: 'N', axis: 'x', c: 0.10, from: 0, to: 7.5, t: 0.20, ext: true,
    openings: [
      { a: 2.90, b: 4.10, sill: 0.9, top: 2.4, kind: 'window', name: '厨房窗' },
      { a: 5.20, b: 7.00, sill: 0.9, top: 2.4, kind: 'window', name: '卧室窗' },
    ] },
  { id: 'S', axis: 'x', c: 5.90, from: 0, to: 7.5, t: 0.20, ext: true,
    openings: [
      { a: 0.90, b: 3.10, sill: 0.9, top: 2.4, kind: 'window', name: '客厅窗' },
      { a: 5.60, b: 6.55, sill: 0, top: 2.1, kind: 'door', name: '入户门' },
    ] },
  { id: 'W', axis: 'z', c: 0.10, from: 0, to: 6, t: 0.20, ext: true,
    openings: [
      { a: 3.40, b: 5.00, sill: 0.9, top: 2.4, kind: 'window', name: '客厅西窗' },
    ] },
  { id: 'E', axis: 'z', c: 7.40, from: 0, to: 6, t: 0.20, ext: true,
    openings: [
      { a: 0.80, b: 2.20, sill: 0.9, top: 2.4, kind: 'window', name: '卧室东窗' },
    ] },
  // 卫生间（西北角）
  { id: 'P1', axis: 'z', c: 2.475, from: 0.10, to: 2.275, t: 0.15, openings: [] },
  { id: 'P2', axis: 'x', c: 2.275, from: 0.10, to: 2.475, t: 0.15,
    openings: [ { a: 0.90, b: 1.78, sill: 0, top: 2.1, kind: 'door', name: '卫生间门' } ] },
  // 卧室（东侧）
  { id: 'P3', axis: 'z', c: 4.675, from: 0.10, to: 3.275, t: 0.15,
    openings: [ { a: 2.30, b: 3.18, sill: 0, top: 2.1, kind: 'door', name: '卧室门' } ] },
  { id: 'P4', axis: 'x', c: 3.275, from: 4.675, to: 7.40, t: 0.15, openings: [] },
];

const DOORS = [
  { id: 'entry',   name: '入户门',   w: 0.95, h: 2.1, pivot: [6.55, 5.90],  closed: [-1, 0], open: [0, -1], ext: true },
  { id: 'bath',    name: '卫生间门', w: 0.88, h: 2.1, pivot: [1.78, 2.275], closed: [-1, 0], open: [0, -1] },
  { id: 'primary', name: '卧室门',   w: 0.88, h: 2.1, pivot: [4.675, 3.18], closed: [0, -1], open: [1, 0] },
];

const ROOMS = [
  { id: 'bath', name: '卫生间', floor: 'tile',
    poly: [[0.2, 0.2], [2.4, 0.2], [2.4, 2.2], [0.2, 2.2]],
    label: [1.3, 1.2], size: '2.20 × 2.00 m',
    desc: '淋浴、马桶、洗手台三分，小空间不将就。',
    furn: '淋浴区 · 马桶 · 洗手台 · 镜柜' },
  { id: 'kitchen', name: '厨房', floor: 'tile',
    poly: [[2.55, 0.2], [4.6, 0.2], [4.6, 2.3], [2.55, 2.3]],
    label: [3.55, 1.2], size: '开放式 · 一字橱柜',
    desc: '一字操作台对着餐厅，做饭时也能看见客厅。',
    furn: '一字橱柜 · 水槽 · 炉灶 · 洗烘一体机' },
  { id: 'primary', name: '卧室', floor: 'wood',
    poly: [[4.75, 0.2], [7.3, 0.2], [7.3, 3.2], [4.75, 3.2]],
    label: [6.0, 1.7], size: '2.55 × 3.00 m',
    desc: '双人床靠东墙，北窗采光，南墙整面衣柜。',
    furn: '双人床 · 床头柜 · 衣柜' },
  { id: 'living', name: '客厅 · 餐厅', floor: 'wood',
    poly: [[0.2, 2.3], [4.6, 2.3], [4.6, 5.8], [0.2, 5.8]],
    label: [2.3, 4.3], size: '面宽 4.4 m · 双向采光',
    desc: '沙发、茶几、小餐桌都在这间通透的厅里。',
    furn: '双人沙发 · 茶几 · 媒体柜 · 小餐桌' },
  { id: 'hall', name: '玄关', floor: 'wood',
    poly: [[4.75, 3.35], [7.3, 3.35], [7.3, 5.8], [4.75, 5.8]],
    label: [6.0, 4.6], size: '入户收纳',
    desc: '进门有鞋柜、穿衣镜和放冰箱的角落。',
    furn: '鞋柜 · 穿衣镜 · 冰箱' },
];

const LIST = {
  shared: [
    { room: '客厅', items: [
      { name: '双人布艺沙发', spec: 'fabric', price: 3200 },
      { name: '茶几', spec: 'wood', price: 980 },
      { name: '媒体柜', spec: 'wood', price: 1900 },
      { name: '落地灯', spec: '哑黑金属 + 布艺灯罩', price: 680 },
      { name: '客厅地毯 160×220', spec: 'accent', price: 599 },
      { name: '绿植', spec: '琴叶榕', price: 160 },
    ] },
    { room: '餐厅角', items: [
      { name: '小方桌 80×80', spec: 'wood', price: 899 },
      { name: '餐椅 ×2', spec: 'wood', price: 800 },
      { name: '小吊灯', spec: '哑黑金属', price: 420 },
    ] },
    { room: '厨房', items: [
      { name: '一字橱柜（定制）', spec: '烤漆门板 + 石英石台面', price: 9800 },
      { name: '单门冰箱', spec: '白色', price: 2100 },
      { name: '洗烘一体机', spec: '白色', price: 3600 },
    ] },
    { room: '卫生间', items: [
      { name: '浴室柜 + 镜柜', spec: 'wood', price: 2200 },
      { name: '淋浴玻璃隔断', spec: '超白玻 + 细框', price: 1900 },
      { name: '马桶', spec: '哑光白', price: 1500 },
    ] },
    { room: '卧室', items: [
      { name: '双人床 1.5m', spec: 'wood', price: 2900 },
      { name: '床头柜', spec: 'wood', price: 580 },
      { name: '双门衣柜', spec: '烤漆 + 木色踢脚', price: 3200 },
      { name: '床头台灯', spec: '布艺灯罩', price: 320 },
    ] },
    { room: '玄关', items: [
      { name: '鞋柜', spec: '烤漆', price: 780 },
      { name: '穿衣镜', spec: '细框全身镜', price: 420 },
    ] },
  ],
  modes: null,
};

export default {
  id: 'p45',
  area: '45', layout: '1B1B · 一室一厅',
  kicker: '1B1B · 建筑面积 45 ㎡',
  title: '45㎡，一个人的家怎么住？',
  sub: '一室一厅 · 独居也讲究',
  question: null,
  hint: '平面线条会生长成墙，墙里会亮起灯——大约 7 秒',
  PLAN, WALLS, DOORS, ROOMS, MODES: [],
  list: LIST,
  planImage: null,                       // 由数据程序化绘制
  views: {
    dollhouse: { pos: [11.0, 8.4, 13.8], tgt: [3.5, 0.4, 2.7] },
    top:       { pos: [3.75, 20, 3], tgt: [3.75, 0, 3] },
    front:     { pos: [3.75, 5.2, 13.5], tgt: [3.75, 1, 3] },
    detail:    { pos: [4.8, 2.2, 5.2], tgt: [6.3, 0.5, 1.9] },
  },
  cameras: {
    dollhouseCamera: { pos: [11.0, 8.4, 13.8], tgt: [3.5, 0.4, 2.7] },
    sectionCamera:   { pos: [11.4, 6.6, 12.6], tgt: [3.5, 0.9, 2.7] },
    interiorCamera:  { pos: [5.6, 1.6, 5.2], yaw: 0.785, pitch: 0 },
    roamStartCamera: { pos: [5.6, 1.6, 5.2], yaw: 0.785, pitch: 0 },
  },
  introFrom: { pos: [3.75, 22, 3.01], tgt: [3.75, 0, 3] },
  dimLabels: [
    ['卧室 2.55×3.00', 6.0, 1.7],
    ['卫生间 2.20×2.00', 1.3, 1.2],
  ],
  modeBounds: null,
  lamps: [
    ['pendant', 3.5, 1.8, 2.95, 0xFFD9A8, 12, 6],
    ['livingFloor', 0.5, 1.5, 5.3, 0xFFD9A8, 10, 6],
    ['primaryBed', 4.95, 0.95, 2.95, 0xFFD9A8, 7, 5],
    ['bath', 1.3, 2.3, 1.2, 0xFFF0DD, 8, 5],
    ['kitchen', 3.5, 2.3, 1.2, 0xFFF0DD, 8, 6],
    ['hall', 6.0, 2.4, 4.6, 0xFFE4C0, 6, 5],
  ],

  furnish({ THREE, F, put, tagUsage, makeRug, shared, styleTargets }) {
    /* --- 卫生间（西北角） --- */
    {
      const g = new THREE.Group(); g.name = 'bath';
      const shw = put(F.buildShower(0.85, 0.85), 0.63, 0.63);
      tagUsage(shw, 1.2, 1.4); g.add(shw);
      const wc = F.buildToilet(); wc.position.set(1.80, 0, 0.60);
      tagUsage(wc, 1.80, 1.4); g.add(wc);
      const van = F.buildVanity(); van.rotation.y = Math.PI;          // 靠南墙，正面朝房内
      van.position.set(1.15, 0, 1.92); tagUsage(van, 1.15, 1.3); g.add(van);
      const mir = F.buildMirrorCabinet(0.5); mir.rotation.y = Math.PI;
      mir.position.set(1.15, 1.55, 2.13); g.add(mir);
      shared.add(g);
    }

    /* --- 开放式厨房：一字橱柜沿北墙 --- */
    {
      const g = new THREE.Group(); g.name = 'kitchen';
      const cabMat = F.MAT.lacquer, topMat = F.MAT.stone;
      const H = 0.88, D = 0.58;
      const x0 = 3.30, x1 = 4.50, cz = 0.49;
      const body = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, H - 0.12, D), cabMat);
      body.position.set((x0 + x1) / 2, (H - 0.12) / 2 + 0.1, cz);
      body.castShadow = body.receiveShadow = true; g.add(body);
      const top = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0 + 0.02, 0.03, D + 0.02), topMat);
      top.position.set((x0 + x1) / 2, H + 0.015, cz); top.castShadow = top.receiveShadow = true; g.add(top);
      for (let i = 1; i <= 2; i++) {
        const seam = new THREE.Mesh(new THREE.BoxGeometry(0.005, H - 0.2, 0.01), F.MAT.metalSoft);
        seam.position.set(x0 + (x1 - x0) / 3 * i, H / 2, cz + D / 2 * 0.99); g.add(seam);
      }
      // 洗烘一体机（台下西端）
      const wsh = put(F.buildWasher(), 2.90, 0.49);
      tagUsage(wsh, 2.90, 1.2); g.add(wsh);
      // 水槽 + 龙头
      const sink = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.16, 0.38), F.MAT.metalSoft);
      sink.position.set(3.60, 0.90, 0.47); g.add(sink);
      const basin = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.15, 0.32), F.MAT.metal);
      basin.position.set(3.60, 0.905, 0.47); g.add(basin);
      const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.26), F.MAT.metal);
      tap.position.set(3.60, 1.0, 0.28); g.add(tap);
      const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.16), F.MAT.metal);
      spout.rotation.x = Math.PI / 2; spout.position.set(3.60, 1.12, 0.36); g.add(spout);
      // 双眼炉灶
      const hob = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.015, 0.40), F.MAT.screen);
      hob.position.set(4.20, 0.915, 0.49); g.add(hob);
      [[-0.13, 0], [0.13, 0]].forEach(([dx, dz]) => {
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.008, 20), F.MAT.metal);
        b.position.set(4.20 + dx, 0.925, 0.49 + dz); g.add(b);
      });
      const hood = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.36), F.MAT.lacquer);
      hood.position.set(4.20, 1.72, 0.42); hood.castShadow = true; g.add(hood);
      const duct = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.9, 0.2), F.MAT.lacquer);
      duct.position.set(4.20, 2.35, 0.32); g.add(duct);
      shared.add(g);
    }

    /* --- 餐厅角（厨房与客厅之间） --- */
    {
      const dTable = put(F.buildDiningTable(0.8, 0.8), 3.5, 2.95);
      shared.add(dTable);
      const chairAt = (x, z) => {
        const c = put(F.buildDiningChair(), x, z);
        c.rotation.y = Math.atan2(3.5 - x, 2.95 - z);
        tagUsage(c, 3.5, 2.95);
        shared.add(c);
      };
      chairAt(3.15, 3.65); chairAt(3.85, 3.65);      // 南侧两把，面朝北（向桌）
      const pend = F.buildPendant(); pend.position.set(3.5, 2.8, 2.95); pend.name = 'pendantLamp';
      shared.add(pend);
    }

    /* --- 客厅 --- */
    {
      const sofa = F.buildSofa(1.9, 0.86);            // 靠背贴西墙，面朝 +x
      sofa.rotation.y = Math.PI / 2;
      sofa.position.set(0.78, 0, 4.35);
      tagUsage(sofa, 1.95, 4.35); shared.add(sofa);
      const ctbl = put(F.buildCoffeeTable(0.9, 0.5), 1.95, 4.35, Math.PI / 2);
      tagUsage(ctbl, 0.9, 4.35); shared.add(ctbl);
      const console_ = F.buildMediaConsole(1.4, 0.40);
      console_.rotation.y = -Math.PI / 2;
      console_.position.set(4.15, 0, 4.35);
      tagUsage(console_, 0.78, 4.35); shared.add(console_);
      const rug = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.2),
        new THREE.MeshStandardMaterial({ map: makeRug(), roughness: 0.98 }));
      rug.rotation.x = -Math.PI / 2; rug.rotation.z = Math.PI / 2;
      rug.position.set(1.9, 0.015, 4.35);
      rug.receiveShadow = true; rug.name = 'rug';
      styleTargets.rugLiving = rug.material;
      shared.add(rug);
      const lamp = F.buildFloorLamp(); lamp.position.set(0.5, 0, 5.35); lamp.name = 'livingFloorLamp';
      shared.add(lamp);
      const plant = F.buildPlant(0.9); plant.position.set(4.35, 0, 2.55);
      shared.add(plant);
      const art = F.buildArtFrame(0.7, 0.9);
      art.rotation.y = -Math.PI / 2;                   // 挂卧室西墙
      art.position.set(4.63, 1.55, 4.0);
      shared.add(art);
    }

    /* --- 卧室 --- */
    {
      const bed = F.buildBed(1.5, 1.9);
      bed.rotation.y = Math.PI;                        // 床头（局部 -Z）朝 +z：靠南隔墙（北墙整窗、东墙有窗，均不压）
      bed.position.set(6.1, 0, 2.2);                   // 床体 x 5.35–6.85 / z 1.25–3.15
      tagUsage(bed, 6.1, 1.1); shared.add(bed);
      const ns = F.buildNightstand(); ns.position.set(4.95, 0, 2.95); tagUsage(ns, 5.5, 2.95); shared.add(ns);
      const tl = F.buildTableLamp(); tl.position.set(4.95, 0.47, 2.95); tl.name = 'primaryLamp'; shared.add(tl);
      const ward = F.buildWardrobe(1.6, 0.55, 2.2, 2);
      ward.rotation.y = Math.PI / 2;                   // 靠西墙（P3），正面朝 +x
      ward.position.set(5.05, 0, 0.85);
      tagUsage(ward, 5.7, 0.85); shared.add(ward);
      const rug = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.8),
        new THREE.MeshStandardMaterial({ color: 0xCFC6B8, roughness: 1 }));
      rug.rotation.x = -Math.PI / 2; rug.position.set(6.1, 0.014, 0.7);
      rug.receiveShadow = true;
      styleTargets.rugPrimary = rug.material;
      shared.add(rug);
    }

    /* --- 玄关 --- */
    {
      const coats = F.buildCoatsCloset(0.75, 0.36, 1.05);
      coats.rotation.y = Math.PI;
      coats.position.set(5.05, 0, 5.48);
      shared.add(coats);
      const mat = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.5),
        new THREE.MeshStandardMaterial({ color: 0xA89E8F, roughness: 1 }));
      mat.rotation.x = -Math.PI / 2; mat.position.set(6.05, 0.012, 5.45);
      mat.receiveShadow = true;
      styleTargets.entryMat = mat.material;
      shared.add(mat);
      const fr = F.buildFridge(); fr.rotation.y = -Math.PI / 2;   // 面朝 -x（向过道）
      fr.position.set(6.95, 0, 3.85);
      shared.add(fr);
    }

    return { modeGroups: {}, modeFocus: {} };
  },
};
