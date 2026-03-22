import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RequestEvent } from './$types'

const mockExecute = vi.fn()
const mockGetTursoClient = vi.fn(() => ({
	execute: mockExecute,
}))
const mockCreateSignedSessionValue = vi.fn()
const mockGetSessionCookieName = vi.fn(() => 'quiz_session')
const mockGetSessionTtlSeconds = vi.fn(() => 86_400)

vi.mock('$lib/server/getTursoClient', () => ({
	getTursoClient: mockGetTursoClient,
}))

vi.mock('$lib/server/session', () => ({
	createSignedSessionValue: mockCreateSignedSessionValue,
	getSessionCookieName: mockGetSessionCookieName,
	getSessionTtlSeconds: mockGetSessionTtlSeconds,
}))

type MockCookies = {
	set: ReturnType<typeof vi.fn>
	delete: ReturnType<typeof vi.fn>
}

function createEvent(
	request: Request,
	options?: {
		cookies?: MockCookies
		locals?: Record<string, unknown>
		platform?: { env: Record<string, string> }
	},
): RequestEvent {
	return {
		request,
		cookies: options?.cookies ?? { set: vi.fn(), delete: vi.fn() },
		locals: (options?.locals ?? {}) as unknown as App.Locals,
		platform: options?.platform as App.Platform | undefined,
		fetch,
		getClientAddress: () => '203.0.113.5',
		params: {},
		route: { id: '/api/update-score' },
		setHeaders: vi.fn(),
		url: new URL(request.url),
		isDataRequest: false,
		isSubRequest: false,
		isRemoteRequest: false,
		tracing: {} as never,
		depends: vi.fn(),
		untrack: vi.fn((fn: () => unknown) => fn()),
	} as unknown as RequestEvent
}

function createRequest(body: unknown, url = 'https://example.com/api/update-score'): Request {
	return new Request(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	})
}

async function loadPost(): Promise<typeof import('./+server').POST> {
	vi.resetModules()
	return (await import('./+server')).POST
}

describe('POST /api/update-score', () => {
	beforeEach(() => {
		vi.resetAllMocks()
		mockGetTursoClient.mockReturnValue({ execute: mockExecute })
		mockGetSessionCookieName.mockReturnValue('quiz_session')
		mockGetSessionTtlSeconds.mockReturnValue(86_400)
	})

	it('returns a database configuration error when client creation fails', async () => {
		const error = new Error('missing env')
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
		mockGetTursoClient.mockImplementation(() => {
			throw error
		})
		const POST = await loadPost()

		const response = await POST(createEvent(createRequest({ name: 'Ada', score: 100 })))

		expect(response.status).toBe(500)
		expect(await response.json()).toEqual({ error: 'Server database is not configured' })
		expect(consoleError).toHaveBeenCalledWith(
			'@update-score => Database client initialization failed:',
			error,
		)
		consoleError.mockRestore()
	})

	it('rejects mismatched session and request names', async () => {
		const POST = await loadPost()

		const response = await POST(
			createEvent(createRequest({ name: 'Grace', score: 100 }), {
				locals: { id: 'user-1', name: 'Ada' },
				platform: { env: {} },
			}),
		)

		expect(response.status).toBe(400)
		expect(await response.json()).toEqual({
			success: false,
			error: 'mismatch name in the cookies and the request',
		})
	})

	it('updates an existing user score without lowering it', async () => {
		mockExecute
			.mockResolvedValueOnce({ rows: [{ score: 500 }] })
			.mockResolvedValueOnce({ rows: [] })
		const POST = await loadPost()

		const response = await POST(
			createEvent(createRequest({ name: 'Ada', score: 300 }), {
				locals: { id: 'user-1', name: 'Ada' },
				platform: { env: {} },
			}),
		)

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual({ success: true, mode: 'update' })
		expect(mockExecute).toHaveBeenNthCalledWith(1, {
			sql: 'SELECT score FROM `quiz-ranking` WHERE id = ?',
			args: ['user-1'],
		})
		expect(mockExecute).toHaveBeenNthCalledWith(2, {
			sql: 'UPDATE `quiz-ranking` SET score = ? WHERE id = ?',
			args: [500, 'user-1'],
		})
	})

	it('rejects invalid insert payloads', async () => {
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
		const POST = await loadPost()

		const response = await POST(
			createEvent(createRequest({ name: 'x', score: 125 }), {
				platform: { env: {} },
			}),
		)

		expect(response.status).toBe(400)
		expect(await response.json()).toEqual({
			error: 'Name must be 2-24 valid characters and score must be 0-40000 in steps of 100',
		})
		expect(consoleError).toHaveBeenCalledWith('@update-score => Invalid data:', {
			name: 'x',
			score: 125,
		})
		consoleError.mockRestore()
	})

	it('inserts a new user and sets the signed session cookie', async () => {
		const cookies: MockCookies = {
			set: vi.fn(),
			delete: vi.fn(),
		}
		mockExecute.mockResolvedValue({ rows: [{ id: 'new-user' }] })
		mockCreateSignedSessionValue.mockResolvedValue('signed-token')
		const POST = await loadPost()

		const response = await POST(
			createEvent(createRequest({ name: '  Ada  ', score: 600 }), {
				cookies,
				locals: { ip_address: '203.0.113.5' },
				platform: { env: {} },
			}),
		)

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual({ success: true, mode: 'insert', id: 'new-user' })
		expect(mockExecute).toHaveBeenCalledWith({
			sql: 'INSERT INTO `quiz-ranking` (name, score) VALUES (?, ?) RETURNING id',
			args: ['Ada', 600],
		})
		expect(mockCreateSignedSessionValue).toHaveBeenCalledWith(
			'new-user',
			{},
			86_400,
			'203.0.113.5',
			expect.any(Number),
		)
		expect(cookies.set).toHaveBeenCalledWith('quiz_session', 'signed-token', {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: true,
			maxAge: 86_400,
		})
		expect(cookies.delete).toHaveBeenCalledWith('id', { path: '/' })
		expect(cookies.delete).toHaveBeenCalledWith('name', { path: '/' })
	})

	it('logs unexpected route errors and returns a 500 response', async () => {
		const error = new Error('db write failed')
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
		mockExecute.mockRejectedValue(error)
		const POST = await loadPost()

		const response = await POST(
			createEvent(createRequest({ name: 'Ada', score: 600 }), {
				platform: { env: {} },
			}),
		)

		expect(response.status).toBe(500)
		expect(await response.json()).toEqual({ error: 'db write failed' })
		expect(consoleError).toHaveBeenCalledWith('@update-score => Unexpected server error:', error)
		consoleError.mockRestore()
	})
})
