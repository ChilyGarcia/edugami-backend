import { Router } from "../../deps.ts";
import { auth_router } from "./auth/auth.routes.ts";
import { user_router } from "./user/user.routes.ts";
import { admin_router } from "./admin/admin.routes.ts"
import { institution_router } from "./institution/institution.routes.ts";
import { payment_router } from "./payment/payment.routes.ts";

const router = new Router();

// User Authentication
router.use("/auth", auth_router.routes(), auth_router.allowedMethods())

// User
router.use("/user", user_router.routes(), user_router.allowedMethods())

// Institutions
router.use("/institution", institution_router.routes(), institution_router.allowedMethods())

// Payments
router.use("/payment", payment_router.routes(), payment_router.allowedMethods())

// Admins
router.use("/admin", admin_router.routes(), admin_router.allowedMethods())

// Payments


export {router as v1_router}