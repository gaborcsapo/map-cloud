import { Loader } from '@googlemaps/js-api-loader';
import { queryJourneyData } from "./utilities/requestHelper.js";
import { JourneyStage } from './utilities/journeyStage.js';
import MustacheModalTemplate from '../views/modal.mustache'
import { JourneyPlayer } from './controllers/journeyPlayer.js';
import { SoundManager } from './controllers/soundManager.js';

class PlayerApp {
    constructor()
    {
        const urlSearchParams = new URLSearchParams(window.location.search);

        queryJourneyData(urlSearchParams.get("journey")).then((data) => {
            let html;
            if (data.status == "ok") {
                let journeyStages = data.journeyStages.map((stage) => new JourneyStage(stage));
                this.journeyPlayer = new JourneyPlayer(journeyStages);

                html = MustacheModalTemplate.render({
                    title: "Open your <b>Digital Travel Postcard</b> &#127881; &#9992;&#65039; &#127881;",
                    body: '<button type="button" id="continue-button" class="btn btn-primary btn-lg">Continue with sound &#128266;</button>',
                });
                document.getElementById("modal-container").insertAdjacentHTML("beforeend", html);
                this.myModal = new bootstrap.Modal('#splash-modal');

                document.getElementById("continue-button").onclick = () => {
                    let soundManager = new SoundManager()
                    soundManager.playButtonClick();

                    this.myModal.hide();
                    this.journeyPlayer.playJourney();

                    setTimeout(()=>{
                        soundManager.playMusic();
                    }, 1000);
                };
            } else {
                if (data.status == "notfound") {
                    html = MustacheModalTemplate.render({
                        title: "Journey ID Not Found",
                        body: '<p>Make sure the correct URL was opened, otherwise please create a new journey in our editor <a href="/editor">here</a>',
                    });
                } else if (data.status == "error") {
                    html = MustacheModalTemplate.render({
                        title: "Couldn't Generate Journey",
                        body: data.msg + '\nYou can create a new journey in our editor <a href="/editor">here</a>',
                    });
                }

                document.getElementById("modal-container").insertAdjacentHTML("beforeend", html);
                this.myModal = new bootstrap.Modal('#splash-modal');
            }

            this.myModal.show();
        });
    }
}

(async () => {
    new Loader({apiKey: MAPS_API_KEY}).load().then(() => {
        const page = new PlayerApp();
    });
})();
