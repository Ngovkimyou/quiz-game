import type { PageServerLoad } from './$types'
import { getUserSessionData } from '$lib/server/userSessionData'

export const load: PageServerLoad = async (event) => {
	const session = getUserSessionData(event)
	return {
		session,
		// These datas will be sent to the +page.svelte page in the same folder
		// Call it by using $props
	}
}
