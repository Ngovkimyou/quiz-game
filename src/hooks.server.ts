import { type Handle } from '@sveltejs/kit'
import { getTursoClient } from '$lib/server/getTursoClient'
import { getSessionCookieName, parseAndVerifySessionValue } from '$lib/server/session'

// This file right here will run every time a request is made to the server
// So you shouldn't put any heavy code here
export const handle: Handle = async ({ event, resolve }) => {
	const sessionCookieName = getSessionCookieName()
	const sessionToken = event.cookies.get(sessionCookieName)
	let session: Awaited<ReturnType<typeof parseAndVerifySessionValue>> = null

	try {
		session = await parseAndVerifySessionValue(sessionToken, event.platform?.env)
	} catch (error) {
		console.error('@handle => Session verification failed:', error)
	}
	const id = session?.id

	if (id) {
		try {
			const db = getTursoClient(event.platform?.env)

			const { rows } = await db.execute({
				sql: 'SELECT name,score,registered_date FROM `quiz-ranking` WHERE id = ?',
				args: [id],
			})
			const user = rows[0]

			if (user?.name) {
				event.locals.id = id
				event.locals.name = user.name?.toString()
				event.locals.score = user.score
				event.locals.registered_date = user.registered_date
			} else {
				event.cookies.delete(sessionCookieName, { path: '/' })
			}
		} catch (error) {
			console.error('@handle => Failed to read user from database:', error)
		}
	}

	return resolve(event)
}
