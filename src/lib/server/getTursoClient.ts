import { createClient } from '@libsql/client/web'
import { env } from '$env/dynamic/private'

// Connecting to TURSO database
// Check if the environment variables are set, if not it will throw an error.
export function getTursoClient(platformEnv?: App.Platform['env']): ReturnType<typeof createClient> {
	const databaseUrl = platformEnv?.TURSO_DATABASE_URL ?? env.TURSO_DATABASE_URL
	const authToken = platformEnv?.TURSO_AUTH_TOKEN ?? env.TURSO_AUTH_TOKEN
	// Check if database exist
	if (!databaseUrl || !authToken) {
		throw new Error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN environment variable')
	}
	return createClient({ url: databaseUrl, authToken })
}
// This function is used in the leaderboard page
export async function getUserRanking(
	platformEnv?: App.Platform['env'],
): Promise<Awaited<ReturnType<ReturnType<typeof createClient>['execute']>>> {
	const db = getTursoClient(platformEnv)
	return await db.execute('SELECT * FROM `quiz-ranking` WHERE score > 0 ORDER BY score DESC')
}
