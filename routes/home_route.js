import { Router} from 'express';
import { getMapsAPIKey } from '../middleware/secret_manager.js';
import { JourneyStage } from '../public/scripts/utilities/journeyStage.js';

const router = Router();
const maps_api_key = await getMapsAPIKey();

const view = {
    forms: [
        {
            // DEP_AIRPORT                   : 1,
            title: "What's your Home airport location?",
            helper_text: '<br>Animations start by flying from your home base to your destination. Write the name or lat/long coordinates of the airport. (i.e. 49.019597, 2.540914)',
            def: "Vienna Internation Airport",
        },
        {
            // DEP_AIRPORT_TITLE             : 2,
            title: "Title",
            helper_text: "",
            def: "The journey begins!",
        },
        {
            // DEP_AIRPORT_TEXT              : 3,
            title: "Pre-departure announcement.",
            helper_text: "<br>This text will be read aloud by AI before departure.",
            def: "Flight G A B 4 5 1 to Taipei is ready to depart. We wish you a pleasant journey! Someone is eagerly waiting on the other side for you.",
        },
        {
            // ARR_AIRPORT                   : 4,
            title: "Destination airport location.",
            helper_text: "<br>Again either name or lat/long coordinates...",
            def: "25.081604, 121.229958",
        },
        {
            // ARR_AIRPORT_TITLE             : 5,
            title: "Title",
            helper_text: "",
            def: "Welcome to Taiwan!!",
        },
        {
            // ARR_AIRPORT_TEXT              : 6,
            title: "Arrival message",
            helper_text: "",
            def: "Welcome to Taiwan!! So excited to see you!"
        },
        {
            // CELEB_IMG                     : 7,
            title: "Airport welcoming picture link.",
            helper_text: "<br>I'll display this image at the airport. Has to be a public picture link (not Google Photos etc)",
            def: "/resources/img/welcome-default.png",
        },
        {
            // AIRPORT_CAR_START             : 8,
            title: "Arrival terminal",
            helper_text: "<br>Next, the animation takes you to the city. Which airport terminal should your car depart from?",
            def: "Taoyuan International Airport Terminal 2",
        },
        {
            // AIRPORT_CAR_START_TITLE       : 9,
            title: "Title",
            helper_text: "",
            def: "Let's go to the city",
        },
        {
            // AIRPORT_CAR_START_TEXT        : 10,
            title: "Announcement before car departure",
            helper_text: "",
            def: "Let's go to the city to see all the coolest places!"
        },
        {
            // FIRSTCITY_DEST                : 11,
            title: "First car destination in the city.",
            helper_text: "<br>Either address or lat/long coordinates are fine.",
            def: "Taipei Zhongshan MRT station",
        },
        {
            title: "Title",
            helper_text: "",
            def: "The hotel is at Zhongshan",
        },
        {
            title: "Announcement at arrival",
            helper_text: "",
            def: "This is Zhongshan, one of the bustling centers of Taipei. I love the mixture old and modern that you can experience when you walk along the 3km long Zhongshan Linear Park."
        },
        {
            title: "1. Sightseeing location",
            helper_text: "<br>Next the sightseeing begins. Add the address or coordinates of each sight then in the next field the text to read aloud.",
            def: "Taipei 101 Tower",
        },
        {
            title: "Title",
            helper_text: "",
            def: "The view from Taipei 101",
        },
        {
            title: "Announcement at first sight",
            helper_text: "",
            def: "This is one of the coolest and tallest buildings in Taipei, Taipei 101. Elephant mountain is a great place to soak in the sunset with the view of 101.",
        },
    ]
};

const samplePOSJourneys = [
    [
        new JourneyStage({ stageName: "", startDescription: "New York JFK Airport", endDescription: "49.019597, 2.540914", routeType: "plane", markerTitle: "New York JFK", narrationText: undefined, language: undefined, picture: undefined}),
        new JourneyStage({ stageName: "", startDescription: "49.019597, 2.540914", endDescription: "Airport Charles de Gaulle France Terminal 1", routeType: "plane", markerTitle: "Charles de Gaulle Airport", narrationText: undefined, language: undefined, picture: "/resources/img/welcome-default.png"}),
        new JourneyStage({ stageName: "", startDescription: "Airport Charles de Gaulle France Terminal 1", endDescription: "48.859349, 2.294018", routeType: "plane", markerTitle: "Eiffel Tower", narrationText: undefined, language: undefined, picture: undefined}),
        new JourneyStage({ stageName: "", startDescription: "48.859349, 2.294018", endDescription: "48.851942, 2.349294", routeType: "plane", markerTitle: "Notre Dam", narrationText: undefined, language: undefined, picture: undefined}),
    ],
    [
        new JourneyStage({ stageName: "", startDescription: "37.466138, 126.436942", endDescription: "35.551909, 139.790911", routeType: "plane", markerTitle: "Incheon Airport", narrationText: undefined, language: undefined, picture: undefined}),
        new JourneyStage({ stageName: "", startDescription: "35.551909, 139.790911", endDescription: "Tokyo Haneda Terminal 2", routeType: "plane", markerTitle: "Tokyo Haneda", narrationText: undefined, language: undefined, picture: "/resources/img/welcome-default.png"}),
        new JourneyStage({ stageName: "", startDescription: "Tokyo Haneda Terminal 2", endDescription: "35.659414, 139.701681", routeType: "plane", markerTitle: "Shibuya", narrationText: undefined, language: undefined, picture: undefined}),
        new JourneyStage({ stageName: "", startDescription: "35.659414, 139.701681", endDescription: "35.709626, 139.810548", routeType: "plane", markerTitle: "Tokyo Skytree", narrationText: undefined, language: undefined, picture: undefined}),
    ],
    // [
    //     "No announcements on sample page",
    //     "1.350543, 103.989859",
    //     "Singapore Aiport",
    //     "No text for sample journeys",
    //     "25.249175, 55.363002",
    //     "Dubai DXB Airport",
    //     "No text for sample journeys",
    //     "/resources/img/welcome-default.png",
    //     "25.196957, 55.273784",
    //     "Let's see the plans",
    //     "No text for sample journeys",
    //     "Burj Khalifa Dubai",
    //     "Burj Khalifa",
    //     "No text for sample journeys",
    //     "24.410573, 54.475386",
    //     "Abu Dhabi Grand Mosque",
    //     "No text for sample journeys",
    // ]
];



router.get('/', (req, res) => {
    if (Object.hasOwn(view, "POSJourneyParams")) {
        res.render('home', view);
        console.log("cache hit")
    } else {
        let ids = [];


        view["maps_api_key"] = maps_api_key;
        view["sampleJourneyIds"] = "";
        res.render('home', view);
    }
});

export default router ;
