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
    let req_body = JSON.parse(req.body);
    let result = journeyStore.addJourney(req_body.data.map(
        (elem) => {
            return new JourneyStage(elem);
        }),
        req_body.id
    );
    res.json({"id" : result});
});

export default router;
