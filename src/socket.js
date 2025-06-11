import { io } from "socket.io-client";

export const initSocket = () => {
    return io("https://codesync-backend-7pna.onrender.com", {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 3000,
    });
};


