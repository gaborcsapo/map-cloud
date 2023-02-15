import {CatmullRomCurve3, MathUtils} from 'three';
import { latLngAltToVector3, vector3ToLatLngAlt } from '../utilities/coordinates.js';
import { easeInOutCubic, easeInSine, easeInOutQuint } from '../utilities/easing.js';

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

  constructor() {}

  /**
   * Updates the animation based on the given animation-time in
   * milliseconds. Should call `this.overlay.setMapCamera()` to
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

export class ZoomAnimation extends CameraAnimation {
    constructor({mapAndOverlayManager, startingZoom, targetZoom, duration, center}) {
        super();

        this.mapAndOverlayManager = mapAndOverlayManager;
        this.origin = this.mapAndOverlayManager.getMapCamera();
        this.origin.lat = this.origin.center.lat();
        this.origin.lng = this.origin.center.lng();

        this.duration = duration;
        this.targetZoom = targetZoom;
        this.startingZoom = startingZoom;
        this.zoomAmplitude = targetZoom - startingZoom;

        this.mapAndOverlayManager.setMapCamera({
            zoom: startingZoom,
            center: center,
            tilt: 30,
            heading: 0,
        });
    }

    update(animationTime) {
        const progress = MathUtils.clamp(animationTime / this.duration, 0, 1);
        this.zoom = this.startingZoom + this.zoomAmplitude * easeInSine(progress);
        this.mapAndOverlayManager.setMapCamera({
            zoom: this.zoom,
        });

        if (progress == 1) {
            this.dispose();
        }
    }
}

export class MoveAnimation extends CameraAnimation {
    constructor({mapAndOverlayManager, route, duration}) {
        super();

        this.mapAndOverlayManager = mapAndOverlayManager;
        this.origin = this.mapAndOverlayManager.getMapCamera();
        this.origin.lat = this.origin.center.lat();
        this.origin.lng = this.origin.center.lng();

        this.duration = duration;
        let camPath;
        if (route.length >= 4) {
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
        const progress = MathUtils.clamp(animationTime / this.duration, 0, 1);
        const cameraPos = this.spline.getPointAt(easeInOutQuint(progress));
        const {lat, lng} = vector3ToLatLngAlt(cameraPos, this.origin);
        this.mapAndOverlayManager.setMapCamera({
            center: {lat, lng},
        });

        if (progress == 1) {
            this.spline = null;
            this.dispose();
        }
    }

}

