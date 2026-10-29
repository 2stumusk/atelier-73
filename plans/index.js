/* =====================================================================
 * plans/index.js — 户型注册表，按 ?plan= 查询参数选择
 * ===================================================================== */
import plan73 from './plan73.js';
import plan45 from './plan45.js';
import plan96 from './plan96.js';

export const PLANS = [plan73, plan45, plan96];

export function pickPlan() {
  const id = new URLSearchParams(location.search).get('plan');
  return PLANS.find(p => p.id === id) || plan73;
}
