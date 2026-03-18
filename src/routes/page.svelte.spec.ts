import { page } from 'vitest/browser'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import Page from './+page.svelte'

const mocks = vi.hoisted(() => {
	const homeAudio = {
		play: vi.fn(),
		pause: vi.fn(),
		currentTime: 5,
	}

	return {
		homeAudio,
		resolve: vi.fn((path: string) => path),
		goto: vi.fn(),
		stopGameBgm: vi.fn(),
		playHover: vi.fn(),
		playClick: vi.fn(),
		getHomePageBgm: vi.fn(() => homeAudio),
	}
})

vi.mock('$app/navigation', () => ({
	goto: mocks.goto,
}))

vi.mock('$app/paths', () => ({
	resolve: mocks.resolve,
}))

vi.mock('$lib/client/audio/gameBgm', () => ({
	stopGameBgm: mocks.stopGameBgm,
}))

vi.mock('$lib/client/audio/audioManager', () => ({
	playHover: mocks.playHover,
	playClick: mocks.playClick,
	getHomePageBgm: mocks.getHomePageBgm,
}))

describe('/+page.svelte', () => {
	beforeEach(() => {
		mocks.homeAudio.currentTime = 5
		mocks.homeAudio.play.mockClear()
		mocks.homeAudio.pause.mockClear()
		mocks.resolve.mockClear()
		mocks.goto.mockClear()
		mocks.stopGameBgm.mockClear()
		mocks.playHover.mockClear()
		mocks.playClick.mockClear()
		mocks.getHomePageBgm.mockClear()
	})

	it('should render h1', async () => {
		render(Page)

		const heading = page.getByRole('heading', { level: 1 })
		await expect.element(heading).toBeInTheDocument()
	})

	it('stops game bgm and gets home bgm on mount', async () => {
		render(Page)

		expect(mocks.stopGameBgm).toHaveBeenCalledTimes(1)
		expect(mocks.getHomePageBgm).toHaveBeenCalledTimes(1)
	})

	it('starts game when clicking START GAME', async () => {
		render(Page)

		await page.getByRole('button', { name: 'START GAME' }).click()

		expect(mocks.resolve).toHaveBeenCalledWith('/game')
		expect(mocks.goto).toHaveBeenCalledWith('/game')
		expect(mocks.playClick).toHaveBeenCalledTimes(1)
	})

	it('goes to leaderboard when clicking LEADERBOARD', async () => {
		render(Page)

		await page.getByRole('button', { name: 'LEADERBOARD' }).click()

		expect(mocks.resolve).toHaveBeenCalledWith('/leaderboard')
		expect(mocks.goto).toHaveBeenCalledWith('/leaderboard')
		expect(mocks.playClick).toHaveBeenCalledTimes(1)
	})

	it('toggles music button and plays click sound', async () => {
		render(Page)

		const offButton = page.getByRole('button', { name: /Music Off/i })
		await offButton.click()
		expect(mocks.homeAudio.play).toHaveBeenCalledTimes(1)
		expect(mocks.playClick).toHaveBeenCalledTimes(1)

		const onButton = page.getByRole('button', { name: /Music On/i })
		await expect.element(onButton).toBeInTheDocument()

		await onButton.click()
		expect(mocks.homeAudio.pause).toHaveBeenCalledTimes(1)
		expect(mocks.playClick).toHaveBeenCalledTimes(2)
		await expect.element(page.getByRole('button', { name: /Music Off/i })).toBeInTheDocument()
	})

	it('cleans up home audio on unmount', async () => {
		const view = render(Page)

		await view.unmount()

		expect(mocks.homeAudio.pause).toHaveBeenCalled()
		expect(mocks.homeAudio.currentTime).toBe(0)
	})
})
