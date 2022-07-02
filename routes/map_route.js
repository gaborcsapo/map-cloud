import { Router} from 'express';
import { getMapsAPIKey } from '../middleware/secret_manager.js';
import { JourneyGenerator } from '../middleware/journey_generator.js';

const maps_api_key = await getMapsAPIKey();
const router = Router();
const journeyGenerator = new JourneyGenerator();

router.get('/', (req, res) => {
    if(Object.hasOwn(req.query, "journey"))
    {
        console.log(req.query.journey);
        journeyGenerator.rawURLDataToJourney(req.query.journey).then((journey) => {
            res.render('map', {
                "maps_api_key": maps_api_key,
                "journeyParams": JSON.stringify(journey),
            })
            console.log(JSON.stringify(journey));
        }, (reason) => {
            res.render('error', {
                "error_msg": reason,
            })
        })
    }
    else
    {
        res.render('error', {
            "error_msg": "missing data, please go to our home page to generate the right travel parameters",
        });
    }
});

export default router;
