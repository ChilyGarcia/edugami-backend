import { Next } from "../deps.ts";
import { Context } from "../deps.ts";

export default async function deserialize_target_user({request, response, cookies, state}: Context, next: Next) {
    const target_user_email = request.method === "GET" ? request.url.searchParams.get("target_user_email") : state?.body?.target_user_email
    const target_user_id = request.method === "GET" ? request.url.searchParams.get("target_user_id") : state?.body?.target_user_id

    if (!target_user_email && !target_user_id) {
        return next()
    }

    state.target_user = {
        email: target_user_email,
        id: target_user_id
    }

    console.log("state.target_user: ", state.target_user)

    return next()
}