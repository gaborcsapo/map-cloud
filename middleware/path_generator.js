import * as JSURL from "jsurl"
import { decompress } from 'compress-json'
import { MapDirections } from "./map_directions.js";

export class PathGenerator {
    constructor() {
        this.mapDirections = new MapDirections();
    }

    generatePath(rawURLData)
    {
        const decodedData = decompress(JSURL.parse(rawURLData));
        console.log(decodedData);

        const planeRoute = this.createPlaneRoute(decodedData[0], decodedData[2]);
        const fireWorksRoutePromise = this.createPlaneRoute(decodedData[2], decodedData[5]);
        const toCityRoutePromise = this.mapDirections.searchPath(decodedData[5], decodedData[7]);

        let locationPromises = [planeRoute, fireWorksRoutePromise, toCityRoutePromise];
        // Add the sights
        for (let index = 9; index < decodedData.length; index+=2) {
            locationPromises.push(this.mapDirections.searchPath(decodedData[index-2], decodedData[index]));
            console.log(decodedData[index-2], decodedData[index]);
        }

        locationPromises.push(this.mapDirections.searchPath(decodedData[decodedData.length - 1], decodedData[7]));

        return new Promise((resolve) => {
            Promise.all(locationPromises).then((values) => {
                console.log(values.length)
                let generatedPath = [
                    {
                        route: values[0],
                        text: decodedData[1]
                    },
                    {
                        route: values[1],
                        text: decodedData[3],
                        celebImgURL: decodedData[4],
                    }
                ];

                for (let index = 2; index < values.length; index++) {
                    generatedPath.push({
                        route: values[index],
                        text: decodedData[2 + 2 * index]
                    });
                }
                console.log(generatedPath);
                resolve(generatedPath);
            }, reason => {
                console.log(reason)
            })
        })
    }

    createPlaneRoute(start, end) {
        return new Promise((resolve) => {
            Promise.all([this.mapDirections.searchPlace(start), this.mapDirections.searchPlace(end)]).then((values) => {
                resolve(values);
            })
        }, reason => {
            console.log(reason)
        });

    }
}
