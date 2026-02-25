import { create_session_handler, get_session_handler } from "../../../controllers/session.controller.ts";
import { delete_session_handler, check_session_handler } from "../../../controllers/session.controller.ts";
import { USER_create_by_key, USER_login } from "../../../controllers/user.controller.ts";
import { require_user } from "../../../middlewares/requiereUser.ts";
import { Router } from "../../../deps.ts";

const router = new Router();

router.put("/login", USER_login)
router.post("/register_with_key", USER_create_by_key)

// Session Handling
router.get("/session", require_user, get_session_handler)
router.post("/session", create_session_handler)
router.delete("/session", require_user, delete_session_handler)
router.get("/check_session", check_session_handler)

export { router as auth_router }