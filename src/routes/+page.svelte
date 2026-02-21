<script>
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
</script>

<h1>Welcome, {$page.data?.name ?? 'Guest'}!</h1>
<p>Welcome to the Quiz Game!</p>

<div>
	<a href={resolve('/leaderboard')}>View Leaderboard</a>

	<a href={resolve('/game')}>Play</a>
</div>

<style>
	a {
		color: red;
		background-color: blue;
		margin: 20px;
		padding: 5px;
	}

	a:hover {
		color: aqua;
	}
</style>
