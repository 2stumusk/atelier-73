/* =====================================================================
 * tour.js — 电影感导览播放器（F2）
 * 改动摘要：新增。串行调用外部 flyTo，每段飞完停留 1.2s。
 * 不在 dollhouse 时先等「回到立体」飞完，再进第一镜，避免从眼高穿墙。
 * 不持有场景对象；退出、相机、控件都由 main.js 注入。
 * ===================================================================== */

const HOLD = 1.2;          // 每段镜头落地后的停留
const CAPTION_OUT = 0.32;  // 停留末尾开始让字幕淡出，接下一镜

export function createTour(opts) {
  let active = false;
  let index = 0;
  let phase = 'fly';       // fly | hold
  let holdT = 0;
  let shots = [];

  function snapshot() {
    const touringShot = active && phase !== 'return';
    const showCaption = touringShot && (
      phase === 'hold' ? holdT < HOLD - CAPTION_OUT : opts.flyProgress() > 0.22
    );
    return {
      active,
      index: touringShot ? index : -1,
      count: shots.length,
      caption: touringShot ? shots[index].caption : '',
      showCaption,
    };
  }

  function emit() { opts.onChange(snapshot()); }

  function go(i) {
    index = i;
    phase = 'fly';
    holdT = 0;
    const s = shots[i];
    opts.flyTo(s.pos, s.tgt, s.dur == null ? 1.8 : s.dur);
    emit();
  }

  function start() {
    shots = (opts.getShots() || []).slice();
    if (!shots.length) return false;
    if (opts.blocked && opts.blocked()) return false;
    /* 漫游 / 剖切 / 俯视先切回 dollhouse。active 要在这次调用之后才置位，
     * 否则 setViewMode 里的「导览中则退出」会把刚开始的导览立刻停掉。
     * 回到立体的飞行动画走完再进第一镜，避免从眼高直线穿墙。 */
    const fromDollhouse = opts.getViewMode() === 'dollhouse';
    if (!fromDollhouse) opts.setViewMode('dollhouse');
    opts.setArranging(false);
    opts.setControls(false);
    active = true;
    opts.onActive(true);
    if (fromDollhouse) go(0);
    else { index = 0; phase = 'return'; holdT = 0; emit(); }
    return true;
  }

  function stop() {
    if (!active) return;
    active = false;
    opts.cancelFly();
    opts.restoreView();
    opts.setControls(opts.getViewMode() !== 'interior');
    opts.onActive(false);
    emit();
  }

  function update(dt) {
    if (!active) return;
    if (phase === 'return') {
      if (!opts.isFlying()) go(0);
      else emit();
      return;
    }
    if (phase === 'fly') {
      if (!opts.isFlying()) { phase = 'hold'; holdT = 0; }
      emit();
      return;
    }
    holdT += dt;
    if (holdT >= HOLD) {
      if (index >= shots.length - 1) { stop(); return; }
      go(index + 1);
      return;
    }
    emit();
  }

  return {
    start, stop, update,
    isActive: () => active,
  };
}
