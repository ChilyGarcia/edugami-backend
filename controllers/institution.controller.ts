import {Context, ObjectId} from "../deps.ts"
import {Institution} from "../models/institution.model.ts"

export async function INSTITUTION_get ({
    request,
    response,
    cookies,
    state,
}: Context) {
    let institution_id = request.url?.searchParams?.get("id") ?? ""
    const search = request.url?.searchParams?.get("search") ?? "";
    const sort_by = request.url?.searchParams?.get("sort_by") ?? "";
    const sort = request.url?.searchParams?.get("sort") ?? "";
    const limit = request.url?.searchParams?.get("limit") ?? "";
    const page = request.url?.searchParams?.get("page") ?? "";

    const aggregationPipeline: any[] = [
        {
            $lookup: {
                from: "institution_payment",
                localField: "_id",
                foreignField: "institution_id",
                as: "institution_payments"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "institution_user_data.institution_id",
                as: "students"
            }
        },
        {
            $project: {
                name: 1,
                email: 1,
                phone: 1,
                description: 1,
                country: 1,
                state: 1,
                city: 1,
                current_forced_state: 1,
                institution_payments: "$institution_payments",
                students: "$students",
                student_count: { $size: "$students"}
            }
        }
    ];

    // Add search filter to the aggregation pipeline
    // if (search) {
    //     aggregationPipeline.push({
    //         $match: {
    //             $or: [
    //                 { name: { $regex: search, $options: "i" } },
    //                 { email: { $regex: search, $options: "i" } },
    //                 { phone: { $regex: search, $options: "i" } },
    //                 { description: { $regex: search, $options: "i" } },
    //                 { country: { $regex: search, $options: "i" } },
    //                 { state: { $regex: search, $options: "i" } },
    //                 { city: { $regex: search, $options: "i" } },
    //             ],
    //         },
    //     });
    // }

    // Add sorting to the aggregation pipeline
    console.log(sort_by, sort)
    console.log(sort === "asc" ? 1 : -1)
    console.log(sort_by, sort)
    if (sort_by && sort) {
        const sort_temp: any = {};
        sort_temp[sort_by] = sort === "asc" ? 1 : -1;
        aggregationPipeline.push({ $sort: sort_temp});
    }

    // Add pagination to the aggregation pipeline
    if (limit && page) {
        const skip = (parseInt(page) - 1) * parseInt(limit);
        aggregationPipeline.push({ $skip: skip });
        aggregationPipeline.push({ $limit: parseInt(limit) });
    }

    // Add additional filtering to the aggregation pipeline
    // console.log(filter_by, filter)
    if (institution_id) {
        const match: any = {};
        match["_id"] = new ObjectId(institution_id);
        aggregationPipeline.unshift({ $match: match });
    }

    console.log(aggregationPipeline)


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

    //@ts-ignore
    const insts: {
        data: any[],
        total: any[]
    } = (await Institution.aggregate(newAgregation).toArray())[0];

    console.log("insts", insts)

    // Rest of the code...

    if (!insts){
        response.status = 404
        response.body = {msg: "No institutions found."}
        return
    }

    // Hide sensitive data if user is not an admin
    if (state.user?.role !== "SUPERADMIN"){
        for (let i = 0; i < insts.data.length; i++){
            // @ts-ignore
            insts.data[i].institution_payments = [];
        }
    }

    // Check if is a valid institution
    for (let i = 0; i < insts.data.length; i++){
        // @ts-ignore
        for (let j = 0; j < insts.data[i].institution_payments.length; j++){
            // @ts-ignore
            console.log(insts.data[i].institution_payments[j].due_date)
            // @ts-ignore
            if (insts.data[i].institution_payments[j].due_date >= new Date()){
                // @ts-ignore
                insts.data[i].status_by_payment = "ACTIVE"
                break
            }
        }
        // @ts-ignore
        console.log(insts.data[i].status)

        // @ts-ignore
        if (!insts.data[i].status) insts.data[i].status_by_payment = "INACTIVE"
    }

    response.status = 200
    response.body = insts
}

export async function INSTITUTION_create({
    request,
    response,
    cookies,
    state,
}: Context) {
    const {
        name,
        email,
        phone,
        description,
        country,
        state: geo_state,
        city,
    } = state.body ?? {};

    if (!name || !email || !phone || !description || !country || !city || !geo_state) {
        response.status = 400;
        response.body = {
            message: "Bad request. Some fields are missing.",
        };
        return;
    }

    const new_institution = await Institution.insertOne({
        name,
        email,
        phone,
        description,
        country,
        city,
        state: geo_state,
        current_forced_state: "NOT_FORCED",
        created_at: new Date(),
        updated_at: new Date(),
    });

    response.status = 200;
    response.body = new_institution;
}

export async function INSTITUTION_modify({
    request,
    response,
    cookies,
    state,
}: Context) {
    const {
        institution_id,
        name,
        email,
        phone,
        description,
        country,
        state: geo_state,
        city,
    } = state.body ?? {};

    if (!institution_id || !name || !email || !phone || !description || !country || !city || !geo_state) {
        response.status = 400;
        response.body = {
            message: "Bad request. Some fields are missing.",
        };
        return;
    }

    try {
        new ObjectId(institution_id);
    } catch (error) {
        response.status = 400;
        response.body = {
            message: "Bad request. Invalid institution id.",
        };
        return;
    }

    const institution = await Institution.updateOne(
        { _id: new ObjectId(institution_id) },
        {
            $set: {
                name,
                email,
                phone,
                description,
                country,
                city,
                state: geo_state,
                updated_at: new Date(),
            },
        }
    );

    response.status = 200;
    response.body = institution;
}