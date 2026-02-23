<script lang="ts">
	import { onMount } from 'svelte';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';


	let { children } = $props();
	onMount(() => {
   		
  	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
