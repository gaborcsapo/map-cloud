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

        this.overlay.updateSceneCallback = this.updateScene.bind(this);
    };

    initialize() {};

    start() {};

    stop() {};

    initScene() {};

    updateScene() {};
}
