import { browser } from '$app/environment';

const GAME_BGM_SRC = '/audio/quiz-music.ogg';
const GAME_BGM_VOLUME = 0.3;

let gameBgm: HTMLAudioElement | null = null;

function getGameBgm() {
	if (!browser) return null;
	if (!gameBgm) {
		gameBgm = new Audio(GAME_BGM_SRC);
		gameBgm.preload = 'auto';
		gameBgm.loop = false;
		gameBgm.volume = GAME_BGM_VOLUME;
		gameBgm.load();
		gameBgm.addEventListener('error', () => {
			console.warn('Failed to load game BGM:', GAME_BGM_SRC);
		});
	}
	return gameBgm;
}

export async function startGameBgm() {
	const audio = getGameBgm();
	if (!audio || !audio.paused) return;

	try {
		await audio.play();
	} catch {
		// Browser autoplay policy may block this until user interaction.
	}
}

export async function restartGameBgm() {
	const audio = getGameBgm();
	if (!audio) return;

	audio.pause();
	audio.currentTime = 0;
	await startGameBgm();
}

export function stopGameBgm() {
	const audio = getGameBgm();
	if (!audio) return;

	audio.pause();
	audio.currentTime = 0;
}
