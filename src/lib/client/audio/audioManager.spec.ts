import { beforeEach, describe, expect, it, vi } from 'vitest'

type MockAudioInstance = {
	src: string
	preload: string
	volume: number
	currentTime: number
	loop: boolean
	load: ReturnType<typeof vi.fn>
	play: ReturnType<typeof vi.fn>
}

let audioInstances: MockAudioInstance[] = []

function installAudioMock(): void {
	class MockAudio {
		src: string
		preload = ''
		volume = 1
		currentTime = 0
		loop = false
		load = vi.fn()
		play = vi.fn()

		constructor(src: string) {
			this.src = src
			audioInstances.push(this)
		}
	}

	vi.stubGlobal('Audio', MockAudio as unknown as typeof Audio)
}

async function loadAudioManager(): Promise<typeof import('./audioManager')> {
	vi.doMock('$app/environment', () => ({
		browser: true,
	}))
	return import('./audioManager')
}

async function loadAudioManagerWithBrowser(
	browser: boolean,
): Promise<typeof import('./audioManager')> {
	vi.doMock('$app/environment', () => ({
		browser,
	}))
	return import('./audioManager')
}

describe('audioManager', () => {
	beforeEach(() => {
		audioInstances = []
		vi.resetModules()
		installAudioMock()
	})

	it('lazy-initializes and reuses hover sound', async () => {
		const module = await loadAudioManager()

		module.playHover()
		module.playHover()

		expect(audioInstances).toHaveLength(1)
		expect(audioInstances[0]?.src).toBe('/audio/shimmer.ogg')
		expect(audioInstances[0]?.preload).toBe('auto')
		expect(audioInstances[0]?.volume).toBe(0.5)
		expect(audioInstances[0]?.load).toHaveBeenCalledTimes(1)
		expect(audioInstances[0]?.play).toHaveBeenCalledTimes(2)
		expect(audioInstances[0]?.currentTime).toBe(0)
	})

	it('configures home page bgm with music volume and loop', async () => {
		const module = await loadAudioManager()

		const bgm = module.getHomePageBgm()
		const bgmAgain = module.getHomePageBgm()

		expect(bgm).toBeDefined()
		expect(bgmAgain).toBe(bgm)
		expect(audioInstances).toHaveLength(1)
		expect(audioInstances[0]?.src).toBe('audio/AFTERGLOW.ogg')
		expect(audioInstances[0]?.volume).toBe(0.2)
		expect(audioInstances[0]?.loop).toBe(true)
	})

	it('applies setAllSoundVolumes only to initialized sounds', async () => {
		const module = await loadAudioManager()

		module.playHover()
		module.playClick()
		module.setAllSoundVolumes(0.8)

		expect(audioInstances).toHaveLength(2)
		expect(audioInstances[0]?.volume).toBe(0.8)
		expect(audioInstances[1]?.volume).toBe(0.8)
	})

	it('playCountdownTick uses the correct-answer sound effect', async () => {
		const module = await loadAudioManager()

		module.playCountdownTick()

		expect(audioInstances).toHaveLength(1)
		expect(audioInstances[0]?.src).toBe('/audio/correct-answer.ogg')
		expect(audioInstances[0]?.play).toHaveBeenCalledTimes(1)
	})

	it('plays popup and times-up effects', async () => {
		const module = await loadAudioManager()

		module.playPopUp()
		module.playTimesUp()

		expect(audioInstances).toHaveLength(2)
		expect(audioInstances[0]?.src).toBe('/audio/confirm-cancel-button.ogg')
		expect(audioInstances[0]?.play).toHaveBeenCalledTimes(1)
		expect(audioInstances[1]?.src).toBe('/audio/time-is-up.ogg')
		expect(audioInstances[1]?.play).toHaveBeenCalledTimes(1)
	})

	it('plays wrong and back effects', async () => {
		const module = await loadAudioManager()

		module.playWrong()
		module.playBack()

		expect(audioInstances).toHaveLength(2)
		expect(audioInstances[0]?.src).toBe('/audio/wrong-answer.ogg')
		expect(audioInstances[0]?.play).toHaveBeenCalledTimes(1)
		expect(audioInstances[1]?.src).toBe('/audio/go-back-sound.ogg')
		expect(audioInstances[1]?.play).toHaveBeenCalledTimes(1)
	})

	it('does nothing when not running in browser', async () => {
		const module = await loadAudioManagerWithBrowser(false)

		module.playHover()
		module.playClick()
		module.playCorrect()
		module.playWrong()
		module.playBack()
		module.playPopUp()
		module.playTimesUp()
		module.playCountdownTick()

		expect(module.getHomePageBgm()).toBeUndefined()
		expect(audioInstances).toHaveLength(0)
	})
})
