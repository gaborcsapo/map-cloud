/**
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Modifications copyright (C) 2013 - Gabor Csapo
 *  */

import * as THREE from 'three';

const mapId ="f3d61f0996b6dda9"

 /**
  * Add a [three.js](https://threejs.org) scene as a [Google Maps WebGLOverlayView](http://goo.gle/WebGLOverlayView-ref).
  *
  * **Note**: The scene will be rotated to a default up axis of (0, 1, 0) matching that of three.js.
  * *
  */
export class MapAndOverlayManager {
     anchor;
     scene;

     mapCamera
     overlayCamera;
     map;
     scale;
     rotation;
     overlay;
     renderer;
     THREE;
     viewportSize = new THREE.Vector2();
     updateSceneCallback;

     constructor({
          anchor = { lat: 0, lng: 0, altitude: 0 },
          rotation = new Float32Array([0, 0, 0]),
          scale = new Float32Array([1, 1, 1]),
          initialViewport,
          disableDefaultUI
     } = {}) {

          this.mapCamera = {};
          Object.assign(this.mapCamera, initialViewport);
          const mapDiv = document.getElementById('map');
          const {zoom, center, heading, tilt} = this.mapCamera;

          this.map = new google.maps.Map(mapDiv, {
               mapId: mapId,
               backgroundColor: 'transparent',
               gestureHandling: 'greedy',
               zoom,
               center,
               heading,
               tilt
          });
          this.enableMapUI(!disableDefaultUI);

          this.overlay = new google.maps.WebGLOverlayView();

          this.overlay.setMap(this.map);
          window.map = this.map;

          this.renderer = null;
          this.overlayCamera = null;
          this.anchor = anchor;
          this.rotation = rotation;
          this.scale = scale;
          this.scene = new THREE.Scene();

          // rotate the scene so it keeps the y-up orientation used by three.js
          this.scene.rotation.x = Math.PI / 2;

          // create two three.js lights to illuminate the model (roughly approximates
          // the lighting of buildings in maps)
          const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
          hemiLight.position.set(0, 1, -0.2).normalize();
          this.scene.add(hemiLight);

          const dirLight = new THREE.DirectionalLight(0xffffff);
          dirLight.position.set(0, 100, 10);
          this.scene.add(dirLight);

          // rotate scene consistent with y up in THREE
          this.scene.rotation.x = Math.PI / 2;

          this.overlay.onAdd = this.onAdd.bind(this);
          this.overlay.onRemove = this.onRemove.bind(this);
          this.overlay.onContextLost = this.onContextLost.bind(this);
          this.overlay.onContextRestored = this.onContextRestored.bind(this);
          this.overlay.onDraw = this.onDraw.bind(this);

          this.overlayCamera = new THREE.PerspectiveCamera();
     }
     onStateUpdate(options) {
          this.overlay.onStateUpdate(options);
     }

     requestStateUpdate() {
          this.overlay.requestStateUpdate();
     }

     onAdd() {}

     onRemove() {}

     getViewportSize() {
          return this.viewportSize;
     }

     getScene() {
          return this.scene;
     }

     requestRedraw() {
          this.overlay.requestRedraw();
     }


     getMapInstance() {
          if (!this.map) {
               throw new Error('Basemap.getMapInstance() called before map initialized.');
          }

          return this.map;
     }

     setMapCamera(camera) {
          Object.assign(this.mapCamera, camera);

          if (this.map) {
               this.map.moveCamera(this.mapCamera);
          }
     }

     getMapCamera() {
          return {
               center: this.map.getCenter(),
               tilt: this.map.getTilt(),
               zoom: this.map.getZoom(),
               heading: this.map.getHeading()
          };
     }

     enableMapUI(enable) {
          this.map.setOptions({
               disableDefaultUI: !enable,
               draggable: enable,
               zoomControl: enable,
               scrollwheel: enable,
               disableDoubleClickZoom: enable,
               clickableIcons: enable,
               fullscreenControl: enable,
               keyboardControls: enable,
          })
     }

     addListener(eventName, handler) {
          return this.overlay.addListener(eventName, handler);
     }

     bindTo(key, target, targetKey, noNotify) {
          this.overlay.bindTo(key, target, targetKey, noNotify);
     }

     get(key) {
          return this.overlay.get(key);
     }

     notify(key) {
          this.overlay.notify(key);
     }

     set(key, value) {
          this.overlay.set(key, value);
     }

     setValues(values) {
          this.overlay.setValues(values);
     }

     unbind(key) {
          this.overlay.unbind(key);
     }

     unbindAll(){
          this.overlay.unbindAll();
     }

     setUpdateSceneCallback(callback) {
          this.updateSceneCallback = callback;
     }

     onContextRestored({ gl }) {
          this.renderer = new THREE.WebGLRenderer({
               canvas: gl.canvas,
               context: gl,
               antialias : false,
               ...gl.getContextAttributes(),
          });
          this.renderer.autoClear = false;
          this.renderer.autoClearDepth = false;
          this.renderer.shadowMap.enabled = true;
          this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

          // LinearEncoding is default for historical reasons
          // https://discourse.threejs.org/t/linearencoding-vs-srgbencoding/23243
          this.renderer.outputEncoding = THREE.sRGBEncoding;

          const { width, height, clientWidth } = gl.canvas;
          this.renderer.setSize(width, height, false);
          this.viewportSize.set(width, height);
     }

     onContextLost() {
          if (!this.renderer) {
               return;
          }

          this.viewportSize.set(0, 0);
          this.renderer.dispose();
          this.renderer = null;
     }

     onDraw({ gl, transformer }) {
          this.overlayCamera.projectionMatrix.fromArray(
               transformer.fromLatLngAltitude(this.anchor, this.rotation, this.scale)
          );

          gl.disable(gl.SCISSOR_TEST);
          if (this.updateSceneCallback) {
               this.updateSceneCallback(this.scene, this.overlayCamera);
               this.requestRedraw();
          }

          this.renderer.render(this.scene, this.overlayCamera);

          // reset state using renderer.resetState() and not renderer.state.reset()
          this.renderer.resetState();

          const {width, height} = gl.canvas;
          this.viewportSize.set(width, height);
     }
}