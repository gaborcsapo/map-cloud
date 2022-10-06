import * as JSURL from "jsurl"
import { compress } from 'compress-json'
import { CarCamAnimation } from './threejsObjects/cameraAnimations.js';
import { FireworksManager } from './controllers/fireworksManager.js';
import { Vehicle } from './controllers/vehicleManager.js';
import { Vector3 } from "three";
import { Loader } from '@googlemaps/js-api-loader';
import { MapAndOverlayManager } from './controllers/mapAndOverlayManager.js';

import MustacheFormTemplate from '../views/form_element.mustache'

const PLANE_LINE_COLOR = 0x285f4;
const CAR_LINE_COLOR = 0xf4b400;


class POSApp {
    constructor()
    {
        this.sampleJourneys = JSON.parse(sampleJourneysJSON);
        this.sampleJourneysIdx = Math.floor(Math.random() * (this.sampleJourneys.length - 1));
        this.journeyStages = this.sampleJourneys[this.sampleJourneysIdx];

        this.initialViewport = {
            center: this.journeyStages[0].route[0],
            zoom: 18,
            tilt: 30,
            heading: 0,
        };
        this.mapAndOverlayManager = new MapAndOverlayManager({initialViewport: this.initialViewport, disableDefaultUI: true});

        this.plane = new Vehicle({
            mapAndOverlayManager: this.mapAndOverlayManager,
            lineColor: PLANE_LINE_COLOR,
            modelPath: "/resources/3d/plane.gltf",
            front: new Vector3(-1, 0, 0),
            scale: 0.3,
            isImage: false,
        });
        this.car = new Vehicle({
            mapAndOverlayManager: this.mapAndOverlayManager,
            lineColor: CAR_LINE_COLOR,
            modelPath: "/resources/3d/car.gltf",
            front: new Vector3(1, 0, 0),
            scale: 0.2,
            isImage: false,
        });

        this.startNewJourney();
    }

    setUpdateSceneCallback(callback) {
        this.mapAndOverlayManager.updateSceneCallback = callback.bind(this);
    }

    startNewJourney() {
        this.stageIdx = 0;

        this.plane.deletePreviousLines();
        this.car.deletePreviousLines();
        if (this.fireworks)
        {
            this.fireworks.removeImage();
        }
        this.startNextJourneyLeg(this.plane);
        this.setUpdateSceneCallback(this.updateFlightScene);
    }

    startNextJourneyLeg(vehicle) {
        if (vehicle) {
            this.journeyStages[this.stageIdx].startDelay = 4000;
            this.journeyStages[this.stageIdx].zoomDuration = 2000;
            const {zoomAmplitude, duration} = vehicle.startNewJourneyStage(this.journeyStages[this.stageIdx]);
            this.journeyStages[this.stageIdx].camMoveDuration = duration;
            this.journeyStages[this.stageIdx].zoomAmplitude = zoomAmplitude;
        } else {
            this.journeyStages[this.stageIdx].startDelay = 4000;
            this.journeyStages[this.stageIdx].camMoveDuration = 2000;
            this.journeyStages[this.stageIdx].zoomAmplitude = 0;
            this.journeyStages[this.stageIdx].zoomDuration = 100;
        }

        this.cameraAnimation = new CarCamAnimation({
            mapAndOverlayManager: this.mapAndOverlayManager,
            journeyStageParams: this.journeyStages[this.stageIdx],
        });
        this.cameraAnimation.play();

        this.stageIdx++;
    }

    updateFlightScene() {
        if (this.plane.update())
        {
            this.startNextJourneyLeg(false);
            this.fireworks = new FireworksManager({
                scene: this.mapAndOverlayManager.getScene(),
                latLng: this.journeyStages[1].route[0],
                duration: this.journeyStages[1].startDelay + this.journeyStages[1].zoomDuration * 2 + this.journeyStages[1].camMoveDuration
            });
            this.setUpdateSceneCallback(this.updateFireworksScene);
        }
    }

    updateFireworksScene() {
        if (this.fireworks.update())
        {
            this.plane.update(); // to update the size in case sth went bad
            this.startNextJourneyLeg(this.car);
            this.setUpdateSceneCallback(this.updateCarScene);
        }
    }

    updateCarScene() {
        if (this.car.update()) {
            // car animation finished
            if (this.journeyStages.length - 1 == this.stageIdx) {
                setTimeout(() => {
                    this.sampleJourneysIdx = (this.sampleJourneysIdx + 1) % (this.sampleJourneys.length);
                    this.journeyStages = this.sampleJourneys[this.sampleJourneysIdx];
                    this.startNewJourney();
                }, 4000);
                this.stageIdx += 1;
            } else if (this.journeyStages.length > this.stageIdx) {
                this.plane.update(); // to update the size in case sth went bad
                this.startNextJourneyLeg(this.car);
            }
        }
    }
}

let sightCounter = 2;

window.addEventListener("load", function () {
    (async () => {
        new Loader({apiKey: MAPS_API_KEY}).load().then(() => {
            const page = new POSApp();
        });
    })();
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    const form  = document.getElementsByTagName('form')[0];

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        let languageSelect = document.getElementById('language');
        let languageValue = languageSelect.options[languageSelect.selectedIndex].value;
        const inputs  = document.getElementsByClassName('data-input-form');
        const values = Array.from(inputs).map((e) => {return e.value});
        values.unshift(languageValue);
        const encoded = JSURL.stringify(compress(values))
        document.getElementById("copyTarget").value = window.location.href + "map/?journey=" + encoded;

        form.classList.add('was-validated');
        setTimeout(() => {
            window.open("map/?journey=" + encoded, '_blank').focus();
        }, 1000);
    }, false)


    document.getElementById("add-button").addEventListener("click", (event) => {
        event.preventDefault();
        let html = MustacheFormTemplate.render({
            title: sightCounter + '. Next sight location',
            def: '',
            helper_text: '',
        });
        document.getElementById("add-button-container").insertAdjacentHTML("beforebegin", html);
        html = MustacheFormTemplate.render({
            title: 'Announcement at the sight',
            def: '',
            helper_text: '',
        });
        document.getElementById("add-button-container").insertAdjacentHTML("beforebegin", html);
        sightCounter++;
    });

    const tooltip = document.getElementById("copyButton");
    new bootstrap.Tooltip(tooltip);
    tooltip.addEventListener('click', () => {
        var copyText = document.getElementById("copyTarget");
        copyText.select();
        copyText.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(copyText.value);

        var tooltip = bootstrap.Tooltip.getOrCreateInstance(document.getElementById("copyButton"));
        tooltip.setContent({ '.tooltip-inner': 'Copied' });
    })
    tooltip.addEventListener('mouseleave', () => {
        var tooltip = bootstrap.Tooltip.getOrCreateInstance(document.getElementById("copyButton"));
        tooltip.setContent({ '.tooltip-inner': 'Copy to clipboard' });
    })

});
