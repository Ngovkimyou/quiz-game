import type { PageServerLoad } from './$types'
import { getUserSessionData } from '$lib'

export const load: PageServerLoad = async ( event ) => {
	const session = getUserSessionData(event)
	return {

		session
		// These datas will be sent to the +page.svelte page in the same folder
		// Call it by using $props
	}
}
