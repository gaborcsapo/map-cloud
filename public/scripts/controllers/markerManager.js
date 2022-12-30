import HtmlMarker3d from '../threejsObjects/htmlMarker.js';
import { latLngAltToVector3 } from '../utilities/coordinates.js';

export class MarkerManager {
    constructor({map, scene}) {
        this.markers = [];
        this.map = map;
        this.scene = scene;
        this.frameCount = 0;
    }

    addMarker(coordinates, label) {
        let newMarker = new HtmlMarker3d({label: label, baseZoom: 17});
        latLngAltToVector3({lat: coordinates.lat, lng: coordinates.lng}, newMarker.position);
        newMarker.position.y = 100;
        this.markers.push(newMarker);
        this.scene.add(newMarker);
    }

    clearMarkers() {
        this.markers.forEach((marker) => this.scene.remove(marker));
        this.markers = [];
    }

    update() {
        if (this.frameCount++ > 10)
        {
            this.frameCount = 0;
            this.markers.forEach(marker => {
                marker.update({"heading": this.map.getHeading(),
                               "tilt": this.map.getTilt(),
                               "zoom":this.map.getZoom()});
            });
        }
    }
}
