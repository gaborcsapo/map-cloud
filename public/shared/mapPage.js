import { ThreeJSOverlayView } from '../shared/threejsOverlayView.js';
import { Basemap } from './baseMap.js';

export class MapPage {
    baseMap;
    camera = {};
    overlay;

    constructor({initialViewport})
    {
        this.baseMap = new Basemap(initialViewport);
        this.overlay = new ThreeJSOverlayView();

        this.initialize();
    };

    initialize() {};

    start() {};

    stop() {};

    initScene() {};

    setUpdateSceneCallback(callback) {
        this.overlay.updateSceneCallback = callback.bind(this);
    };
}
