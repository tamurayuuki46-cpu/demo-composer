# Sound preservation implementation

Arrangement Lab `preview.js` resolves the original Demo Composer Sound Sketch from `source.sourceSnapshot.instruments`.

Part mapping:

- `harmony` → Demo Composer `chord`
- `melody` → Demo Composer `melody`
- `counter` → Demo Composer `melody` with reduced gain
- `bass` → Demo Composer `bass`
- `drums` → Demo Composer-compatible simple drum synthesis

If `sourceSnapshot.instruments` is absent, `resolveSoundProfile` supplies Demo Composer defaults.

No SongProject schema change is required because Demo Composer already preserves the source Project under `compatibility.demoComposer.legacyProject` and `songProjectToDemoProject` restores its `instruments` array.
