import { getTursoClient } from '$lib/server/getTursoClient';
// This import will take care of all the types problem
import type { RequestHandler } from './$types';
export const POST: RequestHandler = async ({ request, cookies, locals }) => {
	let db: ReturnType<typeof getTursoClient>;
	try {
		// Create the DB client lazily so missing env vars don't crash module initialization.
		db = getTursoClient();
	} catch (error) {
		console.error('@update-score => Database client initialization failed:', error);
		return new Response(JSON.stringify({ error: 'Server database is not configured' }), {
			status: 500
		});
	}

	try {
		const id_cookies = locals.id?.toString();
		const name_cookies = locals.name;
		const { name, score } = await request.json();
		console.log('@update-score => Received data:', { name, score });

		if (!name || typeof score !== 'number' || !Number.isFinite(score) || score < 0) {
			console.error('@update-score => Invalid data:', { name, score });
			return new Response(JSON.stringify({ error: 'Invalid data' }), { status: 400 });
		}

		if (id_cookies && name_cookies) {
			await updateUser(db, id_cookies, name_cookies, score);
			return new Response(JSON.stringify({ success: true, mode: 'update' }), { status: 200 });
		}

		const result = await db.execute({
			sql: 'INSERT INTO `quiz-ranking` (name, score) VALUES (?, ?) RETURNING id',
			args: [name, score]
		});

		const id = result.rows[0]?.id?.toString();
		cookies.set('name', name, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			maxAge: 60 * 60 * 24 * 7
		});

		if (id) {
			cookies.set('id', id, {
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				maxAge: 60 * 60 * 24 * 7
			});
		}

		console.log('@update-score => INSERT SUCCESSFULLY INTO DATABASE');
		return new Response(JSON.stringify({ success: true, mode: 'insert', id }), { status: 200 });
	} catch (error) {
		console.error('@update-score => Unexpected server error:', error);
		const message = error instanceof Error ? error.message : 'Unknown server error';
		return new Response(JSON.stringify({ error: message }), { status: 500 });
	}
};

async function updateUser(
	db: ReturnType<typeof getTursoClient>,
	id: string,
	name: string,
	score: number
) {
	if (!id || score < 0) {
		throw new Error('You need to enter a score >= 0');
	}

	await db.execute({
		sql: 'UPDATE `quiz-ranking` SET score = ? WHERE id = ?',
		args: [score, id]
	});

	console.log(
		`[@update-score(api)] User named: ${name} secussfully update their score to ${score}`
	);
}
