import {
    TextureLoader,
	MeshBasicMaterial,
	PlaneGeometry,
	Mesh
} from 'three';
import { latLngAltToVector3 } from '../utilities/coordinates.js';

export class PictureManager {
    constructor({map, scene}) {
        this.map = map;
        this.imgTextures = new Map();;
        this.scene = scene;
    }

    async preLoadImage(url) {
        const loader = new TextureLoader();
        loader.crossOrigin = "Anonymous";
        this.imgTextures.set(url, loader.load(url));
    }

    loadImageMesh(url, latLng) {
        if (this.imgTextures.get(url) == undefined)
        {
            this.preLoadImage(url).then(() => {
                this.loadImageMesh(this.scene, url, position);
            });
        } else {
            const geometry = new PlaneGeometry(12, 12, 32);
            const material = new MeshBasicMaterial({
                map: this.imgTextures.get(url),
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
            imageMesh.scale.set(7, 7);
            imageMesh.position.set(position.x, 60, position.z);

            this.scene.add(imageMesh);
        }
    }
}
