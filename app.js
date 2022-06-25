import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import serve_favicon from 'serve-favicon';
import mustacheExpress from 'mustache-express';
import 'dotenv/config'

import routes from './routes/routes.js';
import { DirectionExporter } from './middleware/map_directions.js';
import {TTSManager} from './middleware/text_to_speech.js';

const app = express();
const http = createServer(app);
const io = new Server(http);
const mustache = mustacheExpress();

mustache.cache = null;
app.engine('mustache', mustache);
app.set('view engine', 'mustache')
app.set('views', 'public/views');
app.use(express.static('dist'));
app.use('/', routes.home);
app.use('/fam', routes.fam);
app.use('/joy', routes.joy);
app.use('/urbanai', routes.urbanai);
// app.use(favicon(__dirname + '/dist/img/favicon.png'));

const PORT = parseInt(process.env.PORT) || 8080;
const tts = new TTSManager();

http.listen(PORT, () => {
  console.log(`HTTP listening on port ${PORT}.`);
})

io.on('connection', (socket) => {
  console.log('Connection established');

  socket.on('disconnect', () => {
    console.log('Disconnected');
  });

  socket.on('tts_request', (text) => {
    tts.getSpeech(text).then((audio) => {
      socket.emit("tts_response", audio);
    });
    console.log("tts_request: ", text);
  });
});

//const exporter = new DirectionExporter();