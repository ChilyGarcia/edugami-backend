import { USER_create, USER_create_many, USER_get, USER_modify_many, USER_modify } from "../../../controllers/user.controller.ts";
import { Router } from "../../../deps.ts";
import { deserialize_role } from "../../../middlewares/requierRole/deserializeRole.ts";
import { require_admin } from "../../../middlewares/requierRole/requireAdmin.ts";
import { require_member } from "../../../middlewares/requierRole/requireMember.ts";
import { require_user } from "../../../middlewares/requiereUser.ts";

const router = new Router();

// router.get("/", require_user, deserialize_role, require_admin, )
router.get("/", require_user, deserialize_role, require_member, USER_get)
router.post("/", require_user, deserialize_role, require_member, USER_create)
router.put("/", require_user, deserialize_role, require_member, USER_modify)

router.post("s/", require_user, deserialize_role, require_member, USER_create_many)
router.put("s/", require_user, deserialize_role, require_member, USER_modify_many)
// router.post("s/", require_user, deserialize_role, require_admin, )

export { router as user_router }