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

	const id_cookies = locals.id?.toString();
	const name_cookies = locals.name;
	const { name, score } = await request.json();
	console.log('@update-score => Received data:', { name, score });
	//Trigger if there's no value in name or score type is different from number

	if (!name || typeof score !== 'number') {
		console.error('@update-score => Invalid data:', { name, score });
		return new Response(JSON.stringify({ error: 'Invalid data' }), { status: 400 });
	} else if (id_cookies && typeof score == 'number' && name_cookies) {
		await UpdateUser(db, id_cookies, name_cookies, score);
		return new Response(JSON.stringify({ success: true }), { status: 200 });
	} else {
		const result = await db.execute({
			sql: 'INSERT INTO `quiz-ranking` (name, score) VALUES (?, ?) RETURNING *',
			args: [name, score]
		});

		const id = result.rows[0].id?.toString();
		// Set the cookie so the Hook lets them through next time
		cookies.set('name', name, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			maxAge: 60 * 60 * 24 * 7 // 1 week
		});

		if (typeof id == 'string') {
			cookies.set('id', id, {
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				maxAge: 60 * 60 * 24 * 7 // 1 week
			});
		}

		console.log('@update-score => INSERT SUCESSFULLY INTO DATABASE: ', result);
		return new Response(JSON.stringify({ success: true }), { status: 200 });
	}
};

async function UpdateUser(
	db: ReturnType<typeof getTursoClient>,
	id: string,
	name: string,
	score: number
) {
	if (!id || score <= 0) {
		throw new Error('You need to enter a Score > 0');
	}

	await db.execute({
		sql: 'UPDATE `quiz-ranking` SET score = ? WHERE id = ?',
		args: [score, id]
	});

	console.log(
		`[@update-score(api)] User named: ${name} secussfully update their score to ${score}`
	);
}
