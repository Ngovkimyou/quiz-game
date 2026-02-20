import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { nanoid } from 'nanoid';
import { getTursoClient } from "$lib/server/getTursoClient";
import { type Client } from '@libsql/client';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString();
        console.log("@login => Received name:", name);
		if (!name) {
			return fail(400, { name, missing: true });
		}

		// 1. Create user in your Database (Logic depends on your DB)
		// const newUser = await db.user.create({ data: { email } });
        const db: Client = getTursoClient();
        // Over here might be the casue of the error, since I've changed the field name to "Total_Click"
        const result = await db.execute({
            sql: "INSERT INTO `quiz-ranking` (name, score) VALUES (?, 0) RETURNING *",
            args: [name]
        });
        const id = result.rows[0]?.id?.toString();
        console.log("@login => Database insert result:", result);
       
		// 2. Set the cookie so the Hook lets them through next time
		cookies.set('name' , name, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			maxAge: 60 * 60 * 2 // 2 hours
		});
        
        if (typeof id === 'string') {
            cookies.set('id' , id, {
                path: '/',
                httpOnly: true,
                sameSite: 'strict',
                maxAge: 60 * 60 * 2 // 2 hours
            });
        }

		// 3. Send them to the homepage
		throw redirect(303, '/');
	}
};