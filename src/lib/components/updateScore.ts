// By the way, when you call this function, the api it called will sent a cookie that record the user name to the browser
export async function UpdateScore(name: string, score: number | null = null) {
	// This function can't run if you don't give it an id and a score
	if (!name && score === null) {
		throw new Error('You need to give name and score');
	} else {
		// Convert name to string just to be safe cause people might name themselve as number
		name = name.toString();
		// Convert score to number just to be safe
		score = Number(score);
		const result = await fetch('/api/update-score', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			//Sent name and score to src/routes/api/update-score
			body: JSON.stringify({ name, score })
		});

		console.log('Data Recieved @updateScore: ', result);
		return result;
	}
}
