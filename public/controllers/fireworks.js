import {
    BufferGeometry,
    Color,
    Float32BufferAttribute,
    MathUtils,
    Object3D,
    Points,
    PointsMaterial,
    Spherical,
    Vector3,
    Group,
	TextureLoader,
	MeshBasicMaterial,
	PlaneGeometry,
	Mesh
  } from 'three';
import { latLngAltToVector3 } from './coordinates';

const {randFloat} = MathUtils;

const NUM_PARTICLES = 80;
const BASE_ALTITUDE = 350;
const ALTITUDE_VARIANCE = 0.2;

// temp variables to prevent unneccessary allocations
const color = new Color();
const v3Tmp = new Vector3();
const v3Tmp2 = new Vector3();
const spherical = new Spherical();

export class Firework extends Object3D {
    done = false;
    isExploded = false;

    material = new PointsMaterial({
      size: 16,
      color: 0xffffff,
      opacity: 1,
      vertexColors: true,
      transparent: true,
      depthTest: true
    });

    geometry = new BufferGeometry();
    positionAttr = new Float32BufferAttribute(3 * NUM_PARTICLES, 3);
    colorAttr = new Float32BufferAttribute(3 * NUM_PARTICLES, 3);

    points;

    particleDestinations = new Float32Array(3 * NUM_PARTICLES);
    baseColor = new Color();

    constructor(position) {
        super();

        this.baseColor.setHSL(randFloat(0, 1), 1.0, randFloat(0.4, 0.7));

        this.geometry.setAttribute('position', this.positionAttr);
        this.geometry.setAttribute('color', this.colorAttr);
        this.launchLocation = position
        this.points = new Points(this.geometry, this.material);

        this.add(this.points);
        this.launch();
    }

    launch() {
        this.isExploded = false;

        // launch position
        v3Tmp.set(randFloat(-10, 10), 0, randFloat(-10, 10));
        v3Tmp.add(this.launchLocation);
        v3Tmp.toArray(this.positionAttr.array, 0);


        // particle destination
        v3Tmp
            .setFromSpherical(
                spherical.set(
                    randFloat(BASE_ALTITUDE * (1 - ALTITUDE_VARIANCE), BASE_ALTITUDE * (1 + ALTITUDE_VARIANCE)),
                    randFloat((-15 / 180) * Math.PI, (15 / 180) * Math.PI),
                    randFloat(-Math.PI, Math.PI)
                )
            )
            .add(this.launchLocation)
            .toArray(this.particleDestinations, 0);

        // particle color
        this.baseColor.toArray(this.colorAttr.array, 0);
    }

    explode(startingPoint) {
      this.isExploded = true;

      const hsl = {h: 0, s: 0, l: 0};
      this.baseColor.getHSL(hsl);

      for (let i = 0; i < NUM_PARTICLES; i++) {
        // particle color
        color
          .setHSL(
            randFloat(hsl.h - 0.05, hsl.h + 0.05),
            hsl.s,
            Math.random() > 0.6 ? randFloat(0.9, 1) : randFloat(hsl.l - 0.2, hsl.l + 0.2)
          )
          .toArray(this.colorAttr.array, 3 * i);

        // particle initial position
        startingPoint.toArray(this.positionAttr.array, 3 * i);

        // particle destination
        spherical.set(randFloat(80, 150), randFloat(0, Math.PI), randFloat(-Math.PI, Math.PI));
        v3Tmp
          .setFromSpherical(spherical)
          .add(startingPoint)
          .toArray(this.particleDestinations, 3 * i);
      }

      this.positionAttr.needsUpdate = true;
      this.colorAttr.needsUpdate = true;
    }

    update() {
      const numParticles = this.isExploded ? NUM_PARTICLES : 1;

      if (this.done) {
        return;
      }

      if (!this.isExploded) {
        this.geometry.drawRange.count = 1;

        v3Tmp.fromArray(this.positionAttr.array, 0);
        v3Tmp2.fromArray(this.particleDestinations, 0);

        v3Tmp.lerp(v3Tmp2, 0.05).toArray(this.positionAttr.array, 0);

        if (v3Tmp.distanceTo(v3Tmp2) < 20) {
          this.explode(v3Tmp.clone());
        }

        this.positionAttr.needsUpdate = true;

        return;
      }
      for (let i = 0; i < numParticles; i++) {
        const offset = 3 * i;

        v3Tmp.fromArray(this.positionAttr.array, offset);
        v3Tmp2.fromArray(this.particleDestinations, offset);

        v3Tmp.lerp(v3Tmp2, 0.05).toArray(this.positionAttr.array, offset);

        this.positionAttr.needsUpdate = true;
      }

      this.geometry.drawRange.count = numParticles;
      this.material.opacity -= 0.015;

      if (this.material.opacity <= 0) {
        this.done = true;
      }
    }
}


export class FireworkGroup {

    constructor({overlay, path}) {
        this.fireworksGroup = new Group();
        this.position = latLngAltToVector3(path.route[0]);
		this.position.z += 180;
		this.overlay = overlay;
        this.duration = path.startDelay + path.zoomDuration * 2 + path.camMoveDuration;
        this.scene = overlay.getScene();
        this.scene.add(this.fireworksGroup);
        this.startTimestamp = performance.now();

		this.celebratedImage = this.loadImageMesh(path.celebImgURL, this.position);
		this.scene.add(this.celebratedImage);
    }

    update() {
        const sceneTime = performance.now() - this.startTimestamp;
        const linearProgress = sceneTime / this.duration;
        if (linearProgress < 0.9) {
            // 3% chance to spawn a new firework (averages out at 1.8 instances per second)
            if (Math.random() > 0.97) {
                this.fireworksGroup.add(new Firework(this.position));
            }
        } else if (this.fireworksGroup.children.length == 0) {
            this.scene.remove(this.fireworksGroup);
			// this.scene.remove(this.celebratedImage);
            return true;
        }

        for (const firework of this.fireworksGroup.children) {
            firework.update();
            if (firework.done) {
                this.fireworksGroup.remove(firework);
            }
        }

        return false;
    }

    loadImageMesh(modelPath, position) {
        const geometry = new PlaneGeometry(12, 12, 32);
        const loader = new TextureLoader();
		loader.crossOrigin = "Anonymous";
        const texture = loader.load(modelPath);
        const material = new MeshBasicMaterial({
            map: texture,
            opacity: 1
        });

        let imageMesh = new Mesh(geometry, material);

        const map = this.overlay.getMap();
        const heading = map.getHeading();
        const tilt = map.getTilt();

        if (heading !== undefined && tilt !== undefined) {
            imageMesh.rotation.set(
                ((-90 + tilt) / 180) * Math.PI,
                (-heading / 180) * Math.PI,
                0,
                'YXZ'
            );
        }

		imageMesh.scale.set(10, 10);

		imageMesh.position.set(position.x, 50, position.z);

        return imageMesh;
    }
  }