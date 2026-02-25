import { Context } from "../deps.ts";
import { Next } from "../deps.ts";

export function require_user({request, response, state}: Context, next: Next){

    // console.log(state.user)

    if (!state.user){
        // console.log("Not authorized. Not user.")

        response.status = 401
        response.body = {msg: "Unauthorized"}
        return
    }

    console.log("Have user! Can continue.")
    return next()
}