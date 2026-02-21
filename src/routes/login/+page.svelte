<!-- This is the Login page -->
<script lang="ts">
	import { enhance } from '$app/forms';
	export let form; // Access validation errors from the action
</script>

<!-- This is the login form -->
<form method="POST" use:enhance>
	<p>Hello there</p>
	<input name="name" type="text" placeholder="Enter your name" />
	{#if form?.missing}
    <p class="input_note" style = "color: red;">Name is required!</p>
	{:else if form?.tooLong}
		<p class="input_note" style = "color: red">Name must be lower than 21 characters!</p>
	{:else}
		<p class = "input_note" style = "color:blueviolet">Please fill out the form to continue.</p>
	{/if}
	<button type="submit">Register / Login</button>
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
	.input_note {
		font-size: 10px;
		opacity: 50%;
		margin: 2px 0px;
	}
</style>
