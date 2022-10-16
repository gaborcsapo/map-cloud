import { Server } from 'socket.io';
import { JourneyGenerator } from '../middleware/journey_generator.js';
import { TTSManager } from '../middleware/text_to_speech.js';
import { JourneyStage } from '../public/scripts/utilities/journeyStage.js';

export class SocketManager {
    constructor(server) {
        this.io = new Server(server);
        const tts = new TTSManager();
        this.journeyGenerator = new JourneyGenerator();

        this.io.on('connection', (socket) => {
            console.log('Connection established');

            socket.on('disconnect', () => {
                console.log('Disconnected');
            });

            socket.on('tts_request', (request) => {
                console.log(request);
                tts.getSpeech(request.text, request.language).then((audio) => {
                    socket.emit("tts_response", audio);
                });
            });

            socket.on('createJourney', (arg, callback) => {
                callback(this.journeyGenerator.generateJourney(arg.map((elem) => {
                    return new JourneyStage(elem);
                })));
            });

            socket.on('getJourneyData', (arg, callback) => {
                callback(this.journeyGenerator.getJourney(arg));
            });
        });
    }
}