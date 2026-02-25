import { Server } from "../deps.ts";

export const io_consoles = new Server({
    pingInterval: 0,
    pingTimeout: 10000,
    connectTimeout: 200,
    cors: {
        origin: "*",
    },
});

io_consoles.on("connection", (socket) => {
    console.log("New console connected");

    socket.on("console_auth",(unique_name: string, api_key: string) => {
        console.log("Console to be authenticated")
    })

    socket.on("disconnect", () => {
        console.log("Console disconnected");
    });
});