import { Router} from 'express';
import { JourneyGenerator } from '../middleware/journey_generator.js';

const router = Router();

router.get('/', (req, res) => {
    res.json(JourneyGenerator.getJourney(req.body))
});

export default router;
