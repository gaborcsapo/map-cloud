const GCF_URL = "https://postcard-function-pjhdynrsyq-ue.a.run.app";

function getBackendURL(path) {
    return GCF_URL.concat(path);
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
            headers: {
                'Content-Type': 'text/plain;charset=UTF-8',
                "Access-Control-Allow-Origin": "*"
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
            'Content-Type': 'text/plain;charset=UTF-8',
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({"id": id, "data": data}),
    })
    .then((response) => response.json())
    .then((data) => {
        console.log(data);
        return data;
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}