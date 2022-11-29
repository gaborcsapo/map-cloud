import { JourneyGenerator } from "./journeyGenerator.js";
import { SimpleCache } from '../public/scripts/utilities/simpleCache.js';
import shortUUID from "short-uuid";
import { TEST_JOURNEY, FAM_JOURNEY } from "../public/scripts/utilities/testJourney.js";
import { Datastore } from '@google-cloud/datastore';
import { JourneyStage } from "../public/scripts/utilities/journeyStage.js";
let instance = null;

export class JourneyStore {
    constructor() {
        if (!instance) {
            instance = this;
            this.journeyStore = new SimpleCache(300);
            this.journeyGenerator = new JourneyGenerator();
            this.datastore = new Datastore();
            this.addJourney(TEST_JOURNEY, "test");
            this.addJourney(FAM_JOURNEY, "fam");
        }
        return instance;
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

        return ret;
    }

    async addToGCS(id, data) {
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
        // check if journey in local cache, otherwise check GCS, otherwise return error
        let journey = this.journeyStore.get(id);
        if (journey == null) {
            journey = await this.getFromGCS(id)
            if (journey == null) {
                return Promise.resolve({status: "NotFound"});
            }
        }

        if (journey.status == "Error") {
            return Promise.resolve(journey)
        }

        const todoPromises = [
            this.journeyGenerator.populateRoute(journey.journeyStages),
            this.journeyGenerator.populateAudio(journey.journeyStages)
        ]

        return Promise.all(todoPromises)
            .then(() => {
                this.journeyGenerator.calculateDurations(journey.journeyStages);
                return journey;
            }, (reason) => {
                console.log("error creating journey: " + reason);
                this.journeyStore.add(newId, {status: "Error", msg: reason});
                return this.journeyStore.get(newId);
            });
    }

    addJourney(journeyStages, id) {
        if (id == undefined) {
            id = shortUUID.generate();
        }

        this.journeyStore.add(id, {status: "Ok", journeyStages: journeyStages});
        this.addToGCS(id, {status: "Ok", journeyStages: journeyStages});

        // call get so that it caches the journey details
        this.getJourney(id);

        return id;
    }
}
