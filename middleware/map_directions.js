import {Client } from "@googlemaps/google-maps-services-js";
import { getDirectionsAPIKey } from './secret_manager.js';

const apiKey = await getDirectionsAPIKey();

export class MapDirections {
    constructor() {
        this.client = new Client({});
    }

    searchPath(start, end){
        return new Promise((resolve, reject) => {
            this.client.directions({
                params:
                {
                    origin: start,
                    destination: end,
                    travelMode: 'DRIVING',
                    key: apiKey,
                },
                timeout: 1000,
            }).then((resp) => {
                if (resp.data.routes.length == 0)
                {
                    reject("Google Maps doesn't recognize one of these two places or can't draw a route between them: " + start + ", " + end + ". Please generate a new link and make these addresses more specific or closer.");
                } else {
                    resolve(this.decodePath(resp.data.routes[0].overview_polyline.points));
                }
            }, (reason) => {
                reject("There's an unknown failure with searchPlace: " + start + " --> " + end + ". Reason: " + reason + ". Please generate a new link and change these addresses.");
            });
        });
    }

    searchPlace(description){
        return new Promise((resolve, reject) => {
            this.client.geocode({
                params:
                {
                    address: description,
                   key: apiKey,
                },
                timeout: 1000,
            }).then((resp) => {
                if (resp.data.results.length == 0)
                {
                    reject("Google Maps doesn't recognize the place: " + description + ". Please generate a new link and make this address more specific.");
                } else {
                    resolve(resp.data.results[0].geometry.location);
                }
            }, (reason) => {
                reject("There's an unknown failure with searchPlace: " + description + ". Reason: " + reason + ". Please generate a new link and make these addresses.");
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
