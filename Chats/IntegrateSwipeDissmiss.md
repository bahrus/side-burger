# Integrate Swipe Dismiss

## Bruce's Ask

el-maker now supports the [swipe-dismiss](https://github.com/bahrus/swipe-dismiss)

Can you add the necessary support to el-maker.mjs?  I have the build running in the background.

Please add your implementation notes below, or if clarity needed first, what needs clarifying.

---

## Kimi's Implementation Notes

Added swipe-dismiss support to the declarative ElementMaker configuration.

### Changes made

- `types/el-maker/types.d.ts` — added `swipeDismiss?: { spawn?: string, customData?: any, withAttrs?: AttrPatterns<any> }` to `ElMakerConfig.assignFeatures` so the config type-checks.
- `el-maker.mjs` — added a `swipeDismiss` feature entry with `withAttrs` for declarative configuration:
  - `swipe-dismiss-axis` → `axis`
  - `swipe-dismiss-direction` → `direction`
  - `swipe-dismiss-handle` → `handleSelector`
  - `swipe-dismiss-panel` → `panelSelector`
  - `swipe-dismiss-distance-threshold` → `distanceThreshold` (parsed as Number, default 0.4)
  - `swipe-dismiss-velocity-threshold` → `velocityThreshold` (parsed as Number, default 0.5)
- `root.html` — prepared the drawer for gesture handling:
  - Added `touch-action: none` to `.drawer`
  - Added a `.drawer[data-dragging]` rule to disable the transition while dragging
  - Added a `.drag-handle` element and part on the drawer edge with `touch-action: none`
  - Added mirrored right-side handle styling for `position="right"`
- `el-maker.json` — regenerated with `node el-maker.mjs`.

### What still needs to be wired for the swipe to actually dismiss the drawer

The `SwipeDismissFeature` in `node_modules/el-maker/swipe-dismiss/SwipeDismissFeature.js` is intentionally decoupled from rendering: it computes the gesture and calls `onProgress`, `onCommit`, and `onCancel` callbacks on the spawned feature instance. Those callbacks are what must:

1. Apply a visual translation during the drag (e.g. `drawer.style.transform = translateX(...)` or set a CSS custom property).
2. Set `open = false` when the gesture commits.
3. Reset the transform when the gesture is cancelled.

Because `el-maker.json` is JSON consumed by the `cede`/`precede` script, it cannot serialize function values. I do not see a declarative way in the current el-maker/roundabout config to register those three callbacks.

### Additional blocker: shadow-DOM query scope

`SwipeDismissFeature.#resolveHandle(host)` and `#resolvePanel(handle)` use `host.querySelector(this.handleSelector)` / `host.querySelector(this.panelSelector)`. `querySelector` does not cross shadow boundaries, so selectors like `[part="drawer"]` or `[name="drawer"]` inside the `side-burger` shadow root will not match from the feature.

For a side drawer whose panel lives in the shadow DOM, the feature either needs to query the shadow root (`host.shadowRoot.querySelector(...)`) or the panel/handle must be reachable from the light DOM.

### Clarifying question

What is the intended way to wire `SwipeDismissFeature`'s `onProgress`/`onCommit`/`onCancel` callbacks in a fully declarative, JSON-driven side-burger config? Two possibilities come to mind:

1. **Event-dispatching version:** Enhance `SwipeDismissFeature` to dispatch events (e.g. `swipe-progress`, `swipe-commit`, `swipe-cancel`) on the host, then wire `roundabout` compacts to listen for those events.
2. **Small bridge feature:** Add a local side-burger feature that wraps `SwipeDismissFeature`, queries the shadow DOM, sets the callbacks, and updates `open`/CSS directly.

Which direction should I take?