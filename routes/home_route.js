import { Router} from 'express';
import { getMapsAPIKey } from '../middleware/secret_manager.js';
import { JourneyGenerator } from '../middleware/journey_generator.js';

const router = Router();
const maps_api_key = await getMapsAPIKey();
const journeyGenerator = new JourneyGenerator();

const view = {
    forms: [
        {
            title: "Departure Airport Location",
            def: "Vienna Internation Airport",
        },
        {
            title: "Pre-departure announcement",
            def: "Flight G A B 4 5 1 to Taipei is ready to depart. We wish you a pleasant journey!",
        },
        {
            title: "Destination Airport Location",
            def: "Taoyuan International Airport",
        },
        {
            title: "Arrival message",
            def: "Welcome to Taiwan"
        },
        {
            title: "Airport Celebration Picture Link",
            def: "/resources/img/welcome-default.png",
        },
        {
            title: "Car Departure Location from Airport",
            def: "Taoyuan International Airport Terminal 2",
        },
        {
            title: "Announcement before car departure",
            def: "And now let's go to the city!"
        },
        {
            title: "Car Destination",
            def: "Taipei Zhongshan MRT station",
        },
        {
            title: "Announcement at arrival",
            def: "This is Zhongshan, one of the centers of Taipei"
        },
        {
            title: "Sight location",
            def: "Banqiao Huajiang 1st road 235",
        },
        {
            title: "Announcement at sight",
            def: "arrived here",
        },
        {
            title: "Sight location",
            def: "Google TPKD",
        },
        {
            title: "Announcement at sight",
            def: "This is google",
        },
        {
            title: "Sight location",
            def: "Taipei 101 Tower",
        },
        {
            title: "Announcement at sight",
            def: "Here's Taipei 1 0 1",
        },
        {
            title: "Sight location",
            def: "Yongkang Street Taipei",
        },
        {
            title: "Announcement at sight",
            def: "Yongkang street",
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
