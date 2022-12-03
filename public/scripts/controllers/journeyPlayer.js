import { ZoomAnimation, MoveAnimation } from '../threejsObjects/cameraAnimations.js';
import { VehicleManager } from './vehicleManager.js';
import { Vector3 } from "three";
import { SoundManager } from './soundManager.js';
import { MapAndOverlayManager } from './mapAndOverlayManager.js';
import { MarkerManager } from './markerManager.js';
import { PictureManager } from './pictureManager.js';
import { FireworksManager } from './fireworksManager.js';
import { TimelineManager } from './timelineManager.js';

const PLANE_LINE_COLOR = 0x285f4;
const CAR_LINE_COLOR = 0xf4b400;
const INITIAL_ZOOM = 18;

export class JourneyPlayer {
    constructor(journeyStages){
        this.journeyStages = journeyStages;
        this.stageIdx = -1;
        this.journeySequence = [];

        this.initialViewport = {
            center: this.journeyStages[0].route[0],
            zoom: INITIAL_ZOOM,
            tilt: 45,
            heading: 0,
        };

        this.mapAndOverlayManager = new MapAndOverlayManager({
            initialViewport: this.initialViewport,
            disableDefaultUI: false
        });

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
        this.fireworks = new FireworksManager({
            scene: this.mapAndOverlayManager.getScene()
        })

        this.soundManager = new SoundManager();
        this.timelineManager = new TimelineManager({
            journeyStages: this.journeyStages
        });
        this.markerManager = new MarkerManager({
            map: this.mapAndOverlayManager.getMapInstance(),
            scene: this.mapAndOverlayManager.getScene()
        });
        this.pictureManager = new PictureManager({
            map: this.mapAndOverlayManager.getMapInstance(),
            scene: this.mapAndOverlayManager.getScene()
        });

        this.journeyStages.forEach(element => {
            if (element.picture != undefined) {
                this.pictureManager.preLoadImage(element.picture);
            }
        });

        this.setupJourneySequence();
    }

    playJourney() {
        this.mapAndOverlayManager.setUpdateSceneCallback(this.updateSceneCallback.bind(this));
        this.nextStage();

        this.journeySequence.reduce((promiseChain, currentTask) => {
            return promiseChain.then(chainResults =>
                currentTask().then(currentResult =>
                    [ ...chainResults, currentResult ]
                )
            );
        }, Promise.resolve([])).then(arrayOfResults => {
            this.playJourneyEndLoop();
        });
    }

    async playJourneyEndLoop() {
        this.soundManager.musicVolumeDown();

        while (true) {
            for (let i = 0; i < this.journeyStages.length; i++) {
                await this.startJourneyEndVehicleTrip(this.journeyStages[i]);
            }
        }
    }

    updateSceneCallback() {
        this.plane.update();
        this.car.update();
        this.fireworks.update();
    }

    setupJourneySequence() {
        this.journeyStages.forEach(stage => {
            if (stage.getRouteType() == "plane") {
                this.journeySequence = this.journeySequence.concat([
                    this.setupPlaneScene.bind(this),
                    this.narrateScene.bind(this),
                    this.zoomOutCamera.bind(this),
                    this.startVehicleTrip.bind(this),
                    this.zoomInCamera.bind(this),
                    this.nextStage.bind(this),
                ]);
            } else if (stage.getRouteType() == "car") {
                this.journeySequence = this.journeySequence.concat([
                    this.narrateScene.bind(this),
                    this.zoomOutCamera.bind(this),
                    this.startVehicleTrip.bind(this),
                    this.zoomInCamera.bind(this),
                    this.nextStage.bind(this),
                ]);
            } else if (stage.getRouteType() == "shift") {
                this.journeySequence = this.journeySequence.concat([
                    this.narrateScene.bind(this),
                    this.moveCamera.bind(this),
                    this.nextStage.bind(this),
                ]);
            }
        });
    }

    setupPlaneScene() {
        this.soundManager.playAirportSound();
        this.soundManager.playChime();
        return new Promise(resolve => setTimeout(resolve, 2000));
    }

    narrateScene() {
        const stage = this.journeyStages[this.stageIdx];

        this.timelineManager.open(this.stageIdx);
        if (stage.hasFireworks()) {
            this.fireworks.start({
                latLng: stage.route[0],
                duration: 6000,
            });
        }

        return this.soundManager.playAudio(stage.getNarrationAudio());
    }

    zoomInCamera() {
        const stage = this.journeyStages[this.stageIdx];

        this.cameraAnimation = new ZoomAnimation({
            mapAndOverlayManager: this.mapAndOverlayManager,
            duration: stage.getZoomDuration(),
            startingZoom: stage.getTargetZoom(),
            targetZoom: stage.getStartingZoom(),
            center: stage.route[stage.route.length - 1],
        });
        this.cameraAnimation.play();
        return new Promise(resolve => setTimeout(resolve, stage.getZoomDuration()));
    }

    zoomOutCamera() {
        const stage = this.journeyStages[this.stageIdx];

        this.cameraAnimation = new ZoomAnimation({
            mapAndOverlayManager: this.mapAndOverlayManager,
            duration: stage.getZoomDuration(),
            startingZoom: stage.getStartingZoom(),
            targetZoom: stage.getTargetZoom(),
            center: stage.route[0],
        });
        this.cameraAnimation.play();
        return new Promise(resolve => setTimeout(resolve, stage.getZoomDuration()));
    }

    moveCamera() {
        const stage = this.journeyStages[this.stageIdx];

        this.cameraAnimation = new MoveAnimation({
            mapAndOverlayManager: this.mapAndOverlayManager,
            duration: stage.getCamMoveDuration(),
            route: stage.route,
        });
        this.cameraAnimation.play();

        return new Promise(resolve => setTimeout(resolve, stage.getCamMoveDuration()));
    }

    startVehicleTrip() {
        const stage = this.journeyStages[this.stageIdx];

        if (stage.getRouteType() == "plane") {
            this.vehicle = this.plane;
            this.soundManager.stopAirportSound();
            this.soundManager.playPlaneSound();
        } else if (stage.getRouteType() == "car") {
            this.vehicle = this.car;
            this.soundManager.playCarSound();
        }
        this.vehicle.startNewJourneyStage(stage.route, stage.getCamMoveDuration());
        this.vehicle.addLineToCurrentTrip();
        this.mapAndOverlayManager.enableMapUI(false);

        this.cameraAnimation = new MoveAnimation({
            mapAndOverlayManager: this.mapAndOverlayManager,
            duration: stage.getCamMoveDuration(),
            route: stage.route,
        });
        this.cameraAnimation.play();

        return new Promise(resolve => setTimeout(() => {
            this.soundManager.stopPlaneSound();
            this.soundManager.stopCarSound();
            this.mapAndOverlayManager.enableMapUI(true);
            resolve();
        }, stage.getCamMoveDuration()));
    }

    startJourneyEndVehicleTrip(stage) {
        if ((stage.getRouteType() == "plane") || (stage.getRouteType() == "shift")) {
            return Promise.resolve();
        } else if (stage.getRouteType() == "car") {
            this.car.startNewJourneyStage(stage.route, stage.getCamMoveDuration());
            return new Promise(resolve => setTimeout(resolve, stage.getCamMoveDuration()));
        }
    }

    nextStage() {
        this.stageIdx++;

        if (this.journeyStages.length > this.stageIdx) {
            this.markerManager.addMarker(this.journeyStages[this.stageIdx].route[0], this.journeyStages[this.stageIdx].markerTitle);

            // Load picture
            if (this.journeyStages[this.stageIdx].picture != undefined) {
                let [position] = this.journeyStages[this.stageIdx].route.slice(-1);
                position.y += 120;
                this.pictureManager.loadImageMesh(this.journeyStages[this.stageIdx].picture, position);
            }
        }

        return Promise.resolve();
    }
}
