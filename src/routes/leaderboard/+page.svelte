<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import type { PageData } from './$types';

	import { resolve } from '$app/paths';
	const { data } = $props<{ data: PageData }>();

	let showCreditsModal = $state(false);

	let backSound: HTMLAudioElement | null = null;
	let popUpSound: HTMLAudioElement | null = null;

	if (browser) {
		backSound = new Audio('/audio/go-back-sound.ogg');
		popUpSound = new Audio('/audio/confirm-cancel-button.wav');
	}

	function playBack() {
		if (backSound) {
			backSound.currentTime = 0;
			backSound.play();
		}
	}

	function playPopUp() {
		if (popUpSound) {
			popUpSound.currentTime = 0;
			popUpSound.play();
		}
	}

	onMount(() => {
		const sounds = [backSound, popUpSound];

		sounds.forEach((sound) => {
			if (sound) sound.volume = 0.5;
		});
	});
</script>

<div
	class="relative min-h-screen overflow-hidden bg-linear-to-b from-indigo-950 via-slate-950 to-black text-white"
>
	<!-- 🌌 Star Background -->
	<div class="stars-small"></div>
	<div class="stars-medium"></div>
	<div class="stars-large"></div>

	<div class="relative z-10 mt-40 mb-10 px-12">
		<!-- HEADER -->
		<div
			class="fixed top-0 left-0 z-50 w-full border-b border-slate-800 bg-black/10 py-3 backdrop-blur-xl"
		>
			<div class="flex items-center justify-between px-12 py-6">
				<button
					onclick={() => {
						goto(resolve('/'));
						playBack();
					}}
					class="cursor-pointer text-lg text-white transition hover:text-indigo-400"
				>
					← Back
				</button>

				<h1 class="text-center text-2xl font-bold md:text-3xl">🏆 Leaderboard</h1>

				<!-- PUSH THE TITLE TO MID -->
				<button
					onclick={() => {
						showCreditsModal = true;
						playPopUp();
					}}
					class="w-16 cursor-pointer text-lg text-gray-400 italic transition hover:text-indigo-400"
				>
					credits
				</button>
			</div>
		</div>

		{#if data.rows.length === 0}
			<div class="mt-20 text-center text-slate-400">No scores yet. Go play the game!</div>
		{:else}
			<!-- Top 3 (podium order: 2, 1, 3) -->
			{@const top3 = data.rows.slice(0, 3)}
			{@const podium =
				top3.length === 3
					? [
							{ ...top3[1], rank: 2 }, // left
							{ ...top3[0], rank: 1 }, // middle
							{ ...top3[2], rank: 3 } // right
						]
					: top3.length === 2
						? [
								{ ...top3[1], rank: 2 }, // left
								{ ...top3[0], rank: 1 } // middle
							]
						: [{ ...top3[0], rank: 1 }]}

			<div class="mx-auto mb-20 grid max-w-5xl gap-4 md:grid-cols-3">
				{#each podium as row (row.id)}
					<div
						class="group relative cursor-pointer rounded-3xl p-8 text-center
backdrop-blur-xl transition-all duration-500 hover:-translate-y-2
hover:scale-105 hover:shadow-2xl
{row.rank === 1
							? 'flex flex-col items-center justify-center border border-yellow-400 bg-yellow-500/20 hover:shadow-yellow-400/40 md:scale-100'
							: row.rank === 2
								? 'mt-20 border border-gray-400 bg-gray-300/10 hover:shadow-gray-400/40'
								: 'mt-20 border border-orange-500 bg-orange-600/20 hover:shadow-orange-500/40'}"
					>
						<div
							class="absolute inset-0 rounded-3xl opacity-0 blur-xl transition duration-500 group-hover:opacity-100
{row.rank === 1 ? 'bg-yellow-400/20' : row.rank === 2 ? 'bg-gray-400/20' : 'bg-orange-500/20'}"
						></div>

						<div class="mb-2 text-2xl font-bold">#{row.rank}</div>

						<div class="text-xl font-semibold">{row.name}</div>

						<div class="mt-4 text-3xl font-bold">{row.score}</div>

						<div class="mt-2 text-sm text-slate-400">{row.registered_date}</div>
					</div>
				{/each}
			</div>

			<!-- Remaining Rankings -->
			<div class="mx-auto max-w-4xl space-y-4">
				{#each data.rows.slice(3) as row, index (row.id)}
					<div
						class="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-900/60 p-5 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:border-indigo-500"
					>
						<div class="flex items-center gap-6">
							<div class="text-lg font-bold text-indigo-400">#{index + 4}</div>

							<div>
								<div class="font-semibold">{row.name}</div>
								<div class="text-xs text-slate-400">{row.registered_date}</div>
							</div>
						</div>

						<div class="text-lg font-bold">{row.score}</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	{#if showCreditsModal}
		<!-- OVERLAY + CLICK AREA -->
		<div
			class="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm"
			onclick={() => (showCreditsModal = false)}
		>
			<!-- MODAL -->
			<div
				class="z-50 w-full max-w-md animate-[pop_0.25s_ease-out] rounded-3xl border border-slate-700 bg-slate-900 p-8 shadow-2xl"
				role="dialog"
				aria-modal="true"
				onclick={(e) => e.stopPropagation()}
			>
				<h2 class="mb-6 text-center text-2xl font-bold">Credits</h2>

				<div class="space-y-2 text-slate-300">
					<p><span class="font-semibold text-white">Elsewin</span>: Back-end Developer</p>
					<p>
						<span class="font-semibold text-white">Mouyheang</span>: Front-end Developer |
						Illustrator
					</p>
					<p><span class="font-semibold text-white">Kimyoo</span>: Team Manager | Code Reviewer</p>
					<p>
						<span class="font-semibold text-white">Phearith</span>: Data Collector | Leader
						Assistant
					</p>
				</div>

				<button
					class="mt-6 w-full rounded-xl bg-indigo-600 py-2 font-semibold transition hover:bg-indigo-500"
					onclick={() => {
						showCreditsModal = false;
						playPopUp();
					}}
				>
					Close
				</button>
			</div>
		</div>
	{/if}
</div>
