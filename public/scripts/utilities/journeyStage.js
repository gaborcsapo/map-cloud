export class JourneyStage {
    constructor({
        stageName,
        startDescription,
        endDescription,
        routeType,
        markerTitle,
        narrationText,
        language,
        picture = undefined,
        route = [],
        narrationAudio = undefined,
        narrationDuration = 0,
        camMoveDuration = 0,
        zoomDuration = 0,
        startingZoom = 0,
        targetZoom = 0,
        distance = 0,
        fireworks = false,
    }) {
        this.stageName = stageName;
        this.startDescription = startDescription;
        this.endDescription = endDescription;
        this.routeType = routeType;
        this.route = route;
        if (narrationAudio) {
            this.narrationAudio = new Uint8Array(narrationAudio.data).buffer;
        }
        this.picture = picture;
        this.narrationDuration = narrationDuration;
        this.camMoveDuration = camMoveDuration;
        this.startingZoom = startingZoom;
        this.targetZoom = targetZoom;
        this.zoomDuration = zoomDuration;
        this.markerTitle = markerTitle;
        this.narrationText = narrationText;
        this.language = language;
        this.picture = picture;
        this.distance = distance;
        this.fireworks = fireworks;
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

    setNarrationDuration(narrationDuration) {
        this.narrationDuration = narrationDuration;
    }

    getNarrationDuration() {
        return this.narrationDuration;
    }

    setCamMoveDuration(camMoveDuration) {
        this.camMoveDuration = camMoveDuration;
    }

    getCamMoveDuration() {
        return this.camMoveDuration;
    }

    setStartingZoom(startingZoom) {
        this.startingZoom = startingZoom;
    }

    getStartingZoom() {
        return this.startingZoom;
    }

    setTargetZoom(targetZoom) {
        this.targetZoom = targetZoom;
    }

    getTargetZoom() {
        return this.targetZoom;
    }

    setZoomDuration(zoomDuration) {
        this.zoomDuration = zoomDuration;
    }

    getZoomDuration() {
        return this.zoomDuration;
    }

    setDistance(distance) {
        this.distance = distance;
    }

    getDistance() {
        return this.distance;
    }

    setFireworks(fireworks) {
        this.fireworks = fireworks;
    }

    hasFireworks() {
        return this.fireworks;
    }
}
