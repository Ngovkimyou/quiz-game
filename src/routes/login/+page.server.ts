import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
// import { nanoid } from 'nanoid';
import { getTursoClient } from '$lib/server/getTursoClient';
import { type Client } from '@libsql/client';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString();
		console.log('@login => Received name:', name);
		if (!name) {
			return fail(400, { name, missing: true, tooLong: false });
		} else if (name.length > 21) {
			return fail(400, { name, missing: false, tooLong: true });
		}

		const db: Client = getTursoClient();
		// Create a new user in db when player type their name
		const result = await db.execute({
			sql: 'INSERT INTO `quiz-ranking` (name, score) VALUES (?, 0) RETURNING *',
			args: [name]
		});
		const id = result.rows[0]?.id?.toString();
		console.log('@login => Database insert result:', result);

		// Set the cookie so the Hook lets them through next time
		cookies.set('name', name, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			maxAge: 60 * 60 * 5 // 2 hours
		});

		// Record the player id in the cookie to identify them
		if (typeof id === 'string') {
			cookies.set('id', id, {
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				maxAge: 60 * 60 * 5 // 2 hours
			});
		}

		// Send them to the homepage
		throw redirect(303, '/');
	}
};
