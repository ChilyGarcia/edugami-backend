import { ObjectId } from "https://deno.land/x/web_bson@v0.3.0/mod.js";
import { Context } from "../../deps.ts";
import { Next } from "../../deps.ts";
import { Users } from "../../models/user.model.ts";

export async function deserialize_role({request, response, state}: Context, next: Next){

    const user_data = state.user.role ?? await Users.findOne({
        email: state.user.email ?? undefined, _id: state.user.id ? new ObjectId(state.user.id) : undefined
    })

    if (!user_data && !state.user.role){
        // console.log("Not user.")
        response.status = 403
        response.body = {msg: "Unauthorized"}
        return
    }

    console.log("Could deserialize user role. Can continue.")

    console.log(state.user.role)
    state.user.role = user_data?.role ? user_data.role : state.user.role

    return next()
}