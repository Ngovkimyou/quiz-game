export const MIN_SCORE = 0
export const MAX_SCORE = 40000
export const SCORE_STEP = 100
export const NAME_MIN_LENGTH = 2
export const NAME_MAX_LENGTH = 24
export const NAME_PATTERN = /^[\p{L}\p{N}\p{M} _.-]+$/u

// 	Normalize the name and check if it's valid, if not it will return null
export function normalizeName(name: unknown): string | undefined {
	if (typeof name !== 'string') return undefined
	const trimmed = name.trim()
	if (trimmed.length < NAME_MIN_LENGTH || trimmed.length > NAME_MAX_LENGTH) return undefined
	if (!NAME_PATTERN.test(trimmed)) return undefined
	return trimmed
}

export function isValidScore(score: unknown): boolean {
	return (
		typeof score === 'number' &&
		Number.isFinite(score) &&
		score >= MIN_SCORE &&
		score <= MAX_SCORE &&
		score % SCORE_STEP === 0
	)
}
