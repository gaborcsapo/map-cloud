import * as JSURL from "jsurl"
import { decompress } from 'compress-json'
import { MapDirections } from "./map_directions.js";
import { SimpleCache } from "../public/controllers/simpleCache.js";

const LANGUAGE_IDX = 0;
const DEP_AIRPORT_IDX = 1;
const DEP_AIRPORT_TEXT_IDX = 2
const ARR_AIRPORT_IDX = 3;
const ARR_AIRPORT_TEXT_IDX = 4;
const CELEB_IMG_IDX = 5;
const AIRPORT_CAR_START_IDX = 6;
const AIRPORT_CAR_START_TEXT_IDX = 7;
const FIRSTCITY_DEST_IDX = 8;
const FIRST_SIGHT_IDX = 10;


export class JourneyGenerator {
    constructor() {
        this.mapDirections = new MapDirections();
        this.journeyStore = new SimpleCache(100);
    }

    rawURLDataToJourney(rawURLData)
    {
        const decodedData = decompress(JSURL.parse(rawURLData));
        console.log(decodedData);

        const cacheEntry = this.journeyStore.get(decodedData);
        if (cacheEntry != null) {
            console.log("cache hit");
            return new Promise((resolve, reject) => {
                resolve(cacheEntry);
            });
        } else {
            console.log("cache miss");
            return generatePath(decodedData);
        }

    }

    generatePath(paramList) {

        const planeRoute = this.createStraighLineRoute(paramList[DEP_AIRPORT_IDX], paramList[ARR_AIRPORT_IDX]);
        const fireWorksRoutePromise = this.createStraighLineRoute(paramList[ARR_AIRPORT_IDX], paramList[AIRPORT_CAR_START_IDX]);
        const toCityRoutePromise = this.mapDirections.searchPath(paramList[AIRPORT_CAR_START_IDX], paramList[FIRSTCITY_DEST_IDX]);

        let locationPromises = [planeRoute, fireWorksRoutePromise, toCityRoutePromise];
        // Add the sights
        for (let index = FIRST_SIGHT_IDX; index < paramList.length; index+=2) {
            locationPromises.push(this.mapDirections.searchPath(paramList[index-2], paramList[index]));
        }

        locationPromises.push(this.mapDirections.searchPath(paramList[paramList.length - 2], paramList[FIRSTCITY_DEST_IDX]));

        return new Promise((resolve, reject) => {
            Promise.all(locationPromises).then((values) => {
                // Connect the two paths in case the Maps API gives slightly different points.
                for (let index = 1; index < values.length; index++)
                {
                    values[index].unshift(values[index - 1][values[index - 1].length - 1])
                }

                let generatedPath = [
                    {
                        route: values[0],
                        text: paramList[DEP_AIRPORT_TEXT_IDX],
                        language: paramList[LANGUAGE_IDX]
                    },
                    {
                        route: values[1],
                        text: paramList[ARR_AIRPORT_TEXT_IDX],
                        celebImgURL: paramList[CELEB_IMG_IDX],
                        language: paramList[LANGUAGE_IDX]
                    }
                ];

                for (let index = 2; index < values.length; index++) {
                    generatedPath.push({
                        route: values[index],
                        text: paramList[AIRPORT_CAR_START_TEXT_IDX + 2 * (index - 2)],
                        language: paramList[LANGUAGE_IDX]
                    });
                }

                this.journeyStore.add(paramList, generatedPath);
                resolve(generatedPath);
            }, (reason) => {
                reject(reason); // bubble up the error
            });
        })
    }

    createStraighLineRoute(start, end) {
        return new Promise((resolve, reject) => {
            Promise.all([this.mapDirections.searchPlace(start), this.mapDirections.searchPlace(end)]).then((values) => {
                resolve(values);
            }, (reason) => {
                reject(reason); // bubble up the error
            })
        });
    }
}
