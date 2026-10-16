// 収束モード: 正規化とhash。純関数のみ。依存なし。
// canonicalize は「同じ内容なら同じ文字列」を返すための正規化。
// 変更するとfingerprintが全て変わるため、変更時は FINGERPRINT_VERSION を上げる。

export function canonicalize(value) {
  if (value === undefined || typeof value === 'function' || typeof value === 'symbol') return undefined;
  if (value === null) return null;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    if (Object.is(value, -0)) return 0;
    return Number.isInteger(value) ? value : Math.round(value * 1e6) / 1e6;
  }
  if (typeof value === 'string' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.map((item) => { const c = canonicalize(item); return c === undefined ? null : c; });
  if (typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) {
      const c = canonicalize(value[key]);
      if (c !== undefined) out[key] = c;
    }
    return out;
  }
  return undefined;
}

export function stableStringify(value) {
  const c = canonicalize(value);
  return JSON.stringify(c === undefined ? null : c);
}

// cyrb53系の2レーン(各32bit)で64bit相当のhex16桁。暗号用途ではない。
export function hash64(text) {
  const str = String(text);
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57, h3 = 0x9e3779b9, h4 = 0x85ebca6b;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ ch, 2246822519);
    h4 = Math.imul(h4 ^ ch, 3266489917);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  h3 = Math.imul(h3 ^ (h3 >>> 16), 2246822507) ^ Math.imul(h4 ^ (h4 >>> 13), 3266489909);
  h4 = Math.imul(h4 ^ (h4 >>> 16), 2246822507) ^ Math.imul(h3 ^ (h3 >>> 13), 3266489909);
  const hex = (n) => (n >>> 0).toString(16).padStart(8, '0');
  // 64bit = (h1^h3) と (h2^h4)
  return hex(h1 ^ h3) + hex(h2 ^ h4);
}

export function hashOf(value) { return hash64(stableStringify(value)); }
