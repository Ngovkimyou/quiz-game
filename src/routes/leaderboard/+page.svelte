<script lang="ts">
	import { goto } from '$app/navigation';

	const { data } = $props();
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
					onclick={() => goto('/')}
					class="cursor-pointer text-lg text-white transition hover:text-indigo-400"
				>
					← Back
				</button>

				<h1 class="text-center text-2xl font-bold md:text-3xl">🏆 Leaderboard</h1>

				<!-- PUSH THE TITLE TO MID -->
				<div class="w-16"></div>
			</div>
		</div>

		{#if data.rows.length === 0}
			<div class="mt-20 text-center text-slate-400">No scores yet. Go play the game!</div>
		{:else}
			<!-- Top 3 -->
			<div class="mx-auto mb-16 grid max-w-5xl gap-6 md:grid-cols-3">
				{#each data.rows.slice(0, 3) as row, index (row.id)}
					<div
						class="group relative cursor-pointer rounded-3xl p-8 text-center
	backdrop-blur-xl transition-all duration-500 hover:-translate-y-2
	hover:scale-105 hover:shadow-2xl
	{index === 0
							? 'border border-yellow-400 bg-yellow-500/20 hover:shadow-yellow-400/40'
							: index === 1
								? 'border border-gray-400 bg-gray-300/10 hover:shadow-gray-400/40'
								: 'border border-orange-500 bg-orange-600/20 hover:shadow-orange-500/40'}"
					>
						<div
							class="absolute inset-0 rounded-3xl opacity-0 blur-xl transition duration-500 group-hover:opacity-100
	{index === 0 ? 'bg-yellow-400/20' : index === 1 ? 'bg-gray-400/20' : 'bg-orange-500/20'}"
						></div>
						<div class="mb-2 text-2xl font-bold">
							#{index + 1}
						</div>

						<div class="text-xl font-semibold">
							{row.name}
						</div>

						<div class="mt-4 text-3xl font-bold">
							{row.score}
						</div>

						<div class="mt-2 text-sm text-slate-400">
							{row.registered_date}
						</div>
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
							<div class="text-lg font-bold text-indigo-400">
								#{index + 4}
							</div>

							<div>
								<div class="font-semibold">{row.name}</div>
								<div class="text-xs text-slate-400">{row.registered_date}</div>
							</div>
						</div>

						<div class="text-lg font-bold">
							{row.score}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
