import { LinearAnimation, OrbitAnimation } from './cameraAnimations.js';

const mapId ="c2485044d90a90f"

/**
 * The basemap combines access to the features needed from the google.maps.Map
 * instance with some additional features for camera-animations. Also handles
 * loading of the maps API and initializing the map itself.
 */
export class Basemap {
    map;
    camera = {};

    constructor(initialViewport) {
        const mapDiv = document.getElementById('map');
        Object.assign(this.camera, initialViewport);

        const {zoom, center, heading, tilt} = this.camera;

        this.map = new google.maps.Map(mapDiv, {
            mapId: mapId,
            backgroundColor: 'transparent',
            gestureHandling: 'greedy',
            zoom,
            center,
            heading,
            tilt
        });

        window.map = this.map;
    }

    /**
     * Returns the map-instance. Will throw an exception if called before the map is
     * initialized, so you have to await the mapReady promise.
     */
    getMapInstance() {
        if (!this.map) {
            throw new Error('Basemap.getMapInstance() called before map initialized.');
        }

        return this.map;
    }

    /**
     * Proxy-method for `map.moveCamera()`. Also stores the camera-position to be
     * used as the starting-position for camera-animations.
     */
    setCamera(camera) {
        Object.assign(this.camera, camera);

        if (this.map) {
            this.map.moveCamera(this.camera);
        }
    }

    /**
     * Returns the camera-parameters from the map.
     */
    getCamera() {
        return {
            center: this.map.getCenter(),
            tilt: this.map.getTilt(),
            zoom: this.map.getZoom(),
            heading: this.map.getHeading()
        };
    }

    /**
     * Syncs the internal state of the camera to values read from the map.
     * This is necessary in some situations for the camera-animations to
     * work properly.
     */
    syncCamera() {
        Object.assign(this.camera, this.getCamera());
    }

    /**
     * Starts an orbit-anomation around the current camera center-position
     * with the specified rotation-speed.
     * @param degreesPerSecond
     */
    animateOrbit(degreesPerSecond) {
        const animation = new OrbitAnimation(this);
        animation.initialHeading = this.map.getHeading();
        animation.degreesPerSecond = degreesPerSecond;

        animation.play();

        return animation;
    }

    /**
     * Starts a linear-animation (all properties are linearily interpolated)
     * over the specified properties. Supports an optional easing-function as third
     * argument (see https://easings.net/ for easing functions).
     * @param target
     * @param duration
     * @param easing
     */
    animateToLinear(target, duration, easing) {
        const animation = new LinearAnimation(this);
        animation.from = {...this.camera};
        animation.to = target;
        animation.duration = duration;
        animation.easing = easing;

        animation.play();

        return animation;
    }
}
