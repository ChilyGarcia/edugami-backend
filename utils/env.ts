import { config } from "https://deno.land/x/dotenv@v3.2.2/mod.ts";
await config({export: true});

export const MONGODB_URI = Deno.env.get("MONGODB_URI");

export const MASTER_REGISTER_KEY = Deno.env.get("MASTER_REGISTER_KEY") ?? "masterkey";

export const JWT_SECRET = Deno.env.get("JWT_SECRET") ?? "secret";