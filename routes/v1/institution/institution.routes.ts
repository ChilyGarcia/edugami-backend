import { INSTITUTION_create, INSTITUTION_modify, INSTITUTION_get } from "../../../controllers/institution.controller.ts";
import { Router } from "../../../deps.ts";
import { deserialize_role } from "../../../middlewares/requierRole/deserializeRole.ts";
import { require_admin } from "../../../middlewares/requierRole/requireAdmin.ts";
import { require_member } from "../../../middlewares/requierRole/requireMember.ts";
import { require_user } from "../../../middlewares/requiereUser.ts";

const router = new Router();

router.get("/", require_user, deserialize_role, require_member, INSTITUTION_get)
router.post("/", require_user, deserialize_role, require_admin, INSTITUTION_create)
router.put("/", require_user, deserialize_role, require_admin, INSTITUTION_modify)

export { router as institution_router }
// Institutions