import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockParseAndVerifySessionValue = vi.fn()
const mockCreateSignedSessionValue = vi.fn()
const mockGetSessionCookieName = vi.fn(() => 'quiz_session')
const mockGetSessionTtlSeconds = vi.fn(() => 86_400)
const mockIsRateLimited = vi.fn()
const mockExecute = vi.fn()
const mockGetTursoClient = vi.fn(() => ({
	execute: mockExecute,
}))

vi.mock('$lib/server/session', () => ({
	parseAndVerifySessionValue: mockParseAndVerifySessionValue,
	createSignedSessionValue: mockCreateSignedSessionValue,
	getSessionCookieName: mockGetSessionCookieName,
	getSessionTtlSeconds: mockGetSessionTtlSeconds,
}))

vi.mock('$lib/server/RateLimiter', () => ({
	isRateLimited: mockIsRateLimited,
}))

vi.mock('$lib/server/getTursoClient', () => ({
	getTursoClient: mockGetTursoClient,
}))

type MockCookies = {
	get: ReturnType<typeof vi.fn>
	set: ReturnType<typeof vi.fn>
	delete: ReturnType<typeof vi.fn>
}

type MockEvent = {
	cookies: MockCookies
	locals: Record<string, unknown>
	platform: { env: Record<string, string> }
	getClientAddress: () => string
}

function createEvent(sessionToken = 'session-token'): MockEvent {
	return {
		cookies: {
			get: vi.fn(() => sessionToken),
			set: vi.fn(),
			delete: vi.fn(),
		},
		locals: {},
		platform: { env: {} },
		getClientAddress: () => '203.0.113.10',
	}
}

async function loadHandle(): Promise<(typeof import('./hooks.server'))['handle']> {
	vi.resetModules()
	return (await import('./hooks.server')).handle
}

describe('hooks.server handle', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockGetSessionCookieName.mockReturnValue('quiz_session')
		mockGetSessionTtlSeconds.mockReturnValue(86_400)
		mockGetTursoClient.mockReturnValue({ execute: mockExecute })
	})

	it('resolves immediately when there is no valid session', async () => {
		mockParseAndVerifySessionValue.mockResolvedValue(undefined)
		const handle = await loadHandle()
		const event = createEvent()
		const resolve = vi.fn(async () => new Response('ok'))

		const response = await handle({ event: event as never, resolve })

		expect(response.status).toBe(200)
		expect(resolve).toHaveBeenCalledWith(event)
		expect(mockIsRateLimited).not.toHaveBeenCalled()
		expect(event.cookies.set).not.toHaveBeenCalled()
	})

	it('returns 429 when the client is over the request limit', async () => {
		mockParseAndVerifySessionValue.mockResolvedValue({
			id: 'user-1',
			ip_address: '203.0.113.10',
			count: 16,
			request_time: Date.now(),
			exp: Math.floor(Date.now() / 1000) + 60,
		})
		mockIsRateLimited.mockReturnValue({
			over_Limit: true,
			isExist: { count: 16, resetAt: Date.now() + 60_000 },
		})
		const handle = await loadHandle()
		const event = createEvent()
		const resolve = vi.fn(async () => new Response('ok'))

		const response = await handle({ event: event as never, resolve })

		expect(response.status).toBe(429)
		expect(await response.text()).toContain('Too Many Request')
		expect(response.headers.get('Retry-After')).toBe('60')
		expect(resolve).not.toHaveBeenCalled()
	})

	it('refreshes the session cookie and hydrates locals when the user exists', async () => {
		mockParseAndVerifySessionValue.mockResolvedValue({
			id: 'user-42',
			ip_address: '198.51.100.4',
			count: 2,
			request_time: Date.now(),
			exp: Math.floor(Date.now() / 1000) + 60,
		})
		mockIsRateLimited.mockReturnValue({
			over_Limit: false,
			isExist: { count: 3, resetAt: 123_456 },
		})
		mockCreateSignedSessionValue.mockResolvedValue('signed-token')
		mockExecute.mockResolvedValue({
			rows: [{ name: 'Ada', score: 12, registered_date: '2026-03-20' }],
		})
		const handle = await loadHandle()
		const event = createEvent()
		const resolve = vi.fn(async () => new Response('ok'))

		const response = await handle({ event: event as never, resolve })

		expect(response.status).toBe(200)
		expect(mockCreateSignedSessionValue).toHaveBeenCalledWith(
			'user-42',
			event.platform.env,
			86_400,
			'203.0.113.10',
			123_456,
			3,
		)
		expect(event.cookies.set).toHaveBeenCalledWith('quiz_session', 'signed-token', {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			maxAge: 86_400,
		})
		expect(event.locals).toEqual({
			id: 'user-42',
			name: 'Ada',
			score: 12,
			registered_date: '2026-03-20',
			ip_address: '203.0.113.10',
		})
		expect(resolve).toHaveBeenCalledWith(event)
	})

	it('deletes the session cookie when the user no longer exists', async () => {
		mockParseAndVerifySessionValue.mockResolvedValue({
			id: 'missing-user',
			ip_address: '198.51.100.4',
			count: 1,
			request_time: Date.now(),
			exp: Math.floor(Date.now() / 1000) + 60,
		})
		mockIsRateLimited.mockReturnValue({
			over_Limit: false,
			isExist: undefined,
		})
		mockCreateSignedSessionValue.mockResolvedValue('signed-token')
		mockExecute.mockResolvedValue({
			rows: [{}],
		})
		const handle = await loadHandle()
		const event = createEvent()
		const resolve = vi.fn(async () => new Response('ok'))

		await handle({ event: event as never, resolve })

		expect(event.cookies.delete).toHaveBeenCalledWith('quiz_session', { path: '/' })
		expect(event.locals).toEqual({})
	})

	it('logs database read failures and still resolves the request', async () => {
		const error = new Error('db unavailable')
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
		mockParseAndVerifySessionValue.mockResolvedValue({
			id: 'user-42',
			ip_address: '198.51.100.4',
			count: 2,
			request_time: Date.now(),
			exp: Math.floor(Date.now() / 1000) + 60,
		})
		mockIsRateLimited.mockReturnValue({
			over_Limit: false,
			isExist: { count: 3, resetAt: 123_456 },
		})
		mockCreateSignedSessionValue.mockResolvedValue('signed-token')
		mockExecute.mockRejectedValue(error)
		const handle = await loadHandle()
		const event = createEvent()
		const resolve = vi.fn(async () => new Response('ok'))

		const response = await handle({ event: event as never, resolve })

		expect(response.status).toBe(200)
		expect(consoleError).toHaveBeenCalledWith(
			'@handle => Failed to read user from database:',
			error,
		)
		expect(resolve).toHaveBeenCalledWith(event)

		consoleError.mockRestore()
	})

	it('logs session verification failures and still resolves the request', async () => {
		const error = new Error('bad session')
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
		mockParseAndVerifySessionValue.mockRejectedValue(error)
		const handle = await loadHandle()
		const event = createEvent()
		const resolve = vi.fn(async () => new Response('ok'))

		const response = await handle({ event: event as never, resolve })

		expect(response.status).toBe(200)
		expect(consoleError).toHaveBeenCalledWith('@handle => Session verification failed:', error)
		expect(resolve).toHaveBeenCalledWith(event)

		consoleError.mockRestore()
	})
})
