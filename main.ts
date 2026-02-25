import { Application, Router, Server, oakCors } from "./deps.ts";
import { index_router } from "./routes/router.ts";
import { MONGODB_URI } from "./utils/env.ts";
import deserialize_user from "./middlewares/deserializeUser.ts";
import deserialize_target_user from "./middlewares/deserializeTargetUser.ts";
import deserialize_body from "./middlewares/deserializeBody.ts";
import { io_consoles } from "./sockets/console.socket.ts";
import { init_settings } from "./utils/initSettings.utils.ts";
import { Cookies } from "https://deno.land/x/oak@v14.0.0/mod.ts";

const app = new Application();

// Socket.io for console handling.
io_consoles;
init_settings()

app.use(
    oakCors({
        origin: ["http://localhost:3000", "*", "https://pk06pj25-3000.use.devtunnels.ms", "https://edugami.aenstech.com"],
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "Origin", "X-Auth-Token"],
        credentials: true,
    })
);

app.use(deserialize_body);
app.use(deserialize_user);
app.use(deserialize_target_user);
app.use(index_router.routes());
app.use(index_router.allowedMethods());

await app
    .listen({ port: 3005 })
    .then(() => {
        console.log("Server running on port 3005");
    })
    .catch((err) => {
        console.log(err);
    });
