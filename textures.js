/* textures.js — 程序化 CanvasTexture 材质（零外部资源，可复现） */
import * as THREE from 'three';

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvasTex(size, draw, { srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* 木地板：一块纹理 = 2.4m × 2.4m，板宽 0.12m，工字拼。颜色由风格预设注入。 */
export function makeWoodFloor({ base = '#C7A77A', tone = [199, 167, 122], grain = 'rgba(120,90,55,A)', seam = 'rgba(90,65,40,0.55)' } = {}) {
  const rand = mulberry32(7101);
  return canvasTex(1024, (ctx, S) => {
    const pxPerM = S / 2.4;
    const plankW = 0.12 * pxPerM;          // 板宽
    const plankL = 0.90 * pxPerM;          // 板长
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, S, S);
    const rows = Math.ceil(S / plankW);
    for (let r = 0; r < rows; r++) {
      const y = r * plankW;
      const offset = (r % 2) * plankL * 0.5 + rand() * plankL * 0.3;
      for (let x = -plankL; x < S + plankL; x += plankL) {
        const x0 = x + offset;
        const t = 0.90 + rand() * 0.18;                    // 每块板明度差异
        const c = [tone[0] * t, tone[1] * t, tone[2] * t];
        ctx.fillStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
        ctx.fillRect(x0, y, plankL, plankW);
        // 木纹：几条深浅不一的纵向流线
        for (let g = 0; g < 5; g++) {
          const gy = y + rand() * plankW;
          ctx.strokeStyle = grain.replace('A', (0.05 + rand() * 0.10).toFixed(3));
          ctx.lineWidth = 1 + rand() * 1.5;
          ctx.beginPath();
          ctx.moveTo(x0, gy);
          for (let sx = 0; sx <= plankL; sx += plankL / 6) {
            ctx.lineTo(x0 + sx, gy + (rand() - 0.5) * 3);
          }
          ctx.stroke();
        }
        // 板缝
        ctx.strokeStyle = seam;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(x0 + 0.5, y + 0.5, plankL - 1, plankW - 1);
      }
    }
  });
}

/* 瓷砖（厨房 / 卫生间）：一块纹理 = 1.2m × 1.2m，600×600 砖。颜色由风格预设注入。 */
export function makeTileFloor({ base = '#B9B4AB', tone = [188, 183, 173], vein = 'rgba(140,135,125,A)' } = {}) {
  const rand = mulberry32(8864);
  return canvasTex(512, (ctx, S) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, S, S);
    const tile = S / 2;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const t = 0.96 + rand() * 0.07;
      ctx.fillStyle = `rgb(${tone[0] * t | 0},${tone[1] * t | 0},${tone[2] * t | 0})`;
      ctx.fillRect(i * tile + 2, j * tile + 2, tile - 4, tile - 4);
      // 细腻石纹
      for (let g = 0; g < 7; g++) {
        ctx.strokeStyle = vein.replace('A', (0.05 + rand() * 0.06).toFixed(3));
        ctx.lineWidth = 1 + rand() * 2;
        ctx.beginPath();
        const y0 = j * tile + rand() * tile;
        ctx.moveTo(i * tile, y0);
        ctx.bezierCurveTo(i * tile + tile * 0.3, y0 + (rand() - 0.5) * 20,
                          i * tile + tile * 0.7, y0 + (rand() - 0.5) * 20,
                          i * tile + tile, y0 + (rand() - 0.5) * 12);
        ctx.stroke();
      }
    }
  });
}

/* 织物（沙发 / 床品）：细密布纹 */
export function makeFabric(base = '#B7B1A8') {
  const rand = mulberry32(3301);
  return canvasTex(256, (ctx, S) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, S, S);
    for (let i = 0; i < S; i += 2) {
      ctx.strokeStyle = `rgba(80,75,68,${0.03 + rand() * 0.05})`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(S, i); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, S); ctx.stroke();
    }
    for (let n = 0; n < 900; n++) {
      ctx.fillStyle = `rgba(255,252,245,${rand() * 0.06})`;
      ctx.fillRect(rand() * S, rand() * S, 1.5, 1.5);
    }
  });
}

/* 地毯：纯色 + 内边框 */
export function makeRug(base = '#A89E8F', border = '#8C8375') {
  return canvasTex(256, (ctx, S) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, S, S);
    const rand = mulberry32(51);
    for (let n = 0; n < 2600; n++) {
      ctx.fillStyle = `rgba(70,62,52,${rand() * 0.08})`;
      ctx.fillRect(rand() * S, rand() * S, 1.6, 1.6);
    }
    ctx.strokeStyle = border;
    ctx.lineWidth = 10;
    ctx.strokeRect(14, 14, S - 28, S - 28);
  });
}

/* 墙面：近白 + 极轻颗粒，避免纯白塑料感 */
export function makeWallTex(base = '#EDE9E1') {
  const rand = mulberry32(9207);
  return canvasTex(256, (ctx, S) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, S, S);
    for (let n = 0; n < 1800; n++) {
      ctx.fillStyle = `rgba(148,140,124,${rand() * 0.075})`;
      ctx.fillRect(rand() * S, rand() * S, 1.4, 1.4);
    }
  });
}

/* 接触阴影：径向渐变的柔和暗斑，贴地增强家具落地感（轻量 AO） */
export function makeContactShadow() {
  const tex = canvasTex(256, (ctx, S) => {
    const g = ctx.createRadialGradient(S / 2, S / 2, S * 0.05, S / 2, S / 2, S * 0.5);
    g.addColorStop(0, 'rgba(45,40,34,0.85)');
    g.addColorStop(0.55, 'rgba(45,40,34,0.38)');
    g.addColorStop(1, 'rgba(45,40,34,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
  });
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
