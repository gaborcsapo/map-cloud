import {Client } from "@googlemaps/google-maps-services-js";
import { getDirectionsAPIKey } from './secret_manager.js';

const apiKey = await getDirectionsAPIKey();

export class MapDirections {
    constructor() {
        this.client = new Client({});
    }

    searchRoute(journeyStage){
        return new Promise((resolve, reject) => {
            this.client.directions({
                params:
                {
                    origin: journeyStage.getStartDescription(),
                    destination: journeyStage.getEndDescription(),
                    travelMode: 'DRIVING',
                    key: apiKey,
                },
                timeout: 1000,
            }).then((resp) => {
                if (resp.data.routes.length == 0)
                {
                    reject("Google Maps doesn't recognize one of these two places or can't draw a route between them: " + start + ", " + end + ". Please generate a new link and make these addresses more specific or closer.");
                } else {
                    journeyStage.setRoute(this.decodePath(resp.data.routes[0].overview_polyline.points));
                    resolve();
                }
            }, (reason) => {
                reject("There's an unknown failure with searchPlace: " + start + " --> " + end + ". Reason: " + reason + ". Please generate a new link and change these addresses.");
            });
        });
    }

    searchLine(journeyStage) {
        let searchPromises = [this.searchPlace(journeyStage.getStartDescription()), this.searchPlace(journeyStage.getEndDescription())];

        return new Promise((resolve, reject) => {
            Promise.all(searchPromises).then((values) => {
                journeyStage.setRoute(values);
                resolve();
            }, (reason) => {
                reject(reason); // bubble up the error
            });
        })
    }

    searchPlace(description){
        return new Promise((resolve, reject) => {
            let maybeLatLng = this.checkIfValidlatitudeAndlongitude(description)
            if (maybeLatLng != undefined) {
                resolve(maybeLatLng);
            } else {
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
                        console.log(resp.data.results)
                        resolve(resp.data.results[0].geometry.location);
                    }
                }, (reason) => {
                    reject("There's an unknown failure with searchPlace: " + description + ". Reason: " + reason + ". Please generate a new link and make these addresses.");
                });
            }
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

    checkIfValidlatitudeAndlongitude(str) {
        let chunks = str.split(",")
        var res = undefined
        if (chunks.length == 2)
        {
            if (this.isLatitude(chunks[0]) && this.isLongitude(chunks[1])) {
                res = {lat: Number(chunks[0]), lng: Number(chunks[1])};
            }
        }
        return res;
    }

    isLatitude(lat) {
        return isFinite(lat) && Math.abs(lat) <= 90;
    }

    isLongitude(lng) {
        return isFinite(lng) && Math.abs(lng) <= 180;
    }
}
