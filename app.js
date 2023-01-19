import express from 'express';
import { createServer } from 'http';
import serve_favicon from 'serve-favicon';
import mustacheExpress from 'mustache-express';
import 'dotenv/config'
import cors from "cors";
import routes from './routes/routes.js';

const app = express();
const http = createServer(app);
const mustache = mustacheExpress();

mustache.cache = null;

http.setTimeout(10000, ()=> {
    console.log("app.js: HTTP server timed out");
})
app.use(cors({
  'origin': ['https://postcard.gaborcsapo.com', 'http://postcard.gaborcsapo.com', "https://localhost:8080"],
}))
app.use(express.json());
app.engine('mustache', mustache);
app.set('view engine', 'mustache')
app.set('views', 'public/views');
app.use(express.static('dist'));
app.use('/', routes.home);
app.use('/trip', routes.trip);
app.use('/editor', routes.editor);
app.use('/data', routes.data);
app.use(serve_favicon('dist/resources/img/favicon.png'));

// const PORT = parseInt(process.env.PORT) || 8080;

// http.listen(PORT, () => {app.use(express.json());
//   console.log(`HTTP listening on port ${PORT}.`);
// })

export { app }