import { Context, Next } from "../deps.ts";


export function require_target_user({request, response, state}: Context, next: Next){

    console.log(state.target_user)

    if (!state.target_user){
        // console.log("Not authorized. Not user.")

        response.status = 400
        response.body = {msg: "Not targetting any user."}
        return
    }

    // console.log("Have user! Can continue.")
    return next()
}