import { Context } from "../deps.ts";
import { Transactions } from "../models/transaction.model.ts";
import { ObjectId } from "../deps.ts";

export const COMMERCE_get_all_transactions = async ({
    request,
    response,
    state,
}: Context) => {
    const { commerce_id } = state.body ?? {
        commerce_id: request.url.searchParams.get("commerce_id"),
    };

    console.log("Commerce ID: ", commerce_id);

    // if (!commerce_id) {
    //     response.status = 400;
    //     response.body = {
    //         message: "Commerce ID not found"
    //     };
    //     return
    // }

    // Check if the user is the commerce
    // If it is a commerce, check if the commerce_id is the same as the user id, so it can only see its own transactions
    if (state.user.role === "COMMERCE" && state.user.user_id !== commerce_id) {
        response.status = 403;
        response.body = {
            message: "Unauthorized",
        };
        return;
    }

    const transactions = await (
        await Transactions.aggregate([
            {
                $match: {
                    generated_by_entity_with_id: commerce_id
                        ? new ObjectId(commerce_id)
                        : undefined,
                    generated_by_entity_of_type: "USER",
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "generated_by_entity_with_id",
                    foreignField: "_id",
                    as: "generated_by_entity",
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "target_user_id",
                    foreignField: "_id",
                    as: "target_user",
                },
            },
            {
                $unwind: "$generated_by_entity",
            },
            {
                $unwind: "$target_user",
            },
            {
                $project: {
                    "generated_by_user.password": 0,
                    "target_user.password": 0,
                },
            },
        ])
    ).toArray();

    if (!transactions) {
        response.status = 404;
        response.body = {
            message: "No transactions",
        };
        return;
    }

    console.log("Transactions: ", transactions);

    response.status = 200;
    response.body = transactions;
    return;
};

export const COMMERCE_get_pending_credits = async ({
    request,
    response,
    state,
}: Context) => {
    const { commerce_id } = state.body ?? {
        commerce_id: request.url.searchParams.get("commerce_id"),
    };

    console.log("Commerce ID: ", commerce_id);

    // if (!commerce_id) {
    //     response.status = 400;
    //     response.body = {
    //         message: "Commerce ID not found"
    //     };
    //     return
    // }

    // Check if the user is the commerce
    // If it is a commerce, check if the commerce_id is the same as the user id, so it can only see its own pending transactions
    if (state.user.role === "COMMERCE" && state.user.user_id !== commerce_id) {
        response.status = 403;
        response.body = {
            message: "Unauthorized",
        };
        return;
    }

    const transactions = await (
        await Transactions.aggregate([
            {
                $match: {
                    generated_by_entity_with_id: commerce_id
                        ? new ObjectId(commerce_id)
                        : undefined,
                    status: "NOT_PAID",
                    generated_by_entity_of_type: "USER",
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "generated_by_entity_with_id",
                    foreignField: "_id",
                    as: "generated_by_entity",
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "target_user_id",
                    foreignField: "_id",
                    as: "target_user",
                },
            },
            {
                $unwind: "$generated_by_entity",
            },
            {
                $unwind: "$target_user",
            },
            {
                $project: {
                    "generated_by_user.password": 0,
                    "target_user.password": 0,
                },
            },
        ])
    ).toArray();

    if (!transactions) {
        response.status = 404;
        response.body = {
            message: "No pending transactions",
        };
        return;
    }

    console.log("Transactions: ", transactions);

    response.status = 200;
    response.body = transactions;
    return;
};

export const COMMERCE_confirm_transaction_payment = async ({
    request,
    response,
    state,
}: Context) => {
    const { transaction_ids } = state.body ?? {
        transaction_id: request.url.searchParams.get("transaction_id"),
    };

    console.log("Transaction ID: ", transaction_ids);

    if (!transaction_ids) {
        response.status = 400;
        response.body = {
            message: "Transaction ID not found",
        };
        return;
    }

    const temp = transaction_ids.map((v: string) => {
        return new ObjectId(v);
    });

    console.log("Temp: ", temp);

    const updated_transaction = await Transactions.updateMany(
        {
            _id: {
                $in: temp,
            },
            status: "NOT_PAID",
        },
        {
            $set: {
                status: "PAID_BY_COMMERCE",
            },
        },
        {
            upsert: false,
        }
    );

    if (!updated_transaction) {
        response.status = 404;
        response.body = {
            message: "Transaction not found or already paid",
        };
        return;
    }

    console.log("Updated transaction: ", updated_transaction);

    const transactions = await (
        await Transactions.aggregate([
            {
                $match: {
                    _id: {
                        $in: temp,
                    },
                    generated_by_entity_of_type: "USER",
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "generated_by_user_with_id",
                    foreignField: "_id",
                    as: "generated_by_user",
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "target_user_id",
                    foreignField: "_id",
                    as: "target_user",
                },
            },
            {
                $unwind: "$generated_by_user",
            },
            {
                $unwind: "$target_user",
            },
            {
                $project: {
                    "generated_by_user.password": 0,
                    "target_user.password": 0,
                },
            },
        ])
    ).toArray();

    if (!updated_transaction) {
        response.status = 404;
        response.body = {
            message: "Transaction not found or already paid",
        };
        return;
    }

    console.log("Updated transaction: ", transactions);

    response.status = 200;
    response.body = transactions;
    return;
};
