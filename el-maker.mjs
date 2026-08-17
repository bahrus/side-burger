//@ts-check

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { akaMethods as m } from 'assign-gingerly/DX/emojis.js';
import { paths, doAssign, set, smoothOver } from 'assign-gingerly/DX/paths.js';

/** @import { EndUserProps, AP, Actions } from './types'; */
/** @import { RoundaboutOptions } from './types/roundabout/types' */
/** @import { ElMakerConfig } from './types/el-maker/types' */

const withMethods = [m['🔍']];

const $ = (/** @type {typeof paths<AP>} */ (/** @type {any} */(paths)))({ withMethods });

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
            expanded: true
        },
        on_click_of_closeButton_assign: {
            expanded: false
        },
        on_click_of_overlay_assign: {
            expanded: false
        },
        on_keydown_of_ownerDocument_assignFromEvent: {
            [$.escapeKeyPressed.QMEq.Path]: [['?.key', 'Escape'], true, false]
        }
    },
    merges: smoothOver([
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
            ifKeyIn: ['expanded'],
            ...doAssign(
                set($.hamburgerButton.ariaExpanded).to($.expanded),
                set($.drawer.ariaHidden.QMEq).to([$.expanded, false, true]),
                set($.overlay.ariaHidden.QMEq).to([$.expanded, false, true]),
                set($.drawer.inert.QMEq).to([$.expanded, false, true]),
                set($.escapeKeyPressed).to(false)
            )
        },
        {
            delay:10,
            ifAllOf: ['expanded'],
            assign: {
                '?.querySelector?.a?.focus|': null
            }
            // ...doAssign(
            //     set($.querySelector('a').focus()).to({}),
            // )
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
                expanded: false
            }
        }
    ]),
    defaultPropVals: {
        expanded: false,
        disabled: false
    }
};

/** @type {ElMakerConfig<AP>} */
const features = {
    assignFeatures: {
        roundabout: {
            customData: {
                raConfig
            }
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
