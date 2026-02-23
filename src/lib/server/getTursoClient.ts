import { createClient } from '@libsql/client';
import { env } from '$env/dynamic/private';

export function getTursoClient() {
	const databaseUrl = env.TURSO_DATABASE_URL;
	const authToken = env.TURSO_AUTH_TOKEN;
	// console.log("Database URL:", databaseUrl);
	// console.log("Auth Token:", authToken);
	if (!databaseUrl || !authToken) {
		throw new Error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN environment variable');
	}
	return createClient({ url: databaseUrl, authToken });
}



export async function getUserRanking() {
	const db = getTursoClient();
	return await db.execute('SELECT * FROM `quiz-ranking` WHERE score > 0 ORDER BY score DESC');
}

export async function UpdateUser(name: string, score: number) {
	const db = getTursoClient();
	if (name || score < 0) {
		throw new Error("You need to enter a Name or Score > 0");
	}

	return await db.execute({
		sql: 'UPDATE `quiz-ranking` SET score = ? WHERE name = ?',
		args: [score, name]
	});
}
