export class JourneyStage {
    constructor({
        stageName,
        startDescription,
        endDescription,
        routeType,
        markerTitle,
        narrationText,
        language,
        picture,
        route = [],
        narrationAudio = undefined,
        startDelay = 0,
        camMoveDuration = 0,
        zoomAmplitude = 0,
        zoomDuration = 0,
    }) {
        this.stageName = stageName;
        this.startDescription = startDescription;
        this.endDescription = endDescription;
        this.routeType = routeType;
        this.route = route;
        this.narrationAudio = narrationAudio;
        this.startDelay = startDelay;
        this.camMoveDuration = camMoveDuration;
        this.zoomAmplitude = zoomAmplitude;
        this.zoomDuration = zoomDuration;
        this.markerTitle = markerTitle;
        this.narrationText = narrationText;
        this.language = language;
        this.picture = picture;
    }

    getStageName() {
        return this.stageName;
    }

    getStartDescription() {
        return this.startDescription;
    }

    getEndDescription() {
        return this.endDescription;
    }

    getMarkerTitle() {
        return this.markerTitle;
    }

    getNarrationText() {
        return this.narrationText;
    }

    getLanguage() {
        return this.language;
    }

    setPicture(picture) {
        this.picture = picture;
    }

    getPicture() {
        return this.picture;
    }

    getRouteType() {
        return this.routeType;
    }

    setRoute(route) {
        this.route = route;
    }

    getRoute() {
        return this.route;
    }

    setNarrationAudio(narrationAudio) {
        this.narrationAudio = narrationAudio;
    }

    getNarrationAudio() {
        return this.narrationAudio;
    }

    setStartDelay(startDelay) {
        this.startDelay = startDelay;
    }

    getStartDelay() {
        return this.startDelay;
    }

    setCamMoveDuration(camMoveDuration) {
        this.camMoveDuration = camMoveDuration;
    }

    getCamMoveDuration() {
        return this.camMoveDuration;
    }

    setZoomAmplitude(zoomAmplitude) {
        this.zoomAmplitude = zoomAmplitude;
    }

    getZoomAmplitude() {
        return this.zoomAmplitude;
    }

    setZoomDuration(zoomDuration) {
        this.zoomDuration = zoomDuration;
    }

    getZoomDuration() {
        return this.zoomDuration;
    }
}
