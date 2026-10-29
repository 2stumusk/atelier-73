/* =====================================================================
 * plans/plan-image.js — 由户型数据程序化绘制 2D 户型图（无 PNG 资产时使用）
 * 输出 4:3 左右的 canvas：房间底色 + 墙体粗线 + 门窗开口 + 房间名 + 总尺寸
 * ===================================================================== */

export function drawPlan2D(config) {
  const { PLAN, WALLS, DOORS, ROOMS, kicker } = config;
  const W = 1280, H = Math.round(W * (PLAN.D + 2.4) / (PLAN.W + 2.4));
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const pad = 90;                                  // 图纸留白（含尺寸线）
  const scale = Math.min((W - pad * 2) / PLAN.W, (H - pad * 2) / PLAN.D);
  const X = (x) => pad + x * scale, Z = (z) => pad + z * scale;

  ctx.fillStyle = '#FBFAF6'; ctx.fillRect(0, 0, W, H);

  // 房间底色
  for (const r of ROOMS) {
    ctx.beginPath();
    r.poly.forEach(([x, z], i) => i ? ctx.lineTo(X(x), Z(z)) : ctx.moveTo(X(x), Z(z)));
    ctx.closePath();
    ctx.fillStyle = r.floor === 'tile' ? '#EFEDE7' : '#F4F0E6';
    ctx.fill();
  }

  // 墙体（开口处分段；门留空，窗画双线）
  ctx.lineCap = 'butt';
  for (const w of WALLS) {
    const ops = [...(w.openings || [])].sort((p, q) => p.a - q.a);
    const lw = Math.max(4, w.t * scale);
    const seg = (a0, a1, y0, y1) => {
      // y0/y1 用于跳过门扇区间以外的部分：这里只画整段，开口由调用方切开
      if (a1 - a0 < 0.01) return;
      ctx.strokeStyle = '#3A352E'; ctx.lineWidth = lw;
      ctx.beginPath();
      if (w.axis === 'x') { ctx.moveTo(X(a0), Z(w.c)); ctx.lineTo(X(a1), Z(w.c)); }
      else { ctx.moveTo(X(w.c), Z(a0)); ctx.lineTo(X(w.c), Z(a1)); }
      ctx.stroke();
    };
    let cursor = w.from;
    for (const op of ops) {
      seg(cursor, op.a);
      if (op.kind === 'window') {
        // 窗：墙线断开，画两条细线表示玻璃窗
        ctx.strokeStyle = '#8A8478'; ctx.lineWidth = 2;
        for (const off of [-w.t * 0.28, w.t * 0.28]) {
          ctx.beginPath();
          if (w.axis === 'x') { ctx.moveTo(X(op.a), Z(w.c + off)); ctx.lineTo(X(op.b), Z(w.c + off)); }
          else { ctx.moveTo(X(w.c + off), Z(op.a)); ctx.lineTo(X(w.c + off), Z(op.b)); }
          ctx.stroke();
        }
      }
      cursor = op.b;
    }
    seg(cursor, w.to);
  }

  // 门：1/4 圆弧 + 门板线
  ctx.strokeStyle = '#8A8478'; ctx.lineWidth = 2;
  for (const d of DOORS) {
    const [px, pz] = d.pivot;
    ctx.beginPath();
    ctx.arc(X(px), Z(pz), d.w * scale, 0, Math.PI / 2);
    ctx.stroke();
  }

  // 房间名
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const r of ROOMS) {
    ctx.fillStyle = '#3A352E';
    ctx.font = '600 26px "Songti SC", "Noto Serif SC", serif';
    ctx.fillText(r.name, X(r.label[0]), Z(r.label[1]) - 10);
    if (r.size) {
      ctx.fillStyle = '#8A8478';
      ctx.font = '17px system-ui, sans-serif';
      ctx.fillText(r.size.split('·')[0].trim(), X(r.label[0]), Z(r.label[1]) + 18);
    }
  }

  // 总尺寸线
  ctx.strokeStyle = '#8A8478'; ctx.fillStyle = '#6B655A'; ctx.lineWidth = 1.5;
  ctx.font = '18px system-ui, sans-serif';
  const dimY = pad - 34;
  ctx.beginPath(); ctx.moveTo(X(0), dimY); ctx.lineTo(X(PLAN.W), dimY); ctx.stroke();
  ctx.fillText(String(Math.round(PLAN.W * 1000)), X(PLAN.W / 2), dimY - 16);
  const dimX = pad - 34;
  ctx.beginPath(); ctx.moveTo(dimX, Z(0)); ctx.lineTo(dimX, Z(PLAN.D)); ctx.stroke();
  ctx.save(); ctx.translate(dimX - 16, Z(PLAN.D / 2)); ctx.rotate(-Math.PI / 2);
  ctx.fillText(String(Math.round(PLAN.D * 1000)), 0, 0); ctx.restore();

  // 图签
  ctx.textAlign = 'left'; ctx.fillStyle = '#6B655A';
  ctx.font = '600 20px system-ui, sans-serif';
  ctx.fillText(kicker.replace(/·/g, '/'), pad, H - 34);
  return c;
}
