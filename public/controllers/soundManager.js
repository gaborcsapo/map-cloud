export class SoundManager {
    constructor() {


        this.airport = new Audio("/resources/sounds/airport.flac");
        this.airport.loop = true;

        this.car = new Audio("/resources/sounds/car.wav");
        this.car.loop = true;

        this.music = new Audio("/resources/sounds/happy_music.wav");
        this.music.loop = true;

        this.plane = new Audio("/resources/sounds/plane.wav");
        this.plane.loop = true;
    }

    playMusic() {
        this.music.play();
    }

    musicVolumeDown() {
        this.music.volume /= 3;
    }

    playAirportSound(duration) {
        this.airport.play();
        setTimeout(() => {
            this.airport.pause();
        }, duration);
    }

    playCarSound(delay, duration) {
        setTimeout(() => {
            this.car.play();
            setTimeout(() => {
                this.car.pause();
            }, duration);
        }, delay);
    }

    playPlaneSound(delay, duration) {
        setTimeout(() => {
            this.plane.play();
            setTimeout(() => {
                this.plane.pause();
            }, duration);
        }, delay);
    }
}
