import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	return {
		name: locals.name,
		score: locals.score,
		registered_date: locals.registered_date,
	};
};
