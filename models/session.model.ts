import { ObjectId } from "../deps.ts";
import {db_connection} from "../utils/mongodb.utils.ts"

interface SessionSchema {
    _id: ObjectId;
    username: string;
    user_id: string;
    email: string;  
    valid: boolean;
}

export const Sessions = db_connection.collection<SessionSchema>("sessions");