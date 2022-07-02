import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader.js';
import {Line2} from 'three/examples/jsm/lines/Line2.js';
import {LineGeometry} from 'three/examples/jsm/lines/LineGeometry';
import {LineMaterial} from 'three/examples/jsm/lines/LineMaterial';
import {CatmullRomCurve3, Vector3, MathUtils} from 'three';
import { latLngToVector3 } from './coordinates.js';
import { easeInOutCubic } from './easing.js';

const ARC_LENGTH_DIVISIONS = 150;
const tmpVec3 = new Vector3();

export class Vehicle {
    constructor({overlay, lineColor, modelPath, front, scale}) {
        this.overlay = overlay;
        this.previousVehicleLines = [];
        this.scene = overlay.getScene();
        this.lineColor = lineColor;
        this.vehicleFront = front;
        this.scale = scale;
        this.map = this.overlay.getMap();
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

        const zoomAmplitude = Math.min(14.19135 + (0.301789 - 14.19135)/(1 + Math.pow(this.vehicleSpline.getLength()/163175.6, 0.583)), 13)

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
        this.counter++;
        if (this.counter % 20) {
            this.vehicleLine.material.resolution.copy(this.overlay.getViewportSize());
            this.previousVehicleLines.forEach(element => {
                element.material.resolution.copy(this.overlay.getViewportSize());
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
              linewidth: 4,
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

        this.vehicleLine.material.resolution.copy(this.overlay.getViewportSize());
        this.vehicleLine.geometry.setPositions(vehiclePositions);
        this.vehicleLine.computeLineDistances();
    }
}