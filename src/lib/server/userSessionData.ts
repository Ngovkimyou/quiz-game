import type { RequestEvent } from '@sveltejs/kit'

type UserSession = {
	id: string | number | undefined
	name: string | undefined
	score: number
	registered_date: Date
}

export function getUserSessionData(event: RequestEvent): UserSession {
	return {
		// These datas will be sent to the +page.svelte page in the same folder
		// Call it by using $props
		id: event.locals.id,
		name: event.locals.name,
		score: event.locals.score,
		registered_date: event.locals.registered_date,
	}
}
