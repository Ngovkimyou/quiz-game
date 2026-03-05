import { getTursoClient } from '$lib/server/getTursoClient'
import {
	createSignedSessionValue,
	getSessionCookieName,
	getSessionTtlSeconds,
} from '$lib/server/session'
// This import will take care of all the types problem
import type { RequestHandler } from './$types'

const MIN_SCORE = 0
const MAX_SCORE = 40000
const SCORE_STEP = 100
const NAME_MIN_LENGTH = 2
const NAME_MAX_LENGTH = 24
const NAME_PATTERN = /^[\p{L}\p{N}\p{M} _.-]+$/u
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 15

const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

function getClientKey(request: Request, userId?: string) {
	const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
	const realIp = request.headers.get('x-real-ip')?.trim()
	const cfIp = request.headers.get('cf-connecting-ip')?.trim()
	const ip = forwardedFor || realIp || cfIp || 'unknown'
	return `${userId ?? 'anonymous'}:${ip}`
}

// Simple in-memory rate limiter based on user ID and IP address.
function isRateLimited(key: string) {
	const now = Date.now()

	if (rateLimitStore.size > 10_000) {
		for (const [entryKey, entry] of rateLimitStore) {
			if (entry.resetAt <= now) rateLimitStore.delete(entryKey)
		}
	}

	const existing = rateLimitStore.get(key)

	if (!existing || existing.resetAt <= now) {
		rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
		return false
	}

	existing.count += 1
	rateLimitStore.set(key, existing)

	return existing.count > RATE_LIMIT_MAX_REQUESTS
}
// 	Normalize the name and check if it's valid, if not it will return null
function normalizeName(name: unknown) {
	if (typeof name !== 'string') return null
	const trimmed = name.trim()
	if (trimmed.length < NAME_MIN_LENGTH || trimmed.length > NAME_MAX_LENGTH) return null
	if (!NAME_PATTERN.test(trimmed)) return null
	return trimmed
}

function isValidScore(score: unknown) {
	return (
		typeof score === 'number' &&
		Number.isFinite(score) &&
		score >= MIN_SCORE &&
		score <= MAX_SCORE &&
		score % SCORE_STEP === 0
	)
}

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
		const id_cookies = locals.id?.toString()
		const name_cookies = locals.name
		const { name, score } = await request.json()

		const limiterKey = getClientKey(request, id_cookies)
		if (isRateLimited(limiterKey)) {
			return new Response(JSON.stringify({ error: 'Too many requests, please try again later' }), {
				status: 429,
			})
		}

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

		if (id_cookies && name_cookies) {
			await updateUser(db, id_cookies, name_cookies, score)
			return new Response(JSON.stringify({ success: true, mode: 'update' }), { status: 200 })
		}

		const result = await db.execute({
			sql: 'INSERT INTO `quiz-ranking` (name, score) VALUES (?, ?) RETURNING id',
			args: [safeName, score],
		})

		const id = result.rows[0]?.id?.toString()

		if (id) {
			const token = await createSignedSessionValue(id, platform?.env, getSessionTtlSeconds())
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
) {
	if (!id || !isValidScore(score)) {
		throw new Error(`Score must be between ${MIN_SCORE} and ${MAX_SCORE} in steps of ${SCORE_STEP}`)
	}

	const current = await db.execute({
		sql: 'SELECT score FROM `quiz-ranking` WHERE id = ?',
		args: [id],
	})
	const currentScore = Number(current.rows[0]?.score ?? 0)
	// Never allow lowering a user's best score.
	const nextScore = Math.max(currentScore, score)

	await db.execute({
		sql: 'UPDATE `quiz-ranking` SET score = ? WHERE id = ?',
		args: [nextScore, id],
	})

	console.log(
		`[@update-score(api)] User named: ${name} secussfully update their score to ${nextScore}`,
	)
}
