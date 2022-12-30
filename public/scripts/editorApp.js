
import { JourneyStage } from "./utilities/journeyStage.js";
import { Loader } from '@googlemaps/js-api-loader';
import { createJourney } from "./utilities/requestHelper.js";
import { queryJourneyData } from "./utilities/requestHelper.js";
import { JourneyPlayer } from './controllers/journeyPlayer.js';
import { TimelineEditorManager } from "./controllers/timelineEditorManager.js";

class EditorApp {
    constructor() {
        this.editorManager = new TimelineEditorManager();
        document.getElementById("uploadButton").addEventListener("click", this.refreshPreview.bind(this));
        document.getElementById("copyButton").style.display = "none";
        this.id = undefined;
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
                            this.journeyPlayer.setJNewourney(journeyStages);
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

                this.initCopyButton(window.location.origin + "/trip/" + id);
            })
        }, (reason) => {
            this.errorToast(reason);
        });
    }

    errorToast(msg) {

    }

    clearToast() {

    }

    initCopyButton(link) {
        const tooltip = document.getElementById("copyButton");
        tooltip.style.display = "inline-block";

        new bootstrap.Tooltip(tooltip);
        tooltip.addEventListener('click', () => {
            navigator.clipboard.writeText(link);
            var tooltip = bootstrap.Tooltip.getOrCreateInstance(document.getElementById("copyButton"));
            tooltip.setContent({ '.tooltip-inner': 'Copied ' + link});
        })
        tooltip.addEventListener('mouseleave', () => {
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
