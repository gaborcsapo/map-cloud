import { Loader } from '@googlemaps/js-api-loader';
import * as THREE from 'three';
import { CompressedTextureLoader } from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

const apiOptions = {
    apiKey: MAPS_API_KEY
}
const mapOptions = {
    center: { lat: 24.0, lng: 121.597366},
    zoom: 16,
    tilt: 0,
    heading: 0,
    mapId: "c2485044d90a90f"
};

async function initMap(){
    const loader = new Loader(apiOptions);
    const mapDiv = document.getElementById('map');
    await loader.load();
    return new google.maps.Map(mapDiv, mapOptions);
}

function initWebGLOverlayView (map) {
    let scene, renderer, camera, loader;
    const webGLOverlayView = new google.maps.WebGLOverlayView();

    webGLOverlayView.onAdd = () => {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera();
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.25);
        scene.add(directionalLight);

        loader = new GLTFLoader();
        // const source = "resources/3d/AnyConv.com__11803_Airplane_v1_l1.gltf"
        const source = "resources/3d/plane.gltf";
        loader.load(
            source,
            gltf => {
                gltf.scene.scale.set(25,25,25);
                gltf.scene.rotation.x = 180 * Math.PI/180;
                scene.add(gltf.scene);
            }
        );
    };

    webGLOverlayView.onContextRestored = ({gl}) => {
        renderer = new THREE.WebGLRenderer({
            canvas: gl.canvas,
            context: gl,
            ...gl.getContextAttributes(),
        });
        renderer.autoClear = false;

        loader.manager.onLoad = () => {
            renderer.setAnimationLoop(() => {
                map.moveCamera({
                    "tilt": mapOptions.tilt,
                    "heading": mapOptions.heading,
                    "zoom": mapOptions.zoom
                });

                if (mapOptions.tilt < 67.5) {
                    mapOptions.tilt += 0.5;
                } else if (mapOptions.heading <= 360) {
                    mapOptions.heading += 0.2;
                } else {
                    renderer.setAnimationLoop(null);
                }
            });
        }
    };
    webGLOverlayView.onDraw = ({gl, transformer}) => {
        const latLngAltitudeLiteral = {
            lat: mapOptions.center.lat,
            lng: mapOptions.center.lng,
            altitude: 120
        }

        const matrix = transformer.fromLatLngAltitude(latLngAltitudeLiteral);
        camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);

        webGLOverlayView.requestRedraw();
        renderer.render(scene, camera);
        renderer.resetState();
    };
    webGLOverlayView.setMap(map);
}

(async () => {
    const map = await initMap();
    initWebGLOverlayView(map);
})();