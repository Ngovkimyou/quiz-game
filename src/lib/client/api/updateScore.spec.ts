import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchMock = vi.fn()

vi.stubGlobal('fetch', fetchMock)

describe('updateScore', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('throws when name or score is missing', async () => {
		const { updateScore } = await import('./updateScore')

		await expect(updateScore('', 100)).rejects.toThrow('You need to give name and score')
		await expect(updateScore('Ada')).rejects.toThrow('You need to give name and score')
	})

	it('throws when the input is invalid', async () => {
		const { updateScore } = await import('./updateScore')

		await expect(updateScore('x', 100)).rejects.toThrow('Name must be 2-24 valid characters')
		await expect(updateScore('Ada', 125)).rejects.toThrow(
			'Name must be 2-24 valid characters and score must be between 0 and 40000 in steps of 100',
		)
	})

	it('posts normalized input and returns the parsed payload', async () => {
		fetchMock.mockResolvedValue(
			new Response(JSON.stringify({ success: true, mode: 'insert' }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			}),
		)
		const { updateScore } = await import('./updateScore')

		const payload = await updateScore('  Ada  ', 300)

		expect(fetchMock).toHaveBeenCalledWith('/api/update-score', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: 'Ada', score: 300 }),
		})
		expect(payload).toEqual({ success: true, mode: 'insert' })
	})

	it('uses the server error payload when the request fails', async () => {
		fetchMock.mockResolvedValue(
			new Response(JSON.stringify({ error: 'Bad score' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			}),
		)
		const { updateScore } = await import('./updateScore')

		await expect(updateScore('Ada', 300)).rejects.toThrow('Bad score')
	})

	it('falls back to a generic message when the error response is not json', async () => {
		fetchMock.mockResolvedValue(
			new Response('nope', {
				status: 500,
				headers: { 'Content-Type': 'text/plain' },
			}),
		)
		const { updateScore } = await import('./updateScore')

		await expect(updateScore('Ada', 300)).rejects.toThrow('Failed to save score')
	})
})
