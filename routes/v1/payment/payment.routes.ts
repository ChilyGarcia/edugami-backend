import { PAYMENT_get, PAYMENT_create, PAYMENT_modify } from "../../../controllers/payment.controller.ts";
import { Router } from "../../../deps.ts";
import { require_user } from "../../../middlewares/requiereUser.ts";
import { deserialize_role } from "../../../middlewares/requierRole/deserializeRole.ts";
import { require_admin } from "../../../middlewares/requierRole/requireAdmin.ts";
import { require_super_admin } from "../../../middlewares/requierRole/requireSU.ts";

const router = new Router();

router.get("/", require_user, deserialize_role, require_admin, PAYMENT_get)
router.post("/", require_user, deserialize_role, require_admin, PAYMENT_create)
router.put("/", require_user, deserialize_role, require_super_admin, PAYMENT_modify)

export { router as payment_router }