// The api sends a cookie that records the user name to the browser
const MIN_SCORE = 0
const MAX_SCORE = 40000
const SCORE_STEP = 100
const NAME_MIN_LENGTH = 2
const NAME_MAX_LENGTH = 24
const NAME_PATTERN = /^[\p{L}\p{N}\p{M} _.-]+$/u

export async function UpdateScore(name: string, score: number | undefined = undefined) {
	// This function can't run if an id and a score aren't given
	if (!name || score === undefined) {
		throw new Error('You need to give name and score')
	} else {
		// Convert name to string just to be safe cause people might name themselve as number
		name = name.toString().trim()

		if (
			name.length < NAME_MIN_LENGTH ||
			name.length > NAME_MAX_LENGTH ||
			!NAME_PATTERN.test(name)
		) {
			throw new Error(`Name must be ${NAME_MIN_LENGTH}-${NAME_MAX_LENGTH} valid characters`)
		}
		// Convert score to number just to be safe
		score = Number(score)

		if (
			!Number.isFinite(score) ||
			score < MIN_SCORE ||
			score > MAX_SCORE ||
			score % SCORE_STEP !== 0
		) {
			throw new Error(
				`Score must be between ${MIN_SCORE} and ${MAX_SCORE} in steps of ${SCORE_STEP}`,
			)
		}

		const result = await fetch('/api/update-score', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			// Sent name and score to src/routes/api/update-score
			body: JSON.stringify({ name, score }),
		})

		let payload: unknown = undefined
		try {
			payload = await result.json()
		} catch {
			payload = undefined
		}

		console.log('Data Received @updateScore:', { status: result.status, payload })

		if (!result.ok) {
			const payloadObject: Record<string, unknown> | undefined =
				payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : undefined
			const message =
				payloadObject && 'error' in payloadObject
					? String((payloadObject as { error: unknown }).error)
					: 'Failed to save score'
			throw new Error(message)
		}

		return payload
	}
}
