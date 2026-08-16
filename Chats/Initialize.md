# Initialization

--- Bruce's Ask

Can you please follow the [New Custom Element](../types/NewCustomElement.md) instructions to generate a web component as described by the [README.md](../README.md).  Please make it look nice, maybe with a Material UI look and feel, and be sure to use accessibility features (inert, maybe?).

Don't fret too much about getting everything to work perfectly.  Do not create any unit tests, or try to run anything.  I want to see how far you can get without iterative corrections.  This is the first instance of using AI to create a custom element based on these instructions, so I will use whatever stumbling blocks you run into to correct / amend the instructions.

If you find yourself thinking "I'm stumped how to implement this without JavaScript, just add to your implementation notes what functionality needs JavaScript that you don't see how to pull off with the existing "features" of el-maker.  I will take that under advisement, and explore enhancing el-maker's features if so, or utilize / create some custom attribute element enhancements to support the functionality.

Other custom elements are located in the root folder - plus-minus, scratch-bo and time-ticker, in case that helps.

Please add your implementation notes below.

---

## Kimi's Implementation Notes

I followed the HTML-first path in [NewHTMLFirstCustomElement.md](../types/NewHTMLFirstCustomElement.md) because `side-burger` is a visual component. Files created:

- `package.json` — dependencies and scripts aligned with `plus-minus` / `scratch-box`
- `types.d.ts` — `EndUserProps` with `expanded` and `disabled`
- `imports.html` — import map for `assign-gingerly`, `be-hive`, `el-maker`, `imp-h`, `mount-observer`, `roundabout-lib`, `side-burger`
- `root.html` — declarative shadow DOM with a hamburger button, overlay backdrop, and sliding drawer
- `el-maker.mjs` / `el-maker.json` — roundabout feature config that wires click handlers and accessibility attributes
- `demo/dev.html` — basic usage example with a `<nav>` menu

### What works declaratively

- **Open / close:** clicks on the hamburger button, close button, and overlay update the `expanded` property via roundabout `compacts`.
- **Material UI styling:** hamburger icon, elevation shadow on the drawer, semi-transparent overlay, Roboto font, hover / focus-visible states.
- **Accessibility basics:**
  - `aria-expanded` on the hamburger button is bound to `expanded`
  - `aria-hidden` on the drawer and overlay toggles with `expanded`
  - `inert` on the drawer is set to `true` when closed, `false` when open
  - `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` on the drawer

### Stumbling blocks / functionality that likely needs JavaScript or an enhancement

1. **Inert on the rest of the page.** The drawer can make *itself* `inert`, but making the surrounding page content inert while the drawer is open requires reaching outside the element’s shadow tree. I do not see how to do that with the current el-maker features alone.
2. **Focus trap.** Keeping focus inside the open drawer (cycle from last focusable element back to the first) is not expressible with the roundabout configs I used.
3. **Escape key to close.** I did not find a clean declarative way to listen for `keydown` on the document / drawer and filter for the `Escape` key within the existing el-maker feature set.
4. **Swipe / drag to close.** Touch gestures need JS event handling.
5. **Drawer position (right vs left).** I only styled the left-side drawer; supporting a `position` property would need additional CSS / attribute wiring.
6. **README path mismatch.** The README example references `side-bar/root.html` and `side-bar/el-maker.json`. I used `side-burger/` paths to match the package name; this may need correction in the README.

I did not create any tests or run any commands as requested.

---

## Bruce's Findings / Lessons Learned

The web component worked right off the bat!  But it does give some accessibility warnings, as Kimi predicted.

I found that the typescript guidance was inadequate, and corrected that (backfilling to plus-minus).




