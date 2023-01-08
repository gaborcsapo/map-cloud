import { JourneyStage } from "./utilities/journeyStage.js";
import { Loader } from '@googlemaps/js-api-loader';
import { SoundManager } from './controllers/soundManager.js';
import { createJourney } from "./utilities/requestHelper.js";
import { queryJourneyData } from "./utilities/requestHelper.js";
import { JourneyPlayer } from './controllers/journeyPlayer.js';
import { TimelineEditorManager } from "./controllers/timelineEditorManager.js";
import MustacheModalTemplate from '../views/modal.mustache'

class EditorApp {
    constructor() {
        this.editorManager = new TimelineEditorManager();
        document.getElementById("uploadButton").addEventListener("click", this.refreshPreview.bind(this));
        bootstrap.Tooltip.getOrCreateInstance(document.getElementById("uploadButton"), {trigger: "hover"});
        document.getElementById("copyButton").style.display = "none";
        this.id = undefined;

        let html = MustacheModalTemplate.render({
            title: "Welcome to the <b>Digital Travel Postcard</b> editor!",
            body: '<p>1. Fill in the timeline with your story</p><p>2. Click the save button for a preview while you\'re editing</p><p>3. When done, press the copy button to copy the shareable link to your postcard</p>\n<button type="button" id="continue-button" class="btn btn-primary">Continue</button>',
        });
        document.getElementById("modal-container").insertAdjacentHTML("beforeend", html);
        this.myModal = new bootstrap.Modal('#splash-modal');
        this.myModal.show();

        document.getElementById("continue-button").onclick = () => {
            let soundManager = new SoundManager();
            soundManager.playButtonClick();
            this.myModal.hide();
        };

        var toastElList = [].slice.call(document.querySelectorAll('.toast'))
        var toastList = toastElList.map(function (toastEl) {
            return new bootstrap.Toast(toastEl, {autohide:false})
        })
    }

    refreshPreview() {
        this.clearToast();

        this.editorManager.parseTimeline().then((data) => {
            createJourney(this.id, data).then((id) => {
                this.id = id;
                queryJourneyData(id).then((data) => {
                    if (data.status == "ok") {
                        let journeyStages = data.journeyStages.map((stage) => new JourneyStage(stage));
                        if (this.journeyPlayer) {
                            this.journeyPlayer.setNewJourney(journeyStages);
                        } else {
                            this.journeyPlayer = new JourneyPlayer(journeyStages);
                        }

                        this.journeyPlayer.playJourney();
                    } else {
                        if (data.status == "notfound") {
                            this.errorToast("Internal server error, can't find your journey. Try again.");
                        } else if (data.status == "error") {
                            this.errorToast(data.msg)
                        }
                    }
                }, (reason) => {
                    this.errorToast(reason);
                });

                this.initCopyButton(window.location.origin + "/trip/?id=" + id);
            })
        }, (reason) => {
            this.errorToast(reason);
        });
    }

    errorToast(msg) {
        var myToastEl = document.getElementById('msgToastEl')
        var myToast = bootstrap.Toast.getOrCreateInstance(myToastEl)
        document.getElementById('msgToastBody').innerHTML = msg;
        myToast.show();
    }

    clearToast() {
        var myToastEl = document.getElementById('msgToastEl')
        var myToast = bootstrap.Toast.getOrCreateInstance(myToastEl)
        myToast.hide();
    }

    initCopyButton(link) {
        const tooltipHtmlElem = document.getElementById("copyButton");
        tooltipHtmlElem.style.display = "inline-block";
        bootstrap.Tooltip.getOrCreateInstance(tooltipHtmlElem, {trigger: "hover"});

        tooltipHtmlElem.addEventListener('click', () => {
            navigator.clipboard.writeText(link);
            var tooltip = bootstrap.Tooltip.getOrCreateInstance(document.getElementById("copyButton"));
            tooltip.setContent({ '.tooltip-inner': 'Copied ' + link});
        })
        tooltipHtmlElem.addEventListener('mouseleave', () => {
            var tooltip = bootstrap.Tooltip.getOrCreateInstance(document.getElementById("copyButton"));
            tooltip.setContent({ '.tooltip-inner': 'Copy to clipboard' });
        })
    }
}

(async () => {
    new Loader({apiKey: MAPS_API_KEY}).load().then(() => {
        const page = new EditorApp();
    });
})();
