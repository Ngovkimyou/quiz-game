<script lang="ts">
	import { onMount } from 'svelte'
	import './layout.css'
	import favicon from '$lib/assets/favicon.svg'
	import { AUDIO_PATHS } from '$lib/client/audio/audioManager'

	let { children } = $props()
	onMount(() => {})
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preload" href={AUDIO_PATHS.SHIMMER} as="audio" type="audio/ogg" />
	<link rel="preload" href={AUDIO_PATHS.CORRECT_ANSWER} as="audio" type="audio/ogg" />
	<link rel="preload" href={AUDIO_PATHS.WRONG_ANSWER} as="audio" type="audio/ogg" />
	<link rel="preload" href={AUDIO_PATHS.GO_BACK_SOUND} as="audio" type="audio/ogg" />
	<link rel="preload" href={AUDIO_PATHS.CONFIRM_CANCEL_BUTTON} as="audio" type="audio/ogg" />
	<link rel="preload" href={AUDIO_PATHS.BUTTON_CLICK} as="audio" type="audio/ogg" />
	<link rel="preload" href={AUDIO_PATHS.TIME_IS_UP} as="audio" type="audio/ogg" />
	<link rel="preload" href={AUDIO_PATHS.AFTERGLOW} as="audio" type="audio/ogg" />
	<link rel="preload" href="/img/home-footer.avif" as="image" type="image/avif" />
</svelte:head>
{@render children()}
