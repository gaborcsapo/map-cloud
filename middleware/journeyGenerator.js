import { MapDirections } from "./map_directions.js";
import { TTSManager } from "./text_to_speech.js";
import { SimpleCache } from '../public/scripts/utilities/simpleCache.js';

const tts = new TTSManager();
const mapDirections = new MapDirections();

let instance = null;

export class JourneyGenerator {
    constructor() {
        if (!instance) {
            instance = this;
            this.routeStore = new SimpleCache(300);
            this.audioStore = new SimpleCache(300);
        }
        return instance;
    }

    populateRoute(journeyStages) {
        console.log("populateRoute()");
        let locationPromises = journeyStages.map((stage) => {
            if ((stage.getRouteType() == "plane") || (stage.getRouteType() == "shift")) {
                return mapDirections.searchLine(stage);
            } else if (stage.getRouteType() == "car") {
                return mapDirections.searchRoute(stage);
            }
        })

        return Promise.all(locationPromises)
            .then(() => {
                for (let index = 1; index < journeyStages.length; index++)
                {
                    // Connect the two paths in case the Maps API gives slightly different points.
                    let prevRouteEnd = journeyStages[index - 1].getRoute();
                    prevRouteEnd = prevRouteEnd[prevRouteEnd.length - 1];
                    let currentRoute = journeyStages[index].getRoute();

                    currentRoute.unshift(prevRouteEnd);
                    journeyStages[index].setRoute(currentRoute);
                }
            });
    }

    populateAudio(journeyStages) {
        console.log("populateAudio()");
        // Get text to speech
        let speechPromises = journeyStages.reduce((result, stage) => {
            if (stage.getNarrationText()) {
                result.push(tts.getSpeech(stage.getNarrationText(), stage.getLanguage()));
            }
            return result;
        }, []);

        return Promise.all(speechPromises).then((results) => {
            for (let index = 0; index < journeyStages.length; index++)
            {
                if (journeyStages[index].getNarrationText()) {
                    journeyStages[index].setNarrationAudio(results[index]);
                }
            }
        });
    }

    calculateDurations(journeyStages) {
        for (let index = 0; index < journeyStages.length; index++)
        {
            let stage = journeyStages[index];

            if (stage.getNarrationText()) {
                // we get 32Kbps MP3 which 4KB/s = 4B/ms
                let audioLength = Math.round(stage.getNarrationAudio().byteLength / 4) + 1000;
                if (stage.getRouteType() == "plane") {
                    audioLength += 2000; // for the airport chime
                }
                stage.setNarrationDuration(audioLength);

            }

            if ((stage.getRouteType() == "plane") || (stage.getRouteType() == "car")) {
                // The zoomamplitude equation is just a exponential curve fitting for these y/x values:
                // 12     1508257.9025383398
                // 4       25943.69836456524
                // 3.8     21074.388344540803
                // 13     6067340.345612513
                // 7      142126.16128664665
                // 13.5    8587727.398089878
                // 5      48061.46991743621
                // 2.8    7756.402385156812
                // 13.5   12079192.250058014
                // 5      45619.223347196
                // 2.9    7807.924142224345

                stage.setStartingZoom(18);
                stage.setTargetZoom(
                    18 - Math.min(13.68244 + (1.556327 - 13.68244)/Math.pow(1 + Math.pow((stage.getDistance()/1036770), 0.6166804), 2.364686), 14)
                );
                // rougly 1sec/km should be duration with a max of 25 sec
                stage.setCamMoveDuration(
                    Math.round(Math.min(stage.getDistance() / 0.9, 25000))
                );
                stage.setZoomDuration(2000);
            } else if (stage.getRouteType() == "shift") {
                stage.setCamMoveDuration(2000);
            }
        }
    }
}
