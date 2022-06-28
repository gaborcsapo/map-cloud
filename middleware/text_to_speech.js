import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { writeFile } from "fs";

export class TTSManager {
    constructor() {
        this.client = new TextToSpeechClient();
        this.audioStore = {};
    }

    getSpeech(text) {
        if (Object.hasOwn(this.audioStore, text)) {
            return Promise.resolve(this.audioStore[text]);
        } else {
            // Construct the request
            const request = {
                input: {text: text},
                // Select the language and SSML voice gender (optional)
                voice: {languageCode: 'en-US', ssmlGender: 'MALE'},
                // select the type of audio encoding
                audioConfig: {audioEncoding: 'MP3'},
            };
            // Performs the text-to-speech request
            return this.client.synthesizeSpeech(request).then(([response]) => {
                this.audioStore[text] = response.audioContent;

                console.log('Audio content loaded');
                // console.log(response);

                // writeFile('output.mp3', response.audioContent, () => {
                //     console.log('Audio content written to file: output.mp3');
                // });

                return response.audioContent;
            });

        }

    }

}