import {
    TextureLoader,
	MeshBasicMaterial,
	PlaneGeometry,
	Mesh
} from 'three';
import { latLngAltToVector3 } from '../utilities/coordinates.js';

const BASE_SCALE = 0.16;

export class PictureManager {
    constructor({map, scene}) {
        this.map = map;
        this.scene = scene;
        this.imageMeshes = [];
    }

    loadImageMesh(image, latLng) {
        var img = new Image();
        img.src = image;
        img.onload = () => {
            const geometry = new PlaneGeometry(15, 15 * img.height / img.width);
            img = 0;
            const material = new MeshBasicMaterial({
                map: new TextureLoader().load(image),
                opacity: 1
            });

            let imageMesh = new Mesh(geometry, material);

            const heading = this.map.getHeading();
            const tilt = this.map.getTilt();

            if (heading !== undefined && tilt !== undefined) {
                imageMesh.rotation.set(
                    ((-90 + tilt) / 180) * Math.PI,
                    (-heading / 180) * Math.PI,
                    0,
                    'YXZ'
                );
            }
            const position = latLngAltToVector3(latLng);
            imageMesh.scale.set(BASE_SCALE, BASE_SCALE);
            imageMesh.position.set(position.x + 70, 60, position.z);

            this.imageMeshes.push(imageMesh);
            this.scene.add(imageMesh);
        }
    }

    clearImages() {
        this.imageMeshes.forEach((mesh) => this.scene.remove(mesh));
        this.imageMeshes = [];
    }

    update() {
        let newScale = BASE_SCALE * Math.pow(1.7, 25 - (this.map.getZoom() || 0));
        this.imageMeshes.forEach((mesh) => mesh.scale.set(newScale, newScale));
    }
}
