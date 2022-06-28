import { Router} from 'express';
import { getMapsAPIKey } from '../middleware/secret_manager.js';
import { PathGenerator } from '../middleware/path_generator.js';

const maps_api_key = await getMapsAPIKey();
const router = Router();
const pathGenerator = new PathGenerator

router.get('/', (req, res) => {
    if(Object.hasOwn(req.query, "path"))
    {
        console.log(req.query.path);
        pathGenerator.generatePath(req.query.path).then((path) => {
            console.log(JSON.stringify(path));

            res.render('fam', {
                "maps_api_key": maps_api_key,
                "famCarPaths": JSON.stringify(path),
            })
        })
    }
    else
    {
        res.send("Error; missing data, please go to our home page to generate the right travel parameters");
    }
});

export default router;
