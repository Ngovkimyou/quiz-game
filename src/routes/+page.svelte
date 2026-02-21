<script>
	import { page } from '$app/stores';
</script>

<!-- Currently, there's 3 things that you can pull from $page => name, score, registered_time. -->
<h1>Welcome, {$page.data.name}!</h1>
<p>Welcome to the Quiz Game!</p>

<div>
	<a href="/leaderboard">View Leaderboard</a>

	<a href="/game">Play</a>
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
