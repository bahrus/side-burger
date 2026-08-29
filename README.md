# side-burger

side drawer custom element triggered by a hamburger menu button typically.

```html
<side-burger imp-h='side-burger/root.html'>
    <nav>
        <menu>
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
        </menu>
    </nav>
    <script type=precede src="side-burger/el-maker.json"></script>
</side-burger>
```

## Customizing the menu button

By default the trigger is a hamburger icon. Override it with the `hamburger` slot —
an icon, text, or both. Wrap the content in an element carrying the `slot`
attribute (bare text nodes always go to the default slot):

```html
<side-burger imp-h="side-burger/root.html" open-label="Open menu">
    <span slot="hamburger">☰ Menu</span>
    <nav>...</nav>
    <script type=precede src="side-burger/el-maker.json"></script>
</side-burger>
```

The button's accessible name comes from `aria-label`, which overrides visible
content, so when you slot visible text set `open-label` to match it
(default: `"Open navigation menu"`). The button grows to fit a text label and
stays a 48px circle when it only holds an icon.

`::part(hamburger)` styles the button; `::part(open-icon)` styles the default SVG
(present only while the slot is not overridden).

## Viewing Demos Locally

1. Install git
2. Fork/clone this repo
3. Install node.js
4. Open command window to folder where you cloned this repo
5. > git submodule add https://github.com/bahrus/types.git types
6. > git submodule update --init --recursive
7. > npm install
8. > npm run serve
9. Open http://localhost:8000/ in a modern browser
