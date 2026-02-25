import {db_connection} from "../utils/mongodb.utils.ts"
import { ObjectId } from "../deps.ts";

export interface SettingsSchema {
    _id?: ObjectId;
	key: string; // Unique Slug
	value: any;
	last_updated?: Date;
	last_updated_by_user?: ObjectId;
}

export const Settings = db_connection.collection<SettingsSchema>("settings");