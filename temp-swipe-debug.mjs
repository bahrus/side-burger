import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();

page.on('console', msg => console.log('[browser]', msg.type(), msg.text()));
page.on('pageerror', err => console.log('[pageerror]', err.message));

await page.goto('http://localhost:8000/demo/dev.html');
await page.waitForTimeout(1500);

async function getDrawerState() {
    return await page.locator('side-burger').evaluate(el => {
        const drawer = el.shadowRoot.querySelector('[name="drawer"]');
        return {
            open: el.open,
            ariaHidden: drawer.getAttribute('aria-hidden'),
            inert: drawer.inert,
            transform: drawer.style.transform
        };
    });
}

function dispatchOnHost(type, x, y) {
    return page.locator('side-burger').evaluate((el, { type, x, y }) => {
        const ev = new PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            pointerId: 1,
            pointerType: 'mouse',
            clientX: x,
            clientY: y,
            isPrimary: true,
        });
        el.dispatchEvent(ev);
    }, { type, x, y });
}

console.log('--- clicking hamburger to open ---');
await page.click('side-burger button[name="hamburger"]');
await page.waitForTimeout(500);
console.log('state after click:', await getDrawerState());

console.log('--- dragging on the overlay to the right ---');
const hostBox = await page.locator('side-burger').evaluate(el => {
    const rect = el.getBoundingClientRect();
    return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
});
const drawerBox = await page.locator('side-burger').evaluate(el => {
    const drawer = el.shadowRoot.querySelector('[name="drawer"]');
    const rect = drawer.getBoundingClientRect();
    return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
});
console.log('host box:', hostBox, 'drawer box:', drawerBox);

const startX = drawerBox.x + drawerBox.width + 50; // on the overlay
const startY = drawerBox.y + 100;
const endX = startX + 300;

await dispatchOnHost('pointerdown', startX, startY);
for (let i = 0; i <= 20; i++) {
    const x = startX + (endX - startX) * (i / 20);
    await dispatchOnHost('pointermove', x, startY);
}
await dispatchOnHost('pointerup', endX, startY);
await page.waitForTimeout(500);
console.log('state after overlay drag:', await getDrawerState());

await browser.close();
