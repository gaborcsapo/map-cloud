import { Router} from 'express';
import { getMapsAPIKey } from '../middleware/secret_manager.js';



// Shoudln't await maps API key, delays server becoming reponsive




const maps_api_key = await getMapsAPIKey();
const router = Router();

router.get('/', (req, res) => {
    if(Object.hasOwn(req.query, "journey"))
    {
        res.render('map', {
            "maps_api_key": maps_api_key
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
