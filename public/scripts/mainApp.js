import { CarCamAnimation } from './threejsObjects/cameraAnimations.js';
import { Vehicle as VehicleManager } from './controllers/vehicleManager.js';
import { Vector3 } from "three";
import { Loader } from '@googlemaps/js-api-loader';
import { AudioManager } from './controllers/audioManager.js';
import { SoundManager } from './controllers/soundManager.js';
import { MapAndOverlayManager } from './controllers/mapAndOverlayManager.js';
import { MarkerManager } from './controllers/markerManager.js';
import { PictureManager } from './controllers/pictureManager.js';
import { FireworksManager } from './controllers/fireworksManager.js';

const PLANE_LINE_COLOR = 0x285f4;
const CAR_LINE_COLOR = 0xf4b400;
const INITIAL_ZOOM = 18;

class MainApp {
    constructor()
    {
        this.journeyStages = JSON.parse(journeyJSON);
        this.initialViewport = {
            center: this.journeyStages[0].route[0],
            zoom: INITIAL_ZOOM,
            tilt: 30,
            heading: 0,
        };
        this.mapAndOverlayManager = new MapAndOverlayManager({initialViewport: this.initialViewport, disableDefaultUI: false});

        this.stageIdx = 0;
        this.plane = new VehicleManager({
            mapAndOverlayManager: this.mapAndOverlayManager,
            lineColor: PLANE_LINE_COLOR,
            modelPath: "/resources/3d/plane.gltf",
            front: new Vector3(-1, 0, 0),
            scale: 0.3,
            isImage: false,
        });
        this.car = new VehicleManager({
            mapAndOverlayManager: this.mapAndOverlayManager,
            lineColor: CAR_LINE_COLOR,
            modelPath: "/resources/3d/car.gltf",
            front: new Vector3(1, 0, 0),
            scale: 0.2,
            isImage: false,
        });

        this.infoReader = new AudioManager();
        this.infoReader.loadText2Voice(this.journeyStages[this.stageIdx].text, this.journeyStages[this.stageIdx].language)
        this.soundManager = new SoundManager();
        this.markerManager = new MarkerManager({map: this.mapAndOverlayManager.getMapInstance(),
                                                scene: this.mapAndOverlayManager.getScene()
                                                });
        this.pictureManager = new PictureManager({map: this.mapAndOverlayManager.getMapInstance(),
                                                  scene: this.mapAndOverlayManager.getScene()
                                                });
        this.journeyStages.forEach(element => {
            if (element.celebImgURL != undefined) {
                this.pictureManager.preLoadImage(element.celebImgURL);
            }
        });

        this.myModal = new bootstrap.Modal('#splash-modal');
        this.myModal.show();
        document.getElementById("continue-button").onclick = function() {
            document.getElementById('map').style.position="absolute";
            google.maps.event.trigger(this.mapAndOverlayManager.getMapInstance(), 'resize');
            this.soundManager.playButtonClick();
            this.startNewJourney();
        }.bind(this);
    }

    setUpdateSceneCallback(callback) {
        this.mapAndOverlayManager.updateSceneCallback = callback.bind(this);
    }

    startNewJourney() {
        this.myModal.hide();
        this.startNextJourneyLeg(this.plane);
        this.setUpdateSceneCallback(this.updateFlightScene);

        const waitTimeAirport = this.journeyStages[0].startDelay + this.journeyStages[0].zoomDuration;
        const flightTime = this.journeyStages[0].camMoveDuration + this.journeyStages[0].zoomDuration;
        this.soundManager.playAirportSound(waitTimeAirport);
        this.soundManager.playPlaneSound(waitTimeAirport, flightTime);
    }

    startNextJourneyLeg(vehicle) {
        if (this.journeyStages.length > this.stageIdx) {
            const isAirplaneOrAirportScene = this.stageIdx <= 1;

            // Load picture
            if (this.journeyStages[this.stageIdx].celebImgURL != undefined) {
                let [position] = this.journeyStages[this.stageIdx].route.slice(-1);
                position.y += 120;
                this.pictureManager.loadImageMesh(this.journeyStages[this.stageIdx].celebImgURL, position);
            }

            // Read text
            this.journeyStages[this.stageIdx].startDelay = this.infoReader.readLoadedText2Voice(isAirplaneOrAirportScene);

            // Calculate new route and timing
            if (vehicle) {
                this.journeyStages[this.stageIdx].zoomDuration = 2000;
                const {zoomAmplitude, duration} = vehicle.startNewJourneyStage(this.journeyStages[this.stageIdx]);
                this.journeyStages[this.stageIdx].camMoveDuration = duration;
                this.journeyStages[this.stageIdx].zoomAmplitude = zoomAmplitude;
            } else {
                this.journeyStages[this.stageIdx].startDelay += 1000;
                this.journeyStages[this.stageIdx].camMoveDuration = 2000;
                this.journeyStages[this.stageIdx].zoomAmplitude = 0;
                this.journeyStages[this.stageIdx].zoomDuration = 100;
            }

            // Start camera on the new route
            this.cameraAnimation = new CarCamAnimation({
                mapAndOverlayManager: this.mapAndOverlayManager,
                journeyStageParams: this.journeyStages[this.stageIdx],
            });
            this.cameraAnimation.play();

            // Prepare for the next stage by preloading stuff
            this.stageIdx++;
            if (this.journeyStages.length > this.stageIdx) {
                this.infoReader.loadText2Voice(this.journeyStages[this.stageIdx].text, this.journeyStages[this.stageIdx].language);
                this.markerManager.addMarker(this.journeyStages[this.stageIdx].route[0], "Label Demo BLAblaBla");
            }
        } else {
            // Skip plane scenes
            if (this.stageIdx % this.journeyStages.length == 0)
                this.stageIdx += 3
            // Loop the car
            vehicle.loopPastJourneyStage(this.journeyStages[this.stageIdx % this.journeyStages.length]);
            this.stageIdx++;
        }
    }

    updateFlightScene() {
        if (this.plane.update())
        {
            this.startNextJourneyLeg(false);
            this.soundManager.playMusic();
            this.fireworks = new FireworksManager({
                scene: this.mapAndOverlayManager.getScene(),
                latLng: this.journeyStages[1].route[0],
                duration: this.journeyStages[1].startDelay + this.journeyStages[1].zoomDuration * 2 + this.journeyStages[1].camMoveDuration
            });
            this.setUpdateSceneCallback(this.updateFireworksScene);
        }
        this.markerManager.update();
    }

    updateFireworksScene() {
        if (this.fireworks.update())
        {
            this.fireworks = null;
            this.startNextJourneyLeg(this.car);
            const waitTime = this.journeyStages[2].startDelay + this.journeyStages[2].zoomDuration;
            const driveTime = this.journeyStages[2].camMoveDuration + this.journeyStages[2].zoomDuration;
            this.soundManager.playCarSound(waitTime, driveTime);
            this.setUpdateSceneCallback(this.updateCarScene);
        }
        this.markerManager.update();
    }

    updateCarScene() {
        if (this.car.update()) {
            // car animation finished
            if (this.journeyStages.length == this.stageIdx) {
                const toastLiveExample = document.getElementById('liveToast');
                const toast = new bootstrap.Toast(toastLiveExample);
                toast.show();
                this.soundManager.musicVolumeDown();
            }
            this.startNextJourneyLeg(this.car);
            if (this.journeyStages.length > this.stageIdx) {
                const waitTime = this.journeyStages[this.stageIdx - 1].startDelay + this.journeyStages[this.stageIdx - 1].zoomDuration;
                const driveTime = this.journeyStages[this.stageIdx - 1].camMoveDuration + this.journeyStages[this.stageIdx - 1].zoomDuration;
                this.soundManager.playCarSound(waitTime, driveTime);
            }
        }
        this.markerManager.update();
    }
}

(async () => {
    new Loader({apiKey: MAPS_API_KEY}).load().then(() => {
        const page = new MainApp();
    });
})();
