import { Client } from "@googlemaps/google-maps-services-js";
import { getDirectionsAPIKey } from './secret_manager.js';
import { distanceLatLng } from '../public/scripts/utilities/coordinates.js'
import { SimpleCache } from '../public/scripts/utilities/simpleCache.js';

const apiKey = await getDirectionsAPIKey();

export class MapDirections {
    constructor() {
        this.client = new Client();
        this.cache = new SimpleCache(300);
    }

    searchRoute(journeyStage){
        let retPromise;
        const cacheEntry = this.cache.get("route"+journeyStage.getStartDescription()+journeyStage.getEndDescription());

        console.log("Route cache ", cacheEntry ? "hit": "miss", " for:", journeyStage.getStartDescription(), " --> ", journeyStage.getEndDescription());
        if (cacheEntry != null) {
            journeyStage.setDistance(cacheEntry.distance);
            journeyStage.setRoute(cacheEntry.line);
            retPromise = Promise.resolve();
        } else {
            retPromise = new Promise((resolve, reject) => {
                this.client.directions({
                    params:
                    {
                        origin: journeyStage.getStartDescription(),
                        destination: journeyStage.getEndDescription(),
                        travelMode: 'DRIVING',
                        key: apiKey,
                    },
                    timeout: 10000,
                })
                .then((resp) => {
                    if (resp.data.routes.length == 0)
                    {
                        reject("Google Maps doesn't recognize one of these two places or can't draw a route between them. Are you sure selected the correct mode of transport? Cars can't go over oceans...");
                    } else {
                        journeyStage.setDistance(resp.data.routes[0].legs[0].distance.value);
                        journeyStage.setRoute(this.decodePath(resp.data.routes[0].overview_polyline.points));

                        this.cache.add(
                            "route"+journeyStage.getStartDescription()+journeyStage.getEndDescription(),
                            {
                                distance: resp.data.routes[0].legs[0].distance.value,
                                line: this.decodePath(resp.data.routes[0].overview_polyline.points),
                            }
                        );
                        resolve();
                    }
                })
                .catch((reason) => {
                    reject("An error occured while searching routes between: " + journeyStage.getStartDescription() + " --> " + journeyStage.getEndDescription() + ". Reason: " + reason + ".\nPlease generate a new link and change these addresses.");
                });
            });
        }
        return retPromise;
    }

    searchLine(journeyStage) {
        let retPromise;
        const cacheEntry = this.cache.get("line"+journeyStage.getStartDescription()+journeyStage.getEndDescription());

        console.log("Searchline cache ", cacheEntry ? "hit": "miss", " for:", journeyStage.getStartDescription(), " --> ", journeyStage.getEndDescription());
        if (cacheEntry != null) {
            journeyStage.setDistance(cacheEntry.distance);
            journeyStage.setRoute(cacheEntry.line);
            retPromise = Promise.resolve();
        } else {
            const searchPromises = [this.searchPlace(journeyStage.getStartDescription()), this.searchPlace(journeyStage.getEndDescription())];

            retPromise = Promise.all(searchPromises).then((values) => {
                    journeyStage.setDistance(distanceLatLng(values[0], values[1]));
                    journeyStage.setRoute(values);

                    this.cache.add(
                        "line"+journeyStage.getStartDescription()+journeyStage.getEndDescription(),
                        {
                            distance: distanceLatLng(values[0], values[1]),
                            line: values,
                        }
                    );
                })
        }
        return retPromise;
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
                    timeout: 10000,
                }).then((resp) => {
                    if (resp.data.results.length == 0)
                    {
                        reject("Google Maps can't find the place with this description");
                    } else {
                        resolve(resp.data.results[0].geometry.location);
                    }
                })
                .catch((reason) => {
                    reject("An error occured while searching the place: " + description + ". Reason: " + reason + ".\nPlease generate a new link and make these addresses.");
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
