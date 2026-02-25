import { ObjectId } from "../deps.ts";
import { Context } from "../deps.ts";
import { Institution } from "../models/institution.model.ts";
import { Payment } from "../models/payment.model.ts";
import { Settings } from "../models/settings.model.ts";

export async function PAYMENT_create({
    response,
    request,
    cookies,
    state,
}: Context) {
    const { institution_id, ammount_paid, student_number_agreement, due_date } =
        state.body ?? {};

    console.log(state.body);

    if (
        !institution_id ||
        !ammount_paid ||
        !student_number_agreement ||
        !due_date
    ) {
        response.status = 400;
        response.body = { msg: "Missing parameters" };
        return;
    }

    // Check if institution exists
    let temp_institution_id: ObjectId;
    try {
        temp_institution_id = new ObjectId(institution_id);
    } catch (error) {
        response.status = 400;
        response.body = { msg: "Invalid institution id" };
        return;
    }

    // Check if student number agreement is valid
    if (student_number_agreement.length < 1) {
        response.status = 400;
        response.body = { msg: "Invalid student number agreement" };
        return;
    }

    // Check if ammount paid is valid
    if (ammount_paid < 0) {
        response.status = 400;
        response.body = { msg: "Invalid ammount paid" };
        return;
    }

    // If cant convert due_date to date, send error
    if (isNaN(Date.parse(due_date))) {
        response.status = 400;
        response.body = { msg: "Invalid due date" };
        return;
    }

    // If amount paid cant be converted to number, send error
    if (isNaN(ammount_paid)) {
        response.status = 400;
        response.body = { msg: "Invalid ammount paid" };
        return;
    }

    // If student number agreement is not a number, send error
    if (isNaN(student_number_agreement)) {
        response.status = 400;
        response.body = { msg: "Invalid student number agreement. Must be a number" };
        return;
    }

    // Check if institution exists
    const institution = await Institution.findOne({ _id: temp_institution_id });

    if (!institution) {
        response.status = 404;
        response.body = { msg: "Institution not found" };
        return;
    }

    // Getting global student price
    const studet_price = await Settings.findOne({ key: "price_per_student" });

    // Craete payment
    const payment = Payment.insertOne({
        institution_id: temp_institution_id,
        paid_at: new Date(),
        due_date: new Date(due_date),
        ammount_paid: ammount_paid,
        student_number_agreement: student_number_agreement,
        value_per_student_when_performed: studet_price?.value ?? 0,
    });

    // If payment was not created, send error
    if (!payment) {
        response.status = 500;
        response.body = { msg: "Error creating payment" };
        return;
    }

    response.status = 200;
    response.body = { msg: "Payment created" };
}

export async function PAYMENT_get({
    response,
    request,
    cookies,
    state,
}: Context) {
    const institution_id = request.url.searchParams.get("institution_id") ?? "";
    const id = request.url?.searchParams?.get("id") ?? "";
    const search = request.url?.searchParams?.get("search") ?? "";
    const sort_by = request.url?.searchParams?.get("sort_by") ?? "";
    const sort = request.url?.searchParams?.get("sort") ?? "";
    const limit = request.url?.searchParams?.get("limit") ?? "";
    const page = request.url?.searchParams?.get("page") ?? "";

    const aggregationPipeline: any[] = [
        {
            $project: {
                institution_id: 1,
                paid_at: 1,
                due_date: 1,
                ammount_paid: state.user.role === "SUPERADMIN" ? 1 : 0,
                student_number_agreement: 1,
                value_per_student_when_performed: 1,
            },
        },
    ];

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


    const newAgregation: any = [{
        "$facet": {
            "data": aggregationPipeline,
            "total": [
                { "$count": "count" }
            ]
        }
        
    }]

    let temp_institution_id: ObjectId;

    if (institution_id !== "") {
        try {
            temp_institution_id = new ObjectId(institution_id);
        } catch (error) {
            response.status = 400;
            response.body = { msg: "Invalid institution id" };
            return;
        }
    }

    let temp_id: ObjectId;

    if (id !== "") {
        try {
            temp_id = new ObjectId(id);
        } catch (error) {
            response.status = 400;
            response.body = { msg: "Invalid institution id" };
            return;
        }
    }

    const payments = !temp_institution_id
        ? !temp_id  
            ? (await Payment.aggregate(newAgregation).toArray())[0]
            : {
                data: (await Payment.find({ institution_id: temp_institution_id, _id: temp_id }).toArray()).map((x) => {
                    return {...x, ammount_paid: state.user.role === "SUPERADMIN" ? x.ammount_paid : ""}
                }),
                total: [{ count: -1 }]
            }
        : {
            data: [...(await Payment.find({ institution_id: temp_institution_id }).toArray()).map((x) => {
                return {...x, ammount_paid: state.user.role === "SUPERADMIN" ? x.ammount_paid : ""}
            })],
            total: [{ count: -1 }]
        }

    if (!payments) {
        response.status = 404;
        response.body = { msg: "No payments found" };
        return;
    }

    response.status = 200;
    response.body = payments;
}

export async function PAYMENT_modify({
    response,
    request,
    cookies,
    state,
}: Context) {
    const { id, ammount_paid, student_number_agreement, due_date } =
        state.body ?? {};

    if (!id) {
        response.status = 400;
        response.body = { msg: "Missing parameters" };
        return;
    }

    let temp_id: ObjectId;

    try {
        temp_id = new ObjectId(id);
    } catch (error) {
        response.status = 400;
        response.body = { msg: "Invalid payment id" };
        return;
    }

    const payment = await Payment.findOne({ _id: temp_id });

    if (!payment) {
        response.status = 404;
        response.body = { msg: "Payment not found" };
        return;
    }

    if (ammount_paid) {
        if (isNaN(ammount_paid)) {
            response.status = 400;
            response.body = { msg: "Invalid ammount paid" };
            return;
        }

        payment.ammount_paid = ammount_paid;
    }

    if (student_number_agreement) {
        if (student_number_agreement.length < 1) {
            response.status = 400;
            response.body = { msg: "Invalid student number agreement" };
            return;
        }

        payment.student_number_agreement = student_number_agreement;
    }

    if (due_date) {
        if (isNaN(Date.parse(due_date))) {
            response.status = 400;
            response.body = { msg: "Invalid due date" };
            return;
        }

        payment.due_date = new Date(due_date);
    }

    const updated_payment = await Payment.updateOne(
        { _id: temp_id },
        {
            $set: {
                ammount_paid: payment.ammount_paid,
                student_number_agreement: payment.student_number_agreement,
                due_date: payment.due_date,
            },
        }
    );

    if (!updated_payment) {
        response.status = 500;
        response.body = { msg: "Error updating payment" };
        return;
    }

    response.status = 200;
    response.body = { msg: "Payment updated" };
}