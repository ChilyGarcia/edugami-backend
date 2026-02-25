import { Router } from "../../../deps.ts";

import { USER_list, USER_get } from "../../../controllers/user.controller.ts";
import { require_user } from "../../../middlewares/requiereUser.ts";
import { deserialize_role } from "../../../middlewares/requierRole/deserializeRole.ts";
import { require_admin } from "../../../middlewares/requierRole/requireAdmin.ts";
import { require_target_user } from "../../../middlewares/requireTargetUser.ts";
import { USER_force_password_change } from "../../../controllers/user.controller.ts";
import { INSTITUTION_get, INSTITUTION_create } from "../../../controllers/institution.controller.ts";
import { PAYMENT_create } from "../../../controllers/payment.controller.ts";

const router = new Router();

// User Data
router.get("/users", require_user, deserialize_role, require_admin, USER_list)
router.get("/user", require_user, require_target_user, deserialize_role, require_admin, USER_get)
router.put("/force-password", require_user, require_target_user, deserialize_role, require_admin, USER_force_password_change)

// Institutions
router.get("/institutions", require_user, deserialize_role, require_admin, INSTITUTION_get)
router.post("/institution", require_user, deserialize_role, require_admin, INSTITUTION_create)

// Payments
router.post("/payment", require_user, deserialize_role, require_admin, PAYMENT_create)

// // Credits
// router.put("/credit", require_user, require_target_user, deserialize_role, require_comerce, USER_update_credit)

// // Stats
// router.get("/stats/earnings", require_user, deserialize_role, require_admin, TRANSACTIONS_get_estimated_earnings)
// router.get("/stats/pending", require_user, deserialize_role, require_admin, TRANSACTIONS_get_pending_earnings)
// router.get("/stats/gifts", require_user, deserialize_role, require_admin, TRANSACTIONS_get_gifts)

// // Commerces Data Management
// router.put("/commerces/transactions", require_user, deserialize_role, require_admin, COMMERCE_confirm_transaction_payment)

// router.get("/commerces/transactions", require_user, deserialize_role, require_comerce, COMMERCE_get_all_transactions)
// router.get("/commerces/transactions/pending", require_user, deserialize_role, require_comerce, COMMERCE_get_pending_credits)

export { router as admin_router }