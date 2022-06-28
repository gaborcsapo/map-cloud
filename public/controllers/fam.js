import { MapPage } from '../controllers/mapPage.js';
import { CarCamAnimation } from '../controllers/cameraAnimations.js';
import { FireworkGroup } from '../controllers/fireworks';
import { Vehicle } from '../controllers/vehicle.js';
import { Vector3 } from "three";
import { Loader } from '@googlemaps/js-api-loader';
import { InfoReader } from '../controllers/infoReader.js';
import { SoundManager } from '../controllers/soundManager.js';

const PLANE_LINE_COLOR = 0x285f4;
const CAR_LINE_COLOR = 0xf4b400;

const FamCarPaths = JSON.parse(FAM_CAR_PATHS);

const initialViewport = {
    center: FamCarPaths[0].route[0],
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
            modelPath: "/resources/3d/plane.gltf",
            front: new Vector3(-1, 0, 0),
            scale: 0.3,
            baseMap: this.baseMap,
            isImage: false,
        });
        this.car = new Vehicle({
            overlay: this.overlay,
            lineColor: CAR_LINE_COLOR,
            modelPath: "/resources/3d/car.gltf",
            front: new Vector3(1, 0, 0),
            scale: 0.1,
            baseMap: this.baseMap,
            isImage: false,
        });

        this.infoReader = new InfoReader();
        this.infoReader.loadAudio(FamCarPaths[this.pathIdx].text)
        this.soundManager = new SoundManager();

        this.myModal = new bootstrap.Modal('#splash-modal');
        this.myModal.show();
        document.getElementById("continue-button").onclick = this.startJourney.bind(this);
    }

    startJourney() {
        this.myModal.hide();
        this.startNextJourneyLeg(this.plane);
        this.setUpdateSceneCallback(this.updateFlightScene);

        const waitTimeAirport = FamCarPaths[0].startDelay + FamCarPaths[0].zoomDuration;
        const flightTime = FamCarPaths[0].camMoveDuration + FamCarPaths[0].zoomDuration;
        this.soundManager.playAirportSound(waitTimeAirport);
        this.soundManager.playPlaneSound(waitTimeAirport, flightTime);
    }


    startNextJourneyLeg(vehicle) {
        console.log()
        if (FamCarPaths.length > this.pathIdx) {
            const isAirplaneOrAirportScene = this.pathIdx <= 1;

            FamCarPaths[this.pathIdx].startDelay = this.infoReader.readText(isAirplaneOrAirportScene);

            if (vehicle) {
                FamCarPaths[this.pathIdx].zoomDuration = 2000;
                const {zoomAmplitude, duration} = vehicle.startNewPath(FamCarPaths[this.pathIdx]);
                FamCarPaths[this.pathIdx].camMoveDuration = duration;
                FamCarPaths[this.pathIdx].zoomAmplitude = zoomAmplitude;
            } else {
                FamCarPaths[this.pathIdx].startDelay += 1000;
                FamCarPaths[this.pathIdx].camMoveDuration = 2000;
                FamCarPaths[this.pathIdx].zoomAmplitude = 0;
                FamCarPaths[this.pathIdx].zoomDuration = 100;
            }

            console.log(FamCarPaths[this.pathIdx].startDelay, FamCarPaths[this.pathIdx].camMoveDuration, FamCarPaths[this.pathIdx].zoomAmplitude, FamCarPaths[this.pathIdx].zoomDuration)

            this.cameraAnimation = new CarCamAnimation({
                basemap: this.baseMap,
                overlay: this.overlay,
                path: FamCarPaths[this.pathIdx],
            });
            this.cameraAnimation.play();

            this.pathIdx++;
            if (FamCarPaths.length > this.pathIdx) {
                this.infoReader.loadAudio(FamCarPaths[this.pathIdx].text)
            }
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
            this.startNextJourneyLeg(false);
            this.soundManager.playMusic();
            this.fireworks = new FireworkGroup({overlay: this.overlay, path: FamCarPaths[1]});
            this.setUpdateSceneCallback(this.updateFireworksScene);
        }
    }

    updateFireworksScene() {
        if (this.fireworks.update())
        {
            this.fireworks = null;
            this.startNextJourneyLeg(this.car);
            const waitTime = FamCarPaths[2].startDelay + FamCarPaths[2].zoomDuration;
            const driveTime = FamCarPaths[2].camMoveDuration + FamCarPaths[2].zoomDuration;
            this.soundManager.playCarSound(waitTime, driveTime);
            this.setUpdateSceneCallback(this.updateCarScene);
        }
    }

    updateCarScene() {
        if (this.car.update()) {
            // car animation finished
            if (FamCarPaths.length == this.pathIdx) {
                this.soundManager.musicVolumeDown();
            }
            this.startNextJourneyLeg(this.car);
            if (FamCarPaths.length > this.pathIdx) {
                const waitTime = FamCarPaths[this.pathIdx - 1].startDelay + FamCarPaths[this.pathIdx - 1].zoomDuration;
                const driveTime = FamCarPaths[this.pathIdx - 1].camMoveDuration + FamCarPaths[this.pathIdx - 1].zoomDuration;
                this.soundManager.playCarSound(waitTime, driveTime);
            }
        }
    }
}

(async () => {
    new Loader({apiKey: MAPS_API_KEY}).load().then(() => {
        const page = new FamPage({initialViewport: initialViewport});
        page.start();
    });
})();
