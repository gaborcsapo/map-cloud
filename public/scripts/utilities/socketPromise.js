import { io } from "socket.io-client";

let socket = io({transports: [ "websocket" ]});

export function socketQuery(query, args) {
    return new Promise((resolve) => {
        socket.emit(query, args, (response) => {
            resolve(response);
        })
    });
}
