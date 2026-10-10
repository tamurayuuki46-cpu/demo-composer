// CSSの { } の数が合っているか確認する。
// 括弧が1つ欠けると、そのあとに書いたルールが全部効かなくなるため（マージ時の取り違えで起きやすい）。
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function cssFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return cssFiles(path);
    return path.endsWith(".css") ? [path] : [];
  });
}

const files = cssFiles("src");
assert.ok(files.length > 0);
for (const file of files) {
  const text = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const open = (text.match(/\{/g) ?? []).length;
  const close = (text.match(/\}/g) ?? []).length;
  assert.equal(open, close, `${file}: { が ${open} 個、} が ${close} 個で合っていません`);
}

console.log(`css balance test passed (${files.length} files)`);
