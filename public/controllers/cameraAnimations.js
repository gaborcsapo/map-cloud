import {CatmullRomCurve3, MathUtils} from 'three';
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

        this.startDelay = path.startDelay;
        this.zoomDuration = path.zoomDuration;
        this.camMoveDuration = path.camMoveDuration;

        this.totalDuration = this.startDelay + this.zoomDuration * 2 + this.camMoveDuration;
        this.zoomEndTime = this.startDelay + this.zoomDuration;
        this.camMoveEndTime = this.startDelay + this.zoomDuration + this.camMoveDuration;

        this.zoomAmplitude = path.zoomAmplitude;

        this.overlay = overlay;
        this.origin = this.basemap.getCamera();
        this.origin.lat = this.origin.center.lat();
        this.origin.lng = this.origin.center.lng();


        let camPath;
        const route = path.route;
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
      else if (animationTime < this.zoomEndTime)
      {
        const zoomProgress = (animationTime - this.startDelay) / this.zoomDuration;
        this.zoom = this.origin.zoom - this.zoomAmplitude * easeInSine(zoomProgress);
        this.basemap.setCamera({
          zoom: this.zoom,
        });
      }
      else if (animationTime < this.camMoveEndTime)
      {
        const camMoveProgress = (animationTime - this.zoomEndTime) / this.camMoveDuration;
        const cameraPos = this.spline.getPointAt(easeInOutCubic(camMoveProgress));
        const {lat, lng} = vector3ToLatLngAlt(cameraPos, this.origin);
        this.basemap.setCamera({
          center: {lat, lng},
          zoom: this.zoom,
          heading: this.origin.heading,
        });
      }
      else if (animationTime < this.totalDuration)
      {
        const zoomProgress = (animationTime - this.camMoveEndTime) / this.zoomDuration;
        this.zoom = this.origin.zoom - this.zoomAmplitude * (1 - easeInSine(zoomProgress));
        this.basemap.setCamera({
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

