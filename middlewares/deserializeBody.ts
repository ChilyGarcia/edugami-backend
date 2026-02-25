import { Context, Next } from "../deps.ts";

export default async function deserialize_body({request, response, cookies, state}: Context, next: Next) {

    console.log("hasBody: ", request.body.has)

    if (request.method === "GET" || !request.hasBody) {
        return next()
    }

    let body: any
    try {
        body = await request.body.json()
        console.log("body: ", body)
    } catch (error) {
        console.log("Error: ", error)
        return next()
    }

    state.body = {}
    
    // For each element in the body, put it on the state
    Object.keys(body).forEach((key) => {
        state.body[key] = body[key]
    })

    console.log("state.body: ", state.body)

    return next()
}