import { Loader } from '@googlemaps/js-api-loader';
import SampleJourneys from "../resources/journeys/sampleJourneys.js";
import { JourneyPlayer } from './controllers/journeyPlayer.js';
import { SoundManager } from './controllers/soundManager.js';

class HomeApp {
    constructor()
    {
        this.journeyIdx = 0;
        new SoundManager().setSilent(true);
        this.journeyPlayer = new JourneyPlayer(SampleJourneys[0], true);
        this.journeyPlayer.playJourney(this.playNextJourney.bind(this));
        bootstrap.Tooltip.getOrCreateInstance(document.getElementById("demoButton"), {trigger: "hover"});
        bootstrap.Tooltip.getOrCreateInstance(document.getElementById("editorButton"), {trigger: "hover"});
    }

    playNextJourney() {
        this.journeyIdx = (this.journeyIdx + 1) % SampleJourneys.length;
        this.journeyPlayer.setNewJourney(SampleJourneys[this.journeyIdx]);
        this.journeyPlayer.playJourney(this.playNextJourney.bind(this));
    }
}

(async () => {
    new Loader({apiKey: MAPS_API_KEY}).load().then(() => {
        const page = new HomeApp();
    });
})();
