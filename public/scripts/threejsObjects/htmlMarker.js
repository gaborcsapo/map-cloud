import {
    Group,
    MathUtils,
} from 'three';
import HtmlMesh from './htmlMesh.js';

/**
 * Renders a marker based on html-content. The marker consists of a base-point, a
 * stem and the actual label. It also contains can be adjusted to the current camera,
 * rendering as a vertical plane when looked at from a shallow angle and horizontally
 * looked at from above.
 */
export default class HtmlMarker3d extends Group {
    htmlMesh;
    labelGroup;
    material;
    lastProps;

    constructor(props) {
        super();

        // note: ios somehow won't manage to correctly render the labels with
        //   webfonts on the first try, not sure why that is, but the first try
        //   might be the only one a user sees, so just dont use webfonts.

        if (isIOS) {
            delete props.fontStylesheetUrl;
        }

        const {
            label = '',
            fontStylesheetUrl = 'https://fonts.googleapis.com/css?family=Google+Sans:500&display=block',
            width = 150,
            baseZoom = 1,
        } = props;

        this.lastProps = {};
        const html = renderMarkerHtml(label);
        this.htmlMesh = new HtmlMesh({html, fontStylesheetUrl, width});

        this.labelGroup = new Group();
        this.labelGroup.add(this.htmlMesh);
        this.labelGroup.rotation.reorder('YXZ');

        this.baseZoom = baseZoom;

        this.add(this.labelGroup);
    }

    update(props) {
        let {heading, tilt, zoom} = props;
        let {lastHeading, lastTilt, lastZoom} = this.lastProps;

        if (heading != lastHeading || tilt != lastTilt || zoom != lastZoom) {
            this.updateOrientation(heading, tilt, zoom, this.baseZoom);
            this.lastProps = props;
        }
    }

    updateOrientation( heading, tilt, zoom, baseZoom)
    {
        const showTopView = tilt < 30;

        if (showTopView) {
            this.labelGroup.rotation.y = -MathUtils.DEG2RAD * heading;
        } else {
            this.adjustMarkerRotation(heading);
        }

        this.labelGroup.rotation.x = showTopView ? -Math.PI / 2 : -Math.PI / 4;

        // adjust scale according to zoom-level
        const scaleFactor = Math.pow(1.6, baseZoom - zoom);
        this.labelGroup.scale.setScalar(scaleFactor);
    }

    /**
     * Stepwise approach to an orientation appropriate for the given mapHeading.
     * @param mapHeading heading of the camera
     * @returns boolean indicating if the target-orientation is reached
     */
    adjustMarkerRotation(mapHeading) {
        // + 20 for extra sideways rotation
        const sectorHeading = (mapHeading + 20) % 360;

        const currRotation = this.labelGroup.rotation.y;
        let targetRotation = MathUtils.DEG2RAD * MathUtils.euclideanModulo(-sectorHeading, 360);

        // if the way to go is sufficiently small (0.05rad ~ 2.8°), end the
        // animation and lock the rotation to the proper value
        if (Math.abs(currRotation - targetRotation) < 0.1) {
            this.labelGroup.rotation.y = targetRotation;
            return true;
        }

        // if there's a difference of more than 180°, it has to be either 0° -> 270°
        // or the other way around. In this case, adding/removing 360° makes this
        // 0° -> -90° or 270° -> 360° (this will be corrected for at the end of
        // the animation)
        const dh = targetRotation - currRotation;
        if (Math.abs(dh) > Math.PI) {
            targetRotation -= 2 * Math.PI * Math.sign(dh);
        }

        this.labelGroup.rotation.y = currRotation + (targetRotation - currRotation) * 0.3;
        return false;
    }
}

function renderMarkerHtml(label) {
    return `
      <style>
        body {
          margin: 0;
          display: flex;
          flex-flow: column nowrap;
          justify-content: flex-end;
          height: 100%;
        }

        .label {
          position: relative;
          margin: 0 auto 30px;
          font-size: 38px;
          font-family: 'Google Sans', sans-serif;
          padding: .4em 1em;
          background: #590ed1;
          border-radius: 20px;
          text-align: center;
          color: white;
          font-weight: 500;
          letter-spacing: 1px;
        }

        .label:after {
          content: '';
          position: absolute; bottom: 0; left: 50%; z-index: 1;
          width: 0;
          height: 0;
          border-left: 20px solid transparent;
          border-right: 20px solid transparent;
          border-top: 30px solid #590ed1;

          transform: translate(-50%, 30px);
      </style>

      <div class="label">${encodeEntities(label)}</div>
    `;
}

const RX_SURROGATE_PAIR = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
const RX_NON_ALPHANUMERIC = /([^\#-~| |!])/g;

function encodeEntities(value) {
    return value
    .replace(/&/g, '&amp;')
    .replace(RX_SURROGATE_PAIR, value => {
        const hi = value.charCodeAt(0);
        const low = value.charCodeAt(1);
        return '&#' + ((hi - 0xd800) * 0x400 + (low - 0xdc00) + 0x10000) + ';';
    })
    .replace(RX_NON_ALPHANUMERIC, value => '&#' + value.charCodeAt(0) + ';')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// https://stackoverflow.com/a/62094756
const isIOS = (function () {
    const iosQuirkPresent = () => {
        const audio = new Audio();

        audio.volume = 0.5;
        return audio.volume === 1; // volume cannot be changed from "1" on iOS 12 and below
    };

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAppleDevice = navigator.userAgent.includes('Macintosh');
    const isTouchScreen = navigator.maxTouchPoints >= 1; // true for iOS 13 (and hopefully beyond)

    return isIOS || (isAppleDevice && (isTouchScreen || iosQuirkPresent()));
})();