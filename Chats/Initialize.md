# Initialization

--- 

## Bruce's Ask

Can you please follow the [New Custom Element](../types/NewCustomElement.md) instructions to generate a web component as described by the [README.md](../README.md).  Please make it look nice, maybe with a Material UI look and feel, and be sure to use accessibility features (inert, maybe?).

Don't fret too much about getting everything to work perfectly.  Do not create any unit tests, or try to run anything.  I want to see how far you can get without iterative corrections.  This is the first instance of using AI to create a custom element based on these instructions, so I will use whatever stumbling blocks you run into to correct / amend the instructions.

If you find yourself thinking "I'm stumped how to implement this without JavaScript, just add to your implementation notes what functionality needs JavaScript that you don't see how to pull off with the existing "features" of el-maker.  I will take that under advisement, and explore enhancing el-maker's features if so, or utilize / create some custom attribute element enhancements to support the functionality.

Other custom elements are located in the root folder - plus-minus, scratch-box and time-ticker, in case that helps.

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

One of the items I have [documented how to address](../types/NewHTMLFirstCustomElement.md#how-can-i-perform-an-action-when-the-escape-key-is-pressed-somewhere-on-the-document) (after a bug fix) is:

> 3.  **Escape key to close.** I did not find a clean declarative way to listen for `keydown` on the document / drawer and filter for the `Escape` key within the existing el-maker feature set.

So one down and a few more to go.

> 4. **Swipe / drag to close.** Touch gestures need JS event handling.

This is the most interesting / exiting to me.  There does appear a serious need for [a custom element feature / element enhancement that provides for what is called "swipe (to) dismiss"](https://github.com/bahrus/swipe-dismiss).  It's a significant amount of code that appears to be useful across a variety of component types so enhancements / features seem to fit the bill nicely.

> 1.  **Inert on the rest of the page.** The drawer can make *itself* `inert`, but making the surrounding page content inert while the drawer is open requires reaching outside the element’s shadow tree. I do not see how to do that with the current el-maker features alone.

I asked Claude what the code should look like to implement:

Claude replied with code to do this, as well as trapping focus, which I assume is your second functionality:


```JS
class MyDrawer extends HTMLElement {
  #inertedSiblings = [];

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        <style>
          :host { display: none; }
          :host([open]) { display: block; }
        </style>
        <div part="panel">
          <slot></slot>
        </div>
      `;
    }
  }

  open() {
    this.setAttribute('open', '');
    this.#makeRestOfPageInert();
    this.#trapFocus();
  }

  close() {
    this.removeAttribute('open');
    this.#restoreInert();
  }

  #makeRestOfPageInert() {
    // Walk the light-DOM tree the element actually lives in.
    // getRootNode() handles the case where the drawer itself
    // is nested inside another shadow root.
    const root = this.getRootNode();
    const container = root instanceof ShadowRoot ? root.host.parentNode : document.body;

    for (const sibling of container.children) {
      if (sibling === this) continue;
      if (sibling.hasAttribute('inert')) continue; // already inert, don't touch/restore it
      sibling.setAttribute('inert', '');
      this.#inertedSiblings.push(sibling);
    }
  }

  #restoreInert() {
    for (const el of this.#inertedSiblings) {
      el.removeAttribute('inert');
    }
    this.#inertedSiblings = [];
  }

  #trapFocus() {
    // move focus into the drawer so inert-ing the rest of the page
    // doesn't strand focus on a now-inert element
    const focusable = this.shadowRoot.querySelector('[autofocus], button, [href], input, select, textarea, [tabindex]');
    (focusable ?? this).focus();
  }
}

customElements.define('my-drawer', MyDrawer);
```

Does this align with your thinking of what needs to be implemented?

I do have some doubts whether the code above is right.  It just goes up to the parent and sets all the other siblings to inert, it looks like.  What if the drawer is buried deep in the page.  Wouldn't this leave many elements potentially non inert?

#makeRestOfPageInert and #restoreInert seem almost achievable with the assignFrom declarative configuration, but not quite.  It makes me think assignTentatively should get more attention.

But I don't think it would get us all the way there anyway, due to the need to be careful about which elements were modified.

What is interesting is that Claude added #trapFocus() which appears to align with your point 2 above:

> 2. **Focus trap.** Keeping focus inside the open drawer (cycle from last focusable element back to the first) is not expressible with the roundabout configs I used.

I guess this looks like another candidate for a custom element feature / element enhancement.  I think maybe these three methods should be grouped together under one umbrella.  Or should the focus be separate? What would you call it?  I'm thinking InertManager?

If the focus should be separate, I think that is achievable with the declarative support for assigning, but I will experiment with that and document the solution if confirmed.

> 5. **Drawer position (right vs left).** I only styled the left-side drawer; supporting a `position` property would need additional CSS / attribute wiring.

I need to do a better job of indicating how to configure attribute wiring.  But can you please lay out what the code would need to look like for this feature?














