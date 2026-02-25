import { Context } from "../../deps.ts";
import { Next } from "../../deps.ts";
import { Users } from "../../models/user.model.ts";

export function require_comerce({request, response, state}: Context, next: Next){

    if (state.user.role !== "COMMERCE" && state.user.role !== "ADMIN" && state.user.role !== "SUPER_USER") {
        // console.log("Unauthorized")
        response.status = 403
        response.body = {msg: "Unauthorized"}
        return
    }
    
    return next()
}