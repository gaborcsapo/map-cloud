import * as JSURL from "jsurl"
import { CarCamAnimation } from './threejsObjects/cameraAnimations.js';
import { FireworksManager } from './controllers/fireworksManager.js';
import { VehicleManager } from './controllers/vehicleManager.js';
import { Vector3 } from "three";
import { Loader } from '@googlemaps/js-api-loader';
import { MapAndOverlayManager } from './controllers/mapAndOverlayManager.js';

import MustacheFormTemplate from '../views/form_element.mustache'
import { JourneyStage } from "./utilities/journeyStage.js";
import { queryJourneyData, createJourney } from "./utilities/requestHelper.js";


let sightCounter = 2;

const PARAM_IDX = {
    DEP_AIRPORT                   : 0,
    DEP_AIRPORT_TITLE             : 1,
    DEP_AIRPORT_TEXT              : 2,
    ARR_AIRPORT                   : 3,
    ARR_AIRPORT_TITLE             : 4,
    ARR_AIRPORT_TEXT              : 5,
    CELEB_IMG                     : 6,
    AIRPORT_CAR_START             : 7,
    AIRPORT_CAR_START_TITLE       : 8,
    AIRPORT_CAR_START_TEXT        : 9,
    FIRST_CITY_DEST               : 10,
    FIRST_CITY_DEST_TITLE         : 11,
    FIRST_CITY_DEST_TEXT          : 12,
    FIRST_SIGHT                   : 13,
}

window.addEventListener("load", function () {

    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    const form  = document.getElementsByTagName('form')[0];

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        let languageSelect = document.getElementById('language');
        let languageValue = languageSelect.options[languageSelect.selectedIndex].value;
        const inputs  = document.getElementsByClassName('data-input-form');
        const values = Array.from(inputs).map((e) => {return e.value});

        let journeyStages = [
            new JourneyStage({stageName: "Flight", startDescription: values[PARAM_IDX.DEP_AIRPORT], endDescription: values[PARAM_IDX.ARR_AIRPORT], routeType: "plane", markerTitle: values[PARAM_IDX.DEP_AIRPORT_TITLE], narrationText: values[PARAM_IDX.DEP_AIRPORT_TEXT], language: languageValue, picture: undefined}),
            new JourneyStage({stageName: "Leaving the airport", startDescription: values[PARAM_IDX.ARR_AIRPORT], endDescription: values[PARAM_IDX.AIRPORT_CAR_START], routeType: "shift", markerTitle: values[PARAM_IDX.ARR_AIRPORT_TITLE], narrationText: values[PARAM_IDX.ARR_AIRPORT_TEXT], language: languageValue, picture: values[PARAM_IDX.CELEB_IMG]}),
        ];

        let i;
        for (i = PARAM_IDX.FIRST_CITY_DEST; i < values.length; i += 3) {
            journeyStages.push(new JourneyStage({stageName: "Car journey", startDescription: values[i - 3], endDescription: values[i], routeType: "car", markerTitle: values[i-2], narrationText: values[i-1], language: languageValue, picture: undefined}));
        }

        journeyStages.push(new JourneyStage({stageName: "Car journey", startDescription: values[i - 3], endDescription: values[PARAM_IDX.FIRST_CITY_DEST], routeType: "car", markerTitle: values[i - 2], narrationText: values[i - 1], language: languageValue, picture: undefined}));

        createJourney(journeyStages).then((resp) => {
            document.getElementById("copyTarget").value = window.location.href + "map/?journey=" + resp;
            form.classList.add('was-validated');
            setTimeout(() => {
                window.open("map/?journey=" + resp, '_blank').focus();
            }, 1000);
        })
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
            title: 'Title',
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
