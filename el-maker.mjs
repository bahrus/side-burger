//@ts-check

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { akaMethods as m } from 'assign-gingerly/DX/emojis.js';
import { paths, doAssign, set, smoothOver, assign } from 'assign-gingerly/DX/paths.js';

/** @import { EndUserProps, AP, Actions, RunTimeProps } from './types'; */
/** @import { RoundaboutOptions, Merges } from './types/roundabout/types' */
/** @import { ElMakerConfig } from './types/el-maker/types' */
/** @import {AttrPatterns} from './types/assign-gingerly/types.js' */

const withMethods = [m['🔍'], m['🧺']];

/**
 * This makes refactoring easier.  Centralize the manual 
 * correction to one place.
 * @type {{ [K in keyof AP]: K }}
 */
const props = {
    open: 'open',
    disabled: 'disabled',
    position: 'position',
    clone: 'clone',
    closeButton: 'closeButton',
    drawer: 'drawer',
    escapeKeyPressed: 'escapeKeyPressed',
    hamburgerButton: 'hamburgerButton',
    overlay: 'overlay',
    ownerDocument: 'ownerDocument',
    inertTarget: 'inertTarget',
    inertTargetElements: 'inertTargetElements',
    swipeDismiss: 'swipeDismiss',
};

const $ = (/** @type {typeof paths<RunTimeProps>} */ (/** @type {any} */(paths)))({ withMethods });

// kept separate because "smoothOver" destroys typechecking
/** @type Merges<AP> */
const merges = [
    {
        ifAllOf: ['clone'],
        ...doAssign(
            set($.hamburgerButton).to($.clone.querySelector('[name=hamburger]')),
            set($.closeButton).to($.clone.querySelector('[name=close]')),
            set($.overlay).to($.clone.querySelector('[name=overlay]')),
            set($.drawer).to($.clone.querySelector('#drawer')),
            
        )
    },
    {
        ifAllOf: ['drawer'],
        ...doAssign(
            set($.swipeDismiss.handle).to($.drawer),
            set($.swipeDismiss.panel).to($.drawer),
            set($.swipeDismiss.direction.QMEq).to([[$.position, 'right'], 1, -1])
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
        ifKeyIn: [props.disabled],
        ifAllOf: [props.clone],
        ...doAssign(
            set($.hamburgerButton.disabled).to($.disabled)
        )
    },
    {
        ifAllOf: ['escapeKeyPressed'],
        assign: {
            [props.open]: false
        }
    },
    {
        ifAllOf: [props.clone, props.inertTarget, props.open],
        ...doAssign(
            set(props.inertTargetElements).to($.ownerDocument.querySelectorAll($.inertTarget)),
            set($.inertTargetElements.Each.inert).to(true)
        )
    },
    {
        ifAllOf: [props.clone, props.inertTarget],
        ifNoneOf: [props.open],
        ...doAssign(
            set($.inertTargetElements.Each.inert).to(false)
        )
    }
];

/**
 * @type {RoundaboutOptions<AP, Actions, AP, 'click' | 'keydown'>}
 */
const raConfig = {
    weakRef: {
        properties: [props.hamburgerButton, props.closeButton, props.overlay, props.drawer],
        listProperties: [props.inertTargetElements],
        logIfCollected: 'warn'
    },
    
    assignOptions: {
        akaMethods: {
            '🔍': m['🔍'],
            '😣': m['😣'],
            '🧺': m['🧺'],
        },
        substitutions: {
            inertTarget: '?.inertTarget'
        }
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
        [props.disabled]: false,
        [props.position]: 'left'
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
    [`_${props.disabled}`]: {
        instanceOf: 'Boolean',
        sourceOfTruth: true,
        mapsTo: props.disabled
    },
    [props.inertTarget]: 'inert-target',
    [`_${props.inertTarget}`]: {
        mapsTo: props.inertTarget,
    },
    [props.position]: 'position',
    [`_${props.position}`]: {
        sourceOfTruth: true,
        valIfNull: 'left',
        mapsTo: props.position
    }
}

/** @type {AttrPatterns<any>} */
const swipeDismissAttrs = {
    base: 'swipe-dismiss',
    axis: '${base}-axis',
    direction: '${base}-direction',
    distanceThreshold: '${base}-distance-threshold',
    _distanceThreshold: {
        instanceOf: 'Number',
        mapsTo: 'distanceThreshold',
        valIfNull: 0.4
    },
    velocityThreshold: '${base}-velocity-threshold',
    _velocityThreshold: {
        instanceOf: 'Number',
        mapsTo: 'velocityThreshold',
        valIfNull: 0.5
    }
};

/** @type {any} */
const swipeDismissCustomData = {
    assign: {
        onProgress: {
            ...assign(
                set($.drawer.style.transition).to('none'),
                set($.drawer.style.clipPath.EqAmp).to({
                    join: ['inset(0 ', '?.progressState?.deltaPx', 'px 0 0)']
                })
            )
        },
        onCommit: {
            ...assign(
                set($.open).to(false),
                set($.drawer.style.clipPath).to(''),
                set($.drawer.style.transition).to('')
            )
        },
        onCancel: {
            ...assign(
                set($.drawer.style.clipPath).to(''),
                set($.drawer.style.transition).to('')
            )
        }
    },
    assignOptions: {
        withMethods: ['querySelector']
    }
};

/** @type {ElMakerConfig<AP> & { assignFeatures: { swipeDismiss?: { customData?: any, withAttrs?: import('./types/assign-gingerly/types.js').AttrPatterns<any> } } }} */
const features = {
    assignFeatures: {
        roundabout: {
            customData: {
                raConfig
            },
            withAttrs, //TODO: fix Typescript
        },
        templateMaker: {},
        truthSourcer: {},
        swipeDismiss: {
            customData: swipeDismissCustomData,
            withAttrs: swipeDismissAttrs,
        },
        focusTrap: {}
    }
};

export function render() {
    return JSON.stringify(features, null, 4);
}

const __filename = fileURLToPath(import.meta.url);
const outputFile = __filename.replace(/\.mjs$/, '.json');
writeFileSync(outputFile, render(), 'utf8');
