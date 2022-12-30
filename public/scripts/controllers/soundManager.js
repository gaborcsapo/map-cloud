let instance = null;

export class SoundManager {
    constructor() {
        if (!instance) {
            instance = this;

            this.airport = new Audio("/resources/sounds/airport.flac");
            this.airport.loop = true;

            this.car = new Audio("/resources/sounds/car.wav");
            this.car.loop = true;

            this.music = new Audio("/resources/sounds/happy_music.wav");
            this.music.loop = true;

            this.plane = new Audio("/resources/sounds/plane.wav");
            this.plane.loop = true;

            this.button = new Audio("/resources/sounds/button_click.mp3");

            this.chimeAudio = new Audio("/resources/sounds/chime.wav");
        }
        return instance;
    }

    playMusic() {
        this.music.play();
        this.music.volume /= 2;
    }

    musicVolumeDown() {
        this.music.volume /= 4;
    }

    playAirportSound() {
        this.airport.play();
    }

    stopAirportSound() {
        this.airport.pause();
    }

    playCarSound() {
        this.car.play();
    }

    stopCarSound() {
        this.car.pause();
    }

    playPlaneSound() {
        this.plane.play();
    }

    stopPlaneSound() {
        this.plane.pause();
    }

    playButtonClick() {
        this.button.play();
    }

    playChime() {
        this.chimeAudio.play();
    }

    playAudio(arrayBuffer) {
        return new Promise(resolve => {
            try {
                let audioContext = new AudioContext();
                let outputSource;
                if(arrayBuffer && arrayBuffer.byteLength > 0){
                    audioContext.decodeAudioData(arrayBuffer,
                        (buffer) => {
                            audioContext.resume();
                            outputSource = audioContext.createBufferSource();
                            outputSource.connect(audioContext.destination);
                            outputSource.buffer = buffer;
                            outputSource.start(0);
                            setTimeout(resolve, buffer.duration * 1000)
                        },
                        () => {
                            console.log(arguments);
                        }
                    );
                } else {
                    console.log("byte length is 0");
                    resolve();
                }
            } catch(e) {
                console.log(e);
            }
        });
    }
}
