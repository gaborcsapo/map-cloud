import { Router} from 'express';
import { getMapsAPIKey } from '../middleware/secret_manager.js';

const maps_api_key = await getMapsAPIKey();
const router = Router();

router.get('/', (req, res) => {
    if(Object.hasOwn(req.query, "id"))
    {
        res.render('player', {
            "maps_api_key": maps_api_key
        })
    }
    else
    {
        res.render('error', {
            "error_msg": "Trip ID is missing from the URL. Please go to our home page for more information.",
        });
    }
});

export default router;
