import {SimpleWCInfo} from './types/wc-info/SimpleWCInfo';
import {SwipeDismissProps} from './types/swipe-dismiss/types';

export interface EndUserProps {
    /**
     * If true, the navigation drawer is open.
     */
    open: boolean;
    /**
     * If true, the hamburger menu button is disabled.
     */
    disabled: boolean;

    /**
     * Selector for elements to make inert when drawer is open
     * include :not([inert]) to avoid reverting the attribute 
     * inadvertently.
     */
    inertTarget: string;

    /**
     * Which side of the viewport the drawer slides out from.
     * @default 'left'
     */
    position: 'left' | 'right';

    /**
     * Accessible name for the menu button, applied as its `aria-label`.
     * `aria-label` overrides visible content for the accessible name, so if you
     * slot visible text into the `hamburger` slot, set this to match it.
     * @default 'Open navigation menu'
     */
    openLabel: string;
}

export interface AllProps extends EndUserProps {
    hamburgerButton: HTMLButtonElement;
    closeButton: HTMLButtonElement;
    overlay: HTMLDivElement;
    drawer: HTMLDivElement;
    clone: Element | DocumentFragment | ShadowRoot;
    readonly ownerDocument: Document;
    escapeKeyPressed: boolean;
    inertTargetElements: Element[];
    swipeDismiss: Props;
}

export type AP = AllProps;

export interface RunTimeProps extends AllProps, HTMLElement {}

export type PAP = Partial<AP>;

export interface Actions {
}

export abstract class SideBurgerInfo implements SimpleWCInfo {
    src: './root.mjs';
    tagName: 'side-burger';
    props: EndUserProps;
    cssParts?: {
        hamburger: 'Button that toggles the drawer open';
        openIcon: 'Default hamburger SVG; only present while the `hamburger` slot is not overridden';
        overlay: 'Backdrop shown when the drawer is open';
        drawer: 'Sliding navigation panel';
        drawerHeader: 'Header area containing the title and close button';
        drawerTitle: 'Title text in the drawer header';
        close: 'Button that closes the drawer';
        content: 'Container for the slotted navigation content';
    };
    slots: {
        '': 'Navigation / menu content placed inside the drawer.';
        hamburger: 'Custom content for the menu button — an icon and/or text. Wrap in an element carrying slot="hamburger" (bare text goes to the default slot). Defaults to a hamburger icon.';
    };
}

export type Package = [SideBurgerInfo];
