import {Client, PlaceInputType } from "@googlemaps/google-maps-services-js";
import { getDirectionsAPIKey } from './secret_manager.js';

export class MapDirections {
    constructor() {
        console.log("init");
        getDirectionsAPIKey().then((key) => {
            this.key = key;
            this.client = new Client({});
        });
    }

    searchPath(start, end){
        return new Promise((resolve) => {
            this.client.directions({
                params:
                {
                    origin: start,
                    destination: end,
                    travelMode: 'DRIVING',
                    key: this.key,
                },
                timeout: 1000,
            }).then((resp) => {
                if (resp.data.routes.length == 0)
                {
                    console.log(resp);
                }
                resolve(this.decodePath(resp.data.routes[0].overview_polyline.points));
            }, reason => {
                console.log(reason)
            });
        });
    }

    searchPlace(description){
        return new Promise((resolve) => {
            this.client.geocode({
                params:
                {
                    address: description,
                   key: this.key,
                },
                timeout: 1000,
            }).then((resp) => {
                resolve(resp.data.results[0].geometry.location);
            }, reason => {
                console.log(reason)
            });
        });
    }

    decodePath(encodedPath) {
        let len = encodedPath.length || 0;
        let path = new Array(Math.floor(encodedPath.length / 2));
        let index = 0;
        let lat = 0;
        let lng = 0;
        let pointIndex;
        for (pointIndex = 0; index < len; ++pointIndex) {
            let result = 1;
            let shift = 0;
            let b;
            do {
                b = encodedPath.charCodeAt(index++) - 63 - 1;
                result += b << shift;
                shift += 5;
            } while (b >= 0x1f);
            lat += result & 1 ? ~(result >> 1) : result >> 1;
            result = 1;
            shift = 0;
            do {
                b = encodedPath.charCodeAt(index++) - 63 - 1;
                result += b << shift;
                shift += 5;
            } while (b >= 0x1f);
            lng += result & 1 ? ~(result >> 1) : result >> 1;
            path[pointIndex] = { lat: lat * 1e-5, lng: lng * 1e-5 };
        }
        path.length = pointIndex;
        return path;
    }
}
