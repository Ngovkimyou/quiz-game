import { getTursoClient } from '$lib/server/getTursoClient'
import {
	createSignedSessionValue,
	getSessionCookieName,
	getSessionTtlSeconds,
} from '$lib/server/session'
// This import will take care of all the types problem
import type { RequestHandler } from './$types'
import {
	isValidScore,
	normalizeName,
	NAME_MAX_LENGTH,
	NAME_MIN_LENGTH,
	MAX_SCORE,
	MIN_SCORE,
	SCORE_STEP,
} from '$lib'

// This endpoint will receive the name and score from src/lib/components/updateScore and save it to the database
export const POST: RequestHandler = async ({ request, cookies, locals, platform }) => {
	let db: ReturnType<typeof getTursoClient>
	try {
		// Create the DB client lazily so missing env vars don't crash module initialization.
		db = getTursoClient(platform?.env)
	} catch (error) {
		console.error('@update-score => Database client initialization failed:', error)
		return new Response(JSON.stringify({ error: 'Server database is not configured' }), {
			status: 500,
		})
	}

	try {
		const isHttps = new URL(request.url).protocol === 'https:'
		const sessionUserId = locals.id?.toString()
		const sessionUserName = locals.name
		const { name, score } = await request.json()

		if (sessionUserName && name !== sessionUserName) {
			return new Response(
				JSON.stringify({ success: false, error: 'mismatch name in the cookies and the request' }),
				{ status: 400 },
			)
		}

		if (sessionUserId && sessionUserName) {
			await updateUser(db, sessionUserId, sessionUserName, score)
			return new Response(JSON.stringify({ success: true, mode: 'update' }), { status: 200 })
		} else {
			// 	Normalize the name and check if it's valid, if not it will return undefined
			const safeName = normalizeName(name)

			if (!safeName || !isValidScore(score)) {
				console.error('@update-score => Invalid data:', { name, score })
				return new Response(
					JSON.stringify({
						error: `Name must be ${NAME_MIN_LENGTH}-${NAME_MAX_LENGTH} valid characters and score must be ${MIN_SCORE}-${MAX_SCORE} in steps of ${SCORE_STEP}`,
					}),
					{ status: 400 },
				)
			}

			const result = await db.execute({
				sql: 'INSERT INTO `quiz-ranking` (name, score) VALUES (?, ?) RETURNING id',
				args: [safeName, score],
			})

			const id = result.rows[0]?.['id']?.toString()
			const request_time = Date.now()
			const client_ip_address = locals.ip_address

			if (id) {
				const token = await createSignedSessionValue(
					id,
					platform?.env,
					getSessionTtlSeconds(),
					client_ip_address,
					request_time,
				)
				cookies.set(getSessionCookieName(), token, {
					path: '/',
					httpOnly: true,
					sameSite: 'strict',
					secure: isHttps,
					maxAge: getSessionTtlSeconds(),
				})
			}
			// Remove legacy cookies from older versions.
			cookies.delete('id', { path: '/' })
			cookies.delete('name', { path: '/' })

			console.log('@update-score => INSERT SUCCESSFULLY INTO DATABASE')
			return new Response(JSON.stringify({ success: true, mode: 'insert', id }), { status: 200 })
		}
	} catch (error) {
		console.error('@update-score => Unexpected server error:', error)
		const message = error instanceof Error ? error.message : 'Unknown server error'
		return new Response(JSON.stringify({ error: message }), { status: 500 })
	}
}

async function updateUser(
	db: ReturnType<typeof getTursoClient>,
	id: string,
	name: string,
	score: number,
): Promise<void> {
	if (!id || !name || !isValidScore(score)) {
		if (!id) throw new Error('User ID is required')
		if (!name) throw new Error('User name is required')
		throw new Error(`Score must be between ${MIN_SCORE} and ${MAX_SCORE} in steps of ${SCORE_STEP}`)
	}

	const current = await db.execute({
		sql: 'SELECT score FROM `quiz-ranking` WHERE id = ?',
		args: [id],
	})
	const currentScore = Number(current.rows[0]?.['score'] ?? 0)
	// Never allow lowering a user's best score.
	const nextScore = Math.max(currentScore, score)

	await db.execute({
		sql: 'UPDATE `quiz-ranking` SET score = ? WHERE id = ?',
		args: [nextScore, id],
	})

	console.log(
		`[@update-score(api)] User named: ${name} successfully update their score to ${nextScore}`,
	)
}
