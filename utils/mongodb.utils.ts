import { MongoClient } from "../deps.ts"
import { DB_USER } from "./env.ts";
import { DB_PASSWORD } from "./env.ts";
import { DB_CLUSTER_URL } from "./env.ts";
import { DB_NAME } from "./env.ts";
import { MONGODB_URI } from "./env.ts";

const client = new MongoClient()
console.log("LOGING MONGODB_URI")
// const db = await MongoClient.connect(MONGODB_URI ?? "")

console.log(MONGODB_URI)
const db = await client.connect(MONGODB_URI ?? "")

// const db = await client.connect({
//     db: DB_NAME!,
//     tls: true,
//     servers: [
//       {
//         host: DB_CLUSTER_URL!,
//         port: 27017,
//       },
//     ],
//     credential: {
//       username: DB_USER!,
//       password: DB_PASSWORD!,
//       db: DB_NAME,
//       mechanism: "SCRAM-SHA-1",
//     },
//   });

console.log(db)
export { db as db_connection };
