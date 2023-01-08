import { Router} from 'express';
import { getMapsAPIKey } from '../middleware/secret_manager.js';
import { JourneyStage } from '../public/scripts/utilities/journeyStage.js';

const router = Router();
const maps_api_key = await getMapsAPIKey();

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
];

router.get('/', (req, res) => {
    res.render('home', {
        "maps_api_key": maps_api_key
    })}
);

export default router ;
