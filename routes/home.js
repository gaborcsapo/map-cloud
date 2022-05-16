import { Router} from 'express';

const router = Router();

router.get('/', (req, res) => {
    res.render('home', {"maps_api_key": payload})
});

export default router ;
