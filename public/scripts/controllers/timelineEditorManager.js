import MustacheTimelineTemplate from '../../views/editor_timeline_element.mustache'
import { JourneyStage } from "../utilities/journeyStage.js";

export class TimelineEditorManager {
    constructor() {
        this.initFirstTimelineElem();
        this.initAutoExpandingTextArea()

        document.getElementById("addButton").addEventListener("click", this.addNewTimelineElem);
    }

    addNewTimelineElem() {
        let html = MustacheTimelineTemplate.render({
            addModeOfTransport: true,
            id: this.sightCounter,
        });

        document.getElementById("addButtonContainer").insertAdjacentHTML("beforebegin", html);
        let timelineElems = document.getElementById("editor-container").getElementsByClassName("timeline-elem");
        timelineElems[timelineElems.length - 2].children[0].children[1].style.background = "#D1D6E6";
        timelineElems[timelineElems.length - 1].children[0].children[1].style.background = "white";
        this.sightCounter++;
    }

    initAutoExpandingTextArea() {
        const tx = document.getElementsByTagName("textarea");
        for (let i = 0; i < tx.length; i++) {
            tx[i].setAttribute("style", "height:" + (tx[i].scrollHeight) + "px;overflow-y:hidden;");
            tx[i].addEventListener("input", function() {
                this.style.height = 0;
                this.style.height = (this.scrollHeight) + "px";
            }, false);
        }
    }

    initFirstTimelineElem() {
        let html = MustacheTimelineTemplate.render({id: 0});
        document.getElementById("addButtonContainer").insertAdjacentHTML("beforebegin", html);
        let timelineChildren = document.getElementById("editor-container").getElementsByClassName("timeline-elem");
        timelineChildren[0].children[0].children[0].style.background = "white";
        timelineChildren[0].children[0].children[1].style.background = "white";
        this.sightCounter = 1;

        this.addNewTimelineElem();
    }

    parseTimeline() {
        let ret = null;
        let cards = [...document.getElementsByClassName("card-container")];

        if (cards.length < 2) {
            ret = Promise.reject("Too few journey stops. You need to add at least two journey stops.")
        } else if (cards.some((elem) => { return elem.getElementsByClassName("stop_address")[0].value.length == 0})){
            ret = Promise.reject("An address field is empty. Please fill in the address for all journey stops");
        } else {
            let languageValue = document.getElementById('language-select').value;
            let journeyStages = [];
            let prevEnd = cards[0].getElementsByClassName("stop_address")[0].value;
            let prevTitle = cards[0].getElementsByClassName("stop_title")[0].value;
            let prevDescription = cards[0].getElementsByClassName("stop_description")[0].value;
            let prevFireworks = cards[0].getElementsByClassName("stop_fireworks")[0].checked;

            for (let i = 1; i < cards.length; i++) {
                journeyStages.push(new JourneyStage({
                    startDescription: prevEnd,
                    endDescription: cards[i].getElementsByClassName("stop_address")[0].value,
                    routeType: cards[i].getElementsByClassName("transport_select")[0].value,
                    markerTitle: prevTitle,
                    narrationText: prevDescription,
                    language: languageValue,
                    fireworks: prevFireworks,
                    picture: undefined
                }))
                prevTitle = cards[i].getElementsByClassName("stop_title")[0].value;
                prevDescription = cards[i].getElementsByClassName("stop_description")[0].value;
                prevEnd = cards[i].getElementsByClassName("stop_address")[0].value;
                prevFireworks = cards[i].getElementsByClassName("stop_fireworks")[0].checked;
            }

            journeyStages.push(new JourneyStage({
                startDescription: prevEnd,
                endDescription: prevEnd,
                routeType: "teleportation",
                markerTitle: prevTitle,
                narrationText: prevDescription,
                language: languageValue,
                fireworks: prevFireworks,
                picture: undefined
            }))

            ret = Promise.resolve(journeyStages);
        }

        return ret;
    }
}
