import {CatmullRomCurve3} from 'three';
import { latLngAltToVector3, vector3ToLatLngAlt } from '../controllers/coordinates.js';
import { easeInOutCubic, easeInSine } from '../controllers/easing.js';

/**
 * Baseclass for all camera-animations, manages the rAF-loop
 * for the animation and the timing-code.
 * Implementations only need to supply the update-method that
 * receives the animation-time and updates the camera
 */
export class CameraAnimation {
  isPlaying = false;

  rafId = 0;
  lastFrameTime = 0;
  animationTime = 0;

  baseMapWrapper;

  constructor(baseMapWrapper) {
    this.baseMapWrapper = baseMapWrapper;
  }

  /**
   * Updates the animation based on the given animation-time in
   * milliseconds. Should call `this.baseMapWrapper.setCamera()` to
   * update the camera-position.
   * @param animationTime
   */
  update(animationTime) {
      console.log("abstract function");
  }

  play() {
    this.animationTime = 0;
    this.resume();
  }

  pause() {
    cancelAnimationFrame(this.rafId);
    this.isPlaying = false;
    this.rafId = 0;
  }

  resume() {
    this.isPlaying = true;
    this.lastFrameTime = performance.now();

    if (this.rafId !== 0) {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = requestAnimationFrame(this.frameCallback);
  }

  dispose() {
    this.pause();
  }

  frameCallback = (time) => {
    this.animationTime += time - this.lastFrameTime;

    this.update(this.animationTime);

    this.lastFrameTime = time;

    if (this.isPlaying) {
      this.rafId = requestAnimationFrame(this.frameCallback);
    }
  };
}

/**
 * Camera-Animations should run outside of the overlay update-loop, as updates is called amidst
 * rendering a frame.
 */

const STARTING_ZOOM = 18;

 export class CarCamAnimation extends CameraAnimation {
    constructor({baseMapWrapper, overlay, journeyStageParams}) {
        super(baseMapWrapper);

        this.startDelay = journeyStageParams.startDelay;
        this.zoomDuration = journeyStageParams.zoomDuration;
        this.camMoveDuration = journeyStageParams.camMoveDuration;

        this.totalDuration = this.startDelay + this.zoomDuration * 2 + this.camMoveDuration;
        this.zoomEndTime = this.startDelay + this.zoomDuration;
        this.camMoveEndTime = this.startDelay + this.zoomDuration + this.camMoveDuration;

        this.zoomAmplitude = journeyStageParams.zoomAmplitude;
        this.highestZoomLevel = 0;

        this.overlay = overlay;
        this.origin = this.baseMapWrapper.getCamera();
        this.origin.lat = this.origin.center.lat();
        this.origin.lng = this.origin.center.lng();

        this.baseMapWrapper.setCamera({
            zoom: STARTING_ZOOM,
            center: journeyStageParams.route[0],
            tilt: 30,
            heading: 0,
        });

        let camPath;
        const route = journeyStageParams.route;
        if (route.length >= 4)
        {
            camPath = [route[0], route[Math.floor(route.length/4)],route[Math.floor(route.length/4*3)],route[route.length - 1]];
        } else {
            camPath = route;
        }
        this.spline = new CatmullRomCurve3(
            camPath.map(({lat, lng}) => latLngAltToVector3({lat, lng, altitude: 0})),
            false,
            'centripetal',
            0.2
        );
    }

    update(animationTime) {
        if (animationTime < this.startDelay) {
            return;
        }
        else if (animationTime <= this.zoomEndTime)
        {
            const zoomProgress = (animationTime - this.startDelay) / this.zoomDuration;
            this.zoom = STARTING_ZOOM - this.zoomAmplitude * easeInSine(zoomProgress);
            this.baseMapWrapper.setCamera({
                zoom: this.zoom,
            });
        }
        else if (animationTime <= this.camMoveEndTime)
        {
            const camMoveProgress = (animationTime - this.zoomEndTime) / this.camMoveDuration;
            const cameraPos = this.spline.getPointAt(easeInOutCubic(camMoveProgress));
            const {lat, lng} = vector3ToLatLngAlt(cameraPos, this.origin);
            this.baseMapWrapper.setCamera({
                center: {lat, lng},
            });
        }
        else if (animationTime <= this.totalDuration)
        {
            if (this.highestZoomLevel == 0) {
                this.highestZoomLevel = this.zoom;
            }
            const zoomProgress = (animationTime - this.camMoveEndTime) / this.zoomDuration;
            this.zoom = this.highestZoomLevel + this.zoomAmplitude * easeInSine(zoomProgress);
            this.baseMapWrapper.setCamera({
                zoom: this.zoom,
            });
        }
        else
        {
            this.spline = null;
            this.dispose();
        }
    }
}

