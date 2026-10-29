/* =====================================================================
 * floorplan-data.js — 户型几何数据（唯一空间依据：上传的 2D 户型图）
 * 坐标系：1 unit = 1 m；x 向东 0→10，z 向南 0→8，y 向上。
 * 外墙 0.20 / 内墙 0.15 / 层高 2.8 / 门高 2.1 / 窗台 0.9 / 窗顶 2.4
 * 所有尺寸均从图纸像素实测（200 px/m）并与图纸尺寸链校核：
 * 3750 + 2700 + 3550 = 10000；3700 + 3750 + 550 = 8000。
 * ===================================================================== */

export const PLAN = {
  W: 10, D: 8, H: 2.8,
  EXT: 0.20, INT: 0.15,
  DOOR_H: 2.1, SILL: 0.9, WIN_TOP: 2.4,
};

/* 墙体：轴对齐墙段。
 * axis 'x' = 沿 x 方向延伸（水平墙），'z' = 沿 z 方向延伸（竖直墙）。
 * c = 墙中心线坐标；from/to = 起止（含与相邻墙的搭接）；t = 厚度。
 * openings: { a, b, sill, top, kind:'window'|'door' }（沿墙走向的起止） */
export const WALLS = [
  // ---- 外墙 ----
  { id: 'N', axis: 'x', c: 0.10, from: 0, to: 10, t: 0.20, ext: true,
    openings: [
      { a: 0.70, b: 2.70, sill: 0.9, top: 2.4, kind: 'window', name: '厨房窗' },
      { a: 4.10, b: 5.10, sill: 0.9, top: 2.4, kind: 'window', name: '卫生间窗' },
      { a: 7.20, b: 9.30, sill: 0.9, top: 2.4, kind: 'window', name: '主卧窗' },
    ] },
  { id: 'S', axis: 'x', c: 7.90, from: 0, to: 10, t: 0.20, ext: true,
    openings: [
      { a: 1.90, b: 4.10, sill: 0.9, top: 2.4, kind: 'window', name: '客厅窗' },
      { a: 7.20, b: 9.20, sill: 0.9, top: 2.4, kind: 'window', name: '次卧窗' },
      { a: 5.40, b: 6.35, sill: 0, top: 2.1, kind: 'door', name: '入户门' },
    ] },
  { id: 'W', axis: 'z', c: 0.10, from: 0, to: 8, t: 0.20, ext: true,
    openings: [
      { a: 4.29, b: 6.71, sill: 0.9, top: 2.4, kind: 'window', name: '客厅西窗' },
    ] },
  { id: 'E', axis: 'z', c: 9.90, from: 0, to: 8, t: 0.20, ext: true, openings: [] },

  // ---- 内墙 ----
  { id: 'P1', axis: 'z', c: 3.825, from: 0.10, to: 2.80, t: 0.15, openings: [] },              // 厨房/卫生间
  { id: 'P2', axis: 'x', c: 2.725, from: 3.825, to: 6.60, t: 0.15,                            // 卫生间南墙
    openings: [ { a: 5.41, b: 6.29, sill: 0, top: 2.1, kind: 'door', name: '卫生间门' } ] },
  { id: 'P3', axis: 'z', c: 5.325, from: 2.725, to: 5.35, t: 0.15, openings: [] },            // 走廊西墙
  { id: 'P4', axis: 'z', c: 6.525, from: 0.10, to: 7.90, t: 0.15,                             // 卧室西墙
    openings: [
      { a: 2.86, b: 3.74, sill: 0, top: 2.1, kind: 'door', name: '主卧门' },
      { a: 4.26, b: 5.15, sill: 0, top: 2.1, kind: 'door', name: '次卧门' },
    ] },
  { id: 'P5', axis: 'x', c: 3.975, from: 6.525, to: 9.90, t: 0.15, openings: [] },            // 两卧室之间
];

/* 门扇：pivot = 铰链点；closed = 关门时门扇指向；open = 开门时门扇指向（均已对照图纸门弧） */
export const DOORS = [
  { id: 'entry',   name: '入户门',   w: 0.95, h: 2.1, pivot: [6.35, 7.90],  closed: [-1, 0], open: [0, -1], ext: true },
  { id: 'bath',    name: '卫生间门', w: 0.88, h: 2.1, pivot: [6.29, 2.725], closed: [-1, 0], open: [0, -1] },
  { id: 'primary', name: '主卧门',   w: 0.88, h: 2.1, pivot: [6.525, 3.74], closed: [0, -1], open: [1, 0] },
  { id: 'bed2',    name: '次卧门',   w: 0.88, h: 2.1, pivot: [6.525, 5.15], closed: [0, -1], open: [1, 0] },
];

/* 房间：多边形（地板 / 悬停热区），顺时针 */
export const ROOMS = [
  { id: 'kitchen', name: '厨房', floor: 'tile',
    poly: [[0.2, 0.2], [3.825, 0.2], [3.825, 2.65], [0.2, 2.65]],
    label: [1.9, 1.35], size: '约 7.0 ㎡ · L 形橱柜',
    desc: 'L 形操作台，600 深台面，洗切炒动线一气呵成。',
    furn: 'L 形橱柜 · 水槽 · 炉灶 · 冰箱 · 洗烘一体机' },
  { id: 'bath', name: '卫生间', floor: 'tile',
    poly: [[3.9, 0.2], [6.45, 0.2], [6.45, 2.65], [3.9, 2.65]],
    label: [5.15, 1.45], size: '2.55 × 2.45 m',
    desc: '淋浴、马桶、洗手台三分布置，互不干扰。',
    furn: '淋浴区 · 马桶 · 洗手台 · 镜柜' },
  { id: 'dining', name: '餐厅', floor: 'wood',
    poly: [[0.2, 2.65], [3.825, 2.65], [3.825, 2.80], [5.325, 2.80], [5.325, 4.90], [0.2, 4.90]],
    label: [3.3, 3.95], size: '与客厅连通 · 四人餐桌',
    desc: '四人餐桌靠着厨房，上菜只要两步。',
    furn: '餐桌 · 四把餐椅 · 吊灯' },
  { id: 'living', name: '客厅', floor: 'wood',
    poly: [[0.2, 4.90], [5.325, 4.90], [5.325, 5.35], [5.40, 5.35], [5.40, 7.90], [0.2, 7.90]],
    label: [2.4, 6.15], size: '面宽 5.1 m · 双向采光',
    desc: '三人沙发对着媒体柜，下午的西晒刚好落在地毯上。',
    furn: '三人沙发 · 茶几 · 媒体柜 · 落地灯' },
  { id: 'hall', name: '走廊 · 入口', floor: 'wood',
    poly: [[5.40, 2.80], [6.45, 2.80], [6.45, 7.90], [5.40, 7.90]],
    label: [5.92, 6.35], size: '净宽 1.05 m',
    desc: '入户、卧室、卫生间都由这条短走廊串起来。',
    furn: '入口收纳柜 · 穿衣镜' },
  { id: 'primary', name: '主卧', floor: 'wood',
    poly: [[6.60, 0.20], [9.80, 0.20], [9.80, 3.90], [6.60, 3.90]],
    label: [8.2, 2.1], size: '3.20 × 3.70 m',
    desc: '双人床靠北墙，床尾留了宽松的通道。',
    furn: '双人床 · 两个床头柜 · 三门衣柜' },
  { id: 'bed2', name: '次卧', floor: 'wood',
    poly: [[6.60, 4.05], [9.80, 4.05], [9.80, 7.90], [6.60, 7.90]],
    label: [8.2, 6.0], size: '3.20 × 3.75 m',
    desc: '这家的第二间房——它的用途，由你来定。',
    furn: '随生活状态切换' },
];

/* 三种生活状态（只改次卧家具 / 软装 / 灯光，建筑结构不变） */
export const MODES = [
  { id: 'work',  name: '在家工作', time: 0.18, question: '把第二间房留给专注',
    desc: '次卧 = 居家工作室：书桌、书架、阅读灯，留一把可以打盹的单椅。' },
  { id: 'guest', name: '朋友留宿', time: 0.62, question: '把第二间房留给朋友',
    desc: '次卧 = 完整客房：床、床头柜、小衣柜和一盏阅读灯。' },
  { id: 'future', name: '留给未来', time: 0.42, question: '把第二间房留给未来',
    desc: '次卧 = 儿童房：儿童床、矮柜、学习桌，颜色克制，风格不变。' },
];

/* 时间档：t ∈ [0,1] 上午→下午→夜晚 */
export const TIME_PRESETS = {
  morning:   { t: 0.18, label: '上午' },
  afternoon: { t: 0.45, label: '下午' },
  night:     { t: 0.85, label: '夜晚' },
};

export const PALETTE = {
  bg:      0xF2F0EB,
  wall:    0xEDE9E1,
  wallExt: 0xE4DFD5,
  oak:     0xC7A77A,
  linen:   0xB7B1A8,
  sage:    0x7E8D7A,
  walnut:  0x695044,
  metal:   0x343434,
  stone:   0xCFCFC9,
  white:   0xF5F3EE,
};
