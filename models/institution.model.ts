import { ObjectId } from "../deps.ts";
import {db_connection} from "../utils/mongodb.utils.ts"

type ForcedState = "INACTIVE" | "NOT_FORCED" | "ACTIVE";

interface InstitutionSchema {
	_id: ObjectId;
	name: string;
	email: string;
	phone: string;
	description: string;
	country: string;
    state: string;
	city: string;
	current_forced_state: ForcedState;
    created_at: Date;
    updated_at: Date;
}

export const Institution = db_connection.collection<InstitutionSchema>("institution");

await Institution.createIndexes({indexes: [
    {
        key: { "name": "text",
        "email": "text",
        "phone": "text",
        "description": "text",
        "country": "text",
        "state": "text",
        "city": "text"
         },
        name: "text_search_index",
        unique: false,
        weights: { "name": 2 }
    }
]});