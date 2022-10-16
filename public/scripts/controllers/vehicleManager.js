import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader.js';
import {Line2} from 'three/examples/jsm/lines/Line2.js';
import {LineGeometry} from 'three/examples/jsm/lines/LineGeometry';
import {LineMaterial} from 'three/examples/jsm/lines/LineMaterial';
import {CatmullRomCurve3, Vector3, MathUtils} from 'three';
import { latLngToVector3 } from '../utilities/coordinates.js';
import { easeInOutCubic } from '../utilities/easing.js';

const ARC_LENGTH_DIVISIONS = 150;
const tmpVec3 = new Vector3();

export class VehicleManager {
    constructor({mapAndOverlayManager, lineColor, modelPath, front, scale}) {
        this.mapAndOverlayManager = mapAndOverlayManager;
        this.previousVehicleLines = [];
        this.scene = mapAndOverlayManager.getScene();
        this.lineColor = lineColor;
        this.vehicleFront = front;
        this.scale = scale;
        this.map = this.mapAndOverlayManager.getMapInstance();
        this.counter = 0;

        this.loadVehicleModel(modelPath).then(model => {
            this.vehicleModel = model;
            this.scene.add(this.vehicleModel);
        });
    }

    startNewJourneyStage(vehiclePath) {
        this.vehicleSpline = new CatmullRomCurve3(
            vehiclePath.route.map(({lat, lng}) => latLngToVector3({lat, lng})),
            false,
            'centripetal',
            0.2
        );

        // rougly 1sec/km should be duration with a max of 25 sec
        const duration = Math.round(Math.min(this.vehicleSpline.getLength() / 0.9, 25000));

        // The zoomamplitude equation is just a exponential curve fitting for these y/x values:
        // 12     1508257.9025383398
        // 4       25943.69836456524
        // 3.8     21074.388344540803
        // 13     6067340.345612513
        // 7      142126.16128664665
        // 13.5    8587727.398089878
        // 5      48061.46991743621
        // 2.8    7756.402385156812
        // 13.5   12079192.250058014
        // 5      45619.223347196
        // 2.9    7807.924142224345


        const zoomAmplitude  = Math.min(13.68244 + (1.556327 - 13.68244)/Math.pow(1 + Math.pow((this.vehicleSpline.getLength()/1036770), 0.6166804), 2.364686), 14);

        this.initVehicleLine(this.vehicleSpline);
        this.scene.add(this.vehicleLine);

        this.vehicleStartDelay = vehiclePath.startDelay + vehiclePath.zoomDuration;
        this.totalDuration = duration + vehiclePath.zoomDuration;

        this.startTimestamp = performance.now();
        return {zoomAmplitude: zoomAmplitude, duration: duration};
    }

    loopPastJourneyStage(vehiclePath) {
        this.vehicleSpline = new CatmullRomCurve3(
            vehiclePath.route.map(({lat, lng}) => latLngToVector3({lat, lng})),
            false,
            'centripetal',
            0.2
        );

        this.vehicleStartDelay = 0;
        this.totalDuration = vehiclePath.camMoveDuration + vehiclePath.zoomDuration;

        this.startTimestamp = performance.now();
    }

    update() {
        if (!this.vehicleModel) {
            return false;
        }

        // Save computation by updating the scale only every ~ 0.5 seconds
        if (this.counter++ % 3) {
            this.vehicleLine.material.resolution.copy(this.mapAndOverlayManager.getViewportSize());
            this.previousVehicleLines.forEach(element => {
                element.material.resolution.copy(this.mapAndOverlayManager.getViewportSize());
            });

            const zoom = this.map.getZoom();
            this.vehicleModel.scale.setScalar(this.scale * Math.pow(1.7, 25 - (zoom || 0)));
        }

        const sceneTime = performance.now() - this.startTimestamp;
        const linearProgress = MathUtils.clamp((sceneTime - this.vehicleStartDelay) / this.totalDuration, 0, 1);

        if (linearProgress === 1) {
            // Animation is done
            return true;
        }

        // vehicle position/rotation
        const progress = easeInOutCubic(linearProgress);

        this.vehicleSpline.getPointAt(progress, this.vehicleModel.position);
        this.vehicleSpline.getTangentAt(progress, tmpVec3);
        this.vehicleModel.quaternion.setFromUnitVectors(this.vehicleFront, tmpVec3);

        return false;
    }

    loadVehicleModel(modelPath) {
        if (modelPath.slice(-4) == "gltf") {
            const gltfLoader = new GLTFLoader();

            return new Promise(resolve => {
                gltfLoader.load(modelPath, gltf => {
                    const vehicle = gltf.scene;
                    resolve(vehicle);
                });
            });
        } else if (modelPath.slice(-4) == ".obj") {
            const objLoader = new OBJLoader();

            return new Promise(resolve => {
                objLoader.load(modelPath, obj => {
                    resolve(obj);
                });
            });
        }
    }

    initVehicleLine(vehicleSpline) {
        if (this.vehicleLine)
        {
            this.previousVehicleLines.push(this.vehicleLine);
        }

        this.vehicleLine = new Line2(
            new LineGeometry(),
            new LineMaterial({
              color: this.lineColor,
              linewidth: 6,
              vertexColors: false,
              dashed: false
            })
        );

        vehicleSpline.arcLengthDivisions = ARC_LENGTH_DIVISIONS;
        const vehicleCurvePoints = vehicleSpline.getSpacedPoints(vehicleSpline.points.length);
        const vehiclePositions = new Float32Array(vehicleCurvePoints.length * 3);
        for (let i = 0; i < vehicleCurvePoints.length; i++) {
            vehicleCurvePoints[i].toArray(vehiclePositions, 3 * i);
        }

        this.vehicleLine.material.resolution.copy(this.mapAndOverlayManager.getViewportSize());
        this.vehicleLine.geometry.setPositions(vehiclePositions);
        this.vehicleLine.computeLineDistances();
    }

    deletePreviousLines() {
        this.previousVehicleLines.forEach((line) => {
            this.scene.remove(line);
        });
        this.previousVehicleLines = [];
    }
}