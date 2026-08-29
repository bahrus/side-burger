# Close Button Not Closing

## Bruce's Ask

Somewhere along the line (maybe from the get-go, I can't say for sure), the close button stopped responding to mouse clicks. If I tap it with my finger on my touch screen, it closes the drawer.  But clicking with a mouse, nothing happenns (and the value of "open" remains true).

Can you please fix this?

---

## Claude's Diagnosis & Fix

### Root cause

`SwipeDismissFeature` (now `node_modules/el-maker/swipe-dismiss/SwipeDismissFeature.js`,
v0.0.25) called `handle.setPointerCapture(event.pointerId)` **unconditionally in
`#onPointerDown`**. The handle is the `#drawer`, and the close button lives
inside it, so:

1. `pointerdown` on the close button bubbles to the drawer's listener.
2. The drawer immediately captures the pointer.
3. The following `pointerup` is retargeted to the drawer (the capture target),
   so `pointerdown`-target (button) ≠ `pointerup`-target (drawer).
4. The browser fires `click` on their common ancestor — the drawer — not the
   button. `on_click_of_closeButton_assign` never runs, `open` stays `true`.

Touch "worked" only because the compatibility-click path after a tap is more
lenient about implicit capture than a real mouse click; the eager capture was
wrong either way. The same bug also swallowed mouse clicks on the slotted menu
links.

### Fix: lazy drag start (no capture until the gesture actually moves)

`#onPointerDown` now just records the press. `#onPointerMove` promotes it to a
real drag — and *only then* calls `setPointerCapture` — once the pointer has
travelled past an 8px slop in the dismiss direction. If the pointer is released
before that (a click/tap), the feature tears down silently and the native
`click` proceeds to whatever was pressed. A cross-axis move that beats the
along-axis move first is treated as a scroll and the gesture is abandoned.

This fixes clicks on **every** control inside the panel, not just the close
button, and also stops tap micro-jitter from starting an accidental drag.

### Verified (headless Chromium, `spa-ssi` serve, `demo/dev.html`)

| scenario | result |
|---|---|
| open, then **mouse-click** the close button | drawer closes, `open` → `false` ✓ |
| open, press close button + 3px wiggle, release | still closes ✓ |
| open, 220px horizontal swipe on the drawer | still dismisses ✓ (no regression) |
| open, ~32px slow drag then release | snaps back, stays open ✓ |
| open, mouse-click a slotted menu link | navigates (`#about`), not swallowed ✓ |
| console | clean in every case ✓ |

### This is a `node_modules` edit — must go upstream

Same situation as the earlier swipe fixes: the change is in
`node_modules/el-maker/swipe-dismiss/SwipeDismissFeature.js` and will be lost on
the next `npm install`. Apply it to the `swipe-dismiss` source, publish, and
re-bundle into `el-maker`. Patch:

```diff
@@ class SwipeDismissFeature @@
+    /**
+     * Movement (px) along the axis, in the dismiss direction, required before a
+     * pointerdown is treated as a drag. Below this a press is left alone so the
+     * native `click` still reaches whatever was pressed (close buttons, links,
+     * etc. inside the panel).
+     * @type {number}
+     */
+    #slop = 8;
+
     /**
      * Current drag state.
      * @typedef {Object} DragState
      * @property {number} pointerId
+     * @property {boolean} active - false until movement passes #slop; while
+     *   false no pointer capture is held and no progress is reported
      * @property {number} start - start coordinate along the active axis
+     * @property {number} startCross - start coordinate along the other axis
      * @property {number} startTime
      * @property {number} size - panel size along the active axis
      * @property {Element} handle
      */
@@ #onPointerDown @@
         this.#endDrag();

+        // Record the press but do NOT capture the pointer or treat it as a drag
+        // yet. Capturing on pointerdown would retarget the follow-up
+        // pointerup/click to the panel, so a mouse click on a control inside the
+        // panel (e.g. a close button) would never fire. Capture is deferred to
+        // #onPointerMove, once movement passes #slop.
         this.#dragState = {
             pointerId: event.pointerId,
+            active: false,
             start: this.axis === 'x' ? event.clientX : event.clientY,
+            startCross: this.axis === 'x' ? event.clientY : event.clientX,
             startTime: performance.now(),
             size,
             handle,
         };

-        handle.setPointerCapture(event.pointerId);
-
         this.#dragAbort = new AbortController();
@@ #onPointerMove (top) @@
         const current = this.axis === 'x' ? event.clientX : event.clientY;
+
+        if (!state.active) {
+            const cross = (this.axis === 'x' ? event.clientY : event.clientX) - state.startCross;
+            const along = this.#applyDirection(current - state.start);
+
+            // Cross-axis movement wins first → this is a scroll, not a dismiss.
+            if (Math.abs(cross) > this.#slop && Math.abs(cross) > Math.abs(along)) {
+                this.#endDrag();
+                return;
+            }
+            // Not enough movement in the dismiss direction yet — leave the
+            // press alone (a click can still happen on pointerup).
+            if (along <= this.#slop) return;
+
+            // Threshold crossed: promote to a real drag. Capture now, and
+            // re-baseline so progress starts from 0 with no visual jump.
+            state.active = true;
+            state.start = current;
+            state.startCross = this.axis === 'x' ? event.clientY : event.clientX;
+            state.startTime = performance.now();
+            try {
+                state.handle.setPointerCapture(state.pointerId);
+            } catch { /* pointer already gone */ }
+        }
+
         const raw = current - state.start;
@@ #onPointerUp (top) @@
         if (!state || event.pointerId !== state.pointerId) return;

+        // Released before the drag ever started (a click/tap): tear down quietly
+        // and let the native click proceed. No commit/cancel callbacks.
+        if (!state.active) {
+            this.#endDrag();
+            return;
+        }
+
         const current = this.axis === 'x' ? event.clientX : event.clientY;
@@ #endDrag @@
         if (this.#dragState) {
-            try {
-                this.#dragState.handle.releasePointerCapture(this.#dragState.pointerId);
-            } catch {
-                // Release may throw if the pointer is no longer valid.
+            if (this.#dragState.active) {
+                try {
+                    this.#dragState.handle.releasePointerCapture(this.#dragState.pointerId);
+                } catch {
+                    // Release may throw if the pointer is no longer valid.
+                }
             }
             this.#dragState = null;
         }
```

### Note

- `#slop = 8` is a fixed private field. If you want it tunable, promote it to a
  public prop + `swipe-dismiss-slop` attribute the same way `distanceThreshold`
  is wired — didn't do that unprompted.
- No change to `side-burger`'s own files; `el-maker.json` / `root.html` are
  untouched.


