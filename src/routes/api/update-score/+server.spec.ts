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

const mockExecute = vi.fn()
const mockGetTursoClient = vi.fn(() => ({ execute: mockExecute }))

vi.mock('$lib/server/getTursoClient', () => ({
	getTursoClient: mockGetTursoClient,
}))

const mockCreateSignedSessionValue = vi.fn()
const mockGetSessionCookieName = vi.fn(() => 'quiz_session')
const mockGetSessionTtlSeconds = vi.fn(() => 86_400)

vi.mock('$lib/server/session', () => ({
	createSignedSessionValue: mockCreateSignedSessionValue,
	getSessionCookieName: mockGetSessionCookieName,
	getSessionTtlSeconds: mockGetSessionTtlSeconds,
}))

type MockCookies = {
	get: ReturnType<typeof vi.fn>
	set: ReturnType<typeof vi.fn>
	delete: ReturnType<typeof vi.fn>
}

type MockLocals = {
	id?: string | number
	name?: string
	ip_address?: string
}

type MockRequestEvent = {
	request: {
		url: string
		json: ReturnType<typeof vi.fn>
	}
	cookies: MockCookies
	locals: MockLocals
	platform?: { env?: Record<string, string> }
}

function createEvent(overrides: Partial<MockRequestEvent> = {}): MockRequestEvent {
	return {
		request: {
			url: 'http://localhost/api/update-score',
			json: vi.fn(async () => ({ name: 'Alice', score: 500 })),
		},
		cookies: {
			get: vi.fn(),
			set: vi.fn(),
			delete: vi.fn(),
		},
		locals: {},
		platform: { env: {} },
		...overrides,
	}
}

async function loadPOST(): Promise<(typeof import('./+server'))['POST']> {
	vi.resetModules()
	return (await import('./+server')).POST
}

describe('POST /api/update-score', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockGetSessionCookieName.mockReturnValue('quiz_session')
		mockGetSessionTtlSeconds.mockReturnValue(86_400)
		mockGetTursoClient.mockReturnValue({ execute: mockExecute })
		mockNormalizeName.mockReturnValue('Alice')
		mockIsValidScore.mockReturnValue(true)
		mockCreateSignedSessionValue.mockResolvedValue('signed-token')
	})

	describe('database initialization failure', () => {
		it('returns 500 when getTursoClient throws', async () => {
			const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
			mockGetTursoClient.mockImplementation(() => {
				throw new Error('Missing env vars')
			})
			const POST = await loadPOST()
			const event = createEvent()

			const response = await POST(event as never)
			const body = await response.json()

			expect(response.status).toBe(500)
			expect(body).toEqual({ error: 'Server database is not configured' })
			consoleError.mockRestore()
		})
	})

	describe('jsonResponse helper', () => {
		it('returns a response with JSON-encoded body and correct status', async () => {
			mockExecute.mockResolvedValue({ rows: [{ id: '7' }] })
			const POST = await loadPOST()
			const event = createEvent()

			const response = await POST(event as never)
			const body = await response.json()

			expect(response.status).toBe(200)
			expect(body).toMatchObject({ success: true })
		})
	})

	describe('getMismatchNameResponse', () => {
		it('returns 400 when the cookie name does not match the request name', async () => {
			const POST = await loadPOST()
			const event = createEvent({
				request: {
					url: 'http://localhost/api/update-score',
					json: vi.fn(async () => ({ name: 'Bob', score: 500 })),
				},
				locals: { name: 'Alice' },
			})

			const response = await POST(event as never)
			const body = await response.json()

			expect(response.status).toBe(400)
			expect(body).toEqual({
				success: false,
				error: 'mismatch name in the cookies and the request',
			})
		})

		it('does not return mismatch error when sessionUserName is absent', async () => {
			mockExecute.mockResolvedValue({ rows: [{ id: '1' }] })
			const POST = await loadPOST()
			const event = createEvent({
				request: {
					url: 'http://localhost/api/update-score',
					json: vi.fn(async () => ({ name: 'Bob', score: 500 })),
				},
				locals: {},
			})

			const response = await POST(event as never)

			expect(response.status).toBe(200)
		})

		it('does not return mismatch error when request name matches session name', async () => {
			mockExecute.mockResolvedValue({ rows: [{ id: '1' }] })
			const POST = await loadPOST()
			const event = createEvent({
				request: {
					url: 'http://localhost/api/update-score',
					json: vi.fn(async () => ({ name: 'Alice', score: 500 })),
				},
				locals: { name: 'Alice' },
			})

			const response = await POST(event as never)

			expect(response.status).toBe(200)
		})
	})

	describe('existing session user (update path)', () => {
		it('returns 200 with mode:update when session user exists', async () => {
			mockExecute
				.mockResolvedValueOnce({ rows: [{ score: 400 }] }) // SELECT for current score
				.mockResolvedValueOnce({ rows: [] }) // UPDATE
			const POST = await loadPOST()
			const event = createEvent({
				locals: { id: 'user-42', name: 'Alice', ip_address: '1.2.3.4' },
			})

			const response = await POST(event as never)
			const body = await response.json()

			expect(response.status).toBe(200)
			expect(body).toEqual({ success: true, mode: 'update' })
		})

		it('does not set a new cookie on update', async () => {
			mockExecute
				.mockResolvedValueOnce({ rows: [{ score: 200 }] })
				.mockResolvedValueOnce({ rows: [] })
			const POST = await loadPOST()
			const event = createEvent({
				locals: { id: 'user-99', name: 'Alice', ip_address: '1.2.3.4' },
			})

			await POST(event as never)

			expect(event.cookies.set).not.toHaveBeenCalled()
		})
	})

	describe('insertUser path (new user)', () => {
		it('returns 200 with mode:insert and the new id on successful insert', async () => {
			mockExecute.mockResolvedValue({ rows: [{ id: '55' }] })
			const POST = await loadPOST()
			const event = createEvent()

			const response = await POST(event as never)
			const body = await response.json()

			expect(response.status).toBe(200)
			expect(body).toEqual({ success: true, mode: 'insert', id: '55' })
		})

		it('sets session cookie after successful insert', async () => {
			mockExecute.mockResolvedValue({ rows: [{ id: '12' }] })
			const POST = await loadPOST()
			const event = createEvent()

			await POST(event as never)

			expect(mockCreateSignedSessionValue).toHaveBeenCalledWith(
				'12',
				event.platform?.env,
				86_400,
				undefined,
				expect.any(Number),
			)
			expect(event.cookies.set).toHaveBeenCalledWith('quiz_session', 'signed-token', {
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				secure: false,
				maxAge: 86_400,
			})
		})

		it('sets secure:true for HTTPS requests', async () => {
			mockExecute.mockResolvedValue({ rows: [{ id: '3' }] })
			const POST = await loadPOST()
			const event = createEvent({
				request: {
					url: 'https://example.com/api/update-score',
					json: vi.fn(async () => ({ name: 'Alice', score: 500 })),
				},
			})

			await POST(event as never)

			expect(event.cookies.set).toHaveBeenCalledWith(
				'quiz_session',
				'signed-token',
				expect.objectContaining({ secure: true }),
			)
		})

		it('does not set session cookie when insert returns no id', async () => {
			mockExecute.mockResolvedValue({ rows: [{}] })
			const POST = await loadPOST()
			const event = createEvent()

			const response = await POST(event as never)
			const body = await response.json()

			expect(event.cookies.set).not.toHaveBeenCalled()
			expect(body.mode).toBe('insert')
		})

		it('deletes legacy id and name cookies after insert', async () => {
			mockExecute.mockResolvedValue({ rows: [{ id: '9' }] })
			const POST = await loadPOST()
			const event = createEvent()

			await POST(event as never)

			expect(event.cookies.delete).toHaveBeenCalledWith('id', { path: '/' })
			expect(event.cookies.delete).toHaveBeenCalledWith('name', { path: '/' })
		})

		it('returns 400 via getInvalidPayloadResponse when normalizeName returns undefined', async () => {
			mockNormalizeName.mockReturnValue(undefined)
			const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
			const POST = await loadPOST()
			const event = createEvent()

			const response = await POST(event as never)
			const body = await response.json()

			expect(response.status).toBe(400)
			expect(body.error).toContain('Name must be 2-24 valid characters')
			consoleError.mockRestore()
		})

		it('returns 400 via getInvalidPayloadResponse when isValidScore returns false', async () => {
			mockIsValidScore.mockReturnValue(false)
			const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
			const POST = await loadPOST()
			const event = createEvent()

			const response = await POST(event as never)
			const body = await response.json()

			expect(response.status).toBe(400)
			expect(body.error).toContain('score must be 0-40000 in steps of 100')
			consoleError.mockRestore()
		})

		it('treats a string score as NaN (not a number type) → invalid', async () => {
			mockNormalizeName.mockReturnValue('Alice')
			mockIsValidScore.mockReturnValue(false)
			const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
			const POST = await loadPOST()
			const event = createEvent({
				request: {
					url: 'http://localhost/api/update-score',
					json: vi.fn(async () => ({ name: 'Alice', score: 'not-a-number' })),
				},
			})

			const response = await POST(event as never)

			expect(response.status).toBe(400)
			consoleError.mockRestore()
		})

		it('works when platform is undefined (no env)', async () => {
			mockExecute.mockResolvedValue({ rows: [{ id: '20' }] })
			const POST = await loadPOST()
			const event = createEvent({ platform: undefined })

			const response = await POST(event as never)
			const body = await response.json()

			expect(response.status).toBe(200)
			expect(body.mode).toBe('insert')
		})
	})

	describe('unexpected error handling', () => {
		it('returns 500 with error message when request.json throws', async () => {
			const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
			const POST = await loadPOST()
			const event = createEvent({
				request: {
					url: 'http://localhost/api/update-score',
					json: vi.fn(async () => {
						throw new Error('Invalid JSON')
					}),
				},
			})

			const response = await POST(event as never)
			const body = await response.json()

			expect(response.status).toBe(500)
			expect(body).toEqual({ error: 'Invalid JSON' })
			consoleError.mockRestore()
		})

		it('returns 500 with "Unknown server error" for non-Error throws', async () => {
			const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
			const POST = await loadPOST()
			const event = createEvent({
				request: {
					url: 'http://localhost/api/update-score',
					json: vi.fn(async () => {
						// eslint-disable-next-line no-throw-literal
						throw 'string error'
					}),
				},
			})

			const response = await POST(event as never)
			const body = await response.json()

			expect(response.status).toBe(500)
			expect(body).toEqual({ error: 'Unknown server error' })
			consoleError.mockRestore()
		})

		it('returns 500 with error message when db.execute throws during update', async () => {
			const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
			mockExecute.mockRejectedValue(new Error('DB write failed'))
			const POST = await loadPOST()
			// updateUser path is awaited, so errors are caught by the outer try/catch
			const event = createEvent({
				locals: { id: 'user-42', name: 'Alice', ip_address: '1.2.3.4' },
			})

			const response = await POST(event as never)
			const body = await response.json()

			expect(response.status).toBe(500)
			expect(body).toEqual({ error: 'DB write failed' })
			consoleError.mockRestore()
		})
	})
})