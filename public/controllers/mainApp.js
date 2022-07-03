import { CarCamAnimation } from './cameraAnimations.js';
import { FireworkGroup } from './fireworks';
import { Vehicle } from './vehicle.js';
import { Vector3 } from "three";
import { Loader } from '@googlemaps/js-api-loader';
import { InfoReader } from './infoReader.js';
import { SoundManager } from './soundManager.js';
import { ThreeJSOverlayView } from './threejsOverlayView.js';
import { BaseMapWrapper } from './baseMapWrapper.js';

const PLANE_LINE_COLOR = 0x285f4;
const CAR_LINE_COLOR = 0xf4b400;



class MainApp {
    constructor()
    {
        this.journeyStages = JSON.parse(journeyJSON);
        this.initialViewport = {
            center: this.journeyStages[0].route[0],
            zoom: 18,
            tilt: 30,
            heading: 0,
        };
        this.baseMapWrapper = new BaseMapWrapper({initialViewport: this.initialViewport, disableDefaultUI: false});
        this.overlay = new ThreeJSOverlayView();
        this.camera = {};

        this.overlay.setMap(this.baseMapWrapper.getMapInstance());
        this.stageIdx = 0;
        this.plane = new Vehicle({
            overlay: this.overlay,
            lineColor: PLANE_LINE_COLOR,
            modelPath: "/resources/3d/plane.gltf",
            front: new Vector3(-1, 0, 0),
            scale: 0.3,
            isImage: false,
        });
        this.car = new Vehicle({
            overlay: this.overlay,
            lineColor: CAR_LINE_COLOR,
            modelPath: "/resources/3d/car.gltf",
            front: new Vector3(1, 0, 0),
            scale: 0.2,
            isImage: false,
        });

        this.infoReader = new InfoReader();
        this.infoReader.loadAudio(this.journeyStages[this.stageIdx].text, this.journeyStages[this.stageIdx].language)
        this.soundManager = new SoundManager();

        this.myModal = new bootstrap.Modal('#splash-modal');
        this.myModal.show();
        document.getElementById("continue-button").onclick = function() {
            this.soundManager.playButtonClick();
            this.startNewJourney();
        }.bind(this);
    }

    setUpdateSceneCallback(callback) {
        this.overlay.updateSceneCallback = callback.bind(this);
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

            this.journeyStages[this.stageIdx].startDelay = this.infoReader.readText(isAirplaneOrAirportScene);

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

            this.cameraAnimation = new CarCamAnimation({
                baseMapWrapper: this.baseMapWrapper,
                overlay: this.overlay,
                journeyStageParams: this.journeyStages[this.stageIdx],
            });
            this.cameraAnimation.play();

            this.stageIdx++;
            if (this.journeyStages.length > this.stageIdx) {
                this.infoReader.loadAudio(this.journeyStages[this.stageIdx].text, this.journeyStages[this.stageIdx].language)
            }
        } else {
            if (this.stageIdx % this.journeyStages.length == 0)
                this.stageIdx += 3
            vehicle.loopPastJourneyStage(this.journeyStages[this.stageIdx % this.journeyStages.length]);
            this.stageIdx++;
        }
    }

    updateFlightScene() {
        if (this.plane.update())
        {
            this.startNextJourneyLeg(false);
            this.soundManager.playMusic();
            this.fireworks = new FireworkGroup({overlay: this.overlay, journeyStageParams: this.journeyStages[1]});
            this.setUpdateSceneCallback(this.updateFireworksScene);
        }
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
    }
}

(async () => {
    new Loader({apiKey: MAPS_API_KEY}).load().then(() => {
        const page = new MainApp();
    });
})();
