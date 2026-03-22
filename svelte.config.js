// svelte.config.js
import adapter from '@sveltejs/adapter-netlify'

export default {
	kit: {
		adapter: adapter({
			// Netlify adapter default options are usually fine
			// See adapter-netlify docs for advanced config
		}),
	},
}
