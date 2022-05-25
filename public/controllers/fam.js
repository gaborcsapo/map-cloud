import { MapPage } from '../shared/mapPage.js';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CarCamAnimation } from '../shared/cameraAnimations.js';
import { latLngToVector3 } from '../shared/coordinates.js';
import { FamCarCamPath } from '../resources/paths/fam-paths.js'

import { Loader } from '@googlemaps/js-api-loader';

const initialViewport = {
    center: { lat: 25.080145, lng: 121.232534},
    zoom: 16,
    tilt: 0,
    heading: 0,
};

const ANIMATION_DURATION = 40000;
const START_DELAY = 1000;
const DESTINATION_ZOOM = 18;
const TARGET_HEADING = 160;

class FamPage extends MapPage{
    initialize() {
        this.cameraAnimation = new CarCamAnimation({
            basemap: this.baseMap,
            overlay: this.overlay,
            cameraPath: FamCarCamPath,
            duration: ANIMATION_DURATION,
            delay: START_DELAY,
            targetZoom: DESTINATION_ZOOM,
            targetHeading: TARGET_HEADING,
            origin: initialViewport
        })
        this.initScene();
    }

    start() {
        this.cameraAnimation.play();
    };

    stop() {
    };

    initScene() {
        this.overlay.setMap(this.baseMap.getMapInstance());

        this.box = new THREE.Mesh(
            new THREE.BoxBufferGeometry(10, 50, 10),
            new THREE.MeshNormalMaterial(),
        );
        this.overlay.getScene().add(this.box);
        this.box.position.copy(latLngToVector3(initialViewport.center));
        this.box.position.setY(25);
    }

    updateScene() {
        this.box.rotateY(THREE.MathUtils.degToRad(0.1));
    }
}

(async () => {
    new Loader({apiKey: MAPS_API_KEY}).load().then(() => {
        const page = new FamPage({initialViewport: initialViewport});
        page.start();
    });
})();
