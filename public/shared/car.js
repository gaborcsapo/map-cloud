import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {Line2} from 'three/examples/jsm/lines/Line2.js';
import {LineGeometry} from 'three/examples/jsm/lines/LineGeometry';
import {LineMaterial} from 'three/examples/jsm/lines/LineMaterial';
import {CatmullRomCurve3, Vector3, MathUtils} from 'three';
import { latLngToVector3 } from '../shared/coordinates.js';
import { easeInOutCubic } from '../shared/easing.js';

const THEME_COLOR = 0xf4b400;
const ARC_LENGTH_DIVISIONS = 3000; // keep this high enough to have linear movement
const tmpVec3 = new Vector3();
const CAR_FRONT = new Vector3(1, 0, 0);

export class Car {
    carSpline;
    carModel;
    carLine;
    previousCarLines = [];
    overlay;
    scene;
    startDelay;
    duration;
    startTimestamp;


    constructor({carPath, overlay}) {
        this.overlay = overlay;
        this.scene = overlay.getScene();
        this.carLine = new Line2(
            new LineGeometry(),
            new LineMaterial({
              color: THEME_COLOR,
              linewidth: 4,
              vertexColors: false,
              dashed: false
            })
          );

        this.loadCarModel().then(model => {
            this.carModel = model;
            this.scene.add(this.carModel);
        });

        this.startNewPath(carPath);
    }

    startNewPath(carPath) {
        this.previousCarLines.push(this.carLine);
        this.carLine = new Line2(
            new LineGeometry(),
            new LineMaterial({
              color: THEME_COLOR,
              linewidth: 4,
              vertexColors: false,
              dashed: false
            })
        );
        this.initCarLine(carPath.route);
        this.scene.add(this.carLine);

        this.startDelay = carPath.delay;
        this.duration = carPath.duration;

        this.startTimestamp = performance.now();
    }

    update() {
        this.carLine.material.resolution.copy(this.overlay.getViewportSize());
        this.previousCarLines.forEach(element => {
            element.material.resolution.copy(this.overlay.getViewportSize());
        });
        const map = this.overlay.getMap();
        const heading = map.getHeading();
        const tilt = map.getTilt();
        const zoom = map.getZoom();

        if (!this.carModel) {
            return false;
        }

        this.carModel.scale.setScalar(0.1 * Math.pow(1.7, 25 - (zoom || 0)));

        const sceneTime = performance.now() - this.startTimestamp;
        const linearProgress = MathUtils.clamp((sceneTime - this.startDelay) / this.duration, 0, 1);

        if (linearProgress === 1) return true;

        // car position/rotation
        const progress = easeInOutCubic(linearProgress);

        this.carSpline.getPointAt(progress, this.carModel.position);
        this.carSpline.getTangentAt(progress, tmpVec3);
        this.carModel.quaternion.setFromUnitVectors(CAR_FRONT, tmpVec3);

        return false;
    }

    loadCarModel() {
        const gltfLoader = new GLTFLoader();

        return new Promise(resolve => {
            gltfLoader.load("resources/3d/car.gltf", gltf => {
                const car = gltf.scene;
                // workaround for disappearing models bug
                car.traverse((obj) => {
                    if ((obj).geometry) {
                        obj.frustumCulled = false;
                    }
                });

                resolve(car);
            });
        });
    }

    initCarLine(route) {
        this.carSpline = new CatmullRomCurve3(
            route.map(({lat, lng}) => latLngToVector3({lat, lng})),
            false,
            'centripetal',
            0.2
        );
        // arcLengthDivisions has to be a high value to get more accurate position-interpolation
        // along the spline.
        this.carSpline.arcLengthDivisions = ARC_LENGTH_DIVISIONS;
        const carCurvePoints = this.carSpline.getSpacedPoints(5 * this.carSpline.points.length);
        const carPositions = new Float32Array(carCurvePoints.length * 3);
        for (let i = 0; i < carCurvePoints.length; i++) {
            carCurvePoints[i].toArray(carPositions, 3 * i);
        }

        this.carLine.geometry.setPositions(carPositions);
        this.carLine.computeLineDistances();
    }
}