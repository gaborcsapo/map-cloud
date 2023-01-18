import { Router} from 'express';
import { JourneyStore } from '../middleware/journeyStore.js';
import { JourneyStage } from '../public/scripts/utilities/journeyStage.js';

const router = Router();
const journeyStore = new JourneyStore();

router.post('/getjourney', async (req, res) => {
    const data  = await journeyStore.getJourney(JSON.parse(req.body).id)
    res.json(data);
});

router.post('/createjourney', (req, res) => {
    let result = journeyStore.addJourney(JSON.parse(req.body).data.map(
        (elem) => {
            return new JourneyStage(elem);
        }),
        req.body.id
    );
    res.json({"id" : result});
});

export default router;
