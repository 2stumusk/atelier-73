/* =====================================================================
 * plans/plan73.js — 73㎡ 两室一厅（原始户型）
 * 空间数据在 ../floorplan-data.js；此处提供布置逻辑与视角/文案配置。
 * furnish(api) 约定：api = { THREE, F, put, tagUsage, makeRug, shared, styleTargets }
 * 返回 { modeGroups, modeFocus }
 * ===================================================================== */
import { PLAN, WALLS, DOORS, ROOMS, MODES } from '../floorplan-data.js';
import { FURNISH_LIST } from '../styles-data.js';

export default {
  id: 'p73',
  area: '73', layout: '2B1B · 两室一厅',
  kicker: '2B1B · 建筑面积 73 ㎡',
  title: '73㎡，第二间房应该留给谁？',
  sub: '同一个家，三种生活答案',
  question: '第二间房，你会留给谁？',
  hint: '平面线条会生长成墙，墙里会亮起灯——大约 7 秒',
  PLAN, WALLS, DOORS, ROOMS, MODES,
  list: FURNISH_LIST,
  planImage: './assets/floorplan-2d.png',
  planImageSize: [11.6, 9.65], planCenter: [5, 4.15],
  views: {
    dollhouse: { pos: [12.4, 9.4, 14.6], tgt: [4.7, 0.4, 3.6] },
    top:       { pos: [5, 20, 4], tgt: [5, 0, 4] },
    front:     { pos: [5, 5.5, 16], tgt: [5, 1, 4] },
    detail:    { pos: [7.0, 2.6, 7.4], tgt: [8.6, 0.4, 5.2] },
  },
  cameras: {
    dollhouseCamera: { pos: [12.4, 9.4, 14.6], tgt: [4.7, 0.4, 3.6] },
    sectionCamera:   { pos: [12.8, 7.2, 13.2], tgt: [4.7, 0.9, 3.6] },
    interiorCamera:  { pos: [5.9, 1.6, 7.3], yaw: -0.2, pitch: 0 },
    roamStartCamera: { pos: [5.9, 1.6, 6.2], yaw: 0.805, pitch: 0 },
  },
  introFrom: { pos: [5, 26, 4.01], tgt: [5, 0, 4] },
  dimLabels: [
    ['主卧 3.20×3.70', 8.2, 2.1],
    ['次卧 3.20×3.75', 8.2, 6.2],
    ['卫生间 2.55×2.45', 5.15, 1.45],
  ],
  modeBounds: { x1: 6.62, x2: 9.68, z1: 4.12, z2: 7.68 },   // 次卧房内（聚焦相机不越墙）
  lamps: [
    ['pendant', 3.3, 1.8, 4.05, 0xFFD9A8, 14, 7],
    ['livingFloor', 0.55, 1.5, 7.35, 0xFFD9A8, 10, 6],
    ['primaryBed', 9.42, 0.95, 0.45, 0xFFD9A8, 7, 5],
    ['bed2', 8.25, 2.3, 6.0, 0xFFD9A8, 9, 6],
    ['bath', 5.15, 2.3, 1.4, 0xFFF0DD, 8, 5],
    ['hall', 5.92, 2.4, 5.4, 0xFFE4C0, 6, 5],
    ['kitchen', 1.9, 2.3, 1.3, 0xFFF0DD, 8, 6],
  ],

  furnish({ THREE, F, put, tagUsage, makeRug, shared, styleTargets }) {
    /* --- 厨房：L 形橱柜（台面 600 深） --- */
    function buildKitchen() {
      const g = new THREE.Group(); g.name = 'kitchen';
      const cabMat = F.MAT.lacquer, topMat = F.MAT.stone;
      const H = 0.88, D = 0.58;
      const run = (x0, z0, x1, z1) => { // 一段地柜
        const w = Math.max(x1 - x0, z1 - z0), horiz = (x1 - x0) > (z1 - z0);
        const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
        const body = new THREE.Mesh(new THREE.BoxGeometry(horiz ? w : D, H - 0.12, horiz ? D : w), cabMat);
        body.position.set(cx, (H - 0.12) / 2 + 0.1, cz);
        body.castShadow = body.receiveShadow = true;
        g.add(body);
        const top = new THREE.Mesh(new THREE.BoxGeometry(horiz ? w + 0.02 : D + 0.02, 0.03, horiz ? D + 0.02 : w + 0.02), topMat);
        top.position.set(cx, H + 0.015, cz);
        top.castShadow = top.receiveShadow = true;
        g.add(top);
        // 柜门分缝（每 0.5m 一道）
        const n = Math.floor(w / 0.5);
        for (let i = 1; i <= n; i++) {
          const off = -w / 2 + (w / (n + 1)) * i;
          const seam = new THREE.Mesh(new THREE.BoxGeometry(horiz ? 0.005 : 0.01, H - 0.2, horiz ? 0.01 : 0.005), F.MAT.metalSoft);
          seam.position.set(horiz ? cx + off : cx + (x0 < 1 ? D / 2 : -D / 2) * 0.99, H / 2, horiz ? cz + D / 2 * 0.99 : cz + off);
          g.add(seam);
        }
      };
      run(0.2, 0.2, 1.40, 0.78);   // 北墙西段（到洗衣机）
      run(2.00, 0.2, 3.75, 0.78);  // 北墙东段（含水槽）
      run(0.2, 0.80, 0.78, 2.28);  // 西墙段（含炉灶）
      // 洗衣机（台下）
      const wsh = put(F.buildWasher(), 1.70, 0.49);      // 舱门 +Z 朝南（朝厨房过道）
      tagUsage(wsh, 1.70, 1.3); g.add(wsh);
      // 水槽（双槽嵌入台面）
      const sink = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.16, 0.40), F.MAT.metalSoft);
      sink.position.set(3.18, 0.90, 0.47); g.add(sink);
      const basin = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.15, 0.34), F.MAT.metal);
      basin.position.set(3.18, 0.905, 0.47); g.add(basin);
      const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.26), F.MAT.metal);
      tap.position.set(3.18, 1.0, 0.28); g.add(tap);
      const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.16), F.MAT.metal);
      spout.rotation.x = Math.PI / 2; spout.position.set(3.18, 1.12, 0.36); g.add(spout);
      // 炉灶（四眼）
      const hob = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.015, 0.56), F.MAT.screen);
      hob.position.set(0.49, 0.915, 1.30); g.add(hob);
      [[-0.12, -0.13], [0.12, -0.13], [-0.12, 0.13], [0.12, 0.13]].forEach(([dx, dz]) => {
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.008, 20), F.MAT.metal);
        b.position.set(0.49 + dx, 0.925, 1.30 + dz); g.add(b);
      });
      // 烟机 + 吊柜
      const hood = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.40), F.MAT.lacquer);
      hood.position.set(0.42, 1.72, 1.30); hood.castShadow = true; g.add(hood);
      const duct = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.9, 0.2), F.MAT.lacquer);
      duct.position.set(0.31, 2.35, 1.30); g.add(duct);
      const upper = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 0.34), cabMat);
      upper.position.set(2.85, 1.85, 0.37); upper.castShadow = true; g.add(upper);
      const useam = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.6, 0.01), F.MAT.metalSoft);
      useam.position.set(2.85, 1.85, 0.545); g.add(useam);
      // 冰箱（西侧高柜）
      const fr = F.buildFridge(); fr.rotation.y = Math.PI / 2; // 面朝 +x
      fr.position.set(0.5, 0, 2.65); g.add(fr);
      return g;
    }
    shared.add(buildKitchen());

    /* --- 卫生间 --- */
    function buildBath() {
      const g = new THREE.Group(); g.name = 'bath';
      const shw = put(F.buildShower(0.95, 0.95), 4.43, 0.68);                  // 淋浴 NW，入口朝南
      tagUsage(shw, 4.9, 1.5); g.add(shw);
      const wc = F.buildToilet();                                              // 水箱靠北墙（局部 -Z），正面 +Z 朝卫生间内
      wc.position.set(5.78, 0, 0.62);                                          // 正前方 z 0.94→2.6 净距 >600mm
      tagUsage(wc, 5.78, 1.6); g.add(wc);
      const van = F.buildVanity(); van.rotation.y = Math.PI / 2;               // 洗手台靠西墙，正面朝 +x 站立区
      van.position.set(4.18, 0, 2.08); tagUsage(van, 4.85, 2.08); g.add(van);  // 前方净距 >600mm
      const mir = F.buildMirrorCabinet(0.5); mir.rotation.y = Math.PI / 2;
      mir.position.set(3.97, 1.55, 2.08); g.add(mir);
      // 毛巾架 + 毛巾
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.5), F.MAT.metal);
      rail.rotation.z = Math.PI / 2; rail.position.set(5.4, 1.25, 2.62); g.add(rail);
      const towel = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.025), F.MAT.linen);
      towel.position.set(5.4, 1.05, 2.62); g.add(towel);
      return g;
    }
    shared.add(buildBath());

    /* --- 餐厅 --- */
    {
      const dTable = put(F.buildDiningTable(1.4, 0.8), 3.3, 4.05);
      shared.add(dTable);
      // 餐椅：每把椅子的正面（局部 +Z）= normalize(桌心 - 椅心)，距桌边 120mm，椅背朝外
      const chairAt = (x, z) => {
        const c = put(F.buildDiningChair(), x, z);
        c.rotation.y = Math.atan2(3.3 - x, 4.05 - z);   // +Z → 桌心
        tagUsage(c, 3.3, 4.05);
        shared.add(c);
      };
      chairAt(2.95, 3.33); chairAt(3.75, 3.33);          // 北侧两把，面朝南（向桌）
      chairAt(2.95, 4.77); chairAt(3.75, 4.77);          // 南侧两把，面朝北（向桌）
      const pend = F.buildPendant(); pend.position.set(3.3, 2.8, 4.05); pend.name = 'pendantLamp';
      shared.add(pend);
    }

    /* --- 客厅 --- */
    {
      const sofa = F.buildSofa(2.25, 0.86);       // 靠背贴西墙，正面朝 +x（东）：茶几 → 电视
      sofa.rotation.y = Math.PI / 2;
      sofa.position.set(0.83, 0, 5.94);
      tagUsage(sofa, 2.10, 5.94);                  // usageTarget = 茶几
      shared.add(sofa);
      const ctbl = put(F.buildCoffeeTable(1.0, 0.5), 2.10, 5.94, Math.PI / 2); // 沙发前沿 1.26 → 茶几 1.85，净距 ~590mm
      tagUsage(ctbl, 1.0, 5.94); shared.add(ctbl);
      const console_ = F.buildMediaConsole(1.6, 0.40);
      console_.rotation.y = -Math.PI / 2;         // 柜门与 TV 屏幕面朝 -x（西，向沙发）
      console_.position.set(2.95, 0, 5.94);
      tagUsage(console_, 0.83, 5.94);
      shared.add(console_);
      const rug = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 2.6),
        new THREE.MeshStandardMaterial({ map: makeRug(), roughness: 0.98 }));
      rug.rotation.x = -Math.PI / 2; rug.rotation.z = Math.PI / 2;
      rug.position.set(2.05, 0.015, 5.94);
      rug.receiveShadow = true; rug.name = 'rug';
      styleTargets.rugLiving = rug.material;
      shared.add(rug);
      const lamp = F.buildFloorLamp(); lamp.position.set(0.55, 0, 7.35); lamp.name = 'livingFloorLamp';
      shared.add(lamp);
      const plant = F.buildPlant(1.0); plant.position.set(4.85, 0, 5.15);
      shared.add(plant);
      const plant2 = F.buildPlant(0.75); plant2.position.set(0.55, 0, 3.35);
      shared.add(plant2);
      const art = F.buildArtFrame(0.8, 1.0);      // 挂在走廊西墙
      art.rotation.y = -Math.PI / 2;
      art.position.set(5.30, 1.55, 4.3);
      shared.add(art);
    }

    /* --- 入口 / 走廊 --- */
    {
      const coats = F.buildCoatsCloset(0.75, 0.36, 1.05);      // 门口鞋柜：低矮小体量
      coats.rotation.y = Math.PI;
      coats.position.set(4.80, 0, 7.49);
      shared.add(coats);
      const mat = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.5),
        new THREE.MeshStandardMaterial({ color: 0xA89E8F, roughness: 1 }));
      mat.rotation.x = -Math.PI / 2; mat.position.set(5.88, 0.012, 7.25);
      mat.receiveShadow = true;
      styleTargets.entryMat = mat.material;
      shared.add(mat);
      const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.4, 0.45), F.MAT.mirror);
      mirror.position.set(6.44, 1.35, 6.4);
      shared.add(mirror);
    }

    /* --- 主卧 --- */
    {
      const bed = F.buildBed(1.6, 1.95);
      bed.rotation.y = -Math.PI / 2;              // 床头（局部 -Z）朝 +x，靠东实体墙——北墙整面是窗，不压窗
      bed.position.set(8.825, 0, 1.55);           // 床体 x 7.85–9.80 / z 0.75–2.35
      tagUsage(bed, 7.6, 1.55); shared.add(bed);
      // 床头柜只在床头左右两侧（东墙、床头两端），不压窗、不在床尾
      const ns1 = F.buildNightstand(); ns1.position.set(9.45, 0, 0.42); tagUsage(ns1, 9.0, 0.42); shared.add(ns1);
      const ns2 = F.buildNightstand(); ns2.position.set(9.45, 0, 2.68); tagUsage(ns2, 9.0, 2.68); shared.add(ns2);
      const tl = F.buildTableLamp(); tl.position.set(9.45, 0.47, 0.42); tl.name = 'primaryLamp'; shared.add(tl);
      const ward = F.buildWardrobe(1.8, 0.55, 2.2, 3);
      ward.position.set(8.9, 0, 3.60);            // 靠南隔墙，不挡窗、避开门扇弧线
      tagUsage(ward, 8.9, 3.0); shared.add(ward);
      const rug = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.0),
        new THREE.MeshStandardMaterial({ color: 0xCFC6B8, roughness: 1 }));
      rug.rotation.x = -Math.PI / 2; rug.position.set(7.35, 0.014, 1.55);
      rug.receiveShadow = true;
      styleTargets.rugPrimary = rug.material;
      shared.add(rug);
      const art = F.buildArtFrame(0.6, 0.75, 0xB7B1A8);
      art.rotation.y = -Math.PI / 2;                 // 挂东墙（北墙被窗占满）
      art.position.set(9.77, 1.6, 1.9);
      shared.add(art);
    }

    /* --- 次卧：三种生活状态（仅家具/软装/灯光变化） --- */
    const modeGroups = {};
    {
      // A 在家工作：书桌 + 书架 + 单椅
      const a = new THREE.Group(); a.name = 'mode_work';
      const desk = F.buildDesk(1.4, 0.6, 0.74); desk.position.set(8.85, 0, 4.38); tagUsage(desk, 8.85, 5.05); a.add(desk);
      const laptop = F.buildLaptop(); laptop.position.set(8.7, 0.755, 4.35); laptop.rotation.y = 0.12; a.add(laptop); // 屏幕面向南侧使用者
      const dl = F.buildDeskLamp(); dl.position.set(9.35, 0.755, 4.30); dl.rotation.y = Math.PI * 0.9; dl.name = 'deskLampA'; a.add(dl);
      const books = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.16), F.MAT.paper);
      books.position.set(8.28, 0.84, 4.33); a.add(books);
      const chair = F.buildOfficeChair(); chair.position.set(8.85, 0, 5.05); chair.rotation.y = Math.PI + 0.08; tagUsage(chair, 8.85, 4.38); a.add(chair); // 正面朝桌（误差 <5°）
      const shelf = F.buildBookshelf(0.9, 1.8, 0.32); shelf.rotation.y = Math.PI / 2; shelf.position.set(6.85, 0, 6.45); tagUsage(shelf, 7.4, 6.45); a.add(shelf);
      const lounge = F.buildLoungeChair(); lounge.position.set(9.25, 0, 7.15); lounge.rotation.y = -Math.PI * 0.75; tagUsage(lounge, 8.6, 6.7); a.add(lounge);
      const fl = F.buildFloorLamp(); fl.position.set(8.45, 0, 7.45); fl.name = 'readLampA'; a.add(fl);
      const rugA = new THREE.Mesh(new THREE.CircleGeometry(0.75, 28),
        new THREE.MeshStandardMaterial({ color: 0xCFC6B8, roughness: 1 }));
      rugA.rotation.x = -Math.PI / 2; rugA.position.set(8.9, 0.013, 6.9); rugA.receiveShadow = true; a.add(rugA);
      styleTargets.rugWork = rugA.material;
      modeGroups.work = a;

      // B 朋友留宿：床 + 床头柜 + 小衣柜 + 阅读灯
      const b = new THREE.Group(); b.name = 'mode_guest';
      const bed = F.buildBed(1.0, 1.9); bed.rotation.y = -Math.PI / 2; // 床头朝 +x，靠东实体墙（南墙是窗，不压窗）
      bed.position.set(8.85, 0, 6.6); b.add(bed);                      // 床体 x 7.90–9.80 / z 6.10–7.10
      tagUsage(bed, 7.7, 6.6);
      const ns = F.buildNightstand(); ns.position.set(9.45, 0, 5.72); b.add(ns); // 床头一侧（北侧），不压窗
      tagUsage(ns, 9.0, 5.72);
      const tl2 = F.buildTableLamp(); tl2.position.set(9.45, 0.47, 5.72); tl2.name = 'guestLamp'; b.add(tl2);
      const ward = F.buildWardrobe(0.9, 0.55, 1.9, 2); ward.rotation.y = Math.PI / 2;
      ward.position.set(6.93, 0, 6.5); tagUsage(ward, 7.5, 6.5); b.add(ward);
      const rugB = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.4),
        new THREE.MeshStandardMaterial({ color: 0xC4B9A8, roughness: 1 }));
      rugB.rotation.x = -Math.PI / 2; rugB.position.set(8.30, 0.013, 5.70); rugB.receiveShadow = true; b.add(rugB);
      styleTargets.rugGuest = rugB.material;
      modeGroups.guest = b;

      // C 留给未来：儿童床 + 矮柜 + 学习桌 + 玩具
      const c = new THREE.Group(); c.name = 'mode_future';
      const kbed = F.buildKidBed(); kbed.rotation.y = -Math.PI / 2;      // 床头朝 +x，靠东实体墙（南墙是窗，不压窗）
      kbed.position.set(8.95, 0, 6.7); tagUsage(kbed, 7.9, 6.7); c.add(kbed); // 床体 x 8.05–9.85 / z 6.25–7.15
      const low = F.buildLowCabinet(1.2, 0.4, 0.8); low.rotation.y = Math.PI / 2;
      low.position.set(6.85, 0, 6.85); tagUsage(low, 7.5, 6.85); c.add(low);  // 靠西墙，正面朝房内
      const kdesk = F.buildDesk(1.0, 0.5, 0.58); kdesk.position.set(8.6, 0, 4.32); tagUsage(kdesk, 8.6, 4.95); c.add(kdesk); // 靠北隔墙
      const kchair = F.buildDiningChair(); kchair.scale.setScalar(0.8); kchair.position.set(8.6, 0, 4.95); kchair.rotation.y = Math.PI; tagUsage(kchair, 8.6, 4.35); c.add(kchair); // 正面朝桌
      const dl2 = F.buildDeskLamp(); dl2.position.set(8.95, 0.595, 4.30); dl2.rotation.y = Math.PI; c.add(dl2);
      const toys = F.buildToys(); toys.position.set(7.6, 0, 6.2); c.add(toys);
      const rugC = new THREE.Mesh(new THREE.CircleGeometry(0.7, 28),
        new THREE.MeshStandardMaterial({ color: 0xC9BFAF, roughness: 1 }));
      rugC.rotation.x = -Math.PI / 2; rugC.position.set(7.5, 0.013, 6.4); rugC.receiveShadow = true; c.add(rugC);
      styleTargets.rugFuture = rugC.material;
      modeGroups.future = c;
    }

    /* 每个模式的聚焦方向与关键家具（焦点 = 该模式的视觉中心） */
    const modeFocus = {
      work:   { keys: ['desk', 'officeChair', 'laptop', 'deskLampA'], dir: [-0.50, 0.86] },
      guest:  { keys: ['bed', 'nightstand', 'guestLamp'],             dir: [-0.75, -0.66] },
      future: { keys: ['bed', 'desk', 'diningChair', 'lowCabinet'],   dir: [-0.82, -0.57], fov: 58 },
    };

    return { modeGroups, modeFocus };
  },
};
