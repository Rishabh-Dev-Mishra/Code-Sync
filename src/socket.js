import { io } from "socket.io-client";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const initSocket = () => {
    return io(BACKEND_URL, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 3000,
    });
};


