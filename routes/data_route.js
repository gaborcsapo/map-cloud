import { Router} from 'express';
import { JourneyGenerator } from '../middleware/journey_generator.js';
import { JourneyStage } from '../public/scripts/utilities/journeyStage.js';

const router = Router();
const journeyGenerator = new JourneyGenerator();

router.post('/getjourney', (req, res) => {
    res.json(journeyGenerator.getJourney(req.body.id))
});

router.post('/createjourney', (req, res) => {
    let result = journeyGenerator.generateJourney(req.body.data.map((elem) => {
        return new JourneyStage(elem);
    }));
    res.json({"id" : result});
});

export default router;
