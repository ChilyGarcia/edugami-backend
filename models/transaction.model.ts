import {db_connection} from "../utils/mongodb.utils.ts"
import { ObjectId } from "../deps.ts";

interface TransactionSchema {
    _id?: ObjectId;
    type: "GAME_COST" | "GAME_REWARD" | "GIFT" | "REVOKE_BY_ADMIN" | "CREDIT_GIVEN_BY_COMMERCE";
    status: "NOT_PAID" | "PAID_BY_COMMERCE" | "REVOKED" | "GIFT";
    generated_by_entity_of_type: "USER" | "CONSOLE"
    generated_by_entity_with_id: ObjectId;
    target_user_id: ObjectId;
    description: string;
    credit_amount: number;
    credit_price_when_generated: number;
    date: Date;
}

export const Transactions = await db_connection.collection<TransactionSchema>("transactions");