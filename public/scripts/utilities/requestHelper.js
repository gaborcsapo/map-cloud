import DemoJourney from "../../resources/journeys/demo.js";
const GCF_URL = "https://postcard-function-pjhdynrsyq-ue.a.run.app";

function getBackendURL(path) {
    if (window.location.origin == 'http://localhost:8080') {
        return path
    } else {
        return GCF_URL.concat(path)
    }
}

export function queryJourneyData(id) {
    return new Promise((resolve) => {
        if (id == "demo") {
            resolve(DemoJourney);
            return;
        }

        fetch(getBackendURL("/data/getjourney"), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({"id": id}),
        })
        .then((response) => response.json())
        .then((data) => {
            console.log('Success:', data);
            resolve(data);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    });
}

export function createJourney(id, data) {
    return fetch(getBackendURL("/data/createjourney"), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({"id": id, "data": data}),
    })
    .then((response) => response.json())
    .then((data) => data.id)
    .catch((error) => {
        console.error('Error:', error);
    });
}