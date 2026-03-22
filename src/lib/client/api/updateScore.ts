import {
	isValidScore,
	MAX_SCORE,
	MIN_SCORE,
	NAME_MAX_LENGTH,
	NAME_MIN_LENGTH,
	normalizeName,
	SCORE_STEP,
} from '$lib'

type ErrorPayload = {
	error?: unknown
}

function getInvalidInputError(): Error {
	return new Error(
		`Name must be ${NAME_MIN_LENGTH}-${NAME_MAX_LENGTH} valid characters and score must be between ${MIN_SCORE} and ${MAX_SCORE} in steps of ${SCORE_STEP}`,
	)
}

async function parseResponsePayload(result: Response): Promise<unknown> {
	try {
		return await result.json()
	} catch {
		return undefined
	}
}

function getErrorMessage(payload: unknown): string {
	if (payload && typeof payload === 'object' && 'error' in payload) {
		return String((payload as ErrorPayload).error)
	}

	return 'Failed to save score'
}

export async function updateScore(
	name: string,
	score: number | undefined = undefined,
): Promise<unknown> {
	if (!name || score === undefined) {
		throw new Error('You need to give name and score')
	}

	const safeName = normalizeName(name.toString())
	const numericScore = Number(score)

	if (!safeName || !isValidScore(numericScore)) {
		throw getInvalidInputError()
	}

	const result = await fetch('/api/update-score', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		// Sent name and score to src/routes/api/update-score
		body: JSON.stringify({ name: safeName, score: numericScore }),
	})

	const payload = await parseResponsePayload(result)

	if (!result.ok) {
		throw new Error(getErrorMessage(payload))
	}

	return payload
}
