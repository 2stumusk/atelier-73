/* =====================================================================
 * plans/plan96.js — 96㎡ 三室一厅（第三间房 = 书房，三态切换）
 * 坐标系：1 unit = 1 m；x 向东 0→11，z 向南 0→8.7。
 * ===================================================================== */

const PLAN = { W: 11, D: 8.7, H: 2.8, EXT: 0.20, INT: 0.15, DOOR_H: 2.1, SILL: 0.9, WIN_TOP: 2.4 };

const WALLS = [
  { id: 'N', axis: 'x', c: 0.10, from: 0, to: 11, t: 0.20, ext: true,
    openings: [
      { a: 0.70, b: 2.30, sill: 0.9, top: 2.4, kind: 'window', name: '厨房窗' },
      { a: 3.90, b: 4.90, sill: 0.9, top: 2.4, kind: 'window', name: '卫生间窗' },
      { a: 7.60, b: 9.70, sill: 0.9, top: 2.4, kind: 'window', name: '主卧窗' },
    ] },
  { id: 'S', axis: 'x', c: 8.60, from: 0, to: 11, t: 0.20, ext: true,
    openings: [
      { a: 0.90, b: 2.70, sill: 0.9, top: 2.4, kind: 'window', name: '书房窗' },
      { a: 3.90, b: 5.30, sill: 0.9, top: 2.4, kind: 'window', name: '客厅窗' },
      { a: 5.95, b: 6.90, sill: 0, top: 2.1, kind: 'door', name: '入户门' },
      { a: 7.60, b: 9.40, sill: 0.9, top: 2.4, kind: 'window', name: '次卧窗' },
    ] },
  { id: 'W', axis: 'z', c: 0.10, from: 0, to: 8.7, t: 0.20, ext: true,
    openings: [
      { a: 3.30, b: 4.70, sill: 0.9, top: 2.4, kind: 'window', name: '餐厅西窗' },
      { a: 6.00, b: 7.60, sill: 0.9, top: 2.4, kind: 'window', name: '书房西窗' },
    ] },
  { id: 'E', axis: 'z', c: 10.90, from: 0, to: 8.7, t: 0.20, ext: true, openings: [] },

  // 厨房（西北）
  { id: 'P1', axis: 'z', c: 3.475, from: 0.10, to: 2.775, t: 0.15, openings: [] },
  { id: 'P2', axis: 'x', c: 2.775, from: 0.10, to: 3.475, t: 0.15,
    openings: [ { a: 1.40, b: 2.28, sill: 0, top: 2.1, kind: 'door', name: '厨房门' } ] },
  // 卫生间（北中）
  { id: 'P3', axis: 'z', c: 6.075, from: 0.10, to: 2.775, t: 0.15, openings: [] },
  { id: 'P4', axis: 'x', c: 2.775, from: 3.475, to: 6.075, t: 0.15,
    openings: [ { a: 4.60, b: 5.48, sill: 0, top: 2.1, kind: 'door', name: '卫生间门' } ] },
  // 卧室西墙（主卧门 + 次卧门）
  { id: 'P5', axis: 'z', c: 6.925, from: 0.10, to: 8.50, t: 0.15,
    openings: [
      { a: 2.90, b: 3.78, sill: 0, top: 2.1, kind: 'door', name: '主卧门' },
      { a: 5.60, b: 6.48, sill: 0, top: 2.1, kind: 'door', name: '次卧门' },
    ] },
  { id: 'P6', axis: 'x', c: 4.075, from: 6.925, to: 10.90, t: 0.15, openings: [] },   // 主卧/次卧之间
  // 书房（西南）
  { id: 'P7', axis: 'x', c: 5.425, from: 0.10, to: 3.475, t: 0.15,
    openings: [ { a: 1.90, b: 2.78, sill: 0, top: 2.1, kind: 'door', name: '书房门' } ] },
  { id: 'P8', axis: 'z', c: 3.475, from: 5.425, to: 8.50, t: 0.15, openings: [] },
];

const DOORS = [
  { id: 'entry',   name: '入户门',   w: 0.95, h: 2.1, pivot: [6.90, 8.60],   closed: [-1, 0], open: [0, -1], ext: true },
  { id: 'kitchen', name: '厨房门',   w: 0.88, h: 2.1, pivot: [2.28, 2.775],  closed: [-1, 0], open: [0, -1] },
  { id: 'bath',    name: '卫生间门', w: 0.88, h: 2.1, pivot: [5.48, 2.775],  closed: [-1, 0], open: [0, -1] },
  { id: 'primary', name: '主卧门',   w: 0.88, h: 2.1, pivot: [6.925, 3.78],  closed: [0, -1], open: [1, 0] },
  { id: 'bed2',    name: '次卧门',   w: 0.88, h: 2.1, pivot: [6.925, 6.48],  closed: [0, -1], open: [1, 0] },
  { id: 'study',   name: '书房门',   w: 0.88, h: 2.1, pivot: [2.78, 5.425],  closed: [-1, 0], open: [0, 1] },
];

const ROOMS = [
  { id: 'kitchen', name: '厨房', floor: 'tile',
    poly: [[0.2, 0.2], [3.4, 0.2], [3.4, 2.7], [0.2, 2.7]],
    label: [1.8, 1.4], size: '约 8.0 ㎡ · L 形橱柜',
    desc: 'L 形操作台带窗，洗切炒动线顺畅。',
    furn: 'L 形橱柜 · 水槽 · 炉灶 · 冰箱 · 洗烘一体机' },
  { id: 'bath', name: '卫生间', floor: 'tile',
    poly: [[3.55, 0.2], [6.0, 0.2], [6.0, 2.7], [3.55, 2.7]],
    label: [4.8, 1.45], size: '2.45 × 2.50 m',
    desc: '淋浴、马桶、洗手台三分离，带明窗。',
    furn: '淋浴区 · 马桶 · 洗手台 · 镜柜' },
  { id: 'dining', name: '餐厅', floor: 'wood',
    poly: [[0.2, 2.85], [3.475, 2.85], [3.475, 5.35], [0.2, 5.35]],
    label: [1.8, 4.1], size: '四人餐桌 · 西窗采光',
    desc: '餐桌挨着厨房门，旁边就是西窗。',
    furn: '餐桌 · 四把餐椅 · 吊灯' },
  { id: 'living', name: '客厅', floor: 'wood',
    poly: [[3.475, 2.85], [6.85, 2.85], [6.85, 8.5], [3.475, 8.5]],
    label: [5.2, 6.2], size: '面宽 3.4 m · 南向采光',
    desc: '沙发对着媒体柜，南窗下午有太阳。',
    furn: '三人沙发 · 茶几 · 媒体柜 · 落地灯' },
  { id: 'primary', name: '主卧', floor: 'wood',
    poly: [[7.0, 0.2], [10.8, 0.2], [10.8, 4.0], [7.0, 4.0]],
    label: [8.9, 2.1], size: '3.80 × 3.80 m',
    desc: '双人床靠东墙，北窗采光，床尾通道宽松。',
    furn: '双人床 · 两个床头柜 · 三门衣柜' },
  { id: 'bed2', name: '次卧', floor: 'wood',
    poly: [[7.0, 4.15], [10.8, 4.15], [10.8, 8.5], [7.0, 8.5]],
    label: [8.9, 6.3], size: '3.80 × 4.35 m',
    desc: '南向次卧，住人、做客房都宽裕。',
    furn: '双人床 · 床头柜 · 双门衣柜' },
  { id: 'study', name: '书房', floor: 'wood',
    poly: [[0.2, 5.5], [3.4, 5.5], [3.4, 8.5], [0.2, 8.5]],
    label: [1.8, 7.0], size: '3.20 × 3.00 m',
    desc: '这家的第三间房——它的用途，由你来定。',
    furn: '随生活状态切换' },
];

const MODES = [
  { id: 'work',  name: '在家工作', time: 0.18, question: '把第三间房留给专注',
    desc: '书房 = 居家工作室：书桌、书架、阅读灯，留一把可以打盹的单椅。' },
  { id: 'guest', name: '朋友留宿', time: 0.62, question: '把第三间房留给朋友',
    desc: '书房 = 临时客房：单人床、床头柜、小衣柜和一盏阅读灯。' },
  { id: 'future', name: '留给未来', time: 0.42, question: '把第三间房留给未来',
    desc: '书房 = 儿童房：儿童床、矮柜、学习桌，颜色克制，风格不变。' },
];

const LIST = {
  shared: [
    { room: '客厅', items: [
      { name: '三人布艺沙发', spec: 'fabric', price: 4800 },
      { name: '茶几', spec: 'wood', price: 1200 },
      { name: '媒体柜', spec: 'wood', price: 2600 },
      { name: '落地灯', spec: '哑黑金属 + 布艺灯罩', price: 680 },
      { name: '客厅地毯 190×260', spec: 'accent', price: 899 },
      { name: '绿植 ×2', spec: '琴叶榕 / 龟背竹', price: 260 },
    ] },
    { room: '餐厅', items: [
      { name: '四人实木餐桌', spec: 'wood', price: 2200 },
      { name: '餐椅 ×4', spec: 'wood', price: 1600 },
      { name: '餐厅吊灯', spec: '哑黑金属', price: 560 },
    ] },
    { room: '厨房', items: [
      { name: 'L 形橱柜（定制）', spec: '烤漆门板 + 石英石台面', price: 18000 },
      { name: '双门冰箱', spec: '白色烤漆', price: 3200 },
      { name: '洗烘一体机', spec: '白色', price: 3600 },
    ] },
    { room: '卫生间', items: [
      { name: '浴室柜 + 镜柜', spec: 'wood', price: 2800 },
      { name: '淋浴玻璃隔断', spec: '超白玻 + 细框', price: 2400 },
      { name: '壁挂马桶', spec: '哑光白', price: 1800 },
    ] },
    { room: '主卧', items: [
      { name: '双人床 1.6m', spec: 'wood', price: 3600 },
      { name: '床头柜 ×2', spec: 'wood', price: 1200 },
      { name: '三门衣柜', spec: '烤漆 + 木色踢脚', price: 4200 },
      { name: '床头台灯', spec: '布艺灯罩', price: 320 },
    ] },
    { room: '次卧', items: [
      { name: '双人床 1.5m', spec: 'wood', price: 2900 },
      { name: '床头柜', spec: 'wood', price: 580 },
      { name: '双门衣柜', spec: '烤漆', price: 3200 },
      { name: '床头台灯', spec: '布艺灯罩', price: 320 },
    ] },
    { room: '玄关', items: [
      { name: '鞋柜', spec: '烤漆', price: 980 },
      { name: '穿衣镜', spec: '细框全身镜', price: 420 },
    ] },
  ],
  modes: {
    work: { label: '在家工作 · 书房方案', items: [
      { name: '书桌 140×60', spec: 'wood', price: 1100 },
      { name: '人体工学椅', spec: '灰色网布', price: 1500 },
      { name: '五层书架', spec: 'wood', price: 860 },
      { name: '阅读落地灯', spec: '哑黑金属', price: 680 },
      { name: '单人休闲椅', spec: 'fabric', price: 1280 },
      { name: '圆形地毯', spec: 'accent', price: 420 },
    ] },
    guest: { label: '朋友留宿 · 客房方案', items: [
      { name: '单人床 1.0m', spec: 'wood', price: 1800 },
      { name: '独立袋装弹簧床垫', spec: '中等偏软', price: 1200 },
      { name: '床头柜', spec: 'wood', price: 580 },
      { name: '双门小衣柜', spec: '烤漆', price: 1600 },
      { name: '床头阅读灯', spec: '布艺灯罩', price: 320 },
      { name: '床边毯', spec: 'accent', price: 380 },
    ] },
    future: { label: '留给未来 · 儿童房方案', items: [
      { name: '儿童床 0.9m', spec: 'wood', price: 1600 },
      { name: '四格矮柜', spec: '烤漆 + 布盒', price: 980 },
      { name: '学习桌 100×50', spec: 'wood', price: 760 },
      { name: '儿童椅', spec: 'wood', price: 320 },
      { name: '玩具收纳组合', spec: '布艺收纳筐', price: 180 },
      { name: '圆形地毯', spec: 'accent', price: 420 },
    ] },
  },
};

export default {
  id: 'p96',
  area: '96', layout: '3B1B · 三室一厅',
  kicker: '3B1B · 建筑面积 96 ㎡',
  title: '96㎡，第三间房用来做什么？',
  sub: '同一个家，三种生活答案',
  question: '第三间房，你会留给谁？',
  hint: '平面线条会生长成墙，墙里会亮起灯——大约 7 秒',
  PLAN, WALLS, DOORS, ROOMS, MODES,
  list: LIST,
  planImage: null,
  views: {
    dollhouse: { pos: [12.9, 9.6, 15.4], tgt: [5.2, 0.4, 4.0] },
    top:       { pos: [5.5, 20, 4.35], tgt: [5.5, 0, 4.35] },
    front:     { pos: [5.5, 5.5, 17.2], tgt: [5.5, 1, 4.35] },
    detail:    { pos: [3.1, 2.4, 8.1], tgt: [1.5, 0.5, 6.6] },
  },
  cameras: {
    dollhouseCamera: { pos: [12.9, 9.6, 15.4], tgt: [5.2, 0.4, 4.0] },
    sectionCamera:   { pos: [13.3, 7.4, 14.0], tgt: [5.2, 0.9, 4.0] },
    interiorCamera:  { pos: [6.2, 1.6, 7.6], yaw: 1.5708, pitch: 0 },
    roamStartCamera: { pos: [6.2, 1.6, 7.6], yaw: 1.5708, pitch: 0 },
  },
  introFrom: { pos: [5.5, 26, 4.36], tgt: [5.5, 0, 4.35] },
  dimLabels: [
    ['主卧 3.80×3.80', 8.9, 2.1],
    ['次卧 3.80×4.35', 8.9, 6.3],
    ['书房 3.20×3.00', 1.8, 7.0],
    ['卫生间 2.45×2.50', 4.8, 1.45],
  ],
  modeBounds: { x1: 0.32, x2: 3.28, z1: 5.62, z2: 8.38 },   // 书房房内
  lamps: [
    ['pendant', 1.8, 1.8, 4.1, 0xFFD9A8, 14, 7],
    ['livingFloor', 3.85, 1.5, 7.9, 0xFFD9A8, 10, 6],
    ['primaryBed', 10.45, 0.95, 0.5, 0xFFD9A8, 7, 5],
    ['bed2', 10.45, 0.95, 5.5, 0xFFD9A8, 7, 5],
    ['study', 1.8, 2.3, 7.0, 0xFFD9A8, 9, 6],
    ['bath', 4.8, 2.3, 1.4, 0xFFF0DD, 8, 5],
    ['hall', 6.2, 2.4, 7.4, 0xFFE4C0, 6, 5],
    ['kitchen', 1.7, 2.3, 1.3, 0xFFF0DD, 8, 6],
  ],

  furnish({ THREE, F, put, tagUsage, makeRug, shared, styleTargets }) {
    /* --- 厨房：L 形橱柜 --- */
    {
      const g = new THREE.Group(); g.name = 'kitchen';
      const cabMat = F.MAT.lacquer, topMat = F.MAT.stone;
      const H = 0.88, D = 0.58;
      const run = (x0, z0, x1, z1) => {
        const w = Math.max(x1 - x0, z1 - z0), horiz = (x1 - x0) > (z1 - z0);
        const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
        const body = new THREE.Mesh(new THREE.BoxGeometry(horiz ? w : D, H - 0.12, horiz ? D : w), cabMat);
        body.position.set(cx, (H - 0.12) / 2 + 0.1, cz);
        body.castShadow = body.receiveShadow = true; g.add(body);
        const top = new THREE.Mesh(new THREE.BoxGeometry(horiz ? w + 0.02 : D + 0.02, 0.03, horiz ? D + 0.02 : w + 0.02), topMat);
        top.position.set(cx, H + 0.015, cz); top.castShadow = top.receiveShadow = true; g.add(top);
        const n = Math.floor(w / 0.5);
        for (let i = 1; i <= n; i++) {
          const off = -w / 2 + (w / (n + 1)) * i;
          const seam = new THREE.Mesh(new THREE.BoxGeometry(horiz ? 0.005 : 0.01, H - 0.2, horiz ? 0.01 : 0.005), F.MAT.metalSoft);
          seam.position.set(horiz ? cx + off : cx + (x0 < 1 ? D / 2 : -D / 2) * 0.99, H / 2, horiz ? cz + D / 2 * 0.99 : cz + off);
          g.add(seam);
        }
      };
      run(1.00, 0.2, 2.70, 0.78);   // 北墙段（含水槽）
      run(0.2, 0.80, 0.78, 2.30);   // 西墙段（含炉灶）
      const wsh = put(F.buildWasher(), 0.55, 0.49);
      tagUsage(wsh, 0.55, 1.2); g.add(wsh);
      const sink = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.16, 0.40), F.MAT.metalSoft);
      sink.position.set(1.90, 0.90, 0.47); g.add(sink);
      const basin = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.15, 0.34), F.MAT.metal);
      basin.position.set(1.90, 0.905, 0.47); g.add(basin);
      const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.26), F.MAT.metal);
      tap.position.set(1.90, 1.0, 0.28); g.add(tap);
      const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.16), F.MAT.metal);
      spout.rotation.x = Math.PI / 2; spout.position.set(1.90, 1.12, 0.36); g.add(spout);
      const hob = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.015, 0.56), F.MAT.screen);
      hob.position.set(0.49, 0.915, 1.55); g.add(hob);
      [[-0.12, -0.13], [0.12, -0.13], [-0.12, 0.13], [0.12, 0.13]].forEach(([dx, dz]) => {
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.008, 20), F.MAT.metal);
        b.position.set(0.49 + dx, 0.925, 1.55 + dz); g.add(b);
      });
      const hood = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.40), F.MAT.lacquer);
      hood.position.set(0.42, 1.72, 1.55); hood.castShadow = true; g.add(hood);
      const duct = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.9, 0.2), F.MAT.lacquer);
      duct.position.set(0.31, 2.35, 1.55); g.add(duct);
      const upper = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.7, 0.34), cabMat);
      upper.position.set(2.0, 1.85, 0.37); upper.castShadow = true; g.add(upper);
      const fr = F.buildFridge();                       // 厨房东南角，正面朝南
      fr.position.set(3.0, 0, 2.2); g.add(fr);
      shared.add(g);
    }

    /* --- 卫生间 --- */
    {
      const g = new THREE.Group(); g.name = 'bath';
      const shw = put(F.buildShower(0.95, 0.95), 4.05, 0.68);
      tagUsage(shw, 4.6, 1.5); g.add(shw);
      const wc = F.buildToilet(); wc.position.set(5.40, 0, 0.62);
      tagUsage(wc, 5.40, 1.6); g.add(wc);
      const van = F.buildVanity(); van.rotation.y = Math.PI / 2;
      van.position.set(3.85, 0, 2.15); tagUsage(van, 4.5, 2.15); g.add(van);
      const mir = F.buildMirrorCabinet(0.5); mir.rotation.y = Math.PI / 2;
      mir.position.set(3.62, 1.55, 2.15); g.add(mir);
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.5), F.MAT.metal);
      rail.rotation.z = Math.PI / 2; rail.position.set(5.0, 1.25, 2.66); g.add(rail);
      const towel = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.025), F.MAT.linen);
      towel.position.set(5.0, 1.05, 2.66); g.add(towel);
      shared.add(g);
    }

    /* --- 餐厅 --- */
    {
      const dTable = put(F.buildDiningTable(1.4, 0.8), 1.8, 4.1);
      shared.add(dTable);
      const chairAt = (x, z) => {
        const c = put(F.buildDiningChair(), x, z);
        c.rotation.y = Math.atan2(1.8 - x, 4.1 - z);
        tagUsage(c, 1.8, 4.1);
        shared.add(c);
      };
      chairAt(1.45, 3.38); chairAt(2.15, 3.38);
      chairAt(1.45, 4.82); chairAt(2.15, 4.82);
      const pend = F.buildPendant(); pend.position.set(1.8, 2.8, 4.1); pend.name = 'pendantLamp';
      shared.add(pend);
    }

    /* --- 客厅 --- */
    {
      const sofa = F.buildSofa(2.25, 0.86);             // 靠背贴书房东墙，面朝 +x（东）：茶几 → 电视
      sofa.rotation.y = Math.PI / 2;
      sofa.position.set(4.15, 0, 6.4);
      tagUsage(sofa, 5.25, 6.4); shared.add(sofa);
      const ctbl = put(F.buildCoffeeTable(1.0, 0.5), 5.25, 6.4, Math.PI / 2);
      tagUsage(ctbl, 4.2, 6.4); shared.add(ctbl);
      const console_ = F.buildMediaConsole(1.6, 0.40);
      console_.rotation.y = -Math.PI / 2;
      console_.position.set(6.45, 0, 6.4);
      tagUsage(console_, 4.15, 6.4); shared.add(console_);
      const rug = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 2.6),
        new THREE.MeshStandardMaterial({ map: makeRug(), roughness: 0.98 }));
      rug.rotation.x = -Math.PI / 2; rug.rotation.z = Math.PI / 2;
      rug.position.set(5.2, 0.015, 6.4);
      rug.receiveShadow = true; rug.name = 'rug';
      styleTargets.rugLiving = rug.material;
      shared.add(rug);
      const lamp = F.buildFloorLamp(); lamp.position.set(3.85, 0, 7.9); lamp.name = 'livingFloorLamp';
      shared.add(lamp);
      const plant = F.buildPlant(1.0); plant.position.set(6.5, 0, 3.3);
      shared.add(plant);
      const plant2 = F.buildPlant(0.75); plant2.position.set(3.8, 0, 3.2);
      shared.add(plant2);
      const art = F.buildArtFrame(0.8, 1.0);
      art.rotation.y = Math.PI / 2;                      // 挂书房东墙（面朝客厅 +x）
      art.position.set(3.52, 1.55, 6.8);
      shared.add(art);
    }

    /* --- 玄关 --- */
    {
      const coats = F.buildCoatsCloset(0.75, 0.36, 1.05);
      coats.rotation.y = Math.PI;
      coats.position.set(5.3, 0, 8.15);
      shared.add(coats);
      const mat = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.5),
        new THREE.MeshStandardMaterial({ color: 0xA89E8F, roughness: 1 }));
      mat.rotation.x = -Math.PI / 2; mat.position.set(6.4, 0.012, 8.2);
      mat.receiveShadow = true;
      styleTargets.entryMat = mat.material;
      shared.add(mat);
      const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.4, 0.45), F.MAT.mirror);
      mirror.position.set(6.84, 1.35, 7.3);
      shared.add(mirror);
    }

    /* --- 主卧 --- */
    {
      const bed = F.buildBed(1.6, 1.95);
      bed.rotation.y = -Math.PI / 2;                     // 床头朝 +x，靠东实体墙
      bed.position.set(9.825, 0, 1.7);                   // 床体 x 8.85–10.80 / z 0.90–2.50
      tagUsage(bed, 8.6, 1.7); shared.add(bed);
      const ns1 = F.buildNightstand(); ns1.position.set(10.45, 0, 0.5); tagUsage(ns1, 10.0, 0.5); shared.add(ns1);
      const ns2 = F.buildNightstand(); ns2.position.set(10.45, 0, 2.9); tagUsage(ns2, 10.0, 2.9); shared.add(ns2);
      const tl = F.buildTableLamp(); tl.position.set(10.45, 0.47, 0.5); tl.name = 'primaryLamp'; shared.add(tl);
      const ward = F.buildWardrobe(1.8, 0.55, 2.2, 3);
      ward.position.set(9.9, 0, 3.66);                   // 靠南隔墙
      tagUsage(ward, 9.9, 3.1); shared.add(ward);
      const rug = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.0),
        new THREE.MeshStandardMaterial({ color: 0xCFC6B8, roughness: 1 }));
      rug.rotation.x = -Math.PI / 2; rug.position.set(8.35, 0.014, 1.7);
      rug.receiveShadow = true;
      styleTargets.rugPrimary = rug.material;
      shared.add(rug);
      const art = F.buildArtFrame(0.6, 0.75, 0xB7B1A8);
      art.rotation.y = Math.PI;                          // 挂南隔墙
      art.position.set(8.6, 1.6, 3.97);
      shared.add(art);
    }

    /* --- 次卧（固定卧室） --- */
    {
      const bed = F.buildBed(1.5, 1.9);
      bed.rotation.y = -Math.PI / 2;
      bed.position.set(9.85, 0, 6.4);                    // 床体 x 8.90–10.80 / z 5.65–7.15
      tagUsage(bed, 8.7, 6.4); shared.add(bed);
      const ns = F.buildNightstand(); ns.position.set(10.45, 0, 5.5); tagUsage(ns, 10.0, 5.5); shared.add(ns);
      const tl = F.buildTableLamp(); tl.position.set(10.45, 0.47, 5.5); tl.name = 'bed2Lamp'; shared.add(tl);
      const ward = F.buildWardrobe(1.6, 0.55, 2.2, 2);
      ward.position.set(9.6, 0, 4.49);                   // 靠北隔墙
      tagUsage(ward, 9.6, 5.0); shared.add(ward);
      const rug = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.8),
        new THREE.MeshStandardMaterial({ color: 0xCFC6B8, roughness: 1 }));
      rug.rotation.x = -Math.PI / 2; rug.position.set(8.35, 0.014, 6.4);
      rug.receiveShadow = true;
      shared.add(rug);
    }

    /* --- 书房（第三间房）：三种生活状态 --- */
    const modeGroups = {};
    {
      // A 在家工作
      const a = new THREE.Group(); a.name = 'mode_work';
      const desk = F.buildDesk(1.4, 0.6, 0.74); desk.position.set(1.9, 0, 5.78); tagUsage(desk, 1.9, 6.45); a.add(desk);
      const laptop = F.buildLaptop(); laptop.position.set(1.75, 0.755, 5.75); laptop.rotation.y = 0.12; a.add(laptop);
      const dl = F.buildDeskLamp(); dl.position.set(2.4, 0.755, 5.72); dl.rotation.y = Math.PI * 0.9; dl.name = 'deskLampA'; a.add(dl);
      const books = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.16), F.MAT.paper);
      books.position.set(1.35, 0.84, 5.75); a.add(books);
      const chair = F.buildOfficeChair(); chair.position.set(1.9, 0, 6.48); chair.rotation.y = Math.PI + 0.08; tagUsage(chair, 1.9, 5.78); a.add(chair);
      const shelf = F.buildBookshelf(0.9, 1.8, 0.32); shelf.rotation.y = -Math.PI / 2; shelf.position.set(3.15, 0, 6.9); tagUsage(shelf, 2.5, 6.9); a.add(shelf);
      const lounge = F.buildLoungeChair(); lounge.position.set(0.75, 0, 7.9); lounge.rotation.y = Math.PI * 0.25; tagUsage(lounge, 1.4, 7.3); a.add(lounge);
      const fl = F.buildFloorLamp(); fl.position.set(1.35, 0, 8.1); fl.name = 'readLampA'; a.add(fl);
      const rugA = new THREE.Mesh(new THREE.CircleGeometry(0.75, 28),
        new THREE.MeshStandardMaterial({ color: 0xCFC6B8, roughness: 1 }));
      rugA.rotation.x = -Math.PI / 2; rugA.position.set(1.9, 0.013, 7.4); rugA.receiveShadow = true; a.add(rugA);
      styleTargets.rugWork = rugA.material;
      modeGroups.work = a;

      // B 朋友留宿
      const b = new THREE.Group(); b.name = 'mode_guest';
      const bed = F.buildBed(1.0, 1.9); bed.rotation.y = Math.PI / 2;   // 床头朝 -x，靠西墙
      bed.position.set(1.15, 0, 7.3); b.add(bed);                       // 床体 x 0.20–2.10 / z 6.80–7.80
      tagUsage(bed, 2.3, 7.3);
      const ns = F.buildNightstand(); ns.position.set(0.55, 0, 6.35); b.add(ns);
      tagUsage(ns, 1.0, 6.35);
      const tl2 = F.buildTableLamp(); tl2.position.set(0.55, 0.47, 6.35); tl2.name = 'guestLamp'; b.add(tl2);
      const ward = F.buildWardrobe(0.9, 0.55, 1.9, 2);                  // 靠北墙，正面朝南
      ward.position.set(2.85, 0, 5.83); tagUsage(ward, 2.85, 6.4); b.add(ward);
      const rugB = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.4),
        new THREE.MeshStandardMaterial({ color: 0xC4B9A8, roughness: 1 }));
      rugB.rotation.x = -Math.PI / 2; rugB.position.set(1.6, 0.013, 6.5); rugB.receiveShadow = true; b.add(rugB);
      styleTargets.rugGuest = rugB.material;
      modeGroups.guest = b;

      // C 留给未来：儿童房
      const c = new THREE.Group(); c.name = 'mode_future';
      const kbed = F.buildKidBed(); kbed.rotation.y = Math.PI / 2;      // 床头朝 -x，靠西墙
      kbed.position.set(1.1, 0, 7.4); tagUsage(kbed, 2.1, 7.4); c.add(kbed);
      const low = F.buildLowCabinet(1.2, 0.4, 0.8); low.rotation.y = -Math.PI / 2;
      low.position.set(3.15, 0, 7.2); tagUsage(low, 2.5, 7.2); c.add(low);
      const kdesk = F.buildDesk(1.0, 0.5, 0.58); kdesk.position.set(2.2, 0, 5.75); tagUsage(kdesk, 2.2, 6.3); c.add(kdesk);
      const kchair = F.buildDiningChair(); kchair.scale.setScalar(0.8); kchair.position.set(2.2, 0, 6.32); kchair.rotation.y = Math.PI; tagUsage(kchair, 2.2, 5.78); c.add(kchair);
      const dl2 = F.buildDeskLamp(); dl2.position.set(2.55, 0.595, 5.73); dl2.rotation.y = Math.PI; c.add(dl2);
      const toys = F.buildToys(); toys.position.set(0.8, 0, 6.3); c.add(toys);
      const rugC = new THREE.Mesh(new THREE.CircleGeometry(0.7, 28),
        new THREE.MeshStandardMaterial({ color: 0xC9BFAF, roughness: 1 }));
      rugC.rotation.x = -Math.PI / 2; rugC.position.set(1.2, 0.013, 6.7); rugC.receiveShadow = true; c.add(rugC);
      styleTargets.rugFuture = rugC.material;
      modeGroups.future = c;
    }

    const modeFocus = {
      work:   { keys: ['desk', 'officeChair', 'laptop', 'deskLampA'], dir: [0.15, 0.99] },
      guest:  { keys: ['bed', 'nightstand', 'guestLamp'],             dir: [0.85, -0.53] },
      future: { keys: ['bed', 'desk', 'diningChair', 'lowCabinet'],   dir: [0.90, 0.44], fov: 58 },
    };

    return { modeGroups, modeFocus };
  },
};
