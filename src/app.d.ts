// See https://svelte.dev/docs/kit/types#app.d.ts

import type { Value } from '@libsql/client'

// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			id: number | string | undefined
			name: string | undefined
			score: Value | undefined
			registered_date: Value | undefined
			ip_address: string | undefined
		}

		interface Platform {
			env: Env
			ctx: ExecutionContext
			caches: CacheStorage
			cf?: IncomingRequestCfProperties
		}
	}
}

export {}
