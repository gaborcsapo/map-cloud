import MustacheTimelineTemplate from '../../views/timeline_element.mustache'

export class TimelineManager {
    constructor({journeyStages: journeyStages}) {
        if (document.getElementById("timeline-container")) {
            // loop stages and insert template w title and body
            journeyStages.forEach(journeyStageParams => {
                if (journeyStageParams.markerTitle == '') {
                    journeyStageParams.markerTitle = journeyStageParams.getStartDescription();
                }
                let html = MustacheTimelineTemplate.render({
                    title: journeyStageParams.markerTitle,
                    body: journeyStageParams.narrationText,
                });
                document.getElementById("timeline-container").insertAdjacentHTML("beforeend", html);
            });

            let timelineChildren = document.getElementById("timeline-container").children;
            timelineChildren[0].children[0].children[0].style.background = "white";
            timelineChildren[timelineChildren.length - 1].children[0].children[1].style.background = "white";
        }
    }

    open(id) {
        this.closeAll();

        // open the accordion
        let acc = document.getElementsByClassName("timeline-title")[id];
        if (acc) {
            acc.parentNode.classList.remove("blocked");
            if (acc.classList.contains("timeline-title-openable"))
            {
                acc.classList.add("active");
                let panel = acc.nextElementSibling;
                panel.style.maxHeight = panel.scrollHeight + "px";

                acc.addEventListener("click", function() {
                    /* Toggle between adding and removing the "active" class,
                    to highlight the button that controls the panel */
                    this.classList.toggle("active");

                    let panel = this.nextElementSibling;
                    if (panel.style.maxHeight) {
                        panel.style.maxHeight = null;
                    } else {
                        panel.style.maxHeight = panel.scrollHeight + "px";
                    }
                });
            }
        }
        // scroll after animation finishes
        setTimeout(() => {
            this.scrollTo(id);
        }, 800);
    }

    scrollTo(id) {
        let acc = document.getElementsByClassName("timeline-elem")[id];
        if (acc) {
            acc.scrollIntoView({behavior: "smooth", block: "start", inline: "start"});
        }
    }

    closeAll() {
        var acc = document.getElementsByClassName("timeline-title");
        for (var i = 0; i < acc.length; i++) {
            acc[i].classList.remove("active");
            var panel = acc[i].nextElementSibling;
            panel.style.maxHeight = null;
        }
    }
}
