import { Router} from 'express';
import { getMapsAPIKey } from '../middleware/secret_manager.js';

const maps_api_key = await getMapsAPIKey();
const router = Router();

router.get('/', (req, res) => {
    res.render('editor', {
        "maps_api_key": maps_api_key
    })
});

export default router;
