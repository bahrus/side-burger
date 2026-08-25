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

## Bruce's Response I

Based on your feedback, [declarative support has been added to the swipe-dismiss feature](https://github.com/bahrus/swipe-dismiss#declarative-callbacks).

Please see if we can get to our no-code goal now.

---

## Kimi's Implementation Notes II

Updated the config to use the new declarative `customData.assign` callback support. The drawer can now be swiped to dismiss without any imperative JavaScript.

### Changes made

- `el-maker.mjs` — wired the three swipe callbacks declaratively inside `swipeDismiss.customData.assign`:
  - `onProgress`: disables the drawer CSS transition and sets `drawer.style.transform = translateX(${deltaPx}px)` from `progressState.deltaPx`.
  - `onCommit`: sets host `open = false` and clears the inline transform/transition.
  - `onCancel`: clears the inline transform/transition so the CSS transition snaps the drawer back.
  - `assignOptions.withMethods: ['querySelector']` enables shadow-DOM `querySelector` calls in the callback paths.
- `root.html` — added host pointer-event handling so swipe gestures are captured correctly when the drawer is open:
  - `:host { pointer-events: none; }` — host ignores pointer events while closed.
  - `:host([open]) { pointer-events: auto; }` — host becomes the swipe handle when open.
  - `.hamburger { pointer-events: auto; }` — hamburger button remains clickable when closed.
  - Kept the previously added `touch-action: none` on `.drawer`/`.drag-handle` and the `[data-dragging]` transition rule.
- `el-maker.json` — regenerated.

### How it works at runtime

1. The `swipeDismiss` feature is spawned when `<side-burger>` connects.
2. Because `handleSelector` and `panelSelector` are not configured, the feature uses the host element as both handle and panel.
3. When the drawer is open, pointer events on the overlay/drawer (in the shadow DOM) retarget to the host, triggering the swipe tracking.
4. During the drag, `onProgress` declaratively transforms the shadow drawer.
5. On commit, `onCommit` declaratively sets `open = false`, which roundabout turns into `aria-hidden="true"`, `inert`, and the CSS close transition.
6. On cancel, `onCancel` removes the inline transform, letting the CSS transition snap the drawer back open.

### Known limitations / things to verify

- **Panel size is the host width, not the drawer width.** Because `SwipeDismissFeature` uses `host.querySelector` for `handleSelector`/`panelSelector`, it cannot reach inside the shadow DOM. The fallback is to measure the host element, which is `display: block` and therefore full-width. This means `distanceThreshold` is currently relative to viewport width, not drawer width. On a typical phone that makes the commit distance ~40% of the screen (~150px). A fast flick still commits via `velocityThreshold`.
- **Right-side drawers.** A drawer with `position="right"` should set `swipe-dismiss-direction="-1"` so the swipe direction points toward the right edge. The default `direction="1"` is correct for the default `position="left"`.
- **Manual testing still needed.** There are no Playwright tests in this repo yet, so I verified only that `node el-maker.mjs` succeeds and `npm run serve` serves `demo/dev.html` without errors. The actual gesture behavior needs to be exercised in a browser.

### Verification

- `node el-maker.mjs` completed successfully.
- `npm test` reports no tests exist (expected).
- `node node_modules/spa-ssi/serve.js` serves `demo/dev.html`; the page loads and the JSON config is referenced correctly.

## Bruce's Response II

This is probably an issue with the swipe-dismiss feature, but I found that with the feature enabled (with all the settings), clicking on the hamburger menu doesn't open the drawer.  Commenting it out, it opens again.

Any theories?  I will probably bring in el-maker source code so we can add console.log's, but that's a little bit of work I want to avoid if an explanation is clear tou you just by inspecting the code?

---

## Kimi's Implementation Notes III

I have a theory and a fix.

### Theory: pointer capture on the host redirects the hamburger click

When `handleSelector`/`panelSelector` are not configured, `SwipeDismissFeature` falls back to the host element as the drag handle. It attaches a `pointerdown` listener to the host and calls `handle.setPointerCapture(event.pointerId)` on every `pointerdown`.

The hamburger button lives inside the shadow DOM. A click on the button starts as a `pointerdown` on the button, but because the feature captures the pointer on the **host**, the browser routes the subsequent `pointerup` — and the synthesized `click` — to the host instead of the button. Roundabout's `on_click_of_hamburgerButton_assign` compact never fires, so the drawer doesn't open.

### Fix: make the feature resolve selectors against the shadow root too

I locally patched `node_modules/el-maker/swipe-dismiss/SwipeDismissFeature.js` so that `#resolveHandle` and `#resolvePanel` fall back to `host.shadowRoot.querySelector(...)` when the light-DOM query misses:

```js
#resolveHandle(host) {
    if (this.handleSelector) {
        return host.querySelector(this.handleSelector)
            ?? host.shadowRoot?.querySelector(this.handleSelector)
            ?? null;
    }
    return host;
}

#resolvePanel(handle) {
    const host = this.#host;
    if (!host) return null;
    if (this.panelSelector) {
        return host.querySelector(this.panelSelector)
            ?? host.shadowRoot?.querySelector(this.panelSelector)
            ?? null;
    }
    return handle;
}
```

Then I updated `el-maker.mjs` to point the handle/panel at the shadow-DOM drawer by default:

```js
_handleSelector: { mapsTo: 'handleSelector', valIfNull: '[name=drawer]' },
_panelSelector:  { mapsTo: 'panelSelector',  valIfNull: '[name=drawer]' },
```

I also removed the `:host { pointer-events: none }` workaround from `root.html` because it is no longer needed.

### Why this should solve both problems

- **Hamburger click:** The drag handle is now the drawer, not the host. Pointer capture happens on the drawer, so a click on the hamburger button is no longer captured and redirected. The button's `click` event should reach roundabout normally.
- **Swipe-to-dismiss:** The drawer itself is the handle and panel. Panel size is now the drawer width, so `distanceThreshold` is relative to the drawer (e.g. 40% of 280px ≈ 112px). The declarative `onProgress`/`onCommit`/`onCancel` callbacks still apply the transform to the same drawer element.

### Caveat: local node_modules patch is temporary

The change to `SwipeDismissFeature.js` is in `node_modules/el-maker/swipe-dismiss/SwipeDismissFeature.js`. It will be overwritten by the next `npm install`. The proper fix is to apply the same two-line shadow-root fallback in the el-maker/swipe-dismiss source and publish a new version.

### Verification so far

- `node el-maker.mjs` succeeds and `el-maker.json` includes the updated `swipeDismiss` config.
- `node node_modules/spa-ssi/serve.js` serves `demo/dev.html` without errors.
- I did not run an actual browser test because Playwright browsers are not installed in this environment and the project has no tests yet. Manual confirmation in a browser is still needed. 

## Bruce's Response III

Unfortunately, the drawer still doesn't open.  Feel free to add console.log's to the node_modules folder swipe-dismiss if that helps, or other folders (as long as you can pull them back)

Any theories?  I will probably bring in el-maker source code so we can add console.log's, but that's a little bit of work I want to avoid if an explanation is clear tou you just by inspecting the code?

---

## Kimi's Implementation Notes IV

I instrumented the feature and ran a Playwright browser test. Two separate issues surfaced.

### Issue 1: `withAttrs` defaults were not being applied

My original `withAttrs` config only had `_handleSelector` and `_panelSelector` keys:

```js
_handleSelector: { mapsTo: 'handleSelector', valIfNull: '[name=drawer]' }
```

`assign-gingerly/parseWithAttrs.js` skips underscore-prefixed keys in its first pass; those keys are only read as the **config** for the corresponding non-underscore key. Without `handleSelector: '${base}-handle'` present, the attribute was never processed and `valIfNull` was ignored. The constructor received empty `initVals`, so `handleSelector`/`panelSelector` stayed `null` and the host was used as the handle.

**Fix:** add the non-underscore template entries:

```js
handleSelector: '${base}-handle',
_handleSelector: { mapsTo: 'handleSelector', valIfNull: '[name=drawer]' },
panelSelector: '${base}-panel',
_panelSelector: { mapsTo: 'panelSelector', valIfNull: '[name=drawer]' },
```

After this fix, the feature resolves the shadow-DOM drawer as both handle and panel, and the hamburger click opens the drawer again.

### Issue 2: `builtIns.join` handler fails to load

The declarative `onProgress` assignment uses `do: 'builtIns.join'` to build `translateX(${deltaPx}px)`. That handler is loaded dynamically, but `assign-gingerly/processHandlerCommands.js` stores relative paths:

```js
'builtIns.join': './handlers/join.js'
```

The actual dynamic `import()` happens inside `utils/findClassPrototypeInPath.js`, so the browser resolves `./handlers/join.js` relative to `utils/` and requests `/node_modules/assign-gingerly/utils/handlers/join.js` (404).

**Local fix:** change the built-in map entries to import-map specifiers:

```js
'builtIns.join': 'assign-gingerly/handlers/join.js'
```

This makes `isAllowedImportPath` accept the specifier and the browser fetch `/node_modules/assign-gingerly/handlers/join.js`.

### Verified behavior

I added a temporary Playwright script that:

1. Opens `demo/dev.html`.
2. Clicks the hamburger button → drawer opens (`aria-hidden="false"`, `inert=false`).
3. Drags the drawer 80% of its width to the right → drawer closes (`open=false`, `aria-hidden="true"`, `inert=true`).

Both the click-to-open and swipe-to-close paths work after the two fixes above.

### Remaining work (temporary node_modules patches)

The two node_modules edits I made are not permanent:

1. **`node_modules/el-maker/swipe-dismiss/SwipeDismissFeature.js`** — shadow-root fallback in `#resolveHandle`/`#resolvePanel`.
2. **`node_modules/assign-gingerly/processHandlerCommands.js`** — import-map specifiers in `BUILT_IN_MAP`.

These need to be applied in the upstream packages before the next `npm install`, otherwise the drawer will stop opening again.

## Bruce's Response IV

The drawer opens now, but swiping has no affect.  When I try to swipe the open drawer to the left, I see the content behind the drawer (greyed out) drag a little.

Feel free, again, to add console.log's where needed, an I'm happty to test it and report the console.log's.