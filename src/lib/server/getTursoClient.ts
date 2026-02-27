import { createClient } from '@libsql/client/web';

// All functions that is defined in the lib/server folder only run on the server.

// This function is used for connecting to TURSO database
export function getTursoClient(platformEnv?: App.Platform['env']) {
	const databaseUrl = platformEnv?.TURSO_DATABASE_URL ?? process.env.TURSO_DATABASE_URL;
	const authToken = platformEnv?.TURSO_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN;
	// Check if there's if the database exist or reached
	if (!databaseUrl || !authToken) {
		throw new Error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN environment variable');
	}
	return createClient({ url: databaseUrl, authToken });
}
// This function is used in the leaderboard page
export async function getUserRanking(platformEnv?: App.Platform['env']) {
	const db = getTursoClient(platformEnv);
	return await db.execute('SELECT * FROM `quiz-ranking` WHERE score > 0 ORDER BY score DESC');
}
