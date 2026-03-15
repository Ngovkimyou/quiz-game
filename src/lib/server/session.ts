import { env } from '$env/dynamic/private'

const SESSION_COOKIE_NAME = 'quiz_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 // 1 day

type SessionPayload = {
	id: string
	exp: number
	ip_address: string | undefined
	request_time: number | undefined
	count: number
}

function getSessionSecret(platformEnv?: App.Platform['env']): string {
	const fromPlatform = (platformEnv as Record<string, unknown> | undefined)?.QUIZ_SESSION_SECRET
	const fromPlatformTurso = (platformEnv as Record<string, unknown> | undefined)?.TURSO_AUTH_TOKEN
	const fromNodeEnv = env.QUIZ_SESSION_SECRET
	const fromNodeTurso = env.TURSO_AUTH_TOKEN
	const secret = (
		(typeof fromPlatform === 'string' && fromPlatform) ||
		(typeof fromPlatformTurso === 'string' && fromPlatformTurso) ||
		fromNodeEnv ||
		fromNodeTurso
	)?.trim()

	if (!secret) {
		throw new Error('Missing QUIZ_SESSION_SECRET or TURSO_AUTH_TOKEN environment variable')
	}

	return secret
}

function toBase64Url(bytes: Uint8Array): string {
	let base64 = ''
	for (let i = 0; i < bytes.length; i++) {
		const byte = bytes[i]
		if (byte === undefined) {
			throw new Error('Failed to encode session bytes')
		}
		base64 += String.fromCharCode(byte)
	}

	return btoa(base64).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(input: string): Uint8Array {
	const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
	const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
	const binary = atob(padded)
	const bytes = new Uint8Array(binary.length)

	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i)
	}

	return bytes
}

async function signText(secret: string, value: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign'],
	)
	const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))
	return toBase64Url(new Uint8Array(signature))
}

function constantTimeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false

	let mismatch = 0
	for (let i = 0; i < a.length; i++) {
		mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
	}
	return mismatch === 0
}

// This function is used for creating a signed session value that will be stored in the cookie.
export async function createSignedSessionValue(
	id: string,
	platformEnv?: App.Platform['env'],
	ttlSeconds = SESSION_TTL_SECONDS,
	ip_address?: string,
	request_time?: number,
	count: number = 1,
): Promise<string> {
	const payload: SessionPayload = {
		id: id.toString(),
		exp: Math.floor(Date.now() / 1000) + ttlSeconds,
		ip_address,
		request_time,
		count,
	}
	const payloadPart = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)))
	const signaturePart = await signText(getSessionSecret(platformEnv), payloadPart)
	return `${payloadPart}.${signaturePart}`
}

// This function is used for parsing and verifying the session value from the cookie. It returns the session payload if the value is valid, otherwise it returns undefined.
export async function parseAndVerifySessionValue(
	token: string | undefined,
	platformEnv?: App.Platform['env'],
): Promise<SessionPayload | undefined> {
	if (!token) return undefined

	const [payloadPart, signaturePart] = token.split('.')
	if (!payloadPart || !signaturePart) return undefined

	const expectedSignature = await signText(getSessionSecret(platformEnv), payloadPart)
	if (!constantTimeEqual(signaturePart, expectedSignature)) return undefined

	try {
		const payloadJson = new TextDecoder().decode(fromBase64Url(payloadPart))
		const parsed = JSON.parse(payloadJson) as SessionPayload
		if (!parsed?.id || typeof parsed.id !== 'string') return undefined
		if (!parsed?.exp || typeof parsed.exp !== 'number') return undefined
		if (parsed.exp < Math.floor(Date.now() / 1000)) return undefined
		return parsed
	} catch {
		return undefined
	}
}

export function getSessionCookieName(): string {
	return SESSION_COOKIE_NAME
}

export function getSessionTtlSeconds(): number {
	return SESSION_TTL_SECONDS
}
