import * as JSURL from "jsurl"
import { MapDirections } from "./map_directions.js";
import { SimpleCache } from '../public/scripts/utilities/simpleCache.js';
import shortUUID from "short-uuid";
import { TEST_JOURNEY, FAM_JOURNEY } from "../public/scripts/utilities/testJourney.js";

let instance = null;

export class JourneyGenerator {
    constructor() {
        if (!instance) {
            instance = this;
            this.mapDirections = new MapDirections();
            this.journeyStore = new SimpleCache(300);
            this.queryCache = new SimpleCache(100);
            this.journeyStore.add("test", {status: "Ready", journeyStages: TEST_JOURNEY});
            this.journeyStore.add("fam", {status: "Ready", journeyStages: FAM_JOURNEY});
        }
        return instance;
    }

    getJourney(id) {
        return this.journeyStore.get(id);
    }

    rawURLDataToJourney(rawURLData)
    {
        const cacheEntry = this.queryCache.get(rawURLData);
        if (cacheEntry != null) {
            console.log("queryCache hit");
            return cacheEntry;
        } else {
            console.log("cache miss");
            const decodedData = JSURL.parse(rawURLData);
            const newId = this.generateJourney(decodedData);
            this.queryCache.add(rawURLData, newId);
            return newId;
        }
    }

    getNewJourneyStoreEntry() {
        const newId = shortUUID.generate();
        this.journeyStore.add(newId, {status: "Preparing"});
        return newId;
    }

    generateJourney(journeyStages) {
        const newId = this.getNewJourneyStoreEntry();

        const planeRoutePromise = this.mapDirections.searchLine(journeyStages[0]);
        const fireWorksRoutePromise = this.mapDirections.searchLine(journeyStages[1]);
        let locationPromises = [planeRoutePromise, fireWorksRoutePromise];
        for (let index = 2; index < journeyStages.length; index++) {
            locationPromises.push(this.mapDirections.searchRoute(journeyStages[index]));
        }

        Promise.all(locationPromises).then((values) => {
            // Connect the two paths in case the Maps API gives slightly different points.
            for (let index = 1; index < journeyStages.length; index++)
            {
                let prevRouteEnd = journeyStages[index - 1].getRoute();
                prevRouteEnd = prevRouteEnd[prevRouteEnd.length - 1];

                let currentRoute = journeyStages[index].getRoute();
                currentRoute.unshift(prevRouteEnd);
                journeyStages[index].setRoute(currentRoute);
            }

            this.journeyStore.add(newId, {status: "Ready", journeyStages: journeyStages});
            console.log(journeyStages);
        }, (reason) => {
            this.journeyStore.add(newId, {status: "Error", msg: reason});
        });
        return newId;
    }
}
