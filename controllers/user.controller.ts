import { ObjectId } from "https://deno.land/x/mongo@v0.32.0/mod.ts";
import { bcrypt } from "../deps.ts";
import { Context } from "../deps.ts";
import { UserSchema, Users } from "../models/user.model.ts";
import { Transactions } from "../models/transaction.model.ts";
import { Settings } from "../models/settings.model.ts";
import { MASTER_REGISTER_KEY } from "../utils/env.ts";
import { Institution } from "../models/institution.model.ts";
import { Payment } from "../models/payment.model.ts";

export const USER_create_by_key = async ({
    request,
    response,
    state,
}: Context) => {
    const { email, password, name, key } = state.body;

    if (key !== MASTER_REGISTER_KEY) {
        response.status = 403;
        response.body = {
            message: "Unauthorized",
        };
        return;
    }

    if (!email || !password || !name) {
        response.status = 400;
        response.body = {
            message: "Bad request",
        };
        return;
    }

    const user = await Users.findAndModify(
        { email },
        {
            upsert: true,
            new: true,
            update: {
                $setOnInsert: {
                    name,
                    email,
                    created_at: new Date(),
                    last_modified_at: new Date(),
                    password: await bcrypt.hash(password),
                    role: "SUPERADMIN",
                },
            },
        }
    );

    response.status = 200;
    response.body = {
        message: "User registered",
        data: user,
    };
};

export const USER_create = async ({ request, response, state }: Context) => {
    const {
        email,
        password,
        name,
        last_name,
        institution_user_data,
        institution_id,
    } = state.body ?? {};

    if (!email || !password || !name) {
        response.status = 400;
        response.body = {
            message: "Bad request",
        };
        return;
    }

    if (institution_user_data) {
        const user_checks = _student_checks(state.body, institution_id);

        if (user_checks.resp === false) {
            response.status = user_checks.status;
            response.body = {
                msg: user_checks.msg,
            };
            return;
        }

        let temp_institution_id: ObjectId;
        try {
            temp_institution_id = new ObjectId(institution_id);
        } catch (error) {
            response.status = 400;
            response.body = { msg: "Invalid institution id" };
            return;
        }

        // Check if institution exists
        const institution = await Institution.findOne({
            _id: temp_institution_id,
        });
        if (!institution) {
            response.status = 404;
            response.body = { msg: "Institution not found" };
            return;
        }

        // If user is not admin, check if institution can register students
        if (
            (state.user.role !== "SUPERADMIN" || state.user.role !== "ADMIN") &&
            (await _can_institution_register_students(temp_institution_id))
                .resp === false
        ) {
            response.status = 403;
            response.body = { msg: "Institution can't register students" };
            return;
        }
    }

    const user = await Users.findAndModify(
        {
            $or: [
                { email },
                {
                    // @ts-ignore
                    "institution_user_data.doc_number":
                        institution_user_data.doc_number ?? "",
                },
            ],
        },
        {
            upsert: true,
            new: true,
            update: {
                $setOnInsert: {
                    name,
                    email,
                    created_at: new Date(),
                    last_modified_at: new Date(),
                    password: await bcrypt.hash(password),
                    role: "STUDENT",
                    last_name,
                    institution_user_data: {
                        ...institution_user_data,
                        institution_id:
                            new ObjectId(institution_id) ?? undefined,
                    },
                },
            },
        }
    );

    response.status = 200;
    response.body = {
        message: "User registered",
        data: user,
    };
};

export const USER_create_many = async ({
    request,
    response,
    state,
}: Context) => {
    const { users, institution_id } = state.body ?? {};

    console.log("Users", users);

    if (!users || !Array.isArray(users)) {
        response.status = 400;
        response.body = {
            message: "Bad request, users not found",
        };
        return;
    }

    if (!institution_id) {
        response.status = 400;
        response.body = {
            message: "Bad request, institution_id not found",
        };
        return;
    }

    let temp_institution_id: ObjectId;
    try {
        temp_institution_id = new ObjectId(institution_id);
    } catch (error) {
        response.status = 400;
        response.body = { msg: "Invalid institution id" };
        return;
    }

    // Check if institution exists
    const institution = await Institution.findOne({
        _id: temp_institution_id,
    });

    if (!institution) {
        response.status = 404;
        response.body = { msg: "Institution not found" };
        return;
    }

    // If user is not admin, check if institution can register students
    if (state.user.role !== "SUPERADMIN" && state.user.role !== "ADMIN") {
        const temp_payment = await Payment.findOne({
            institution_id: temp_institution_id,
            due_date: { $gte: new Date() },
        });
        if (!temp_payment) {
            response.status = 403;
            response.body = { msg: "Institution can't register students" };
            return;
        }
    }

    if (!users) {
        response.status = 400;
        response.body = {
            message: "Users not found",
        };
        return;
    }

    if (
        !(await _can_institution_register_students(temp_institution_id)).resp &&
        state.user.role !== "SUPERADMIN" &&
        state.user.role !== "ADMIN"
    ) {
        response.status = 403;
        response.body = { msg: "Institution can't register studentss" };
        return;
    }

    if (_same_values_on_array(_get_request_user_doc_numbers(users).resp)) {
        response.status = 400;
        response.body = {
            message: "Some users have the same doc number",
            data: _get_request_user_doc_numbers(users).resp,
        };
        return;
    }

    console.log("Emails", _get_request_user_emails(users).resp);
    console.log(
        "Same emails",
        _same_values_on_array(_get_request_user_emails(users).resp)
    );
    if (_same_values_on_array(_get_request_user_emails(users).resp)) {
        response.status = 400;
        response.body = {
            message: "Some users have the same email",
            data: _get_request_user_emails(users).resp,
        };
        return;
    }

    const found_user_with_doc_number = await Users.findOne({
        // @ts-ignore
        "institution_user_data.doc_number": {
            $in: _get_request_user_doc_numbers(users).resp,
        },
    });
    console.log(_get_request_user_doc_numbers(users).resp);
    console.log("Found user with doc number", found_user_with_doc_number);

    if (found_user_with_doc_number) {
        response.status = 400;
        response.body = {
            message: "Some users have the same doc number",
            data: found_user_with_doc_number,
        };
        return;
    }

    const users_to_insert = [
        ...users.map((user: any) => {
            const user_checks = _student_checks(user, institution_id);

            response.status = 200;

            console.log("Checks", user, user_checks);

            if (user_checks.resp === false) {
                console.log(
                    "User checks failed",
                    user_checks.status,
                    user_checks.msg,
                    user
                );
                response.status = user_checks.status;
                response.body = {
                    msg: user_checks.msg,
                };

                // Pass to next iteration without inserting user or undefined
                return;
            }

            return {
                name: user.name,
                email: user.email,
                password: bcrypt.hashSync(user.password),
                role: "STUDENT",
                institution_user_data: {
                    ...user.institution_user_data,
                    institution_id: new ObjectId(institution_id),
                },
                created_at: new Date(),
                last_modified_at: new Date(),
            };
        }),
    ];

    if (response.status !== 200) {
        response.status = response.status;
        response.body = {
            message: "Some users have errors",
            data: users_to_insert,
        };
        return;
    }

    const inserted_users =
        (await Users.insertMany(users_to_insert as any), { ordered: false });

    console.log("Inserted users", inserted_users);

    response.status = 200;
    response.body = {
        message: "Users registered",
        data: inserted_users,
    };
    return;
};

export const USER_modify = async ({ request, response, state }: Context) => {
    const { name, last_name, email, role, institution_user_data } = state.body ?? {};

    if (!name && !last_name && !role && !email) {
        response.status = 400;
        response.body = {
            message: "Bad request",
        };
        return;
    }

    let temp_id: ObjectId;

    if (institution_user_data){
        if (!institution_user_data.institution_id){
            response.status = 400;
            response.body = {
                message: "Bad request. Tried to declare institution info on user, but not institution id found",
            };
            return;
        }

        const user_checks = _student_checks(state.body, institution_user_data.institution_id);

        if (user_checks.resp === false) {
            response.status = user_checks.status;
            response.body = {
                msg: user_checks.msg,
            };
            return;
        }

        try {
            temp_id = new ObjectId(institution_user_data.institution_id);
        } catch (error) {
            response.status = 400;
            response.body = { msg: "Invalid user id" };
            return;
        }
    }

    const user = await Users.findAndModify(
        { 
            $or: [
                {
                    email: email,
                },
                {
                    // @ts-ignore
                    "institution_user_data.doc_number":
                        institution_user_data ? institution_user_data.doc_number : undefined,
                },
            ]
         },
        {
            update: {
                $set: {
                    name,
                    last_name,
                    role: state.user.role === "SUPERADMIN" ? role : undefined,
                    institution_user_data,
                },
            },
            new: true,
        }
    );

    response.status = 200;
    response.body = {
        message: "User modified",
        data: user,
    };
};

export const USER_login = async ({ request, response, state }: Context) => {
    console.log(state.body);

    const { email, password } = state.body ?? {};

    console.log(email, password);

    const user = await Users.findOne({ email: email });

    if (!user) {
        response.status = 404;
        response.body = {
            message: "User not found",
        };
        return;
    }

    if (await bcrypt.compare(password, user.password)) {
        response.status = 200;
        response.body = {
            message: "User logged in",
            data: user,
        };
    } else {
        response.status = 404;
        response.body = {
            message: "Invalid password",
        };
    }
};

export const USER_force_password_change = async ({
    request,
    response,
    state,
}: Context) => {
    const { email } = state.target_user;

    console.log("Target user: ", email);

    const user = await Users.findAndModify(
        { email },
        {
            update: {
                $set: {
                    password:
                        "$2a$12$.e1i/FVyIsOQkXAEZ9CYT.wUGG5nMoaUcEiCQSeUuPWQKTMydgd6.",
                },
            },
            new: true,
        }
    );

    response.status = 200;
    response.body = {
        message: "Password updated, it's now '12345678'.",
        data: user,
    };
};

export const USER_list = async ({ request, response }: Context) => {
    const users = await Users.find();

    // console.log(users)

    response.status = 200;
    response.body = users;
    return;
};

export const USER_get = async ({ request, response, state }: Context) => {
    let institution_id = request.url?.searchParams?.get("institution_id") ?? "";
    let user_id = request.url?.searchParams?.get("user_id") ?? "";
    const search = request.url?.searchParams?.get("search") ?? "";
    const sort_by = request.url?.searchParams?.get("sort_by") ?? "";
    const sort = request.url?.searchParams?.get("sort") ?? "";
    const limit = request.url?.searchParams?.get("limit") ?? "";
    const page = request.url?.searchParams?.get("page") ?? "";

    const aggregationPipeline: any[] = [
        {
            $project: {
                _id: 1,
                email: 1,
                password: 1,
                name: 1,
                last_name: 1,
                created_at: 1,
                last_modified_at: 1,
                role: 1,
                institution_user_data: 1,
            },
        },
    ];

    // Add search filter to the aggregation pipeline
    
    // if (search) {
    //     aggregationPipeline.push({
    //         $match: {
    //             $or: [
    //                 { email: { $regex: search, $options: "i" } },
    //                 { name: { $regex: search, $options: "i" } },
    //                 { role: { $regex: search, $options: "i" } },
    //             ],
    //         },
    //     });
    // }

    // Add sorting to the aggregation pipeline
    console.log(sort_by, sort);
    console.log(sort === "asc" ? 1 : -1);
    console.log(sort_by, sort);
    if (sort_by && sort) {
        const sort_temp: any = {};
        sort_temp[sort_by] = sort === "asc" ? 1 : -1;
        aggregationPipeline.push({ $sort: sort_temp });
    }

    // Add pagination to the aggregation pipeline
    if (limit && page) {
        const skip = (parseInt(page) - 1) * parseInt(limit);
        aggregationPipeline.push({ $skip: skip });
        aggregationPipeline.push({ $limit: parseInt(limit) });
    }

    if (institution_id) {
        try {
            institution_id = new ObjectId(institution_id);
        } catch (error) {
            response.status = 400;
            response.body = { msg: "Invalid institution id" };
            return;
        }
    }

    if (user_id) {
        try {
            console.log(user_id);
            user_id = new ObjectId(user_id);
        } catch (error) {
            console.error(error);
            response.status = 400;
            response.body = { msg: "Invalid user id" };
            return;
        }
    }

    // Add additional filtering to the aggregation pipeline
    // console.log(filter_by, filter)
    if (institution_id || user_id) {
        const match: any = {};
        match["institution_user_data.institution_id"] = institution_id
            ? new ObjectId(institution_id)
            : undefined;
        match["_id"] = user_id ? new ObjectId(user_id) : undefined;
        aggregationPipeline.unshift({ $match: match });
    }
    
    const newAgregation: any = [{
        "$facet": {
            "data": aggregationPipeline,
            "total": [
                { "$count": "count" }
            ]
        }
        
    }]

    if (!institution_id && search) {
        // const match: any = {};
        newAgregation.unshift({ $match: { $text: { $search: search } } });
    }

    console.log(aggregationPipeline);

    const temp_users = await Users.aggregate(newAgregation).toArray();

    console.log("Temp users", temp_users);

    response.status = 200;
    response.body = temp_users[0];
    return;
};

export const USER_modify_many = async ({
    request,
    response,
    state,
}: Context) => {
    const { users } = state.body;

    if (!users || !Array.isArray(users)) {
        response.status = 400;
        response.body = {
            message: "Bad request, users not found",
        };
        return;
    }

    const users_to_insert = [
        ...users.map((user: any) => {
            if (!user.id) {
                response.status = 400;
                response.body = {
                    message: "Bad request, user id not found",
                };
                return;
            }

            let temp_id: ObjectId;
            try {
                temp_id = new ObjectId(user.id);
            } catch (error) {
                response.status = 400;
                response.body = { msg: "Invalid user id" };
                return;
            }

            return {
                updateOne: {
                    filter: { _id: temp_id },
                    update: {
                        $set: {
                            name: user.name,
                            last_name: user.last_name,
                            role: user.role,
                            institution_user_data: user.institution_user_data,
                        },
                    },
                },
            };
        }),
    ];

    if (response.status !== 200) {
        response.status = response.status;
        response.body = {
            message: "Some users have errors",
            data: users_to_insert,
        };
        return;
    }

    // @ts-ignore
    const inserted_users = await Users.bulkWrite(users_to_insert);

    response.status = 200;
    response.body = {
        message: "Users modified",
        data: inserted_users,
    };
    return;
};

const _is_institute_active = async (
    institution_id: ObjectId
): Promise<{
    resp: boolean;
    msg: string;
}> => {
    const institution = await Institution.findOne({ _id: institution_id });

    let active = {
        resp: true,
        msg: "Institution is active",
    };

    if (!institution) {
        active = {
            resp: false,
            msg: "Institution not found",
        };
    }

    const payment = await Payment.findOne({
        institution_id,
        due_date: { $gte: new Date() },
    });

    if (!payment) {
        active = {
            resp: false,
            msg: "Institution is inactive",
        };
    }

    if (institution?.current_forced_state === "INACTIVE") {
        active = {
            resp: false,
            msg: "Institution is inactive",
        };
    }

    if (institution?.current_forced_state === "ACTIVE") {
        active = {
            resp: true,
            msg: "Institution is active",
        };
    }

    return active;
};

const _get_amount_of_students = async (
    institution_id: ObjectId
): Promise<{
    current: number;
    limit: number;
    still_can_register: boolean;
}> => {
    // Using aggregation
    const students = await Users.aggregate([
        {
            $match: {
                "institution_user_data.institution_id": institution_id,
            },
        },
        {
            $count: "total",
        },
    ]).toArray();

    const payment = await Payment.findOne({
        institution_id,
        due_date: { $gte: new Date() },
    });

    return {
        // @ts-ignore
        current: students[0]?.total ?? 0,
        limit: payment?.student_number_agreement ?? 0,
        still_can_register:
            // @ts-ignore
            (students[0]?.total ?? 0) <
            (payment?.student_number_agreement ?? 0),
    };
};

const _can_institution_register_students = async (
    institution_id: ObjectId
): Promise<{
    resp: boolean;
    msg: string;
    status: number;
}> => {
    const payment = await Payment.findOne({
        institution_id,
        due_date: { $gte: new Date() },
    });

    if (!payment) {
        return {
            resp: false,
            msg: "Institution can't register students",
            status: 403,
        };
    }

    if (!(await _get_amount_of_students(institution_id)).still_can_register) {
        return {
            resp: false,
            msg: "Institution can't register more students",
            status: 403,
        };
    }

    return {
        resp: true,
        msg: "OK",
        status: 200,
    };
};

const _student_checks = (
    user: UserSchema,
    institution_id: string
): {
    resp: boolean;
    msg: string;
    status: number;
} => {
    if (!user?.institution_user_data || !institution_id) {
        console.error("No institution data");
        return {
            resp: false,
            msg: "Bad request",
            status: 400,
        };
    }

    if (!user.institution_user_data.class_id || !institution_id) {
        console.error("No class id or institution id");
        return {
            resp: false,
            msg: "Bad request",
            status: 400,
        };
    }

    if (
        user.institution_user_data.doc_type &&
        !["CC", "TI", "OTHER"].includes(user.institution_user_data.doc_type)
    ) {
        console.error("Wrong doc type");
        return {
            resp: false,
            msg: "Wrong doc type",
            status: 400,
        };
    }

    if (user.institution_user_data.doc_number) {
        // Check if can convert to number
        if (isNaN(user.institution_user_data.doc_number)) {
            console.error("Wrong doc number");
            return {
                resp: false,
                msg: "Wrong doc number",
                status: 400,
            };
        }

        user.institution_user_data.doc_number = Number(
            user.institution_user_data.doc_number
        );
    }

    return {
        resp: true,
        msg: "OK",
        status: 200,
    };
};

const _get_request_user_doc_numbers = (
    users: UserSchema[]
): {
    resp: number[];
    msg: string;
    status: number;
} => {
    const doc_numbers = users.map((user) => {
        if (!user.institution_user_data) {
            return;
        }

        // return strings as numbers
        return Number(user.institution_user_data.doc_number);
    });

    return {
        resp: doc_numbers as number[],
        msg: "OK",
        status: 200,
    };
};

const _get_request_user_emails = (
    users: UserSchema[]
): {
    resp: string[];
    msg: string;
    status: number;
} => {
    const emails = users.map((user) => user.email);

    return {
        resp: emails,
        msg: "OK",
        status: 200,
    };
};

const _same_values_on_array = (array: any[]): boolean => {
    const unique = new Set(array);

    return unique.size !== array.length;
};
