import { getNumericDate } from "https://deno.land/x/djwt@v3.0.1/mod.ts";
import { bcrypt, Context, ObjectId } from "../deps.ts";
import { UserSchema, Users } from "../models/user.model.ts";
import { signJWT, verifyJWT } from "../utils/jwt.utils.ts";
import { Sessions } from "../models/session.model.ts";
import { Institution } from "../models/institution.model.ts";
import { Payment } from "../models/payment.model.ts";

export async function create_session_handler({
    request,
    response,
    cookies,
    state,
}: Context) {
    const { email, password } = state.body ?? {};

    const user = (await Users.findOne({ email })) as UserSchema;

    if (!user || !(await bcrypt.compare(password, user.password))) {
        response.status = 404;
        response.body = {
            message: "Invalid credentials",
        };
        return;
    }

    console.log("User", user)

    // If is student, check if the institution is still valid
    if (user?.role === "STUDENT") {
        const institution = await Institution.findOne({ _id: new ObjectId(user?.institution_user_data?.institution_id) })
        if (!institution) {
            response.status = 404;
            response.body = {
                message: "Institution not found",
            };
            return
        }

        if (institution.current_forced_state === "INACTIVE") {
            console.log("Institution is inactive")
            response.status = 403;
            response.body = {
                message: "Institution is inactive",
            };
            return
        }

        const payment = await Payment.findOne({ institution_id: new ObjectId(user.institution_user_data?.institution_id), due_date: { $gte: new Date() } })
        if (!payment && institution.current_forced_state !== "ACTIVE") {
            response.status = 403;
            response.body = {
                message: "Institution is inactive",
            };
            return
        }
    }

    console.log("User Id", user._id?.toString() ?? "");

    const session = await Sessions.insertOne({
        email: user.email,
        username: user.name,
        valid: true,
        user_id: user._id?.toString() ?? "",
    });

    // console.log(user)
    // console.log("Session!!!", session.toString())

    const access_token = await signJWT(
        {
            _id: session.toString(),
            email: user.email,
            username: user.name,
            user_id: user._id,
            role: user.role,
            institution_id: user.institution_user_data?.institution_id ?? "",
        },
        getNumericDate(60 * 15),
    ); // 15 minutos
    const refresh_token = await signJWT(
        { session_id: session.toString() },
        getNumericDate(60 * 60 * 24 * 365)
    );

    const accessTokenMaxAgeSeconds = 60 * 15;
    const refreshTokenMaxAgeSeconds = 60 * 60 * 24 * 365;

    response.headers.append(
        "Set-Cookie",
        `access_token=${access_token}; Path=/; Max-Age=${accessTokenMaxAgeSeconds}; HttpOnly; Secure; SameSite=None`,
    );
    response.headers.append(
        "Set-Cookie",
        `refresh_token=${refresh_token}; Path=/; Max-Age=${refreshTokenMaxAgeSeconds}; HttpOnly; Secure; SameSite=None`,
    );

    response.body = session;
    response.status = 200;
}

export function get_session_handler({ request, response, state }: Context) {
    // @ts-ignore: <>
    // console.log(state);
    // @ts-ignore: <>
    return (response.body = state["user"]);
}

export const delete_session_handler = async ({
    response,
    cookies,
    state,
}: Context) => {
    cookies.delete("access_token");
    cookies.delete("refresh_token");

    console.log("Session ID", state.user)

    const session = await Sessions.updateOne(
        {
            _id: new ObjectId(state.user._id),
        },
        {
            $set: {
                valid: false,
            },
        }
    ).catch((error) => {
        console.error(error);
        response.status = 500;
        response.body = {
            message: "Internal server error",
        };
        return;
    });
    response.status = 200;
    response.body = {
        message: "Session deleted",
    };
    return;
};

export async function check_session_handler({ request, response }: Context) {
    const session_id = request.url?.searchParams?.get("id") ?? ""

    if (!session_id) {
        response.status = 400
        response.body = { msg: "Bad request. session_id is missing" }
        return
    }

    let temp_id = new ObjectId()

    try {
        temp_id = new ObjectId(session_id)
    } catch (_error) {
        response.status = 400
        response.body = { msg: "Invalid session_id" }
        return
    }

    const session = await Sessions.findOne({ _id: temp_id })

    if (!session) {
        response.status = 404
        response.body = { msg: "Session not found" }
        return
    }

    response.status = 200
    return
}