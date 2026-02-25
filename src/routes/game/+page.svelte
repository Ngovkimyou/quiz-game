<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { UpdateScore } from '$lib/components/updateScore';
	import { browser } from '$app/environment';

	// 🎵 SOUND EFFECTS
	let hoverSound: HTMLAudioElement | null = null;
	let correctSound: HTMLAudioElement | null = null;
	let wrongSound: HTMLAudioElement | null = null;
	let backSound: HTMLAudioElement | null = null;
	let popUpSound: HTMLAudioElement | null = null;
	let clickSound: HTMLAudioElement | null = null;
	let timesUpSound: HTMLAudioElement | null = null;

	if (browser) {
		hoverSound = new Audio('/audio/shimmer.mp3');
		correctSound = new Audio('/audio/correct-answer.wav');
		wrongSound = new Audio('/audio/wrong-answer.mp3');
		backSound = new Audio('/audio/go-back-sound.ogg');
		popUpSound = new Audio('/audio/confirm-cancel-button.wav');
		clickSound = new Audio('/audio/button-click.wav');
		timesUpSound = new Audio('/audio/time-is-up.mp3');
	}

	function playHover() {
		if (hoverSound) {
			hoverSound.currentTime = 0;
			hoverSound.play();
		}
	}

	function playCorrect() {
		if (correctSound) {
			correctSound.currentTime = 0;
			correctSound.play();
		}
	}

	function playWrong() {
		if (wrongSound) {
			wrongSound.currentTime = 0;
			wrongSound.play();
		}
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

	function playClick() {
		if (clickSound) {
			clickSound.currentTime = 0;
			clickSound.play();
		}
	}

	function playAlarm() {
		if (timesUpSound) {
			timesUpSound.currentTime = 0;
			timesUpSound.play();
		}
	}

	onMount(() => {
		const sounds = [
			hoverSound,
			correctSound,
			wrongSound,
			backSound,
			popUpSound,
			clickSound,
			timesUpSound
		];

		sounds.forEach((sound) => {
			if (sound) sound.volume = 0.5;
		});
	});

	import { resolve } from '$app/paths';
	type Question = {
		question: string;
		choices: string[];
		answerIndex: number;
	};

	let questions: Question[] = [];
	let loading = true;

	// SHUFFLE QUESTIONS
	function shuffleQuestions<T>(array: T[]): T[] {
		const result = [...array]; // copy
		for (let i = result.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[result[i], result[j]] = [result[j], result[i]];
		}
		return result;
	}

	onMount(async () => {
		try {
			const res = await fetch('/questions.json');
			const data: Question[] = await res.json();
			questions = shuffleQuestions(data);
		} catch (err) {
			console.error('Failed to load questions', err);
		} finally {
			loading = false;
			startTimer();
		}
	});

	let showSaveModal = false;
	let playerName = '';

	let currentIndex = 0;
	let score = 0;
	let selectedIndex: number | null = null;
	let showResult = false;
	let gameOver = false;

	// ⏳ TIMER
	let timeLeft = 60;
	let timer: ReturnType<typeof setInterval>;

	function startTimer() {
		timer = setInterval(() => {
			if (timeLeft > 0) {
				timeLeft--;
			} else {
				playAlarm();
				gameOver = true;
				clearInterval(timer);
			}
		}, 1000);
	}

	onDestroy(() => {
		clearInterval(timer);
	});

	function selectAnswer(index: number) {
		if (showResult || gameOver) return;

		selectedIndex = index;
		showResult = true;

		if (index === questions[currentIndex].answerIndex) {
			score += 100;
			playCorrect();
		} else {
			playWrong();
		}

		setTimeout(() => {
			nextQuestion();
		}, 800);
	}

	function nextQuestion() {
		if (currentIndex < questions.length - 1) {
			currentIndex++;
			selectedIndex = null;
			showResult = false;
		} else {
			playAlarm();
			gameOver = true;
			clearInterval(timer);
		}
	}

	function restartGame() {
		currentIndex = 0;
		score = 0;
		selectedIndex = null;
		showResult = false;
		gameOver = false;
		timeLeft = 60;

		clearInterval(timer);
		timer = setInterval(() => {
			if (timeLeft > 0) {
				timeLeft--;
			} else {
				playAlarm();
				gameOver = true;
				clearInterval(timer);
			}
		}, 1000);
	}

	async function saveScore() {
		if (!playerName.trim()) return;

		await UpdateScore(playerName.trim(), score);

		showSaveModal = false;
		playerName = '';
		goto(resolve('/leaderboard'));
	}

	function goHome() {
		goto(resolve('/'));
	}

	$: timerPercent = (timeLeft / 60) * 100;

	$: rank =
		score >= 3000
			? '神速 (God Speed)'
			: score >= 1500
				? '迅速マスター'
				: score >= 1000
					? 'チャレンジャー'
					: '初心者';
</script>

<div
	class="relative min-h-screen overflow-hidden bg-linear-to-b from-indigo-950 via-slate-950 to-black text-white"
>
	<!-- Star Background -->
	<div class="stars-small"></div>
	<div class="stars-medium"></div>
	<div class="stars-large"></div>

	<!-- Top Bar -->
	<div class="relative z-10 flex items-center px-12 py-10 text-sm">
		<button
			on:click={() => {
				playBack();
				goHome();
			}}
			class="cursor-pointer text-lg text-white transition hover:text-indigo-400"
		>
			← Back
		</button>

		<div class="absolute left-1/2 -translate-x-1/2 text-center">
			<span
				class="text-xl font-bold
			{timeLeft <= 10 ? 'animate-pulse text-red-500' : 'text-indigo-400'}"
			>
				⏳ {timeLeft}s
			</span>
		</div>

		<div class="ml-auto text-lg text-white">
			Score: {score}
		</div>
	</div>

	<!-- ⏳ TIMER BAR -->
	<div class="relative z-10 px-6">
		<div class="h-2 overflow-hidden rounded-full bg-slate-800">
			<div
				class="h-full bg-linear-to-r {timeLeft <= 10
					? 'animate-pulse from-yellow-500 via-orange-500 to-red-500'
					: 'from-indigo-500 via-purple-500 to-pink-500'} transition-all duration-1000"
				style="width: {timerPercent}%"
			></div>
		</div>
	</div>

	<div class="relative z-10 mt-24 flex flex-col items-center justify-center px-6 text-center">
		<!-- LOADING SCREEN -->
		{#if loading}
			<div class="loading-fade flex min-h-[60vh] flex-col items-center justify-center gap-6">
				<!-- Spinner -->
				<div class="relative h-20 w-20">
					<div
						class="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-400"
					></div>
					<div class="absolute inset-2 rounded-full bg-indigo-400/10 blur-xl"></div>
				</div>

				<!-- Text -->
				<p class="text-2xl font-semibold tracking-widest text-indigo-300">Loading Questions…</p>

				<p class="text-sm text-slate-400">Preparing your challenge</p>
			</div>
		{:else if !gameOver}
			<!-- QUESTIONS -->
			<h2 class="mb-16 max-w-3xl text-3xl font-semibold md:text-4xl">
				{questions[currentIndex].question}
			</h2>

			<!-- CHOICES -->
			<div class="space-y-6">
				{#each questions[currentIndex].choices as choice, index}
					<button
						on:click={() => selectAnswer(index)}
						class="group relative w-[75%] cursor-pointer rounded-2xl border bg-slate-900/60 p-6 text-left backdrop-blur-xl transition-all duration-300
			 hover:scale-[1.02]
			{selectedIndex === null
							? 'border-slate-700 hover:border-indigo-500'
							: index === questions[currentIndex].answerIndex
								? 'border-green-500 bg-green-600/20 text-green-300 hover:border-green-500'
								: selectedIndex === index
									? 'border-red-500 bg-red-600/20 text-red-300'
									: 'border-slate-700 '}"
					>
						<div class="flex items-center gap-4">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-full border
					{selectedIndex === null
									? 'border-slate-500 text-slate-300'
									: index === questions[currentIndex].answerIndex
										? 'border-green-500 text-green-300'
										: selectedIndex === index
											? 'border-red-500 text-red-300'
											: 'border-slate-500 text-slate-300'}"
							>
								{String.fromCharCode(65 + index)}
							</div>
							<span class="text-lg font-semibold">{choice}</span>
						</div>
					</button>
				{/each}
			</div>

			{#if showResult}
				<div class="mt-8 text-center">
					<p class="text-lg font-semibold">
						{selectedIndex === questions[currentIndex].answerIndex ? '✅ Correct!' : '❌ Wrong!'}
					</p>
				</div>
			{/if}
		{:else}
			<!-- GAME OVER SCREEN -->
			<div class=" flex flex-col items-center justify-center space-y-8 text-center">
				<h2 class="text-4xl font-bold tracking-wide text-indigo-400">⏰ TIME’S UP</h2>

				<div
					class="bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-7xl font-extrabold text-transparent"
				>
					{score}
				</div>

				<p class="text-lg tracking-widest text-slate-300">POINTS</p>

				<div class="mt-4 text-xl font-semibold text-white">
					🏆 Rank: {rank}
				</div>

				<div class="mt-10 flex gap-6">
					<button
						on:mouseenter={playHover}
						on:click={() => {
							playClick();
							showSaveModal = true;
						}}
						class="group relative cursor-pointer overflow-hidden rounded-full border border-indigo-400/50 bg-indigo-500/10 px-10 py-4 text-lg font-bold tracking-[0.2em] text-indigo-100 transition-all duration-300 hover:scale-105 hover:border-indigo-400 hover:bg-indigo-500/20 hover:shadow-[0_0_30px_rgba(129,140,248,0.4)]"
					>
						<div
							class="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full"
						></div>

						<span class="relative z-10 flex items-center gap-2">
							<span class="text-indigo-400">✧</span> SAVE SCORE
							<span class="text-indigo-400">✧</span>
						</span>
					</button>

					<button
						on:click={() => {
							playClick();
							restartGame();
						}}
						class="group relative cursor-pointer overflow-hidden rounded-full border border-slate-500 bg-slate-950/40 px-10 py-4 text-lg font-medium tracking-widest text-slate-400 transition-all duration-500 hover:scale-105 hover:border-white hover:text-white hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] active:scale-95"
					>
						<div
							class="absolute inset-0 z-0 bg-linear-to-b from-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
						></div>

						<span class="relative z-10 flex items-center gap-2">
							<span class="transition-transform duration-700 group-hover:rotate-180">↺</span>
							PLAY AGAIN
						</span>
					</button>
				</div>

				<button
					on:click={() => {
						playBack();
						goHome();
					}}
					class="mt-6 cursor-pointer text-slate-400 transition hover:text-indigo-400"
				>
					Back to Home
				</button>
			</div>
		{/if}
	</div>

	{#if showSaveModal}
		<!-- DARK OVERLAY -->
		<div class="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"></div>

		<!-- POP UP -->
		<div
			class="fixed inset-0 z-50 flex animate-[pop_0.25s_ease-out] items-center justify-center px-4"
		>
			<div class="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-8 shadow-2xl">
				<h2 class="mb-6 text-center text-2xl font-bold">🏆 Save Your Score</h2>

				<p class="mb-6 text-center text-xl font-bold">
					Score: {score}
				</p>

				<p class="mb-4 text-center text-slate-300">Enter your name:</p>

				<input
					type="text"
					bind:value={playerName}
					maxlength="20"
					placeholder="Your name..."
					class="w-full rounded-xl border border-slate-600 bg-slate-800 p-3 text-white outline-none focus:border-indigo-500"
				/>

				<div class="mt-6 flex justify-center gap-4">
					<!-- <button
						on:click={saveScore}
						class="flex-1 cursor-pointer border-2 border-green-500 bg-green-500/10 py-3 font-mono font-bold text-green-500 transition-all hover:bg-green-500 hover:text-black"
					>
						[ COMMIT_RECORD ]
					</button>

					<button
						on:click={() => (showSaveModal = false)}
						class="flex-1 cursor-pointer border-2 border-red-500 bg-red-500/10 py-3 font-mono font-bold text-red-500 transition-all hover:bg-red-500 hover:text-black"
					>
						[ ABORT_TASK ]
					</button> -->
					<button
						on:click={() => {
							playPopUp();
							saveScore();
						}}
						class="flex-1 cursor-pointer rounded-xl bg-indigo-600 py-3 font-bold tracking-widest text-white transition-all hover:bg-indigo-500 hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] active:scale-95"
					>
						CONFIRM
					</button>

					<button
						on:click={() => {
							playPopUp();
							showSaveModal = false;
						}}
						class="flex-1 cursor-pointer rounded-xl border border-slate-700 bg-slate-800/50 py-3 font-medium tracking-widest text-slate-400 transition-all hover:bg-slate-800 hover:text-slate-200"
					>
						CANCEL
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
