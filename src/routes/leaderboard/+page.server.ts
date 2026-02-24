import { getUserRanking } from '$lib/server/getTursoClient';

export const load = async () => {
	const { columns, rows } = await getUserRanking();
	console.log('@leaderboard => Retrieved users:', columns, rows);
	return {
		columns,
		rows
		// These datas are passed to the +page.svelte file in the same folder
	};
};
