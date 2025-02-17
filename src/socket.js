import { io } from "socket.io-client";

export const initSocket = () => {
    return io("http://localhost:5000", {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 3000,
    });
};


