import { createClient } from "@libsql/client";
import { env } from "$env/dynamic/private";

export function getTursoClient() {
    const databaseUrl = env.TURSO_DATABASE_URL;
    const authToken = env.TURSO_AUTH_TOKEN;
    // console.log("Database URL:", databaseUrl);
    // console.log("Auth Token:", authToken);
    if (!databaseUrl || !authToken) {
        throw new Error(
        "Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN environment variable",
        );
    }
    return createClient({ url: databaseUrl, authToken });
}