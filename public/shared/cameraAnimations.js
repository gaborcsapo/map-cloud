import {CatmullRomCurve3, MathUtils} from 'three';
import { latLngAltToVector3, vector3ToLatLngAlt } from '../shared/coordinates.js';
import { easeInOutCubic, easeInOutQuint, easeInOutPower } from '../shared/easing.js';

const {lerp, mapLinear, clamp} = MathUtils;

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

  basemap;

  constructor(basemap) {
    this.basemap = basemap;
  }

  /**
   * Updates the animation based on the given animation-time in
   * milliseconds. Should call `this.basemap.setCamera()` to
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
 export class CarCamAnimation extends CameraAnimation {
    zoomAmplitude = 3;

    constructor({basemap, overlay, path}) {
        super(basemap);

        this.delay = path.delay;
        this.vehicleStartDelay = this.delay + basemap.mapLoadingTime;
        this.duration = path.duration;
        this.vehicleDuration = this.duration - basemap.mapLoadingTime;
        this.zoomAmplitude = path.zoomAmplitude;
        this.directionHeading = path.directionHeading;
        this.overlay = overlay;
        this.origin = this.basemap.getCamera();
        this.origin.lat = this.origin.center.lat();
        this.origin.lng = this.origin.center.lng();

        this.spline = new CatmullRomCurve3(
            path.camPath.map(({lat, lng}) => latLngAltToVector3({lat, lng, altitude: 0})),
            false,
            'centripetal',
            0.2
        );
    }

    update(animationTime) {
      const linearCamProgress = MathUtils.clamp((animationTime - this.delay) / this.duration, 0, 1);
      // stop animation once target is reached
      if (linearCamProgress === 1)
      {
        this.spline = null;
        this.dispose();
      }

      const linearVehicleProgress = MathUtils.clamp((animationTime - this.vehicleStartDelay) / this.vehicleDuration, 0, 1);
      const cameraPos = this.spline.getPointAt(easeInOutCubic(linearVehicleProgress));
      const {lat, lng} = vector3ToLatLngAlt(cameraPos, this.origin);

      // compute a zoom out/zoom in animation and lerp towards the target zoom-level (smoothes out the approach)
      const zoom = this.origin.zoom - this.zoomAmplitude * easeInOutPower(linearCamProgress);

      this.basemap.setCamera({
        center: {lat, lng},
        zoom,
        heading: this.directionHeading,
      });
    }
  }

