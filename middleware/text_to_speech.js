import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { SimpleCache } from '../public/scripts/utilities/simpleCache.js';

export class TTSManager {
    constructor() {
        this.client = new TextToSpeechClient();
        this.audioStore = new SimpleCache(70);
    }

    getSpeech(text, language) {
        if (this.audioStore.get(text+language) != null) {
            console.log("TTS cache hit");
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
                console.log("TTS cache miss, req done");
                this.audioStore.add(text+language, response.audioContent);
                return response.audioContent;
            });

        }

    }

}