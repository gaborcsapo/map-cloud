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
        this.startTimestamp = 0;

        this.loadVehicleModel(modelPath).then(model => {
            this.vehicleModel = model;
            this.scene.add(this.vehicleModel);
        });
    }

    startNewJourneyStage(route, duration) {
        this.vehicleSpline = new CatmullRomCurve3(
            route.map(({lat, lng}) => latLngToVector3({lat, lng})),
            false,
            'centripetal',
            0.2
        );

        this.totalDuration = duration;
        this.startTimestamp = performance.now();
    }

    addLineToCurrentTrip() {
        this.initVehicleLine(this.vehicleSpline);
        this.scene.add(this.vehicleLine);
    }

    update() {
        if (this.startTimestamp != 0) {
            const sceneTime = performance.now() - this.startTimestamp;
            const linearProgress = MathUtils.clamp(sceneTime / this.totalDuration, 0, 1);
            const progress = easeInOutCubic(linearProgress);

            if (this.counter++ % 5) {
                this.vehicleLine.material.resolution.copy(this.mapAndOverlayManager.getViewportSize());
                this.previousVehicleLines.forEach(element => {
                    element.material.resolution.copy(this.mapAndOverlayManager.getViewportSize());
                });

                const zoom = this.map.getZoom();
                this.vehicleModel.scale.setScalar(this.scale * Math.pow(1.7, 25 - (zoom || 0)));
            }

            if (progress < 1) {
                // Save computation by updating the scale only every ~ 0.5 seconds
                this.vehicleSpline.getPointAt(progress, this.vehicleModel.position);
                this.vehicleSpline.getTangentAt(progress, tmpVec3);
                this.vehicleModel.quaternion.setFromUnitVectors(this.vehicleFront, tmpVec3);
            } else {
                this.startTimestamp = -1;
            }
        }
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