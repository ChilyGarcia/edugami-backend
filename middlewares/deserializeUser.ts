import { Context, Next } from "../deps.ts";
import { verifyJWT } from "../utils/jwt.utils.ts";
import {Sessions} from "../models/session.model.ts"
import {signJWT} from "../utils/jwt.utils.ts"
import { getNumericDate } from "https://deno.land/x/djwt@v3.0.1/mod.ts";
import { MongoClient } from "../deps.ts";
import { ObjectId } from "../deps.ts";
import { Users } from "../models/user.model.ts";
import { Institution } from "../models/institution.model.ts";
import {Payment} from "../models/payment.model.ts"

/**
 * Middleware function to deserialize the user from the request context.
 * @param {Context} context - The request context object.
 * @param {Next} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the middleware is complete.
 */
export async function deserialize_user({request, response, cookies, state}: Context, next: Next) {

    const access_token = await cookies.get("access_token")
    const refresh_token = await cookies.get("refresh_token")


    if (!access_token) {
        // console.log("Don't have access token")
        return next()
    }

    const {payload, expired} = await verifyJWT(access_token ?? "")

    // For a valid access token
    if (payload){
        // @ts-ignore: <>
        state['user'] = {...payload.payload, valid: undefined}
        return next()
    }
    
    const {payload: refresh} = expired && refresh_token ? await verifyJWT(refresh_token) : {payload: null}
    console.log("Refresh", refresh)

    if(!refresh){
        return next()
    }

    console.log("Refresh", refresh)
    // @ts-ignore: <>
    console.log("Refresh Session ID", refresh.payload)
    // @ts-ignore: <>
    const session = await Sessions.findOne({_id: new ObjectId(refresh.payload.session_id as string ?? ""), valid: true})

    if (!session){
        console.log("No session found")
        return next()
    }

    const user = await Users.findOne({_id: new ObjectId(session.user_id)})

    // If is student, check if the institution is still valid
    if (user?.role === "STUDENT"){
        const institution = await Institution.findOne({_id: new ObjectId(user?.institution_user_data?.institution_id)})
        if (!institution){
            console.log("Institution not found")
            return next()
        }

        if (institution.current_forced_state === "INACTIVE"){
            console.log("Institution is inactive")
            return next()
        }

        const payment = await Payment.findOne({institution_id: new ObjectId(user.institution_user_data?.institution_id), due_date: {$gte: new Date()}})
        if (!payment && institution.current_forced_state !== "ACTIVE"){
            return next()
        }
    }

    const new_access_token = await signJWT({...session, role: user?.role, valid: undefined, institution_id: user?.institution_user_data?.institution_id}, getNumericDate(5))
    
    // TODO: If is student, check if the institution is still valid
    

    cookies.delete("access_token")
    cookies.set("access_token", new_access_token, {
        maxAge: 60 * 15 * 1000, // 15 minutos (coherente con la expiración del JWT)
        httpOnly: true,
        sameSite: "none",
        secure: true,
    })
    
    // @ts-ignore: <>
    state['user'] = {...session, role: user.role, id:undefined, valid: undefined, institution_id: user?.institution_user_data?.institution_id}

    return next()
}

export default deserialize_user