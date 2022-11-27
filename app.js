import express from 'express';
import { createServer } from 'http';
import serve_favicon from 'serve-favicon';
import mustacheExpress from 'mustache-express';
import 'dotenv/config'

import routes from './routes/routes.js';

const app = express();
const http = createServer(app);
const mustache = mustacheExpress();

mustache.cache = null;
app.use(express.json());
app.engine('mustache', mustache);
app.set('view engine', 'mustache')
app.set('views', 'public/views');
app.use(express.static('dist'));
app.use('/', routes.home);
app.use('/map', routes.map);
app.use('/data', routes.data);
app.use(serve_favicon('dist/resources/img/favicon.png'));

const PORT = parseInt(process.env.PORT) || 8080;

http.listen(PORT, () => {app.use(express.json());
  console.log(`HTTP listening on port ${PORT}.`);
})

