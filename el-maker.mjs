//@ts-check

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { akaMethods as m } from 'assign-gingerly/DX/emojis.js';
import { paths, doAssign, set, smoothOver } from 'assign-gingerly/DX/paths.js';

/** @import { EndUserProps, AP, Actions, RunTimeProps } from './types'; */
/** @import { RoundaboutOptions, Merges } from './types/roundabout/types' */
/** @import { ElMakerConfig } from './types/el-maker/types' */
/** @import {AttrPatterns} from './types/assign-gingerly/types.js' */

const withMethods = [m['🔍']];

/**
 * This makes refactoring easier.  Centralize the manual 
 * correction to one place.
 * @type {{ [K in keyof AP]: K }}
 */
const props = {
    open: 'open',
    disabled: 'disabled',
    clone: 'clone',
    closeButton: 'closeButton',
    drawer: 'drawer',
    escapeKeyPressed: 'escapeKeyPressed',
    hamburgerButton: 'hamburgerButton',
    overlay: 'overlay',
    ownerDocument: 'ownerDocument',
};

const $ = (/** @type {typeof paths<RunTimeProps>} */ (/** @type {any} */(paths)))({ withMethods });

// kept separate because "smoothOver" destroys typechecking
/** @type Merges<AP> */
const merges = [
    {
        ifKeyIn: ['clone'],
        ...doAssign(
            set($.hamburgerButton).to($.clone.querySelector('[name=hamburger]')),
            set($.closeButton).to($.clone.querySelector('[name=close]')),
            set($.overlay).to($.clone.querySelector('[name=overlay]')),
            set($.drawer).to($.clone.querySelector('[name=drawer]'))
        )
    },
    {
        ifKeyIn: [props.open],
        ...doAssign(
            set($.hamburgerButton.ariaExpanded).to($.open),
            set($.drawer.ariaHidden.QMEq).to([$.open, false, true]),
            set($.overlay.ariaHidden.QMEq).to([$.open, false, true]),
            set($.drawer.inert.QMEq).to([$.open, false, true]),
            set($.escapeKeyPressed).to(false)
        )
    },
    {
        delay: 100, //milliseconds
        ifAllOf: [props.open],
        ...doAssign(
            set($.querySelector('a').focus()).to({}),
        )
    },
    {
        ifKeyIn: ['disabled'],
        ifAllOf: ['clone'],
        ...doAssign(
            set($.hamburgerButton.disabled).to($.disabled)
        )
    },
    {
        ifAllOf: ['escapeKeyPressed'],
        assign: {
            [props.open]: false
        }
    }
];

/**
 * @type {RoundaboutOptions<AP, Actions, AP, 'click' | 'keydown'>}
 */
const raConfig = {
    weakRef: {
        properties: ['hamburgerButton', 'closeButton', 'overlay', 'drawer'],
        logIfCollected: 'warn'
    },
    assignOptions: {
        akaMethods: {
            '🔍': m['🔍'],
            '😣': m['😣']
        },
    },
    compacts: {
        on_click_of_hamburgerButton_assign: {
            [props.open]: true
        },
        on_click_of_closeButton_assign: {
            [props.open]: false
        },
        on_click_of_overlay_assign: {
            [props.open]: false
        },
        on_keydown_of_ownerDocument_assignFromEvent: {
            [$.escapeKeyPressed.QMEq.Path]: [['?.key', 'Escape'], true, false]
        }
    },
    merges: smoothOver(merges),
    defaultPropVals: {
        [props.open]: false,
        [props.disabled]: false
    }
};

/** @type {AttrPatterns<AP>} */
const withAttrs = {
    [props.disabled]: props.disabled,
    [props.open]: props.open,
    [`_${props.open}`]: {
        instanceOf: 'Boolean',
        mapsTo: props.open
    },
    _disabled: {
        instanceOf: 'Boolean',
        sourceOfTruth: true,
        mapsTo: props.disabled
    }
}

/** @type {ElMakerConfig<AP>} */
const features = {
    assignFeatures: {
        roundabout: {
            customData: {
                raConfig
            },
            withAttrs, //TODO: fix Typescript
        },
        templateMaker: {}
    }
};

export function render() {
    return JSON.stringify(features, null, 4);
}

const __filename = fileURLToPath(import.meta.url);
const outputFile = __filename.replace(/\.mjs$/, '.json');
writeFileSync(outputFile, render(), 'utf8');
