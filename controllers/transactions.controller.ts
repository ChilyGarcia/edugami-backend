import { Context, ObjectId } from "../deps.ts";
import { Transactions } from "../models/transaction.model.ts";

export const TRANSACTIONS_get_estimated_earnings = async ({ request, response, state }: Context) => {
    // const { commerce_id } = state.body ?? { commerce_id: undefined };

    // if (!commerce_id) {
    //     response.status = 400;
    //     response.body = {
    //         message: "Bad request. Commerce id not found.",
    //     };
    //     return;
    // }

    const totalCreditPrice = await (await Transactions.aggregate([
        {
          $match: {
            status: {
              $in: [
                "PAID_BY_COMMERCE",
                "NOT_PAID"
              ]
            },
          },
        },
        {
          $addFields: {
            total_costs: {
              $multiply: [
                "$credit_price_when_generated",
                "$credit_ammount",
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            total_credit_sum: {
              $sum: "$total_costs",
            },
            total_credit: {
              $sum: "$credit_ammount",
            },
            credit_price_average: {
                $avg: "$credit_price_when_generated",
            },
          },
        },
    ])).toArray();

    if (!totalCreditPrice) {
        response.status = 404;
        response.body = {
            message: "No transactions",
        };
        return;
    }

    if (totalCreditPrice.length === 0) {
        response.status = 404;
        response.body = {
            message: "No transactions",
        };
        return;
    }

    // @ts-ignore
    if (totalCreditPrice[0].total_credit_sum === undefined) {
        response.status = 404;
        response.body = {
            message: "No transactions",
        };
        return;
    }

    // @ts-ignore
    console.log("Total Credit Price: ", totalCreditPrice[0].total_credit_sum);

    response.status = 200;
    response.body = {
        // @ts-ignore
        sum: totalCreditPrice[0].total_credit_sum,
        // @ts-ignore
        credits: totalCreditPrice[0].total_credit,
        // @ts-ignore
        credit_price_average: totalCreditPrice[0].credit_price_average
    };
    return;
}

export const TRANSACTIONS_get_pending_earnings = async ({ request, response, state }: Context) => {
    // const { commerce_id } = state.body ?? { commerce_id: undefined };

    // if (!commerce_id) {
    //     response.status = 400;
    //     response.body = {
    //         message: "Bad request. Commerce id not found.",
    //     };
    //     return;
    // }

    const totalCreditPrice = await (await Transactions.aggregate([
        {
          $match: {
            status: "NOT_PAID",
          },
        },
        {
          $addFields: {
            total_costs: {
              $multiply: [
                "$credit_price_when_generated",
                "$credit_ammount",
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            total_credit_sum: {
              $sum: "$total_costs",
            },
            total_credit: {
              $sum: "$credit_ammount",
            },
            credit_price_average: {
                $avg: "$credit_price_when_generated",
            },
          },
        },
    ])).toArray();

    if (!totalCreditPrice) {
        response.status = 404;
        response.body = {
            message: "No transactions",
        };
        return;
    }

    if (totalCreditPrice.length === 0) {
        response.status = 404;
        response.body = {
            message: "No transactions",
        };
        return;
    }

    // @ts-ignore
    if (totalCreditPrice[0].total_credit_sum === undefined) {
        response.status = 404;
        response.body = {
            message: "No transactions",
        };
        return;
    }

    // @ts-ignore
    console.log("Total Credit Price: ", totalCreditPrice[0].total_credit_sum);

    response.status = 200;
    response.body = {
        // @ts-ignore
        sum: totalCreditPrice[0].total_credit_sum,
        // @ts-ignore
        credits: totalCreditPrice[0].total_credit,
        // @ts-ignore
        credit_price_average: totalCreditPrice[0].credit_price_average
    };
    return;
}

export const TRANSACTIONS_get_gifts = async ({ request, response, state }: Context) => {
    // const { commerce_id } = state.body ?? { commerce_id: undefined };

    // if (!commerce_id) {
    //     response.status = 400;
    //     response.body = {
    //         message: "Bad request. Commerce id not found.",
    //     };
    //     return;
    // }

    const totalCreditPrice = await (await Transactions.aggregate([
        {
          $match: {
            type: "GIFT",
          },
        },
        {
          $addFields: {
            total_costs: {
              $multiply: [
                "$credit_price_when_generated",
                "$credit_ammount",
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            total_credit_sum: {
              $sum: "$total_costs",
            },
            total_credit: {
              $sum: "$credit_ammount",
            },
            credit_price_average: {
                $avg: "$credit_price_when_generated",
            },
          },
        },
    ])).toArray();

    if (!totalCreditPrice) {
        response.status = 404;
        response.body = {
            message: "No transactions",
        };
        return;
    }

    if (totalCreditPrice.length === 0) {
        response.status = 404;
        response.body = {
            message: "No transactions",
        };
        return;
    }

    // @ts-ignore
    if (totalCreditPrice[0].total_credit_sum === undefined) {
        response.status = 404;
        response.body = {
            message: "No transactions",
        };
        return;
    }

    // @ts-ignore
    console.log("Total Credit Price: ", totalCreditPrice[0].total_credit_sum);

    response.status = 200;
    response.body = {
        // @ts-ignore
        sum: totalCreditPrice[0].total_credit_sum,
        // @ts-ignore
        credits: totalCreditPrice[0].total_credit,
        // @ts-ignore
        credit_price_average: totalCreditPrice[0].credit_price_average
    };
    return;
}