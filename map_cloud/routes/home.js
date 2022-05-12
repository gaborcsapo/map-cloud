var express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('home')
});


router.get('/simple', (req, res) => {
    res.render('simple', {"api_key": process.env.MAPS_API_KEY})
});

module.exports = router;