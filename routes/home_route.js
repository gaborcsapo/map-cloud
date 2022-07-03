import { Router} from 'express';
import { getMapsAPIKey } from '../middleware/secret_manager.js';
import { JourneyGenerator } from '../middleware/journey_generator.js';

const router = Router();
const maps_api_key = await getMapsAPIKey();
const journeyGenerator = new JourneyGenerator();

const view = {
    forms: [
        {
            title: "What's your Home airport location?",
            helper_text: '<br>Animations start by flying from your home base to your destination. Write the name or lat/long coordinates of the airport. (i.e. 49.019597, 2.540914)',
            def: "Vienna Internation Airport",
        },
        {
            title: "Pre-departure announcement.",
            helper_text: "<br>This text will be read aloud by AI before departure.",
            def: "Flight G A B 4 5 1 to Taipei is ready to depart. We wish you a pleasant journey!",
        },
        {
            title: "Destination airport location.",
            helper_text: "<br>Again either name or lat/long coordinates...",
            def: "Taoyuan International Airport",
        },
        {
            title: "Arrival message",
            helper_text: "",
            def: "Welcome to Taiwan"
        },
        {
            title: "Airport welcoming picture link.",
            helper_text: "<br>I'll display this image at the airport. Has to be a public picture link (not Google Photos etc)",
            def: "/resources/img/welcome-default.png",
        },
        {
            title: "Arrival terminal",
            helper_text: "<br>Next, the animation takes you to the city. Which airport terminal should your car depart from?",
            def: "Taoyuan International Airport Terminal 2",
        },
        {
            title: "Announcement before car departure",
            helper_text: "",
            def: "And now let's go to the city!"
        },
        {
            title: "First car destination in the city.",
            helper_text: "<br>Either address or lat/long coordinates are fine.",
            def: "Taipei Zhongshan MRT station",
        },
        {
            title: "Announcement at arrival",
            helper_text: "",
            def: "This is Zhongshan, one of the centers of Taipei"
        },
        {
            title: "1. Sightseeing location",
            helper_text: "<br>Next the sightseeing begins. Add the address or coordinates of each sight then in the next field the text to read aloud.",
            def: "Banqiao Huajiang 1st road 235",
        },
        {
            title: "Announcement at first sight",
            helper_text: "",
            def: "arrived here",
        },
    ]
};

const samplePOSJourneys = [
    [
        "No announcements on sample page",
        "New York JFK Airport",
        "No text for sample journeys",
        "49.019597, 2.540914",
        "No text for sample journeys",
        "/resources/img/welcome-default.png",
        "Airport Charles de Gaulle France Terminal 1",
        "No text for sample journeys",
        "Eiffel Tower Paris",
        "No text for sample journeys",
        "Paris Notre Dam Cathedral",
        "No text for sample journeys",
    ],
    [
        "No announcements on sample page",
        "37.466138, 126.436942",
        "No text for sample journeys",
        "35.551909, 139.790911",
        "No text for sample journeys",
        "/resources/img/welcome-default.png",
        "Tokyo Haneda Terminal 2",
        "No text for sample journeys",
        "Shibuya Tokyo",
        "No text for sample journeys",
        "Tokyo Skytree",
        "No text for sample journeys",
    ],
    [
        "No announcements on sample page",
        "1.350543, 103.989859",
        "No text for sample journeys",
        "25.249175, 55.363002",
        "No text for sample journeys",
        "/resources/img/welcome-default.png",
        "Dubai DXB Airport Terminal 3",
        "No text for sample journeys",
        "Burj Khalifa Dubai",
        "No text for sample journeys",
        "Abu Dhabi Grand Mosque",
        "No text for sample journeys",
    ]
];

router.get('/', (req, res) => {
    if (Object.hasOwn(view, "POSJourneyParams")) {
        res.render('home', view);
    } else {
        let promises = [];
        samplePOSJourneys.forEach(journey => {
            promises.push(journeyGenerator.generatePath(journey));
        });
        Promise.all(promises).then((data) => {
            view["maps_api_key"] = maps_api_key;
            view["POSJourneyParams"] = JSON.stringify(data);
            res.render('home', view);
        }, (reason) => {
            res.render('error', {
                "error_msg": reason,
            })
        })
    }
});

export default router ;
