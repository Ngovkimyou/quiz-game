<!-- This is the Login page -->
<script lang="ts">
	import { enhance } from '$app/forms';
	export let form; // Access validation errors from the action
</script>

<!-- This is the login form -->
<form method="POST" use:enhance>
	<p>Hello there</p>
	<input name="name" type="text" placeholder="Enter your name" />
	<button type="submit">Register / Login</button>

	{#if form?.missing}
		<p>Name is required!</p>
	{/if}
</form>

<style>
	/* Can you design the input or the form here Muyheng*/
	input {
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		margin-right: 0.5rem;
	}
	button {
		padding: 0.5rem 1rem;
		background-color: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}
</style>
