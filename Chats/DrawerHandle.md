# Drawer Handle

## Bruce's Ask

The basic [demo of swipe dismiss](../demo/swipe-dismiss-test.html) has a handle on the edge of the drawer:

![Drawer Handle](image.png)

Is it possible to add such a feature (optionally) to side-burger element?

If so, please implement and add implementation notes.  If further clarifications are needed first, please add those below before implementing.

---

## Claude's Implementation Notes

Yes — and most of the pieces were already there. `root.html` has always shipped a
`.drag-handle` element (with `part="drag-handle"`), it was just hidden, wrongly
positioned (on the *outer* edge, off-screen), and never gated behind anything.
Wired it up as an opt-in affordance.

### Design

- **Opt-in via a boolean `drag-handle` attribute.** Off by default; the drawer
  looks exactly as before.
- **No new gesture code.** The swipe feature's `handle` is already the whole
  `#drawer`, and the tab is a child of the drawer, so a `pointerdown` on the tab
  already bubbles to the same listener. The tab is purely a *visual cue* on top
  of the existing "drag the drawer body" gesture — same as the reference demo,
  where both the panel and the tab work.
- **Presentation only, so it's CSS-only.** `:host([drag-handle])` matches the
  host attribute directly from the shadow stylesheet — no merge, no JS. It is
  wired into `withAttrs` solely so a `dragHandle` **property** mirrors the
  attribute, matching `open` / `disabled`.
- **Not keyboard-accessible on purpose.** The tab stays `aria-hidden="true"` and
  non-focusable; it's a supplementary pointer affordance. Escape, the close
  button and the scrim remain the accessible ways to dismiss. Also **drag-only**
  — a plain click/tap on the tab does nothing (the 8px slop from the
  close-button fix gives this for free).

### Changes

**`root.html`** — rewrote the `.drag-handle` rules:
- `display:none` by default; `:host([drag-handle]) .drag-handle { display:block }`.
- Moved to the drawer's **inner** edge (`right:-16px`, mirrored to `left:-16px`
  for `position="right"`) so it actually sits on-screen, protruding into the
  page over the scrim.
- Restyled as a rounded surface-coloured tab with a grip bar (`::after`), a soft
  shadow, and `cursor: grab`/`grabbing`. `touch-action:none` kept. It rides
  along with the drawer during the drag because it's a child of `#drawer`
  (which is what gets the inline `translateX`).

**`el-maker.mjs`** → regenerated **`el-maker.json`**:
- `dragHandle` added to `props`, and to `withAttrs` as
  `drag-handle` ⇄ `dragHandle` (`Boolean`, `sourceOfTruth`). No merge.

**`types.d.ts`**:
- `dragHandle: boolean` on `EndUserProps` (with the "presentation only /
  supplementary" caveat); `dragHandle` added to `cssParts`.

**`README.md`** — new "Swipe to dismiss" section documenting the gesture and the
`drag-handle` attribute.

**`demo/dev.html`** — added `drag-handle` to the `<side-burger>` so the tab is
visible in the dev demo (remove it to see the default).

### Verification (headless Chromium, `spa-ssi` serve)

| check | result |
|---|---|
| `drag-handle` set → tab visible, on-screen (`x≈279, 17×58`, on the drawer's inner edge) | ✓ |
| no `drag-handle` attribute → tab `display:none` | ✓ |
| drag the tab ~220px toward the edge → drawer dismisses (`open`→`false`, `#drawer.inert`→`true`) | ✓ |
| plain click on the tab (no movement) → drawer stays open | ✓ |
| console | clean | 

Temp test files removed; working tree holds only `root.html`, `el-maker.mjs`,
`el-maker.json`, `types.d.ts`, `README.md`, `demo/dev.html`, and this chat.

### Not done (say the word)

- `::part(drag-handle)` is exposed, but there's no CSS custom property for its
  size/offset — restyle via `::part` for now.
- Right-side placement is implemented but only left was exercised in the
  automated run; worth an eyeball with `position="right"`.
- No click-to-close on the tab (kept drag-only to match the reference). Easy to
  add if you want tap-the-tab-to-close.

  ## Bruce's Response

  Those seem like good things to do, please proceed.

---

## Claude's Follow-up Notes

All three done, plus a pre-existing bug fixed along the way.

### 1. Custom properties for the tab

Added to `:host` in `root.html`, used by `.drag-handle`:

| property | default | drives |
|---|---|---|
| `--drag-handle-length` | `56px` | tab height |
| `--drag-handle-thickness` | `16px` | tab width *and* how far it protrudes (`right`/`left`) |
| `--drag-handle-color` | `var(--surface-color)` | tab fill |
| `--drag-handle-grip-color` | `rgba(0,0,0,.28)` | the grip bar |

Also added `box-sizing: border-box` to `.drag-handle` so `thickness` maps 1:1 to
the rendered width. `::part(drag-handle)` still works for anything else.

### 2. Click-to-close on the tab

- `root.html`: the tab div gained `name="drag-handle"`.
- `el-maker.mjs`: new internal `dragHandleEl` prop resolved in the clone merge
  (`[name=drag-handle]`), added to `weakRef.properties`, and a
  `on_click_of_dragHandleEl_assign: { open: false }` compact.
- Behaviour: a genuine tap closes; a committed swipe-drag doesn't reach the
  handler (pointer capture retargets its click to the drawer), and a cancelled
  short drag doesn't either — verified both.

### 3. `position="right"` — verified, and a bug fixed

Eyeballing the right side surfaced a real pre-existing bug: with
`position="right"`, the drawer *rendered* correctly (CSS keys off the
attribute) but the **`position` property was stuck at `"left"`**, so the swipe
feature got `direction = -1` and the drawer could only be swiped the wrong way.

Root cause: `position` was defaulted in **two** places —
`raConfig.defaultPropVals.position = 'left'` *and* `_position.valIfNull = 'left'`
— and combined with `_position.sourceOfTruth`, the `defaultPropVals` entry
shadowed the value coming from the attribute. Removing the redundant
`defaultPropVals.position` (keeping `_position.valIfNull` as the single default)
fixes it: `position` prop now tracks the attribute, and the existing
`direction` merge computes `1` for right-docked drawers with no extra wiring.

Rejected alternative: adding `position` to a merge guard to force a recompute —
it made roundabout blank the `position` *attribute* back to `left`, breaking the
CSS too.

### Verification (headless Chromium, `spa-ssi` serve)

Left drawer: `position` prop `left`, `direction` `-1`, left-docked, tab on the
outer edge, swipe-left dismisses, tap-tab closes, cancelled short drag stays
open, close button unaffected.

Right drawer (`--drag-handle-thickness:30px; --drag-handle-length:72px`):
`position` prop `right`, `direction` `1`, right-docked, tab flush on the inner
(left) edge at the custom `30×72`, swipe-right dismisses, tap-tab closes.

Console clean throughout. Temp test files removed; working tree holds
`root.html`, `el-maker.mjs`, `el-maker.json`, `types.d.ts`, `README.md`, and
this chat.

### Separate issue spotted (not touched)

Two `<side-burger>` elements on one page sharing `imp-h="side-burger/root.html"`:
the **second** instance's shadow DOM gets the template injected **twice** (two
hamburgers, two drawers). Single-instance pages — every demo and every test
here — are fine. This looks like an `imp-h` duplicate-injection issue when a
source is reused; unrelated to this change. Flagging for a separate look.