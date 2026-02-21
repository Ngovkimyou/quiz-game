<script lang="ts">
	import { UpdateScore } from '$lib/components/updateScore';

	import { onMount } from 'svelte';

	const { data } = $props();
	console.log('@leaderboard(+page.svelte): ', data.columns);
	console.log('@leaderboard(+page.svelte): ', data.rows);
	function doUpdate(id: string, score: number) {
		UpdateScore(id, score);
	}
	onMount(() => {
		//
	});
</script>

<h1>Leaderboard</h1>
<div class="leaderboard_box">
	<p>Here is the leaderboard of the quiz game. The top players are listed below:</p>
	<ul class="leaderboard_list">
		{#each data.rows as row (row.id)}
			<li class = "leaderboard_list li">{row.name}: {row.score} points, time: {row.registered_date}</li>
		{/each}
	</ul>
	<!-- This here is used for testing, it doesn't belong here -->
	<button onclick={() => doUpdate('6', 24000)}> Update </button>
</div>

<style>
	.leaderboard_box {
		border: 1px solid #ccc;
		padding: 1rem;
		border-radius: 4px;
		max-width: 500px;
		margin: 0 auto;
	}
	.leaderboard_list {
		list-style-type: decimal;
		padding-left: 1.5rem;
		max-height:120px;
		overflow: auto;
	}
	/* I think you need to design this here 
	a little bit to make it more beautiful */
	.leaderboard_list li {
        background-color: green;
    }
</style>
