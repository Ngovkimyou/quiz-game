<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';

	let audio: HTMLAudioElement;
	let isPlaying = false;

	onMount(() => {
		audio = new Audio('/AFTERGLOW.mp3');
		audio.loop = true;
		audio.volume = 0.2;
	});

	onDestroy(() => {
		if (audio) {
			audio.pause();
			audio.currentTime = 0;
		}
	});

	function startGame() {
		goto('/game');
	}

	function goLeaderboard() {
		goto('/leaderboard');
	}

	function toggleMusic() {
		if (!isPlaying) {
			audio.play();
			isPlaying = true;
		} else {
			audio.pause();
			isPlaying = false;
		}
	}
</script>

<div
	class="relative min-h-screen overflow-hidden bg-linear-to-b from-indigo-950 via-slate-950 to-black text-white"
>
	<!-- Entire Background Stars -->
	<div class="stars-small"></div>
	<div class="stars-medium"></div>
	<div class="stars-large"></div>

	<!-- Cat Image at the bottom of the screen -->
	<div class="pointer-events-none absolute right-0 bottom-0 left-0 z-20 flex justify-center">
		<img src="../img/home-footer.png" alt="Bottom decoration" class="max-w-full" />
	</div>

	<!-- Content -->
	<div
		class="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 text-center"
	>
		<h1
			class="rampart-one-regular animate-pulse text-4xl font-extrabold tracking-wide drop-shadow-xl md:text-6xl"
		>
			早押し日本語クイズ
		</h1>

		<div class="mt-20 flex flex-col gap-6 md:flex-col">
			<button
				on:click={startGame}
				class="group relative cursor-pointer overflow-hidden rounded-md border border-slate-700 bg-slate-900/80 px-12 py-4 font-medium text-white transition-all duration-300 hover:border-indigo-500 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]"
			>
				<div
					class="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-indigo-500/30 to-transparent transition-transform duration-1000 ease-in-out group-hover:translate-x-full"
				></div>

				<span class="relative flex animate-pulse items-center gap-2">
					<span
						class="h-2 w-2 rounded-full bg-indigo-500 group-hover:bg-indigo-400 group-hover:shadow-[0_0_8px_#6366f1]"
					></span>
					START GAME
				</span>
			</button>

			<button
				on:click={goLeaderboard}
				class="group relative cursor-pointer overflow-hidden rounded-md border border-slate-700 bg-slate-900/80 px-12 py-4 font-medium text-white transition-all duration-300 hover:border-indigo-500 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]"
			>
				<div
					class="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-indigo-500/30 to-transparent transition-transform duration-1000 ease-in-out group-hover:translate-x-full"
				></div>

				<span class="relative z-10 flex animate-pulse items-center gap-2">
					<span
						class="h-2 w-2 rounded-full bg-yellow-500 group-hover:bg-yellow-400 group-hover:shadow-[0_0_8px_#6366f1]"
					></span>
					LEADERBOARD
				</span>
			</button>
		</div>

		<button
			on:click={toggleMusic}
			class="mt-8 cursor-pointer text-sm text-slate-400 transition hover:text-indigo-400"
		>
			{isPlaying ? '🔊 Music On' : '🔇 Music Off'}
		</button>
	</div>
</div>
