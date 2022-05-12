import { Loader } from '@googlemaps/js-api-loader';

const apiOptions = {
    apiKey: MAPS_API_KEY
}
const loader = new Loader(apiOptions);

function displayMap() {
    const mapOptions = {
        center: { lat: -33.860664, lng: 151.208138 },
        zoom: 14
    };

    const mapDiv = document.getElementById('map');
    const map = new google.maps.Map(mapDiv, mapOptions);
    return map;
}

loader.load().then(() => {
    console.log('Maps JS API loaded');
    const map = displayMap();
});
