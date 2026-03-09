const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 15

// This function is deprecated(Use build-in function in hook instead)
export function getClientKey(request: Request, userId?: string): string {
	const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
	const realIp = request.headers.get('x-real-ip')?.trim()
	const cfIp = request.headers.get('cf-connecting-ip')?.trim()
	// Added crypto.randomUUID() to generate identification instead of unknown
	const ip = forwardedFor || realIp || cfIp || 'unknown'
	return `${userId ?? 'anonymous'}:${ip}`
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>()
// Simple in-memory rate limiter based on user ID and IP address.
type RateLimiter =
	| {
			over_Limit: boolean
			isExist:
				| {
						count: number
						resetAt: number
				  }
				| undefined
	  }
	| undefined

export function isRateLimited(
	key: string,
	count: number,
	ip_address: string | undefined,
	request_time: number | undefined,
): RateLimiter {
	const now = Date.now()

	if (rateLimitStore.size > 10_000) {
		for (const [entryKey, entry] of rateLimitStore) {
			if (entry.resetAt <= now) rateLimitStore.delete(entryKey)
		}
	}

	let over_Limit = false
	const isExist = rateLimitStore.get(key)

	// This condition can only be triggered if the user somehow change their ip_address
	// or if the server suddenly create a new instance
	if (!isExist && request_time && count < RATE_LIMIT_MAX_REQUESTS) {
		console.log('@RateLimiter.ts => if was triggered')
		if (key === ip_address && request_time <= now) {
			rateLimitStore.set(key, { count: count + 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
			return { over_Limit, isExist }
		}
		// This condition triggered when there's new user or the request is below the set limit
	} else if (!isExist || isExist.resetAt <= now) {
		console.log('@RateLimiter.ts => else if was triggered')
		rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
		return { over_Limit, isExist }
		// if user request too fast then they will trigger the else statement
	} else {
		console.log('@RateLimiter.ts => Request is too quick')
		isExist.count += 1
		rateLimitStore.set(key, isExist)
		over_Limit = isExist.count > RATE_LIMIT_MAX_REQUESTS
		return { over_Limit, isExist }
	}
}
