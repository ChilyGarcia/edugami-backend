import { jwt } from "../deps.ts";
import { JWT_SECRET } from "./env.ts";

export async function signJWT(payload: any, exp: number) {
    return await jwt.create(
        { alg: "HS512", typ: "JWT" },
        { payload, exp: exp, iat: Date.now() / 1000 },
        JWT_SECRET
    );
}

export async function verifyJWT(token: string) {
    try {
        // console.log(JWT_SECRET);
        const decoded = await jwt.verify(token, JWT_SECRET, "HS512");
        return { payload: decoded, expired: false };
    } catch (error) {
        return { payload: null, expired: error.message.includes("expired") };
    }
}
