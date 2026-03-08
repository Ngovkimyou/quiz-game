import type { RequestEvent } from '@sveltejs/kit'

export function getUserSessionData(event: RequestEvent) {
	return {
		// These datas will be sent to the +page.svelte page in the same folder
		// Call it by using $props
		id: event.locals.id,
		name: event.locals.name,
		score: event.locals.score,
		registered_date: event.locals.registered_date,
	}
}
