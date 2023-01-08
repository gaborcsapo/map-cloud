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
const FIREWORKS_DURATION = 6000;

export class JourneyPlayer {
    constructor(journeyStages, disableDefaultUI){
        this.playCount = 0;
        this.defaultDisableDefaultUI = disableDefaultUI == undefined ? false : disableDefaultUI;
        this.initialViewport = {
            center: journeyStages[0].route[0],
            zoom: INITIAL_ZOOM,
            tilt: 45,
            heading: 0,
        };

        this.mapAndOverlayManager = new MapAndOverlayManager({
            initialViewport: this.initialViewport,
            disableDefaultUI: this.defaultDisableDefaultUI
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

        this.markerManager = new MarkerManager({
            map: this.mapAndOverlayManager.getMapInstance(),
            scene: this.mapAndOverlayManager.getScene()
        });
        this.pictureManager = new PictureManager({
            map: this.mapAndOverlayManager.getMapInstance(),
            scene: this.mapAndOverlayManager.getScene()
        });

        this.setNewJourney(journeyStages);
    }

    setNewJourney(journeyStages) {
        this.markerManager.clearMarkers();
        this.pictureManager.clearImages();
        this.car.deletePreviousLines();
        this.plane.deletePreviousLines();
        this.car.stopJourneyStage();
        this.plane.stopJourneyStage();
        if (this.cameraAnimation)
            this.cameraAnimation.pause();
        this.soundManager.stopAirportSound();
        this.soundManager.stopPlaneSound();
        this.soundManager.stopCarSound();

        this.journeyStages = journeyStages;
        this.stageIdx = -1;
        this.playCount++;
        this.journeySequence = [];
        this.journeyStages.forEach(element => {
            if (element.picture != undefined) {
                this.pictureManager.preLoadImage(element.picture);
            }
        });
        this.timelineManager = new TimelineManager({
            journeyStages: this.journeyStages
        });
        this.mapAndOverlayManager.setMapCamera({
            center: journeyStages[0].route[0],
            zoom: INITIAL_ZOOM,
            tilt: 45,
            heading: 0,
        });
        this.setupJourneySequence();
    }

    playJourney(callback) {
        this.playCount++;
        let currentPlayCount = this.playCount;

        this.mapAndOverlayManager.setUpdateSceneCallback(this.updateSceneCallback.bind(this));
        this.nextStage();

        this.journeySequence.reduce((promiseChain, currentTask) => {
            return promiseChain.then(chainResults => {
                if (currentPlayCount == this.playCount) {
                    return currentTask().then(currentResult =>
                        [ ...chainResults, currentResult ]
                    )
                } else {
                    return Promise.resolve([ ...chainResults]);
                }
            });
        }, Promise.resolve([])).then(arrayOfResults => {
            if (callback) {
                callback();
            }

            if (currentPlayCount == this.playCount) {
                this.playJourneyEndLoop();
            }
        });
    }

    async playJourneyEndLoop() {
        this.soundManager.musicVolumeDown();
        let currentPlayCount = this.playCount; // we need to cancel this if the journey was updated

        while (this.journeyStages.some((stage) => {return stage.getRouteType() == "car"})) {
            for (let i = 0; i < this.journeyStages.length; i++) {
                if (currentPlayCount != this.playCount) {
                    return;
                }

                let stage = this.journeyStages[i];
                if ((stage.getRouteType() == "plane") || (stage.getRouteType() == "teleportation")) {
                    continue;
                } else if (stage.getRouteType() == "car") {
                    this.car.startNewJourneyStage(stage.route, stage.getCamMoveDuration());
                    await new Promise(resolve => setTimeout(resolve, stage.getCamMoveDuration()));
                }
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
                    this.waitForMapLoaded.bind(this),
                    this.startVehicleTrip.bind(this),
                    this.zoomInCamera.bind(this),
                    this.nextStage.bind(this),
                ]);
            } else if (stage.getRouteType() == "car") {
                this.journeySequence = this.journeySequence.concat([
                    this.narrateScene.bind(this),
                    this.zoomOutCamera.bind(this),
                    this.waitForMapLoaded.bind(this),
                    this.startVehicleTrip.bind(this),
                    this.zoomInCamera.bind(this),
                    this.nextStage.bind(this),
                ]);
            } else if (stage.getRouteType() == "teleportation") {
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
        let returnPromise = this.soundManager.playAudio(stage.getNarrationAudio())

        // exception for homeApp
        if (stage.getNarrationAudio() &&
            (stage.getNarrationAudio().byteLength == 0) &&
            (stage.getNarrationDuration() > 0)) {
            returnPromise = new Promise(resolve => setTimeout(resolve, stage.getNarrationDuration()));
        }
        // if no text is given but we have to play fireworks
        if (stage.hasFireworks()) {
            this.fireworks.start({
                latLng: stage.route[0],
                duration: FIREWORKS_DURATION,
            });
            if (stage.getNarrationDuration() < FIREWORKS_DURATION) {
                returnPromise = new Promise(resolve => setTimeout(resolve, FIREWORKS_DURATION));
            }
        }

        return returnPromise;
    }

    waitForMapLoaded() {
        return new Promise(resolve => {
            let map = this.mapAndOverlayManager.getMapInstance()
            let tilesloadedHandler = () => {
                google.maps.event.clearInstanceListeners(map);
                resolve();
            };

            map.addListener("tilesloaded", tilesloadedHandler);

            if (Object.hasOwn(map, "tilesloading") && !this.mapAndOverlayManager.getMapInstance().tilesloading) {
                google.maps.event.clearInstanceListeners(map);
                resolve();
            }
        });
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
        this.vehicle.addVehicleLine();
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
            this.mapAndOverlayManager.enableMapUI(!this.defaultDisableDefaultUI);
            resolve();
        }, stage.getCamMoveDuration()));
    }

    nextStage() {
        this.stageIdx++;

        if (this.journeyStages.length > this.stageIdx) {
            if (this.journeyStages[this.stageIdx].markerTitle && this.journeyStages[this.stageIdx].markerTitle.length > 0) {
                this.markerManager.addMarker(this.journeyStages[this.stageIdx].route[0], this.journeyStages[this.stageIdx].markerTitle);
            }

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
