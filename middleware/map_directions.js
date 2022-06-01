import {Client } from "@googlemaps/google-maps-services-js";
import { getDirectionsAPIKey } from './secret_manager.js';
import { writeFileSync } from 'fs'

const destinations = [
    "Taoyuan Airport Terminal 2",
    "Zhongshan MRT station Taipei",
    "Banqiao Huajiang 1st road 235"
]

export class DirectionExporter {
    key;

    constructor() {
        console.log("init");
        getDirectionsAPIKey().then((key) => {
            this.key = key;
            this.retrievePaths();
        });
    }

    async retrievePaths(){
        const client = new Client({});
        console.log("start");
        for (let i = 1; i < destinations.length; i++)
        {
            console.log(i);
            let promise = client.directions({params: {
                                                origin:destinations[i - 1],
                                                destination:destinations[i],
                                                travelMode: 'DRIVING',
                                                key: this.key,
                                            },
                                            timeout: 1000,
                                        });
            let results = await promise;
            this.saveOutput(`public/resources/paths/${i}.json`, this.decodePath(results.data.routes[0].overview_polyline.points), { flag: 'w' });
        }
        console.log("done");
    }

    saveOutput(fileName, data)
    {
        let json_data = JSON.stringify(data);
        writeFileSync(fileName, json_data);
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
