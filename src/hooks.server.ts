import { type Handle } from '@sveltejs/kit'
import { getTursoClient } from '$lib/server/getTursoClient'
import {
	getSessionCookieName,
	parseAndVerifySessionValue,
	createSignedSessionValue,
	getSessionTtlSeconds,
} from '$lib/server/session'
import { isRateLimited } from '$lib/server/RateLimiter'
// This file right here will run every time a request is made to the server
// So you shouldn't put any heavy code here
export const handle: Handle = async ({ event, resolve }) => {
	const sessionCookieName = getSessionCookieName()
	const sessionToken = event.cookies.get(sessionCookieName)
	console.log('ip_address function in hook: ', event.getClientAddress())
	let session: Awaited<ReturnType<typeof parseAndVerifySessionValue>>

	try {
		session = await parseAndVerifySessionValue(sessionToken, event.platform?.env)
		console.log('request payload => : ', event.request)
		if (session) {
			const id = session?.id
			const session_ip = session?.ip_address
			console.log('@Handle => session_ip found: ', session_ip)
			const count = session?.count
			const request_time = session?.request_time
			const client_ip = event.getClientAddress()
			console.log('@Handle => client_ip found: ', client_ip)
			console.log('@Handle => request_time: ', request_time)
			console.log('@Handle => count: ', count)
			const isClient = isRateLimited(client_ip, count, session_ip, request_time)
			if (isClient?.over_Limit) {
				return new Response('Too Many Request! Pls wait for a while', {
					status: 429,
					headers: {
						'Retry-After': '60', // Wait 60 seconds
					},
				})
			} else {
				if (id) {
					const token = await createSignedSessionValue(
						id,
						event.platform?.env,
						getSessionTtlSeconds(),
						client_ip,
						isClient?.isExist?.resetAt,
						isClient?.isExist?.count,
					)
					event.cookies.set(getSessionCookieName(), token, {
						path: '/',
						httpOnly: true,
						sameSite: 'strict',
						// secure: isHttps,
						maxAge: getSessionTtlSeconds(),
					})
				}
			}
			if (id) {
				try {
					const db = getTursoClient(event.platform?.env)

					const { rows } = await db.execute({
						sql: 'SELECT name,score,registered_date FROM `quiz-ranking` WHERE id = ?',
						args: [id],
					})
					const user = rows[0]

					if (user?.['name']) {
						event.locals.id = id
						event.locals.name = user['name']?.toString()
						event.locals.score = user['score']
						event.locals.registered_date = user['registered_date']
						event.locals.ip_address = client_ip
					} else {
						event.cookies.delete(sessionCookieName, { path: '/' })
					}
				} catch (error) {
					console.error('@handle => Failed to read user from database:', error)
				}
			}
		}
	} catch (error) {
		console.error('@handle => Session verification failed:', error)
	}

	return resolve(event)
}
