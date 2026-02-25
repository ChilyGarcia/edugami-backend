import {db_connection} from "../utils/mongodb.utils.ts"
import { ObjectId } from "../deps.ts"

interface InstitutionUserData {
	class_id: string; // EJ: 11B
	institution_id: ObjectId;
	doc_number?: number;
	doc_type?: DocType;
}

type DocType = "CC" | "TI" | "OTHER";

type Role = "SUPERADMIN" | "ADMIN" | "INSTITUTION_MODERATOR" | "STUDENT";

export interface UserSchema {
    _id?: ObjectId;
	email: string;
	password: string;
	name: string;
	last_name?: string;
	created_at: Date;
	last_modified_at: Date;
	role: Role;
	institution_user_data?: InstitutionUserData;
}

export const Users = db_connection.collection<UserSchema>("users");



await Users.createIndexes({indexes: [
    {
        key: { 
			"name": "text",
			"email": "text",
			"last_name": "text"
         },
        name: "text_search_index",
        unique: false,
        weights: { "name": 2 }
    }
]});