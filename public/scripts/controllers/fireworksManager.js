import {
    Group,
} from 'three';
import { Firework } from '../threejsObjects/firework';
import { latLngAltToVector3 } from '../utilities/coordinates';

export class FireworksManager {
    constructor({scene}) {
        this.fireworksGroup = new Group();
        this.scene = scene;
        this.startTimestamp = 0;
    }

    start({duration, latLng}) {
        this.position = latLngAltToVector3(latLng);
        this.position.z += 180;
        this.duration = duration;
        this.scene.add(this.fireworksGroup);
        this.startTimestamp = performance.now();
    }

    update() {
        if (this.startTimestamp != 0) {
            const sceneTime = performance.now() - this.startTimestamp;
            const linearProgress = sceneTime / this.duration;
            if (linearProgress < 0.9) {
                // 3% chance to spawn a new firework (averages out at 1.8 instances per second)
                if (Math.random() > 0.97) {
                    this.fireworksGroup.add(new Firework(this.position));
                }
            } else if (this.fireworksGroup.children.length == 0) {
                this.scene.remove(this.fireworksGroup);
                this.startTimestamp = 0;
                return true;
            }

            for (const firework of this.fireworksGroup.children) {
                firework.update();
                if (firework.done) {
                    this.fireworksGroup.remove(firework);
                }
            }
        }

        return false;
    }
}