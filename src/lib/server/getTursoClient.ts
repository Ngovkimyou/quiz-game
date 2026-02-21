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

const db = getTursoClient();

export async function getUserRanking() {
	return await db.execute('SELECT * FROM `quiz-ranking` WHERE score > 0 ORDER BY score DESC');
}

export async function UpdateUser(id: string, score: number) {
	if (Number(id) < 0 || score < 0) {
		throw new Error("you can't enter id or score < 0");
	}
	// const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
	// console.log("@TursoClient => CurrentTime: ", now)
	return await db.execute({
		sql: 'UPDATE `quiz-ranking` SET score = ? WHERE id = ?',
		args: [score, id]
	});
}
