import { getUserRanking } from '$lib/server/getTursoClient'

export const load = async ({ platform, locals }) => {
	try {
		const { columns, rows } = await getUserRanking(platform?.env)
		console.log('@leaderboard => Retrieved users:', columns, rows)
		return {
			columns,
			rows,
			currentUserId: locals.id?.toString() ?? undefined,
			currentUserName: locals.name ?? undefined,
			// These datas are passed to the +page.svelte file in the same folder
		}
	} catch (error) {
		console.error('@leaderboard => Failed to load ranking:', error)
		return {
			columns: [],
			rows: [],
			currentUserId: locals.id?.toString() ?? undefined,
			currentUserName: locals.name ?? undefined,
		}
	}
}
