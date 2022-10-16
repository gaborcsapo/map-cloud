import { io } from "socket.io-client";

let socket = io();

export function socketQuery(query, args) {
    return new Promise((resolve) => {
        socket.emit(query, args, (response) => {
            resolve(response);
        })
    });
}
