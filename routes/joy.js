import { Router} from 'express';
import { getMapsAPIKey } from '../middleware/secret_manager.js';

const router = Router();

getMapsAPIKey().then(payload =>{
    router.get('/', (req, res) => {
        res.render('joy', {"maps_api_key": payload})
    });
});

export default router ;
