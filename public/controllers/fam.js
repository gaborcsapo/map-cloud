import { MapPage } from '../shared/mapPage.js';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CarCamAnimation } from '../shared/cameraAnimations.js';
import { Car } from '../shared/car.js';
import { FamCarPaths } from '../resources/paths/fam-paths.js'

import { Loader } from '@googlemaps/js-api-loader';

const initialViewport = {
    center: FamCarPaths[0].camPath[0],
    zoom: 18,
    tilt: 30,
    heading: 0,
};

class FamPage extends MapPage{
    initialize() {
        this.pathIdx = 0;
        this.overlay.setMap(this.baseMap.getMapInstance());
        this.car = new Car({carPath: FamCarPaths[this.pathIdx], overlay: this.overlay});
        this.startNextPath();
    }

    startNextPath() {
        this.cameraAnimation = new CarCamAnimation({
            basemap: this.baseMap,
            overlay: this.overlay,
            path: FamCarPaths[this.pathIdx],
        })
        this.car.startNewPath(FamCarPaths[this.pathIdx]);
        this.cameraAnimation.play();
        this.pathIdx++;
    }

    updateScene() {
        if (this.car.update() && (FamCarPaths.length > this.pathIdx)) {
            // car animation finished
            this.startNextPath();
        }
    }
}

(async () => {
    new Loader({apiKey: MAPS_API_KEY}).load().then(() => {
        const page = new FamPage({initialViewport: initialViewport});
        page.start();
    });
})();
