export function queryJourneyData(id) {
    return new Promise((resolve) => {
        fetch("/data/getjourney", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
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

export function createJourney(data) {
    return fetch("/data/createjourney", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({"data": data}),
    })
    .then((response) => response.json())
    .then((data) => data.id)
    .catch((error) => {
        console.error('Error:', error);
    });
}