import { getUserRanking } from '$lib/server/getTursoClient';

export const load = async ({ platform }) => {
	try {
		const { columns, rows } = await getUserRanking(platform?.env);
		console.log('@leaderboard => Retrieved users:', columns, rows);
		return {
			columns,
			rows
			// These datas are passed to the +page.svelte file in the same folder
		};
	} catch (error) {
		console.error('@leaderboard => Failed to load ranking:', error);
		return {
			columns: [],
			rows: []
		};
	}
};
