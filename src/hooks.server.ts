import { type Handle } from '@sveltejs/kit';
import { getTursoClient } from '$lib/server/getTursoClient';

// This file right here will run every time a request is made to the server
// So you shouldn't put any heavy code here
export const handle: Handle = async ({ event, resolve }) => {
	const name = event.cookies.get('name')?.toString();
	const id = event.cookies.get('id');

	if (name && id) {
		try {
			const db = getTursoClient(event.platform?.env);

			const { rows } = await db.execute({
				sql: 'SELECT name,score,registered_date FROM `quiz-ranking` WHERE id = ?',
				args: [id]
			});
			console.log('@handle => Database query result for user:', rows);

			event.locals.score = rows[0]?.score;
			event.locals.registered_date = rows[0]?.registered_date;
			event.locals.name = name;
			event.locals.id = id;
			console.log("@handle => User's name found in cookies:", name);
			console.log("@handle => User's id found in cookies:", id);
			console.log("@handle => User's score:", event.locals.score);
			console.log("@handle => User's registered date:", event.locals.registered_date);
		} catch (error) {
			console.error('@handle => Failed to read user from database:', error);
		}
	} else {
		console.error('No name found in cookies');
	}

	return resolve(event);
};
