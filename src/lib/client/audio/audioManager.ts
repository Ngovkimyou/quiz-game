import { browser } from '$app/environment'

export const AUDIO_PATHS = {
	SHIMMER: '/audio/shimmer.ogg',
	BUTTON_CLICK: '/audio/button-click.ogg',
	CORRECT_ANSWER: '/audio/correct-answer.ogg',
	WRONG_ANSWER: '/audio/wrong-answer.ogg',
	GO_BACK_SOUND: '/audio/go-back-sound.ogg',
	CONFIRM_CANCEL_BUTTON: '/audio/confirm-cancel-button.ogg',
	TIME_IS_UP: '/audio/time-is-up.ogg',
	AFTERGLOW: 'audio/AFTERGLOW.ogg',
	QUIZ_MUSIC: '/audio/quiz-music.ogg',
} as const

const DEFAULT_SOUND_VOLUME = 0.5
const MUSIC_VOLUME = 0.2

// Audio instances (lazy-loaded)
let hoverSound: HTMLAudioElement | undefined = undefined
let clickSound: HTMLAudioElement | undefined = undefined
let correctSound: HTMLAudioElement | undefined = undefined
let wrongSound: HTMLAudioElement | undefined = undefined
let backSound: HTMLAudioElement | undefined = undefined
let popUpSound: HTMLAudioElement | undefined = undefined
let timesUpSound: HTMLAudioElement | undefined = undefined
let homePageAudio: HTMLAudioElement | undefined = undefined

// Initialize audio instance with common settings
function createAudioInstance(
	path: string,
	volume: number = DEFAULT_SOUND_VOLUME,
): HTMLAudioElement {
	const audio = new Audio(path)
	audio.preload = 'auto'
	audio.volume = volume
	audio.load()
	return audio
}

// Lazy initialization helpers
function getHoverSound(): HTMLAudioElement | undefined {
	if (!browser) return undefined
	if (!hoverSound) {
		hoverSound = createAudioInstance(AUDIO_PATHS.SHIMMER)
	}
	return hoverSound
}

function getClickSound(): HTMLAudioElement | undefined {
	if (!browser) return undefined
	if (!clickSound) {
		clickSound = createAudioInstance(AUDIO_PATHS.BUTTON_CLICK)
	}
	return clickSound
}

function getCorrectSound(): HTMLAudioElement | undefined {
	if (!browser) return undefined
	if (!correctSound) {
		correctSound = createAudioInstance(AUDIO_PATHS.CORRECT_ANSWER)
	}
	return correctSound
}

function getWrongSound(): HTMLAudioElement | undefined {
	if (!browser) return undefined
	if (!wrongSound) {
		wrongSound = createAudioInstance(AUDIO_PATHS.WRONG_ANSWER)
	}
	return wrongSound
}

function getBackSound(): HTMLAudioElement | undefined {
	if (!browser) return undefined
	if (!backSound) {
		backSound = createAudioInstance(AUDIO_PATHS.GO_BACK_SOUND)
	}
	return backSound
}

function getPopUpSound(): HTMLAudioElement | undefined {
	if (!browser) return undefined
	if (!popUpSound) {
		popUpSound = createAudioInstance(AUDIO_PATHS.CONFIRM_CANCEL_BUTTON)
	}
	return popUpSound
}

function getTimesUpSound(): HTMLAudioElement | undefined {
	if (!browser) return undefined
	if (!timesUpSound) {
		timesUpSound = createAudioInstance(AUDIO_PATHS.TIME_IS_UP)
	}
	return timesUpSound
}

function getHomePageAudio(): HTMLAudioElement | undefined {
	if (!browser) return undefined
	if (!homePageAudio) {
		homePageAudio = createAudioInstance(AUDIO_PATHS.AFTERGLOW, MUSIC_VOLUME)
		homePageAudio.loop = true
	}
	return homePageAudio
}

// Sound effect functions
export function playHover(): void {
	const sound = getHoverSound()
	if (sound) {
		sound.currentTime = 0
		sound.play()
	}
}

export function playClick(): void {
	const sound = getClickSound()
	if (sound) {
		sound.currentTime = 0
		sound.play()
	}
}

export function playCorrect(): void {
	const sound = getCorrectSound()
	if (sound) {
		sound.currentTime = 0
		sound.play()
	}
}

export function playWrong(): void {
	const sound = getWrongSound()
	if (sound) {
		sound.currentTime = 0
		sound.play()
	}
}

export function playBack(): void {
	const sound = getBackSound()
	if (sound) {
		sound.currentTime = 0
		sound.play()
	}
}

export function playPopUp(): void {
	const sound = getPopUpSound()
	if (sound) {
		sound.currentTime = 0
		sound.play()
	}
}

export function playTimesUp(): void {
	const sound = getTimesUpSound()
	if (sound) {
		sound.currentTime = 0
		sound.play()
	}
}

export function getHomePageBgm(): HTMLAudioElement | undefined {
	return getHomePageAudio()
}

// Utility function to play a countdown tick
export function playCountdownTick(): void {
	playCorrect()
}

// Set all sound effect volumes
export function setAllSoundVolumes(volume: number): void {
	;[hoverSound, clickSound, correctSound, wrongSound, backSound, popUpSound, timesUpSound].forEach(
		(sound) => {
			if (sound) sound.volume = volume
		},
	)
}
