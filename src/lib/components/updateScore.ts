export async function UpdateScore(id: string | null = null, score: number | null = null) {
	// This function can't run if you don't give it an id and a score
	if (!id || score === null) {
		throw new Error('You need to give id or score');
	}
	return await fetch('/api/update-score', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ id, score })
	});
}
