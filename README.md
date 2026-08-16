# side-burger

side drawer custom element triggered by a hamburger menu button typically.

```html
<side-burger imp-h='side-bar/root.html'>
    <nav>
        <menu>
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
        </menu>
    </nav>
    <script type=precede src="side-bar/el-maker.json"></script>
</side-burger>
```

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
