import express from 'express';
import serve_favicon from 'serve-favicon';
import mustacheExpress from 'mustache-express';
import 'dotenv/config'

import routes from './routes/routes.js';

const app = express();
const mustache = mustacheExpress();

mustache.cache = null;
app.engine('mustache', mustache);
app.set('view engine', 'mustache')
app.set('views', 'public/views');
app.use(express.static('dist'));

// app.use(favicon(__dirname + '/dist/img/favicon.png'));
app.use('/', routes.home);
app.use('/fam', routes.fam);
app.use('/joy', routes.joy);
app.use('/urbanai', routes.urbanai);

const PORT = parseInt(process.env.PORT) || 8080;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}.`);
});