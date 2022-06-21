import { MapPage } from '../shared/mapPage.js';
import { CarCamAnimation } from '../shared/cameraAnimations.js';
import { FireworkGroup } from '../shared/fireworks';
import { Vehicle } from '../shared/vehicle.js';
import { FamCarPaths } from '../resources/paths/fam-paths.js'
import { Vector3 } from "three";
import { Loader } from '@googlemaps/js-api-loader';
import { InfoSign } from '../shared/infoSign.js';

const PLANE_LINE_COLOR = 0x285f4;
const CAR_LINE_COLOR = 0xf4b400;

const initialViewport = {
    center: FamCarPaths[0].camPath[0],
    zoom: 18,
    tilt: 30,
    heading: 0,
};

class FamPage extends MapPage{
    initialize() {
        this.overlay.setMap(this.baseMap.getMapInstance());
        this.pathIdx = 0;
        this.plane = new Vehicle({
            overlay: this.overlay,
            lineColor: PLANE_LINE_COLOR,
            modelPath: "resources/3d/plane.gltf",
            front: new Vector3(-1, 0, 0),
            scale: 0.3,
            baseMap: this.baseMap,
            isImage: false,
        });
        this.car = new Vehicle({
            overlay: this.overlay,
            lineColor: CAR_LINE_COLOR,
            modelPath: "resources/3d/car.gltf",
            front: new Vector3(1, 0, 0),
            scale: 0.1,
            baseMap: this.baseMap,
            isImage: false,
        });

        this.startNextJourneyLeg(this.plane);
        this.setUpdateSceneCallback(this.updateFlightScene);
    }


    startNextJourneyLeg(vehicle) {
        if (FamCarPaths.length > this.pathIdx) {
            this.cameraAnimation = new CarCamAnimation({
                basemap: this.baseMap,
                overlay: this.overlay,
                path: FamCarPaths[this.pathIdx],
            });
            if (vehicle)
                vehicle.startNewPath(FamCarPaths[this.pathIdx]);
            // this.sign = new InfoSign(this.overlay.getScene(), this.baseMap, initialViewport.zoom, FamCarPaths[this.pathIdx].infoSign);
            this.cameraAnimation.play();
            this.pathIdx++;
        } else {
            if (this.pathIdx % FamCarPaths.length == 0)
                this.pathIdx += 3
            vehicle.loopOldPath(FamCarPaths[this.pathIdx % FamCarPaths.length]);
            this.pathIdx++;
        }
    }

    updateFlightScene() {
        if (this.plane.update())
        {
            this.fireworks = new FireworkGroup({overlay: this.overlay, path: FamCarPaths[this.pathIdx]});
            //this.sign.destroy();
            this.startNextJourneyLeg(false);
            this.setUpdateSceneCallback(this.updateFireworksScene);
        }
    }

    updateFireworksScene() {
        if (this.fireworks.update())
        {
            this.fireworks = null;
            this.startNextJourneyLeg(this.car);
            this.setUpdateSceneCallback(this.updateCarScene);
        }
    }

    updateCarScene() {
        if (this.car.update()) {
            // car animation finished
            this.startNextJourneyLeg(this.car);
        }
    }
}

(async () => {
    new Loader({apiKey: MAPS_API_KEY}).load().then(() => {
        const page = new FamPage({initialViewport: initialViewport});
        page.start();
    });
})();
