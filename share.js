/* =====================================================================
 * share.js — 方案分享链接（F4）
 * 改动摘要：新增。把 { p, st, m, L } 编成 URL hash `#s=` + base64url。
 * L 为布局快照；老数据若是平铺 map（没有 moved/added/removedKeys），
 * 读取时按 moved 处理，避免旧 localStorage 把页面打崩。
 * ===================================================================== */

/* UTF-8 安全的 base64url（btoa 只接受 Latin1） */
export function encodeShare(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

/* 解析 location.hash。非法、缺字段时返回 null，调用方保持默认方案。 */
export function decodeShare(hash) {
  if (!hash || hash.indexOf('#s=') !== 0) return null;
  try {
    let s = hash.slice(3).replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    const bin = atob(s);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const obj = JSON.parse(new TextDecoder().decode(bytes));
    if (!obj || typeof obj !== 'object' || typeof obj.p !== 'string') return null;
    return obj;
  } catch (e) {
    return null;
  }
}

/* 统一成 { moved, added, removedKeys }。
 * 老格式是 { "shared:sofa:1": [x,z,ry], ... }，没有 moved 字段。 */
export function normalizeLayout(data) {
  const empty = { moved: {}, added: [], removedKeys: [] };
  if (!data || typeof data !== 'object' || Array.isArray(data)) return empty;
  const modern = ('moved' in data) || ('added' in data) || ('removedKeys' in data);
  if (!modern) return { moved: data, added: [], removedKeys: [] };
  const moved = (data.moved && typeof data.moved === 'object' && !Array.isArray(data.moved)) ? data.moved : {};
  const added = Array.isArray(data.added) ? data.added : [];
  const removedKeys = Array.isArray(data.removedKeys) ? data.removedKeys.filter(k => typeof k === 'string') : [];
  return { moved, added, removedKeys };
}
