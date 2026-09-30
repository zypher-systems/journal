import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// Form posts are CSRF-checked against ORIGIN, which must match the browser address.
		adapter: adapter()
	}
};

export default config;
