/* =====================================================================
 * styles-data.js — 室内风格预设 + 软装清单数据
 * 每套风格 = 一组材质/配色参数（3D 场景与 UI 同源），
 * 清单按「全屋基础项 + 次卧三态」组织，风格决定材质基调描述。
 * ===================================================================== */

export const STYLES = [
  {
    id: 'morning', name: '晨雾原木', en: 'Morning Oak',
    desc: '浅橡木与暖白墙面，鼠尾草绿点缀——清醒、温润的日常。',
    materials: { wood: '白橡木 · 原木色', fabric: '亚麻 · 燕麦色', accent: '鼠尾草绿' },
    scene: {
      bg: 0xF2F0EB, nightBg: 0x2E3440,
      wall: '#E2DCCF', wallExt: '#D8D1C0',
      ceiling: 0xF3F0E9, roof: 0xDDD8CD, skirt: 0xE2DCD1,
      sill: 0xE8E3D8, ground: 0xE9E6DE,
      doorPanel: 0xC7A77A, frame: 0x343434,
      woodFloor: { base: '#C7A77A', tone: [199, 167, 122], grain: 'rgba(120,90,55,A)', seam: 'rgba(90,65,40,0.55)' },
      tileFloor: { base: '#B9B4AB', tone: [188, 183, 173], vein: 'rgba(140,135,125,A)' },
      rugLiving: { base: '#A89E8F', border: '#8C8375' },
      rugPrimary: 0xCFC6B8, rugWork: 0xCFC6B8, rugGuest: 0xC4B9A8, rugFuture: 0xC9BFAF, entryMat: 0xA89E8F,
      furniture: {
        oak: 0xC7A77A, oakDark: 0xA9885C, walnut: 0x695044, lacquer: 0xF1EEE7,
        stone: 0xCFCFC9, metal: 0x343434, metalSoft: 0x8A857C,
        linen: '#B7B1A8', sage: 0x7E8D7A, bedding: 0xEDE8DD, blanket: 0xB7B1A8,
        plant: 0x6F7F63, pot: 0x9C938A, paper: 0xEFEAE0,
      },
    },
    ui: { accent: '#7E8D7A', bg: '#F2F0EB' },
  },
  {
    id: 'cream', name: '云栖奶油', en: 'Cloud Cream',
    desc: '奶油白与浅驼色层叠，线条圆润——柔软、安静、被包裹。',
    materials: { wood: '白蜡木 · 奶油色', fabric: '圈圈呢 · 奶白', accent: '浅驼色' },
    scene: {
      bg: 0xF5F1E9, nightBg: 0x32302E,
      wall: '#EAE3D4', wallExt: '#E0D7C4',
      ceiling: 0xF7F3EA, roof: 0xE4DCCC, skirt: 0xEBE4D4,
      sill: 0xEFE8D9, ground: 0xEFEBE0,
      doorPanel: 0xD8BF9C, frame: 0x4A4238,
      woodFloor: { base: '#D9C3A0', tone: [217, 195, 160], grain: 'rgba(150,120,85,A)', seam: 'rgba(120,95,65,0.45)' },
      tileFloor: { base: '#CBC3B2', tone: [203, 195, 178], vein: 'rgba(155,145,128,A)' },
      rugLiving: { base: '#CBB99E', border: '#B3A088' },
      rugPrimary: 0xDACFBA, rugWork: 0xDACFBA, rugGuest: 0xD3C4AC, rugFuture: 0xD8CCB8, entryMat: 0xB8A88E,
      furniture: {
        oak: 0xD8BF9C, oakDark: 0xBFA070, walnut: 0x7A5F4A, lacquer: 0xF6F1E6,
        stone: 0xD8D3C6, metal: 0x4A4238, metalSoft: 0x9A9285,
        linen: '#CEC3B2', sage: 0xB49B78, bedding: 0xF2EBDD, blanket: 0xC9BBA4,
        plant: 0x7D8A6B, pot: 0xB0A592, paper: 0xF3EDE0,
      },
    },
    ui: { accent: '#B49B78', bg: '#F5F1E9' },
  },
  {
    id: 'sage', name: '青野鼠尾草', en: 'Sage Field',
    desc: '灰绿与浅灰木色呼吸相通——清透、松弛、有植物的气息。',
    materials: { wood: '灰橡木 · 雾面色', fabric: '棉麻 · 灰绿', accent: '深鼠尾草' },
    scene: {
      bg: 0xEEF0EA, nightBg: 0x2B3230,
      wall: '#DDE0D2', wallExt: '#D2D6C5',
      ceiling: 0xF1F2EA, roof: 0xD6D9CB, skirt: 0xDFE2D3,
      sill: 0xE4E6D9, ground: 0xE7E9E0,
      doorPanel: 0xB5B39A, frame: 0x3A3F38,
      woodFloor: { base: '#B9B4A2', tone: [185, 180, 162], grain: 'rgba(105,100,80,A)', seam: 'rgba(80,78,62,0.5)' },
      tileFloor: { base: '#B2B4AA', tone: [178, 180, 170], vein: 'rgba(130,132,120,A)' },
      rugLiving: { base: '#9AA48E', border: '#7E8A74' },
      rugPrimary: 0xC3C9B6, rugWork: 0xC3C9B6, rugGuest: 0xB8BFA9, rugFuture: 0xC0C6B2, entryMat: 0x99A18B,
      furniture: {
        oak: 0xB5B39A, oakDark: 0x97957C, walnut: 0x5E5648, lacquer: 0xEFEFE4,
        stone: 0xC8CABF, metal: 0x3A3F38, metalSoft: 0x878A7C,
        linen: '#A9B09C', sage: 0x68795F, bedding: 0xE6E8DC, blanket: 0xA9B09C,
        plant: 0x5F7452, pot: 0x94988A, paper: 0xEBEBDF,
      },
    },
    ui: { accent: '#68795F', bg: '#EEF0EA' },
  },
  {
    id: 'lunar', name: '月岩浅灰', en: 'Lunar Grey',
    desc: '浅灰石材与雾白墙面，黑色细线收边——克制、精确、高级。',
    materials: { wood: '浅灰橡木 · 哑光', fabric: '细麻 · 月白', accent: '岩板灰' },
    scene: {
      bg: 0xEFF0EF, nightBg: 0x262B33,
      wall: '#DDDDDA', wallExt: '#D1D2CD',
      ceiling: 0xF2F2EF, roof: 0xD9DAD6, skirt: 0xE0E0DB,
      sill: 0xE5E5E0, ground: 0xE8E9E6,
      doorPanel: 0xBCB6AC, frame: 0x26262A,
      woodFloor: { base: '#BAB5AC', tone: [186, 181, 172], grain: 'rgba(110,105,95,A)', seam: 'rgba(85,80,72,0.5)' },
      tileFloor: { base: '#AFADA6', tone: [175, 173, 166], vein: 'rgba(128,126,118,A)' },
      rugLiving: { base: '#A3A09A', border: '#87837C' },
      rugPrimary: 0xC9C5BC, rugWork: 0xC9C5BC, rugGuest: 0xBFBBB2, rugFuture: 0xC6C2B9, entryMat: 0xA09C94,
      furniture: {
        oak: 0xBCB6AC, oakDark: 0x9D968A, walnut: 0x544E46, lacquer: 0xF0EFEB,
        stone: 0xC6C6C2, metal: 0x26262A, metalSoft: 0x82827E,
        linen: '#AEABA2', sage: 0x7C8288, bedding: 0xE7E6E0, blanket: 0xAEABA2,
        plant: 0x66755E, pot: 0x8F8D86, paper: 0xEAE9E3,
      },
    },
    ui: { accent: '#6E7276', bg: '#EFF0EF' },
  },
];

/* ---------- 软装清单 ----------
 * shared = 全屋基础项（任何模式都包含）；modes = 次卧三态各自的新增项。
 * room 字段用于面板分组展示。 */
export const FURNISH_LIST = {
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
    { room: '入口', items: [
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

/* spec 占位符 → 风格材质描述 */
export function resolveSpec(spec, style) {
  if (spec === 'wood') return style.materials.wood;
  if (spec === 'fabric') return style.materials.fabric;
  if (spec === 'accent') return style.materials.accent;
  return spec;
}

export function listTotal(style, modeId) {
  let sum = 0;
  for (const g of FURNISH_LIST.shared) for (const it of g.items) sum += it.price;
  for (const it of FURNISH_LIST.modes[modeId].items) sum += it.price;
  return sum;
}
