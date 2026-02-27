// svelte.config.js
import adapter from '@sveltejs/adapter-netlify';
import preprocess from 'svelte-preprocess';

export default {
	preprocess: preprocess(),
	kit: {
		adapter: adapter({
			// Netlify adapter default options are usually fine
			// See adapter-netlify docs for advanced config
		})
	}
};
