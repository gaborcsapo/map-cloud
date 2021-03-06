import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { writeFile } from "fs";
import { SimpleCache } from '../public/controllers/simpleCache.js';

export class TTSManager {
    constructor() {
        this.client = new TextToSpeechClient();
        this.audioStore = new SimpleCache(70);
    }

    getSpeech(text, language) {
        if (this.audioStore.get(text+language) != null) {
            return Promise.resolve(this.audioStore.get(text+language));
        } else {
            // Construct the request
            const request = {
                input: {text: text},
                // Select the language and SSML voice gender (optional)
                voice: {languageCode: language, ssmlGender: 'MALE'},
                // select the type of audio encoding
                audioConfig: {audioEncoding: 'MP3'},
            };
            // Performs the text-to-speech request
            return this.client.synthesizeSpeech(request).then(([response]) => {
                this.audioStore.add(text+language, response.audioContent);
                return response.audioContent;
            });

        }

    }

}