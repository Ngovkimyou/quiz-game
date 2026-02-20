import { redirect, type Handle } from '@sveltejs/kit';
import { getTursoClient } from "$lib/server/getTursoClient";

export const handle: Handle = async ({ event, resolve }) => {
	const name = event.cookies.get('name')?.toString();
    
	// If no cookie AND they aren't already going to /login, send them there
	if (!name && !event.url.pathname.startsWith('/login')) {
		throw redirect(303, '/login');
	}
    
    
    if (name) {
    const db = getTursoClient();

    const { rows } = await db.execute({
        sql: "SELECT score,registered_date FROM `quiz-ranking`WHERE name = ?",
        args: [name],
    });
    console.log("@handle => Database query result for user:", rows);
  
    event.locals.score =rows[0]?.score; 
    event.locals.registered_date = rows[0]?.registered_date;
    event.locals.name = name;
    console.log("@handle => User found in cookies:", name);
    console.log("@handle => User score:", event.locals.score);
    console.log("@handle => User registered date:", event.locals.registered_date);
    } else {
    console.error("No name found in cookies");
    };


	return resolve(event);
};