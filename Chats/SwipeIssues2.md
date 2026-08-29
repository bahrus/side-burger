# Swipe Issues 2

## Bruce's Request

I'd like to make another attempt to get the Swipe Dismiss functionality, which responds smoothly with [swipe-dismiss-test](../demo/swipe-dismiss-test.html) in Edge, but isn't smooth with [dev.html](../demo/dev.html).  I don't think "it's a bug with Edge" cuts it since the first link works so well.  That's where we kind of left it last time, essentially shrugging our shoulders.

The second link, which uses [swipe-dismiss-feature](../el-maker/swipe-dismiss/SwipeDismissFeature.js), which we can edit at will and test, is giving the following aria warning, which we should fix regardless. It gives the error when I start swiping:

> Blocked aria-hidden on an element because its descendant retained focus. The focus must not be hidden from assistive technology users. Avoid using aria-hidden on a focused element or its ancestor. Consider using the inert attribute instead, which will also prevent focus. For more details, see the aria-hidden section of the WAI-ARIA specification at https://w3c.github.io/aria/#aria-hidden.
> Element with focus: <a>
> Ancestor with aria-hidden: <div.drawer#drawer> 

---

## Claude's Analysis & First Fixes

### Why the test page is smooth and `dev.html` is not

It isn't Edge. The two pages ask the browser to do completely different work each
pointer frame.

| | `swipe-dismiss-test.html` (smooth) | `dev.html` (janky) |
|---|---|---|
| what `onProgress` mutates | `translate` via a `--drag-x` custom prop | `clip-path: inset(0 <N>px 0 0)` |
| browser work per frame | compositor transform only — **no paint, no layout** | **full repaint** of the drawer *and* its 3‑layer `box-shadow`, every `pointermove` |
| transition suppressed via | `[data-dragging]` attribute | inline `style.transition = 'none'` rewritten every frame |

`clip-path` is **not** a compositor-accelerated property in Chromium/Edge. Every
`pointermove` invalidates the drawer's raster, and because `.drawer` carries a
big triple `box-shadow`, each of those repaints is expensive. That is the jank.
The test page never repaints during the drag — it only moves a compositor layer.

Bruce's Response IV ("I see the content behind the drawer drag a little") is the
second half of the same story: `touch-action: none` was only on `.drawer` /
`.drag-handle`. `touch-action` **does not inherit**, so when a swipe starts on a
slotted `<a>` the browser still runs its native pan/scroll gesture and drags the
page behind the drawer.

### Why the `aria-hidden` warning fires

`el-maker.mjs` was toggling **both** `aria-hidden` *and* `inert` on `#drawer`
when `open` flips to `false`. The delayed focus merge (`delay: 100 … querySelector('a').focus()`)
has by then moved focus onto the first menu link, so at the moment the drawer
gets `aria-hidden="true"` it still contains the focused `<a>` — exactly the
condition Chromium/Edge now block. The warning appears "when I start swiping"
because a fast flick trips `velocityThreshold` almost immediately and commits.

`inert` already hides the subtree from AT *and* pulls focus out of it, so
`aria-hidden` on the drawer was redundant as well as illegal. The spec text in
the warning literally says "use the `inert` attribute instead".

### What I changed (first attempt — please test)

**`el-maker/swipe-dismiss/SwipeDismissFeature.js`** (+ its `types/…/types.d.ts`)
- `progressState` gains `translatePx`: the always-positive drag magnitude
  pre-signed by `direction` (negative for a left drawer, positive for a right
  one) so a single declarative rule works for either edge. New private
  `#directionSign()`.

**`el-maker.mjs`** → regenerated **`el-maker.json`**
- `swipeDismiss.customData.assign.onProgress` now sets
  `drawer.style.transform = translateX(<translatePx>px)` instead of
  `clip-path: inset(…)`. `onCommit` / `onCancel` clear `transform` instead of
  `clipPath`.
- Removed the `?.drawer?.ariaHidden ?=` line from the `open` merge. `inert` is
  now the drawer's only AT-hiding mechanism (overlay still uses `aria-hidden`,
  which is fine — it has no focusable descendants).

**`root.html`**
- Open/closed CSS keys off `.drawer:not([inert])` instead of
  `.drawer[aria-hidden="false"]` (both the default and `position="right"`
  rules). Removed the now-dead static `aria-hidden="true"` and the dead
  `clip-path` entry in the `transition` list.
- `.drawer`: added `will-change: transform` (own compositor layer → drag never
  repaints) and `user-select: none`.
- `.content` and `::slotted(*)`: `touch-action: pan-y` — vertical menu
  scrolling still works, horizontal swipes belong to the gesture even when they
  start on a link.

### How to verify

1. `node el-maker.mjs` (already run — `el-maker.json` is regenerated).
2. Serve `demo/dev.html`, open the drawer, swipe the panel left.
   - The drawer should track the finger 1:1 with no stutter.
   - DevTools ▸ Rendering ▸ "Paint flashing": the drawer should **not** flash
     green while dragging (it did before).
   - No `Blocked aria-hidden…` message in the console when a swipe commits.
3. Release past ~40% width or with a quick flick → drawer slides out and `open`
   becomes `false`. Release short → it snaps back.

### If it's *still* not perfectly smooth

The remaining per-frame cost is JS, not paint: `#assignFrom('onProgress')` re-runs
a full assign-gingerly path evaluation (with `withMethods: ['querySelector']`) on
every `pointermove`. Next levers, in order:

1. `requestAnimationFrame`-throttle the `onProgress` dispatch inside
   `SwipeDismissFeature` (coalesce multiple moves per frame).
2. Add `contain: layout paint style` to `.drawer`.
3. Have `onProgress` write a CSS custom property once and let a static CSS rule
   do the `translate`, shrinking the declarative payload.
4. Profile in DevTools ▸ Performance — confirm long tasks are in scripting, not
   rendering, before optimizing further.

### Notes / caveats

- `el-maker/` is a nested checkout (its own `.git`); the `SwipeDismissFeature.js`
  and `types.d.ts` edits are committable there, separately from this repo. The
  `translatePx` addition is backward-compatible (extra field on `progressState`).
- The pre-existing Playwright test in `el-maker/swipe-dismiss/tests` fails on this
  machine **before** my changes too (empty console capture — the local
  `spa-ssi` server isn't resolving the test's imports), so it's not a usable
  regression gate right now.
- `demo/dev.html`'s local `a:focus { outline: red; background: yellow }` debug
  style can come out once the console is clean.
- Optional polish (not done, to keep this diff tight): on close, return focus to
  the hamburger button instead of letting it fall to `<body>`.

  ## Bruce's Response I

  You fixed it!  Dismissing is smooth, and the aria warning went away.

  Is there any clean up necessary, or shall I just commit the code and call it a day?

## Claude's Response I

Nearly commit-ready. One real cleanup, the rest optional.

**Should do**
- `demo/dev.html` — drop the debug `a:focus { outline: 4px solid red; background: yellow }`
  block. It was only there to watch the focus/aria bug; the console is clean now.
  (Keep the `user-scalable=no` viewport change — that legitimately stops pinch-zoom
  from fighting the horizontal swipe.)

**Optional / judgement calls**
- `root.html` still has `.drawer[data-dragging] { transition: none; }`. The el-maker
  path suppresses the transition with an inline `style.transition = 'none'` instead,
  so this rule is currently dead. Harmless, and it's the exact hook the "write a CSS
  custom property once" refactor (lever #3 above) would use — leave it as a marker or
  delete it, either is fine.
- `will-change: transform` is permanent on `.drawer`. That keeps a compositor layer
  alive for an element that's off-screen most of the time — a small, standard cost
  for a drawer. Fine to keep; only worth gating on a dragging flag if profiling ever
  flags it.
- Focus return to the hamburger on close is still unaddressed (focus falls to
  `<body>`). Not a regression from this work — a separate polish pass.

**Committing**
Two repos, keep them in step:
1. `el-maker/swipe-dismiss` — `SwipeDismissFeature.js` + its `types/` submodule
   (`translatePx` on `progressState`).
2. `side-burger` — `root.html`, `el-maker.mjs`, and the regenerated `el-maker.json`
   (don't hand-edit the JSON; it's `node el-maker.mjs` output).

Since `swipe-dismiss` is a published package, the `translatePx` addition should also
land upstream (and get a version bump) or a future `npm update` in another consumer
will drop it. It's backward-compatible — purely an added field — so no rush.
