<script lang="ts">
	import { onMount } from 'svelte';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
	onMount(() => {});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preload" href="/audio/shimmer.ogg" as="audio" type="audio/ogg" />
	<link rel="preload" href="/audio/correct-answer.ogg" as="audio" type="audio/ogg" />
	<link rel="preload" href="/audio/wrong-answer.ogg" as="audio" type="audio/ogg" />
	<link rel="preload" href="/audio/go-back-sound.ogg" as="audio" type="audio/ogg" />
	<link rel="preload" href="/audio/confirm-cancel-button.ogg" as="audio" type="audio/ogg" />
	<link rel="preload" href="/audio/button-click.ogg" as="audio" type="audio/ogg" />
	<link rel="preload" href="/audio/time-is-up.ogg" as="audio" type="audio/ogg" />
	<link rel="preload" href="/audio/AFTERGLOW.ogg" as="audio" type="audio/ogg" />
	<link rel="preload" href="/img/home-footer.avif" as="image" type="image/avif" />
</svelte:head>
{@render children()}
