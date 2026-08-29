# Default Slot Content

## Bruce's Ask

I added a slot element in root.html with default content:

```xml
<slot name="buttonContents">
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" fill="currentColor"/>
    </svg>
</slot>
```

This, I think, will allow the consumer to specify a button that doesn't look like a hamburger menu, and to contain text.

Do you see any issues doing this?  If so, indicate what is problematic below.  What do you think of the name "buttonContents"?  Can you think of a more descriptive name that is at least as concise?

---

## Claude's Thoughts

Slotting *into* the shadow `<button>` (rather than letting the consumer supply
their own button) is the right call — the component keeps ownership of `type`,
`aria-expanded`, `aria-controls`, the click wiring and the focus ring, and the
consumer only supplies the visible label. So the shape is good. A few problems to
resolve first.

### 1. `aria-label` on the button overrides whatever gets slotted (the big one)

The shadow button has `aria-label="Open navigation menu"`. `aria-label` *wins*
over element content for the accessible name, so:

- Consumer slots `<span slot="buttonContents">Menu</span>` → screen reader still
  says "Open navigation menu", not "Menu".
- Visible text ("Menu") and accessible name ("Open navigation menu") diverge —
  a WCAG 2.5.3 *Label in Name* failure.
- Meanwhile the default SVG is correctly `aria-hidden="true"` *because* the
  `aria-label` carries the name. If you keep `aria-hidden` on the icon but a
  consumer replaces the slot with another bare icon and you've dropped
  `aria-label`, the button becomes nameless.

**Recommended fix:** keep an `aria-label` on the button but make it a
configurable attribute (e.g. `open-label`, default `"Open navigation menu"`),
wired through el-maker the same way `position` is. Then:

- icon-only consumers get a correct name for free;
- text-label consumers set `open-label="Menu"` so the names match;
- the default SVG keeps `aria-hidden="true"`.

Naming it distinctly from the slot avoids confusion: **slot = what is shown,
attribute = what is announced.**

### 2. Slotted content isn't reachable by the current CSS

`.hamburger svg { width: 24px; height: 24px }` targets a **shadow** descendant.
Slotted elements stay in the light tree for selector matching, so a consumer's
`<svg slot="…">` gets no sizing. Add `::slotted(svg) { width: 24px; height: 24px }`
(and `::slotted(*)` for anything else you want constrained).

### 3. The button is a fixed 48×48 circle

`.hamburger` is `width:48px; height:48px; border-radius:50%`. A text label will
overflow / clip. Either:

- decide the slot is icon-only in practice and document it, or
- let the button size to content: `min-width:48px; width:auto; height:48px;
  border-radius:24px; padding:0 12px` so it grows into a pill for text.

Given your stated goal ("contain text"), the pill option is probably what you
want.

### 4. Bare text won't reach the slot

Text nodes can't carry a `slot` attribute, so `<side-burger>Menu</side-burger>`
sends "Menu" to the **default** (menu) slot. Consumers must wrap:
`<span slot="…">Menu</span>`. Worth a line in the docs / README.

### 5. Minor

- `focusable="false"` on the SVG is a harmless IE-ism; leave or drop.
- If you want consumers to restyle the icon from outside, add
  `part="open-icon"` to the default `<svg>` (only helps the default, but cheap).
- Sanity-check that the `imp-h` `<?start>/<?end>` preprocessor passes the nested
  `<slot>` through untouched.

### On the name `buttonContents`

Three issues:

1. **camelCase breaks the local convention.** Parts here are kebab
   (`drawer-header`, `drawer-title`, `drag-handle`). `slot=` values are
   case-sensitive exact-match strings; a consumer who writes
   `slot="buttoncontents"` silently gets the default content back. Kebab-case is
   the platform norm for slot names and is typo-safer.
2. **"button" is ambiguous** — there are two buttons in this component (the
   open/hamburger button *and* the close button).
3. **"Contents" is filler** — every slot has contents; it adds length without
   meaning.

Concise alternatives (all ≤ the 14 chars of `buttonContents`), ranked:

| name | chars | notes |
|---|---|---|
| `hamburger` | 9 | **Most consistent** — matches `name="hamburger"` / `part="hamburger"` already on that same button. "Hamburger button" is widely understood as "the menu-opening button" regardless of icon. Slight irony that the point is to *not* look like a hamburger. |
| `menu-button` | 11 | Matches the WAI-ARIA "Menu Button" pattern name; icon-agnostic; unambiguous about *which* button. |
| `toggle` | 6 | Shortest and clear, but technically this button only *opens* (close is separate), so "toggle" slightly overstates it. |

I'd take **`hamburger`** for vocabulary consistency, or **`menu-button`** if the
hamburger/-not-a-hamburger tension bothers you. Pair whichever you pick with a
separate `open-label` (or `menu-button-label`) attribute for the accessible name,
per issue #1.

### Sketch after the fixes

```html
<button
    name="hamburger"
    class="hamburger"
    part="hamburger"
    aria-expanded="false"
    aria-controls="drawer"
    aria-label="Open navigation menu"   <!-- ← driven by an `open-label` attr, default this -->
    type="button">
    <slot name="hamburger">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" part="open-icon">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" fill="currentColor"/>
        </svg>
    </slot>
</button>
```

```css
::slotted(svg) { width: 24px; height: 24px; }
/* if allowing text labels: */
.hamburger { width: auto; min-width: 48px; border-radius: 24px; padding: 0 12px; }
```

