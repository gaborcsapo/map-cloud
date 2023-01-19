import { JourneyGenerator } from "./journeyGenerator.js";
import { SimpleCache } from '../public/scripts/utilities/simpleCache.js';
import shortUUID from "short-uuid";
import { Datastore } from '@google-cloud/datastore';
import { JourneyStage } from "../public/scripts/utilities/journeyStage.js";

export class JourneyStore {
    constructor() {
        this.journeyStore = new SimpleCache(300);
        this.journeyGenerator = new JourneyGenerator();
        this.datastore = new Datastore();
    }

    async getFromGCS(id) {
        let ret = null;
        const queryKey = this.datastore.createQuery('journey')
        .filter('__key__', '=', this.datastore.key(['journey', id]));
        const [journeyResults] = await this.datastore.runQuery(queryKey);

        if (journeyResults.length > 0) {
            let journey = journeyResults[0];
            journey.journeyStages = journey.journeyStages.map((stage) => new JourneyStage(stage));
            ret = journey
        }

        console.log("getFromGCS id:", id, ret ? ret.status : null);
        return ret;
    }

    async addToGCS(id, data) {
        console.log("addToGCS id:", id);
        const dsKey = this.datastore.key(["journey", id]);

        let date = new Date();
        date.setMonth(date.getMonth() + 12);

        const journeyEntry = {
            key: dsKey,
            data: [
                {
                    name: "journeyStages",
                    value: data.journeyStages,
                    excludeFromIndexes: true,
                },
                {
                    name: "expireAt",
                    value: date,
                    excludeFromIndexes: true,
                },
                {
                    name: "status",
                    value: data.status,
                    excludeFromIndexes: true,
                }
            ],
        }
        this.datastore.save(journeyEntry);
    }

    async getJourney(id) {
        console.log("getJourney() id:", id);
        // check if journey in local cache, otherwise check GCS, otherwise return error
        let journey = this.journeyStore.get(id);
        if (journey == null) {
            journey = await this.getFromGCS(id)
            if (journey == null) {
                return Promise.resolve({status: "notfound"});
            }
        }

        if (journey.status != "ok") {
            return Promise.resolve(journey)
        }

        const todoPromises = [
            this.journeyGenerator.populateRoute(journey.journeyStages),
            this.journeyGenerator.populateAudio(journey.journeyStages)
        ]

        return Promise.all(todoPromises)
            .then(() => {
                this.journeyGenerator.calculateDurations(journey.journeyStages);
                console.log("getJourney() finished populating id:", id, journey.status);
                return journey;
            }, (reason) => {
                console.log("error creating journey: " + reason);
                this.journeyStore.add(id, {status: "error", msg: reason});
                return this.journeyStore.get(id);
            });
    }

    addJourney(journeyStages, id) {
        if (id == undefined || id == "undefined" || id == "") {
            id = shortUUID.generate();
        }
        console.log("addJourney() id:", id);

        this.journeyStore.add(id, {status: "ok", journeyStages: journeyStages});
        this.addToGCS(id, {status: "ok", journeyStages: journeyStages});

        // call getJourney so that it caches the journey details
        this.getJourney(id);

        return id;
    }
}
