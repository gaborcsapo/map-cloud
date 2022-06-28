import { io } from "socket.io-client";

export class InfoReader {
    constructor() {
        this.info = [];
        this.chimeAudio = new Audio("/resources/sounds/chime.wav");
        this.socket = io();

        this.socket.on('connection', (data) => {
            console.log("Socket connected");
        });

        this.socket.on('tts_response', (data) => {
            console.log("loaded audio");
            this.loadedData = data;
        });
    }

    loadAudio(text) {
        this.socket.emit('tts_request', text, {});
        this.text = text;
    }

    readText(chime) {
        const currentAudio = this.loadedData;
        // we get 32Kbps MP3 which 4KB/s = 4B/ms
        const length = Math.round(this.loadedData.byteLength / 4) + 1000 + (chime * 2000);
        if (chime) {
            this.chimeAudio.play();
            setTimeout(()=> {
                this.playAudio(currentAudio);
            }, 2000);
        } else {
            this.playAudio(currentAudio);
        }

        const snackbar = document.getElementById("snackbar");
        snackbar.innerHTML = this.text;
        snackbar.classList.remove("hidden");
        snackbar.classList.add("show");
        setTimeout(()=> {
            snackbar.classList.add("hidden");
            snackbar.classList.remove("show");
        }, length);

        return length;
    }

    playAudio(arrayBuffer) {
        let audioContext = new AudioContext();
        let outputSource;
        try {
            if(arrayBuffer.byteLength > 0){
                audioContext.decodeAudioData(arrayBuffer,
                    (buffer) => {
                        audioContext.resume();
                        outputSource = audioContext.createBufferSource();
                        outputSource.connect(audioContext.destination);
                        outputSource.buffer = buffer;
                        outputSource.start(0);
                    },
                    () => {
                        console.log(arguments);
                    }
                );
            } else {
                console.log("byte length is 0");
            }
        } catch(e) {
            console.log(e);
        }
    }
}