var express = require('express');
const router = express.Router();

const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');
const client = new SecretManagerServiceClient();
const name = 'projects/577599183138/secrets/MAPS_API_KEY/versions/latest';

async function getSecret() {
    const [version] = await client.accessSecretVersion({ name });
    const payload = version.payload.data.toString();
    return payload;
}

getSecret().then(payload =>{
    router.get('/simple', (req, res) => {
        res.render('simple', {"maps_api_key": payload})
    });
});

router.get('/', (req, res) => {
    res.render('home')
});

module.exports = router;
