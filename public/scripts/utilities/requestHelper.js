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
        fetch(getBackendURL("/data/getjourney"), {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'content-type': 'text/plain;charset=UTF-8',
            },
            body: JSON.stringify({"id": id}),
        })
        .then((response) => response.text())
        .then((data) => {
            let parsedData = JSON.parse(data)
            console.log('Success:', parsedData);
            resolve(parsedData);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    });
}

export function createJourney(id, data) {
    return fetch(getBackendURL("/data/createjourney"), {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'content-type': 'text/plain;charset=UTF-8',
        },
        body: JSON.stringify({"id": id, "data": data}),
    })
    .then((response) => response.text())
    .then((data) => JSON.parse(data).id)
    .catch((error) => {
        console.error('Error:', error);
    });
}