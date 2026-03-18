import { beforeEach, describe, expect, it, vi } from 'vitest'

type EventListener = () => void

type MockAudioInstance = {
	src: string
	preload: string
	volume: number
	currentTime: number
	loop: boolean
	paused: boolean
	load: ReturnType<typeof vi.fn>
	play: ReturnType<typeof vi.fn>
	pause: ReturnType<typeof vi.fn>
	addEventListener: ReturnType<typeof vi.fn>
	listeners: Record<string, EventListener | undefined>
}

let audioInstances: MockAudioInstance[] = []

function installAudioMock(playImpl?: (instance: MockAudioInstance) => Promise<void>): void {
	class MockAudio {
		src: string
		preload = ''
		volume = 1
		currentTime = 0
		loop = false
		paused = true
		listeners: Record<string, EventListener | undefined> = {}
		load = vi.fn()
		pause = vi.fn(() => {
			this.paused = true
		})
		play = vi.fn(async (): Promise<void> => {
			if (playImpl) {
				return playImpl(this)
			}
			this.paused = false
		})
		addEventListener = vi.fn((type: string, listener: EventListener) => {
			this.listeners[type] = listener
		})

		constructor(src: string) {
			this.src = src
			audioInstances.push(this)
		}
	}

	vi.stubGlobal('Audio', MockAudio as unknown as typeof Audio)
}

async function loadGameBgmWithBrowser(browser: boolean): Promise<typeof import('./gameBgm')> {
	vi.doMock('$app/environment', () => ({ browser }))
	return import('./gameBgm')
}

describe('gameBgm', () => {
	beforeEach(() => {
		audioInstances = []
		vi.resetModules()
	})

	it('initializes audio once and starts when paused', async () => {
		installAudioMock()
		const module = await loadGameBgmWithBrowser(true)

		await module.startGameBgm()
		await module.startGameBgm()

		expect(audioInstances).toHaveLength(1)
		expect(audioInstances[0]?.src).toBe('/audio/quiz-music.ogg')
		expect(audioInstances[0]?.preload).toBe('auto')
		expect(audioInstances[0]?.loop).toBe(false)
		expect(audioInstances[0]?.volume).toBe(0.3)
		expect(audioInstances[0]?.load).toHaveBeenCalledTimes(1)
		expect(audioInstances[0]?.play).toHaveBeenCalledTimes(1)
		expect(audioInstances[0]?.addEventListener).toHaveBeenCalledWith('error', expect.any(Function))
	})

	it('restart pauses, rewinds, and starts again', async () => {
		installAudioMock()
		const module = await loadGameBgmWithBrowser(true)

		await module.startGameBgm()
		expect(audioInstances[0]?.paused).toBe(false)
		audioInstances[0]!.currentTime = 8

		await module.restartGameBgm()

		expect(audioInstances[0]?.pause).toHaveBeenCalledTimes(1)
		expect(audioInstances[0]?.currentTime).toBe(0)
		expect(audioInstances[0]?.play).toHaveBeenCalledTimes(2)
	})

	it('stop pauses and rewinds', async () => {
		installAudioMock()
		const module = await loadGameBgmWithBrowser(true)

		await module.startGameBgm()
		audioInstances[0]!.currentTime = 12

		module.stopGameBgm()

		expect(audioInstances[0]?.pause).toHaveBeenCalledTimes(1)
		expect(audioInstances[0]?.currentTime).toBe(0)
	})

	it('swallows autoplay play errors', async () => {
		installAudioMock(async () => {
			throw new Error('autoplay blocked')
		})
		const module = await loadGameBgmWithBrowser(true)

		await expect(module.startGameBgm()).resolves.toBeUndefined()
		expect(audioInstances).toHaveLength(1)
		expect(audioInstances[0]?.play).toHaveBeenCalledTimes(1)
	})

	it('logs warning when audio emits error event', async () => {
		installAudioMock()
		const module = await loadGameBgmWithBrowser(true)
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

		await module.startGameBgm()
		audioInstances[0]?.listeners['error']?.()

		expect(warnSpy).toHaveBeenCalledWith('Failed to load game BGM:', '/audio/quiz-music.ogg')
		warnSpy.mockRestore()
	})

	it('no-ops when not in browser', async () => {
		installAudioMock()
		const module = await loadGameBgmWithBrowser(false)

		await module.startGameBgm()
		await module.restartGameBgm()
		module.stopGameBgm()

		expect(audioInstances).toHaveLength(0)
	})
})
