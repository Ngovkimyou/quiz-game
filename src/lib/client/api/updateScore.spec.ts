import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockNormalizeName = vi.fn()
const mockIsValidScore = vi.fn()

vi.mock('$lib', () => ({
	normalizeName: mockNormalizeName,
	isValidScore: mockIsValidScore,
	MIN_SCORE: 0,
	MAX_SCORE: 40000,
	NAME_MIN_LENGTH: 2,
	NAME_MAX_LENGTH: 24,
	SCORE_STEP: 100,
}))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

async function loadUpdateScore(): Promise<(typeof import('./updateScore'))['updateScore']> {
	vi.resetModules()
	return (await import('./updateScore')).updateScore
}

function makeOkResponse(body: unknown): Response {
	return {
		ok: true,
		json: vi.fn(async () => body),
	} as unknown as Response
}

function makeErrorResponse(body: unknown, status = 400): Response {
	return {
		ok: false,
		status,
		json: vi.fn(async () => body),
	} as unknown as Response
}

describe('updateScore', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockNormalizeName.mockReturnValue('Player')
		mockIsValidScore.mockReturnValue(true)
	})

	describe('input validation - missing arguments', () => {
		it('throws when name is an empty string', async () => {
			const updateScore = await loadUpdateScore()
			await expect(updateScore('', 100)).rejects.toThrow('You need to give name and score')
		})

		it('throws when score is undefined', async () => {
			const updateScore = await loadUpdateScore()
			await expect(updateScore('Alice')).rejects.toThrow('You need to give name and score')
		})

		it('throws when score is explicitly passed as undefined', async () => {
			const updateScore = await loadUpdateScore()
			await expect(updateScore('Alice', undefined)).rejects.toThrow(
				'You need to give name and score',
			)
		})
	})

	describe('input validation - invalid name or score', () => {
		it('throws the invalid input error when normalizeName returns undefined', async () => {
			mockNormalizeName.mockReturnValue(undefined)
			mockIsValidScore.mockReturnValue(true)
			const updateScore = await loadUpdateScore()
			await expect(updateScore('?!', 100)).rejects.toThrow(
				'Name must be 2-24 valid characters and score must be between 0 and 40000 in steps of 100',
			)
		})

		it('throws the invalid input error when isValidScore returns false', async () => {
			mockNormalizeName.mockReturnValue('Player')
			mockIsValidScore.mockReturnValue(false)
			const updateScore = await loadUpdateScore()
			await expect(updateScore('Player', -50)).rejects.toThrow(
				'Name must be 2-24 valid characters and score must be between 0 and 40000 in steps of 100',
			)
		})

		it('throws the invalid input error when both name and score are invalid', async () => {
			mockNormalizeName.mockReturnValue(undefined)
			mockIsValidScore.mockReturnValue(false)
			const updateScore = await loadUpdateScore()
			await expect(updateScore('?', 99)).rejects.toThrow(
				'Name must be 2-24 valid characters and score must be between 0 and 40000 in steps of 100',
			)
		})
	})

	describe('fetch call', () => {
		it('sends a POST request to /api/update-score with the normalized name and numeric score', async () => {
			mockNormalizeName.mockReturnValue('NormalizedPlayer')
			mockIsValidScore.mockReturnValue(true)
			mockFetch.mockResolvedValue(makeOkResponse({ success: true }))
			const updateScore = await loadUpdateScore()

			await updateScore('  NormalizedPlayer  ', 500)

			expect(mockFetch).toHaveBeenCalledOnce()
			expect(mockFetch).toHaveBeenCalledWith('/api/update-score', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: 'NormalizedPlayer', score: 500 }),
			})
		})

		it('passes the name through toString() before normalization', async () => {
			mockNormalizeName.mockReturnValue('Player')
			mockIsValidScore.mockReturnValue(true)
			mockFetch.mockResolvedValue(makeOkResponse({ success: true }))
			const updateScore = await loadUpdateScore()

			await updateScore('Player', 200)

			// normalizeName should be called with the string form of name
			expect(mockNormalizeName).toHaveBeenCalledWith('Player')
		})

		it('converts score to Number before isValidScore check', async () => {
			mockNormalizeName.mockReturnValue('Player')
			mockIsValidScore.mockReturnValue(true)
			mockFetch.mockResolvedValue(makeOkResponse({ success: true }))
			const updateScore = await loadUpdateScore()

			await updateScore('Player', 300)

			expect(mockIsValidScore).toHaveBeenCalledWith(300)
		})
	})

	describe('successful response', () => {
		it('returns the parsed response payload on success', async () => {
			const payload = { success: true, id: '42' }
			mockFetch.mockResolvedValue(makeOkResponse(payload))
			const updateScore = await loadUpdateScore()

			const result = await updateScore('Alice', 1000)

			expect(result).toEqual(payload)
		})

		it('returns undefined payload when response body is not valid JSON', async () => {
			const response = {
				ok: true,
				json: vi.fn(async () => {
					throw new SyntaxError('Unexpected token')
				}),
			} as unknown as Response
			mockFetch.mockResolvedValue(response)
			const updateScore = await loadUpdateScore()

			const result = await updateScore('Alice', 1000)

			expect(result).toBeUndefined()
		})
	})

	describe('error response handling', () => {
		it('throws with the error field from the response payload when fetch fails', async () => {
			mockFetch.mockResolvedValue(makeErrorResponse({ error: 'Score already recorded' }, 409))
			const updateScore = await loadUpdateScore()

			await expect(updateScore('Alice', 500)).rejects.toThrow('Score already recorded')
		})

		it('throws "Failed to save score" when response is not ok and payload has no error field', async () => {
			mockFetch.mockResolvedValue(makeErrorResponse({ message: 'something else' }, 500))
			const updateScore = await loadUpdateScore()

			await expect(updateScore('Alice', 500)).rejects.toThrow('Failed to save score')
		})

		it('throws "Failed to save score" when response is not ok and payload is undefined', async () => {
			const response = {
				ok: false,
				json: vi.fn(async () => {
					throw new SyntaxError('bad json')
				}),
			} as unknown as Response
			mockFetch.mockResolvedValue(response)
			const updateScore = await loadUpdateScore()

			await expect(updateScore('Alice', 500)).rejects.toThrow('Failed to save score')
		})

		it('throws "Failed to save score" when response is not ok and payload is null', async () => {
			mockFetch.mockResolvedValue(makeErrorResponse(null, 500))
			const updateScore = await loadUpdateScore()

			await expect(updateScore('Alice', 500)).rejects.toThrow('Failed to save score')
		})

		it('converts non-string error values to string in the error message', async () => {
			mockFetch.mockResolvedValue(makeErrorResponse({ error: 42 }, 500))
			const updateScore = await loadUpdateScore()

			await expect(updateScore('Alice', 500)).rejects.toThrow('42')
		})
	})

	describe('boundary conditions', () => {
		it('does not throw for score = 0 (MIN_SCORE boundary) when validation passes', async () => {
			mockNormalizeName.mockReturnValue('Player')
			mockIsValidScore.mockReturnValue(true)
			mockFetch.mockResolvedValue(makeOkResponse({ success: true }))
			const updateScore = await loadUpdateScore()

			await expect(updateScore('Player', 0)).resolves.toBeDefined()
		})

		it('does not throw for score = 40000 (MAX_SCORE boundary) when validation passes', async () => {
			mockNormalizeName.mockReturnValue('Player')
			mockIsValidScore.mockReturnValue(true)
			mockFetch.mockResolvedValue(makeOkResponse({ success: true }))
			const updateScore = await loadUpdateScore()

			await expect(updateScore('Player', 40_000)).resolves.toBeDefined()
		})

		it('throws invalid input error when score is NaN (Number coercion of non-numeric string)', async () => {
			mockNormalizeName.mockReturnValue('Player')
			mockIsValidScore.mockReturnValue(false)
			const updateScore = await loadUpdateScore()

			// NaN is the result of Number('not-a-number')
			await expect(updateScore('Player', Number.NaN)).rejects.toThrow(
				'Name must be 2-24 valid characters and score must be between 0 and 40000 in steps of 100',
			)
		})
	})
})