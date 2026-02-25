import { Router } from "../deps.ts";
import { auth_router } from "./v1/auth/auth.routes.ts";
import { user_router } from "./v1/user/user.routes.ts";
import { v1_router } from "./v1/v1.routes.ts";

const router = new Router();

// v1
router.use("/api/v1", v1_router.routes(), v1_router.allowedMethods())


export {router as index_router}