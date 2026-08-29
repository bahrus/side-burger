# Cycling Tab

## Bruce's Ask

I've seen other drawer menu elements on the web, where if I tab though the menu, the tab goes back to the first menu item after reaching the bottom.

Is that something that is best configured via the light children in dev.html (inside the menu tag)?  Or is that a behavior the side-burger web component should control somehow?

If the former, can you modify dev.html so it behaves that?

If the latter, can you suggest how we could support this below?

## Answer

This is component behavior, not something to configure via dev.html's light children.

**Why:**
- The drawer's content is arbitrary slotted light DOM (dev.html happens to put a `<menu>` of links in it, but it could be anything focusable). A generic "trap and cycle focus" behavior can't be authored per-consumer against specific markup — it has to work against *whatever* focusable elements are inside the drawer at the moment Tab is pressed.
- `root.html` already puts `role="dialog" aria-modal="true"` on `#drawer`. Per the WAI-ARIA Authoring Practices, a modal dialog is *required* to trap focus while open (Tab wraps last→first, Shift+Tab wraps first→last) — that's part of the contract `aria-modal="true"` makes to assistive tech. Whoever declares that attribute owns delivering on it, which is side-burger itself, not each page that uses it.
- It's a natural extension of behavior the component already owns: the `delay: 100, ifAllOf: [open]` merge in `el-maker.mjs` already moves focus to the first `<a>` when the drawer opens. Cycling Tab within the drawer is the same responsibility (managing focus while modal) continued through the rest of the interaction, not a new concern.

**Suggested implementation**

Add a `keydown` listener on `#drawer` (only meaningful while `open`, matching how `inert`/`aria-hidden` are already gated on `open`) that intercepts `Tab`:

```js
function trapFocus(event, drawerEl) {
    if (event.key !== 'Tab') return;

    const focusable = drawerEl.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), ' +
        'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = drawerEl.getRootNode().activeElement; // shadow-DOM-aware

    if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
    }
}
```

Two ways to wire this in, matching how the project already factors reusable gesture logic:

1. **Lean / inline**: attach this directly where `root.html`'s drawer is set up — e.g. as a small addition alongside the existing focus-on-open merge in `el-maker.mjs`, calling a tiny helper co-located in the project (no new package). Fastest to ship, but the logic isn't reusable outside side-burger.
2. **Factored feature**: mirror the `swipe-dismiss` pattern — a small `FocusTrapFeature` class (a `container`/`active` property pair, `hostConnected`/`hostDisconnected`, attaches/detaches the keydown listener via `assignFeatures`) as its own feature under `el-maker/`. More ceremony up front, but reusable by any `el-maker`-built component that declares a modal region, consistent with how `swipeDismiss` was factored out rather than hand-rolled once.

Given there's currently exactly one consumer of this behavior (side-burger's own drawer), option 1 is the proportionate starting point; option 2 is worth it if/when a second modal-ish component in this codebase needs the same trap.