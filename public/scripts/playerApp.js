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

        queryJourneyData(urlSearchParams.get("id")).then((data) => {
            let html;
            if (data.status == "ok") {
                let journeyStages = data.journeyStages.map((stage) => new JourneyStage(stage));
                this.journeyPlayer = new JourneyPlayer(journeyStages);

                html = MustacheModalTemplate.render({
                    title: "Open your <b>Postcard Animation</b> &#127881; &#9992;&#65039; &#127881;",
                    body: '<button type="button" id="continue-button" class="btn btn-primary">Continue with sound &#128266;</button>',
                });
                document.getElementById("modal-container").insertAdjacentHTML("beforeend", html);
                this.myModal = new bootstrap.Modal('#splash-modal');

                document.getElementById("continue-button").onclick = () => {
                    let soundManager = new SoundManager()
                    soundManager.playButtonClick();

                    this.myModal.hide();
                    this.journeyPlayer.playJourney(this.showCredits);

                    setTimeout(()=>{
                        soundManager.playMusic();
                    }, 1000);
                };
            } else {
                if (data.status == "notfound") {
                    html = MustacheModalTemplate.render({
                        title: "Journey ID Not Found",
                        body: '<p>Make sure the correct URL was opened, otherwise please create a new journey in our editor <a href="/editor">here</a>.',
                    });
                } else {
                    html = MustacheModalTemplate.render({
                        title: "Couldn't Generate Journey",
                        body: data.msg + '\nYou can create a new journey in our editor <a href="/editor">here</a>.',
                    });
                }

                document.getElementById("modal-container").insertAdjacentHTML("beforeend", html);
                this.myModal = new bootstrap.Modal('#splash-modal');
            }

            this.myModal.show();
        });

        var toastElList = [].slice.call(document.querySelectorAll('.toast'))
        var toastList = toastElList.map(function (toastEl) {
            return new bootstrap.Toast(toastEl, {autohide:false})
        })
    }

    showCredits() {
        var myToastEl = document.getElementById('msgToastEl')
        var myToast = bootstrap.Toast.getOrCreateInstance(myToastEl)
        myToast.show();
    }
}

(async () => {
    new Loader({apiKey: MAPS_API_KEY}).load().then(() => {
        const page = new PlayerApp();
    });
})();
