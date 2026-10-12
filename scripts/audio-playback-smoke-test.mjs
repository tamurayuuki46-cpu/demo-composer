import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/audio/demo-player.js", import.meta.url), "utf8");

assert.match(
  source,
  /const PERCUSSION_ATTACK_SECONDS = 0\.003;/,
  "percussion needs a short anti-click attack"
);

const kickBlock = source.match(/function scheduleKick[\s\S]*?\n}\n\nfunction scheduleNoiseHit/)?.[0] ?? "";
assert.match(kickBlock, /setValueAtTime\(0\.0001, startTime\)/, "kick must start near silence");
assert.match(
  kickBlock,
  /linearRampToValueAtTime\(0\.34, startTime \+ PERCUSSION_ATTACK_SECONDS\)/,
  "kick must ramp into its transient"
);
assert.doesNotMatch(
  kickBlock,
  /setValueAtTime\(0\.34, startTime\)/,
  "kick must not jump directly to full gain"
);

const noiseBlock = source.match(/function scheduleNoiseHit[\s\S]*?\n}\n\n\/\/ buses:/)?.[0] ?? "";
assert.match(noiseBlock, /setValueAtTime\(0\.0001, startTime\)/, "noise hit must start near silence");
assert.match(
  noiseBlock,
  /linearRampToValueAtTime\(gainAmount, attackEnd\)/,
  "noise hit must ramp into its transient"
);
assert.match(
  noiseBlock,
  /exponentialRampToValueAtTime\(0\.0001, startTime \+ duration\)/,
  "noise hit must still fade out to near silence"
);
assert.doesNotMatch(
  noiseBlock,
  /setValueAtTime\(gainAmount, startTime\)/,
  "noise hit must not start at an arbitrary full-amplitude sample"
);

console.log("Audio playback anti-click smoke test passed");
