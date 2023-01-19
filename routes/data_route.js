import { Router} from 'express';
import { JourneyStore } from '../middleware/journeyStore.js';
import { JourneyStage } from '../public/scripts/utilities/journeyStage.js';

const router = Router();
const journeyStore = new JourneyStore();

router.post('/getjourney', async (req, res) => {
    console.log(req.body);
    const data  = await journeyStore.getJourney(req.body.id)
    res.json(data);
});

router.post('/createjourney', (req, res) => {
    let result = journeyStore.addJourney(req.body.data.map(
        (elem) => {
            return new JourneyStage(elem);
        }),
        req.body.id
    );
    res.json({"id" : result});
});

export default router;
