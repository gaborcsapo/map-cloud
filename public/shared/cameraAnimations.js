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
    delay;
    duration;

    headingAnimationStart = 0.85;
    targetHeading;

    zoomAmplitude = 1.5;
    targetZoom;

    overlay;
    spline;

    origin;

    constructor({basemap, overlay, cameraPath, duration, delay, targetZoom, targetHeading, origin}) {
        super(basemap);

        this.delay = delay;
        this.duration = duration;
        this.targetHeading = targetHeading;
        this.targetZoom = targetZoom;
        this.origin = origin;

        this.overlay = overlay;
        this.spline = new CatmullRomCurve3(
            cameraPath.map(({lat, lng}) => latLngAltToVector3({lat, lng, altitude: 0}, origin.center)),
            false,
            'centripetal',
            0.2
        );
    }

    update(animationTime) {
      const linearProgress = MathUtils.clamp((animationTime - this.delay) / this.duration, 0, 1);
      const progress = easeInOutCubic(linearProgress);

      // stop animation once target is reached
      if (linearProgress === 1) this.pause();

      const cameraPos = this.spline.getPointAt(progress);
      const {lat, lng} = vector3ToLatLngAlt(cameraPos, this.origin.center);

      // compute a zoom out/zoom in animation and lerp towards the target zoom-level (smoothes out the approach)
      const calcZoom = this.origin.zoom - this.zoomAmplitude * Math.sin(Math.PI * linearProgress);
      const zoom = lerp(calcZoom, this.targetZoom, easeInSine(linearProgress));

      // the map heading swings around to the final direction starting when animation is 85% complete.
      const headingProgress = clamp(
        mapLinear(linearProgress, this.headingAnimationStart, 1, 0, 1),
        0,
        1
      );
      const heading = lerp(
        this.origin.heading,
        this.targetHeading,
        easeInOutQuad(headingProgress)
      );

      this.basemap.setCamera({
        center: {lat, lng},
        zoom,
        heading
      });
    }
  }

