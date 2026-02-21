import { getUserRanking } from '$lib/server/getTursoClient';

export const load = async () => {
    const {columns, rows} = await getUserRanking();
    console.log("@leaderboard => Retrieved users:", columns, rows);
    return {
        columns,
        rows // This is passed to the .svelte file
    };
};