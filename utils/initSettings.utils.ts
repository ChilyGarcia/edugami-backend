import { Institution } from "../models/institution.model.ts";
import { SettingsSchema } from "../models/settings.model.ts";
import { Settings } from "../models/settings.model.ts";
import { db_connection } from "./mongodb.utils.ts";

const insert_settig = async (
    setting: SettingsSchema) => {
    db_connection

    if (!db_connection){
        throw new Error("DB not connected")
    }
    
    const set = await Settings.findAndModify(
        { key: setting.key},
        {
            upsert: true,
            new: true,
            update: {
                $setOnInsert: {
                    key: setting.key,
                    value: setting.value,
                    last_updated: new Date(),
                }
            }
        },
    );

    if (set) {
        return set
    }

    return null
}

export const init_settings = async () => {

    console.log("Initializing settings")
    
    const settings: SettingsSchema[] = [
        {
            key: "price_per_student",
            value: 50000,
        },
        {
            key: "allow_user_registration",
            value: true,
        },
        {
            key: "maintenance_mode",
            value: false,
        }
    ]

    for (const setting of settings) {
        await insert_settig(setting)
    }

    // await index_fields()
}

// const index_fields = async () => {
//     await Institution.createIndexes({
//         indexes: [
//             { key: {"name": "text"}, name: "name_text" }
//         ]
//     });
// }