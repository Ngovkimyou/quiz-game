import { getTursoClient } from '$lib/server/getTursoClient';

const db = getTursoClient();
export async function POST({ request }: { request: Request }) {
    const { id, score } = await request.json();
    console.log("@update-score => Received data:", { id, score });
    if (!id || typeof score !== 'number') {
        console.error("@update-score => Invalid data:", { id, score });
        return new Response(JSON.stringify({ error: 'Invalid data' }), { status: 400 });
    }else {
        await db.execute({
            sql: "UPDATE `quiz-ranking` SET score = ? WHERE id = ?",
            args: [score, id]
            
        });
        console.log("@update-score => Score updated successfully for id:", id);
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    }   
}