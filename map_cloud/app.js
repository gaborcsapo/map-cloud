const express = require('express');
const router = express.Router();
const favicon = require('serve-favicon');
const mustacheExpress = require('mustache-express');
const app = express();
const mustache = mustacheExpress();
const home = require('./routes/home');

require('dotenv').config();

mustache.cache = null;
app.engine('mustache', mustache);
app.set('view engine', 'mustache')
app.set('views', __dirname + '/views');
app.use(express.static('public'));

// app.use(favicon(__dirname + '/public/img/favicon.png'));

app.use('/', home);
app.use('/hi', home);

const PORT = parseInt(process.env.PORT) || 8080;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}.`);
});