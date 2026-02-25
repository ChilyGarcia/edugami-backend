import { Context } from "../../deps.ts";
import { Next } from "../../deps.ts";
import { Users } from "../../models/user.model.ts";

export function require_member({request, response, state}: Context, next: Next){

    if (state.user.role !== "SUPERADMIN" && state.user.role !== "ADMIN" && state.user.role !== "INSTITUTION_MODERATOR") {
        // console.log("Unauthorized")
        response.status = 403
        response.body = {msg: "Unauthorized"}
        return
    }


    if (state.user.role === "INSTITUTION_MODERATOR"){
        console.log("Checking institution_id")
        console.log(state?.body?.institution_id, request?.url?.searchParams?.get("institution_id") ?? "No institution_id on url")
        if (!state?.body?.institution_id && request?.url?.searchParams?.get("institution_id") === undefined && request?.url?.searchParams?.get("id") === undefined ){
            response.status = 403
            response.body = {msg: "Not institution_id on body request."}
            return
        }

        if (state?.body?.institution_id !== state.user.institution_id && request?.url?.searchParams.get("institution_id") !== state.user.institution_id && request.url.searchParams.get("id") !== state.user.institution_id){
            response.status = 403
            response.body = {msg: "Unauthorized"}
            return
        }
    }
    
    return next()
}