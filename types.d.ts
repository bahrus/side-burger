import {SimpleWCInfo} from './types/wc-info/SimpleWCInfo';

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
        overlay: 'Backdrop shown when the drawer is open';
        drawer: 'Sliding navigation panel';
        drawerHeader: 'Header area containing the title and close button';
        drawerTitle: 'Title text in the drawer header';
        close: 'Button that closes the drawer';
        content: 'Container for the slotted navigation content';
    };
    slots: {
        '': 'Navigation / menu content placed inside the drawer.';
    };
}

export type Package = [SideBurgerInfo];
