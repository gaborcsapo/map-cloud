import { center } from '@turf/turf';
import {CatmullRomCurve3, MathUtils} from 'three';
import { latLngAltToVector3, vector3ToLatLngAlt } from '../shared/coordinates.js';
import { easeInOutCubic, easeInSine, easeInOutQuad } from '../shared/easing.js';

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

export class OrbitAnimation extends CameraAnimation {
  degreesPerSecond = 0;
  initialHeading = 0;

  update(animationTime) {
    this.basemap.setCamera({
      heading: this.initialHeading + (animationTime / 1000) * this.degreesPerSecond
    });
  }
}

export class LinearAnimation extends CameraAnimation {
  duration;
  from;
  to;
  easing;

  update(animationTime) {
    const {from, to} = this;

    if (!from || !to) {
      console.warn(`LinearAnimation.update(): start and/or end-position missing.`);
      return;
    }

    const progress = this.easing(MathUtils.clamp(animationTime / this.duration, 0, 1));
    const newCamera = {};

    if (from.heading !== undefined && to.heading !== undefined) {
      const delta = to.heading - from.heading;
      let targetHeading = to.heading;
      if (Math.abs(delta) > 180) {
        targetHeading -= 360 * Math.sign(delta);
      }
      newCamera.heading = lerp(from.heading, targetHeading, progress);
    }

    if (from.tilt !== undefined && to.tilt !== undefined) {
      newCamera.tilt = lerp(from.tilt, to.tilt, progress);
    }

    if (from.zoom !== undefined && to.zoom !== undefined) {
      newCamera.zoom = lerp(from.zoom, to.zoom, progress);
    }

    if (from.center && to.center) {
      const c0 = from.center;
      const c1 = to.center;

      const lat0 = typeof c0.lat === 'number' ? c0.lat : c0.lat();
      const lng0 = typeof c0.lng === 'number' ? c0.lng : c0.lng();
      const lat1 = typeof c1.lat === 'number' ? c1.lat : c1.lat();
      const lng1 = typeof c1.lng === 'number' ? c1.lng : c1.lng();

      newCamera.center = {
        lat: lerp(lat0, lat1, progress),
        lng: lerp(lng0, lng1, progress)
      };
    }

    this.basemap.setCamera(newCamera);

    if (progress === 1) {
      this.pause();
    }
  }
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
        this.duration = path.duration;
        this.zoomAmplitude = path.zoomAmplitude;
        this.directionHeading = path.directionHeading;
        this.overlay = overlay;
        this.origin = this.basemap.getCamera();
        this.origin.lat = this.origin.center.lat();
        this.origin.lng = this.origin.center.lng();

        this.spline = new CatmullRomCurve3(
            path.camPath.map(({lat, lng}) => latLngAltToVector3({lat, lng, altitude: 0}, this.origin)),
            false,
            'centripetal',
            0.2
        );
    }

    update(animationTime) {
      const linearProgress = MathUtils.clamp((animationTime - this.delay) / this.duration, 0, 1);
      // stop animation once target is reached
      if (linearProgress === 1) this.dispose();

      const progress = easeInOutCubic(linearProgress);

      const cameraPos = this.spline.getPointAt(progress);
      const {lat, lng} = vector3ToLatLngAlt(cameraPos, this.origin);

      // compute a zoom out/zoom in animation and lerp towards the target zoom-level (smoothes out the approach)
      const zoom = this.origin.zoom - this.zoomAmplitude * Math.sin(Math.PI * linearProgress);

      const heading = this.directionHeading * Math.sin(Math.PI * linearProgress);

      this.basemap.setCamera({
        center: {lat, lng},
        zoom,
        heading
      });
    }
  }

