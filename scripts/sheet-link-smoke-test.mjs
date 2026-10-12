import assert from "node:assert/strict";
import { loadSheetLink, normalizeSheetLink, saveSheetLink, sheetLinkHtml } from "../src/hub/sheet-link.js";

const store = new Map();
const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) };

assert.equal(normalizeSheetLink(""), null);
assert.equal(normalizeSheetLink("http://claude.ai/artifact/abc"), null);
assert.equal(normalizeSheetLink("https://evil.example/claude.ai"), null);
assert.equal(normalizeSheetLink("javascript:alert(1)"), null);
assert.equal(normalizeSheetLink("https://claude.ai.evil.example/x"), null);
assert.match(normalizeSheetLink("  https://claude.ai/artifact/A7Fm#c753 "), /^https:\/\/claude\.ai\/artifact\/A7Fm#c753$/);

assert.equal(loadSheetLink(storage), null);
saveSheetLink("https://claude.ai/artifact/xyz", storage);
assert.equal(loadSheetLink(storage), "https://claude.ai/artifact/xyz");
saveSheetLink("not a link", storage);
assert.equal(loadSheetLink(storage), null);

assert.match(sheetLinkHtml("https://claude.ai/artifact/xyz"), /target="_blank" rel="noopener noreferrer"/);
assert.doesNotMatch(sheetLinkHtml(null), /sheet-link-open/);
console.log("sheet link smoke test passed.");
