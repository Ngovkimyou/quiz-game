import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	return {
		id: locals.id,
		name: locals.name,
		score: locals.score,
		registered_date: locals.registered_date
		// These datas will be sent to the +page.svelte page in the same folder
		// Call it by using $props
	};
};
